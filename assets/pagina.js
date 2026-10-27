/* Dobras abaixo da primeira: a inicialização espera o evento load e um momento ocioso,
   para não competir com a primeira pintura no celular. */
const depoisDaCarga = setup => {
  const run = () => (window.requestIdleCallback ? window.requestIdleCallback(setup, {timeout:1500}) : setTimeout(setup, 1));
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, {once:true});
};

/* Caderno A5 reutilizável. A estrutura vem de #caderno-3d-template;
   o design system continua responsável por ícones, fundos e surgimentos. */
(() => {
  'use strict';
  const template = document.getElementById('caderno-3d-template');
  if (!template) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const instances = new Map();
  const boundButtons = new WeakSet();
  const calm = () => reduced.matches || root.classList.contains('motion-paused');
  const duration = (token, fallback) => {
    const value = window.getComputedStyle?.(root)?.getPropertyValue(token).trim() || '';
    const number = parseFloat(value);
    return Number.isFinite(number) ? number * (value.endsWith('ms') ? 1 : 1000) : fallback;
  };
  // 800 ms + 180 ms nos tokens atuais: a capa abre cerca de 1 s após surgir.
  const openingDelay = duration('--entrance', 800) + duration('--micro', 180);

  function settle(item) {
    clearTimeout(item.timer);
    item.timer = null;
    item.started = true;
    item.element.classList.add('is-still');
    item.element.dataset.cadernoState = item.interactive ? 'interactive' : item.closed ? 'closed' : 'open';
    observer?.unobserve(item.element);
  }
  function enter(item) {
    if (item.interactive || item.closed) return;
    if (calm()) { settle(item); return; }
    if (item.started) return;
    item.started = true;
    if (item.loop) {
      item.element.dataset.cadernoState = 'cycling';
      return;
    }
    item.element.dataset.cadernoState = 'entering';
    item.timer = setTimeout(() => {
      item.element.dataset.cadernoState = 'open';
      item.timer = null;
    }, openingDelay);
  }
  const observer = 'IntersectionObserver' in window ? new window.IntersectionObserver(entries => {
    entries.forEach(entry => {
      const item = instances.get(entry.target);
      if (item && entry.isIntersecting) { enter(item); observer.unobserve(entry.target); }
    });
  }, {threshold:.25}) : null;

  // O loop usa a visibilidade exata da seção, sem a margem de antecipação
  // dos fundos do catálogo. Pausar CSS preserva o ponto atual do ciclo.
  const loopVisibility = 'IntersectionObserver' in window ? new window.IntersectionObserver(entries => {
    entries.forEach(entry => instances.forEach(item => {
      if (item.loop && (item.element.closest('.section') || item.element) === entry.target) {
        item.element.classList.toggle('is-loop-paused', !entry.isIntersecting);
      }
    }));
  }, {threshold:0}) : null;

  function replay(target) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    const item = instances.get(element);
    if (!item) return;
    if (item.closed) return;
    if (item.interactive) { showFeature(element, '05'); return; }
    if (calm()) { settle(item); return; }
    clearTimeout(item.timer);
    observer?.unobserve(element);
    item.started = false;
    element.classList.add('is-resetting');
    element.dataset.cadernoState = 'closed';
    // Dois frames fecham a capa sem uma transição de volta antes do replay.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      element.classList.remove('is-resetting');
      enter(item);
    }));
  }
  const pending = new Set();
  const nearby = 'IntersectionObserver' in window ? new window.IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      nearby.unobserve(entry.target);
      pending.delete(entry.target);
      build(entry.target);
    });
  }, {rootMargin:'900px 0px'}) : null;
  function init(scope = document) {
    const elements = [...scope.querySelectorAll('[data-caderno]')];
    if (scope.matches?.('[data-caderno]')) elements.unshift(scope);
    elements.forEach(element => {
      if (instances.has(element) || pending.has(element)) return;
      // Fora da hero, a montagem 3D espera o caderno chegar perto da tela. A capa estática
      // some logo para não ser baixada à toa; o caderno é montado antes de aparecer.
      if (nearby && !element.closest('#inicio')) {
        pending.add(element);
        const fallback = element.querySelector('.caderno-fallback');
        if (fallback) fallback.hidden = true;
        nearby.observe(element);
      } else build(element);
    });
    scope.querySelectorAll('[data-caderno-replay]').forEach(button => {
      if (boundButtons.has(button)) return;
      boundButtons.add(button);
      button.addEventListener('click', () => replay(button.dataset.cadernoReplay));
    });
  }
  function build(element) {
    if (instances.has(element)) return;
    element.append(template.content.cloneNode(true));
    const fallback = element.querySelector('.caderno-fallback');
    if (fallback) fallback.hidden = true;
    const back = element.querySelector('[data-caderno-back]');
    if (element.dataset.contracapa) {
      back.addEventListener('error', () => { back.hidden = true; });
      back.src = element.dataset.contracapa;
      back.hidden = false;
    }
    const bindings = element.querySelector('.caderno-bindings');
    for (let ring = 0; ring < 22; ring++) bindings.append(document.createElement('i'));
    const item = {element, timer:null, started:false, loop:element.hasAttribute('data-caderno-loop'), interactive:element.hasAttribute('data-caderno-interactive'), closed:element.hasAttribute('data-caderno-closed')};
    instances.set(element, item);
    element.dataset.cadernoState = item.interactive ? 'interactive' : 'closed';
    if (item.loop && loopVisibility) {
      element.classList.add('is-loop-paused');
      loopVisibility.observe(element.closest('.section') || element);
    }
    if (calm()) settle(item);
    else if (observer && !item.interactive && !item.closed) observer.observe(element);
    else enter(item);
    if (item.interactive && element.dataset.cadernoFeature) showFeature(element, element.dataset.cadernoFeature);
  }
  // A mesma montagem aceita poses dirigidas por uma lista, sem iniciar o loop.
  function showFeature(target, feature) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    const item = instances.get(element);
    if (!/^0[1-6]$/.test(feature)) return false;
    // Ainda não montado: guarda a pose para quando o caderno chegar perto da tela.
    if (!item && pending.has(element) && element.hasAttribute('data-caderno-interactive')) {
      element.dataset.cadernoFeature = feature;
      return true;
    }
    if (!item?.interactive) return false;
    element.dataset.cadernoFeature = feature;
    return true;
  }
  function syncMotion() {
    instances.forEach(item => {
      if (calm()) settle(item);
      else {
        item.element.classList.remove('is-still');
        if (item.loop && item.started && item.element.dataset.cadernoState !== 'cycling') {
          item.element.dataset.cadernoState = 'cycling';
        }
      }
    });
  }
  reduced.addEventListener('change', syncMotion);
  if ('MutationObserver' in window) {
    new window.MutationObserver(syncMotion).observe(root, {attributes:true, attributeFilter:['class']});
  }
  window.Caderninho3D = Object.freeze({init, replay, showFeature});
  init();
})();

