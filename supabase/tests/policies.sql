\set ON_ERROR_STOP on
begin;

-- These assertions execute SQL under real PostgreSQL roles/RLS, not mocked queries.
do $$ begin
 assert (select count(*) from public.projects) = 15, 'seed project count/repeatability';
 assert (select count(*) from public.skills) = 36, 'seed skills count/repeatability';
 assert (select count(*) from public.certifications) = 9, 'seed certificate count';
 assert not exists(select 1 from public.profile_facts where is_visible), 'personal fields default private';
 assert not exists(select 1 from public.projects where status <> 'draft'), 'imports default draft';
 assert not exists(select 1 from pg_tables t join pg_class c on c.relname=t.tablename join pg_namespace n on n.oid=c.relnamespace and n.nspname=t.schemaname where t.schemaname='public' and not c.relrowsecurity), 'RLS enabled on all exposed tables';
end $$;

insert into auth.users(id) values ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into private.admin_users(user_id) values ('10000000-0000-4000-8000-000000000001');
insert into public.projects(id,title,slug,status,published_at) values
 ('20000000-0000-4000-8000-000000000001','Published test','published-test','published',now()),
 ('20000000-0000-4000-8000-000000000002','Archived test','archived-test','archived',null),
 ('20000000-0000-4000-8000-000000000003','Future test','future-test','published',now()+interval '1 day');
insert into public.media_assets(id,label,kind,bucket,object_path,mime_type,size_bytes,is_public) values
 ('30000000-0000-4000-8000-000000000001','Private media','image','portfolio-private','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001.png','image/png',100,false);
insert into storage.objects(bucket_id,name) values
 ('portfolio-private','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001.png'),
 ('portfolio-public','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000002.png');
insert into public.project_media(project_id, media_id) values ('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
insert into public.media_assets(id,label,kind,bucket,object_path,mime_type,size_bytes,is_public,pending_delete) values ('30000000-0000-4000-8000-000000000004','Pending public fixture','image','portfolio-public','30000000-0000-4000-8000-000000000004/30000000-0000-4000-8000-000000000004.png','image/png',100,true,true);
update public.skills set is_visible=true;

set local role anon;
do $$ begin
 assert (select count(*) from public.projects) = 1, 'anon draft/archive/scheduled filtering';
 assert not exists(select 1 from public.media_assets where pending_delete), 'pending public asset hidden';
 assert (select count(*) from public.public_labels)=18, 'public display labels';
 begin update public.public_labels set value='hacked'; raise exception 'anon labels update allowed'; exception when insufficient_privilege then null; end;
 assert (select count(*) from public.profile_facts) = 0, 'anon private profile';
 assert (select count(*) from public.media_assets where not is_public) = 0, 'anon private media';
 assert (select count(*) from public.project_media) = 0, 'public gallery cannot leak private asset';
 assert (select count(*) from public.skills) = 0, 'hidden group hides skills';
 assert (select count(*) from storage.objects) = 1, 'storage public read boundary';
 begin insert into public.projects(title,slug) values ('unauthorized','anon-write'); raise exception 'anon insert allowed'; exception when insufficient_privilege then null; end;
 begin update public.site_settings set display_name='hacked'; raise exception 'anon update allowed'; exception when insufficient_privilege then null; end;
 begin delete from public.projects; raise exception 'anon delete allowed'; exception when insufficient_privilege then null; end;
 begin perform user_id from private.admin_users; raise exception 'allowlist exposed'; exception when insufficient_privilege then null; end;
 begin insert into storage.objects(bucket_id,name) values ('portfolio-public','bad.png'); raise exception 'anon storage write allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","user_metadata":{"role":"admin"}}',true);
