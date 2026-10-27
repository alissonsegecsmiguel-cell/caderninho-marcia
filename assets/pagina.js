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
  function init(scope = document) {
    const elements = [...scope.querySelectorAll('[data-caderno]')];
    if (scope.matches?.('[data-caderno]')) elements.unshift(scope);
    elements.forEach(element => {
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
    });
    scope.querySelectorAll('[data-caderno-replay]').forEach(button => {
      if (boundButtons.has(button)) return;
      boundButtons.add(button);
      button.addEventListener('click', () => replay(button.dataset.cadernoReplay));
    });
  }
  // A mesma montagem aceita poses dirigidas por uma lista, sem iniciar o loop.
  function showFeature(target, feature) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    const item = instances.get(element);
    if (!item?.interactive || !/^0[1-6]$/.test(feature)) return false;
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

/* Diferenciais: botões de disclosure, com foco, toque e hover equivalentes. */
(() => {
  'use strict';
  const section = document.getElementById('detalhes');
  const group = section?.querySelector('[data-details]');
  if (!group || !window.Caderninho3D) return;
  const rows = [...group.querySelectorAll('[data-detail]')];
  const buttons = rows.map(row => row.querySelector('.detail-trigger'));
  const stage = group.querySelector('.details-stage');
  const book = stage.querySelector('[data-caderno]');
  const number = stage.querySelector('.details-active-number');
  const caption = stage.querySelector('[data-detail-caption]');
  const precise = window.matchMedia('(hover:hover) and (pointer:fine)');
  let current = null;
  function activate(row) {
    if (row === current) return;
    current = row;
    rows.forEach(item => {
      const active = item === row;
      item.classList.toggle('is-active', active);
      item.querySelector('.detail-trigger').setAttribute('aria-expanded', String(active));
      item.querySelector('.detail-description').setAttribute('aria-hidden', String(!active));
    });
    const feature = row.dataset.detail;
    const title = row.querySelector('.detail-title').textContent;
    window.Caderninho3D.showFeature(book, feature);
    stage.dataset.activeDetail = feature;
    book.setAttribute('aria-label', `Caderninho na Mão! em 3D: ${title}.`);
    caption.textContent = title;
    number.textContent = feature;
    number.classList.remove('is-changing');
    void number.offsetWidth;
    number.classList.add('is-changing');
  }
  rows.forEach((row, index) => {
    const button = buttons[index];
    button.addEventListener('pointerenter', event => {
      if (precise.matches && event.pointerType !== 'touch') activate(row);
    });
    button.addEventListener('focus', () => activate(row));
    button.addEventListener('click', () => activate(row));
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
  group.classList.add('disclosure-ready');
})();

/* Perguntas da compra: disclosure nativo de botão, sem alturas fixas. */
(() => {
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
})();

/* Compra móvel: visibilidade por posição, sem duplicar a chamada final. */
(() => {
  'use strict';
  const bar = document.querySelector('[data-mobile-purchase]');
  const hero = document.getElementById('inicio');
  const closing = document.getElementById('chamada-final');
  if (!bar || !hero || !closing) return;
  const root = document.documentElement;
  const mobile = window.matchMedia('(max-width: 720px)');
  let passedHero = false;
  let reachedClosing = false;
  let queued = false;

  function reserveSpace() {
    const height = bar.hidden ? 0 : bar.offsetHeight;
    if (height > 0) root.style.setProperty('--mobile-purchase-space', `${height}px`);
    else root.style.removeProperty('--mobile-purchase-space');
  }
  function render() {
    const visible = mobile.matches && passedHero && !reachedClosing;
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
      });
      render();
    }, {threshold:0});
    visibility.observe(hero);
    visibility.observe(closing);
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
(() => {
  'use strict';
  const section = document.getElementById('para-que');
  if (!section) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches || root.classList.contains('motion-paused');

  section.querySelectorAll('[data-notes-carousel]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('[data-note-slide]')];
    const viewport = carousel.querySelector('.notes-viewport');
    const track = carousel.querySelector('.notes-track');
    if (!slides.length || !viewport || !track) return;
    let current = 0, gesture = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-current', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.toggleAttribute('inert', !active);
      });
      carousel.querySelector('[data-note-position]').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      carousel.querySelector('[data-note-announcement]').textContent = ` · ${slides[current].dataset.noteLabel}`;
    }
    carousel.querySelector('[data-note-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-note-next]').addEventListener('click', () => show(current + 1));
    carousel.addEventListener('keydown', event => {
      const destination = {ArrowLeft:current - 1, ArrowRight:current + 1, Home:0, End:slides.length - 1}[event.key];
      if (destination === undefined) return;
      event.preventDefault();
      show(destination);
    });
    viewport.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gesture = {id:event.pointerId, x:event.clientX, y:event.clientY};
      viewport.setPointerCapture?.(event.pointerId);
    });
    viewport.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
      if (Math.abs(x) < 8 || Math.abs(x) <= Math.abs(y) * 1.2) return;
      carousel.classList.add('is-dragging');
      // Limita o arraste a uma página sem bloquear o scroll vertical do celular.
      const width = viewport.getBoundingClientRect?.().width || 320;
      const delta = Math.max(-width, Math.min(width, x));
      track.style.transform = `translateX(calc(-${current * 100}% + ${delta}px))`;
    });
    function finish(event, cancelled = false) {
      if (!gesture || gesture.id !== event.pointerId) return;
      const x = event.clientX - gesture.x, y = event.clientY - gesture.y;
      gesture = null;
      carousel.classList.remove('is-dragging');
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      const horizontal = !cancelled && Math.abs(x) >= 40 && Math.abs(x) > Math.abs(y) * 1.2;
      show(current + (horizontal ? x < 0 ? 1 : -1 : 0));
    }
    viewport.addEventListener('pointerup', event => finish(event));
    viewport.addEventListener('pointercancel', event => finish(event, true));
    carousel.querySelector('[data-notes-controls]').hidden = false;
    show(0);
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
})();

/* A frase: leque de postais, caderno com inclinação e ondas com parallax.
   O estado final fica visível sem JS e com movimento reduzido. */
(() => {
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
    void arriving.offsetWidth;
    arriving.classList.add('is-chegando');
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

  // Caderno: inclinação e brilho seguem o mouse; no toque, a capa entreabre uma vez.
  const book = section.querySelector('.frase-book');
  let pointer = null, frame = 0, peeked = false;
  function paint() {
    frame = 0;
    if (!pointer || !book) return;
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
  if (book) {
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
  }
  function peek() {
    if (peeked || !book || precise.matches || calm()) return;
    peeked = true;
    book.classList.add('is-entreaberto');
    setTimeout(() => book.classList.remove('is-entreaberto'), 1600);
  }

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

  function open() {
    fan?.classList.add('is-open');
    setTimeout(peek, calm() ? 0 : 900);
  }
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
    if (calm()) { fan?.classList.add('is-open'); if (book) rest(); drift(); }
    else queue();
  };
  reduced.addEventListener('change', syncMotion);
  if ('MutationObserver' in window) {
    new window.MutationObserver(syncMotion).observe(root, {attributes:true, attributeFilter:['class']});
  }
})();
