-- Development-only rendering fixtures for the isolated full local Supabase stack.
-- Never apply this file to a hosted/valuable database; original seed stays draft.
begin;
do $$
declare tbl text;
begin
  foreach tbl in array array['experiences','education','certifications','achievements','skill_groups','skills','interests','social_links','document_links'] loop
    execute format('update public.%I set is_visible=true where id::text in (select record_id from private.import_provenance where table_name=%L)',tbl,tbl);
  end loop;
end $$;
update public.projects set status='published', published_at='1970-01-01T00:00:00Z'
where id::text in (select record_id from private.import_provenance where table_name='projects');
-- Private canary tests API, HTML, metadata and 404 boundaries; no fabricated public item.
insert into public.projects(id,title,slug,summary,status) values
('ffffffff-ffff-4fff-8fff-ffffffffffff','PRIVATE_TEST_CANARY','private-regression-fixture','PRIVATE_TEST_CANARY_DESCRIPTION','draft')
on conflict(id) do nothing;
commit;