/* Diferenciais: botões de disclosure, com foco, toque e hover equivalentes.
   Abaixo de 900 px, o caderno fica fixo no topo e cada item ativa sozinho quando passa
   pela faixa central da área visível abaixo dele (IntersectionObserver, sem cálculo no scroll). */
depoisDaCarga(() => {
  'use strict';
  const section = document.getElementById('detalhes');
  const group = section?.querySelector('[data-details]');
  if (!group || !window.Caderninho3D) return;
  const root = document.documentElement;
  const rows = [...group.querySelectorAll('[data-detail]')];
  const buttons = rows.map(row => row.querySelector('.detail-trigger'));
  const stage = group.querySelector('.details-stage');
  const book = stage.querySelector('[data-caderno]');
  const number = stage.querySelector('.details-active-number');
  const caption = stage.querySelector('[data-detail-caption]');
  const content = group.querySelector('.details-content');
  const purchase = group.querySelector('.details-purchase');
  const precise = window.matchMedia('(hover:hover) and (pointer:fine)');
  const narrow = window.matchMedia('(max-width: 899px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');
  // No celular com movimento reduzido, todos os itens ficam abertos e o caderno não fica fixo.
  const allOpen = () => narrow.matches && reduced.matches;
  const scrolling = () => narrow.matches && !reduced.matches;
  let current = null, band = null, queued = false;

  function showNumber(text) {
    if (number.textContent === text) return;
    // No celular, o número antigo sobe e some enquanto o novo sobe e aparece.
    if (narrow.matches && !calm() && number.textContent) {
      const old = number.cloneNode(true);
      old.classList.remove('is-changing');
      old.classList.add('is-leaving');
      old.addEventListener('animationend', () => old.remove(), {once:true});
      number.after(old);
    }
    number.textContent = text;
    // Reinicia a animação do número em dois quadros, sem forçar layout síncrono.
    number.classList.remove('is-changing');
    requestAnimationFrame(() => requestAnimationFrame(() => number.classList.add('is-changing')));
  }
  function activate(row) {
    if (row === current) return;
    current = row;
    rows.forEach(item => {
      const active = item === row;
      const open = active || allOpen();
      item.classList.toggle('is-active', active);
      item.querySelector('.detail-trigger').setAttribute('aria-expanded', String(open));
      item.querySelector('.detail-description').setAttribute('aria-hidden', String(!open));
    });
    const feature = row.dataset.detail;
    const title = row.querySelector('.detail-title').textContent;
    window.Caderninho3D.showFeature(book, feature);
    stage.dataset.activeDetail = feature;
    stage.style.setProperty('--detalhe-progresso', ((rows.indexOf(row) + 1) / rows.length).toFixed(3));
    book.setAttribute('aria-label', `Caderninho na Mão! em 3D: ${title}.`);
    caption.textContent = title;
    // O número grande segue a numeração visível da lista; data-detail guarda a pose do caderno.
    showNumber(row.querySelector('.detail-number')?.textContent.trim() || feature);
  }

  // A faixa de ativação fica no meio da área visível abaixo do caderno fixo.
  function watch() {
    queued = false;
    band?.disconnect();
    band = null;
    if (!scrolling() || !('IntersectionObserver' in window)) return;
    const fixed = stage.getBoundingClientRect().height;
    const free = Math.max(1, window.innerHeight - fixed);
    band = new window.IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) activate(entry.target); });
    }, {rootMargin:`-${Math.round(fixed + free * .4)}px 0px -${Math.round(free * .4)}px 0px`});
    rows.forEach(row => band.observe(row));
  }
  function queueWatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(watch);
  }
  // Fora do grid, o preço e o botão não seguram o caderno fixo depois do último item.
  function placePurchase() {
    if (!purchase) return;
    if (scrolling()) group.after(purchase);
    else content.append(purchase);
  }
  function syncLayout() {
    placePurchase();
    rows.forEach(item => {
      const open = item === current || allOpen();
      item.querySelector('.detail-trigger').setAttribute('aria-expanded', String(open));
      item.querySelector('.detail-description').setAttribute('aria-hidden', String(!open));
    });
    queueWatch();
  }

  rows.forEach((row, index) => {
    const button = buttons[index];
    button.addEventListener('pointerenter', event => {
      if (precise.matches && event.pointerType !== 'touch') activate(row);
    });
    button.addEventListener('focus', () => activate(row));
    button.addEventListener('click', () => {
      activate(row);
      if (!scrolling()) return;
      // Toque no celular: rola até o item ficar na faixa de ativação.
      const fixed = stage.getBoundingClientRect().height;
      const free = window.innerHeight - fixed;
      const top = row.getBoundingClientRect().top + window.scrollY - fixed - free * .3;
      window.scrollTo({top, behavior:calm() ? 'auto' : 'smooth'});
    });
    button.addEventListener('keydown', event => {
      const next = event.key === 'ArrowDown' ? (index + 1) % rows.length
        : event.key === 'ArrowUp' ? (index + rows.length - 1) % rows.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : null;
      if (next === null) return;
      event.preventDefault();
      buttons[next].focus();
      activate(rows[next]);
    });
  });
  activate(rows[0]);
  syncLayout();
  narrow.addEventListener('change', syncLayout);
  reduced.addEventListener('change', syncLayout);
  window.addEventListener('resize', queueWatch, {passive:true});
  group.classList.add('disclosure-ready');
});

