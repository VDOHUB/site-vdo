"use client";

import { useActionState } from "react";
import { submitLead } from "@/app/contato/actions";
import { LIMITS, TOPICOS, type LeadState } from "@/lib/leads";

const INITIAL: LeadState = { status: "idle" };

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <span id={id} className="field-error">
      {msg}
    </span>
  ) : null;
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitLead, INITIAL);
  const err = state.errors ?? {};

  if (state.status === "ok") {
    return (
      <p role="status" className="form-ok">
        Enviado com sucesso! Em breve retornaremos o contato.
      </p>
    );
  }

  return (
    <form action={action} className="contact-form" noValidate>
      <fieldset className="chips-set" aria-describedby={err.topico ? "err-topico" : undefined}>
        <legend>Assunto</legend>
        <div className="chips" role="radiogroup" aria-label="Assunto">
          {TOPICOS.map((t, i) => (
            <label key={t} className="chip chip-radio">
              <input type="radio" name="topico" value={t} defaultChecked={i === 0} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        <FieldError id="err-topico" msg={err.topico} />
      </fieldset>

      <label htmlFor="cf-nome">Nome</label>
      <input
        id="cf-nome"
        name="nome"
        autoComplete="name"
        maxLength={LIMITS.nome}
        placeholder="Seu nome"
        aria-invalid={err.nome ? true : undefined}
        aria-describedby={err.nome ? "err-nome" : undefined}
      />
      <FieldError id="err-nome" msg={err.nome} />

      <label htmlFor="cf-whatsapp">WhatsApp</label>
      <input
        id="cf-whatsapp"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={30}
        placeholder="(62) 90000-0000"
        aria-invalid={err.whatsapp ? true : undefined}
        aria-describedby={err.whatsapp ? "err-whatsapp" : undefined}
      />
      <FieldError id="err-whatsapp" msg={err.whatsapp} />

      <label htmlFor="cf-mensagem">Mensagem</label>
      <textarea
        id="cf-mensagem"
        name="mensagem"
        rows={5}
        maxLength={LIMITS.mensagem}
        placeholder="Conte sobre a sua obra"
        aria-invalid={err.mensagem ? true : undefined}
        aria-describedby={err.mensagem ? "err-mensagem" : undefined}
      />
      <FieldError id="err-mensagem" msg={err.mensagem} />

      {/* Honeypot: invisivel para pessoas e leitores de tela; robos preenchem. */}
      <div className="hp" aria-hidden="true">
        <label>
          Não preencha este campo
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {err.form ? (
        <p role="alert" className="form-error">
          {err.form}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="btn pri" type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
