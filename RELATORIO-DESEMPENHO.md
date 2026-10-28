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

## Endereço novo vs. vercel.app

Medição em 28/10/2026, sobre a versão publicada do commit `073121e`, sem alterar a página entre os testes.

- Novo: https://l.fluenti.com.br/caderninho/
- Antigo: https://caderninho-marcia.vercel.app/

**Resultado: não foi demonstrada uma regressão causada pelo endereço novo.** A mediana de Performance foi 67 nos dois; o LCP diferiu em 21 ms. O conteúdo entregue, as políticas de cache, a compressão e os caminhos dos preloads são equivalentes. As diferenças entre as URLs ficam dentro das faixas observadas nas próprias rodadas. Não foi aplicada nenhuma otimização ou mudança de rota, visual, texto ou animação.

### Método e limites

Lighthouse **13.6.0**, Chrome **156.0.0.0**, Node **24.16.0**, perfil móvel 412 × 823, DPR 1,75, rede simulada com RTT 150 ms e 1.638,4 Kbps, CPU 4x. Três auditorias por URL, sequenciais, sem outro teste de navegador em paralelo e com um perfil limpo do Chrome por auditoria. Ordem: novo 1, antigo 1, antigo 2, novo 2, novo 3, antigo 3. Cada valor da tabela é a mediana independente das três medidas daquela métrica.

As primeiras tentativas de execução local e a série preliminar com Lighthouse 12.2.1 foram descartadas. A versão 12 apresentou erro no diagnóstico TraceElements/RootCauses (`frame_sequence`) com o Chrome atual, mesmo retornando métricas. As seis auditorias finais com a versão 13.6.0 concluíram sem erros de auditoria. Os números desta seção não devem ser tratados como uma evolução dos testes locais de 27/10: ferramenta, Chrome e acesso ao servidor são diferentes. A comparação válida aqui é entre as duas URLs na mesma série.

A amostra é de laboratório, sem um Android físico ou dados reais dos alunos. Medir várias vezes e considerar a dispersão evita atribuir ao código uma variação do ambiente, conforme a [documentação de variabilidade do Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md).

### Medianas lado a lado

| Métrica móvel | Novo, `/caderninho/` | Antigo, raiz `.vercel.app` |
|---|---:|---:|
| Performance | **67** | **67** |
| LCP | 1,146 s | 1,125 s |
| FCP | 1,146 s | 1,125 s |
| TBT | 2.615,5 ms | 2.768,5 ms |
| CLS | 0 | 0 |
| Speed Index | 4,940 s | 4,658 s |
| Peso transferido | 1.155.283 B, cerca de 1,16 MB | 1.155.343 B, cerca de 1,16 MB |
| Requisições HTTP(S) | 17 | 17 |

O trace também contém duas imagens SVG em `data:`: não são pedidos HTTP e não acrescentam bytes de rede. As diferenças de poucos bytes no total transferido vêm dos cabeçalhos; os corpos comparados por SHA-256 são idênticos.

| Rodada | Performance novo / antigo | LCP novo / antigo | TBT novo / antigo |
|---|---:|---:|---:|
| 1 | 65 / 67 | 2,002 / 1,125 s | 2.615,5 / 3.192,0 ms |
| 2 | 67 / 66 | 1,146 / 1,890 s | 3.184,5 / 2.768,5 ms |
| 3 | 68 / 69 | 1,088 / 1,060 s | 2.611,0 / 2.160,5 ms |

Performance variou de 65 a 68 no novo e de 66 a 69 no antigo. LCP variou de 1,088 a 2,002 s e de 1,060 a 1,890 s, respectivamente. O Speed Index também tem faixas sobrepostas: 4,489–4,988 s e 4,394–4,991 s. A diferença entre medianas não apresenta um padrão consistente de piora do novo domínio.

### Network, preloads e cache frio

Uma captura adicional via Chrome DevTools Protocol aplicou a rede de 150 ms / 1.638,4 Kbps e CPU 4x de verdade, na mesma tela móvel. Foram registrados os recursos até 5 s após o carregamento e as fontes ficarem prontas, primeiro sem cache do navegador e depois numa segunda navegação com cache. Não se deve misturar esses tempos com as estimativas do Lighthouse.

