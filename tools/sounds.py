"""Makes the game's sound files in sounds/ from CC0 field recordings on Freesound.

Usage: python3 tools/sounds.py CACHE_DIR   (needs ffmpeg, numpy, scipy)
Every clip below is a Creative Commons 0 recording on freesound.org. The tool downloads each one's preview (into
CACHE_DIR, kept between runs), cuts the part named here, and writes sounds/<name>.mp3 (mono, 44.1 kHz):
  loop:   a seamless loop. The tail is cross-faded into the head, and the file holds the loop with PAD seconds of the
          loop's own wrap on each side, so whatever priming delay an MP3 decoder adds, [PAD, PAD+len] still loops.
  shot:   one sound, faded in and out.
  sprite: several hits found by onset detection, laid end to end; sound.js plays one at random.
Loudness: loops to LOOP_RMS, shots and sprite hits to their peak. Then it writes the table of files, loop lengths and
sprite offsets between the SND_FILES markers in js/sound.js, and sounds/CREDITS.md.
"""
import json, os, re, subprocess, sys, urllib.request
import numpy as np
from scipy.signal import butter, sosfiltfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT, SR, PAD, LOOP_RMS = os.path.join(ROOT, 'sounds'), 44100, 0.25, 0.12
KBPS = {'loop': 96, 'shot': 96, 'sprite': 96}

# name: (freesound id, kind, start s, length s, options)  options: hp/lp Hz, kbps, n hits, gap (min s between hits), what
CLIPS = {
    # engines: idle and working loops for each machine; sound.js cross-fades and re-pitches them with the revs
    'x_idle':  (187564, 'loop', 24.0, 4.0, {'hp': 30, 'what': 'excavator idle (construction vehicle idle)'}),
    'x_work':  (165199, 'loop', 21.0, 5.0, {'hp': 30, 'what': 'excavator working (bulldozer diesel)'}),
    't_idle':  (128160, 'loop', 28.0, 4.0, {'hp': 30, 'what': 'dump truck idle (diesel truck idling)'}),
    't_work':  (637914, 'loop', 6.0, 4.0, {'hp': 30, 'what': 'dump truck pulling (big diesel up a hill)'}),
    'h_idle':  (418436, 'loop', 73.0, 4.0, {'hp': 30, 'what': "Dexter's heavy machines idle (chugging diesel)"}),
    's_run':   (174237, 'loop', 136.4, 4.0, {'hp': 40, 'what': 'skid steer (Bobcat loader)'}),
    'm_idle':  (431478, 'loop', 4.5, 3.0, {'hp': 40, 'what': 'mower idle'}),
    'm_run':   (677172, 'loop', 4.0, 4.0, {'hp': 40, 'what': 'zero-turn mower mowing'}),
    'b_idle':  (175964, 'loop', 26.0, 3.0, {'hp': 40, 'what': 'dirt bike ticking over'}),
    'b_run':   (175964, 'loop', 8.0, 3.0, {'hp': 40, 'what': 'dirt bike revving after the start'}),
    'o_idle':  (454201, 'loop', 9.0, 4.0, {'hp': 30, 'what': 'outboard idling, bubbling'}),
    'o_run':   (637744, 'loop', 118.9, 4.0, {'hp': 30, 'what': 'outboard flat out, onboard'}),
    'f_run':   (564422, 'loop', 39.0, 5.0, {'hp': 30, 'what': 'fishing boat outboard'}),
    'g_run':   (264864, 'loop', 66.0, 5.0, {'hp': 25, 'what': 'tug (marine diesel)'}),
    # machine effects
    'tracks':  (88422, 'loop', 8.0, 5.0, {'hp': 120, 'what': 'tracks clattering (tracked earthmover)'}),
    'hyd':     (212941, 'loop', 4.75, 1.4, {'hp': 150, 'what': 'hydraulic pump whine (forklift)'}),
    'pour':    (271130, 'loop', 13.5, 5.0, {'hp': 60, 'what': 'gravel pouring'}),
    'scrape':  (95007, 'loop', 18.5, 1.5, {'hp': 120, 'what': 'stone grinding over hard ground'}),
    'tire':    (218301, 'loop', 4.0, 4.0, {'hp': 60, 'what': 'tyres on a dirt road'}),
    'wash':    (690162, 'loop', 6.0, 5.0, {'kbps': 64, 'hp': 60, 'what': 'bow wash of a river boat'}),
    'splash':  (249929, 'loop', 13.5, 6.0, {'kbps': 64, 'hp': 80, 'what': 'splashing through puddles'}),
    'trickle': (433589, 'loop', 2.0, 6.0, {'kbps': 64, 'hp': 200, 'what': 'stream up close (seeping groundwater)'}),
    'alarm':   (459993, 'shot', 0, 0, {'beep': True, 'what': 'reverse alarm, one beep'}),
    'brake':   (504865, 'shot', 0.0, 2.6, {'hp': 200, 'what': 'air brakes letting go'}),
    'horn':    (261847, 'shot', 0.0, 3.4, {'hp': 60, 'what': 'ferry horn'}),
    'gate':    (811949, 'shot', 0.6, 0.75, {'hp': 40, 'what': 'tailgate slamming'}),
    'rocks':   (567249, 'shot', 0.0, 4.2, {'hp': 40, 'what': 'rocks and gravel falling (dump into a bed)'}),
    'cavein':  (336023, 'shot', 0.0, 6.7, {'hp': 30, 'what': 'rocks crumbling (a wall caving in)'}),
    'thud':    (353907, 'sprite', 0, 9.1, {'n': 5, 'gap': 1.0, 'len': 0.7, 'hp': 40, 'what': 'shovel of dirt landing'}),
    'dig':     (384362, 'sprite', 0, 27.3, {'n': 8, 'gap': 1.0, 'len': 0.6, 'hp': 60, 'what': 'shovel biting into soil'}),
    'slap':    (637206, 'sprite', 0, 41.9, {'n': 6, 'gap': 1.0, 'len': 0.6, 'hp': 60, 'what': 'water knocking a hull'}),
    'step_g':  (352870, 'sprite', 0, 35.0, {'n': 10, 'gap': 0.35, 'len': 0.32, 'hp': 80, 'what': 'footsteps on dirt and gravel'}),
    'step_s':  (206030, 'sprite', 0, 35.0, {'n': 10, 'gap': 0.35, 'len': 0.32, 'hp': 80, 'what': 'footsteps in grass'}),
    'gull':    (166703, 'sprite', 0, 7.3, {'n': 3, 'gap': 1.2, 'len': 1.1, 'hp': 300, 'what': 'gulls'}),
    'thun_n':  (434359, 'shot', 1.9, 14.0, {'kbps': 64, 'hp': 20, 'what': 'close lightning strike and roll'}),
    'thun_f':  (194364, 'shot', 13.2, 12.0, {'kbps': 64, 'hp': 20, 'lp': 3000, 'what': 'thunder clap, farther'}),
    'thun_r':  (244053, 'shot', 1.0, 12.0, {'kbps': 64, 'hp': 20, 'what': 'distant thunder roll'}),
    # ambience beds
    'rain':    (607070, 'loop', 8.0, 10.0, {'kbps': 64, 'hp': 100, 'what': 'light rain'}),
    'rain_h':  (188655, 'loop', 15.0, 8.0, {'kbps': 64, 'hp': 60, 'what': 'medium rain'}),
    'wind':    (403051, 'loop', 23.5, 10.0, {'kbps': 64, 'hp': 40, 'what': 'wind in the forest'}),
    'birds':   (474835, 'loop', 20.0, 15.0, {'kbps': 64, 'hp': 300, 'what': 'forest birds in the morning'}),
    'crickets': (175020, 'loop', 13.5, 10.0, {'kbps': 64, 'hp': 1500, 'what': 'crickets in a field at night'}),
    'frogs':   (32655, 'loop', 50.0, 15.0, {'kbps': 64, 'hp': 100, 'what': 'frogs and crickets by a pond'}),
    'lap':     (326097, 'loop', 40.0, 12.0, {'kbps': 64, 'hp': 60, 'what': 'lake waves lapping a rocky shore'}),
}


