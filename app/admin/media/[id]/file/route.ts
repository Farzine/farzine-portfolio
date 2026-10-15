import { getPrivateMedia } from "@/lib/dal/media";
import { AuthorizationError } from "@/lib/auth/errors";
import { idSchema } from "@/lib/validations/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const id = idSchema.safeParse((await params).id);
    if (!id.success) return new Response("File unavailable.", { status: 404 });
    const asset = await getPrivateMedia(id.data);
    if (!asset) return new Response("File unavailable.", { status: 404 });
    const pdf = asset.mime === "application/pdf";
    return new Response(asset.file, {
      headers: {
        "Content-Type": asset.mime,
        "Content-Length": String(asset.file.size),
        "Content-Disposition": `${pdf ? "attachment" : "inline"}; filename="${id.data}.${pdf ? "pdf" : "webp"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError)
      return new Response(error.message, { status: error.status });
    return new Response("File unavailable.", { status: 404 });
  }
}
