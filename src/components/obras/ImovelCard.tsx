import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { ObraCard } from "@/components/obras/ObraCard";
import { imovelContactHref, imovelPreco } from "@/lib/obra-view";
import type { Foto, Obra } from "@/lib/types";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Card de imóvel: capa + ficha (preço, área, quartos, vagas) + botão de WhatsApp (some quando vendido). */
export function ImovelCard({ obra }: { obra: Obra & { fotos?: Foto[] } }) {
  const href = imovelContactHref(obra);
  const ficha = [
    obra.area,
    obra.quartos != null ? plural(obra.quartos, "quarto", "quartos") : null,
    obra.vagas != null ? plural(obra.vagas, "vaga", "vagas") : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <article className="imovel">
      <ObraCard obra={obra} hideMeta />
      <div className="imovel-info">
        <p className="imovel-preco">{imovelPreco(obra.preco)}</p>
        {ficha.length > 0 && (
          <ul className="imovel-ficha">
            {ficha.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {href && (
          <a className="btn pri sm" href={href} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="wa-ico" /> Falar no WhatsApp <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