def fetch(cache, fid):
    """the preview mp3 and the credit line (title, author) of a Freesound sound, from the cache or the site"""
    meta_p, mp3_p = os.path.join(cache, f'{fid}.json'), os.path.join(cache, f'{fid}.mp3')
    if not os.path.exists(meta_p):
        page = urllib.request.urlopen(f'https://freesound.org/s/{fid}/', timeout=60).read().decode('utf8', 'replace')
        url = re.search(r'https://cdn\.freesound\.org/previews/\d+/[\d_]+-hq\.mp3', page)[0]
        lic = re.search(r'creativecommons\.org/[a-z/.0-9]+', page)[0]
        title = re.search(r'<title>Freesound - (.*?) by ([^<]*)</title>', page)
        json.dump({'url': url, 'license': lic, 'title': title[1], 'author': title[2], 'page': f'https://freesound.org/s/{fid}/'},
                  open(meta_p, 'w'))
    meta = json.load(open(meta_p))
    assert 'publicdomain/zero' in meta['license'], f'{fid} is not CC0: {meta["license"]}'
    if not os.path.exists(mp3_p):
        data = urllib.request.urlopen(meta['url'], timeout=300).read()
        open(mp3_p, 'wb').write(data)
    return mp3_p, meta


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def encode(x, path, kbps):
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-v', 'quiet', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', path], input=x.tobytes(), check=True)


def band(x, o):
    if o.get('hp'):
        x = sosfiltfilt(butter(2, o['hp'], 'hp', fs=SR, output='sos'), x)
    if o.get('lp'):
        x = sosfiltfilt(butter(2, o['lp'], 'lp', fs=SR, output='sos'), x)
    return x


