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
    item.element.dataset.cadernoState = 'open';
    observer?.unobserve(item.element);
  }
  function enter(item) {
    if (calm()) { settle(item); return; }
    if (item.started) return;
    item.started = true;
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

  function replay(target) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    const item = instances.get(element);
    if (!item) return;
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
      const item = {element, timer:null, started:false};
      instances.set(element, item);
      element.dataset.cadernoState = 'closed';
      if (calm()) settle(item);
      else if (observer) observer.observe(element);
      else enter(item);
    });
    scope.querySelectorAll('[data-caderno-replay]').forEach(button => {
      if (boundButtons.has(button)) return;
      boundButtons.add(button);
      button.addEventListener('click', () => replay(button.dataset.cadernoReplay));
    });
  }
  function syncMotion() {
    instances.forEach(item => {
      if (calm()) settle(item);
      else item.element.classList.remove('is-still');
    });
  }
  reduced.addEventListener('change', syncMotion);
  if ('MutationObserver' in window) {
    new window.MutationObserver(syncMotion).observe(root, {attributes:true, attributeFilter:['class']});
  }
  window.Caderninho3D = Object.freeze({init, replay});
  init();
})();
