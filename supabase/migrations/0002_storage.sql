-- 0002_storage: bucket publico "obras" para as fotos.
--
-- Leitura: bucket publico, arquivos servidos pela URL publica
--   (/storage/v1/object/public/obras/<path>), que nao passa pelo RLS.
--   Nao ha policy de SELECT para anon/usuario comum em storage.objects: assim ninguem
--   lista o bucket (nomes de fotos de obras nao publicadas nao vazam).
-- Escrita: so admin (is_admin()) envia, altera ou apaga arquivos do bucket.
-- Limites validados pelo proprio Storage: 6 MB e somente jpeg/png/webp/avif.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'obras',
  'obras',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "obras bucket: admin lista" on storage.objects
  for select to authenticated
  using (bucket_id = 'obras' and (select public.is_admin()));

create policy "obras bucket: admin envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'obras' and (select public.is_admin()));

create policy "obras bucket: admin atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'obras' and (select public.is_admin()))
  with check (bucket_id = 'obras' and (select public.is_admin()));

create policy "obras bucket: admin apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'obras' and (select public.is_admin()));
