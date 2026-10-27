# HANDOFF: diário de passagem

## Última sessão
- Ferramenta: Claude Code
- Data: 27/10/2026
- Resumo: criação do AGENTS.md, CLAUDE.md e HANDOFF.md; Dobra 2 nova (leque de postais, ondas do calçadão, caderno 3D com hover, citação animada); Dobra 3 com carrossel automático e hovers; caderno da chamada final integrado em duas colunas; nova dobra de oferta "A encomenda"; proteção contra clique duplo na compra; metadados de compartilhamento, favicons e 404

## Estado atual da página
Arquivo único index.html, com estilos em assets/design_system.css + assets/pagina.css e scripts em assets/design_system.js + assets/pagina.js. LINK_COMPRA, LINK_CONTATO e PRECO ficam no script inline no fim do index.html.

- <head>: title "Caderninho na Mão! | Profa. Marcia Macedo", description nova, canonical, Open Graph, Twitter (summary_large_image) e theme-color #00854A. A URL de produção (https://caderninho-marcia.vercel.app/) está num comentário no topo do <head>; ao trocar de domínio, mude canonical, og:url, og:image e twitter:image.
- Compartilhamento e ícones: assets/images/og-image.jpg (1200 x 630, cerca de 105 KB), favicon.ico (32 x 32), favicon.svg e apple-touch-icon.png (180 x 180) na raiz, com o ícone de caderno do design system em verde sobre creme.
- 404.html na raiz: "Essa página não está no caderno." com botão "Voltar para a página inicial" (a Vercel usa esse arquivo automaticamente).
- Menu fixo: marca "marcia macedo" e botão "Quero o meu caderninho".
- Hero (#inicio): título "Caderninho na mão!", aquarela do Rio ao fundo, caderno 3D em ciclo (abre e fecha), carimbo .postmark, botão de compra e aviso "Envio para endereços no Brasil". Sem preço na primeira dobra.
- Faixa .wire: "Anote ✳ Pratique ✳ Revise ✳ ...".
- Dobra 2 (#a-frase): "Uma frase que virou caderno."; citação que entra linha a linha com sublinhado dourado; leque de 3 postais clicáveis (Salvador, Amazônia, Foz do Iguaçu) com carimbo girando; caderno 3D fechado que inclina com o mouse e entreabre a capa; fundo com ondas do calçadão (assets/images/ondas-calcadao.svg) em parallax; itens 01, 02, 03 em cascata.
- Dobra 3 (#para-que): vitrine com foto da mão (zoom e brilho no hover; zoom de entrada no celular), carrossel de páginas anotadas que troca sozinho a cada 5 s com barra dourada de progresso, virada de página, botão de pausar, setas, teclado e arraste; ficha de preço com linhas em cascata; objetos decorativos com parallax (dois selos da bandeira, folha e lápis).
- Dobra 4 (#detalhes): seis diferenciais em disclosure; o caderno 3D gira para mostrar cada um (A5, acetato, espiral, 100 folhas, miolo, contracapa real).
- Dobra 5 (#oferta): "Seu caderninho, pronto para a próxima aula." Varal de bandeirinhas no topo; à esquerda, pacote kraft com barbante e laço (SVG) com o caderno 3D saindo de dentro, selo e lápis flutuando; à direita, etiqueta de envio (papel creme sobre kraft, borda tracejada, carimbo BRASIL · ENCOMENDA) com a lista "O QUE VAI NA CAIXA", preço em carimbo (texto real via data-preco), "menos de R$ 0,33 por página", botão de compra e textos de apoio. Sequência de entrada única ao entrar na tela (classe .is-entregue). A linha "Mora fora do Brasil? Fale com a gente." só aparece com LINK_CONTATO preenchido ([data-contato-opcional]).
- Dobra 6 (#como-comprar): perguntas frequentes em disclosure e cartão de compra fixo com preço e contato.
- Chamada final (#chamada-final): duas colunas (no celular, caderno em cima). Assinatura "CADERNINHO NA MÃO. PORTUGUÊS NO CORAÇÃO." acima do título "Tem uma palavra nova esperando por você.", botão dourado e preço; à direita, caderno 3D grande (320 a 380 px) com rotação real, sombra no chão que acompanha a flutuação, brilho dourado atrás, folha, selo e lápis flutuando em volta, hover com inclinação e capa entreaberta.
- Rodapé: crédito do Clube de Autores, Instagram @portugues_marciamacedo e botão de voltar ao topo.
- Barra de compra no celular: aparece depois da hero, some enquanto a oferta está na tela e some de vez ao chegar na chamada final.
- Botões de compra ([data-compra]): depois do primeiro clique, todos ignoram novos cliques por 3 s e ficam com opacidade .7 (classe .is-enviando, aria-busy). O evento pageshow libera os botões ao voltar pelo histórico.
- Componente reutilizável Caderninho3D (template #caderno-3d-template) com estados loop, interativo e fechado. O atributo data-caderno-hover liga inclinação pelo mouse, brilho e capa entreaberta (usado na dobra 2 e na chamada final).
- Scripts de verificação em assets/qa/ (verify-sales.cjs e relatórios .txt).

## Em andamento
- Fila pedida pelo usuário em 27/10/2026: revisão de desempenho (sempre por último). O pedido completo está na conversa do Claude Code; o resumo está em "Próximas tarefas".

## Próximas tarefas (em ordem)
1. Revisão final de velocidade e fluidez (sempre por último): Lighthouse antes e depois, WebP/AVIF com srcset, fontes, minificação, vercel.json com cache, mover arquivos sem uso para assets/extras/, RELATORIO-DESEMPENHO.md.

## Pendências que dependem de pessoas (não implementar sem confirmação)
- Retrato da Marcia em aquarela (marcia-aquarela.png), aguardando aprovação dela.
- LINK_CONTATO: canal e responsável ainda não definidos.
- Fotos reais do caderno quando a amostra chegar (substituir a foto da mão, que tem o Pão de Açúcar ao fundo).
- Marcia precisa aprovar as citações atribuídas a ela.
- Adicionar formas de pagamento na oferta quando o Clube de Autores confirmar.
- Envio internacional: a resposta do FAQ "Vocês enviam para fora do Brasil?" agora diz que sim (pelo carrinho do Clube de Autores, com documento fiscal do país). Outros textos ainda falam só em Brasil e precisam de decisão antes de mudar: hero ("Envio para endereços no Brasil"), ficha da dobra 3 ("Para endereços no Brasil"), detalhe "Impresso para você" ("Entrega para endereços no Brasil"), lista da oferta ("Nota fiscal e entrega em todo o Brasil"), texto de apoio da oferta, chamada final, meta description ("Envio para todo o Brasil") e a decisão registrada "envio só para o Brasil". A linha "Mora fora do Brasil? Fale com a gente." da oferta também pode mudar.
- Testar a prévia de compartilhamento depois de cada deploy: https://developers.facebook.com/tools/debug/ e https://www.opengraph.xyz/ (cole https://caderninho-marcia.vercel.app/). No depurador do Facebook, use "Extrair novamente" para limpar o cache da prévia antiga.

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
- 27/10/2026: dobra de oferta "A encomenda" (#oferta) entre detalhes e perguntas, com etiquetas de seção renumeradas. Conferida no computador e no celular.
- 27/10/2026: botões de compra protegidos contra clique duplo (3 s), com liberação no pageshow. Testado no Chrome: o segundo clique é bloqueado, o bloqueio vale para todos os botões e some depois de 3 s ou ao voltar pelo histórico.
- 27/10/2026: página pronta para compartilhar (title, description, Open Graph, Twitter, canonical, og-image, favicons, theme-color e 404.html).

## Decisões registradas
- Venda pelo Clube de Autores, R$ 65,44, envio só para o Brasil.
- O Pão de Açúcar já aparece na hero e na capa: não repetir em outras dobras.
- Sem rastreamento de cliques por enquanto (decisão de manter simples).
- Dobra 2: brasil-aquarela.png não aparece mais nesta dobra (só na hero). As ondas usam opacidade .2 para ficarem como marca d'água.
- Dobra 2: clicar no postal da frente manda ele para o fundo; clicar em outro traz esse para a frente. No celular, o leque abre sozinho e a capa do caderno entreabre uma vez.
- Dobra 3: a barra dourada de progresso é o próprio relógio do autoplay (o fim da animação avança a página), então ela pausa junto com as animações da página fora da tela, com a aba oculta ou com o botão de pausa do design system. Com movimento reduzido não há autoplay e as trocas usam só fade.
- Dobra 3: o postal do Rio da lateral esquerda virou um segundo selo da bandeira (selo.png). postal.png deixou de ser usado na página.
- Chamada final: foi usada a opção principal (caderno integrado), não a alternativa só com a frase. O caderno ficou bom em duas colunas, com a espiral alinhada e a rotação 3D sem distorção. A faixa com a frase não era uma seção separada, era um rótulo acima do caderno; ele virou a assinatura acima do título.
- Oferta: a etiqueta da seção ficou "05 / A OFERTA" (o pedido citava "04 / A OFERTA" como exemplo, mas a oferta vem depois de "04 / DETALHES"); "COMO COMPRAR" passou para 06.
- Oferta: "menos de R$ 0,33 por página" usa o dourado escuro do design system (--warning, #895B00) com sublinhado em ouro #F4C542, porque o ouro puro sobre creme não passa no contraste AA. 65,44 / 200 páginas = R$ 0,327.
- Oferta: kraft não existia no design system; os tons ficam como variáveis locais em .oferta (--kraft, --kraft-claro, --kraft-medio, --kraft-escuro, --barbante).
- Clique duplo: o estilo de desabilitado do design system (.btn:disabled) troca o botão para cinza e só vale para <button>; como os botões de compra são links e o pedido aceitava opacidade reduzida, foi usada só a opacidade .7, sem mudar cores.
- og-image: gerada com Playwright a partir de um HTML temporário (já apagado), com as fontes e cores do design system; nenhum texto a menos de 84 px das laterais. O marca.svg antigo continua em assets/images/, mas a página agora usa os favicons da raiz.
- As pastas assets/qa/npm-cache/ e assets/qa/runtime/ são cache local dos testes e ficam fora do git (.gitignore).
