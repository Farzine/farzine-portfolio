begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.section_key as enum ('about', 'projects', 'experience', 'skills', 'education', 'certifications', 'achievements', 'interests', 'contact', 'links');

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;
revoke all on public.admin_profiles from public, anon, authenticated;
grant select on public.admin_profiles to authenticated;
create policy admin_own_membership on public.admin_profiles for select to authenticated
  using (user_id = (select auth.uid()));

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_profiles where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create function private.valid_web_url(value text) returns boolean
language sql immutable set search_path = '' as $$
  select value = '' or (length(value) <= 2048 and value ~ '^https?://[^[:space:]]+$');
$$;
revoke all on function private.valid_web_url(text) from public;
grant execute on function private.valid_web_url(text) to anon, authenticated;

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null check (length(name) between 1 and 120),
  headline text not null default '' check (length(headline) <= 200),
  summary text not null default '' check (length(summary) <= 600),
  biography text not null default '' check (length(biography) <= 10000),
  profile_image text not null default '',
  hero_visual_caption text not null default '' check (length(hero_visual_caption) <= 240),
  last_updated_label text not null default '' check (length(last_updated_label) <= 120),
  show_last_updated boolean not null default false,
  primary_cta_label text not null default 'Explore projects' check (length(primary_cta_label) <= 80),
  primary_cta_href text not null default '/projects' check (primary_cta_href in ('/projects', '/#about', '/#contact')),
  secondary_cta_label text not null default 'Contact' check (length(secondary_cta_label) <= 80),
  secondary_cta_href text not null default '/#contact' check (secondary_cta_href in ('/#contact', '/#links')),
  footer_text text not null default '' check (length(footer_text) <= 400),
  seo_title text not null default '' check (length(seo_title) <= 160),
  seo_description text not null default '' check (length(seo_description) <= 320),
  contact_form_enabled boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.section_settings (
  id uuid primary key default gen_random_uuid(),
  key public.section_key not null unique,
  title text not null check (length(title) between 1 and 160),
  subtitle text not null default '' check (length(subtitle) <= 500),
  visible boolean not null default true, sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('portfolio-public', 'portfolio-private')),
  object_path text not null unique check (object_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(png|jpg|webp|avif|pdf)$'),
  alt_text text not null default '' check (length(alt_text) <= 400),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/avif','application/pdf')),
  byte_size integer not null check (byte_size between 1 and 10485760),
  width integer check (width > 0), height integer check (height > 0),
  is_public boolean not null default false check (not is_public or bucket = 'portfolio-public'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 180),
  slug text not null unique check (length(slug) <= 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '' check (length(summary) <= 1200),
  details text not null default '' check (length(details) <= 30000),
  category text not null default '' check (length(category) <= 80),
  technologies text[] not null default '{}' check (cardinality(technologies) <= 40),
  cover_image text not null default '', cover_alt text not null default '' check (length(cover_alt) <= 400),
  cover_media_id uuid references public.media_assets(id) on delete restrict,
  repository_url text not null default '' check (private.valid_web_url(repository_url)),
  demo_url text not null default '' check (private.valid_web_url(demo_url)),
  download_url text not null default '' check (private.valid_web_url(download_url)),
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft', published_at timestamptz,
  seo_title text not null default '' check (length(seo_title) <= 160),
  seo_description text not null default '' check (length(seo_description) <= 320),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index projects_public_order on public.projects(sort_order, id) where status = 'published';
create index projects_cover_media on public.projects(cover_media_id);

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  caption text not null default '' check (length(caption) <= 400),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(project_id, media_id)
);
create index project_media_asset on public.project_media(media_id);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  organization text not null check (length(organization) between 1 and 200),
  role text not null check (length(role) between 1 and 200),
  date_label text not null default '' check (length(date_label) <= 200),
  location text not null default '' check (length(location) <= 200),
  bullets text[] not null default '{}' check (cardinality(bullets) <= 30),
  url text not null default '' check (private.valid_web_url(url)),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null check (length(institution) between 1 and 240),
  qualification text not null check (length(qualification) between 1 and 240),
  date_label text not null default '' check (length(date_label) <= 200),
  description text not null default '' check (length(description) <= 10000),
  image text not null default '', url text not null default '' check (private.valid_web_url(url)),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 240),
  issuer text not null default '' check (length(issuer) <= 240),
  date_label text not null default '' check (length(date_label) <= 200),
  image text not null default '', credential_url text not null default '' check (private.valid_web_url(credential_url)),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 240),
  context text not null default '' check (length(context) <= 400),
  result text not null default '' check (length(result) <= 1000),
  description text not null default '' check (length(description) <= 10000),
  url text not null default '' check (private.valid_web_url(url)),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.skill_groups (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 120),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.skill_groups(id) on delete restrict,
  name text not null check (length(name) between 1 and 120),
  description text not null default '' check (length(description) <= 1000),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(group_id, name)
);
create index skills_group on public.skills(group_id);

