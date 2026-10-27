# Brasil em cada palavra

Design system local para a **Profa. Marcia Macedo**, com o universo “Caderninho na Mão!”.

## Página de vendas

Abra **[../index.html](../index.html)** na raiz. A hero usa a estrutura e as classes do catálogo, incluindo a mesma escala de títulos, grade, glow, selo giratório, coordenadas, manuscrito, rodapé da hero e faixa animada de palavras. A aquarela do Pão de Açúcar cobre toda a hero com `object-fit: cover` e prioridade alta de carregamento. Um degradê creme protege a leitura à esquerda e se torna vertical nas telas menores; uma máscara dissolve topo e base no papel. Outra camada alinhada da imagem usa saturação 1,16 e brilho 1,035 em uma região radial perto do caderno. O objeto foi elevado em 9% da altura da hero, com deslocamento para a direita no computador. Coordenadas e legenda reutilizam badges claros para leitura sobre a paisagem. O caderno 3D aparece opaco, com perspectiva e sombra sobre a areia, na frente da paisagem. Capa e miolo usam imagens reais, sem mistura multiply ou máscara. Duas folhas de `images/folha.png` enquadram os cantos com transparência, bordas suaves e o balanço compartilhado `leaf-sway`. A bandeira em pigmentos `.flag-art` gira lentamente atrás do texto, com baixa opacidade. O contorno verde do lettering recebe um brilho dourado a cada 7,2 segundos; a estrela dourada preserva o giro do catálogo. As faixas `.section-ribbon` da hero usam verde, ouro e azul cheios, com área reservada sob o rodapé para preservar sua leitura. No celular, a paisagem e o caderno ficam acima do texto, com a versão menor do mesmo componente. Trilhos laterais discretos aparecem em telas maiores. O cabeçalho mostra somente o nome da professora e o botão de compra sem preço, também no celular. A seção “A frase” reutiliza a grade de identidade do catálogo, com fundo verde, manifesto, aquarela do Pão de Açúcar, coordenadas e selo animado. A capa existente em `images/capa.jpg` aparece inteira, sem recorte do título. A seção de detalhes reutiliza o caderno 3D em seis poses, controladas por uma lista de diferenciais. A vitrine de usos inclui foto, ficha de compra e cinco páginas anotadas. As outras três seções continuam com títulos provisórios. A página importa `assets/design_system.css` e `assets/design_system.js`; a composição específica fica em `assets/pagina.css`. Fontes, cores, marca, faixas, glow e surgimentos são compartilhados com o catálogo.

No topo do script ao final de `index.html`, `LINK_COMPRA` já aponta para a página do caderno no Clube de Autores e `PRECO` contém `R$ 65,44`. Todos os links com `data-compra` usam essa configuração e abrem em nova aba. Se a URL editada for inválida, os botões não navegam para um checkout incorreto. O preço aparece na ficha de compra e nos rótulos acessíveis dos botões fora da primeira dobra. Cabeçalho e hero não exibem o valor; a hero mantém a informação “Envio para endereços no Brasil”.

O sprite SVG e os efeitos de fundo e surgimento são compartilhados pelo JS. Na hero, os elementos surgem em sequência com intervalos de 80 ms; as demais seções mantêm o ritmo de surgimento existente. As demonstrações do catálogo só inicializam quando seus elementos estão presentes, permitindo importar o mesmo arquivo em outras páginas sem reproduzir o catálogo.

As fotos `images/mao-caderno.jpg` (1254 × 1254 px) e `images/capa.jpg` (1054 × 1493 px) foram convertidas de PNG para JPEG com qualidade 85. Nenhuma precisou de redução de dimensões. Juntas, passaram de 4.961.021 para 669.485 bytes (86,51% menores); a capa usada na página aponta para o JPG. Os PNGs originais dessas duas fotos foram removidos após conferir os JPGs e o carregamento por HTTP. A aquarela e os objetos transparentes foram preservados. Os tamanhos e hashes dos arquivos protegidos estão em `qa/photo-optimization.json`; a conferência está em `qa/photo-verification.txt`.

## Vitrine de usos

`#para-que` usa `.sec-rule`, `.ds-grid2`, `.ds-window`, `.ds-sheet`, `.badge`, `.icon-btn`, `.btn`, `.magnetic`, `.bloom` e os fundos e surgimentos compartilhados. No computador, a foto e a ficha ficam à esquerda; carrossel e texto à direita. As áreas de grid passam para foto → carrossel → título/texto → ficha/botão no celular, mantendo uma única cópia do conteúdo. Compra e preço usam `LINK_COMPRA` e `PRECO`. O link de detalhes usa a âncora nativa e a rolagem suave do sistema.

