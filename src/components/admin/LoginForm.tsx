"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="adm-form">
      <label>
        E-mail
        <input name="email" type="email" autoComplete="username" required maxLength={320} defaultValue={state.email ?? ""} />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required maxLength={1000} />
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn pri" type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