/* Perguntas da compra: disclosure nativo de botão, sem alturas fixas. */
depoisDaCarga(() => {
  'use strict';
  document.querySelectorAll('[data-faq]').forEach(group => {
    const rows = [...group.querySelectorAll('.detail-item')];
    function open(selected) {
      rows.forEach(row => {
        const expanded = row === selected;
        row.classList.toggle('is-active', expanded);
        row.querySelector('.detail-trigger').setAttribute('aria-expanded', String(expanded));
        const panel = row.querySelector('.detail-description');
        panel.setAttribute('aria-hidden', String(!expanded));
        panel.toggleAttribute('inert', !expanded);
      });
    }
    rows.forEach(row => row.querySelector('.detail-trigger').addEventListener('click', () => {
      open(row.classList.contains('is-active') ? null : row);
    }));
    open(rows[0]);
    group.classList.add('disclosure-ready');
  });
});

/* Compra móvel: visibilidade por posição, sem duplicar a chamada final. */
(() => {
  'use strict';
  const bar = document.querySelector('[data-mobile-purchase]');
  const hero = document.getElementById('inicio');
  const closing = document.getElementById('chamada-final');
  // A oferta já tem o próprio botão; a barra some enquanto ela está na tela.
  const offer = document.getElementById('oferta');
  if (!bar || !hero || !closing) return;
  const root = document.documentElement;
  const mobile = window.matchMedia('(max-width: 720px)');
  let passedHero = false;
  let reachedClosing = false;
  let offerVisible = false;
  let queued = false;

  function reserveSpace() {
    const height = bar.hidden ? 0 : bar.offsetHeight;
    if (height > 0) root.style.setProperty('--mobile-purchase-space', `${height}px`);
    else root.style.removeProperty('--mobile-purchase-space');
  }
  function render() {
    const visible = mobile.matches && passedHero && !reachedClosing && !offerVisible;
    if (!visible && reachedClosing && bar.contains(document.activeElement)) {
      closing.querySelector('[data-compra]')?.focus({preventScroll:true});
    }
    bar.hidden = !visible;
    bar.toggleAttribute('inert', !visible);
    bar.setAttribute('aria-hidden', String(!visible));
    root.classList.toggle('has-mobile-purchase', visible);
    reserveSpace();
  }
  function readPosition() {
    passedHero = hero.getBoundingClientRect().bottom <= 0;
    // Depois de passar pelo encerramento, a barra continua oculta no rodapé.
    reachedClosing = closing.getBoundingClientRect().top < window.innerHeight;
    if (offer) {
      const box = offer.getBoundingClientRect();
      offerVisible = box.top < window.innerHeight && box.bottom > 0;
    }
    render();
  }
  function scheduleRead() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; readPosition(); });
  }
  if ('IntersectionObserver' in window) {
    const visibility = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === hero) passedHero = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        if (entry.target === closing) reachedClosing = entry.isIntersecting || entry.boundingClientRect.top < 0;
        if (entry.target === offer) offerVisible = entry.isIntersecting;
      });
      render();
    }, {threshold:0});
    visibility.observe(hero);
    visibility.observe(closing);
    if (offer) visibility.observe(offer);
  } else {
    window.addEventListener('scroll', scheduleRead, {passive:true});
  }
  window.addEventListener('resize', scheduleRead, {passive:true});
  window.addEventListener('pageshow', scheduleRead);
  mobile.addEventListener('change', scheduleRead);
  if ('ResizeObserver' in window) new window.ResizeObserver(reserveSpace).observe(bar);
  readPosition();
})();

