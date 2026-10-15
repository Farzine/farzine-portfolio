begin;

alter table public.media_assets add column pending_delete boolean not null default false;
drop policy public_media on public.media_assets;
create policy public_media on public.media_assets for select to anon, authenticated using (is_public and not pending_delete);
alter table public.skills drop constraint skills_group_id_fkey;
alter table public.skills add constraint skills_group_id_fkey foreign key (group_id) references public.skill_groups(id) on delete restrict;

create function private.media_is_referenced(asset_id uuid) returns boolean
language sql stable set search_path = '' as $$
 select exists(select 1 from public.site_settings where asset_id in (profile_media_id, seo_image_media_id, icon_media_id))
 or exists(select 1 from public.projects where cover_media_id = asset_id)
 or exists(select 1 from public.project_media where media_id = asset_id)
 or exists(select 1 from public.education where media_id = asset_id)
 or exists(select 1 from public.certifications where media_id = asset_id)
 or exists(select 1 from public.document_links where media_id = asset_id)
$$;
revoke all on function private.media_is_referenced(uuid) from public, anon;
grant execute on function private.media_is_referenced(uuid) to authenticated;

create function private.guard_media_lifecycle() returns trigger
language plpgsql set search_path = '' as $$
begin
 if row(new.kind,new.bucket,new.object_path,new.legacy_path,new.mime_type,new.size_bytes,new.width,new.height,new.is_public)
 is distinct from row(old.kind,old.bucket,old.object_path,old.legacy_path,old.mime_type,old.size_bytes,old.width,old.height,old.is_public) then
  raise exception 'Media files are immutable; create a replacement asset' using errcode='23514';
 end if;
 if old.pending_delete and not new.pending_delete then
  raise exception 'Pending deletion cannot be cancelled; retry cleanup' using errcode='23514';
 end if;
 if new.pending_delete then
  -- Upgrade the row lock so new FK references cannot race the reference check.
  perform 1 from public.media_assets where id = old.id for update;
  if private.media_is_referenced(old.id) then raise exception 'Media is still referenced' using errcode='23503'; end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_media_lifecycle() from public, anon, authenticated;
create trigger guard_media_lifecycle before update on public.media_assets for each row execute function private.guard_media_lifecycle();

create function private.guard_media_reference() returns trigger
language plpgsql set search_path = '' as $$
declare column_name text; asset_id uuid; deleting boolean;
begin
 foreach column_name in array TG_ARGV loop
  asset_id := (to_jsonb(new)->>column_name)::uuid;
  if asset_id is not null then
   select pending_delete into deleting from public.media_assets where id = asset_id for key share;
   if coalesce(deleting,true) then raise exception 'Media unavailable for selection' using errcode='23503'; end if;
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.guard_media_reference() from public, anon, authenticated;
create trigger guard_media_reference before insert or update on public.site_settings for each row execute function private.guard_media_reference('profile_media_id','seo_image_media_id','icon_media_id');
create trigger guard_media_reference before insert or update on public.projects for each row execute function private.guard_media_reference('cover_media_id');
create trigger guard_media_reference before insert or update on public.project_media for each row execute function private.guard_media_reference('media_id');
create trigger guard_media_reference before insert or update on public.education for each row execute function private.guard_media_reference('media_id');
create trigger guard_media_reference before insert or update on public.certifications for each row execute function private.guard_media_reference('media_id');
create trigger guard_media_reference before insert or update on public.document_links for each row execute function private.guard_media_reference('media_id');

-- Files are immutable. Deletion requires a checked, resumable metadata tombstone.
drop policy portfolio_admin_update on storage.objects;
drop policy portfolio_admin_delete on storage.objects;
create policy portfolio_admin_delete on storage.objects for delete to authenticated using (
 (select public.is_admin()) and exists (
  select 1 from public.media_assets m where m.bucket = bucket_id and m.object_path = name
  and m.pending_delete and not private.media_is_referenced(m.id)
 )
);
commit;
