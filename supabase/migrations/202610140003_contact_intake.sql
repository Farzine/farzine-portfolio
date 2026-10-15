begin;
-- Only the server-held service credential may call the bounded intake function.
create table private.contact_rate_limits (
  rate_key text not null check (rate_key ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  attempts integer not null default 1 check (attempts > 0),
  primary key (rate_key, window_start)
);
create index contact_rate_expiry on private.contact_rate_limits(window_start);
alter table private.contact_rate_limits enable row level security;
revoke all on private.contact_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.contact_rate_limits to service_role;
grant insert on public.contact_messages to service_role;
grant select on public.site_settings, public.section_settings to service_role;
create function public.submit_contact_message(sender_name text, sender_email text, body_text text, rate_key text)
returns text language plpgsql security invoker set search_path = '' as $$
declare attempts integer; global_attempts integer; window_start timestamptz := date_trunc('hour', now());
begin
  if length(sender_name) not between 1 and 120 or length(sender_email) not between 3 and 254
     or sender_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or length(body_text) not between 10 and 5000 or rate_key !~ '^[a-f0-9]{64}$'
     or sender_name is null or sender_email is null or body_text is null or rate_key is null then return 'invalid'; end if;
  if not exists(select 1 from public.site_settings where id=1 and status='published' and contact_form_enabled)
     or not exists(select 1 from public.section_settings where key='contact' and status='published' and visible)
     then return 'disabled'; end if;
  delete from private.contact_rate_limits where private.contact_rate_limits.window_start < now() - interval '2 days';
  insert into private.contact_rate_limits as limits(rate_key,window_start) values(repeat('0',64),window_start)
    on conflict on constraint contact_rate_limits_pkey do update set attempts=limits.attempts+1 returning limits.attempts into global_attempts;
  if global_attempts>100 then return 'rate_limited'; end if;
  insert into private.contact_rate_limits as limits(rate_key,window_start) values(rate_key,window_start)
    on conflict on constraint contact_rate_limits_pkey do update set attempts=limits.attempts+1 returning limits.attempts into attempts;
  if attempts>5 then return 'rate_limited'; end if;
  insert into public.contact_messages(name,email,message) values(sender_name,sender_email,body_text);
  return 'stored';
end;
$$;
revoke all on function public.submit_contact_message(text,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_contact_message(text,text,text,text) to service_role;
commit;
