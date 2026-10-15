import "server-only";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import { requireAdmin } from "@/lib/auth/require-admin";
import { recordId, recordVersion } from "@/lib/validations/admin-content";
import { ContentError } from "@/lib/admin/errors";
export async function getAdminMessages(page = 1) {
  const { supabase } = await requireAdminPage();
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
    throw new ContentError("Choose a valid message page.");
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (error) throw new ContentError("Messages could not be loaded.");
  return data ?? [];
}
export async function markMessageRead(id: string, version: string) {
  const { supabase } = await requireAdmin({ writable: true });
  recordId.parse(id);
  recordVersion.parse(version);
  const { data, error } = await supabase
    .from("contact_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("updated_at", version)
    .select("id")
    .maybeSingle();
  if (error || !data)
    throw new ContentError("This message changed. Reload before updating.");
}
export async function deleteMessage(
  id: string,
  version: string,
  confirmation: string,
) {
  const { supabase } = await requireAdmin({ writable: true });
  recordId.parse(id);
  recordVersion.parse(version);
  const { data: message, error: readError } = await supabase
    .from("contact_messages")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (readError || !message || message.name !== confirmation)
    throw new ContentError("Enter the exact sender name to confirm deletion.");
  const { data, error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id)
    .eq("updated_at", version)
    .select("id")
    .maybeSingle();
  if (error || !data)
    throw new ContentError("This message changed. Reload before deleting.");
}
