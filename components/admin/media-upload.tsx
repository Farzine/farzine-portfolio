"use client";
import { useActionState } from "react";
import { uploadMediaAction } from "@/app/admin/media-actions";
import { FormFeedback } from "./editor";
export function MediaUpload() {
  const [state, action, pending] = useActionState(uploadMediaAction, {});
  return (
    <form action={action} className="editor-form">
      <h2>Upload an asset</h2>
      <p className="muted">
        PNG, JPEG, WebP or PDF, up to 3 MiB. Images are resized and re-encoded.
        Public assets can be accessed by anyone with their URL, including while
        the content is draft. Replace assets by uploading a new file.
      </p>
      <FormFeedback state={state} />
      <fieldset disabled={pending} className="upload-fields">
        <legend className="sr-only">Upload fields</legend>
        <div className="form-field">
          <label htmlFor="file">File</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="alt_text">Asset description</label>
          <input
            id="alt_text"
            name="alt_text"
            maxLength={400}
            required
            aria-describedby={state.errors?.alt_text ? "alt-error" : undefined}
          />
          {state.errors?.alt_text ? (
            <p id="alt-error" className="field-error">
              {state.errors.alt_text.join(" ")}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="is_public">Make this asset publicly accessible</label>
          <input id="is_public" name="is_public" type="checkbox" />
        </div>
      </fieldset>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload file"}
      </button>
    </form>
  );
}
