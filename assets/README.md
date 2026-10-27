# Brasil em cada palavra

Design system local para a **Profa. Marcia Macedo**, com o universo “Caderninho na Mão!”.

## Página de vendas

Abra **[../index.html](../index.html)** na raiz. A hero usa a estrutura e as classes do catálogo, incluindo a mesma escala de títulos, grade, glow, selo giratório, coordenadas, manuscrito, rodapé da hero e faixa animada de palavras. A aquarela colorida do Pão de Açúcar mantém a escala e a posição originais na grande área `.hero-art`. O vídeo aparece menor à frente da parte inferior da paisagem, com mistura multiply e máscara radial esfumada, sem card ou moldura. Duas folhas de `images/folha.png` enquadram os cantos com transparência, bordas suaves e o balanço compartilhado `leaf-sway`. A bandeira em pigmentos `.flag-art` gira lentamente atrás do texto, com baixa opacidade. O contorno verde do lettering recebe um brilho dourado a cada 7,2 segundos; a estrela dourada preserva o giro do catálogo. As faixas `.section-ribbon` da hero usam verde, ouro e azul cheios, com área reservada sob o rodapé para preservar sua leitura. A responsividade acompanha o catálogo: no celular, texto antes da arte. Trilhos laterais discretos aparecem em telas maiores. O cabeçalho mostra somente o nome da professora e o botão com preço, também visível no celular. A seção “A frase” reutiliza a grade de identidade do catálogo, com fundo verde, manifesto, aquarela do Pão de Açúcar, coordenadas e selo animado. A capa existente em `images/capa.png` aparece inteira, sem recorte do título. As outras cinco seções continuam com títulos provisórios. A página importa `assets/design_system.css` e `assets/design_system.js`; a composição específica fica em `assets/pagina.css`. Fontes, cores, marca, faixas, glow e surgimentos são compartilhados com o catálogo.

No topo do script ao final de `index.html`, `LINK_COMPRA` já aponta para a página do caderno no Clube de Autores e `PRECO` contém `R$ 65,44`. Todos os links com `data-compra` usam essa configuração e abrem em nova aba. Se a URL editada for inválida, os botões não navegam para um checkout incorreto. A linha de preço da hero usa a variável seguida de “+ frete · Envio para endereços no Brasil”.

O vídeo `assets/caderno-abrindo.mp4` tem 8 segundos, 1280 × 720 px, a 24 fps. Ele inicia automaticamente, mudo e inline, sem controles nem loop. `images/caderno-primeiro-quadro.jpg` é o primeiro quadro extraído com FFmpeg, usado como poster. `images/caderno-aberto.jpg` é o último quadro, extraído do mesmo vídeo e inspecionado visualmente; aparece após a reprodução e quando `prefers-reduced-motion` está ativo. Com movimento reduzido, o MP4 não recebe `src`, portanto não é carregado nem reproduzido; a aquarela continua visível, e brilho, folhas, bandeira, selo e ondas ficam estáticos. Bloqueio de autoplay ou erro de mídia também mostra a imagem estática do caderno aberto. O MP4 original não foi alterado.

O sprite SVG e os efeitos de fundo e surgimento são compartilhados pelo JS. Na hero, os elementos surgem em sequência com intervalos de 80 ms; as demais seções mantêm o ritmo de surgimento existente. As demonstrações do catálogo só inicializam quando seus elementos estão presentes, permitindo importar o mesmo arquivo em outras páginas sem reproduzir o catálogo.

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

A página de vendas tem 14 grupos adicionais de verificações, incluindo correspondência estrutural com a hero do catálogo, textos da hero e de “A frase”, fontes e arquivos das artes, referências dos selos, sequência de surgimento, glow e magnetismo com ponteiro preciso, pausa da faixa fora da tela, links de compra, estados de reprodução e ausência de carregamento de vídeo com movimento reduzido. Os estados usam APIs de mídia simuladas; autoplay nativo, console e comparação visual em navegador não foram verificados por indisponibilidade de navegador no ambiente. Os quadros extraídos foram conferidos como imagens.

Para repetir a verificação de DOM, a partir da pasta do projeto:

```powershell
npm.cmd install --prefix assets/qa/runtime --cache assets/qa/npm-cache --no-save --package-lock=false linkedom
node assets/qa/verify.cjs
node assets/qa/verify-sales.cjs
```

As dependências de verificação não são necessárias para usar a página e não foram incluídas na entrega.
