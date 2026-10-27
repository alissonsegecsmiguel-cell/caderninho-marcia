/* Brasil em cada palavra — local, dependency-free design system and catalogue.
   Reuses the source CSS/JS contracts; see the visible movement reference table. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope?.querySelector(selector) ?? null;
  const $$ = (selector, scope = document) => [...(scope?.querySelectorAll(selector) ?? [])];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduced.matches;

  const icon = name => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

  // One shared icon sprite for the catalogue and every consuming page.
  const spriteMarkup = "<svg class=\"svg-sprite\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n    <defs>\n      <symbol id=\"i-arrow\" viewBox=\"0 0 24 24\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></symbol>\n      <symbol id=\"i-arrow-up\" viewBox=\"0 0 24 24\"><path d=\"M6 18 18 6M6 6h12v12\"/></symbol>\n      <symbol id=\"i-book\" viewBox=\"0 0 24 24\"><rect x=\"6\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M10 3v18M3 7h5M3 12h5M3 17h5M13 8h4M13 12h4\"/></symbol>\n      <symbol id=\"i-pencil\" viewBox=\"0 0 24 24\"><path d=\"m15 4 5 5M4 20l1-6L16 3a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L10 19l-6 1ZM5 14l5 5\"/></symbol>\n      <symbol id=\"i-chat\" viewBox=\"0 0 24 24\"><path d=\"M20 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 16-5Z\"/><path d=\"M8 10h8M8 14h5\"/></symbol>\n      <symbol id=\"i-map\" viewBox=\"0 0 24 24\"><path d=\"m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15\"/></symbol>\n      <symbol id=\"i-sun\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5\"/></symbol>\n      <symbol id=\"i-leaf\" viewBox=\"0 0 24 24\"><path d=\"M20 3C8 2 2 8 5 15c3 7 15 5 15-12ZM3 22 16 8M10 15v-5M10 15h5\"/></symbol>\n      <symbol id=\"i-heart\" viewBox=\"0 0 24 24\"><path d=\"M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 2 11 8 15 6-4 13-10 8-15Z\"/></symbol>\n      <symbol id=\"i-mountain\" viewBox=\"0 0 24 24\"><path d=\"M2 21c4 0 2-10 7-10s3 10 6 10M10 21c4-2 1-16 7-17 5 0 3 14 5 17M8 8l10-6M13 6v3\"/><rect x=\"11\" y=\"9\" width=\"4\" height=\"3\" rx=\"1\"/></symbol>\n      <symbol id=\"i-palm\" viewBox=\"0 0 24 24\"><path d=\"M11 22c3-6 4-10 2-15M13 7C7 2 4 5 2 8c5-1 8-1 11-1ZM13 7c1-7 7-5 9 0-4-2-6-2-9 0ZM13 7c-5 0-7 3-6 7l6-7ZM13 7c6-2 8 3 7 7l-7-7ZM7 22h11\"/></symbol>\n      <symbol id=\"i-wave\" viewBox=\"0 0 24 24\"><path d=\"M2 8c4-6 6 6 10 0s6 6 10 0M2 16c4-6 6 6 10 0s6 6 10 0\"/></symbol>\n      <symbol id=\"i-check\" viewBox=\"0 0 24 24\"><path d=\"m5 12 4 4L19 6\"/></symbol>\n      <symbol id=\"i-close\" viewBox=\"0 0 24 24\"><path d=\"m6 6 12 12M6 18 18 6\"/></symbol>\n      <symbol id=\"i-copy\" viewBox=\"0 0 24 24\"><rect x=\"8\" y=\"8\" width=\"12\" height=\"13\" rx=\"2\"/><path d=\"M15 8V3H3v13h5\"/></symbol>\n      <symbol id=\"i-play\" viewBox=\"0 0 24 24\"><path d=\"m9 5 11 7-11 7V5Z\"/></symbol>\n      <symbol id=\"i-spark\" viewBox=\"0 0 24 24\"><path d=\"m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z\"/></symbol>\n      <symbol id=\"i-info\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7v.1\"/></symbol>\n    </defs>\n  </svg>";
  if (!$('.svg-sprite')) document.body.insertAdjacentHTML('afterbegin', spriteMarkup);

  // WCAG relative luminance. Ratios always name the actual tested pair.
  function rgb(hex) { return hex.replace('#', '').match(/../g).map(v => parseInt(v, 16)); }
  function luminance(hex) {
    return rgb(hex).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  }
  function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function hsl(hex) {
    let [r, g, b] = rgb(hex).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  function initCatalogue() {
    const typography = [
      {role:'H1 / display',family:'Inter Tight',weight:700,size:'clamp(56, 7.7vw, 116)',lh:'1.02',ls:'−0.055em',sample:'Um Brasil de encontros.',css:'font-family:var(--sans);font-weight:700;font-size:60px;line-height:1.02;letter-spacing:-.055em',note:'56–116 px; hero: 76–104 px / 0.99; ≥1600 px: 116 px; ≤720 px: 67–88 px; ≤370 px: 62 px'},
      {role:'Lettering / transparente',family:'Inter Tight',weight:600,size:'1.19 × H1',lh:'1.08',ls:'−0.065em',sample:'brasileira.',css:'font-family:var(--sans);font-weight:600;font-size:60px;line-height:1.08;letter-spacing:-.065em;color:transparent;-webkit-text-fill-color:transparent;-webkit-text-stroke:1.35px var(--outline)',note:'Contorno 1,35 px: verde no creme; creme sobre verde-escuro e azul. Mobile: 1,13 × H1, contorno 1,1 px. Expressivo; não carrega instruções essenciais.'},
      {role:'H2 / seção',family:'Inter Tight',weight:600,size:'clamp(40, 4.6vw, 72)',lh:'1.06',ls:'−0.04em',sample:'O Brasil acontece.',css:'font-family:var(--sans);font-weight:600;font-size:45px;line-height:1.06;letter-spacing:-.04em',note:'40–72 px; ajustes da seção: 38–54 px no celular'},
      {role:'H3 / grupo',family:'Inter Tight',weight:600,size:'32',lh:'1.18',ls:'−0.035em',sample:'Uma conversa boa.',css:'font-family:var(--sans);font-weight:600;font-size:32px;line-height:1.18;letter-spacing:-.035em'},
      {role:'H4 / card',family:'Inter Tight',weight:600,size:'24',lh:'1.25',ls:'−0.025em',sample:'Palavras que aproximam.',css:'font-family:var(--sans);font-weight:600;font-size:24px;line-height:1.25;letter-spacing:-.025em'},
      {role:'H5 / subtítulo',family:'Inter Tight',weight:600,size:'20',lh:'1.30',ls:'−0.015em',sample:'Seu próximo capítulo.',css:'font-family:var(--sans);font-weight:600;font-size:20px;line-height:1.3;letter-spacing:-.015em'},
      {role:'H6 / apoio',family:'Inter Tight',weight:600,size:'17',lh:'1.40',ls:'−0.01em',sample:'Uma descoberta de cada vez.',css:'font-family:var(--sans);font-weight:600;font-size:17px;line-height:1.4;letter-spacing:-.01em'},
      {role:'Body-lg',family:'Manrope',weight:400,size:'20',lh:'1.70',ls:'0',sample:'Aprender é criar novas conexões.',css:'font-family:var(--body);font-weight:400;font-size:20px;line-height:1.7'},
      {role:'Body',family:'Manrope',weight:400,size:'16',lh:'1.65',ls:'0',sample:'Que bom ter você por aqui.',css:'font-family:var(--body);font-weight:400;font-size:16px;line-height:1.65'},
      {role:'Body-sm',family:'Manrope',weight:400,size:'14',lh:'1.70',ls:'0',sample:'Um caderninho cheio de ideias.',css:'font-family:var(--body);font-weight:400;font-size:14px;line-height:1.7'},
      {role:'Caption',family:'Manrope',weight:400,size:'12',lh:'1.60',ls:'0.01em',sample:'Um detalhe com significado.',css:'font-family:var(--body);font-weight:400;font-size:12px;line-height:1.6;letter-spacing:.01em'},
      {role:'Label / eyebrow',family:'JetBrains Mono',weight:400,size:'10',lh:'1.50',ls:'0.13em',transform:'uppercase',sample:'BRASIL EM CADA PALAVRA',css:'font-family:var(--mono);font-weight:400;font-size:10px;line-height:1.5;letter-spacing:.13em;text-transform:uppercase'},
      {role:'Helper',family:'JetBrains Mono',weight:400,size:'11',lh:'1.65',ls:'0',sample:'Uma dica para seguir com confiança.',css:'font-family:var(--mono);font-weight:400;font-size:11px;line-height:1.65'},
      {role:'Botão / ação',family:'Manrope',weight:600,size:'12',lh:'1.40',ls:'−0.01em',sample:'Vamos conversar',css:'font-family:var(--body);font-weight:600;font-size:12px;line-height:1.4;letter-spacing:-.01em'},
      {role:'Ênfase / afeto',family:'Instrument Serif',weight:400,size:'1.12 × título',lh:'inherit',ls:'−0.025em',sample:'Aprender é pertencer.',css:'font-family:var(--serif);font-style:italic;font-weight:400;font-size:38px;line-height:1.06;letter-spacing:-.025em',note:'Sempre itálica; uso pontual em títulos'},
      {role:'Código / token',family:'JetBrains Mono',weight:400,size:'11',lh:'1.70',ls:'0',sample:'--primary: #00854A;',css:'font-family:var(--mono);font-weight:400;font-size:11px;line-height:1.7'}
    ];
    $('#type-rows').innerHTML = typography.map(t => `<tr class="ds-type"><td><span class="role">${t.role}</span><span class="sample" style="${t.css}">${t.sample}</span>${t.note ? `<span class="meta">${t.note}</span>` : ''}</td><td>${t.family}</td><td>${t.weight}</td><td><code>${t.size}${t.size.includes('×') ? '' : ' px'}<br>LH ${t.lh}</code></td><td><code>${t.ls}</code></td><td><code>${t.transform || 'none'}</code></td></tr>`).join('');

    const palette = [
      {name:'Verde encontro',token:'--primary',hex:'#00854A',on:'#FFFFFF',role:'primary',usage:'Ação principal, foco de marca e seleção. Branco sobre verde nos botões.',context:'CTA e borda de seleção; texto verde no branco. No creme, textos pequenos e links usam #006B3C: o verde original fica para títulos e lettering grande.',states:'#006B3C hover · #00532F active · #E6ECE7 / #6A7772 disabled.',gradient:'Brasil + brisa; 4% hover; 8% superfície; 12% glow/foco; 20% detalhe; 100% ação.'},
      {name:'Verde floresta',token:'--forest',hex:'#005E38',on:'#FBF6EA',role:'primary',usage:'Seções inteiras com a profundidade da natureza brasileira. Texto creme e detalhes dourados.',context:'Fundo sólido alternado; creme para corpo e lettering, ouro para títulos, labels e divisores. Em cards brancos, retorna à leitura azul.',states:'Fundo editorial sem hover/active. Ações internas mantêm seus próprios estados.',gradient:'Base cheia da seção; wash ouro/04; folhas ouro/10; faixas ouro/85.'},
      {name:'Ouro do sol',token:'--accent',hex:'#F4C542',on:'#17365B',role:'accent',usage:'Faixas onduladas, divisores, novidades e ações de destaque. Texto azul sobre ouro.',context:'Costura as transições entre seções. Texto e foco dourados sobre verde-floresta e azul; nunca usar como texto sobre creme ou branco.',states:'#E9B82C hover · #DCA922 active · fundo neutro disabled.',gradient:'Brasil + brisa; 8% atmosfera; 12% glow; 20% superfície; 85% faixa ondulada; 100% destaque.'},
      {name:'Azul palavra',token:'--secondary',hex:'#17365B',on:'#FBF6EA',role:'secondary',usage:'Texto essencial no creme e no branco. Fundo de seções inteiras, tooltips e superfícies de contraste.',context:'Texto azul em superfícies claras; fundo azul com corpo e contorno creme, ênfases em ouro. Caixas internas brancas usam texto azul.',states:'#102946 hover · #0C2038 active · #6A7772 disabled.',gradient:'Brasil + brisa; 6% superfície; 8% linha decorativa; 12% onda; 100% texto ou seção.'},
      {name:'Creme de papel',token:'--paper',hex:'#FBF6EA',on:'#17365B',role:'neutral',usage:'Fundo base inspirado na capa do caderno, com grão sutil. Acolhe a aquarela e as cores brasileiras.',context:'Hero, seções claras e rodapé. Azul para leitura; links e labels em #006B3C. Também texto e lettering nas seções escuras.',states:'Base editorial sem hover/active. Componentes interativos definem estados próprios.',gradient:'Base opaca da brisa; grão 2,5%; glows verde/08 e ouro/12.'},
      {name:'Branco de leitura',token:'--surface',hex:'#FFFFFF',on:'#17365B',role:'neutral',usage:'Reservado para cards, caixas, tabelas e campos. Separa o conteúdo do creme e das cores cheias.',context:'Superfície sólida, nunca fundo geral de seção. Texto azul e contorno funcional; restaura as cores de leitura dentro de seções escuras.',states:'#FBF6EA hover de caixa · borda verde no foco de marca · disabled neutro.',gradient:'Não participa do fundo geral; 100% em superfícies de leitura.'},
      {name:'Papel aquecido',token:'--paper-warm',hex:'#F3EBD9',on:'#17365B',role:'neutral',usage:'Variação tonal do creme para linhas de tabela, notas e detalhes de papel.',context:'Superfícies de apoio com texto azul; não substitui o branco dos campos.',states:'Superfície editorial sem hover/active próprio.',gradient:'Variação do papel; 100% em detalhes; pode receber wash dourado.'},
      {name:'Grafite suave',token:'--ink-mute',hex:'#5C6B70',on:'#FBF6EA',role:'neutral',usage:'Legendas e informações secundárias nas áreas claras. Texto sólido para legibilidade.',context:'Texto auxiliar sobre creme ou branco; nas seções escuras, --text-muted usa #E9E3D5. Não reduzir opacidade de textos pequenos.',states:'#17365B hover de link · #006B3C active · #6A7772 disabled.',gradient:'Não participa; 100% para leitura. Opacidades apenas decorativas.'},
      {name:'Verde cuidado',token:'--success',hex:'#007044',on:'#FFFFFF',role:'feedback',usage:'Confirmação com ícone e texto; borda de campo validado.',context:'Texto e borda de sucesso; fundo claro #F3FAF4; sempre acompanhado de mensagem.',states:'Informativo; sem hover/active; componentes disabled usam neutros.',gradient:'Não participa; 8% superfície; 20% borda decorativa; 100% conteúdo.'},
      {name:'Ouro atenção',token:'--warning',hex:'#895B00',on:'#FFFFFF',role:'feedback',usage:'Avisos e instruções que pedem atenção. Não usar ouro claro para texto.',context:'Texto e ícone de atenção sobre #FFF0BB; também no branco.',states:'Informativo; sem hover/active; disabled usa neutros.',gradient:'Não participa; 8% superfície; 100% mensagem.'},
      {name:'Coral cuidado',token:'--error',hex:'#B63C42',on:'#FFFFFF',role:'feedback',usage:'Erros acionáveis com instruções claras. O erro nunca depende só da cor.',context:'Texto e borda de erro; fundo #FFF7F6; aria-invalid + descrição.',states:'#963037 hover se houver ação · #7F272D active · neutro disabled.',gradient:'Não participa; 8% superfície; 20% halo; 100% erro.'},
      {name:'Azul orientação',token:'--info',hex:'#245DA0',on:'#FFFFFF',role:'feedback',usage:'Dicas, instruções e contorno de foco acessível de 3 px.',context:'Texto informativo no branco; outline universal com offset de 4 px.',states:'#1D4B81 hover · #173B66 active · neutro disabled.',gradient:'Não participa; 8% superfície; 20% detalhe; 100% informação.'},
      {name:'Linha de papel',token:'--line',hex:'#DCE4DD',on:'#17365B',role:'decorative',usage:'Bordas decorativas e divisórias. Não identifica sozinha campos interativos.',context:'Borda de card e separador; input usa --line-strong para atingir 3:1.',states:'Verde no hover de card; ouro em destaques; sem active independente.',gradient:'Não participa; 100% linha; contraste de interface não reivindicado.'},
      {name:'Contorno funcional',token:'--line-strong',hex:'#788A83',on:'#17365B',role:'neutral',usage:'Bordas de inputs e botões secundários, visíveis sobre o branco.',context:'Borda funcional sobre branco; contraste de borda calculado no branco.',states:'#00854A hover/focus · #00532F active · #DCE4DD disabled.',gradient:'Não participa; 100% contorno funcional; não usar como texto pequeno.'}
    ];
    $('#color-grid').innerHTML = palette.map((c, i) => {
      const ratio = contrast(c.hex, c.on);
      const isBorder = c.token === '--line-strong';
      const tested = isBorder ? contrast(c.hex, '#FFFFFF') : ratio;
      const grade = c.role === 'decorative' ? 'DECORATIVO' : isBorder ? 'UI 3:1' : ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'DECORATIVO';
      return `<article class="ds-sw scroll-reveal" data-reveal><div class="ds-chip" style="background:${c.hex};color:${c.on}"><span class="aa">Aa</span><small>${grade} · ${tested.toFixed(2)}:1</small></div><div class="swatch-content"><strong>${c.name}<span>${String(i + 1).padStart(2,'0')} / ${c.role}</span></strong><button class="color-copy" data-copy="${c.hex}" aria-label="Copiar ${c.hex}, ${c.name}">${c.hex}${icon('copy')}</button><div class="color-values">${c.token}<br>RGB ${rgb(c.hex).join(' ')}<br>HSL ${hsl(c.hex)}</div><p>${c.usage}</p><div class="opacity-samples" aria-label="Opacidades decorativas: 4, 8, 12, 20 e 100 por cento">${[.04,.08,.12,.2,1].map(v => `<span style="background:rgba(${rgb(c.hex).join(',')},${v});color:${v === 1 ? c.on : '#17365B'}">${v * 100}%</span>`).join('')}</div><p class="helper">${isBorder ? 'Borda sobre branco' : `Par: ${c.hex} / ${c.on}`} · ${tested.toFixed(2)}:1</p></div></article>`;
    }).join('');
    $('#color-rules-rows').innerHTML = palette.map(c => `<tr><td><strong>${c.name}</strong><br><code>${c.token}</code><br>${c.role}</td><td>${c.context}</td><td>${c.states}</td><td>${c.gradient}</td></tr>`).join('');

    // Full per-component specs: visual geometry, states, motion, keyboard and semantics.
    const specs = {
      buttons:{name:'Botões',rows:[
        ['Estrutura e tokens','<code>.btn</code> + variante; Manrope 600 / 12 px / 1.4 / −0.01em; transformação none; raio 999 px; borda 1 px. Ícone 18 px; gap 18 px.'],
        ['Dimensões','Sm: 44 px / 11 px / padding 11×17; padrão: 52 px / 12 px / 14×23; lg: 60 px / 14 px / 18×30. Apenas ícone: 44×44 px; SVG 20 px. Celular: texto 11 px; padding horizontal 20 px.'],
        ['Variantes','Primário: verde + branco; destaque: ouro + azul; secundário: transparente + azul + contorno #788A83; navy: azul + branco; claro (.btn-white): creme + azul; text: sem preenchimento. Sobre fundos escuros, destaque ouro + azul.'],
        ['Estados','Resting → hover verde #006B3C / ouro #E9B82C; active verde #00532F e scale .98; focus-visible outline azul-info 3 px, offset 4 px; disabled: #E6ECE7 + #6A7772, sem movimento e disabled nativo.'],
        ['Animação','180 ms cor; 320 ms elevação de 2 px e ícone +3/−2 px; brilho diagonal 650 ms; magnetismo até 3 px apenas ponteiro preciso. Pausa e reduced-motion desativam magnetismo.'],
        ['Interação e acesso','<code>button</code> para ação; <code>a</code> para navegação. Enter/Space em botões; Enter em links. Rótulo em ícones; aria-pressed no favorito. Feedback em região status.']
      ]},
      inputs:{name:'Campos',rows:[
        ['Estrutura e tokens','<code>.field > label + .input + .helper</code>; Manrope 400 / 12 px / 1.6 (16 px no celular para evitar zoom). Raio 12 px; branco; contorno funcional #788A83, 1 px. Label 600 / 11 px; helper 9 px no formulário.'],
        ['Dimensões','Altura mínima 52 px; padding 14×16 px; gap 8 px; textarea mínimo 90 px, resize vertical; checkbox 18 px com rótulo clicável; layout de duas colunas → uma no celular.'],
        ['Estados','Default branco; hover borda verde; focus halo verde 12% / 3 px + outline azul-info 2 px / offset 3; success #007044 + #F3FAF4; error #B63C42 + #FFF7F6; disabled #EDF1EC / #6A7772.'],
        ['Animação','180 ms borda/fundo; 320 ms halo. Mensagens aparecem sem deslocar o foco até a validação. Reduced-motion remove transições.'],
        ['Validação','Nome ≥2 caracteres; e-mail via validity nativa; consentimento obrigatório. Submit valida, mostra instrução associada e foca o primeiro campo inválido. Correção é revalidada durante a digitação. Dados ficam apenas no DOM; sem envio ou armazenamento.'],
        ['Interação e acesso','Label com for/id; required; autocomplete; aria-invalid e aria-describedby. Feedback com role=status. Select e checkbox nativos mantêm teclado e semântica. Pré-visualizações de estados têm descrição textual.']
      ]},
      cards:{name:'Cards',rows:[
        ['Estrutura e tokens','<code>.card</code>, <code>.card-featured</code>, <code>.card-notes</code>; raio 20 px; borda 1 px #DCE4DD; padding 24 px. Imagem 190 px; título específico 29 px / 1.08 / 600; texto 11 px / 1.9.'],
        ['Layout','Três colunas; até 960 px duas + card de palavra na linha inteira; até 720 px uma coluna. Gap 24 px desktop / 22 px celular. Imagem com dimensões declaradas e object-fit cover.'],
        ['Estados','Default branco; featured verde com texto branco; notes papel pautado. Hover/focus-within: elevação 4 px, borda verde 40%, sombra de marca. Active pertence à ação interna. Disabled: desabilitar a ação e explicar indisponibilidade.'],
        ['Animação','320 ms elevação e sombra; imagem scale 1.045 / 1000 ms; entrada [data-reveal] com escalonamento de até 240 ms; flor 24 s.'],
        ['Interação e acesso','<code>article</code> com heading; uma ação principal identificável. Card inteiro não recebe tabindex. Foco na ação; alt descritivo na paisagem. Palavra do dia atualiza conteúdo e anuncia via status, sem alterar foco.'],
        ['Conteúdo','Exemplos explicitamente identificados como conteúdo/atividade de demonstração; não representam aulas, ofertas ou resultados reais da professora.']
      ]},
      navbars:{name:'Navegação',rows:[
        ['Estrutura e tokens','<code>.site-chrome > .nav</code>; marca + .nav-links + CTA. Menu absoluto sobre o background da hero, transparente e sem borda ou sombra; altura 88 px; link Manrope 500 / 12 px / 1.4.'],
        ['Responsividade','Até 1200 px remove CTA; até 960 px altura 80 px; até 720 px altura 76 px, menu recolhível em painel flutuante com cantos arredondados. Toggle 44×44 px. O conteúdo começa 28 px abaixo do menu no desktop e 16 px no celular.'],
        ['Estados','Link atual verde com sublinhado de duas cores; hover sublinhado scaleX 0→1; focus outline universal. Toggle aria-expanded false/true. Conteúdo atual acompanhado durante a rolagem.'],
        ['Animação','180 ms cor; 320 ms sublinhado e toggle. Menu acompanha a hero ao rolar, sem criar uma barra fixa sobre as demais seções.'],
        ['Interação e acesso','<code>nav aria-label</code>; aria-current=location no link atual; menu fecha ao selecionar, clicar fora ou pressionar Esc. Esc devolve foco ao toggle. Links âncora reais.'],
        ['Tabs de demonstração','Tablist com três botões tab; roving tabindex; setas, Home e End mudam aba; aria-selected e aria-labelledby; painel focável. Exemplo independente da navegação principal.']
      ]},
      sections:{name:'Seções',rows:[
        ['Estrutura e tokens','<code>.section.ds-group > .container</code>; largura máxima 1280 px; margem 64 px desktop / 20 px celular; padding vertical 100/112 px; divisória .sec-rule de 1 px. Heading H2 + texto de apoio.'],
        ['Superfícies','Base creme #FBF6EA + grão 2,5%; dobras em verde-floresta #005E38 e azul #17365B, alternadas com creme. Branco #FFFFFF apenas em cards, caixas, tabelas e campos. Brisa com verde/08 e ouro/12. .ds-window raio 28 px; .ds-sheet raio 20 px e padding 34 px.'],
        ['Estados e contexto','Default apresenta conteúdo; hover apenas em componentes interativos; active não se aplica à seção. Estado fora da tela pausa animações. Seção de exemplo não recebe foco indevidamente.'],
        ['Animação','Faixas SVG em três cores / 18 s com ouro a 85% costurando as dobras; wash atmosférico / 24 s; folha / 16 s; conteúdo em reveal 800 ms. Camadas decorativas ficam atrás da leitura.'],
        ['Leitura contextual','Em .section-dark: corpo e lettering creme, apoio #EEE8DA / #E9E3D5, ênfases e foco ouro. Caixas claras restauram texto azul e foco azul-info sem alterar as cores da seção. Proporção de referência: 45% creme / 20% branco / 30% verde e azul / 5% ouro.'],
        ['Responsividade','Padding 80/90 px até 960; 55/68 px até 720. Título e descrição lado a lado no desktop, empilhados no celular. Tabelas rolam horizontalmente dentro do seu próprio contêiner.'],
        ['Acesso','section com aria-labelledby; headings em ordem; arte repetida aria-hidden. Informações sobre a paisagem têm alt e figcaption. Fundo nunca é necessário à compreensão.']
      ]},
      modals:{name:'Modal',rows:[
        ['Estrutura e tokens','<code>dialog.modal</code> nativo; raio 28 px; borda #DCE4DD; fundo branco + wash ouro; sombra navy; backdrop azul/35 + blur 7 px. Heading Inter Tight 60 px e itálico de 400.'],
        ['Dimensões','Largura máxima 520 px; margem 16 px em telas pequenas; padding 43 px / 25 px no celular; altura máxima calc(100dvh − 40px); rolagem interna. Fechar tem alvo 34×34 px visual, ampliado a 44×44 por CSS.'],
        ['Estados','Fechado: fora da árvore interativa; aberto: showModal, fundo inert nativo e rolagem da página bloqueada. Botões mantêm hover/active/focus do sistema.'],
        ['Animação','350 ms opacity + translateY 16 px + scale .97→1; backdrop 250 ms; sem animação com reduced-motion. Fechamento imediato mantém o foco previsível.'],
        ['Interação e acesso','aria-labelledby/aria-describedby; autofocus no fechar. Tab fica no dialog nativo; Escape, botão ou clique fora fecham. O foco retorna ao botão que abriu. Texto de exemplo explicita a demonstração.']
      ]},
      badges:{name:'Badges',rows:[
        ['Estrutura e tokens','<code>.badge</code> + variação; raio 999 px; padding 7×11 px; gap 8 px; texto Manrope 500 / 8 px / 1.4 / tracking .04em; uppercase já no conteúdo; ícone 13 px.'],
        ['Variantes','Verde #E9F4E9 / #00683B; ouro #FFF0BB / #624800; azul #E8EFF9 / #17365B; claro (.badge-white) creme a 96% / #17365B; outline #788A83; erro #FCECED / #B63C42.'],
        ['Estados','Informativo estático; não recebe foco nem simula botão. Hover opcional eleva 1 px; active/disabled não se aplicam. Se um badge virar filtro, usar button, área 44 px e aria-pressed.'],
        ['Animação','180 ms cor, 320 ms sombra; .pulse 3 s com halo verde. Não pisca; a palavra explica o status. Ciclos respeitam pausa e reduced-motion.'],
        ['Acesso','Cor sempre com texto ou ícone. Badge de estado não usa role=alert se não há evento urgente. Elementos decorativos ocultos de leitores de tela.']
      ]},
      tooltips:{name:'Tooltips',rows:[
        ['Estrutura e tokens','<code>.tooltip > button + .tooltip-bubble</code>; texto branco / fundo #17365B; raio 10 px; padding 11×14 px; Manrope 400 / 10 px / 1.7; largura 210 px desktop, 150–170 px menor.'],
        ['Posicionamento','13 px acima do controle, centralizado, seta de 5 px. Primeiro/último tooltip no celular ancorados à borda do botão para manter a bolha dentro da tela.'],
        ['Estados','Oculto por padrão; hover/focus-within e clique mostram; Escape descarta mesmo com foco/hover mantido. Sai ao deixar tanto o gatilho quanto a bolha ou perder foco. Não contém controles.'],
        ['Animação','180 ms opacity; 320 ms translateY 7→0; sem deslocamento com reduced-motion. Conteúdo persiste enquanto gatilho ou bolha estão em hover.'],
        ['Interação e acesso','button com nome independente + aria-describedby; bolha role=tooltip; Tab foca gatilho. No toque, clique alterna; clique fora fecha. Informação é complementar, nunca única instrução obrigatória.']
      ]}
    };
    $$('[data-spec]').forEach(el => {
      const spec = specs[el.dataset.spec];
      el.innerHTML = `<details class="spec-details component-spec"><summary>Especificação completa / ${spec.name} <span>+</span></summary><div class="table-scroll"><table class="spec-table"><caption class="sr-only">Especificação de ${spec.name}</caption><thead><tr><th>Propriedade</th><th>Definição</th></tr></thead><tbody>${spec.rows.map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}</tbody></table></div></details>`;
    });

    const icons = [['book','Caderno'],['pencil','Lápis'],['chat','Conversa'],['map','Mapa'],['sun','Sol'],['leaf','Folha'],['heart','Afeto'],['mountain','Pão de Açúcar'],['palm','Coqueiro'],['wave','Mar'],['spark','Descoberta'],['arrow-up','Próximo passo']];
    $('#icon-grid').innerHTML = icons.map(([name, label]) => `<button class="ds-icon" data-copy-icon="${name}" aria-label="Copiar SVG do ícone ${label}">${icon(name)}<span>${label}</span><code>#i-${name}</code></button>`).join('');
  }
  if ($('#type-rows')) initCatalogue();

  // Same source reveal vocabulary; CSS keeps all content visible if JS is unavailable.
  const ribbons = '<svg class="section-ribbon" viewBox="0 0 1400 130" preserveAspectRatio="none" aria-hidden="true"><path d="M-80 105Q180 25 430 93T920 84T1480 95V150H-80Z" fill="#00854a" opacity=".065"/><path d="M-80 118Q180 43 430 110T920 100T1480 111V150H-80Z" fill="#f4c542" opacity=".12"/><path d="M-80 127Q180 65 430 125T920 117T1480 128V150H-80Z" fill="#17365b" opacity=".055"/></svg>';
  $$('.section').forEach((section, i) => {
    section.insertAdjacentHTML('beforeend', ribbons);
    if (i > 0) section.insertAdjacentHTML('beforeend', '<svg class="icon section-leaf" aria-hidden="true"><use href="#i-leaf"/></svg>');
    $$('[data-reveal]', section).forEach((el, n) => {
      const delay = section.classList.contains('hero') ? n * 80 : n % 3 * 80;
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    });
  });
  $$('.icon').forEach(svg => { svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); });

  let revealObserver;
  function revealAll() { $$('[data-reveal]').forEach(el => { el.dataset.revealed = 'true'; }); }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.dataset.revealed = 'true'; revealObserver.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:'0px 0px -8% 0px'});
    $$('[data-reveal]').forEach(el => revealObserver.observe(el));
    // Add the enhancement flag only after all dynamic tables and handlers are ready.
    root.classList.add('js');
  } else revealAll();

  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('is-offscreen', !e.isIntersecting)), {rootMargin:'100px'});
    $$('.section, .wire').forEach(el => visibility.observe(el));
  }

  // Shared active-link class; native anchors remain usable with JS off.
  const menu = $('#primary-nav');
  const toggle = $('[data-nav-toggle]');
  function closeMenu(restoreFocus = false) {
    if (!menu || !toggle) return;
    const wasOpen = menu.classList.contains('is-open');
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    if (restoreFocus && wasOpen) toggle.focus();
  }
  toggle?.addEventListener('click', () => {
    if (!menu) return;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
  });
  $$('.nav-link', menu).forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', e => { if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
  let scrollQueued = false;
  function updateChrome() {
    let current = '#identidade';
    $$('.nav-link', menu).forEach(link => {
      const section = $(link.getAttribute('href'));
      if (section && section.getBoundingClientRect().top < 220) current = link.getAttribute('href');
    });
    $$('.nav-link', menu).forEach(a => {
      const active = a.getAttribute('href') === current;
      a.classList.toggle('is-current', active);
      if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateChrome); } }, {passive:true});
  addEventListener('resize', () => { if (innerWidth > 720) closeMenu(); }, {passive:true});
  updateChrome();

  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    clearTimeout(toastTimer);
    $('span', el).textContent = message;
    el.classList.add('is-visible');
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 4200);
  }
  async function copy(text, label) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        // Local file:// fallback keeps copy useful without a development server.
        const active = document.activeElement;
        const field = document.createElement('textarea');
        field.value = text; field.className = 'copy-fallback'; field.setAttribute('readonly', '');
        document.body.append(field); field.select();
        let copied = false;
        try { copied = document.execCommand('copy'); }
        finally { field.remove(); if (active instanceof HTMLElement) active.focus({preventScroll:true}); }
        if (!copied) throw new Error('Clipboard unavailable');
      }
      toast(label);
    } catch { toast('Seu navegador bloqueou a cópia. Selecione o código para copiar manualmente.'); }
  }
  $$('[data-copy]').forEach(button => button.addEventListener('click', () => copy(button.dataset.copy, `${button.dataset.copy} copiado. Um pouco de Brasil no seu projeto.`)));
  $$('[data-copy-icon]').forEach(button => button.addEventListener('click', () => {
    const symbol = $(`#i-${button.dataset.copyIcon}`);
    const text = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbol.innerHTML}</svg>`;
    copy(text, 'SVG copiado. Um traço de Brasil para levar com você.');
  }));
  $$('[data-demo]').forEach(button => button.addEventListener('click', () => toast(button.dataset.demo)));
  $('[data-like]')?.addEventListener('click', e => {
    const button = e.currentTarget;
    const liked = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(liked));
    button.setAttribute('aria-label', liked ? 'Remover curtida deste exemplo' : 'Curtir este exemplo');
    toast(liked ? 'Um pouquinho de afeto guardado por aqui.' : 'Curtida removida.');
  });

  function initCatalogueDemos() {
    const typeInput = $('#type-preview'), typeLive = $('#type-live'), typeSize = $('#type-size');
    typeInput.addEventListener('input', () => { typeLive.textContent = typeInput.value || 'Sua próxima palavra começa aqui.'; });
    typeSize.addEventListener('input', () => { typeLive.style.fontSize = `${typeSize.value}px`; $('#type-size-output').textContent = `${typeSize.value} px`; });
    $('[data-reset-type]').addEventListener('click', () => { typeInput.value = 'Que bom ter você aqui.'; typeLive.textContent = typeInput.value; typeSize.value = '54'; typeLive.style.fontSize = '54px'; $('#type-size-output').textContent = '54 px'; toast('Frase e tamanho restaurados.'); });

    const form = $('#demo-form');
    const fields = [$('#demo-name'), $('#demo-email'), $('#demo-check')];
    function validate(field) {
      const isName = field.id === 'demo-name';
      const valid = isName ? field.value.trim().length >= 2 : field.checkValidity();
      field.setAttribute('aria-invalid', String(!valid));
      field.classList.toggle('is-error', !valid);
      if (field.id === 'demo-name') {
        $('#name-helper').textContent = valid ? 'Que bom saber como chamar você.' : 'Escreva seu nome com pelo menos 2 letras.';
        $('#name-helper').classList.toggle('error-text', !valid);
      } else if (field.id === 'demo-email') {
        $('#email-helper').textContent = valid ? 'E-mail com formato válido. Nenhum dado é enviado.' : 'Use um e-mail no formato voce@exemplo.com.';
        $('#email-helper').classList.toggle('error-text', !valid);
      }
      return valid;
    }
    fields.forEach(field => field.addEventListener(field.type === 'checkbox' ? 'change' : 'input', () => {
      if (field.hasAttribute('aria-invalid')) validate(field);
      $('#form-feedback').textContent = '';
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const invalid = fields.filter(field => !validate(field));
      const feedback = $('#form-feedback');
      feedback.className = `form-feedback ${invalid.length ? 'error-text' : 'success-text'}`;
      if (invalid.length) {
        feedback.textContent = invalid.includes($('#demo-check')) ? 'Revise os campos e marque que você entendeu a demonstração.' : 'Falta só um detalhe. Revise os campos indicados.';
        invalid[0].focus();
      } else {
        feedback.textContent = `Que bom ter você aqui, ${$('#demo-name').value.trim()}! Demonstração concluída. Nenhum dado foi enviado.`;
        toast('Tudo certinho. Sua conversa começou com um sorriso.');
      }
    });

    const words = [
      ['cafuné','/ka.fuˈnɛ/ · substantivo','Carinho que a gente faz passando a mão, de leve, nos cabelos de alguém.','Tem palavras que<br>parecem um abraço.'],
      ['saudade','/sawˈda.dʒi/ · substantivo','A falta que faz uma pessoa, um lugar ou um momento que mora no coração.','Uma palavra que<br>atravessa distâncias.'],
      ['aconchego','/a.kõˈʃe.ɡu/ · substantivo','A sensação boa de encontrar conforto, proteção e carinho em algum lugar.','Quando um lugar<br>vira um sentimento.'],
      ['encontro','/ẽˈkõ.tɾu/ · substantivo','O momento de estar com alguém. Às vezes, é o começo de uma nova história.','Toda conversa é<br>um pequeno começo.']
    ];
    let wordIndex = 0;
    $('#word-button').addEventListener('click', () => {
      const [word, sound, definition, quote] = words[++wordIndex % words.length];
      const card = $('.card-notes');
      $('.word-of-day em', card).textContent = word;
      $('.word-of-day>span', card).textContent = sound;
      $(':scope>p', card).textContent = definition;
      $('.example-quote', card).innerHTML = `“${quote}”${icon('heart')}`;
      toast(`${word}: ${definition}`);
    });

    const tabs = $$('.sample-links [role=tab]');
    const tabTexts = ['Abra o caderninho. Uma nova palavra espera por você.','Um “oi” pode ser o começo de uma grande amizade.','Do mar às montanhas, cada lugar tem uma história para contar.'];
    function selectTab(index, focus = false) {
      tabs.forEach((tab, i) => { tab.classList.toggle('is-current', i === index); tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      $('#nav-panel').textContent = tabTexts[index];
      $('#nav-panel').setAttribute('aria-labelledby', tabs[index].id);
      if (focus) tabs[index].focus();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(i));
      tab.addEventListener('keydown', e => {
        const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
        if (next !== null) { e.preventDefault(); selectTab(next, true); }
      });
    });
  }
  if ($('#demo-form')) initCatalogueDemos();

  const modal = $('#welcome-modal');
  if (modal) {
    let modalOpener;
    $$('[data-open-modal]').forEach(button => button.addEventListener('click', () => {
      modalOpener = button;
      modal.showModal();
      root.classList.add('modal-open');
    }));
    $$('[data-close-modal]', modal).forEach(button => button.addEventListener('click', () => modal.close()));
    let backdropPointer = false;
    modal.addEventListener('pointerdown', e => { backdropPointer = e.target === modal && outsideModal(e); });
    modal.addEventListener('click', e => { if (backdropPointer && e.target === modal && outsideModal(e)) modal.close(); backdropPointer = false; });
    function outsideModal(e) { const r = modal.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; }
    modal.addEventListener('close', () => { root.classList.remove('modal-open'); modalOpener?.focus({preventScroll:true}); });
  }

  $$('.tooltip').forEach(tip => {
    $('button', tip).addEventListener('click', () => {
      const closing = tip.classList.contains('is-open');
      tip.classList.toggle('is-open', !closing);
      tip.classList.toggle('is-dismissed', closing);
    });
    tip.addEventListener('focusin', () => tip.classList.remove('is-dismissed'));
    tip.addEventListener('pointerleave', () => { tip.classList.remove('is-open'); if (!tip.contains(document.activeElement)) tip.classList.remove('is-dismissed'); });
    tip.addEventListener('focusout', e => { if (!tip.contains(e.relatedTarget)) { tip.classList.remove('is-open'); if (!tip.matches(':hover')) tip.classList.remove('is-dismissed'); } });
    tip.addEventListener('pointerenter', () => { if (!tip.contains(document.activeElement)) tip.classList.remove('is-dismissed'); });
  });
  document.addEventListener('click', e => $$('.tooltip').forEach(tip => {
    if (!tip.contains(e.target)) { tip.classList.remove('is-open'); tip.classList.add('is-dismissed'); }
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMenu(true);
      $$('.tooltip').forEach(tip => { tip.classList.add('is-dismissed'); tip.classList.remove('is-open'); });
    }
  });

  $('.ds-replay')?.addEventListener('click', e => {
    const stage = e.currentTarget.closest('.reveal-stage');
    if (reduced.matches || motionPaused) { toast('Animações pausadas. O conteúdo continua por aqui.'); return; }
    stage.classList.remove('is-replaying');
    void stage.offsetWidth;
    stage.classList.add('is-replaying');
  });
  const motionButton = $('#motion-toggle');
  function setMotion(paused) {
    motionPaused = paused;
    root.classList.toggle('motion-paused', paused);
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.innerHTML = paused ? `Retomar animações ${icon('play')}` : 'Pausar animações <span aria-hidden="true">Ⅱ</span>';
    }
    if (paused) {
      $$('.magnetic').forEach(el => el.style.removeProperty('transform'));
      $$('[data-ds-bloom]').forEach(el => { el.style.removeProperty('--bloom-x'); el.style.removeProperty('--bloom-y'); });
    }
  }
  motionButton?.addEventListener('click', () => {
    if (reduced.matches) { setMotion(true); toast('Seu dispositivo prefere movimento reduzido. Essa preferência está ativa.'); return; }
    setMotion(!motionPaused);
  });
  reduced.addEventListener('change', e => { if (e.matches) { setMotion(true); revealAll(); revealObserver?.disconnect(); } });
  setMotion(motionPaused);
  const syncPageVisibility = () => root.classList.toggle('page-hidden', Boolean(document.hidden));
  document.addEventListener('visibilitychange', syncPageVisibility);
  syncPageVisibility();

  const precisePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let pointerQueued = false;
  addEventListener('pointermove', e => {
    if (reduced.matches || motionPaused || !precisePointer.matches || pointerQueued) return;
    pointerQueued = true;
    const x = (e.clientX / innerWidth - .5) * 16, y = (e.clientY / innerHeight - .5) * 12;
    requestAnimationFrame(() => {
      $$('[data-ds-bloom]').forEach(el => {
        if (el.closest('.is-offscreen')) return;
        el.style.setProperty('--bloom-x', `${x.toFixed(1)}px`);
        el.style.setProperty('--bloom-y', `${y.toFixed(1)}px`);
      });
      pointerQueued = false;
    });
  }, {passive:true});
  $$('.magnetic').forEach(button => {
    button.addEventListener('pointermove', e => {
      if (reduced.matches || motionPaused || !precisePointer.matches) return;
      const r = button.getBoundingClientRect();
      const x = Math.max(-3, Math.min(3, (e.clientX - r.left - r.width / 2) * .05));
      const y = Math.max(-3, Math.min(3, (e.clientY - r.top - r.height / 2) * .08));
      button.style.transform = `translate(${x}px,${y - 2}px)`;
    });
    button.addEventListener('pointerleave', () => button.style.removeProperty('transform'));
    button.addEventListener('blur', () => button.style.removeProperty('transform'));
  });

  // A failed enhancement must never leave the page invisible.
  document.fonts?.ready.then(() => root.classList.add('ds-overview-ready'));
})();
