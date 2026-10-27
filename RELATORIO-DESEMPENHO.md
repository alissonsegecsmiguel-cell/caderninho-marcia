# Relatório de desempenho: Caderninho na Mão!

Data: 27/10/2026. Medições locais com Lighthouse 12.2.1 (Chrome headless), servidor com gzip, sem cache.
"Celular" é o perfil móvel padrão do Lighthouse: rede 4G lenta (150 ms, 1,6 Mbps) e CPU 4x mais lenta.

## 1. Antes e depois

O Lighthouse móvel tem dois modos. O padrão ("simulado", o mesmo do PageSpeed Insights) estima os tempos a partir de uma carga rápida. O modo "devtools" aplica a lentidão de verdade. Os números variam bastante de uma rodada para outra (o TBT simulado foi de 290 a 1.580 ms com a mesma página), então as faixas abaixo vêm de várias rodadas.

| | Início da revisão | Antes desta rodada | Depois |
|---|---|---|---|
| **Celular, simulado** | | | |
| Performance | 31 | 48 a 67 | 59 a 61 |
| LCP | 47,8 s | 6,7 a 7,6 s | 4,1 a 4,2 s |
| TBT | 4.060 ms | 290 a 1.580 ms | 920 a 940 ms |
| CLS | 0 | 0 | 0 |
| Peso total | 12,8 MB | 1,3 a 1,4 MB | 1,05 MB |
| **Celular, lentidão real (devtools)** | | | |
| Performance | não medido | não medido | 73 a 79 |
| LCP | não medido | não medido | 3,1 s (igual ao FCP) |
| TBT | não medido | não medido | 320 a 530 ms |
| **Chrome com 4G lenta e CPU 4x (medição própria)** | | | |
| LCP | não medido | 3,7 a 5,2 s | 2,6 s |
| **Computador** | | | |
| Performance | 40 | 61 a 74 | 91 a 94 |
| LCP | 7,8 s | 1,5 a 2,0 s | 1,3 a 1,4 s |
| TBT | 690 ms | 340 a 500 ms | 70 a 110 ms |
| CLS | 0,002 | 0,002 | 0,002 a 0,007 |
| Peso total | 12,8 MB | 1,4 MB | 1,27 MB |

INP só existe com usuários reais; no laboratório, o TBT é o indicador mais próximo.

## 2. O elemento de LCP e o que foi feito

**Elemento:** o título da hero, `h1.display` ("Caderninho na mão!"). Ele já estava no HTML inicial, sem imagem, sem loading="lazy" e com a fonte em font-display: swap. O atraso tinha outras causas:

1. **A entrada dependia do JS.** O design system esconde todo [data-reveal] (opacidade 0) assim que o JS carrega e só mostra quando o IntersectionObserver dispara. Com a CPU lenta, isso acontecia depois dos dois scripts e de uma tarefa longa de pagina.js. O título só aparecia entre 3,7 e 5,2 s.
2. **A primeira pintura era cara.** O navegador calculava estilo e layout da página inteira (mais de 1.000 elementos, 5 cadernos 3D) antes de pintar a primeira tela. Isso dava uma tarefa de cerca de 700 a 900 ms com a CPU 4x mais lenta.
3. **Folhas de estilo bloqueantes.** Eram dois CSS externos de 64 e 70 KB.

**O que foi feito, sem mudar o visual:**
- A entrada da hero agora é uma animação CSS com as mesmas keyframes, duração (800 ms), easing e atrasos (0 a 480 ms) do [data-reveal] do design system. Ela começa na primeira pintura, sem esperar o JS.
- A animação começa em 1% de opacidade, em vez de 0, o que é imperceptível. Assim o Chrome conta o título como pintado na primeira pintura. Isso melhora principalmente a medição: o texto continua aparecendo com o mesmo fade de 0,8 s.
- `content-visibility: auto` nas dobras abaixo da primeira: o navegador só calcula estilo, layout e pintura delas quando chegam perto da tela.
- O CSS da página vai minificado e inline no `<head>` da versão publicada. Não há mais folha de estilo bloqueando a primeira pintura.

## 3. O que foi otimizado

**Imagens**
- WebP responsivo em `<picture>` com srcset e sizes, mantendo o original como alternativa. O peso caiu de 12,8 MB para cerca de 1,1 MB; a aquarela da hero, por exemplo, foi de 2,6 MB para 57 a 244 KB.
- Transparência mantida em selo, folha e lápis. width e height em todas as imagens. Preload com fetchpriority="high" da aquarela e da capa da hero; nada da primeira dobra usa loading="lazy".
- Arquivos sem uso foram movidos para assets/extras/.

**Fontes**
- WOFF2, fontes variáveis (um arquivo por família) e font-display: swap.
- Preload só de Inter Tight e Manrope, da primeira dobra. Caveat só baixa na dobra 3, por unicode-range.

