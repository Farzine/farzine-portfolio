import "server-only";
import { updateTag, revalidateTag } from "next/cache";
import { publicTag, type PublicGroup } from "./public-groups";

// Call only after independent admin authorization and a completed DB write.
export function expirePublicGroups(groups: readonly PublicGroup[]) {
  for (const group of new Set(groups)) updateTag(publicTag(group));
}
export function expireUploadedMedia() {
  // Upload is a Route Handler; updateTag is restricted to Server Actions.
  revalidateTag(publicTag("media"), { expire: 0 });
}