/* Vitrine: navegação manual, gestos e objetos decorativos. Independente do 3D. */
depoisDaCarga(() => {
  'use strict';
  const section = document.getElementById('para-que');
  if (!section) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');

  section.querySelectorAll('[data-notes-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('[data-note-slide]')];
    const viewport = carousel.querySelector('.notes-viewport');
    const live = carousel.querySelector('.notes-position');
    const progress = carousel.querySelector('[data-note-progress] > i');
    const toggle = carousel.querySelector('[data-note-autoplay]');
    const precise = window.matchMedia('(hover:hover) and (pointer:fine)');
    if (!slides.length || !viewport) return;
    let current = 0, gesture = null, touchTimer = null, frame = 0, tilt = null;
    // Cada motivo de pausa é independente; o autoplay só anda sem nenhum deles.
    const holds = new Set(['offscreen']);

    function show(index, manual = true) {
      const next = (index + slides.length) % slides.length;
      const previous = slides[current];
      carousel.dataset.direction = index < current ? 'prev' : 'next';
      current = next;
      live.setAttribute('aria-live', manual ? 'polite' : 'off');
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.remove('is-entering', 'is-leaving');
        slide.classList.toggle('is-current', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.toggleAttribute('inert', !active);
      });
      if (previous !== slides[current]) {
        if (reduced.matches) {
          // Com movimento reduzido, a troca é só um fade curto; a Web Animations API não é bloqueada pelo CSS.
          slides[current].animate?.([{opacity:0}, {opacity:1}], {duration:300, easing:'ease-out'});
        } else if (!calm()) {
          previous.classList.add('is-leaving');
          slides[current].classList.add('is-entering');
        }
      }
      carousel.querySelector('[data-note-position]').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      carousel.querySelector('[data-note-announcement]').textContent = ` · ${slides[current].dataset.noteLabel}`;
      restart();
    }
    slides.forEach(slide => slide.addEventListener('animationend', event => {
      if (event.target === slide) slide.classList.remove('is-entering', 'is-leaving');
    }));

    // A barra dourada é o relógio: ao completar 5 s, a página avança.
    const autoplayAllowed = () => !reduced.matches && Boolean(progress);
    let restarts = 0;
    function restart() {
      if (!progress) return;
      carousel.classList.remove('is-autoplay');
      if (!autoplayAllowed()) return;
      // A barra recomeça dois quadros depois, sem forçar layout síncrono; só vale o pedido mais recente.
      const ticket = ++restarts;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (ticket === restarts) carousel.classList.add('is-autoplay');
      }));
    }
    function sync() {
      carousel.classList.toggle('is-autoplay-paused', holds.size > 0);
    }
    function hold(reason, on) {
      if (on) holds.add(reason); else holds.delete(reason);
      sync();
    }
    progress?.addEventListener('animationend', () => { if (!holds.size) show(current + 1, false); });

    carousel.querySelector('[data-note-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-note-next]').addEventListener('click', () => show(current + 1));
    toggle?.addEventListener('click', () => {
      const paused = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Retomar a troca automática das páginas' : 'Pausar a troca automática das páginas');
      hold('user', paused);
    });
    carousel.addEventListener('keydown', event => {
      const destination = {ArrowLeft:current - 1, ArrowRight:current + 1, Home:0, End:slides.length - 1}[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      show(destination);
    });

    // Pausas: mouse sobre o carrossel, foco pelo teclado, toque (volta 8 s depois) e aba oculta.
    carousel.addEventListener('mouseenter', () => { if (precise.matches) hold('hover', true); });
    carousel.addEventListener('mouseleave', () => hold('hover', false));
    carousel.addEventListener('focusin', event => { if (event.target.matches?.(':focus-visible')) hold('focus', true); });
    carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) hold('focus', false); });
    function touched() {
      hold('touch', true);
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => hold('touch', false), 8000);
    }
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));

    // Folha levantada: escala e inclinação seguem o mouse, no máximo 6°.
    function paintTilt() {
      frame = 0;
      if (!tilt) return;
      const rect = slides[current].querySelector('.note-paper').getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (tilt.x - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (tilt.y - rect.top) / rect.height));
      carousel.style.setProperty('--folha-y', `${((x - .5) * 12).toFixed(2)}deg`);
      carousel.style.setProperty('--folha-x', `${((.5 - y) * 12).toFixed(2)}deg`);
    }
    viewport.addEventListener('pointermove', event => {
      if (!precise.matches || event.pointerType !== 'mouse' || calm() || gesture) return;
      carousel.classList.add('is-lifted');
      tilt = {x:event.clientX, y:event.clientY};
      if (!frame) frame = requestAnimationFrame(paintTilt);
    }, {passive:true});
    viewport.addEventListener('pointerleave', () => {
      tilt = null;
      carousel.classList.remove('is-lifted');
      carousel.style.removeProperty('--folha-x');
      carousel.style.removeProperty('--folha-y');
    });

    viewport.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
      if (event.pointerType !== 'mouse') touched();
      gesture = {id:event.pointerId, x:event.clientX, y:event.clientY};
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
      if (Math.abs(x) < 8 || Math.abs(x) <= Math.abs(y) * 1.2) return;
      carousel.classList.add('is-dragging');
      // Limita o arraste a meia página sem bloquear o scroll vertical do celular.
      const width = viewport.getBoundingClientRect?.().width || 320;
      carousel.style.setProperty('--arraste', `${(Math.max(-width, Math.min(width, x)) * .5).toFixed(1)}px`);
    }, {passive:true});
    function finish(event, cancelled = false) {
      if (!gesture || gesture.id !== event.pointerId) return;
      const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
      gesture = null;
      carousel.classList.remove('is-dragging');
      carousel.style.removeProperty('--arraste');
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      if (event.pointerType !== 'mouse') touched();
      const horizontal = !cancelled && Math.abs(x) >= 40 && Math.abs(x) > Math.abs(y) * 1.2;
      if (horizontal) show(current + (x < 0 ? 1 : -1));
    }
    viewport.addEventListener('pointerup', event => finish(event));
    viewport.addEventListener('pointercancel', event => finish(event, true));

    carousel.querySelector('[data-notes-controls]').hidden = false;
    if (toggle) toggle.hidden = !autoplayAllowed();
    if ('IntersectionObserver' in window) {
      new window.IntersectionObserver(entries => {
        hold('offscreen', !entries.some(entry => entry.isIntersecting));
      }, {threshold:.35}).observe(carousel);
    } else hold('offscreen', false);
    reduced.addEventListener('change', () => {
      if (toggle) toggle.hidden = !autoplayAllowed();
      restart();
    });
    show(0, false);
  });

  const objects = [...section.querySelectorAll('[data-vitrine-object]')];
  objects.forEach(object => {
    object.querySelector('img')?.addEventListener('error', () => { object.hidden = true; });
  });
  if (!objects.length) return;
  let visible = false, queued = false;
  function reset() { objects.forEach(object => object.style.removeProperty('--object-y')); }
  function update() {
    queued = false;
    if (calm() || document.hidden) { reset(); return; }
    if (!visible) return;
    const rect = section.getBoundingClientRect?.();
    if (!rect) return;
    const distance = innerHeight / 2 - (rect.top + rect.height / 2);
    const limit = innerWidth <= 720 ? 10 : 24;
    objects.forEach(object => {
      const offset = Math.max(-limit, Math.min(limit, distance * Number(object.dataset.depth)));
      object.style.setProperty('--object-y', `${offset.toFixed(1)}px`);
    });
  }
  function queue() {
    if (queued || !visible || calm()) return;
    queued = true;
    requestAnimationFrame(update);
  }
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) queue();
    }, {rootMargin:'100px'}).observe(section);
  } else { visible = true; queue(); }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', queue, {passive:true});
  const syncMotion = () => { if (calm()) reset(); else queue(); };
  reduced.addEventListener('change', syncMotion);
  if ('MutationObserver' in window) {
    new window.MutationObserver(syncMotion).observe(root, {attributes:true, attributeFilter:['class']});
  }
});

