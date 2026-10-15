begin;
-- Registered object identity is immutable; descriptions remain editable.
revoke update on public.media_assets from authenticated;
grant update(alt_text) on public.media_assets to authenticated;
drop policy portfolio_admin_storage_insert on storage.objects;
drop policy portfolio_admin_storage_update on storage.objects;
drop policy portfolio_admin_storage_delete on storage.objects;
create policy portfolio_admin_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
  and not exists(select 1 from public.media_assets m where m.bucket=storage.objects.bucket_id and m.object_path=storage.objects.name)
);
create policy portfolio_admin_storage_update on storage.objects for update to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
  and not exists(select 1 from public.media_assets m where m.bucket=storage.objects.bucket_id and m.object_path=storage.objects.name)
) with check (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
  and not exists(select 1 from public.media_assets m where m.bucket=storage.objects.bucket_id and m.object_path=storage.objects.name)
);
-- Application removes unreferenced metadata first; FKs then protect all content references.
create policy portfolio_admin_storage_delete on storage.objects for delete to authenticated using (
  bucket_id in ('portfolio-public','portfolio-private') and (select private.is_admin())
  and not exists(select 1 from public.media_assets m where m.bucket=storage.objects.bucket_id and m.object_path=storage.objects.name)
);
commit;