do $$ declare changed integer; tbl text;
begin
 assert not public.is_admin(), 'user-editable metadata is not authority';
 update public.public_labels set value='hacked'; get diagnostics changed=row_count; assert changed=0, 'non-admin labels update denied';
 assert (select count(*) from public.projects) = 1, 'non-admin draft isolation';
 assert (select count(*) from public.profile_facts) = 0, 'non-admin private profile';
 begin insert into public.projects(title,slug) values ('unauthorized','non-admin-write'); raise exception 'non-admin insert allowed'; exception when insufficient_privilege then null; end;
 update public.projects set title='hacked'; get diagnostics changed = row_count; assert changed=0, 'non-admin update denied';
 delete from public.projects; get diagnostics changed = row_count; assert changed=0, 'non-admin delete denied';
 begin insert into private.admin_users(user_id) values (auth.uid()); raise exception 'self-promotion allowed'; exception when insufficient_privilege then null; end;
 begin insert into storage.objects(bucket_id,name) values ('portfolio-private','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003.png'); raise exception 'non-admin storage insert allowed'; exception when insufficient_privilege then null; end;
 update storage.objects set name='hacked.png'; get diagnostics changed = row_count; assert changed=0, 'non-admin storage update denied';
 delete from storage.objects; get diagnostics changed = row_count; assert changed=0, 'non-admin storage delete denied';
 foreach tbl in array array['media_assets','site_settings','section_settings','profile_facts','project_media','experiences','education','certifications','achievements','skill_groups','skills','interests','social_links','document_links','navigation_items'] loop
   execute format('delete from public.%I', tbl); get diagnostics changed = row_count; assert changed=0, 'non-admin delete denied for ' || tbl;
 end loop;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$ declare changed integer; new_id uuid;
begin
 assert public.is_admin(), 'allowlisted identity authorized';
 assert (select count(*) from public.projects) = 18, 'admin sees drafts';
 assert (select count(*) from public.profile_facts) = 7, 'admin sees private profile';
 insert into public.projects(title,slug) values ('Owner project','owner-project') returning id into new_id;
 update public.projects set status='published', published_at=now() where id=new_id; get diagnostics changed = row_count; assert changed=1, 'admin publish';
 delete from public.projects where id=new_id; get diagnostics changed = row_count; assert changed=1, 'admin delete';
 update public.site_settings set display_name='Owner edited'; get diagnostics changed = row_count; assert changed=1, 'admin settings write';
 begin insert into public.projects(title,slug,source_url) values ('Bad URL','bad-url','javascript:alert(1)'); raise exception 'unsafe URL accepted'; exception when check_violation then null; end;
 begin insert into public.projects(title,slug,source_url) values ('Bad URL','bad-url','https://user:password@example.com'); raise exception 'credential URL accepted'; exception when check_violation then null; end;
 begin insert into public.projects(title,slug) values ('Duplicate','published-test'); raise exception 'duplicate slug accepted'; exception when unique_violation then null; end;
 begin insert into public.projects(title,slug,status) values ('No timestamp','no-timestamp','published'); raise exception 'publish timestamp missing'; exception when check_violation then null; end;
 begin insert into public.media_assets(label,kind,bucket,mime_type,size_bytes,is_public) values ('Missing object','image','portfolio-public','image/png',10,true); raise exception 'null object accepted'; exception when check_violation then null; end;
 begin insert into storage.objects(bucket_id,name) values ('portfolio-public','evil.svg'); raise exception 'svg path accepted'; exception when insufficient_privilege then null; end;
 insert into storage.objects(bucket_id,name) values ('portfolio-private','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003.pdf');
 assert (select count(*) from storage.objects) = 3, 'admin private storage read/write';
 delete from storage.objects where name like '%.pdf'; get diagnostics changed=row_count; assert changed=0, 'untracked file deletion denied';
 insert into public.media_assets(id,label,kind,bucket,object_path,mime_type,size_bytes,is_public) values ('30000000-0000-4000-8000-000000000003','Delete fixture','document','portfolio-private','30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003.pdf','application/pdf',100,false);
 begin update public.media_assets set pending_delete=true where id='30000000-0000-4000-8000-000000000001'; raise exception 'referenced asset tombstone allowed'; exception when foreign_key_violation then null; end;
 update public.media_assets set pending_delete=true where id='30000000-0000-4000-8000-000000000003';
 begin insert into public.document_links(title,media_id) values ('Pending asset reference','30000000-0000-4000-8000-000000000003'); raise exception 'pending asset selected'; exception when foreign_key_violation then null; end;
 begin update public.media_assets set pending_delete=false where id='30000000-0000-4000-8000-000000000003'; raise exception 'tombstone cancelled'; exception when check_violation then null; end;
 begin update public.media_assets set object_path='30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000009.pdf' where id='30000000-0000-4000-8000-000000000003'; raise exception 'file changed in place'; exception when check_violation then null; end;
 delete from storage.objects where name like '%.pdf'; get diagnostics changed=row_count; assert changed=1, 'unreferenced tombstone storage delete';
 delete from public.media_assets where id='30000000-0000-4000-8000-000000000003';
end $$;
reset role;

rollback;
