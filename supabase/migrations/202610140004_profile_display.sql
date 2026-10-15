begin;
-- A display preference, not a claim about availability or capability.
alter table public.site_settings add column orbit_enabled boolean not null default true;
commit;