/* A frase: leque de postais e ondas com parallax.
   O estado final fica visível sem JS e com movimento reduzido. */
depoisDaCarga(() => {
  'use strict';
  const section = document.getElementById('a-frase');
  if (!section) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precise = window.matchMedia('(hover:hover) and (pointer:fine)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');
  const io = 'IntersectionObserver' in window;
  let visible = !io;

  // Postais: a ordem do array é a ordem da pilha, da frente para trás.
  const fan = section.querySelector('[data-postais]');
  let order = fan ? [...fan.querySelectorAll('[data-postal]')] : [];
  function stack(arriving) {
    order.forEach((card, slot) => {
      card.dataset.slot = String(slot);
      card.setAttribute('aria-current', String(slot === 0));
    });
    if (!arriving || calm()) return;
    arriving.classList.remove('is-chegando');
    requestAnimationFrame(() => requestAnimationFrame(() => arriving.classList.add('is-chegando')));
  }
  order.forEach(card => {
    card.addEventListener('animationend', () => card.classList.remove('is-chegando'));
    card.addEventListener('click', () => {
      // O postal da frente vai para o fim; qualquer outro vem para a frente.
      order = card === order[0] ? [...order.slice(1), card] : [card, ...order.filter(item => item !== card)];
      stack(order[0]);
    });
  });
  stack();

  // Ondas: o padrão anda mais devagar que o conteúdo, só com a dobra na tela.
  const waves = section.querySelector('.frase-ondas');
  let queued = false;
  function drift() {
    queued = false;
    if (!waves) return;
    if (calm()) { waves.style.removeProperty('--ondas-y'); return; }
    const rect = section.getBoundingClientRect();
    const limit = rect.height * .16;
    const offset = Math.max(-limit, Math.min(limit, -rect.top * .22));
    waves.style.setProperty('--ondas-y', `${offset.toFixed(1)}px`);
  }
  function queue() {
    if (queued || !visible || calm()) return;
    queued = true;
    requestAnimationFrame(drift);
  }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', queue, {passive:true});

  function open() { fan?.classList.add('is-open'); }
  if (io) {
    new window.IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) queue();
    }, {rootMargin:'100px'}).observe(section);
    const opener = new window.IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      open();
      opener.disconnect();
    }, {threshold:.3});
    opener.observe(fan || section);
  } else open();
  if (calm()) fan?.classList.add('is-open');

  const syncMotion = () => {
    if (calm()) { fan?.classList.add('is-open'); drift(); }
    else queue();
  };
  reduced.addEventListener('change', syncMotion);
  if ('MutationObserver' in window) {
    new window.MutationObserver(syncMotion).observe(root, {attributes:true, attributeFilter:['class']});
  }
});

