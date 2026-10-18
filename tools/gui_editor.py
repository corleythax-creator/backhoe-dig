"""Builds docs/gui-editor.html, the claude.ai screen editor (artifact), from the game's own screen: the markup of
index.html (everything before the scripts), css/game.css, js/gui.js and the tuning and words tables (js/tune.js,
js/words.js), so the editor always shows the screen as it is.

Usage: python3 tools/gui_editor.py     (then publish docs/gui-editor.html as the screen editor artifact)
Run it again whenever index.html, css/game.css, js/gui.js, js/tune.js or js/words.js change.

The game screen sits in a stage box the size of the chosen device, scaled to fit. game.css is written for the whole
window, so it is adapted to the box: its html/body rule styles the box, its width, height and orientation media
queries become container queries on the box, and viewport units become container units. The background is a still of
the game (docs/gui-editor-bg.jpg) and the minimap a still of its own (docs/gui-editor-mini.png); the start card's
pictures (shots/) are inlined.
"""
import base64, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
b64 = lambda p, t: f"data:{t};base64," + base64.b64encode(open(os.path.join(ROOT, p), 'rb').read()).decode()

# the screen's markup: from the 3D view to the first script
html = rd('index.html')
markup = html[html.index('<canvas id="view"'):html.index('<script')].rstrip()
markup = re.sub(r'src="(shots/\w+\.jpg)"', lambda m: f'src="{b64(m.group(1), "image/jpeg")}"', markup)

# game.css onto the stage box
css = rd('css/game.css')
css = css.replace('html,body{', '.stage{', 1)
css = re.sub(r'@media\s*(\([^{]*(?:width|height|orientation)[^{]*)\{', lambda m: '@container stage ' + m.group(1).strip() + '{', css)
css = re.sub(r'(\d*\.?\d+)d?v([hw])\b', lambda m: m.group(1) + 'cq' + m.group(2), css)

page = rd('docs/gui-editor-shell.html')
for k, v in {'GAME_CSS': css, 'GAME_MARKUP': markup, 'GUI_JS': rd('js/gui.js'), 'TUNE_JS': rd('js/tune.js'), 'WORDS_JS': rd('js/words.js'),
             'BG_JPG': b64('docs/gui-editor-bg.jpg', 'image/jpeg'), 'MINI_PNG': b64('docs/gui-editor-mini.png', 'image/png')}.items():
    assert '{{' + k + '}}' in page, k
    page = page.replace('{{' + k + '}}', v)
open(os.path.join(ROOT, 'docs', 'gui-editor.html'), 'w', encoding='utf-8').write(page)
print(f"docs/gui-editor.html: {len(page.encode()) // 1024} KB")
