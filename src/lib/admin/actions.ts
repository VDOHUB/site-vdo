"use server";

// Server Actions do Adm. Regras (ver actions.test.ts):
// 1. A primeira linha de cada action e `await requireAdmin()` (getUser + isAdmin).
// 2. Todo argumento/FormData e validado aqui antes de chegar ao banco.
// 3. Usa so o cliente da sessao do usuario: o RLS (is_admin) continua sendo a ultima barreira.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/auth";
import { isUploadPathFor, validatePhoto } from "@/lib/admin/upload";
import {
  buildDestaqueUpdates,
  isUuid,
  parseLeadStatus,
  slugify,
  uniqueSlug,
  validateObraInput,
  validateRecursoInput,
} from "@/lib/admin/validation";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error?: string; errors?: Record<string, string> };

const BUCKET = "obras";
const MAX_FOTOS = 300;
const MAX_DESTAQUES = 12;
const GENERIC = "Não foi possível salvar agora. Tente novamente.";
const fail = (error: string): ActionResult => ({ ok: false, error });

function revalidatePublic(slug?: string | null) {
  for (const p of ["/", "/catalogo", "/andamento", "/imoveis"]) revalidatePath(p);
  if (slug) revalidatePath(`/catalogo/${slug}`);
  revalidatePath("/admin/obras");
}

/** Remove arquivos enviados pelo Adm (so caminhos uploads/<obraId>/...); falha so e logada. */
async function removeUploads(supabase: SupabaseClient, obraId: string, paths: string[]) {
  const mine = paths.filter((p) => isUploadPathFor(obraId, p));
  if (!mine.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(mine);
  if (error) console.error(`[adm] falha ao apagar ${mine.length} arquivo(s) da obra ${obraId}`);
}

// ---------------------------------------------------------------------------
// Obras
// ---------------------------------------------------------------------------

/** Cria (sem `id`) ou atualiza (com `id`) uma obra. Ao criar, redireciona para a edicao. */
export async function saveObra(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" && idRaw !== "" ? idRaw : null;
  if (id !== null && !isUuid(id)) return fail("Obra inválida.");

  const v = validateObraInput(Object.fromEntries(formData.entries()));
  if (!v.ok) return { ok: false, errors: v.errors };
  const data = v.data;

  if (id) {
    const { data: row, error } = await supabase.from("obras").update(data).eq("id", id).select("id, slug").maybeSingle();
    if (error) {
      console.error("[adm] saveObra update falhou", error.code);
      return fail(GENERIC);
    }
    if (!row) return fail("Obra não encontrada.");
    revalidatePublic((row as { slug: string }).slug);
    return { ok: true, id };
  }

  // Criacao: slug unico derivado do titulo (so [a-z0-9-], entao seguro no LIKE).
  const base = slugify(data.titulo);
  const { data: taken } = await supabase.from("obras").select("slug").like("slug", `${base}%`).limit(1000);
  const { data: last } = await supabase.from("obras").select("ordem").order("ordem", { ascending: false }).limit(1).maybeSingle();
  const ordem = ((last as { ordem: number } | null)?.ordem ?? 0) + 1;
  let slug = uniqueSlug(base, ((taken ?? []) as { slug: string }[]).map((r) => r.slug));

  let created: { id: string } | null = null;
  for (let attempt = 0; attempt < 2 && !created; attempt++) {
    const { data: row, error } = await supabase.from("obras").insert({ ...data, slug, ordem }).select("id").single();
    if (!error) created = row as { id: string };
    else if (error.code === "23505" && attempt === 0) {
      // Corrida com outro cadastro do mesmo titulo: sufixo aleatorio.
      slug = uniqueSlug(`${base.slice(0, 70)}-${crypto.randomUUID().slice(0, 6)}`, []);
    } else {
      console.error("[adm] saveObra insert falhou", error.code);
      return fail(GENERIC);
    }
  }
  if (!created) return fail(GENERIC);
  revalidatePublic(slug);
  redirect(`/admin/obras/${created.id}?nova=1`);
}

export async function togglePublicado(id: string, publicado: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(id) || typeof publicado !== "boolean") return fail("Dados inválidos.");
  const { data, error } = await supabase.from("obras").update({ publicado }).eq("id", id).select("slug").maybeSingle();
  if (error) return fail(GENERIC);
  if (!data) return fail("Obra não encontrada.");
  revalidatePublic((data as { slug: string }).slug);
  return { ok: true, id };
}

