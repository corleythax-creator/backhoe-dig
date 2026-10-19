"""Ships the current branch as the next version, doing the README's "Ship a version" steps in one command.

Usage (from the repo root, on your feature branch with everything committed):
  python3 tools/release.py --asked 2026-10-18T09:15 --dh 6 --title "Polished steel" --what "What the player gets, in plain words."
Options: --asked is when the owner asked (Central, YYYY-MM-DDTHH:MM); --dh developer hours (a judgment, CLAUDE.md);
  --title names the merge commit; --what is the build-log line; --trailer the commit attribution lines the session was
  given (one string, lines joined with \n); --dry-run merges main, runs the checks and stops before changing anything else.

Steps: fetch main and merge it into the branch; take the next version after main's last one (another session releasing at
the same time just pushes this one to the number after); run tools/scene-check.js
(stops on any error); add the entry and the day's hours to data/effort.js (live time is now, Central; the day's act
gains 0.5 when no release that day sits in the same half hour); commit and push the branch; merge it into main with
--no-ff (a first-parent release commit, as tools/versions.py needs) and push; make the snapshot with tools/versions.py
(unshallowing first, and stopping if it would delete anything outside the new snapshot), commit and push; bring the
branch up to main. If the screen's markup, CSS or js/gui.js changed, it rebuilds docs/gui-editor.html and says to
republish the screen editor artifact (a script can't publish it). The claude.ai game artifact stays on hold (CLAUDE.md).
"""
import argparse, datetime, json, os, re, subprocess, sys
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CT = ZoneInfo('America/Chicago')


def sh(*a, check=True, capture=True, env=None):
    r = subprocess.run(a, cwd=ROOT, text=True, capture_output=capture, env=env)
    if check and r.returncode:
        sys.exit(f"failed: {' '.join(a)}\n{(r.stdout or '')[-2000:]}{(r.stderr or '')[-2000:]}")
    return (r.stdout or '').strip()


def git(*a, **k):
    return sh('git', *a, **k)


def push(*a):
    for wait in (0, 2, 4, 8, 16):
        if wait:
            subprocess.run(['sleep', str(wait)])
        if subprocess.run(['git', 'push', *a], cwd=ROOT).returncode == 0:
            return
    sys.exit('git push failed: ' + ' '.join(a))


def push_main(base):
    """push main; False when it was refused because main moved past base (another release), so the caller redoes its
    commit on top; network trouble is retried"""
    for wait in (0, 2, 4, 8, 16):
        if wait:
            subprocess.run(['sleep', str(wait)])
        if subprocess.run(['git', 'push', '-q', 'origin', 'main'], cwd=ROOT).returncode == 0:
            return True
        if subprocess.run(['git', 'fetch', '-q', 'origin', 'main'], cwd=ROOT).returncode == 0 and git('rev-parse', 'origin/main') != base:
            return False
    sys.exit('git push to main failed')


def effort(text):
    """the EFFORT object from data/effort.js text"""
    return json.loads(text[text.index('{'):text.rindex('}') + 1])


