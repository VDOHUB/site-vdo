# React Bits

Componentes de [React Bits](https://reactbits.dev) (David Haz, github.com/DavidHDev/react-bits),
variante **TypeScript + Tailwind**. Licença do projeto: MIT + Commons Clause.

Instalados a partir do registry oficial (formato shadcn). O conteúdo de cada arquivo é o campo
`files[0].content` do JSON abaixo, copiado sem alteração, com um cabeçalho de atribuição.
Não usamos `npx shadcn add` porque ele exige `shadcn init` (components.json e reescrita do
CSS/Tailwind do projeto); o resultado é o mesmo arquivo.

| Componente | Origem | Dependências npm | Uso no site |
| --- | --- | --- | --- |
| `BlurText.tsx` | https://reactbits.dev/r/BlurText-TS-TW.json | `motion` | Título do hero (`Hero`) |
| `ScrollVelocity.tsx` | https://reactbits.dev/r/ScrollVelocity-TS-TW.json | `motion` | Faixa de valores (`ValuesMarquee`) |
| `SpotlightCard.tsx` | https://reactbits.dev/r/SpotlightCard-TS-TW.json | nenhuma | Cards do ecossistema (`EcosystemCard`) |
| `TiltedCard.tsx` | https://reactbits.dev/r/TiltedCard-TS-TW.json | nenhuma | Cards de obra (`ObraCard`) |

Todos já são client components (`'use client'`) e foram verificados com Next 16 / React 19.

## Alterações locais

- `BlurText.tsx`: prop `as` (`'p' | 'span' | 'div'`, padrão `'p'`) para poder ficar dentro do
  `<h1>` sem aninhar `<p>` em heading. Nada mais mudou.

## Lint

As regras `react-hooks/refs`, `react-hooks/set-state-in-effect` e `@next/next/no-img-element`
estão desligadas só para esta pasta (`eslint.config.mjs`), para manter o código igual ao upstream.

## Atualizar

```sh
curl -sSL https://reactbits.dev/r/<Nome>-TS-TW.json
```

e copie `files[0].content` por cima do arquivo, mantendo o cabeçalho e as alterações locais acima.