export async function deleteObra(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(id)) return fail("Obra inválida.");
  const { data: obra } = await supabase.from("obras").select("slug, obra_fotos(path)").eq("id", id).maybeSingle();
  if (!obra) return fail("Obra não encontrada.");
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) return fail("Não foi possível excluir agora. Tente novamente.");
  const o = obra as { slug: string; obra_fotos: { path: string }[] | null };
  await removeUploads(supabase, id, (o.obra_fotos ?? []).map((f) => f.path));
  revalidatePublic(o.slug);
  redirect("/admin/obras");
}

// ---------------------------------------------------------------------------
// Fotos (o arquivo sobe direto do navegador para o Storage com a sessao do admin;
// aqui so registramos a foto depois de conferir caminho, tipo e tamanho).
// ---------------------------------------------------------------------------

export async function addFoto(obraId: string, path: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(obraId) || typeof path !== "string" || !isUploadPathFor(obraId, path)) return fail("Foto inválida.");

  const { data: obra } = await supabase.from("obras").select("titulo, slug").eq("id", obraId).maybeSingle();
  if (!obra) return fail("Obra não encontrada.");
  const { titulo, slug } = obra as { titulo: string; slug: string };

  // Mesmo arquivo registrado duas vezes: apagar uma linha removeria o arquivo da outra.
  const { data: dup } = await supabase.from("obra_fotos").select("id").eq("path", path).maybeSingle();
  if (dup) return fail("Esta foto já foi adicionada.");

  // Confere o objeto no Storage (o bucket tambem limita tipo e tamanho).
  const folder = `uploads/${obraId}`;
  const name = path.slice(folder.length + 1);
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(folder, { search: name, limit: 10 });
  const file = files?.find((f) => f.name === name);
  if (listError || !file) return fail("A foto não chegou ao servidor. Tente enviar de novo.");
  const meta = (file.metadata ?? {}) as { mimetype?: string; size?: number };
  const check = validatePhoto({ type: meta.mimetype ?? "", size: Number(meta.size) });
  if (!check.ok) {
    await removeUploads(supabase, obraId, [path]);
    return fail(check.error);
  }

  const { data: fotos } = await supabase.from("obra_fotos").select("ordem").eq("obra_id", obraId);
  const list = (fotos ?? []) as { ordem: number }[];
  if (list.length >= MAX_FOTOS) return fail(`Limite de ${MAX_FOTOS} fotos por obra.`);
  const ordem = list.reduce((m, f) => Math.max(m, f.ordem), 0) + 1;

  const { data: row, error } = await supabase
    .from("obra_fotos")
    .insert({ obra_id: obraId, path, ordem, alt: `${titulo}, foto ${ordem}`.slice(0, 300) })
    .select("id")
    .single();
  if (error || !row) {
    console.error("[adm] addFoto falhou", error?.code);
    return fail(GENERIC);
  }
  revalidatePublic(slug);
  revalidatePath(`/admin/obras/${obraId}`);
  return { ok: true, id: (row as { id: string }).id };
}

export async function deleteFoto(fotoId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(fotoId)) return fail("Foto inválida.");
  const { data: foto } = await supabase.from("obra_fotos").select("obra_id, path, obras(slug)").eq("id", fotoId).maybeSingle();
  if (!foto) return fail("Foto não encontrada.");
  const f = foto as unknown as { obra_id: string; path: string; obras: { slug: string } | null };
  const { error } = await supabase.from("obra_fotos").delete().eq("id", fotoId);
  if (error) return fail("Não foi possível remover agora. Tente novamente.");
  await removeUploads(supabase, f.obra_id, [f.path]);
  revalidatePublic(f.obras?.slug);
  revalidatePath(`/admin/obras/${f.obra_id}`);
  return { ok: true };
}