| Captura CDP | Novo | Antigo |
|---|---:|---:|
| Requisições HTTP, primeira visita | 16 | 16 |
| Bytes transferidos, primeira visita | 1.143.743 | 1.143.757 |
| Requisições HTTP, segunda visita | 15 | 15 |
| Bytes transferidos, segunda visita | 146 | 147 |
| Downloads repetidos da mesma URL | 0 | 0 |
| Erros 404 / falhas / imagens quebradas | 0 / 0 / 0 | 0 / 0 / 0 |
| Redirects na URL HTTPS final | 0 | 0 |
| TTFB do pedido de HTML, primeira visita | 60,9 ms | 58,9 ms |
| LCP observado, primeira visita | 2,448 s | 2,276 s |
| LCP observado, segunda visita | 0,540 s | 0,744 s |

Os bytes quentes são os contados pelo CDP para as respostas de rede: os arquivos vieram do cache local e restou a validação do HTML. Não incluem todo o tráfego de conexão/TLS. A contagem do Lighthouse inclui ainda `lapis-480.webp`, uma imagem decorativa lazy que não apareceu no recorte temporal da captura CDP. Em cada método, os dois endereços solicitaram a mesma quantidade de arquivos.

O LCP observado pelo PerformanceObserver é o **título `h1#inicio-titulo`**, e não uma imagem. Inter Tight e Manrope vieram dos preloads, com prioridade High e uma única requisição por arquivo. A aquarela `brasil-aquarela-1024.webp` também veio do preload, prioridade High, exatamente na URL usada pela imagem. A capa `capa-700.webp` foi pré-carregada uma vez, com a prioridade Low já existente em ambos. Na navegação fria, os quatro pedidos começaram por volta de **322 ms no novo e 364–365 ms no antigo**, antes de terminar o HTML. Os preloads não apontaram para arquivos fora de `/caderninho/` no domínio oficial.

As alternativas PNG das imagens responsivas não foram baixadas por erro de WebP. Há, nos dois endereços, a transferência da capa JPEG de fallback do caderno antes da montagem do componente e também da capa WebP: são arquivos distintos e um custo comum, não uma duplicação provocada pelo rewrite.

Os endereços HTTPS finais não acrescentam saltos. `/caderninho` sem a barra faz o 308 esperado para `/caderninho/`. `http://` faz um 308 para HTTPS nos dois domínios. Os recursos e preloads da página usam diretamente os caminhos finais, sem esses redirects.