/* Cadernos com [data-caderno-hover]: inclinação e brilho seguem o mouse e a capa
   entreabre; no toque, a capa entreabre uma vez quando o caderno entra na tela. */
depoisDaCarga(() => {
  'use strict';
  const books = [...document.querySelectorAll('.caderno-3d[data-caderno-hover]')];
  if (!books.length) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precise = window.matchMedia('(hover:hover) and (pointer:fine)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');

  books.forEach(book => {
    let pointer = null, frame = 0;
    function paint() {
      frame = 0;
      if (!pointer) return;
      const rect = book.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (pointer.x - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (pointer.y - rect.top) / rect.height));
      book.style.setProperty('--inclina-y', `${((x - .5) * 18).toFixed(2)}deg`);
      book.style.setProperty('--inclina-x', `${((.5 - y) * 16).toFixed(2)}deg`);
      book.style.setProperty('--brilho-x', `${(x * 100).toFixed(1)}%`);
      book.style.setProperty('--brilho-y', `${(y * 100).toFixed(1)}%`);
    }
    function rest() {
      pointer = null;
      book.classList.remove('is-hover', 'is-entreaberto');
      ['--inclina-x', '--inclina-y'].forEach(name => book.style.removeProperty(name));
    }
    book.addEventListener('pointerenter', event => {
      if (!precise.matches || event.pointerType === 'touch' || calm()) return;
      book.classList.add('is-hover', 'is-entreaberto');
    });
    book.addEventListener('pointermove', event => {
      if (!book.classList.contains('is-hover')) return;
      pointer = {x:event.clientX, y:event.clientY};
      if (!frame) frame = requestAnimationFrame(paint);
    }, {passive:true});
    book.addEventListener('pointerleave', rest);
    reduced.addEventListener('change', () => { if (calm()) rest(); });

    if (!('IntersectionObserver' in window)) return;
    const peek = new window.IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      peek.disconnect();
      if (precise.matches || calm()) return;
      setTimeout(() => {
        book.classList.add('is-entreaberto');
        setTimeout(() => book.classList.remove('is-entreaberto'), 1600);
      }, 900);
    }, {threshold:.5});
    peek.observe(book);
  });
});

