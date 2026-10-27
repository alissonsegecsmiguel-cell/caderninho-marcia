# HANDOFF: diário de passagem

## Última sessão
- Ferramenta: Claude Code
- Data: 27/10/2026
- Resumo: criação do AGENTS.md, CLAUDE.md e HANDOFF.md; Dobra 2 nova (leque de postais, ondas do calçadão, caderno 3D com hover, citação animada)

## Estado atual da página
Arquivo único index.html, com estilos em assets/design_system.css + assets/pagina.css e scripts em assets/design_system.js + assets/pagina.js. LINK_COMPRA, LINK_CONTATO e PRECO ficam no script inline no fim do index.html.

- Menu fixo: marca "marcia macedo" e botão "Quero o meu caderninho".
- Hero (#inicio): título "Caderninho na mão!", aquarela do Rio ao fundo, caderno 3D em ciclo (abre e fecha), carimbo .postmark, botão de compra e aviso "Envio para endereços no Brasil". Sem preço na primeira dobra.
- Faixa .wire: "Anote ✳ Pratique ✳ Revise ✳ ...".
- Dobra 2 (#a-frase): "Uma frase que virou caderno."; citação que entra linha a linha com sublinhado dourado; leque de 3 postais clicáveis (Salvador, Amazônia, Foz do Iguaçu) com carimbo girando; caderno 3D fechado que inclina com o mouse e entreabre a capa; fundo com ondas do calçadão (assets/images/ondas-calcadao.svg) em parallax; itens 01, 02, 03 em cascata.
- Dobra 3 (#para-que): vitrine com foto da mão segurando o caderno, carrossel de páginas anotadas (setas, teclado e arraste) e objetos decorativos com parallax (postal, folha, selo, lápis).
- Dobra 4 (#detalhes): seis diferenciais em disclosure; o caderno 3D gira para mostrar cada um (A5, acetato, espiral, 100 folhas, miolo, contracapa real).
- Dobra 5 (#como-comprar): perguntas frequentes em disclosure e cartão de compra fixo com preço e contato.
- Chamada final (#chamada-final): "Tem uma palavra nova esperando por você.", caderno 3D fechado e botão de compra.
- Rodapé: crédito do Clube de Autores, Instagram @portugues_marciamacedo e botão de voltar ao topo.
- Barra de compra no celular: aparece depois da hero e some ao chegar na chamada final.
- Componente reutilizável Caderninho3D (template #caderno-3d-template) com estados loop, interativo e fechado.
- Scripts de verificação em assets/qa/ (verify-sales.cjs e relatórios .txt).

## Em andamento
- Fila pedida pelo usuário em 27/10/2026, nesta ordem: Dobra 3 (carrossel automático), compartilhamento (meta tags, og-image, favicon, 404) e revisão de desempenho por último. Os pedidos completos estão na conversa do Claude Code; o resumo está em "Próximas tarefas".

## Próximas tarefas (em ordem)
1. Dobra 3: carrossel automático a cada 5 s com barra de progresso, pausa no hover, toque e foco; hover com zoom e inclinação 3D; trocar o postal flutuante do Rio pelo selo.png.
2. Compartilhamento: title e description novos, og-image.jpg 1200 x 630, Open Graph e Twitter, canonical, favicon (ico, svg, apple-touch-icon), theme-color #00854A e 404.html.
3. Revisão final de velocidade e fluidez (sempre por último): Lighthouse antes e depois, WebP/AVIF com srcset, fontes, minificação, vercel.json com cache, mover arquivos sem uso para assets/extras/, RELATORIO-DESEMPENHO.md.

## Pendências que dependem de pessoas (não implementar sem confirmação)
- Retrato da Marcia em aquarela (marcia-aquarela.png), aguardando aprovação dela.
- LINK_CONTATO: canal e responsável ainda não definidos.
- Fotos reais do caderno quando a amostra chegar (substituir a foto da mão, que tem o Pão de Açúcar ao fundo).
- Marcia precisa aprovar as citações atribuídas a ela.

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

## Decisões registradas
- Venda pelo Clube de Autores, R$ 65,44, envio só para o Brasil.
- O Pão de Açúcar já aparece na hero e na capa: não repetir em outras dobras.
- Sem rastreamento de cliques por enquanto (decisão de manter simples).
- Dobra 2: brasil-aquarela.png não aparece mais nesta dobra (só na hero). As ondas usam opacidade .2 para ficarem como marca d'água.
- Dobra 2: clicar no postal da frente manda ele para o fundo; clicar em outro traz esse para a frente. No celular, o leque abre sozinho e a capa do caderno entreabre uma vez.
- As pastas assets/qa/npm-cache/ e assets/qa/runtime/ são cache local dos testes e ficam fora do git (.gitignore).
