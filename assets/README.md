# Brasil em cada palavra

Design system local para a **Profa. Marcia Macedo**, com o universo “Caderninho na Mão!”.

Abra **[design_system.html](design_system.html)** diretamente no navegador. Não é necessário instalar dependências, compilar ou usar internet. Mantenha os arquivos CSS, JS, `fonts/` e `images/` nas posições atuais. A cópia de tokens possui fallback para abertura por `file://`; políticas do navegador ainda podem impedir acesso à área de transferência.

## Conteúdo

- Hero com lettering transparente, aquarela original e selo animado.
- Essência da marca, bandeira abstrata em pinceladas e aplicação ilustrativa em caderno.
- 16 papéis tipográficos, incluindo lettering transparente, famílias, fallback stacks, pesos, tamanhos, entrelinhas, tracking e transformação.
- 12 cores, valores HEX/RGB/HSL, variações de opacidade, contraste calculado, uso semântico, gradientes e estados.
- Oito famílias de componentes com demonstrações e especificações completas em painéis expansíveis.
- 12 ícones SVG copiáveis, incluindo estudo e símbolos brasileiros.
- Laboratório de movimento, receitas, duração/easing, pausa e suporte a movimento reduzido.

## Arquivos

- `design_system.html`: estrutura, demonstrações e conteúdo editorial.
- `design_system.css`: tokens, fontes, classes, componentes, responsividade e animações.
- `design_system.js`: tabelas de especificação, contraste, menu, validação local, abas, dialog, tooltips, cópia e movimento.
- `fonts/`: quatro arquivos WOFF2 locais reutilizados das referências.
- `images/marca.svg`: assinatura geométrica inspirada nas cores e formas da bandeira.
- `images/brasil-aquarela.png`: aquarela original gerada com a ferramenta integrada ImageGen; sem Cristo Redentor.
- `images/brasil-aquarela.prompt.txt`: prompt integral usado na geração.
- `qa/verification.txt`: resultados da verificação estrutural e funcional em DOM.

## Referências e contratos preservados

**Open Design:** estrutura editorial, títulos Inter Tight, anotações monoespaçadas, divisórias, `.site-chrome`, `.nav`, `.nav-links`, `.display`, `.lead`, `.btn`, `.btn-primary`, `.btn-ghost`, `.arrow`, `.sec-rule`, `.ds-group`, `.ds-spec`, `.ds-colors`, `[data-reveal]`, `[data-revealed]`, `[data-nav-toggle]` e `[data-nav-primary]`.

**Hanzo:** contraste entre sans e Instrument Serif itálica; vidro claro, profundidade de superfícies e classes `.ds-type`, `.ds-window`, `.ds-live`, `.ds-grid2`, `.ds-icons`, `.is-current`.

**TerraSprint:** abordagem orgânica, Manrope, fundo atmosférico, desvio de glow pelo cursor e hooks `.scroll-reveal`, `.ds-sheet`, `.ds-replay`, `.bloom`, `[data-ds-bloom]`.

Classes e hooks foram reimplementados com tokens desta marca. Os runtimes completos das referências não foram importados porque controlam catálogos e estruturas independentes. Não há dependência de iframes, Framer, GSAP ou Tailwind para abrir esta página.

O `@design-system.html` mencionado no pedido não estava presente na raiz do projeto. Foram usados os três arquivos disponíveis e o overview aninhado do Open Design, além da direção explícita de base branca e lettering transparente. A página pública [da professora](https://marcia.fluenti.com.br/bf4) foi consultada como contexto de marca. Não foram criadas ofertas, depoimentos ou promessas comerciais. Os cards e formulários são demonstrações.

## Fontes

- Inter Tight, variável 400–900: arquivo latino local do Open Design.
- Manrope, variável 300–800: arquivo latino local do TerraSprint.
- Instrument Serif, itálica 400: arquivo incorporado no catálogo Hanzo, extraído preservando os bytes originais.
- JetBrains Mono, 400–500: arquivo latino local do Open Design.

Todas usam `font-display: swap`. Inter Tight e Manrope recebem preload. Os arquivos cobrem os acentos latinos usados no português; fallback cobre caracteres adicionais. As famílias são distribuídas sob SIL Open Font License; consulte `fonts/OFL-*.txt` para os avisos originais preservados.

## Verificação

Foram aprovados 14 grupos de verificações de estrutura, arquivos, geração de catálogo e interações em DOM. Contrastes medidos: branco/verde **4,71:1**, azul/branco **12,24:1**, azul/ouro **7,53:1**, borda funcional/branco **3,64:1**. Isso descreve os pares de cores, sem certificar a página inteira quanto a WCAG.

Não havia navegador disponibilizado pelo ambiente. Renderização visual, fontes realmente pintadas, layout responsivo, comportamento nativo de validação e contenção de foco do `dialog` precisam de revisão em navegador; os testes em DOM usam adaptadores dessas APIs e não substituem essa revisão.

Para repetir a verificação de DOM, a partir da pasta do projeto:

```powershell
npm.cmd install --prefix assets/qa/runtime --cache assets/qa/npm-cache --no-save --package-lock=false linkedom
node assets/qa/verify.cjs
```

As dependências de verificação não são necessárias para usar a página e não foram incluídas na entrega.
