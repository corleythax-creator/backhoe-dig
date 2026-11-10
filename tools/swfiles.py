#!/usr/bin/env python3
"""Write data/files.json: every game file the phone keeps (sw.js) with a short fingerprint of its contents.

The service worker serves a listed file from the device while its fingerprint is unchanged and downloads it again
when it changes, so after a release only the changed files come over the network. tools/release.py runs this on
every release; run it by hand (python3 tools/swfiles.py) after changing game files outside a release.
index.html and data/effort.js are left out: they always come from the network (the version check reads them).
"""
import hashlib, json, os, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = ['js', 'css', 'models', 'sounds', 'textures', 'data', 'shots']
SKIP = {'data/effort.js', 'data/files.json'}


def main():
    names = subprocess.run(['git', 'ls-files', '-z', '--', *DIRS], cwd=ROOT, capture_output=True, check=True).stdout
    f = {}
    for n in sorted(x.decode() for x in names.split(b'\0') if x):
        p = os.path.join(ROOT, n)
        if n in SKIP or not os.path.isfile(p):
            continue
        f[n] = hashlib.sha1(open(p, 'rb').read()).hexdigest()[:10]
    out = os.path.join(ROOT, 'data', 'files.json')
    s = json.dumps({'f': f}, separators=(',', ':'), sort_keys=True) + '\n'
    if not os.path.exists(out) or open(out, encoding='utf-8').read() != s:
        open(out, 'w', encoding='utf-8').write(s)
    print(f'data/files.json: {len(f)} files')


if __name__ == '__main__':
    main()
