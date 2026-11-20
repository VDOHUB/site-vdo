"use client";

import { useState, useTransition } from "react";
import { deleteRecurso, saveRecurso, type ActionResult } from "@/lib/admin/actions";
import { RECURSO_LIMITS, type RecursoTipo } from "@/lib/admin/validation";

export type Recurso = { id: string; titulo: string; descricao: string; url: string | null; tipo: RecursoTipo; ordem: number };

const ACAO: Record<RecursoTipo, string> = { link: "Abrir →", download: "Baixar / instruções", instrucoes: "Ver instruções" };

function RecursoForm({ recurso, ordem, onDone }: { recurso?: Recurso; ordem: number; onDone: () => void }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const errors = (result && !result.ok && result.errors) || {};
  const sfx = recurso?.id ?? "novo";
  return (
    <form
      className="tool-form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await saveRecurso(fd);
          setResult(r);
          if (r.ok) onDone();
        });
      }}
    >
      {recurso && <input type="hidden" name="id" value={recurso.id} />}
      <input type="hidden" name="ordem" value={recurso?.ordem ?? ordem} />
      <label>
        Título
        <input name="titulo" required maxLength={RECURSO_LIMITS.titulo} defaultValue={recurso?.titulo} aria-invalid={errors.titulo ? true : undefined} />
        {errors.titulo && <small className="field-error">{errors.titulo}</small>}
      </label>
      <label>
        Descrição
        <textarea name="descricao" rows={2} maxLength={RECURSO_LIMITS.descricao} defaultValue={recurso?.descricao} />
        {errors.descricao && <small className="field-error">{errors.descricao}</small>}
      </label>
      <label>
        Endereço (https://…)
        <input name="url" type="url" inputMode="url" maxLength={RECURSO_LIMITS.url} defaultValue={recurso?.url ?? ""} placeholder="https://" aria-invalid={errors.url ? true : undefined} id={`url-${sfx}`} />
        {errors.url && <small className="field-error">{errors.url}</small>}
      </label>
      <label>
        Tipo
        <select name="tipo" defaultValue={recurso?.tipo ?? "link"}>
          <option value="link">Link (abre o sistema)</option>
          <option value="download">Download</option>
          <option value="instrucoes">Instruções</option>
        </select>
      </label>
      <div className="form-actions">
        <button className="btn pri sm" type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button className="btn sm" type="button" onClick={onDone}>
          Cancelar
        </button>
        {recurso && (
          <button
            className="btn sm danger"
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Excluir o atalho "${recurso.titulo}"?`)) return;
              start(async () => {
                const r = await deleteRecurso(recurso.id);
                setResult(r);
                if (r.ok) onDone();
              });
            }}
          >
            Excluir
          </button>
        )}
      </div>
      {result && !result.ok && result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
    </form>
  );
}

export function RecursoCard({ recurso }: { recurso: Recurso }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <div className="tool">
        <RecursoForm recurso={recurso} ordem={recurso.ordem} onDone={() => setEditando(false)} />
      </div>
    );
  }
  return (
    <div className="tool">
      <b>{recurso.titulo}</b>
      {recurso.descricao && <small className="tool-desc">{recurso.descricao}</small>}
      <div className="tool-actions">
        {recurso.url && (
          <a className="btn sm" href={recurso.url} target="_blank" rel="noopener noreferrer">
            {ACAO[recurso.tipo]}
          </a>
        )}
        <button type="button" className="btn sm ghost-btn" onClick={() => setEditando(true)} aria-label={`Editar ${recurso.titulo}`}>
          Editar
        </button>
      </div>
    </div>
  );
}

export function NovoRecurso({ proximaOrdem }: { proximaOrdem: number }) {
  const [aberto, setAberto] = useState(false);
  if (aberto) {
    return (
      <div className="tool">
        <RecursoForm ordem={proximaOrdem} onDone={() => setAberto(false)} />
      </div>
    );
  }
  return (
    <button type="button" className="tool tool-add" onClick={() => setAberto(true)}>
      <b>+ Adicionar atalho</b>
      <small>A equipe cadastra novos recursos sem programar.</small>
    </button>
  );
}
