#!/usr/bin/env python3
"""Build docs/image-prompts.html (the copy-button page) from docs/IMAGE_PROMPTS.md.
Publish the result as an artifact; rerun after editing the markdown."""
import re, json, html

src = open('docs/IMAGE_PROMPTS.md', encoding='utf-8').read()
lines = src.split('\n')

def quote_after(heading_start):
    for i, l in enumerate(lines):
        if l.startswith(heading_start):
            out = []
            for m in lines[i + 1:]:
                if m.startswith('>'):
                    out.append(m[1:].strip())
                elif out:
                    break
            return ' '.join(out)
    raise SystemExit('missing ' + heading_start)

style = quote_after('## Master style block')
texture = quote_after('## Master texture block')
pbr = quote_after('## Master PBR block')

sections, cur, entry = [], None, None
for l in lines:
    m = re.match(r'^## ([A-Z]): (.+)$', l)
    if m:
        cur = {'key': m.group(1), 'title': re.sub(r' \(.*\)$','',m.group(2)), 'add': '', 'items': []}
        sections.append(cur); entry = None; continue
    if l.startswith('## '):
        cur = None; continue
    if cur is None:
        continue
    m = re.match(r'^\*\*([A-Z]\d\d) (.+?)\*\* -> (.+?)\. Needs: (.+)$', l) or re.match(r'^\*\*([A-Z]\d\d) (.+?)\*\* -> (.+)$', l)
    if m:
        g = m.groups()
        entry = {'id': g[0], 'title': g[1], 'file': g[2].replace('`', ''), 'needs': g[3] if len(g) > 3 else '', 'text': ''}
        cur['items'].append(entry); continue
    if l.startswith('Add:'):
        cur['add'] = l[4:].strip().strip('"')
        continue
    if l.startswith('>') and entry is not None:
        entry['text'] = (entry['text'] + ' ' + l[1:].strip()).strip()
    elif l.strip() and not l.startswith('Do these') and entry is None:
        pass

sections = [s for s in sections if s['items']]
for s in sections:
    for it in s['items']:
        it['png'] = '.png' in it['file'] or 'PNG' in it['file'] or it['file'].count('.png') > 0
        it['tex'] = s['key'] in 'GP' and not it['png'] and it['id'] not in ('G13', 'G14', 'P12')
        it['pbr'] = s['key'] in 'GP' and it['tex'] and it['id'] not in ('P13',)
        it['sprite'] = s['key'] in 'FUS' or it['png']

data = {'style': style, 'texture': texture, 'pbr': pbr, 'sections': sections}
payload = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')

page = open('tools/prompts_page.tpl.html', encoding='utf-8').read().replace('/*DATA*/null', payload)
open('docs/image-prompts.html', 'w', encoding='utf-8').write(page)
print(sum(len(s['items']) for s in sections), 'prompts in', len(sections), 'sections')
