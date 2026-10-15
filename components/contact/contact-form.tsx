"use client";
import { useActionState, useState, useEffect } from "react";
import { contactAction } from "@/app/contact-actions";
export function ContactForm() {
  const [state, action, pending] = useActionState(contactAction, {});
  const [draft, setDraft] = useState({ name: "", email: "", message: "" });
  useEffect(() => {
    if (state.success) setDraft({ name: "", email: "", message: "" });
  }, [state]);
  return (
    <form action={action} className="editor-form contact-form">
      <p className="muted small">
        Messages are stored privately for the owner. Email notifications are not
        enabled.
      </p>
      <div aria-live="polite" aria-atomic="true">
        {!pending && state.error ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}
        {!pending && state.success ? (
          <p className="form-success">{state.success}</p>
        ) : null}
      </div>
      <fieldset disabled={pending}>
        <legend className="sr-only">Contact message</legend>
        {(["name", "email", "message"] as const).map((name) => (
          <div className="form-field" key={name}>
            <label htmlFor={`contact-${name}`}>
              {name === "name"
                ? "Your name"
                : name === "email"
                  ? "Your email"
                  : "Message"}
            </label>
            {name === "message" ? (
              <textarea
                id={`contact-${name}`}
                name={name}
                rows={5}
                required
                minLength={10}
                maxLength={5000}
                value={draft[name]}
                onChange={(event) =>
                  setDraft({ ...draft, [name]: event.target.value })
                }
                aria-invalid={state.errors?.[name] ? true : undefined}
                aria-describedby={
                  state.errors?.[name] ? `contact-${name}-error` : undefined
                }
              />
            ) : (
              <input
                id={`contact-${name}`}
                name={name}
                type={name === "email" ? "email" : "text"}
                required
                maxLength={name === "email" ? 254 : 120}
                autoComplete={name}
                value={draft[name]}
                onChange={(event) =>
                  setDraft({ ...draft, [name]: event.target.value })
                }
                aria-invalid={state.errors?.[name] ? true : undefined}
                aria-describedby={
                  state.errors?.[name] ? `contact-${name}-error` : undefined
                }
              />
            )}{" "}
            {state.errors?.[name] ? (
              <p id={`contact-${name}-error`} className="field-error">
                {state.errors[name].join(" ")}
              </p>
            ) : null}
          </div>
        ))}
        <div className="contact-trap" aria-hidden="true">
          <label htmlFor="contact-company">Leave this field empty</label>
          <input
            id="contact-company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </fieldset>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Storing…" : "Store message for owner"}
      </button>
    </form>
  );
}
