"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function MediaUpload() {
  type UploadField = "label" | "alt_text" | "file" | "visibility";
  const [errors, setErrors] = useState<Partial<Record<UploadField, string>>>(
    {},
  );
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const status = useRef<HTMLParagraphElement>(null);
  const router = useRouter();
  return (
    <form
      className="admin-form"
      action="/admin/media/upload"
      method="post"
      encType="multipart/form-data"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setPending(true);
        setMessage("");
        setErrors({});
        try {
          const response = await fetch("/admin/media/upload", {
            method: "POST",
            body: data,
          });
          const result: unknown = await response.json();
          if (
            !result ||
            typeof result !== "object" ||
            !("message" in result) ||
            typeof result.message !== "string"
          )
            throw new Error("Unexpected response.");
          setMessage(result.message);
          if (!response.ok) {
            const fieldErrors: Partial<Record<UploadField, string>> = {};
            const details = "errors" in result ? result.errors : null;
            if (details && typeof details === "object") {
              for (const field of [
                "label",
                "alt_text",
                "file",
                "visibility",
              ] as const) {
                const value: unknown = Reflect.get(details, field);
                if (
                  Array.isArray(value) &&
                  value.every((item) => typeof item === "string")
                )
                  fieldErrors[field] = value.join(" ");
              }
            } else fieldErrors.file = result.message;
            setErrors(fieldErrors);
          }
          if (response.ok) {
            form.reset();
            router.refresh();
          }
        } catch {
          setMessage("Unable to upload. Check the connection and try again.");
        } finally {
          setPending(false);
          status.current?.focus();
        }
      }}
    >
      <fieldset disabled={pending}>
        <legend>Upload media</legend>
        <div className="admin-field">
          <label htmlFor="upload-label">Label (required)</label>
          <input
            id="upload-label"
            name="label"
            required
            maxLength={200}
            aria-invalid={!!errors.label}
            aria-describedby="upload-label-error"
          />
          <span id="upload-label-error" className="admin-field-error">
            {errors.label}
          </span>
        </div>
        <div className="admin-field">
          <label htmlFor="upload-alt">Alternative text</label>
          <textarea
            id="upload-alt"
            name="alt_text"
            maxLength={500}
            aria-describedby="upload-alt-hint upload-alt-error"
            aria-invalid={!!errors.alt_text}
          />
          <small id="upload-alt-hint">
            Describe the meaningful image content. Leave empty for documents.
          </small>
          <span id="upload-alt-error" className="admin-field-error">
            {errors.alt_text}
          </span>
        </div>
        <div className="admin-field">
          <label htmlFor="upload-file">File (required)</label>
          <input
            id="upload-file"
            name="file"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp,image/avif,application/pdf"
            aria-describedby="upload-hint upload-file-error"
            aria-invalid={!!errors.file}
          />
          <small id="upload-hint">
            10 MiB maximum; raster images up to 24 megapixels or PDF. Images are
            resized to at most 2400px and stripped of metadata. PDF is accepted
            as a download, not sanitized content.
          </small>
          <span id="upload-file-error" className="admin-field-error">
            {errors.file}
          </span>
        </div>
        <div className="admin-field">
          <label htmlFor="upload-visibility">File visibility</label>
          <select
            id="upload-visibility"
            name="visibility"
            defaultValue="private"
            aria-describedby="upload-privacy upload-visibility-error"
            aria-invalid={!!errors.visibility}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <small id="upload-privacy">
            Public bytes can be accessed by anyone, even if their project is a
            draft. Start private until ready.
          </small>
          <span id="upload-visibility-error" className="admin-field-error">
            {errors.visibility}
          </span>
        </div>
        <button type="submit">{pending ? "Uploading…" : "Upload file"}</button>
      </fieldset>
      <p ref={status} tabIndex={-1} role="status">
        {message}
      </p>
      <noscript>
        Your upload result will open on a separate page. Return to this library
        afterward.
      </noscript>
    </form>
  );
}
