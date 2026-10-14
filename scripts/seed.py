"""Generate repeatable draft imports directly from preserved legacy HTML."""
from pathlib import Path
import json
import re
import uuid
from inventory import ROOT, document

seed = {}
provenance = []

def add(table, key, row, source='index.html'):
    row = {'id': str(uuid.uuid5(uuid.NAMESPACE_URL, 'farzine-portfolio/'+table+'/'+key)), **row}
    row.setdefault('sort_order',len(seed.get(table,[])))
    if table != 'profile_facts': row.setdefault('status','draft')
    seed.setdefault(table,[]).append(row)
    provenance.append({'table':table,'id':row['id'],'source':source,'review':'Legacy wording, dates and claims require owner review.'})
    return row['id']

def first(node, tag):
    return node.all(tag)[0].text() if node.all(tag) else ''

def link(node):
    return next((a.attrs.get('href','') for a in node.all('a') if a.attrs.get('href')), '')

root = document('index.html')
sections = {n.attrs['id']: n for n in root.all('section')}
bio = first(sections['about'],'p')
seed['site_settings'] = [{'id':1,'name':'Farzine Hossen','headline':'Software Engineer / AI Enthusiast','summary':bio.split('. ')[1]+'.','biography':bio,'profile_image':'/assets/img/profile.png','hero_visual_caption':'Software development · Artificial intelligence','last_updated_label':next(n.text() for n in root.all() if n.attrs.get('id')=='last-updated'),'show_last_updated':False,'footer_text':'Farzine Hossen','seo_title':'Farzine Hossen — Portfolio','seo_description':'Software development and artificial intelligence. Explore the work and profile of Farzine Hossen.','status':'draft'}]
for key,title in [('about','About'),('projects','Projects'),('experience','Experience'),('skills','Skills'),('education','Education'),('certifications','Certifications'),('achievements','Competitions & achievements'),('interests','Interests'),('links','Resume & links'),('contact','Contact')]:
    add('section_settings',key,{'key':key,'title':title,'visible':True})

for card in sections['portfolio'].all(cls='portfolio-item'):
    source=link(card)
    if not source.startswith('projects/'): continue
    page=document(source)
    stem=Path(source).stem
    slug={'farmAI':'farm-ai','dpLearningApp':'dp-learning-app','lemonLeafDiseaseDetection':'lemon-leaf-disease-detection','wasteManageMentApp':'waste-management-app'}.get(stem,stem)
    paragraphs=[n.text() for n in page.all('p') if n.text()]
    # One legacy page has an unclosed paragraph; nested p text is represented once.
    if len(paragraphs)>1 and paragraphs[0].endswith(paragraphs[1]): paragraphs[0]=paragraphs[0][:-len(paragraphs[1])].strip()
    technologies=[]; urls={'repository_url':'','demo_url':'','download_url':''}
    for li in page.all('li'):
        label=first(li,'strong')
        if label=='Tech Stack': technologies=[x.strip() for x in li.text().split(':',1)[1].split(',')]
        for name,field in [('Github URL','repository_url'),('Website URL','demo_url'),('APK File','download_url')]:
            if label==name: urls[field]=link(li)
    title=first(page,'h2')
    add('projects',slug,{'title':title,'slug':slug,'summary':paragraphs[0],'details':'\n\n'.join(paragraphs),'technologies':technologies,'category':'Web' if 'filter-app' in card.attrs['class'] else 'App','cover_image':'/'+card.all('img')[0].attrs['src'],'cover_alt':title+' project screenshot',**urls},source)

for card in sections['experience'].all(cls='icon-box'):
    title=first(card,'h4'); dates=first(card,'h5'); role=first(card,'em'); bullets=[n.text() for n in card.all('li')]
    if title in ['Kite Games Studio','App-concept.com GmbH','SUST ACM Student Chapter','Gaibandha Student Association, SUST']:
        add('experiences',title,{'organization':title,'role':role,'date_label':dates,'bullets':bullets,'url':link(card)})
    else:
        add('achievements',title,{'name':title,'context':dates,'result':role,'description':'\n'.join(bullets),'url':link(card)})