/** `ids` = todas as fotos da obra na nova ordem. */
export async function reorderFotos(obraId: string, ids: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(obraId) || !Array.isArray(ids) || ids.length > MAX_FOTOS || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
    return fail("Ordem inválida.");
  }
  const { data: fotos } = await supabase.from("obra_fotos").select("id").eq("obra_id", obraId);
  const current = new Set(((fotos ?? []) as { id: string }[]).map((f) => f.id));
  if (current.size !== ids.length || !ids.every((id) => current.has(id))) return fail("A lista de fotos mudou. Recarregue a página.");
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("obra_fotos").update({ ordem: i + 1 }).eq("id", id).eq("obra_id", obraId)),
  );
  if (results.some((r) => r.error)) return fail(GENERIC);
  const { data: obra } = await supabase.from("obras").select("slug").eq("id", obraId).maybeSingle();
  revalidatePublic((obra as { slug: string } | null)?.slug);
  revalidatePath(`/admin/obras/${obraId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Mensagens (leads)
// ---------------------------------------------------------------------------

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const s = parseLeadStatus(status);
  if (!isUuid(id) || !s) return fail("Dados inválidos.");
  const { data, error } = await supabase.from("leads").update({ status: s }).eq("id", id).select("id").maybeSingle();
  if (error) return fail(GENERIC);
  if (!data) return fail("Mensagem não encontrada.");
  revalidatePath("/admin/mensagens");
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Recursos internos
// ---------------------------------------------------------------------------

export async function saveRecurso(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" && idRaw !== "" ? idRaw : null;
  if (id !== null && !isUuid(id)) return fail("Recurso inválido.");
  const v = validateRecursoInput(Object.fromEntries(formData.entries()));
  if (!v.ok) return { ok: false, errors: v.errors };

  const q = id
    ? supabase.from("recursos_internos").update(v.data).eq("id", id).select("id").maybeSingle()
    : supabase.from("recursos_internos").insert(v.data).select("id").single();
  const { data, error } = await q;
  if (error) {
    console.error("[adm] saveRecurso falhou", error.code);
    return fail(GENERIC);
  }
  if (!data) return fail("Recurso não encontrado.");
  revalidatePath("/admin/recursos");
  return { ok: true, id: (data as { id: string }).id };
}

export async function deleteRecurso(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!isUuid(id)) return fail("Recurso inválido.");
  const { error } = await supabase.from("recursos_internos").delete().eq("id", id);
  if (error) return fail("Não foi possível excluir agora. Tente novamente.");
  revalidatePath("/admin/recursos");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Destaques da Home: `ids` em ordem; as demais obras deixam de ser destaque.
// ---------------------------------------------------------------------------

export async function saveDestaques(ids: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const updates = Array.isArray(ids) && ids.length <= MAX_DESTAQUES && ids.every(isUuid) ? buildDestaqueUpdates(ids) : null;
  if (!updates) return fail("Seleção inválida.");

  // A ordem da Home fica em `destaque_ordem` (1..n); `ordem` (catalogo) nao e tocada.
  if (ids.length) {
    const { data: escolhidas, error: e0 } = await supabase.from("obras").select("id").in("id", ids);
    if (e0) return fail(GENERIC);
    if ((escolhidas ?? []).length !== ids.length) return fail("Alguma obra escolhida não existe mais. Recarregue a página.");
  }
  const { data: atuais, error: e1 } = await supabase.from("obras").select("id").eq("destaque", true);
  if (e1) return fail(GENERIC);
  const remover = ((atuais ?? []) as { id: string }[]).map((o) => o.id).filter((id) => !ids.includes(id));
  if (remover.length) {
    const { error } = await supabase.from("obras").update({ destaque: false, destaque_ordem: null }).in("id", remover);
    if (error) return fail(GENERIC);
  }
  const results = await Promise.all(
    updates.map((u) => supabase.from("obras").update({ destaque: true, destaque_ordem: u.destaque_ordem }).eq("id", u.id)),
  );
  if (results.some((r) => r.error)) return fail(GENERIC);
  revalidatePublic();
  revalidatePath("/admin/destaques");
  return { ok: true };
}
