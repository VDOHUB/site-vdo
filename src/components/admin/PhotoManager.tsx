"use client";

import Image from "next/image";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { addFoto, deleteFoto, reorderFotos } from "@/lib/admin/actions";
import { prepareImage } from "@/lib/admin/resize";
import { uploadPath } from "@/lib/admin/upload";
import { photoUrl } from "@/lib/photo";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Foto } from "@/lib/types";

type Envio = { key: string; nome: string; estado: "enviando" | "ok" | "erro"; erro?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Fotos da obra: arrastar e soltar (ou escolher), reduzir no navegador, enviar direto
 * ao Storage com a sessao do admin (uploads/<obraId>/<uuid>.<ext>) e registrar pela
 * Server Action `addFoto`, que confere caminho, tipo e tamanho de novo.
 */
export function PhotoManager({ obraId, fotos }: { obraId: string; fotos: Foto[] }) {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [drag, setDrag] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [lista, setOtimista] = useOptimistic(fotos);
  const busy = useRef(false);

  const atualizar = (key: string, patch: Partial<Envio>) =>
    setEnvios((all) => all.map((e) => (e.key === key ? { ...e, ...patch } : e)));

  async function enviar(files: File[]) {
    if (!files.length || busy.current) return;
    busy.current = true;
    const novos = files.map((f, i) => ({ key: `${Date.now()}-${i}`, nome: f.name, estado: "enviando" as const }));
    setEnvios((all) => [...novos, ...all].slice(0, 30));
    const supabase = createBrowserClient();
    for (let i = 0; i < files.length; i++) {
      const key = novos[i].key;
      const prep = await prepareImage(files[i]);
      if (!prep.ok) {
        atualizar(key, { estado: "erro", erro: prep.error });
        continue;
      }
      const path = uploadPath(obraId, crypto.randomUUID(), prep.type);
      const { error } = await supabase.storage
        .from("obras")
        .upload(path, prep.blob, { contentType: prep.type, upsert: false, cacheControl: "31536000" });
      if (error) {
        atualizar(key, { estado: "erro", erro: "Falha no envio. Verifique a conexão e tente de novo." });
        continue;
      }
      const r = await addFoto(obraId, path);
      if (!r.ok) {
        await supabase.storage.from("obras").remove([path]);
        atualizar(key, { estado: "erro", erro: r.error ?? "Não foi possível registrar a foto." });
        continue;
      }
      atualizar(key, { estado: "ok" });
    }
    busy.current = false;
  }

  function mover(index: number, delta: number) {
    const alvo = index + delta;
    if (alvo < 0 || alvo >= lista.length) return;
    const nova = [...lista];
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    start(async () => {
      setErro(null);
      setOtimista(nova);
      const r = await reorderFotos(obraId, nova.map((f) => f.id));
      if (!r.ok) setErro(r.error ?? "Não foi possível reordenar.");
    });
  }

  function remover(foto: Foto) {
    if (!window.confirm("Remover esta foto do site? O arquivo enviado também é apagado.")) return;
    start(async () => {
      setErro(null);
      setOtimista(lista.filter((f) => f.id !== foto.id));
      const r = await deleteFoto(foto.id);
      if (!r.ok) setErro(r.error ?? "Não foi possível remover.");
    });
  }

  const enviando = envios.some((e) => e.estado === "enviando");

  return (
    <div className="photos">
      <label
        className={`drop${drag ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void enviar(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-label="Escolher fotos"
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            e.currentTarget.value = "";
            void enviar(files);
          }}
        />
        <b>Arraste as fotos aqui ou clique para escolher.</b>
        <small>JPG, PNG, WebP ou AVIF. O site reduz para até 2400 px e 6 MB antes de enviar.</small>
      </label>

      {envios.length > 0 && (
        <ul className="uploads" aria-live="polite">
          {envios.map((e) => (
            <li key={e.key} className={e.estado}>
              <span>{e.nome}</span>
              <span>{e.estado === "enviando" ? "Enviando…" : e.estado === "ok" ? "Enviada" : e.erro}</span>
            </li>
          ))}
        </ul>
      )}
      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      {lista.length === 0 ? (
        <p className="adm-empty">{enviando ? "Enviando fotos…" : "Nenhuma foto ainda. A primeira foto vira a capa no site."}</p>
      ) : (
        <ol className="thumbs" aria-busy={pending}>
          {lista.map((f, i) => (
            <li key={f.id}>
              <div className="thumb">
                <Image src={photoUrl(f.path, 800)} alt={f.alt} fill unoptimized sizes="200px" />
                {i === 0 && <span className="pill thumb-cover">Capa</span>}
              </div>
              <div className="thumb-actions">
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0 || pending} aria-label={`Mover foto ${i + 1} para antes`}>
                  ←
                </button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === lista.length - 1 || pending} aria-label={`Mover foto ${i + 1} para depois`}>
                  →
                </button>
                <button type="button" className="rm" onClick={() => remover(f)} disabled={pending} aria-label={`Remover foto ${i + 1}`}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
