import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AuthorizationError } from "@/lib/auth/errors";
import { uploadMedia } from "@/lib/dal/media";
import { ContentError } from "@/lib/dal/admin";
import { UploadError, uploadLimit } from "@/lib/validations/upload";
import { hasSameOrigin } from "@/lib/security/origin";

export async function POST(request: Request) {
  try {
    await requireAdmin({ writeCookies: true });
    if (!hasSameOrigin(request))
      return NextResponse.json(
        { message: "Invalid request origin." },
        { status: 403 },
      );
    const limit = uploadLimit + 65536;
    if (Number(request.headers.get("content-length")) > limit)
      return NextResponse.json(
        { message: "The upload exceeds 10 MiB." },
        { status: 413 },
      );
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json({ message: "Choose a file." }, { status: 400 });
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return NextResponse.json(
          { message: "The upload exceeds 10 MiB." },
          { status: 413 },
        );
      }
      chunks.push(item.value);
    }
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") || "" },
      body: new Blob(chunks),
    }).formData();
    const id = await uploadMedia(
      {
        label: form.get("label"),
        alt_text: form.get("alt_text"),
        visibility: form.get("visibility"),
      },
      form.get("file"),
    );
    return NextResponse.json(
      { id, message: "File uploaded and registered." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthorizationError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          message: "Check the upload fields.",
          errors: z.flattenError(error).fieldErrors,
        },
        { status: 400 },
      );
    if (error instanceof UploadError || error instanceof ContentError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("Upload request failed", {
      kind: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { message: "Unable to upload this file. No content references changed." },
      { status: 500 },
    );
  }
}
