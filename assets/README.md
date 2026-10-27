# Brasil em cada palavra

Design system local para a **Profa. Marcia Macedo**, com o universo “Caderninho na Mão!”.

## Página de vendas

Abra **[../index.html](../index.html)** na raiz. A página contém somente o cabeçalho, sete seções com títulos provisórios e o rodapé. Ela importa `assets/design_system.css` e `assets/design_system.js`; a composição específica fica em `assets/pagina.css`. Fontes, marca e aquarela são os mesmos arquivos locais do catálogo.

No script ao final de `index.html`, edite `LINK_COMPRA` com a URL completa do Clube de Autores e `PRECO` com o preço exibido. Todos os links com `data-compra` usam essa configuração e abrem em nova aba quando o destino está configurado. Enquanto o link for o placeholder, a ação fica desabilitada para evitar uma navegação inválida. Não foi criado conteúdo de vendas além dos títulos solicitados.

O sprite SVG e os efeitos de fundo e surgimento são compartilhados pelo JS. As demonstrações do catálogo só inicializam quando seus elementos estão presentes, permitindo importar o mesmo arquivo em outras páginas sem reproduzir o catálogo.

## Catálogo

Abra **[design_system.html](design_system.html)** diretamente no navegador. Não é necessário instalar dependências, compilar ou usar internet. Mantenha os arquivos CSS, JS, `fonts/` e `images/` nas posições atuais. A cópia de tokens possui fallback para abertura por `file://`; políticas do navegador ainda podem impedir acesso à área de transferência.

## Conteúdo

- Hero em creme de papel `#FBF6EA`, com lettering transparente, aquarela original e selo animado.
- Menu transparente sobre o fundo da hero, sem faixa superior nem molduras laterais; abertura e transição para a próxima seção com espaçamento compacto.
- Essência da marca, bandeira abstrata em pinceladas e aplicação ilustrativa em caderno.
- 16 papéis tipográficos, incluindo lettering transparente, famílias, fallback stacks, pesos, tamanhos, entrelinhas, tracking e transformação.
- 14 cores, valores HEX/RGB/HSL, variações de opacidade, contraste calculado, uso semântico, gradientes e estados.
- Dobras alternadas entre creme, verde-floresta `#005E38` e azul-marinho `#17365B`, costuradas por faixas douradas animadas. Textos e lettering creme nos fundos escuros; branco reservado a cards, caixas e campos.
- Proporção de referência: 45% creme, 20% branco, 30% verde e azul, 5% ouro. É orientação de composição, não medição da área de pixels da página.
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

O `@design-system.html` mencionado no pedido não estava presente na raiz do projeto. Foram usados os três arquivos disponíveis e o overview aninhado do Open Design, preservando o lettering transparente. A revisão de cores adota o creme da capa do caderno como base. A página pública [da professora](https://marcia.fluenti.com.br/bf4) foi consultada como contexto de marca. Não foram criadas ofertas, depoimentos ou promessas comerciais. Os cards e formulários são demonstrações.

## Fontes

- Inter Tight, variável 400–900: arquivo latino local do Open Design.
- Manrope, variável 300–800: arquivo latino local do TerraSprint.
- Instrument Serif, itálica 400: arquivo incorporado no catálogo Hanzo, extraído preservando os bytes originais.
- JetBrains Mono, 400–500: arquivo latino local do Open Design.

Todas usam `font-display: swap`. Inter Tight e Manrope recebem preload. Os arquivos cobrem os acentos latinos usados no português; fallback cobre caracteres adicionais. As famílias são distribuídas sob SIL Open Font License; consulte `fonts/OFL-*.txt` para os avisos originais preservados.

## Verificação

Foram aprovados 15 grupos de verificações de estrutura, arquivos, geração de catálogo, contraste e interações em DOM. Contrastes dos pares sólidos: azul/creme **11,35:1**, creme/verde-floresta **7,33:1**, ouro/verde-floresta **4,86:1**, ouro/azul **7,53:1**, links verde-escuro/creme **6,15:1** e branco/verde de ação **4,71:1**. O verde de ação original sobre creme tem **4,37:1**, por isso fica restrito a títulos grandes e lettering nesse fundo; textos pequenos usam `#006B3C`. Os valores descrevem os pares, sem certificar a página inteira quanto a WCAG.

Não havia navegador disponibilizado pelo ambiente. Renderização visual, fontes realmente pintadas, layout responsivo, comportamento nativo de validação e contenção de foco do `dialog` precisam de revisão em navegador; os testes em DOM usam adaptadores dessas APIs e não substituem essa revisão.

Para repetir a verificação de DOM, a partir da pasta do projeto:

```powershell
npm.cmd install --prefix assets/qa/runtime --cache assets/qa/npm-cache --no-save --package-lock=false linkedom
node assets/qa/verify.cjs
node assets/qa/verify-sales.cjs
```

As dependências de verificação não são necessárias para usar a página e não foram incluídas na entrega.