create table public.interests (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 120),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.social_links (
  id uuid primary key default gen_random_uuid(), label text not null check (length(label) between 1 and 80),
  icon text not null default 'link' check (icon in ('github','linkedin','facebook','link')),
  url text not null check (url <> '' and private.valid_web_url(url)),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(), label text not null check (length(label) between 1 and 80),
  url text not null check (url <> '' and (private.valid_web_url(url) or url in ('/','/projects','/#about','/#experience','/#skills','/#education','/#certifications','/#achievements','/#interests','/#contact','/#links'))),
  kind text not null default 'navigation' check (kind in ('navigation','resume','document')),
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profile_facts (
  id uuid primary key default gen_random_uuid(), label text not null check (length(label) between 1 and 80),
  value text not null check (length(value) between 1 and 500),
  kind text not null default 'text' check (kind in ('text','email','phone')),
  is_public boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(), name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  message text not null check (length(message) between 10 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function private.touch_updated_at() from public;

-- Apply the same least-privilege baseline to each real content entity.
do $$
declare entity text;
begin
  foreach entity in array array['site_settings','section_settings','projects','experiences','education','certifications','achievements','skill_groups','skills','interests','social_links','navigation_items','media_assets','project_media','profile_facts','contact_messages'] loop
    execute format('alter table public.%I enable row level security', entity);
    execute format('revoke all on public.%I from public, anon, authenticated', entity);
    execute format('grant select on public.%I to anon, authenticated', entity);
    execute format('grant insert, update, delete on public.%I to authenticated', entity);
    execute format('create policy admin_manage on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', entity);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()', entity);
  end loop;
  foreach entity in array array['site_settings','section_settings','projects','experiences','education','certifications','achievements','skill_groups','interests','social_links','navigation_items'] loop
    execute format('create policy public_published on public.%I for select to anon, authenticated using (status = ''published'')', entity);
    if entity <> 'site_settings' then
      execute format('create index %I on public.%I(sort_order, id) where status = ''published''', entity || '_published_order', entity);
    end if;
  end loop;
end $$;
create policy public_skills on public.skills for select to anon, authenticated using (
  status = 'published' and exists(select 1 from public.skill_groups where id = group_id and status = 'published')
);
create policy public_media on public.media_assets for select to anon, authenticated using (is_public and bucket = 'portfolio-public');
create policy public_gallery on public.project_media for select to anon, authenticated using (
  exists(select 1 from public.projects where id = project_id and status = 'published')
  and exists(select 1 from public.media_assets where id = media_id and is_public)
);
create policy public_facts on public.profile_facts for select to anon, authenticated using (is_public);
-- Contact storage has no public SELECT or INSERT capability.
revoke all on public.contact_messages from anon;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('portfolio-public','portfolio-public',true,10485760,array['image/png','image/jpeg','image/webp','image/avif','application/pdf']),
  ('portfolio-private','portfolio-private',false,10485760,array['image/png','image/jpeg','image/webp','image/avif','application/pdf'])
on conflict(id) do nothing;
create policy portfolio_admin_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
);
create policy portfolio_admin_storage_update on storage.objects for update to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
) with check (bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin()));
create policy portfolio_admin_storage_delete on storage.objects for delete to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
);
create policy portfolio_admin_storage_read on storage.objects for select to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
);

commit;