/* Oferta: a entrada dispara uma vez, quando a dobra entra na tela, e os preços dos dois
   cards contam juntos de 0,00 até o valor de PRECO. Com movimento reduzido, tudo começa no estado final. */
depoisDaCarga(() => {
  'use strict';
  const section = document.querySelector('[data-oferta]');
  if (!section) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [...section.querySelectorAll('[data-conta]')];
  // O valor final vem do texto que o script de PRECO já escreveu; o leitor de tela lê a cópia sr-only.
  function count() {
    const final = counters[0]?.textContent.trim();
    const target = parseFloat((final || '').replace(/\./g, '').replace(',', '.'));
    if (!counters.length || !Number.isFinite(target) || reduced.matches || document.documentElement.classList.contains('motion-paused')) return;
    const format = value => value.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
    const write = text => counters.forEach(counter => { counter.textContent = text; });
    write(format(0));
    setTimeout(() => {
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / 800);
        write(t < 1 ? format(target * (1 - Math.pow(1 - t, 3))) : final);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 750);
  }
  const deliver = () => {
    if (section.classList.contains('is-entregue')) return;
    section.classList.add('is-entregue');
    count();
  };
  if (reduced.matches || !('IntersectionObserver' in window)) { deliver(); return; }
  const observer = new window.IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    deliver();
    observer.disconnect();
  }, {threshold:.2});
  observer.observe(section);
  reduced.addEventListener('change', () => { if (reduced.matches) deliver(); });
});

/* Compra: depois do primeiro clique, os botões de compra ignoram novos cliques por 3 s.
   Ao voltar pelo histórico (pageshow), eles ficam normais de novo. */
