begin;
create table public.project_slug_aliases (
  old_slug text primary key check (length(old_slug) <= 180 and old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index project_slug_alias_project on public.project_slug_aliases(project_id);
alter table public.project_slug_aliases enable row level security;
revoke all on public.project_slug_aliases from public, anon, authenticated;
grant select on public.project_slug_aliases to anon, authenticated;
grant insert, update, delete on public.project_slug_aliases to authenticated;
create policy admin_manage on public.project_slug_aliases for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy published_project_alias on public.project_slug_aliases for select to anon, authenticated using (
  exists(select 1 from public.projects p where p.id=project_id and p.status='published')
);
create function private.preserve_project_slug() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  -- Slug edits are rare; one transaction lock serializes the two-table namespace.
  perform pg_catalog.pg_advisory_xact_lock(61980214::bigint);
  if exists(select 1 from public.project_slug_aliases a where a.old_slug=new.slug and a.project_id<>new.id) then
    raise exception using errcode='23505', message='Slug is reserved by an existing project URL';
  end if;
  if tg_op='UPDATE' and old.slug<>new.slug then
    delete from public.project_slug_aliases where old_slug=new.slug and project_id=new.id;
    insert into public.project_slug_aliases(old_slug,project_id) values(old.slug,new.id) on conflict(old_slug) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.preserve_project_slug() from public,anon,authenticated;
create trigger preserve_project_slug before insert or update of slug on public.projects for each row execute function private.preserve_project_slug();
commit;
