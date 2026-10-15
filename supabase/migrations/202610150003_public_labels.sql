begin;
create table public.public_labels (
 key text primary key check(key in ('technology','website','source','sourceLink','download','apk','projectDetails','openProject','closeProject','backProjects','filter','shown','empty','mainNav','mobileNav','openNav','closeNav','socialNav')),
 value text not null check(length(value) between 1 and 200),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.public_labels enable row level security;
revoke all on table public.public_labels from public, anon, authenticated;
grant select on table public.public_labels to anon, authenticated;
grant update on table public.public_labels to authenticated;
create policy public_read on public.public_labels for select to anon, authenticated using (true);
create policy admin_update on public.public_labels for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger set_updated_at before update on public.public_labels for each row execute function private.set_updated_at();
insert into public.public_labels(key,value) values ('technology','Tech Stack'),
('website','Website URL'),
('source','Github URL'),
('sourceLink','Project Link'),
('download','Download'),
('apk','APK File'),
('projectDetails','Project details'),
('openProject','Open project page'),
('closeProject','Close project details'),
('backProjects','← Back to projects'),
('filter','Filter projects'),
('shown','projects shown'),
('empty','Nothing published here yet.'),
('mainNav','Main'),
('mobileNav','Mobile'),
('openNav','Open navigation'),
('closeNav','Close navigation'),
('socialNav','Social links') on conflict do nothing;
commit;
