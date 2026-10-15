"use client";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import type { EditorField } from "@/lib/admin/fields";
import type { FormState } from "@/lib/admin/form-state";
export function FormFeedback({ state }: { state: FormState }) {
  return (
    <div className="form-feedback" aria-live="polite" aria-atomic="true">
      {state.error ? (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
    </div>
  );
}
export function ContentEditor({
  action,
  fields,
  values,
  images,
  id,
  version,
  savedPath = "/admin/projects",
  preview = true,
  idPrefix = "",
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  fields: readonly EditorField[];
  values: Record<string, string | number | boolean | undefined>;
  images: readonly string[];
  id?: string;
  version?: string;
  savedPath?: string | null;
  preview?: boolean;
  idPrefix?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState(values);
  const [baseline, setBaseline] = useState(values);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.version) {
      setDirty(false);
      if (state.values) {
        setDraft(state.values);
        setBaseline(state.values);
      }
    }
  }, [state.version, state.values]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (link && !window.confirm("Leave without saving your changes?"))
        event.preventDefault();
    };
    const submit = (event: SubmitEvent) => {
      if (
        event.target !== formRef.current &&
        !window.confirm("Leave without saving your changes?")
      )
        event.preventDefault();
    };
    document.addEventListener("submit", submit, true);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
      document.removeEventListener("submit", submit, true);
    };
  }, [dirty]);
  const savedId = state.id ?? id;
  return (
    <form ref={formRef} action={formAction} className="editor-form">
      <input type="hidden" name="id" value={savedId ?? ""} />
      <input
        type="hidden"
        name="version"
        value={state.version ?? version ?? ""}
      />
      <FormFeedback state={pending ? {} : state} />
      {dirty ? <p className="muted small">Unsaved changes</p> : null}
      <fieldset disabled={pending}>
        <legend className="sr-only">Content fields</legend>
        <div className="editor-grid">
          {fields.map((field) => {
            const value = draft[field.name];
            const errors = state.errors?.[field.name];
            const inputId = `${idPrefix}${field.name}`;
            const helpId = `${inputId}-help`;
            const errorId = `${inputId}-error`;
            const common = {
              id: inputId,
              name: field.name,
              required: field.required,
              onChange: (
                event: ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >,
              ) => {
                const target = event.currentTarget;
                setDraft((previous) => ({
                  ...previous,
                  [field.name]:
                    target instanceof HTMLInputElement &&
                    target.type === "checkbox"
                      ? target.checked
                      : target.value,
                }));
                setDirty(true);
              },
              "aria-invalid": errors ? true : undefined,
              "aria-describedby":
                [field.help ? helpId : "", errors ? errorId : ""]
                  .filter(Boolean)
                  .join(" ") || undefined,
            };
            return (
              <div
                className={`form-field ${["textarea", "lines"].includes(field.kind ?? "") ? "wide" : ""}`}
                key={field.name}
              >
                <label htmlFor={inputId}>
                  {field.label}
                  {field.required ? <span aria-hidden="true"> *</span> : null}
                </label>
                {field.kind === "checkbox" ? (
                  <input {...common} type="checkbox" checked={value === true} />
                ) : ["textarea", "lines"].includes(field.kind ?? "") ? (
                  <textarea
                    {...common}
                    rows={
                      field.name === "details" || field.name === "biography"
                        ? 8
                        : 3
                    }
                    maxLength={field.maxLength}
                    value={String(value ?? "")}
                  />
                ) : field.kind === "select" || field.kind === "image" ? (
                  <select {...common} value={String(value ?? "")}>
                    {field.kind === "image" ? (
                      <>
                        <option value="">No image</option>
                        {images.map((image) => (
                          <option value={image} key={image}>
                            {image.replace("/assets/img/", "")}
                          </option>
                        ))}
                      </>
                    ) : (
                      field.options?.map((option) => (
                        <option
                          key={
                            typeof option === "string" ? option : option.value
                          }
                          value={
                            typeof option === "string" ? option : option.value
                          }
                        >
                          {typeof option === "string" ? option : option.label}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={field.kind ?? "text"}
                    min={field.kind === "number" ? 0 : undefined}
                    max={field.kind === "number" ? 10000 : undefined}
                    step={field.kind === "number" ? 1 : undefined}
                    maxLength={field.maxLength}
                    value={String(value ?? "")}
                  />
                )}
                {field.help ? (
                  <p id={helpId} className="field-help">
                    {field.help}
                  </p>
                ) : null}
                {errors ? (
                  <p id={errorId} className="field-error">
                    {errors.join(" ")}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>
      <div className="editor-actions">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={pending}
          onClick={() => {
            if (!dirty || window.confirm("Discard unsaved changes?")) {
              setDraft(baseline);
              setDirty(false);
            }
          }}
        >
          Reset unsaved changes
        </button>
        {savedId && savedPath ? (
          <>
            <Link className="text-link" href={`${savedPath}/${savedId}`}>
              Open saved {preview ? "project" : "item"}
            </Link>
            {preview ? (
              <Link
                className="text-link"
                href={`${savedPath}/${savedId}/preview`}
              >
                Preview saved content
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </form>
  );
}
