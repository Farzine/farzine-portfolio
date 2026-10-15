import { NextResponse } from "next/server";
import { requireAdmin, AuthorizationError } from "@/lib/auth/require-admin";
import { recordId } from "@/lib/validations/admin-content";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireAdmin();
    const id = recordId.parse((await params).id);
    const { data, error } = await supabase
      .from("media_assets")
      .select("bucket,object_path")
      .eq("id", id)
      .maybeSingle();
    if (error || !data)
      return NextResponse.json(
        { error: "Asset unavailable." },
        { status: 404 },
      );
    const { data: signed, error: signError } = await supabase.storage
      .from(data.bucket)
      .createSignedUrl(data.object_path, 60, { download: true });
    if (signError || !signed)
      return NextResponse.json(
        { error: "Download temporarily unavailable." },
        { status: 503 },
      );
    return NextResponse.redirect(signed.signedUrl, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Asset unavailable." },
      {
        status: error instanceof AuthorizationError ? 403 : 400,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
