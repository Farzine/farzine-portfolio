"use client";
import { useActionState } from "react";
import { loginAction, logoutAction } from "@/app/admin/actions";
import { FormFeedback } from "./editor";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="login-form">
      <FormFeedback state={state} />
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
        />
        {state.errors?.email ? (
          <p id="email-error" className="field-error">
            {state.errors.email.join(" ")}
          </p>
        ) : null}
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          aria-invalid={Boolean(state.errors?.password)}
          aria-describedby={
            state.errors?.password ? "password-error" : undefined
          }
        />
        {state.errors?.password ? (
          <p id="password-error" className="field-error">
            {state.errors.password.join(" ")}
          </p>
        ) : null}
      </div>
      <button type="submit" className="button" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="field-help">
        Owner accounts are provisioned privately. There is no public sign-up.
      </p>
    </form>
  );
}
export function LogoutForm() {
  const [state, action, pending] = useActionState(logoutAction, {});
  return (
    <form action={action}>
      <button
        type="submit"
        className="button secondary compact"
        disabled={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
