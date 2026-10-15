begin;
-- After waiting for a reference's key-share lock, the check must see its commit.
alter function private.media_is_referenced(uuid) volatile;
commit;