def fades(x, a=0.005, b=0.03):
    na, nb = int(a * SR), int(b * SR)
    x = x.copy()
    x[:na] *= np.linspace(0, 1, na)
    x[-nb:] *= np.linspace(1, 0, nb)
    return x


def make_loop(x, start, length):
    """length seconds that loop: the X seconds after the window are faded out over its first X seconds"""
    n, xf = int(length * SR), int(min(0.4, length * 0.25) * SR)
    s = int(start * SR)
    seg = x[s:s + n + xf]
    assert len(seg) == n + xf, f'window past the end ({len(x) / SR:.1f}s)'
    body = seg[:n].copy()
    t = np.linspace(0, np.pi / 2, xf)
    body[:xf] = seg[:xf] * np.sin(t) + seg[n:n + xf] * np.cos(t)
    body *= LOOP_RMS / np.sqrt(np.mean(body ** 2))
    pk = np.abs(body).max()
    if pk > 0.95:
        body *= 0.95 / pk
    p = int(PAD * SR)
    return np.concatenate([body[-p:], body, body[:p]]), n / SR


def onsets(x, gap, n, length):
    """the n loudest hits at least gap seconds apart, each length seconds from just before its rise"""
    h = int(0.01 * SR)
    env = np.sqrt(np.convolve(x * x, np.ones(h) / h, 'same'))
    rise = np.maximum(0, np.diff(env[::h], prepend=0))
    order, picks = np.argsort(-rise), []
    for k in order:
        t = k * h
        if all(abs(t - q) > gap * SR for q in picks) and t + length * SR < len(x) and t > 0.04 * SR:
            picks.append(t)
        if len(picks) == n:
            break
    return sorted(picks)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    cache = sys.argv[1]
    os.makedirs(cache, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    table, credits = {}, {}
    for name, (fid, kind, start, length, o) in CLIPS.items():
        src, meta = fetch(cache, fid)
        x = band(decode(src), o)
        if kind == 'loop':
            y, L = make_loop(x, start, length)
            table[name] = {'loop': round(L, 5), 'pad': PAD}
        elif o.get('beep'):
            # the alarm: the strongest beep's rise to just before the next one, so it can be played once per period
            bp = sosfiltfilt(butter(4, [1700, 2200], 'bp', fs=SR, output='sos'), x)
            h = int(0.01 * SR)
            env = np.sqrt(np.convolve(bp * bp, np.ones(h) / h, 'same'))[::h]
            p = np.flatnonzero(np.diff((env > env.max() * 0.3).astype(int)) == 1) * h
            per = float(np.median(np.diff(p))) / SR
            y = fades(x[p[4] - h:p[4] + int(per * 0.85 * SR)])
            y *= 0.9 / np.abs(y).max()
            table[name] = {'period': round(per, 4)}
        elif kind == 'shot':
            y = fades(x[int(start * SR):int((start + length) * SR)], 0.003, min(0.3, length * 0.2))
            y *= 0.9 / np.abs(y).max()
            table[name] = {}
        else:
            hits, parts, offs, at = onsets(x, o['gap'], o['n'], o['len']), [], [], 0.0
            for t in hits:
                # 30 ms before the rise, so a decoder that keeps the MP3's priming delay (about 26 ms) still finds it
                h = fades(x[t - int(0.03 * SR):t + int(o['len'] * SR)], 0.002, o['len'] * 0.4)
                h *= 0.9 / np.abs(h).max()
                parts += [h, np.zeros(int(0.08 * SR))]
                offs.append([round(at, 4), round(len(h) / SR, 4)])
                at += (len(h) + int(0.08 * SR)) / SR
            y = np.concatenate(parts)
            table[name] = {'hits': offs}
        out = os.path.join(OUT, f'{name}.mp3')
        encode(y, out, o.get('kbps', KBPS[kind]))
        credits.setdefault(fid, (meta, []))[1].append(name)
        print(f'{name:9s} {kind:6s} {len(y) / SR:5.1f}s {os.path.getsize(out) // 1024:4d} KB  {o["what"]}')
    # the table in sound.js
    js = os.path.join(ROOT, 'js', 'sound.js')
    src = open(js).read()
    body = 'const SND_FILES=' + json.dumps(table, separators=(',', ':')) + ';'
    src = re.sub(r'(// SND_FILES start[^\n]*\n).*?(\n// SND_FILES end)', lambda m: m[1] + body + m[2], src, flags=re.S)
    open(js, 'w').write(src)
    with open(os.path.join(OUT, 'CREDITS.md'), 'w') as f:
        f.write('# Sound credits\n\nEvery sound in the game is cut from these field recordings on Freesound, all released under '
                'Creative Commons 0 (public domain). Thank you to the recordists. `tools/sounds.py` makes the files.\n\n'
                '| File | Recording | By |\n|---|---|---|\n')
        for fid, (meta, names) in credits.items():
            f.write(f'| {", ".join(names)} | [{meta["title"]}]({meta["page"]}) | {meta["author"]} |\n')
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.mp3'))
    print(f'{len(table)} files, {total // 1024} KB')


if __name__ == '__main__':
    main()
