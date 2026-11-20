"use client";

import { useState, useTransition } from "react";
import { saveObra, type ActionResult } from "@/lib/admin/actions";
import { OBRA_LIMITS } from "@/lib/admin/validation";
import type { Obra } from "@/lib/types";

const STATUS: { value: Obra["status"]; label: string }[] = [
  { value: "pronta", label: "Pronta (Catálogo de Obras)" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "a_venda", label: "À venda (Imóveis)" },
  { value: "vendido", label: "Vendido (Imóveis)" },
];

function Err({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <small id={id} className="field-error">
      {msg}
    </small>
  ) : null;
}

/** Formulario de obra. Sem `obra` cria (e a action leva para a edicao, onde entram as fotos). */
export function ObraForm({ obra }: { obra?: Obra }) {
  const [status, setStatus] = useState<Obra["status"]>(obra?.status ?? "pronta");
  const [publicado, setPublicado] = useState<boolean>(obra?.publicado ?? true);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const errors = (result && !result.ok && result.errors) || {};
  const imovel = status === "a_venda" || status === "vendido";

  const field = (name: string) => ({
    name,
    id: `f-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `e-${name}` : undefined,
  });

  return (
    <form
      className="edit"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          setResult(null);
          setResult(await saveObra(fd));
        });
      }}
    >
      {obra && <input type="hidden" name="id" value={obra.id} />}
      <label className="full" htmlFor="f-titulo">
        Título
        <input {...field("titulo")} required maxLength={OBRA_LIMITS.titulo} defaultValue={obra?.titulo} placeholder="Ex.: Residência Jardim Alexandrina" />
        <Err id="e-titulo" msg={errors.titulo} />
      </label>
      <label htmlFor="f-status">
        Status
        <select {...field("status")} value={status} onChange={(e) => setStatus(e.target.value as Obra["status"])}>
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Err id="e-status" msg={errors.status} />
      </label>
      <label htmlFor="f-tipo">
        Tipo
        <select {...field("tipo")} defaultValue={obra?.tipo ?? "residencial"}>
          <option value="residencial">Residencial</option>
          <option value="corporativo">Corporativo</option>
        </select>
        <Err id="e-tipo" msg={errors.tipo} />
      </label>
      <label htmlFor="f-local">
        Local
        <input {...field("local")} maxLength={OBRA_LIMITS.local} defaultValue={obra?.local} placeholder="Bairro, cidade" />
        <Err id="e-local" msg={errors.local} />
      </label>
      <label htmlFor="f-progresso" hidden={status !== "em_andamento"}>
        Progresso (%)
        <input {...field("progresso")} type="number" inputMode="numeric" min={0} max={100} step={1} defaultValue={obra?.progresso ?? ""} placeholder="0 a 100" />
        <Err id="e-progresso" msg={errors.progresso} />
      </label>
      <fieldset className="full imovel" hidden={!imovel}>
        <legend>Dados do imóvel</legend>
        <label htmlFor="f-preco">
          Preço
          <input {...field("preco")} maxLength={OBRA_LIMITS.preco} defaultValue={obra?.preco ?? ""} placeholder="Sob consulta" />
          <Err id="e-preco" msg={errors.preco} />
        </label>
        <label htmlFor="f-area">
          Área
          <input {...field("area")} maxLength={OBRA_LIMITS.area} defaultValue={obra?.area ?? ""} placeholder="120 m²" />
          <Err id="e-area" msg={errors.area} />
        </label>
        <label htmlFor="f-quartos">
          Quartos
          <input {...field("quartos")} type="number" inputMode="numeric" min={0} max={99} step={1} defaultValue={obra?.quartos ?? ""} />
          <Err id="e-quartos" msg={errors.quartos} />
        </label>
        <label htmlFor="f-vagas">
          Vagas
          <input {...field("vagas")} type="number" inputMode="numeric" min={0} max={99} step={1} defaultValue={obra?.vagas ?? ""} />
          <Err id="e-vagas" msg={errors.vagas} />
        </label>
      </fieldset>
      <label className="full" htmlFor="f-descricao">
        Descrição
        <textarea {...field("descricao")} rows={4} maxLength={OBRA_LIMITS.descricao} defaultValue={obra?.descricao} />
        <Err id="e-descricao" msg={errors.descricao} />
      </label>
      <label className="full check">
        <input type="checkbox" name="publicado" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} />
        Publicar no site
        <small>{publicado ? "Visível para todos assim que salvar." : "Fica como rascunho, só a equipe vê."}</small>
      </label>
      <div className="full form-actions">
        <button className="btn pri" type="submit" disabled={pending}>
          {pending ? "Salvando…" : obra ? "Salvar alterações" : publicado ? "Criar e publicar" : "Criar rascunho"}
        </button>
        {result?.ok && (
          <span className="form-ok-sm" role="status">
            Salvo. {publicado ? "Já aparece no site." : "Rascunho atualizado."}
          </span>
        )}
        {result && !result.ok && (
          <span className="form-error" role="alert">
            {result.error ?? "Revise os campos destacados."}
          </span>
        )}
      </div>
    </form>
  );
}
