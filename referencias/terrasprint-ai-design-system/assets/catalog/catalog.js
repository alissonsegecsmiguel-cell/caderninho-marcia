/* TerraSprint catalog: specimen wiring, sidebar spy and routing.
   Overview is the default view (no hash); Components lives at #components and #components-<group>. */
(function () {
  var COMPONENTS_ENABLED = true;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body, frame = document.getElementById('overview-frame');
  var main = document.getElementById('ds-main'), view = document.getElementById('view-components');
  var capsule = document.getElementById('navCapsule');
  var linkO = document.getElementById('nav-overview'), linkC = document.getElementById('nav-components');
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function () { return body.classList.contains('is-components'); };

  /* ---------------------------------------------------------- live grounds */
  /* the view's ground: the hero layers behind the whole Components view; a click on empty catalog space
     opens / closes the umbrella, as a click on the hero does on the page */
  var bg = document.getElementById('ds-bg');
  window.dsRain(bg, bg.querySelector('[data-ds-rain]'), on, main, function (e) {
    return !e.target.closest('.ds-spec, .ds-sheet, .ds-surf, .ds-row, .ds-head, form, iconify-icon');
  });
  /* specimen grounds idle while off screen or while the Overview is showing */
  function seen(el) {
    var vis = false;
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { threshold: 0 }).observe(el);
    return function () { return vis && on(); };
  }
  $$('[data-ds-hero]').forEach(function (s) { window.dsRain(s, s.querySelector('[data-ds-rain]'), seen(s)); });
  $$('[data-ds-footer]').forEach(function (s) { window.dsPetals(s, s.querySelector('[data-ds-petals]')); });

  /* ---------------------------------------------------------- motion specimens (the page's handlers) */
  /* rise / fade reveal */
  var riseBox = document.getElementById('ds-rise'), risers = $$('[data-rise]', riseBox), io = null;
  function rise() {
    if (io) io.disconnect();
    risers.forEach(function (el) {
      el.style.transition = 'none';
      el.style.opacity = '0';
      if (!reduced) el.style.transform = 'translateY(14px)';
      void el.offsetWidth;
      el.style.transition = 'opacity 0.8s cubic-bezier(0.22,0.61,0.36,1), transform 0.8s cubic-bezier(0.22,0.61,0.36,1)';
    });
    var seenMap = new WeakMap();
    io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      visible.forEach(function (e, i) {
        if (seenMap.get(e.target)) return;
        seenMap.set(e.target, true);
        setTimeout(function () {
          e.target.style.opacity = '1';
          if (!reduced) e.target.style.transform = e.target.style.transform.replace(/\s*translateY\(14px\)/, '');
        }, i * 90);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    risers.forEach(function (el) { io.observe(el); });
  }
  rise();
  $$('[data-ds-replay="rise"]').forEach(function (b) { b.addEventListener('click', rise); });

  /* floating tile drift */
  if (!reduced && 'animate' in Element.prototype) {
    $$('[data-drift]', main).forEach(function (el) {
      var i = parseInt(el.getAttribute('data-drift'), 10);
      var base = el.style.transform || '';
      el.animate(
        [{ transform: base + ' translateY(0px) rotate(0deg)' },
         { transform: base + ' translateY(-9px) rotate(' + (i % 2 === 0 ? -1.5 : 1.5) + 'deg)' },
         { transform: base + ' translateY(0px) rotate(0deg)' }],
        { duration: 5200 + i * 900, iterations: Infinity, easing: 'ease-in-out', delay: i * 500 }
      );
    });
  }

  /* word reveal: the page's GSAP ScrollTrigger setup, scrubbed by this catalog's scroller */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    $$('.scroll-reveal', main).forEach(function (el) {
      var hiddenOpacity = el.getAttribute('data-reveal-opacity') || '0.15';
      var hiddenBlur = el.getAttribute('data-reveal-blur') || '6px';
      var hiddenY = el.getAttribute('data-reveal-y') || '12px';
      var stagger = parseFloat(el.getAttribute('data-reveal-stagger')) || 0.05;
      var start = el.getAttribute('data-reveal-start') || 'top 85%';
      var end = el.getAttribute('data-reveal-end') || 'bottom 50%';
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), textNodes = [], node;
      while ((node = walker.nextNode())) textNodes.push(node);
      textNodes.forEach(function (textNode) {
        var fragment = document.createDocumentFragment();
        textNode.nodeValue.split(/(\s+)/).forEach(function (word) {
          if (word.trim().length > 0) {
            var span = document.createElement('span');
            span.textContent = word;
            span.className = 'reveal-word inline-block';
            span.style.opacity = hiddenOpacity;
            span.style.filter = 'blur(' + hiddenBlur + ')';
            span.style.transform = 'translateY(' + hiddenY + ')';
            span.style.willChange = 'opacity, filter, transform';
            fragment.appendChild(span);
          } else fragment.appendChild(document.createTextNode(word));
        });
        textNode.parentNode.replaceChild(fragment, textNode);
      });
      gsap.to(el.querySelectorAll('.reveal-word'), {
        opacity: 1, filter: 'blur(0px)', y: 0, stagger: stagger, ease: 'none',
        scrollTrigger: { trigger: el, scroller: main, start: start, end: end, scrub: 1 }
      });
    });
  }

  /* mobile menu specimen (the page's #menuBtn handler) */
  $$('[data-ds-mnav]').forEach(function (box) {
    var btn = box.querySelector('[data-ds-menubtn]'), menu = box.querySelector('[data-ds-menu]');
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('iconify-icon').setAttribute('icon', open ? 'solar:close-circle-linear' : 'solar:hamburger-menu-linear');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('iconify-icon').setAttribute('icon', 'solar:hamburger-menu-linear');
      });
    });
  });

  /* specimens never navigate or submit */
  main.addEventListener('click', function (e) { var a = e.target.closest('a[href]'); if (a) e.preventDefault(); });
  main.addEventListener('submit', function (e) { e.preventDefault(); }, true);

  /* ---------------------------------------------------------- nav capsule scroll state (the page's #navCapsule handler) */
  var overviewScrolled = false;
  function paintCapsule() {
    var s = on() ? main.scrollTop > 40 : overviewScrolled;
    if (s) {
      capsule.style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 44px -16px rgba(35,36,39,0.3)';
      capsule.style.background = 'rgba(255,255,255,0.9)';
    } else {
      capsule.style.boxShadow = '0 1px 0 rgba(255,255,255,0.9) inset, 0 10px 30px -14px rgba(35,36,39,0.18)';
      capsule.style.background = 'rgba(255,255,255,0.78)';
    }
  }

  /* ---------------------------------------------------------- sidebar spy */
  var links = $$('#ds-side a'), groups = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var lastCur = -1;
  function spy() {
    var y = main.scrollTop + topGap() + 64, cur = 0;
    groups.forEach(function (g, i) { if (g && g.offsetTop <= y) cur = i; });
    if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) cur = groups.length - 1;
    links.forEach(function (a, i) { a.classList.toggle('is-current', i === cur); });
    if (cur !== lastCur) {
      lastCur = cur;
      var c = links[cur], side = c && c.parentNode;
      if (side && side.scrollWidth > side.clientWidth + 2) side.scrollTo({ left: c.offsetLeft - 12, behavior: 'smooth' });
    }
  }
  var queued = false;
  main.addEventListener('scroll', function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; spy(); paintCapsule(); });
  }, { passive: true });

  /* space kept clear above a group when jumping to it: below the capsule, or below the sidebar bar on narrow screens */
  function topGap() {
    var side = document.getElementById('ds-side').getBoundingClientRect(), mt = main.getBoundingClientRect().top;
    return side.width > side.height * 3 ? Math.round(side.bottom - mt + 16) : 96;
  }

  /* ---------------------------------------------------------- routing */
  var mode = 'overview';
  var isComp = function (h) { return h === '#components' || h.indexOf('#components-') === 0; };
  if (!COMPONENTS_ENABLED) { linkC.setAttribute('aria-disabled', 'true'); linkC.tabIndex = -1; }
  function post(m) { try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }

  function route() {
    var h = location.hash;
    if (h === '#overview') { history.replaceState(null, '', location.pathname + location.search); h = ''; }
    if (isComp(h) && !COMPONENTS_ENABLED) { history.replaceState(null, '', location.pathname + location.search); h = ''; }
    var comp = isComp(h), was = mode;
    mode = comp ? 'components' : 'overview';
    body.classList.toggle('is-components', comp);
    linkO.classList.toggle('is-active', !comp);
    linkC.classList.toggle('is-active', comp);
    if (comp) { linkC.setAttribute('aria-current', 'page'); linkO.removeAttribute('aria-current'); }
    else { linkO.setAttribute('aria-current', 'page'); linkC.removeAttribute('aria-current'); }
    paintCapsule();
    if (!comp) return;
    if (was !== 'components' && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    if (h === '#components') main.scrollTop = 0;
    else { var el = document.getElementById(h.slice(1)); if (el) main.scrollTop = el.offsetTop - topGap(); }
    spy(); paintCapsule();
  }

  /* Overview is the default view and carries no hash */
  linkO.addEventListener('click', function (e) {
    e.preventDefault();
    if (mode !== 'overview') { history.pushState(null, '', location.pathname + location.search); route(); }
  });
  /* the wordmark goes back to the top of the Overview, as on the page (#top) */
  document.getElementById('ds-home').addEventListener('click', function (e) {
    e.preventDefault();
    if (mode !== 'overview') { history.pushState(null, '', location.pathname + location.search); route(); }
    post({ ds: 'top' });
  });

  addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow || !e.data) return;
    var d = e.data;
    if (d.ds === 'ready') body.classList.add('ds-overview-ready');
    else if (d.ds === 'scroll') { overviewScrolled = !!d.s; if (mode === 'overview') paintCapsule(); }
  });
  addEventListener('resize', function () { if (on()) spy(); });
  addEventListener('hashchange', route);
  addEventListener('popstate', route);
  route();
})();
