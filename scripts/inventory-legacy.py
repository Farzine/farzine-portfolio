"""Build a reproducible provenance ledger without changing legacy source files."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import json
import re
from urllib.parse import urlsplit

class Inventory(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.section = 'document'
        self.skip = 0
        self.records = []
        self.comments = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('section', 'header'):
            self.section = attrs.get('id', tag)
        if tag in ('script', 'style'):
            self.skip += 1
        refs = {k: v for k, v in attrs.items() if k in ('src', 'href', 'alt', 'title', 'data-filter')}
        if refs:
            self.records.append({'line': self.getpos()[0], 'section': self.section, 'tag': tag, **refs})
    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
    def handle_data(self, text):
        value = re.sub(r'\s+', ' ', text).strip()
        if value and not self.skip:
            self.records.append({'line': self.getpos()[0], 'section': self.section, 'text': value})
    def handle_comment(self, text):
        if '<' in text:
            self.comments.append({'line': self.getpos()[0], 'text': text.strip()})

files = [Path('index.html'), *sorted(Path('projects').glob('*.html'))]
ledger = {'base_commit': '6d774c7050fda2ab386fa4dfe297d4a4f4776715', 'files': {}, 'assets': [], 'missing_local_references': []}
for file in files:
    parser = Inventory()
    parser.feed(file.read_text())
    ledger['files'][str(file)] = {'records': parser.records, 'commented_markup': parser.comments, 'migration': 'pending'}
    for record in parser.records:
        for key in ('src', 'href'):
            value = record.get(key, '')
            parsed = urlsplit(value)
            if value and not parsed.scheme and not parsed.netloc and parsed.path:
                target = (Path('.') if value.startswith('/') else file.parent) / parsed.path.lstrip('/')
                if not target.exists():
                    ledger['missing_local_references'].append({'file': str(file), 'line': record['line'], 'reference': value})
for asset in sorted(Path('assets').rglob('*')):
    if not asset.is_file():
        continue
    references = []
    for file, data in ledger['files'].items():
        for record in data['records']:
            if any(v and (Path(file).parent / v).resolve() == asset.resolve() for k, v in record.items() if k in ('src', 'href')):
                references.append({'file': file, 'line': record['line'], 'section': record['section']})
    ledger['assets'].append({'path': str(asset), 'bytes': asset.stat().st_size, 'sha256': hashlib.sha256(asset.read_bytes()).hexdigest(), 'references': references})
Path('docs/legacy-inventory.json').write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + '\n')
assert len(files) == 16, 'Review newly added or removed source pages'
assert len([p for p in Path('assets/img/project').glob('*') if p.suffix in ('.png', '.jpg')]) == 15
print(f"Inventoried {len(files)} HTML files, {len(ledger['assets'])} assets, {len(ledger['missing_local_references'])} missing legacy references")