**Cache frio:** não foi observado cache frio de CDN nos recursos críticos: HTML, aquarela, JS e fonte responderam HIT nos dois domínios. Um navegador que já visitava o endereço antigo pode precisar baixar os arquivos novamente ao visitar o novo, pois a URL integra a chave de cache HTTP, conforme a [RFC 9111](https://httpwg.org/specs/rfc9111.html#caching.overview). Essa é uma hipótese plausível para uma primeira visita parecer mais lenta, demonstrada pelo contraste frio/quente acima, mas não foi confirmada no aparelho que originou o relato. O DNS do sistema operacional não foi limpo entre visitas.

### Cabeçalhos HTTP

Captura com `curl -I`, anunciando os mesmos formatos de compressão. Todos os recursos retornaram 200 e tipos MIME corretos. `x-vercel-id` apontou a região `gru1` nos dois domínios. As idades abaixo são amostras daquele instante, em segundos.

| Recurso relativo à página | Cache-Control, igual nos dois | Content-Encoding, igual nos dois | Novo: x-vercel-cache / age | Antigo: x-vercel-cache / age |
|---|---|---|---|---|
| HTML | `public, max-age=0, must-revalidate` | `br` | HIT / 1564 | HIT / 243 |
| `assets/images/brasil-aquarela-1024.webp` | `public, max-age=2592000, stale-while-revalidate=86400` | ausente, WebP já comprimido | HIT / 1564 | HIT / 1568 |
| `assets/design_system.css` | `public, max-age=0, must-revalidate` | `br` | MISS / 0 | HIT / 3 |
| `assets/min/design_system.js?v=7313f395fb` | `public, max-age=31536000, immutable` | `br` | HIT / 1213 | HIT / 1217 |
| `assets/fonts/inter-tight-latin.woff2` | `public, max-age=31536000, immutable` | ausente, WOFF2 já comprimido | HIT / 1214 | HIT / 1218 |
| `favicon.svg` | `public, max-age=0, must-revalidate` | ausente | HIT / 1211 | HIT / 1215 |
| `assets/images/og-image.jpg` | `public, max-age=2592000, stale-while-revalidate=86400` | ausente, JPEG já comprimido | MISS / 0 | HIT / 3 |

Os tipos foram, respectivamente, `text/html`, `image/webp`, `text/css`, `application/javascript`, `font/woff2`, `image/svg+xml` e `image/jpeg`, com charset UTF-8 nos textos. Os sete pares tiveram o mesmo SHA-256 após descompressão, incluindo o HTML de 180.379 B. As regras de cache de `/caderninho/assets/` já funcionam, inclusive para `og-image.jpg`.

O CSS da página publicada está **inline no HTML**, portanto não existe uma requisição CSS bloqueante no carregamento. O MISS do arquivo-fonte CSS consultado separadamente não afeta a primeira dobra. `og-image.jpg` também não é solicitado pelo carregamento normal da página; seu primeiro MISS não explica a lentidão relatada. O favicon continua com revalidação nos dois, sem um problema exclusivo do novo endereço.

### O que pesa mais e decisão

Mediana dos bytes transferidos por arquivo nos três Lighthouse, em kB decimais, incluindo cabeçalhos. Os caminhos estão normalizados, retirando `/caderninho/` apenas para comparar os mesmos arquivos.

| Arquivo | Novo, kB | Antigo, kB |
|---|---:|---:|
| `assets/images/capa.jpg` | 363,0 | 363,0 |
| `assets/images/brasil-aquarela-1024.webp` | 132,0 | 132,0 |
| `assets/images/capa-700.webp` | 124,6 | 124,6 |
| `assets/images/folha-700.webp` | 105,4 | 105,4 |
| `assets/images/mao-caderno-800.webp` | 99,0 | 99,0 |
| `assets/fonts/caveat-latin.woff2` | 75,1 | 75,1 |
| `assets/fonts/inter-tight-latin.woff2` | 45,1 | 45,1 |
| HTML, com CSS inline | 42,9 | 42,9 |
| `assets/images/selo-480.webp` | 38,8 | 38,9 |
| `assets/fonts/jetbrains-mono-latin.woff2` | 31,5 | 31,5 |

Nos dois, imagens representam cerca de 77% da transferência, fontes 17%, HTML 4% e JS 2%. A capa JPEG sozinha responde por cerca de 31%. O custo de CPU também é comum: no período observado, Style & Layout teve medianas de 2,93 s no novo e 2,84 s no antigo; a avaliação de scripts ficou em 159 e 153 ms. Isso é compatível com o diagnóstico histórico de renderização e animações, sem identificar isoladamente qual efeito causa cada tarefa. Ambos continuam abaixo da meta de Performance 90 pelo TBT e pelo Speed Index, embora o LCP desta série esteja abaixo de 2,5 s.

**Etapas 2 e 3 não acionadas:** não foi encontrada uma causa de entrega que prejudique especificamente a URL nova. Nenhum arquivo de aplicação, cache, redirect, preload, fonte ou animação foi alterado. Não há um "depois da correção" a medir ou uma melhora a atribuir ao código. As opções que mudam o visual ou as animações continuam somente na seção 4, sem aplicação.

Dados resumidos, hashes e resultados de cada rodada: [assets/qa/comparacao-enderecos.json](assets/qa/comparacao-enderecos.json). Scripts reproduzíveis: `assets/qa/compare-lighthouse.cjs` e `assets/qa/compare-network.cjs`; relatórios Lighthouse completos, waterfalls, cabeçalhos crus e capturas ficam em `assets/qa/runtime/url-comparison/`, ignorado pelo git. A pasta de QA não é copiada para o site publicado.

Para repetir no PowerShell, mantendo a ferramenta fora da pasta sincronizada:

```powershell
$lhDir = Join-Path $env:TEMP 'caderninho-lighthouse'
npm.cmd install --prefix "$lhDir" --cache assets/qa/npm-cache --no-save --package-lock=false lighthouse@13.6.0
$env:LIGHTHOUSE_CLI = Join-Path $lhDir 'node_modules/lighthouse/cli/index.js'
node assets/qa/compare-lighthouse.cjs before
node assets/qa/compare-network.cjs
```

Os dois scripts devem rodar em sequência. `CHROME_PATH` permite indicar outro executável do Chrome. Não execute outros testes de navegador enquanto o Lighthouse estiver medindo.
