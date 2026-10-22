"""Writes CHANGELOG.md from the build log in data/effort.js: every version, newest first, grouped by the day it went live
(Central). tools/release.py runs it for each release; run it by hand after editing an entry: python3 tools/changelog.py
"""
import datetime, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def changelog(e):
    """the CHANGELOG.md text for the EFFORT object e"""
    out = ['# Changelog', '',
           "Every version of Corley's Island, newest first, grouped by the day it went live (Central time). "
           'Made from `data/effort.js` by `tools/changelog.py`; don\'t edit it by hand. '
           '[Play any old version](https://corleys-island.vercel.app/versions/) · '
           '[Build log with charts](https://corleys-island.vercel.app/build.html)']
    day = None
    for x in reversed(e['versions']):
        live = datetime.datetime.fromisoformat(x['live'])
        if live.date() != day:
            day = live.date()
            out += ['', f'## {day:%A, %B} {day.day}, {day.year}', '']
        what = x['what'].strip()
        out.append(f"- **v{x['v']}** ({live:%I:%M %p}".replace('(0', '(') + f') {what}')
    return '\n'.join(out) + '\n'


def main():
    s = open(os.path.join(ROOT, 'data', 'effort.js'), encoding='utf-8').read()
    e = json.loads(s[s.index('{'):s.rindex('}') + 1])
    open(os.path.join(ROOT, 'CHANGELOG.md'), 'w', encoding='utf-8').write(changelog(e))


if __name__ == '__main__':
    main()
