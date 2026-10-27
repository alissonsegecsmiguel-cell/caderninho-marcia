# HANDOFF: diário de passagem

## Última sessão
- Ferramenta: Claude Code
- Data: 27/10/2026
- Resumo: criação do AGENTS.md, CLAUDE.md e HANDOFF.md

## Estado atual da página
Arquivo único index.html, com estilos em assets/design_system.css + assets/pagina.css e scripts em assets/design_system.js + assets/pagina.js. LINK_COMPRA, LINK_CONTATO e PRECO ficam no script inline no fim do index.html.

- Menu fixo: marca "marcia macedo" e botão "Quero o meu caderninho".
- Hero (#inicio): título "Caderninho na mão!", aquarela do Rio ao fundo, caderno 3D em ciclo (abre e fecha), carimbo .postmark, botão de compra e aviso "Envio para endereços no Brasil". Sem preço na primeira dobra.
- Faixa .wire: "Anote ✳ Pratique ✳ Revise ✳ ...".
- Dobra 2 (#a-frase): "Uma frase que virou caderno.", citação da professora, postal com brasil-aquarela.png, capa estática do caderno e três itens 01, 02, 03.
- Dobra 3 (#para-que): vitrine com foto da mão segurando o caderno, carrossel de páginas anotadas (setas, teclado e arraste) e objetos decorativos com parallax (postal, folha, selo, lápis).
- Dobra 4 (#detalhes): seis diferenciais em disclosure; o caderno 3D gira para mostrar cada um (A5, acetato, espiral, 100 folhas, miolo, contracapa real).
- Dobra 5 (#como-comprar): perguntas frequentes em disclosure e cartão de compra fixo com preço e contato.
- Chamada final (#chamada-final): "Tem uma palavra nova esperando por você.", caderno 3D fechado e botão de compra.
- Rodapé: crédito do Clube de Autores, Instagram @portugues_marciamacedo e botão de voltar ao topo.
- Barra de compra no celular: aparece depois da hero e some ao chegar na chamada final.
- Componente reutilizável Caderninho3D (template #caderno-3d-template) com estados loop, interativo e fechado.
- Scripts de verificação em assets/qa/ (verify-sales.cjs e relatórios .txt).

## Em andamento
- Dobra 2 (Claude Code, 27/10/2026): os três postais já foram convertidos para JPG (postal-salvador.jpg, postal-amazonia.jpg, postal-iguacu.jpg, 1536 x 1024, qualidade 82) e os PNGs apagados, ainda sem commit. Falta o HTML, CSS e JS da dobra.

## Próximas tarefas (em ordem)
1. Dobra 2: leque de postais (Salvador, Amazônia, Iguaçu), fundo com ondas do calçadão, caderno 3D com hover, citação animada. Os PNGs dos postais já estão em assets/images/ e devem ser convertidos para JPG.
2. Link de compra: LINK_COMPRA = https://clubedeautores.com.br/livro/caderninho-na-mao-prof-marcia-macedo?cart=true em todos os botões, abrindo na mesma aba. (Já feito no código, ver "Concluído".)
3. Dobra 3: carrossel automático a cada 5 s com barra de progresso, pausa no hover, toque e foco; hover com zoom e inclinação 3D; trocar o postal flutuante do Rio pelo selo.png.
4. Revisão final de velocidade e fluidez (sempre por último).

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

## Decisões registradas
- Venda pelo Clube de Autores, R$ 65,44, envio só para o Brasil.
- O Pão de Açúcar já aparece na hero e na capa: não repetir em outras dobras.
- Sem rastreamento de cliques por enquanto (decisão de manter simples).
- As pastas assets/qa/npm-cache/ e assets/qa/runtime/ são cache local dos testes e ficam fora do git (.gitignore).
