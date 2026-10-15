begin;

revoke create on schema public from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table private.import_provenance (
  source_key text primary key,
  table_name text not null,
  record_id text not null,
  source_file text not null,
  note text not null default 'Historical source snapshot, not independently verified',
  created_at timestamptz not null default now()
);
revoke all on all tables in schema private from public, anon, authenticated;
alter table private.admin_users enable row level security;
alter table private.import_provenance enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.admin_users where user_id = (select auth.uid())) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create function private.safe_url(value text, allow_mailto boolean default false) returns boolean
language sql immutable set search_path = '' as $$
  select value = '' or (
    value !~ '[[:cntrl:][:space:]]' and length(value) <= 2048 and
    (value ~ '^https?://[^/@]+([/?#].*)?$' or (allow_mailto and value ~ '^mailto:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'))
  )
$$;
-- CHECK constraints execute as caller; expose only this pure predicate.
grant usage on schema private to anon, authenticated;
grant execute on function private.safe_url(text, boolean) to anon, authenticated;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 200),
  alt_text text not null default '' check (length(alt_text) <= 500),
  kind text not null check (kind in ('image', 'document')),
  bucket text check (bucket in ('portfolio-public', 'portfolio-private')),
  object_path text,
  legacy_path text check (legacy_path ~ '^/assets/img/[^<>]+\.(png|jpg|jpeg|webp|avif)$'),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/avif','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  width integer check (width > 0),
  height integer check (height > 0),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((legacy_path is not null and bucket is null and object_path is null) or
    (legacy_path is null and bucket is not null and object_path is not null and object_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|avif|pdf)$')),
  check (bucket is null or is_public = (bucket = 'portfolio-public')),
  unique (bucket, object_path), unique (legacy_path)
);

create table public.site_settings (
  id boolean primary key default true check (id),
  display_name text not null check (length(display_name) between 1 and 100),
  full_name text not null check (length(full_name) between 1 and 150),
  role_prefix text not null default 'I''m' check (length(role_prefix) <= 40),
  roles text[] not null default '{}' check (cardinality(roles) <= 10),
  biography text not null default '' check (length(biography) <= 10000),
  profile_media_id uuid references public.media_assets(id) on delete restrict,
  seo_image_media_id uuid references public.media_assets(id) on delete restrict,
  icon_media_id uuid references public.media_assets(id) on delete restrict,
  twitter_handle text not null default '' check (twitter_handle = '' or twitter_handle ~ '^@[A-Za-z0-9_]{1,15}$'),
  social_heading text not null default 'Social Profiles' check (length(social_heading) <= 100),
  updated_label text not null default 'Last Updated:' check (length(updated_label) <= 100),
  updated_display text not null default '' check (length(updated_display) <= 100),
  footer_text text not null default '' check (length(footer_text) <= 2000),
  seo_title text not null default '' check (length(seo_title) <= 160),
  seo_description text not null default '' check (length(seo_description) <= 500),
  canonical_url text not null default '' check (private.safe_url(canonical_url)),
  primary_cta_label text not null default '' check (length(primary_cta_label) <= 100),
  primary_cta_url text not null default '' check (private.safe_url(primary_cta_url, true)),
  secondary_cta_label text not null default '' check (length(secondary_cta_label) <= 100),
  secondary_cta_url text not null default '' check (private.safe_url(secondary_cta_url, true)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.section_settings (
  key text primary key check (key in ('header','about','interests','education','certifications','experience','achievements','portfolio','skills','links','contacts')),
  title text not null check (length(title) between 1 and 100),
  parent_key text references public.section_settings(key) on delete restrict,
  filter_all_label text not null default 'All' check (length(filter_all_label) between 1 and 60),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (parent_key is null or parent_key <> key)
);
create table public.profile_facts (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 100),
  value text not null check (length(value) between 1 and 1000),
  placement text not null check (placement in ('about','contact')),
  icon text not null default 'info' check (icon in ('info','map','email','phone')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  detail_title text not null default '' check (length(detail_title) <= 200),
  slug text not null unique check (length(slug) between 1 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '' check (length(summary) <= 3000),
  paragraphs text[] not null default '{}' check (cardinality(paragraphs) <= 100),
  technologies text[] not null default '{}' check (cardinality(technologies) <= 100),
  category text not null default 'Web' check (length(category) between 1 and 60),
  cover_media_id uuid references public.media_assets(id) on delete restrict,
  source_url text not null default '' check (private.safe_url(source_url)),
  demo_url text not null default '' check (private.safe_url(demo_url)),
  download_url text not null default '' check (private.safe_url(download_url)),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  featured boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  seo_title text not null default '' check (length(seo_title) <= 160),
  seo_description text not null default '' check (length(seo_description) <= 500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);
create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  caption text not null default '' check (length(caption) <= 500),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (project_id, media_id)
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  organization text not null check (length(organization) between 1 and 200),
  role text not null check (length(role) between 1 and 200),
  date_label text not null default '' check (length(date_label) <= 200),
  bullets text[] not null default '{}' check (cardinality(bullets) <= 100),
  url text not null default '' check (private.safe_url(url)),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null default '' check (length(institution) <= 200),
  qualification text not null check (length(qualification) between 1 and 300),
  date_label text not null default '' check (length(date_label) <= 200),
  description text not null default '' check (length(description) <= 10000),
  url text not null default '' check (private.safe_url(url)),
  media_id uuid references public.media_assets(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 300),
  issuer text not null default '' check (length(issuer) <= 200),
  date_label text not null default '' check (length(date_label) <= 200),
  credential_url text not null default '' check (private.safe_url(credential_url)),
  media_id uuid references public.media_assets(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 300),
  result text not null default '' check (length(result) <= 1000),
  date_label text not null default '' check (length(date_label) <= 200),
  bullets text[] not null default '{}' check (cardinality(bullets) <= 100),
  url text not null default '' check (private.safe_url(url)),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.skill_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.skill_groups(id) on delete cascade,
  name text not null check (length(name) between 1 and 150),
  description text not null default '' check (length(description) <= 1000),
  logo_url text not null default '' check (private.safe_url(logo_url)),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 150),
  icon text not null check (icon in ('global','code','database','camera','language','robot','algorithm','image')),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 100),
  url text not null check (url <> '' and private.safe_url(url,
  true)),
  icon text not null check (icon in ('linkedin','github','email','facebook')),
  placement text not null check (placement in ('hero','contact','both')),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.document_links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 200),
  description text not null default '' check (length(description) <= 2000),
  url text not null default '' check (private.safe_url(url)),
  media_id uuid references public.media_assets(id) on delete restrict,
  check (url <> '' or media_id is not null),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(label) between 1 and 100),
  section_key text not null unique references public.section_settings(key) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_visible boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create function private.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

