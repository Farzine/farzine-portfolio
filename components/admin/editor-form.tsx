"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { EditorAction } from "@/lib/validations/admin";

export type FieldSpec<Name extends string = string> = {
  name: Name;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "url"
    | "number"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  maxLength?: number;
  hint?: string;
  autoComplete?: string;
  options?: { value: string; label: string }[];
};
export function EditorForm({
  action,
  fields = [],
  initial = {},
  hidden = {},
  submitLabel,
  protectChanges = true,
  resetOnSuccess = false,
}: {
  action: EditorAction;
  fields?: FieldSpec[];
  initial?: Record<string, string | boolean>;
  hidden?: Record<string, string>;
  submitLabel: string;
  protectChanges?: boolean;
  resetOnSuccess?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [values, setValues] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const id = useId();
  const status = useRef<HTMLParagraphElement>(null);
  const initialRevision = useRef(hidden.revision);
  const initialFields = useRef(initial);
  useEffect(() => {
    if (state.message) {
      if (state.ok) {
        setDirty(false);
        if (resetOnSuccess) setValues(initialFields.current);
      }
      status.current?.focus();
    }
  }, [state, resetOnSuccess]);
  useEffect(() => {
    if (!dirty || !protectChanges) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        link &&
        !window.confirm("You have unsaved changes. Leave this page?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, protectChanges]);
  return (
    <form action={submit} className="admin-form">
      {Object.entries(hidden).map(([key, value]) => (
        <input
          key={key}
          type="hidden"
          name={key}
          value={
            key === "revision"
              ? state.revision || initialRevision.current || value
              : value
          }
        />
      ))}
      <fieldset disabled={pending}>
        <legend className="sr-only">{submitLabel}</legend>
        {fields.map((field) => {
          const fieldId = `${id}-${field.name}`;
          const errors = state.errors?.[field.name];
          const common = {
            id: fieldId,
            name: field.name,
            required: field.required,
            "aria-invalid": !!errors,
            "aria-describedby": `${fieldId}-hint ${fieldId}-error`,
          };
          const change = (value: string | boolean) => {
            setValues((current) => ({ ...current, [field.name]: value }));
            setDirty(true);
          };
          return (
            <div className="admin-field" key={field.name}>
              <label htmlFor={fieldId}>
                {field.label}
                {field.required ? " (required)" : ""}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  {...common}
                  rows={
                    field.name === "biography" || field.name === "paragraphs"
                      ? 7
                      : 3
                  }
                  maxLength={field.maxLength}
                  value={String(values[field.name] ?? "")}
                  onChange={(event) => change(event.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  {...common}
                  value={String(values[field.name] ?? "")}
                  onChange={(event) => change(event.target.value)}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  {...common}
                  type="checkbox"
                  checked={values[field.name] === true}
                  onChange={(event) => change(event.target.checked)}
                />
              ) : (
                <input
                  {...common}
                  type={field.type || "text"}
                  maxLength={field.maxLength}
                  autoComplete={field.autoComplete}
                  min={field.type === "number" ? 0 : undefined}
                  max={field.type === "number" ? 9999999 : undefined}
                  value={String(values[field.name] ?? "")}
                  onChange={(event) => change(event.target.value)}
                />
              )}
              <small id={`${fieldId}-hint`}>{field.hint}</small>
              <span className="admin-field-error" id={`${fieldId}-error`}>
                {errors?.join(" ")}
              </span>
            </div>
          );
        })}
        <button type="submit">{pending ? "Please wait…" : submitLabel}</button>
      </fieldset>
      <p
        ref={status}
        role="status"
        tabIndex={-1}
        className={state.ok === false ? "admin-error" : "admin-status"}
      >
        {state.message}
      </p>
      {dirty && protectChanges && <small>Unsaved changes</small>}
    </form>
  );
}
