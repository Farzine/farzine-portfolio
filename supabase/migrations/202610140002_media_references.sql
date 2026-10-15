begin;
-- Preserve legacy paths; normalized uploaded assets prevent removal while referenced.
alter table public.site_settings add column profile_media_id uuid references public.media_assets(id) on delete restrict;
alter table public.education add column image_media_id uuid references public.media_assets(id) on delete restrict;
alter table public.certifications add column image_media_id uuid references public.media_assets(id) on delete restrict;
alter table public.navigation_items add column media_id uuid references public.media_assets(id) on delete restrict;
create index settings_profile_media on public.site_settings(profile_media_id);
create index education_image_media on public.education(image_media_id);
create index certifications_image_media on public.certifications(image_media_id);
create index navigation_media on public.navigation_items(media_id);
commit;