for i,card in enumerate(sections['education'].all(cls='icon-box')):
    qualification=first(card,'em')
    institution=['SUST','Cantonment Public School & College, Rangpur','Khamar Dashlia Adarsha High School'][i]
    add('education',institution,{'institution':institution,'qualification':qualification,'date_label':first(card,'h5'),'url':link(card),'image':'/'+card.all('img')[0].attrs['src']})
for card in sections['education'].all(cls='portfolio-item'):
    add('certifications',first(card,'h4'),{'name':first(card,'h4'),'image':'/'+card.all('img')[0].attrs['src'],'credential_url':link(card)})
for card in sections['skills'].all(cls='icon-box'):
    name=first(card,'h4'); group_id=add('skill_groups',name,{'name':name})
    labels=[n.attrs['alt'] for n in card.all('img')]+[n.text() for n in card.all('li')]
    for i,label in enumerate(labels): add('skills',name+'/'+label,{'group_id':group_id,'name':label,'sort_order':i})
for card in sections['about'].all(cls='icon-box'):
    name=first(card,'h3')
    if name: add('interests',name,{'name':name})
for strong in sections['about'].all('strong'):
    label=strong.text().rstrip(':'); value=strong.parent.text().split(':',1)[1].strip()
    add('profile_facts',label,{'label':label,'value':value,'kind':{'Phone':'phone','Email':'email'}.get(label,'text'),'is_public':False})
for box in sections['contacts'].all(cls='info-box'):
    label=first(box,'h3')
    for i,p in enumerate(box.all('p')):
        value=p.text()
        if any(r['value']==value for r in seed['profile_facts']): continue
        add('profile_facts',label+str(i),{'label':label,'value':value,'kind':'email' if label=='Email' else 'phone' if label=='Contact' else 'text','is_public':False})
for label,icon,url in [('GitHub','github','https://github.com/Farzine/'),('LinkedIn','linkedin','https://www.linkedin.com/in/farzine-hossen/'),('Facebook','facebook','https://www.facebook.com/alfeza.farzine.9')]:
    assert any(a.attrs.get('href')==url for a in root.all('a'))
    add('social_links',label,{'label':label,'icon':icon,'url':url})
for card in sections['links'].all(cls='icon-box'):
    label=first(card,'h4'); add('navigation_items',label,{'label':label,'url':link(card),'kind':'resume' if label=='Resume' else 'document'})
for label,url in [('About','/#about'),('Projects','/projects'),('Experience','/#experience'),('Skills','/#skills'),('Contact','/#contact')]:
    add('navigation_items',label,{'label':label,'url':url,'kind':'navigation'})

assert len(seed['projects'])==15 and len(seed['experiences'])==4 and len(seed['education'])==3
assert len(seed['certifications'])==9 and len(seed['achievements'])==5 and len(seed['interests'])==8
assert all(row['status']=='draft' for table,rows in seed.items() if table!='profile_facts' for row in rows)
assert all(not row['is_public'] for row in seed['profile_facts'])
(ROOT/'data/portfolio-seed.json').write_text(json.dumps(seed,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/seed-provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n')

def literal(value):
    if isinstance(value,bool): return 'true' if value else 'false'
    if isinstance(value,int): return str(value)
    if isinstance(value,list): return 'array['+','.join(literal(v) for v in value)+']::text[]'
    return "'"+value.replace("'","''")+"'"
lines=['-- Generated by python3 scripts/seed.py. All imported content is draft.', '-- Re-run safely: existing records and owner edits are never overwritten.', 'begin;']
for table,rows in seed.items():
    for row in rows:
        lines.append('insert into public.'+table+' ('+', '.join(row)+') values ('+', '.join(literal(v) for v in row.values())+') on conflict do nothing;')
lines.append('commit;')
(ROOT/'supabase/seed.sql').write_text('\n'.join(lines)+'\n')
print('Draft seed validated:', {k:len(v) for k,v in seed.items()})

redirects = [{"source":"/"+p["source"],"destination":"/projects/"+next(r["slug"] for r in seed["projects"] if r["id"]==p["id"]),"permanent":True} for p in provenance if p["table"]=="projects"]
(ROOT/"data/project-redirects.json").write_text(json.dumps(redirects,indent=2)+"\n")