**CSS e JS**
- `npm run build` gera dist/: CSS minificado inline (123 KB, cerca de 25 KB com gzip) e JS minificado em assets/min/ com hash na URL.
- Os arquivos legíveis continuam sendo os que se editam. A Vercel roda o build a cada deploy (vercel.json).
- Scripts continuam com defer.
- A inicialização das dobras abaixo da primeira espera o evento load e um momento ocioso (requestIdleCallback).
- Os cadernos 3D fora da hero só são montados a 900 px da tela.
- Três reinícios de animação forçavam layout síncrono (`void elemento.offsetWidth`) e agora usam dois quadros. A inicialização da dobra 3 caiu de 394 ms para 11 ms, e a dos detalhes de 151 ms para 1 ms (CPU 4x).

**Animações**
- Animações em ::before e ::after agora pausam fora da tela. Antes, o brilho das seções e os brilhos da oferta rodavam sempre.
- `.pulse` não anima mais box-shadow (agora é transform e opacity).
- Continuam pausadas fora da tela (design system e IntersectionObserver): caderno 3D, postais, ondas, glows, folhas, selos, faixa .wire, varal, carrossel automático, lápis da linha do tempo.
- Scroll e mouse usam requestAnimationFrame e eventos passivos.
- will-change não é usado de forma permanente.

**Cache (vercel.json)**
- Fontes e JS com hash: 1 ano, immutable.
- Imagens: 30 dias, com stale-while-revalidate de 1 dia.

## 4. O que ainda pode melhorar, mas muda o visual ou as animações (NÃO aplicado)

Os ganhos de FCP/LCP vêm de um teste com a CPU 4x mais lenta, desligando cada item separadamente. A primeira pintura média estava em cerca de 1,6 s sem rede lenta. São estimativas com bastante variação.

| Item | Ganho estimado | Impacto visual |
|---|---|---|
| 1. Textura de papel (body::before com feTurbulence em tela cheia, opacidade 2,5%) | Primeira pintura cerca de 0,5 s mais rápida no celular; menos trabalho em cada quadro | Some o granulado muito leve do papel. Alternativa: um bloco de imagem pronto (quase igual, mas acrescenta 150 a 300 KB) |
| 2. Filtros, máscaras e mix-blend-mode da hero (folhas em multiply, máscara da aquarela viva, drop-shadow do ✳, blur das sombras) | Primeira pintura cerca de 0,4 a 0,5 s mais rápida | As folhas e a aquarela perdem a mistura suave com o fundo; seria preciso exportar versões já mescladas |
| 3. Caderno 3D em ciclo na hero (preserve-3d, 22 argolas, abre e fecha sem parar) | Cerca de 0,25 s na primeira pintura e menos TBT | Trocar por uma imagem ou por um caderno parado que só abre uma vez |
| 4. Quantidade de animações contínuas na hero (cerca de 13 ao mesmo tempo: glow, folhas, bandeira, ✳, carimbo, caderno, setas, fitas, faixa .wire) | Grande no TBT: cada animação ativa gera um recálculo de estilo por quadro (cerca de 0,9 s de trabalho a cada 2 s em CPU rápida) | Menos movimento na primeira dobra, ou parar as animações decorativas depois de alguns segundos |
| 5. Animações dentro de SVG (fitas das seções, bandeirinhas, anel do carimbo, folha decorativa) | Médio: o Chrome não passa essas animações para o compositor | Refazer como camadas HTML (visual igual, mas muda a estrutura do design system) |
| 6. Fade de entrada do título | LCP real: o texto ficaria legível 0,8 s antes (a medição já conta o título na primeira pintura) | O título aparece sem o fade de entrada |
| 7. hero-letter-shine (brilho dourado em "na mão!", anima background-position) | Pequeno: repinta só uma palavra, por 2 s a cada 7,2 s | Trocar por um brilho com transform exige duplicar o texto com máscara (pode mudar um pouco o brilho) ou retirar o efeito |

Sem mudar o visual, ainda dá para tirar do CSS da página as regras usadas só no catálogo do design system (parte dos 123 KB inline). O ganho seria de 10 a 15 KB com gzip e menos estilo para calcular. Não foi feito agora porque exige conferir cada classe usada pelo JS.

### Metas
- **LCP abaixo de 2,5 s no celular:** ainda não chegou, mas ficou perto. Com lentidão real no Chrome, o LCP foi de 2,6 s; no Lighthouse devtools, 3,1 s; no simulado, 4,1 s. O título agora entra junto com a primeira pintura, então o que resta é o tempo até a primeira pintura. O piso é o HTML de cerca de 40 KB numa 4G lenta mais a pintura inicial da hero (cerca de 0,9 s de CPU no celular simulado). Os itens 1 a 4 são os que mais baixariam esse piso.
- **Performance acima de 90 no celular:** ainda não chegou (59 a 61 simulado, 73 a 79 devtools). Além do LCP, falta reduzir o TBT, que vem quase todo das animações contínuas da primeira dobra (itens 3 a 5). No computador, a meta foi atingida (91 a 94).
- **CLS abaixo de 0,1:** atingida (0 no celular, até 0,007 no computador).