def add_entry(s, v, asked, now, dh, tris, chars, what):
    """data/effort.js text with version v added and its day's totals: dh added, act up 0.5 when no release that day is
    in the same half hour, one more version; a new day when it is the first release of the day"""
    E = effort(s)
    day = now.date().isoformat()
    block = lambda t: (t.date().isoformat(), t.hour, t.minute // 30)
    new_block = not any(block(datetime.datetime.fromisoformat(x['live']).astimezone(CT)) == block(now) for x in E['versions'])
    num = lambda x: int(x) if float(x).is_integer() else x
    entry = {'v': v, 'asked': asked.isoformat(), 'live': now.isoformat(), 'dh': num(dh), 'tris': tris, 'chars': chars, 'what': what}
    item = ',\n' + '\n'.join('  ' + l for l in json.dumps(entry, indent=1, ensure_ascii=False).split('\n'))
    i = s.rindex('\n ]')
    s = s[:i].rstrip() + item + s[i:]
    m = re.search(r'\{\s*"d": "%s",\s*"dh": ([\d.]+),\s*"act": ([\d.]+),\s*"versions": (\d+)\s*\}' % day, s)
    if m:
        d2, act, n = float(m.group(1)) + dh, float(m.group(2)) + (0.5 if new_block else 0), int(m.group(3)) + 1
        s = s[:m.start()] + f'{{\n   "d": "{day}",\n   "dh": {num(d2)},\n   "act": {num(act)},\n   "versions": {n}\n  }}' + s[m.end():]
    else:
        j = s.index('\n ],', s.index('"days"'))
        s = s[:j] + f',\n  {{\n   "d": "{day}",\n   "dh": {num(dh)},\n   "act": 0.5,\n   "versions": 1\n  }}' + s[j:]
    s = re.sub(r'"updated": "[^"]*"', '"updated": "%s"' % now.astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z'), s, count=1)
    effort(s)  # still valid JSON
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--asked', required=True)
    ap.add_argument('--dh', required=True, type=float)
    ap.add_argument('--title', required=True)
    ap.add_argument('--what', required=True)
    ap.add_argument('--trailer', default='Co-Authored-By: Claude <noreply@anthropic.com>')
    ap.add_argument('--dry-run', action='store_true')
    o = ap.parse_args()
    global TRAILER
    TRAILER = '\n\n' + o.trailer.replace('\\n', '\n')
    asked = datetime.datetime.fromisoformat(o.asked).replace(tzinfo=CT)
    branch = git('rev-parse', '--abbrev-ref', 'HEAD')
    if branch == 'main':
        sys.exit('Run it from your feature branch, not main.')
    if git('status', '--porcelain'):
        sys.exit('Commit your work first: the tree has changes.')

    git('fetch', '-q', 'origin', 'main')
    git('merge', '-q', '--no-edit', 'origin/main')
    prev = effort(git('show', 'origin/main:data/effort.js'))
    v = prev['versions'][-1]['v'] + 1
    gui_changed = bool(git('diff', '--name-only', 'origin/main', 'HEAD', '--', 'index.html', 'css/game.css', 'js/gui.js'))
    print(f'Releasing {branch} as v{v} (or the next free number)')
    if gui_changed:
        sh('python3', 'tools/gui_editor.py')
        if git('status', '--porcelain') and not o.dry_run:
            git('commit', '-qam', 'Rebuild the screen editor page' + TRAILER)

    env = dict(os.environ, NODE_PATH=sh('npm', 'root', '-g'))
    out = sh('node', 'tools/scene-check.js', check=False, env=env)
    chk = json.loads(out[out.index('{'):])
    if chk['errors']:
        sys.exit('scene-check found errors:\n' + '\n'.join(chk['errors']))
    print(f"scene-check: {chk['tris']} tris, {chk['chars']} chars, no errors")
    if o.dry_run:
        print('dry run: stopping here')
        return

    # the build-log entry and the release commit on main. Another session can release in the meantime: when main has
    # moved, its push is refused, so this version's entry is taken back out and it goes again with the next number
    for attempt in range(4):
        git('fetch', '-q', 'origin', 'main')
        git('merge', '-q', '--no-edit', 'origin/main')
        base = git('rev-parse', 'origin/main')
        v = effort(git('show', 'origin/main:data/effort.js'))['versions'][-1]['v'] + 1
        now = datetime.datetime.now(CT).replace(microsecond=0)
        path = os.path.join(ROOT, 'data', 'effort.js')
        s = add_entry(open(path, encoding='utf-8').read(), v, asked, now, o.dh, chk['tris'], chk['chars'], o.what)
        open(path, 'w', encoding='utf-8').write(s)
        git('commit', '-qam', f'v{v}: effort entry for {o.title}' + TRAILER)
        git('checkout', '-q', '-B', 'main', base)
        git('merge', '--no-ff', '-q', branch, '-m', f'v{v}: {o.title} (merge {branch})' + TRAILER)
        if push_main(base):
            break
        print(f'main moved while releasing v{v} (another session released); trying again with the next number')
        git('checkout', '-q', branch)
        git('reset', '-q', '--hard', 'HEAD~1')
    else:
        sys.exit('main kept moving; nothing was released. Try again in a few minutes.')
    push('-q', '-u', 'origin', branch)

    # the playable snapshot, made again on top of main if another release lands first
    if git('rev-parse', '--is-shallow-repository') == 'true':
        git('fetch', '-q', '--unshallow', 'origin')
    for attempt in range(4):
        base = git('rev-parse', 'HEAD')
        sh('python3', 'tools/versions.py')
        if not git('status', '--porcelain'):
            break  # another release's snapshot commit already holds this one
        # each line is 'XY path'; git() strips the output, which eats the first line's leading space, so split instead
        rows = [l.split(None, 1) for l in git('status', '--porcelain').splitlines()]
        # a changed file in an older snapshot (versions.py rebuilt it a little differently) is put back: snapshots stay as committed
        stale = [r[1] for r in rows if r[0] == 'M' and r[1].startswith('versions/v')]
        if stale:
            git('checkout', '--', *stale)
        bad = [' '.join(r) for r in rows if r[1] not in stale and ('D' in r[0] or not (r[1].startswith('versions/v') or r[1] == 'versions/list.js'))]
        if bad:
            sys.exit('versions.py changed more than the snapshots; nothing committed:\n' + '\n'.join(bad[:20]))
        git('add', 'versions')
        git('commit', '-qm', f'Versions: add the v{v} snapshot' + TRAILER)
        if push_main(base):
            break
        git('reset', '-q', '--hard', 'origin/main')
    else:
        sys.exit(f'v{v} is released but its snapshot could not be pushed (main kept moving): run python3 tools/versions.py on main and push.')
    git('checkout', '-q', branch)
    git('merge', '-q', '--ff-only', 'main')
    push('-q', 'origin', branch)

    print(f'v{v} released: live {now:%b %d %I:%M %p} Central, {chk["tris"]} tris, {chk["chars"]} chars.')
    if gui_changed:
        print('The screen changed: republish docs/gui-editor.html to the screen editor artifact (CLAUDE.md).')


if __name__ == '__main__':
    main()