do $$
declare tbl text;
begin
  foreach tbl in array array['media_assets','site_settings','section_settings','profile_facts','projects','project_media','experiences','education','certifications','achievements','skill_groups','skills','interests','social_links','document_links','navigation_items'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on table public.%I from public, anon, authenticated', tbl);
    execute format('grant select on table public.%I to anon, authenticated', tbl);
    execute format('grant insert, update, delete on table public.%I to authenticated', tbl);
    execute format('create policy admin_manage on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', tbl);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', tbl);
  end loop;
  foreach tbl in array array['section_settings','profile_facts','experiences','education','certifications','achievements','skill_groups','interests','social_links','document_links','navigation_items'] loop
    execute format('create policy public_visible on public.%I for select to anon, authenticated using (is_visible)', tbl);
    execute format('create index on public.%I (sort_order) where is_visible', tbl);
  end loop;
end $$;
create policy public_settings on public.site_settings for select to anon, authenticated using (true);
create policy public_media on public.media_assets for select to anon, authenticated using (is_public);
create policy public_projects on public.projects for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy public_project_media on public.project_media for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id = project_id and p.status = 'published' and p.published_at <= now())
  and exists(select 1 from public.media_assets m where m.id = media_id and m.is_public)
);
create policy public_skills on public.skills for select to anon, authenticated using (
  is_visible and exists(select 1 from public.skill_groups g where g.id = group_id and g.is_visible)
);
create index projects_public_order on public.projects (sort_order, id) where status = 'published';
create index project_media_project_order on public.project_media (project_id, sort_order);
create index skills_group_order on public.skills (group_id, sort_order) where is_visible;
create index media_public on public.media_assets (id) where is_public;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
 ('portfolio-public', 'portfolio-public', true, 10485760, array['image/png','image/jpeg','image/webp','image/avif','application/pdf']),
 ('portfolio-private', 'portfolio-private', false, 10485760, array['image/png','image/jpeg','image/webp','image/avif','application/pdf'])
on conflict (id) do nothing;

create policy portfolio_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio-public');
create policy portfolio_admin_read on storage.objects for select to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select public.is_admin())
);
create policy portfolio_admin_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('portfolio-public','portfolio-private') and (select public.is_admin()) and
  name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|avif|pdf)$'
);
create policy portfolio_admin_update on storage.objects for update to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select public.is_admin())
) with check (
  bucket_id in ('portfolio-public','portfolio-private') and (select public.is_admin()) and
  name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.(png|jpg|jpeg|webp|avif|pdf)$'
);
create policy portfolio_admin_delete on storage.objects for delete to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select public.is_admin())
);

-- No public registration, allowlist mutation, SQL gateway, contact endpoint or private-data view.
commit;
