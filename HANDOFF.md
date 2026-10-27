# HANDOFF: diário de passagem

## Última sessão
- Ferramenta: Claude Code
- Data: 27/10/2026
- Resumo: criação do AGENTS.md, CLAUDE.md e HANDOFF.md; Dobra 2 nova (leque de postais, ondas do calçadão, caderno 3D com hover, citação animada); Dobra 3 com carrossel automático e hovers; caderno da chamada final integrado em duas colunas

## Estado atual da página
Arquivo único index.html, com estilos em assets/design_system.css + assets/pagina.css e scripts em assets/design_system.js + assets/pagina.js. LINK_COMPRA, LINK_CONTATO e PRECO ficam no script inline no fim do index.html.

- Menu fixo: marca "marcia macedo" e botão "Quero o meu caderninho".
- Hero (#inicio): título "Caderninho na mão!", aquarela do Rio ao fundo, caderno 3D em ciclo (abre e fecha), carimbo .postmark, botão de compra e aviso "Envio para endereços no Brasil". Sem preço na primeira dobra.
- Faixa .wire: "Anote ✳ Pratique ✳ Revise ✳ ...".
- Dobra 2 (#a-frase): "Uma frase que virou caderno."; citação que entra linha a linha com sublinhado dourado; leque de 3 postais clicáveis (Salvador, Amazônia, Foz do Iguaçu) com carimbo girando; caderno 3D fechado que inclina com o mouse e entreabre a capa; fundo com ondas do calçadão (assets/images/ondas-calcadao.svg) em parallax; itens 01, 02, 03 em cascata.
- Dobra 3 (#para-que): vitrine com foto da mão (zoom e brilho no hover; zoom de entrada no celular), carrossel de páginas anotadas que troca sozinho a cada 5 s com barra dourada de progresso, virada de página, botão de pausar, setas, teclado e arraste; ficha de preço com linhas em cascata; objetos decorativos com parallax (dois selos da bandeira, folha e lápis).
- Dobra 4 (#detalhes): seis diferenciais em disclosure; o caderno 3D gira para mostrar cada um (A5, acetato, espiral, 100 folhas, miolo, contracapa real).
- Dobra 5 (#como-comprar): perguntas frequentes em disclosure e cartão de compra fixo com preço e contato.
- Chamada final (#chamada-final): duas colunas (no celular, caderno em cima). Assinatura "CADERNINHO NA MÃO. PORTUGUÊS NO CORAÇÃO." acima do título "Tem uma palavra nova esperando por você.", botão dourado e preço; à direita, caderno 3D grande (320 a 380 px) com rotação real, sombra no chão que acompanha a flutuação, brilho dourado atrás, folha, selo e lápis flutuando em volta, hover com inclinação e capa entreaberta.
- Rodapé: crédito do Clube de Autores, Instagram @portugues_marciamacedo e botão de voltar ao topo.
- Barra de compra no celular: aparece depois da hero e some ao chegar na chamada final.
- Componente reutilizável Caderninho3D (template #caderno-3d-template) com estados loop, interativo e fechado. O atributo data-caderno-hover liga inclinação pelo mouse, brilho e capa entreaberta (usado na dobra 2 e na chamada final).
- Scripts de verificação em assets/qa/ (verify-sales.cjs e relatórios .txt).

## Em andamento
- Fila pedida pelo usuário em 27/10/2026, nesta ordem: dobra de oferta "A encomenda", compartilhamento e revisão de desempenho por último. Os pedidos completos estão na conversa do Claude Code; o resumo está em "Próximas tarefas".

## Próximas tarefas (em ordem)
1. Dobra de oferta "A encomenda" (#oferta), entre detalhes e perguntas: pacote kraft com barbante, caderno 3D saindo, etiqueta de envio com lista e preço em carimbo, varal de bandeirinhas, sequência de entrada, renumerar as etiquetas de seção, esconder a barra de compra do celular enquanto a oferta estiver na tela.
2. Compartilhamento: title e description novos, og-image.jpg 1200 x 630, Open Graph e Twitter, canonical, favicon (ico, svg, apple-touch-icon), theme-color #00854A e 404.html.
3. Revisão final de velocidade e fluidez (sempre por último): Lighthouse antes e depois, WebP/AVIF com srcset, fontes, minificação, vercel.json com cache, mover arquivos sem uso para assets/extras/, RELATORIO-DESEMPENHO.md.

## Pendências que dependem de pessoas (não implementar sem confirmação)
- Retrato da Marcia em aquarela (marcia-aquarela.png), aguardando aprovação dela.
- LINK_CONTATO: canal e responsável ainda não definidos.
- Fotos reais do caderno quando a amostra chegar (substituir a foto da mão, que tem o Pão de Açúcar ao fundo).
- Marcia precisa aprovar as citações atribuídas a ela.
- Adicionar formas de pagamento na oferta quando o Clube de Autores confirmar.

## Concluído
- 27/10/2026: design system com identidade brasileira, cores creme e paleta verde, ouro e azul-marinho.
- 27/10/2026: estrutura da página de vendas, hero com caderno 3D em ciclo e aquarela ampliada; preço removido da primeira dobra.
- 27/10/2026: dobra 2 inicial ("Uma frase que virou caderno.").
- 27/10/2026: fotos otimizadas para JPG e caderno 3D reutilizável no lugar do vídeo.
- 27/10/2026: vitrine com páginas anotadas (dobra 3).
- 27/10/2026: detalhes interativos do caderno com contracapa real (dobra 4).
- 27/10/2026: seção de compra com perguntas frequentes (dobra 5).
- 27/10/2026: chamada final, rodapé e barra de compra no celular.
- 27/10/2026: link de compra com ?cart=true em todos os botões, abrindo na mesma aba.
- 27/10/2026: AGENTS.md, CLAUDE.md e HANDOFF.md para a passagem entre Codex e Claude Code.
- 27/10/2026: postais de Salvador, Amazônia e Iguaçu convertidos para JPG (1536 x 1024, qualidade 82); PNGs apagados.
- 27/10/2026: Dobra 2 com leque de postais, ondas do calçadão, caderno 3D com hover e citação animada. Conferida no computador (1440 px) e no celular (390 px), também com movimento reduzido.
- 27/10/2026: Dobra 3 com carrossel automático (5 s, barra de progresso, pausa por mouse, foco, toque por 8 s, aba oculta e botão), virada de página, folha levantada no hover, zoom na foto, cascata na ficha de preço e selo no lugar do postal do Rio. Conferida no computador e no celular.
- 27/10/2026: caderno da chamada final corrigido: integrado à chamada em duas colunas, sem skew (rotateX 5° e rotateY -20°, sem rotateZ), espiral dentro da altura da capa, sombra no chão, composição com folha, selo e lápis; coração isolado removido. Conferido no computador e no celular.

## Decisões registradas
- Venda pelo Clube de Autores, R$ 65,44, envio só para o Brasil.
- O Pão de Açúcar já aparece na hero e na capa: não repetir em outras dobras.
- Sem rastreamento de cliques por enquanto (decisão de manter simples).
- Dobra 2: brasil-aquarela.png não aparece mais nesta dobra (só na hero). As ondas usam opacidade .2 para ficarem como marca d'água.
- Dobra 2: clicar no postal da frente manda ele para o fundo; clicar em outro traz esse para a frente. No celular, o leque abre sozinho e a capa do caderno entreabre uma vez.
- Dobra 3: a barra dourada de progresso é o próprio relógio do autoplay (o fim da animação avança a página), então ela pausa junto com as animações da página fora da tela, com a aba oculta ou com o botão de pausa do design system. Com movimento reduzido não há autoplay e as trocas usam só fade.
- Dobra 3: o postal do Rio da lateral esquerda virou um segundo selo da bandeira (selo.png). postal.png deixou de ser usado na página.
- Chamada final: foi usada a opção principal (caderno integrado), não a alternativa só com a frase. O caderno ficou bom em duas colunas, com a espiral alinhada e a rotação 3D sem distorção. A faixa com a frase não era uma seção separada, era um rótulo acima do caderno; ele virou a assinatura acima do título.
- As pastas assets/qa/npm-cache/ e assets/qa/runtime/ são cache local dos testes e ficam fora do git (.gitignore).
