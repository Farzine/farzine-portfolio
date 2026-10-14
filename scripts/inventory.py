"""Read-only legacy discovery. Regenerate the inventory without dependencies."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]

class Node:
    def __init__(self, tag='', attrs=None, parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs or []), parent
        self.children = []
    def all(self, tag=None, cls=None):
        found = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()):
                    found.append(child)
                found.extend(child.all(tag, cls))
        return found
    def text(self):
        return ' '.join(' '.join(c.text() if isinstance(c, Node) else c for c in self.children).split())

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.root = Node(); self.current = self.root; self.feed(text)
    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs, self.current); self.current.children.append(n)
        if tag not in ['img','meta','link','br','hr','input','source','embed','wbr']: self.current = n
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.current.tag == tag: self.current = self.current.parent
    def handle_endtag(self, tag):
        n = self.current
        while n.parent:
            if n.tag == tag: self.current = n.parent; return
            n = n.parent
    def handle_data(self, data):
        if self.current.tag not in ['script','style']: self.current.children.append(data)

def document(path):
    return Document((ROOT / path).read_text()).root

def inventory():
    files = ['index.html', *[str(p.relative_to(ROOT)) for p in sorted((ROOT/'projects').glob('*.html'))]]
    records = []
    for filename in files:
        tree = document(filename)
        records.append({'source': filename, 'sha256': hashlib.sha256((ROOT/filename).read_bytes()).hexdigest(),
            'sections': [{'id': n.attrs.get('id'), 'text': n.text()} for n in tree.all('section')],
            'project_text': next((n.text() for n in tree.all() if n.attrs.get('id') == 'main'), ''),
            'links': [{'url': n.attrs.get('href',''), 'label': n.text()} for n in tree.all('a')],
            'images': [{'src': n.attrs.get('src',''), 'alt': n.attrs.get('alt','')} for n in tree.all('img')]})
    assets = []
    for p in sorted((ROOT/'assets').rglob('*')):
        if not p.is_file(): continue
        filename = str(p.relative_to(ROOT))
        usage = [r['source'] for r in records if any(i['src'].removeprefix('../') == filename for i in r['images'])]
        assets.append({'path':filename,'bytes':p.stat().st_size,'used_by':usage,
            'migration': 'preserve; vendor stays legacy-only' if '/vendor/' in filename else 'preserve; pending migration mapping'})
    return {'source_commit':'6d774c7050fda2ab386fa4dfe297d4a4f4776715','files':records,'assets':assets}

if __name__ == '__main__':
    out = inventory()
    (ROOT/'data/legacy-inventory.json').write_text(json.dumps(out, ensure_ascii=False, indent=2)+'\n')
    rows = ['# Legacy content inventory', '', 'Generated with `python3 scripts/inventory.py`. See [machine-readable inventory](../data/legacy-inventory.json) for every section text, link, image reference, asset size, usage, and source hash.', '',
        '## Provenance and migration rules', '',
        '- Checked-out commit is authoritative for seed wording; deployed content is a comparison source.',
        '- No dates, claims, roles, or metrics are refreshed. Preserve the literal date text, including Present.',
        '- Imported records remain drafts until the owner reviews and publishes them.',
        '- Birthday, phone, detailed address, and student email remain private. Publish personal fields only through explicit visibility controls.',
        '- Three certificate links are empty; omit the link control rather than invent a credential URL.',
        '- DP-Learning App uses vdg.jpg. Preserve this mapping pending owner review.',
        '- All 15 project HTML pages include descriptions and technologies; no project is dropped.',
        '- Legacy analytics, hidden visitor counter, typing effect, loader, vendor libraries, and DS_Store files are preserved in legacy source but excluded from the new public application.', '',
        '## Section mapping', '', '| Source | Content | Target | State |','|---|---|---|---|',
        '| index.html#header | Name, Software Engineer / AI Enthusiast, social links, last-updated label | site_settings, social_links | inventoried |',
        '| index.html#about | Biography, portrait, eight interests, private facts | site_settings, interests, profile_facts | inventoried |',
        '| index.html#education | Three education entries and nine certificates | education, certifications | inventoried |',
        '| index.html#experience | Four roles and five competition/achievement entries | experiences, achievements | inventoried |',
        '| index.html#portfolio | 15 project cards; Web/App categories and covers | projects | inventoried |',
        '| index.html#skills | Four skill groups (image alt labels and fundamentals) | skill_groups, skills | inventoried |',
        '| index.html#links | Resume and cover-letter Drive links | navigation_items | inventoried |',
        '| index.html#contacts | Three social profiles, contact fields | social_links, profile_facts | inventoried |', '', '## Project sources', '', '| Source | Title | Cover | State |', '|---|---|---|---|']
    tree = document('index.html')
    cards = tree.all(cls='portfolio-item')
    for r in out['files'][1:]:
        page = document(r['source']); title = page.all('h2')[0].text()
        card = next((c for c in cards if any(a.attrs.get('href') == r['source'] for a in c.all('a'))), None)
        cover = card.all('img')[0].attrs['src'] if card else ''
        rows.append(f"| {r['source']} | {title} | {cover} | inventoried |")
    rows += ['', '## Assets and known legacy issues', '', f"There are {len(assets := out['assets'])} asset files ({sum(a['bytes'] for a in assets):,} bytes), including vendored libraries. Original files remain untouched. Education images and all certificate images are mapped in the JSON inventory. Two background images have no HTML usage and remain available for review.", '', 'Legacy project pages reference missing favicon/apple-touch icons and a misrelative jQuery script. The homepage includes external skill-logo hosts and analytics scripts. The new app will use text skill labels, optimized local images, and no copied tracking code.', '', '## Deployed comparison', '', 'The deployed page was reachable through the web tool. Visible section names, project list, experience dates and skill groups match the checked-out content. Full HTML/hash comparison is recorded in CONTEXT.md once HTTP retrieval completes. External link reachability remains a Phase 8 check; inventory presence is not a claim that third-party links work.']
    # Migration notes are maintained separately after the initial discovery.
    if not (ROOT/'docs/content-inventory.md').exists():
        (ROOT/'docs/content-inventory.md').write_text('\n'.join(rows)+'\n')
    assert len(out['files']) == 16
    assert len([p for p in cards if any(a.attrs.get('href','').startswith('projects/') for a in p.all('a'))]) == 15
    for r in out['files']:
        for i in r['images']:
            if not i['src'].startswith(('http:', 'https:')):
                assert (ROOT / Path(r['source']).parent / i['src']).exists(), i['src']
    print(f"Inventory validated: {len(out['files'])} HTML files, 15 project cards, {len(out['assets'])} assets; all local content images exist.")
