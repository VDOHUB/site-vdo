"use client";

import { useState, useTransition } from "react";
import { saveDestaques } from "@/lib/admin/actions";

type Item = { id: string; titulo: string; local: string; destaque: boolean; destaque_ordem: number | null; ordem: number };
const MAX = 12;
const HOME = 3;

export function DestaquesEditor({ obras }: { obras: Item[] }) {
  // `obras` ja chega ordenada por destaque_ordem (posicao atual na Home).
  const [ids, setIds] = useState<string[]>(() => obras.filter((o) => o.destaque).map((o) => o.id));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const byId = new Map(obras.map((o) => [o.id, o]));
  const outras = obras.filter((o) => !ids.includes(o.id));

  const mover = (i: number, d: number) =>
    setIds((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const n = [...cur];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  if (!obras.length) {
    return <p className="adm-empty">Nenhuma obra pronta e publicada ainda. Publique uma obra com status “Pronta” para destacá-la.</p>;
  }

  return (
    <div className="destaques">
      <div className="tbl">
        <table>
          <caption className="sr-only">Obras em destaque, na ordem da Home</caption>
          <tbody>
            {ids.length === 0 && (
              <tr>
                <td className="muted-cell">Nenhum destaque escolhido. A Home mostra um convite para pedir orçamento.</td>
              </tr>
            )}
            {ids.map((id, i) => {
              const o = byId.get(id);
              if (!o) return null;
              return (
                <tr key={id}>
                  <td className="num">{i + 1}</td>
                  <td>
                    {o.titulo}
                    {i >= HOME && <small className="muted-cell"> · fora da Home</small>}
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Subir ${o.titulo}`}>
                      ↑
                    </button>
                    <button type="button" onClick={() => mover(i, 1)} disabled={i === ids.length - 1} aria-label={`Descer ${o.titulo}`}>
                      ↓
                    </button>
                    <button type="button" onClick={() => setIds((c) => c.filter((x) => x !== id))} aria-label={`Tirar ${o.titulo} dos destaques`}>
                      Tirar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {outras.length > 0 && (
        <>
          <h2 className="sub">Outras obras prontas</h2>
          <ul className="pick">
            {outras.map((o) => (
              <li key={o.id}>
                <span>
                  {o.titulo}
                  {o.local && <small className="muted-cell"> · {o.local}</small>}
                </span>
                <button type="button" className="btn sm" disabled={ids.length >= MAX} onClick={() => setIds((c) => [...c, o.id])}>
                  Destacar
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn pri"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setMsg(null);
              const r = await saveDestaques(ids);
              setMsg(r.ok ? { ok: true, text: "Destaques salvos. A Home já foi atualizada." } : { ok: false, text: r.error ?? "Não foi possível salvar." });
            })
          }
        >
          {pending ? "Salvando…" : "Salvar destaques"}
        </button>
        {msg && (
          <span className={msg.ok ? "form-ok-sm" : "form-error"} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