(() => {
  'use strict';
  const buttons = () => document.querySelectorAll('[data-compra]');
  let timer = null;
  function release() {
    clearTimeout(timer);
    timer = null;
    buttons().forEach(button => {
      button.classList.remove('is-enviando');
      button.removeAttribute('aria-busy');
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-compra]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    if (timer) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    buttons().forEach(item => {
      item.classList.add('is-enviando');
      item.setAttribute('aria-busy', 'true');
    });
    timer = setTimeout(release, 3000);
  }, true);
  window.addEventListener('pageshow', release);
})();

/* Como comprar: a linha verde e o lápis acompanham o scroll; cada passo acende quando
   a linha chega nele. As imagens abrem ampliadas no modal do design system. */
depoisDaCarga(() => {
  'use strict';
  const section = document.querySelector('[data-passos]');
  if (!section) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');
  const trail = section.querySelector('.passos-trilha');
  const line = section.querySelector('.passos-linha');
  const pencil = section.querySelector('.passos-lapis');
  const steps = [...section.querySelectorAll('[data-passo]')];
  let visible = false, queued = false, length = 0;

  // A linha vai do centro do primeiro número ao centro do último.
  function measure() {
    const numbers = steps.map(step => step.querySelector('.passo-numero'));
    if (!numbers.length) return;
    const base = trail.getBoundingClientRect().top;
    const center = el => { const box = el.getBoundingClientRect(); return box.top + box.height / 2 - base; };
    const top = center(numbers[0]);
    length = Math.max(0, center(numbers[numbers.length - 1]) - top);
    line.style.top = `${top}px`;
    line.style.bottom = 'auto';
    line.style.height = `${length}px`;
  }
  function finish() {
    section.classList.add('is-calmo');
    steps.forEach(step => step.classList.add('is-aceso'));
    line.style.setProperty('--passos-progresso', '1');
  }
  function draw() {
    queued = false;
    if (calm()) { finish(); return; }
    section.classList.remove('is-calmo');
    const anchor = window.innerHeight * .62;
    const box = line.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (anchor - box.top) / (box.height || 1)));
    line.style.setProperty('--passos-progresso', progress.toFixed(4));
    pencil?.style.setProperty('--lapis-y', `${(progress * length).toFixed(1)}px`);
    steps.forEach(step => {
      if (step.classList.contains('is-aceso')) return;
      const number = step.querySelector('.passo-numero').getBoundingClientRect();
      if (number.top + number.height / 2 <= anchor + 1) step.classList.add('is-aceso');
    });
  }
  function queue() {
    if (queued || !visible) return;
    queued = true;
    requestAnimationFrame(draw);
  }
  // A primeira medição espera a dobra chegar perto, para não forçar layout na carga.
  let measured = false;
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && !measured) { measured = true; measure(); }
      if (visible) queue();
    }, {rootMargin:'100px'}).observe(section);
  } else { measure(); visible = true; finish(); }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', () => { measure(); queue(); }, {passive:true});
  if ('ResizeObserver' in window) new window.ResizeObserver(() => { measure(); queue(); }).observe(trail);
  reduced.addEventListener('change', queue);
  if (calm()) finish();

  // Lightbox: showModal deixa o resto da página inerte e o Esc fecha; o foco volta à imagem.
  const dialog = section.querySelector('[data-lightbox-dialog]');
  const big = dialog?.querySelector('[data-lightbox-img]');
  let opener = null;
  if (!dialog?.showModal || !big) return;
  section.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    opener = button;
    // O src é o arquivo original, em tamanho cheio, para a leitura dos detalhes.
    big.src = image.src;
    big.alt = image.alt;
    big.width = image.naturalWidth || image.width;
    big.height = image.naturalHeight || image.height;
    dialog.showModal();
    root.classList.add('modal-open');
    dialog.querySelector('[data-lightbox-close]').focus();
  }));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    root.classList.remove('modal-open');
    opener?.focus();
  });
});


/* O CTA dos detalhes reutiliza a pausa do design system também quando só o botão sai da tela. */
depoisDaCarga(() => {
  const cta = document.querySelector('.details-cta');
  if (!cta || !('IntersectionObserver' in window)) return;
  cta.classList.add('is-offscreen');
  new window.IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-offscreen', !entry.isIntersecting));
  }, {threshold:.1}).observe(cta);
});
