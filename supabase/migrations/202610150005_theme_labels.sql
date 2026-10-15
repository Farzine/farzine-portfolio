begin;
alter table public.public_labels drop constraint public_labels_key_check;
alter table public.public_labels add constraint public_labels_key_check check(key in ('technology','website','source','sourceLink','download','apk','projectDetails','openProject','closeProject','backProjects','filter','shown','empty','mainNav','mobileNav','openNav','closeNav','socialNav','lightTheme','darkTheme'));
insert into public.public_labels(key,value) values ('lightTheme','Light theme'),('darkTheme','Dark theme') on conflict do nothing;
commit;