O carrossel é manual: setas, teclas ←/→/Home/End e arraste horizontal. Deslocamentos verticais continuam permitindo rolar a página; gestos cancelados ou curtos não trocam o slide. Apenas a página atual fica disponível ao leitor de tela, com indicador de posição em região `aria-live`. Os cinco exemplos usam a imagem real `images/miolo.png`, sem alteração no arquivo. A escrita usa Caveat 600/700, do [Google Fonts](https://fonts.google.com/specimen/Caveat), com WOFF2 latino e latino estendido locais e `font-display: swap`; os símbolos fonéticos usam JetBrains Mono para leitura. A entrelinha ocupa duas pautas reais (63,5 px por pauta na imagem original de 1748 px de largura), com início ajustado às métricas da Caveat. A licença está em `fonts/OFL-caveat.txt`.

Postal, selo, folha e lápis usam o movimento `leaf-sway` do sistema e parallax de até 24 px (10 px no celular), atualizado por frame apenas com a seção próxima da tela. O postal mostra um recorte de seu lado direito. No celular, aparecem somente selo e lápis, menores. Falha ao carregar uma imagem decorativa oculta o objeto. Movimento reduzido ou pausa global zera o parallax e mantém o carrossel navegável; as transições e animações respeitam as regras do design system.

## Diferenciais interativos

`#detalhes` mantém o fundo azul-marinho, glow dourado, folha, surgimentos e ondas do sistema. A lista de seis botões à esquerda controla o mesmo componente 3D à direita: tamanho/régua, acetato, espiral, bloco de folhas, miolo aberto e verso creme. As transições usam `--ease` e `--entrance × 1,125` (900 ms); no último item, a capa fecha antes do giro. O item inicial é 01, e a flutuação lenta permanece no modelo. O número e a legenda acompanham a seleção. Preço e compra usam as variáveis compartilhadas, com botão `.btn-gold.magnetic`.

Hover com mouse, foco e clique/toque ativam um item por vez. `aria-expanded`, `aria-controls` e regiões nomeadas descrevem a abertura; setas para cima/baixo, Home e End também navegam pelos itens. Sem JavaScript, as seis descrições ficam visíveis junto da imagem de capa. No celular, a área do caderno vem antes da lista e usa `position: sticky`; a dica muda para “TOQUE PARA VER”. Com movimento reduzido ou pausa global, o caderno fica de frente e parado enquanto a lista continua utilizável. Os testes em DOM não verificam a renderização 3D nem o sticky nativo.

As verificações desta seção estão em [qa/details-verification.txt](qa/details-verification.txt) e [qa/sales-verification.txt](qa/sales-verification.txt).

## Caderno 3D reutilizável

O `<template id="caderno-3d-template">` de `index.html` é a única estrutura compartilhada. `pagina.js` o instancia em cada `.caderno-3d[data-caderno]`. Para reutilizar, adicione um contêiner com essas classes, um `id` único, `role="img"` e um `aria-label` descritivo; chame `Caderninho3D.init()` após inserir novos contêineres dinamicamente. Um `<img class="caderno-fallback">` dentro do contêiner mantém a capa visível caso o JavaScript não execute.

Cada face tem proporção A5 (148/210) e imagens com `object-fit: contain`: `images/capa.jpg` na frente e `images/miolo.png` na página interna. A imagem real do miolo é a única página interna; não existe versão pautada em CSS. Sem arquivo de contracapa, a face posterior fica creme liso; uma futura imagem pode ser configurada por `data-contracapa="assets/images/contracapa.jpg"` no contêiner. A espiral transparente tem 22 elos em CSS e a espessura deriva de 100 folhas. O modelo usa `perspective`, `preserve-3d`, frente e verso com `backface-visibility`, com sombra separada sob o objeto.

Instâncias sem `data-caderno-loop` nem `data-caderno-interactive` surgem com `reveal-rise` e esperam a soma dos tokens `--entrance` e `--micro` (980 ms) para abrir a capa em 180°. Essa abertura usa duas vezes `--entrance` e o easing do design system; a flutuação lenta começa após a abertura. O modo `data-caderno-interactive`, usado em `#detalhes`, aceita `Caderninho3D.showFeature(id, '01' … '06')` e não inicia abertura automática nem temporizadores.

Na hero, `data-caderno-loop` ativa um ciclo CSS de 15 × `--entrance` (12 s): fechado por 3 s, abrindo por 2,5 s, aberto por 4 s e fechando por 2,5 s. As rotações usam `--ease`; a flutuação permanece durante todo o ciclo. Um observador da seção sem margem de antecipação pausa a animação ao sair da tela, preservando sua fase. A classe compartilhada `page-hidden` pausa também quando a aba está oculta, inclusive se já estava oculta na inicialização.

`prefers-reduced-motion` ou a pausa global do sistema mostra a hero aberta e estática e a instância interativa de frente e fechada. O replay também respeita essa preferência. `Caderninho3D.replay(id)` e botões com `data-caderno-replay="id"` continuam disponíveis para outras aplicações; no modo interativo, o método seleciona o item 05. O vídeo e seus estilos foram retirados da página; os arquivos antigos de mídia continuam guardados e não são carregados.

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
- `pagina.css` e `pagina.js`: composição da página de vendas e componente reutilizável do caderno 3D.
- `images/miolo.png`: página interna real fornecida para o caderno; preservada em PNG.
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



A página de vendas tem 23 grupos de verificações em DOM, incluindo os textos exatos da vitrine, configuração da compra, navegação por setas e teclado, arrastes horizontais/verticais/cancelados, indicador acessível, parallax limitado e movimento reduzido. Os testes também cobrem as duas instâncias 3D, seleção dos diferenciais por mouse/teclado/toque, pausa do loop fora da hero, abas inicialmente ocultas, movimento reduzido, surgimentos e interações compartilhadas. Os tempos CSS e os pares de leitura sobre creme/96 estão em `qa/hero-verification.txt`; esses pares indicam intenção AA, sem certificar a composição inteira. DOM, ponteiros, temporizadores e observadores são simulados; renderização, alinhamento tipográfico, gestos nativos e comparação visual precisam de revisão em navegador, indisponível no ambiente.

Para repetir a verificação de DOM, a partir da pasta do projeto:

```powershell
npm.cmd install --prefix assets/qa/runtime --cache assets/qa/npm-cache --no-save --package-lock=false linkedom
node assets/qa/verify.cjs
node assets/qa/verify-sales.cjs
```

As dependências de verificação não são necessárias para usar a página e não foram incluídas na entrega.
