# Caderninho na Mão! (página de vendas da Profa. Marcia Macedo)

## Antes de começar qualquer tarefa
1. Rode git pull para garantir que está na versão mais recente.
2. Leia o HANDOFF.md inteiro. Se houver uma tarefa marcada como "em andamento", confira com git status e git log se ela foi concluída antes de começar outra coisa.
3. Consulte o design system: assets/design_system.html, assets/design_system.css e assets/design_system.js.

## Regras obrigatórias
- Sempre use o design system. Use as classes, cores, fontes, easings e animações que já existem. Nunca crie um visual novo do zero.
- Estilos novos vão em assets/pagina.css. Scripts novos vão em assets/pagina.js.
- Paleta: verde #00854A, ouro #F4C542, azul-marinho #17365B, base creme.
- Variáveis editáveis ficam no topo do script: LINK_COMPRA, PRECO e LINK_CONTATO.
- Imagens ficam em assets/images/. Use JPG para fotos e aquarelas; PNG só quando houver transparência.
- Anime somente transform e opacity. Respeite prefers-reduced-motion. Pause animações fora da tela.
- Textos da página em português do Brasil, sem travessões.
- Prefira commits pequenos e frequentes, para que o trabalho não se perca se a sessão acabar no meio.

## Ao terminar cada tarefa
1. Confira a página no computador e no celular.
2. Atualize o HANDOFF.md: mova a tarefa para "Concluído" com a data, registre decisões tomadas e anote qualquer coisa que ficou pela metade ou precisa de atenção.
3. Faça um commit com uma mensagem curta e descritiva em português e faça o push para a branch main do repositório alissonsegecsmiguel-cell/caderninho-marcia.

## Se a sessão estiver perto do limite
Pare em um ponto estável, atualize o HANDOFF.md com o que falta exatamente (arquivos e passos), faça commit e push.
