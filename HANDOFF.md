# HANDOFF: diário de passagem

## Última sessão
- Ferramenta: Claude Code
- Data: 27/10/2026
- Resumo: criação do AGENTS.md, CLAUDE.md e HANDOFF.md; Dobra 2 nova; Dobra 3 com carrossel automático; chamada final em duas colunas; proteção contra clique duplo; compartilhamento, favicons e 404; envio para o Brasil e o exterior em toda a página; dobra "Como comprar" em 5 passos; imagens em WebP; oferta com o mesmo peso para Brasil e exterior (coluna do produto + dois cards iguais); revisão de desempenho concluída (RELATORIO-DESEMPENHO.md)

## Estado atual da página
Arquivos legíveis: index.html, estilos em assets/design_system.css + assets/pagina.css e scripts em assets/design_system.js + assets/pagina.js. LINK_COMPRA, LINK_CONTATO e PRECO ficam no script inline no fim do index.html. A versão publicada sai de `npm run build` (scripts/build.cjs) em dist/: CSS minificado inline no <head> e JS minificado com hash em assets/min/. O vercel.json manda a Vercel rodar o build e publicar dist/, com cache longo para fontes, JS com hash e imagens. dist/ e node_modules/ ficam fora do git.

- <head>: title "Caderninho na Mão! | Profa. Marcia Macedo", description nova, canonical, Open Graph, Twitter (summary_large_image) e theme-color #00854A. A URL de produção (https://caderninho-marcia.vercel.app/) está num comentário no topo do <head>; ao trocar de domínio, mude canonical, og:url, og:image e twitter:image.
- Compartilhamento e ícones: assets/images/og-image.jpg (1200 x 630, cerca de 105 KB), favicon.ico (32 x 32), favicon.svg e apple-touch-icon.png (180 x 180) na raiz, com o ícone de caderno do design system em verde sobre creme.
- 404.html na raiz: "Essa página não está no caderno." com botão "Voltar para a página inicial" (a Vercel usa esse arquivo automaticamente).
- Menu fixo: marca "marcia macedo" e botão "Quero o meu caderninho".
- Hero (#inicio): título "Caderninho na mão!", aquarela do Rio ao fundo, caderno 3D em ciclo (abre e fecha), carimbo .postmark, botão de compra e aviso "Envio para o Brasil e para o exterior". Sem preço na primeira dobra.
- Faixa .wire: "Anote ✳ Pratique ✳ Revise ✳ ...".
- Dobra 2 (#a-frase): "Uma frase que virou caderno."; citação que entra linha a linha com sublinhado dourado; leque de 3 postais clicáveis (Salvador, Amazônia, Foz do Iguaçu) com carimbo girando; caderno 3D fechado que inclina com o mouse e entreabre a capa; fundo com ondas do calçadão (assets/images/ondas-calcadao.svg) em parallax; itens 01, 02, 03 em cascata.
- Dobra 3 (#para-que): vitrine com foto da mão (zoom e brilho no hover; zoom de entrada no celular), carrossel de páginas anotadas que troca sozinho a cada 5 s com barra dourada de progresso, virada de página, botão de pausar, setas, teclado e arraste; ficha de preço com linhas em cascata; objetos decorativos com parallax (dois selos da bandeira, folha e lápis).
- Dobra 4 (#detalhes): "Feito com carinho, página por página." Cinco diferenciais em disclosure (Tamanho A5, Capa com a arte das aulas, Espiral transparente, 100 folhas pautadas, Impresso para você); o caderno 3D gira para mostrar cada um. "Impresso para você" mantém data-detail="06" (pose da contracapa), mas aparece como 05; o número grande segue a numeração visível.
- Dobra 5, oferta (#oferta; a pílula "05 / A OFERTA" faz o papel da etiqueta numerada): fundo verde escuro quase preto com bloom do design system e brilho fraco no canto; varal de bandeirinhas em catenária; título "Seu caderninho, pronto para a próxima aula." Três colunas (até 1180 px): 1) produto, sem card: caderno 3D inteiro com glow, sombra, folha e lápis, lista "O QUE VEM NO CADERNO"; 2) card "Moro no Brasil" (ENVIO NACIONAL, marcador de mapa, frete pelo CEP, entrega pelo correio ou retirada, "Desejo receber pelo correio"); 3) card "Moro fora do Brasil" (ENVIO INTERNACIONAL, globo, frete para o país, número fiscal). Os dois cards são idênticos em estilo e altura: borda com brilho cônico girando (fases diferentes), glow, preço em gradiente creme-ouro que conta de 0,00 até PRECO nos dois juntos, botão .btn-gold com brilho a cada 6 s (defasado). Tablet: produto em cima (caderno e lista lado a lado) e cards lado a lado; celular: caderno, lista, Brasil, exterior. Cabe em 1366 x 768 com os botões visíveis.
- Dobra 6 (#como-comprar), fundo creme: "Comprar é simples. São 5 passos." Linha do tempo em <ol> (alternando lados no computador; à esquerda no celular), linha tracejada que se preenche de verde com o scroll e lápis na ponta, números em círculo que acendem, capturas do Clube de Autores (passo-1 a passo-4) em moldura de navegador com lightbox (dialog.modal do design system), card ilustrado no passo 5, bilhete "Mora fora do Brasil?" com selo e botão dourado com "Enviamos para o Brasil e para o exterior". Todos os botões de compra têm href="#como-comprar" como reserva, então apontam para esta dobra se LINK_COMPRA estiver vazio.
- Dobra 7 (#perguntas): perguntas frequentes em disclosure e cartão de compra fixo com preço e contato. Antes tinha o id como-comprar; o id passou para a dobra de passos.
- Chamada final (#chamada-final): duas colunas (no celular, caderno em cima). Assinatura "CADERNINHO NA MÃO. PORTUGUÊS NO CORAÇÃO." acima do título "Tem uma palavra nova esperando por você.", botão dourado e preço; à direita, caderno 3D grande (320 a 380 px) com rotação real, sombra no chão que acompanha a flutuação, brilho dourado atrás, folha, selo e lápis flutuando em volta, hover com inclinação e capa entreaberta.
- Rodapé: crédito do Clube de Autores, Instagram @portugues_marciamacedo e botão de voltar ao topo.
- Barra de compra no celular: aparece depois da hero, some enquanto a oferta está na tela e some de vez ao chegar na chamada final.
- Botões de compra ([data-compra]): depois do primeiro clique, todos ignoram novos cliques por 3 s e ficam com opacidade .7 (classe .is-enviando, aria-busy). O evento pageshow libera os botões ao voltar pelo histórico. O aria-label de cada botão começa pelo texto visível dele (fora do topo, com " por PRECO" no fim).
- Componente reutilizável Caderninho3D (template #caderno-3d-template) com estados loop, interativo e fechado. O atributo data-caderno-hover liga inclinação pelo mouse, brilho e capa entreaberta (usado na dobra 2, na oferta e na chamada final).
- Scripts de verificação em assets/qa/ (verify-sales.cjs e relatórios .txt).

## Em andamento
- Nada no momento.

## Próximas tarefas (em ordem)
1. Próxima (commit separado): dobra de detalhes no celular com caderno fixo (sticky) e troca dos itens pelo scroll, indicador de progresso, toque que rola até o item, item 03 "Espiral com capa protegida" com a nova descrição. Pedido completo na conversa do Claude Code. Atenção: a lista agora tem 5 itens, não 6 (o pedido fala em 6 pontinhos).

## Pendências que dependem de pessoas (não implementar sem confirmação)
- Retrato da Marcia em aquarela (marcia-aquarela.png), aguardando aprovação dela.
- LINK_CONTATO: canal e responsável ainda não definidos.
- Fotos reais do caderno quando a amostra chegar (substituir a foto da mão, que tem o Pão de Açúcar ao fundo).
- Marcia precisa aprovar as citações atribuídas a ela.
- Adicionar formas de pagamento na oferta quando o Clube de Autores confirmar.
- Trocar o card do passo 5 pela captura passo-5-pagamento.jpg quando ela existir (há um comentário no HTML, dentro do passo 5).
- Adicionar a imagem de fundo oferta-fundo.jpg na dobra de oferta quando ela for gerada (o CSS comentado está no início do bloco da oferta em pagina.css).
- Testar a prévia de compartilhamento depois de cada deploy: https://developers.facebook.com/tools/debug/ e https://www.opengraph.xyz/ (cole https://caderninho-marcia.vercel.app/). No depurador do Facebook, use "Extrair novamente" para limpar o cache da prévia antiga.
- Decidir os itens da seção 4 do RELATORIO-DESEMPENHO.md (mudam o visual ou as animações; nenhum foi aplicado): textura de papel, filtros e máscaras da hero, caderno 3D em ciclo, quantidade de animações contínuas, animações dentro de SVG, fade do título e hero-letter-shine.
- Conferir o primeiro deploy com o build: a página publicada deve ter o CSS inline (procure por <style> no código-fonte) e os scripts em assets/min/. Se o deploy falhar na Vercel, a versão anterior continua no ar.

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
- 27/10/2026: dobra de oferta "A encomenda" (#oferta) entre detalhes e perguntas. Substituída no mesmo dia pela versão em dois cards.
- 27/10/2026: botões de compra protegidos contra clique duplo (3 s), com liberação no pageshow. Testado no Chrome: o segundo clique é bloqueado, o bloqueio vale para todos os botões e some depois de 3 s ou ao voltar pelo histórico.
- 27/10/2026: resposta do FAQ sobre envio para fora do Brasil atualizada; depois, todos os textos de envio passaram a dizer Brasil e exterior (hero, ficha da dobra 3, detalhe "Impresso para você", oferta, perguntas, chamada final e meta descriptions), e "Calculado pelo CEP" virou "Calculado no carrinho".
- 27/10/2026: dobra "Como comprar" com 5 passos, linha do tempo animada pelo scroll e lightbox. Conferida no computador e no celular; lightbox testado com Tab, Esc e volta do foco.
- 27/10/2026: página pronta para compartilhar (title, description, Open Graph, Twitter, canonical, og-image, favicons, theme-color e 404.html).
- 27/10/2026: imagens em WebP responsivo dentro de <picture> e arquivos sem uso em assets/extras/.
- 27/10/2026: oferta refeita em dois cards por local de entrega (exterior em destaque, Brasil secundário). Conferida em 1366 x 768, 1920 x 1080 e no celular, com movimento reduzido e com a contagem do preço.
- 27/10/2026: oferta ajustada para o mesmo peso entre Brasil e exterior (produto + dois cards iguais, Brasil primeiro), sem itens repetidos nos cards. Conferida em 1366 x 768, 1920 x 1080, tablet (820 px) e celular; nada sai da tela.
- 27/10/2026: "Como comprar" com fundo creme, etiquetas renumeradas (05 / A OFERTA na pílula, 06 / COMO COMPRAR, 07 / PERGUNTAS) e teste automático atualizado e passando (31 verificações).
- 27/10/2026: detalhes com "Feito com carinho", descrição "100 folhas (200 páginas) em papel offset 75 g." e o item "Ilustrações do Brasil" removido a pedido do usuário.
- 27/10/2026: oferta sem "menos de R$ 0,33 por página", sem "200 páginas pautadas" no primeiro item do produto (ficou "Caderno A5 (14,8 x 21 cm)") e sem "Nota fiscal emitida pelo Clube de Autores" no card do Brasil, a pedido do usuário. Os cards continuam com a mesma altura e os botões alinhados.
- 27/10/2026: revisão de desempenho concluída. Título da hero entra com animação CSS (sem esperar o JS), content-visibility nas dobras abaixo da primeira, inicialização dessas dobras depois do load, sem layout síncrono nos reinícios de animação, build com CSS inline e JS minificado, vercel.json com cache. Celular: LCP de 7,2 s para 4,1 s (simulado) e 3,1 s (lentidão real); computador: 91 a 94. Detalhes em RELATORIO-DESEMPENHO.md. Visual conferido tela a tela contra a versão anterior, no computador e no celular.

## Decisões registradas
- Venda pelo Clube de Autores, R$ 65,44, com envio para o Brasil e para o exterior (no carrinho, "Desejo receber fora do Brasil", com número fiscal ou documento do país). Textos da página atualizados em 27/10/2026.
- O Pão de Açúcar já aparece na hero e na capa: não repetir em outras dobras.
- Sem rastreamento de cliques por enquanto (decisão de manter simples).
- Dobra 2: brasil-aquarela.png não aparece mais nesta dobra (só na hero). As ondas usam opacidade .2 para ficarem como marca d'água.
- Dobra 2: clicar no postal da frente manda ele para o fundo; clicar em outro traz esse para a frente. No celular, o leque abre sozinho e a capa do caderno entreabre uma vez.
- Dobra 3: a barra dourada de progresso é o próprio relógio do autoplay (o fim da animação avança a página), então ela pausa junto com as animações da página fora da tela, com a aba oculta ou com o botão de pausa do design system. Com movimento reduzido não há autoplay e as trocas usam só fade.
- Dobra 3: o postal do Rio da lateral esquerda virou um segundo selo da bandeira (selo.png). postal.png deixou de ser usado na página.
- Chamada final: foi usada a opção principal (caderno integrado), não a alternativa só com a frase. O caderno ficou bom em duas colunas, com a espiral alinhada e a rotação 3D sem distorção. A faixa com a frase não era uma seção separada, era um rótulo acima do caderno; ele virou a assinatura acima do título.
- Oferta com o mesmo peso para Brasil e exterior: coluna do produto + dois cards de entrega idênticos em estilo, Brasil primeiro.
- Oferta: a etiqueta numerada (sec-rule) não cabe junto com os cards em 1366 x 768; o número fica dentro da pílula: "05 / A OFERTA". Sequência das etiquetas: 02 / A FRASE, 03 / O CADERNO POR DENTRO, 04 / DETALHES, 05 / A OFERTA, 06 / COMO COMPRAR, 07 / PERGUNTAS.
- Oferta: o varal usa só verde, ouro e creme; o azul-marinho some no fundo verde escuro. "menos de R$ 0,33 por página" usa o ouro #F4C542, que tem bom contraste no fundo escuro. A frase "Os dois são o mesmo caderno. Só muda a entrega." saiu. O link condicional "Mora fora do Brasil? Fale com a gente." saiu da oferta (o card internacional cobre isso). O FAQ já tinha a pergunta sobre envio para fora, então não foi duplicada.
- Oferta: a seção anterior (detalhes) é azul-marinho, não clara; a passagem usa a onda do design system no fim dela.
- Clique duplo: o estilo de desabilitado do design system (.btn:disabled) troca o botão para cinza e só vale para <button>; como os botões de compra são links e o pedido aceitava opacidade reduzida, foi usada só a opacidade .7, sem mudar cores.
- og-image: gerada com Playwright a partir de um HTML temporário (já apagado), com as fontes e cores do design system; nenhum texto a menos de 84 px das laterais. O marca.svg antigo continua em assets/images/, mas a página agora usa os favicons da raiz.
- Como comprar: a dobra passou para o fundo creme (como #para-que) para alternar claro e escuro: oferta escura acima, perguntas claras abaixo. Linha do tempo tracejada em verde, números em verde dentro de círculos tracejados em ouro (acesos: verde cheio com número creme), capturas com borda clara e sombra suave, bilhete em papel creme mais claro. A passagem usa a onda do design system no fim da oferta.
- QA: assets/qa/verify-sales.cjs reflete a página atual (title e meta tags, envio Brasil e exterior, dobra 2 com postais, oferta, como comprar, FAQ internacional, cinco cadernos 3D com montagem perto da tela, proteção de clique duplo, barra móvel escondida na oferta). Rodar com: node assets/qa/verify-sales.cjs (31 verificações; o relatório vai para assets/qa/sales-verification.txt). O teste simula a aproximação dos cadernos com mountBooks(), porque fora da hero eles só montam perto da tela. O carregamento do teste dispara o evento load e avança 1 ms, porque as dobras abaixo da primeira só inicializam depois do load.
- Desempenho: a entrada da hero começa em 1% de opacidade (imperceptível) para o Chrome contar o título já na primeira pintura; o fade continua igual (0,8 s). Explicado no relatório.
- Desempenho: as dobras abaixo da primeira usam content-visibility: auto. Capturas de página inteira (fullPage) no Playwright saem em branco nessas dobras; para comparar o visual, role a página e capture tela a tela.
- As pastas assets/qa/npm-cache/ e assets/qa/runtime/ são cache local dos testes e ficam fora do git (.gitignore).
