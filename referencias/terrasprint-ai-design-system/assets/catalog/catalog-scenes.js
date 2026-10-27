/* TerraSprint catalog: the page's own scene scripts, wrapped so they can run on more than one ground.
   Bodies are the Overview's inline scripts (rain + umbrella on #heroParticles, petals on #footerParticles,
   bloom pointer drift); the only changes are the element parameters, an `active()` gate so hidden
   copies idle, and a re-seed / resize once a ground first gets a size (it starts inside display:none). */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- bloom pointer drift (source "Bloom pointer drift") */
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 26;
      var y = (e.clientY / window.innerHeight - 0.5) * 20;
      document.querySelectorAll('[data-ds-bloom]').forEach(function (bloom) {
        bloom.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- rain + umbrella (source #heroParticles script) */
  window.dsRain = function (hero, canvas, active, clickTarget, clickFilter) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var drops = [];
    var splashes = [];
    var count = window.innerWidth < 768 ? 40 : 70;
    var mouse = { x: -9999, y: -9999, inside: false };
    var wind = 0;
    var umbrella = { open:false, x:0, y:0, vx:0, vy:0, angle:0, aVel:0, openT:0, R:78 };
    var rects = [];
    var frame = 0;
    var seeded = false;

    function resize(){
      var rect = hero.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.max(1, W * DPR);
      canvas.height = Math.max(1, H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      collectRects();
      if (!seeded && W > 0) { seeded = true; drops = []; for (var i = 0; i < count; i++) drops.push(makeDrop()); }
    }

    function collectRects(){
      rects = [];
      var hr = hero.getBoundingClientRect();
      hero.querySelectorAll('[data-drift], h1, a, [data-rise]').forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.width < 24 || r.height < 12) return;
        rects.push({ left: r.left - hr.left, right: r.right - hr.left, top: r.top - hr.top });
      });
    }

    function makeDrop(resetY){
      var nearMouse = mouse.inside && Math.random() < 0.35;
      var x = nearMouse ? mouse.x + (Math.random() - 0.5) * 180 : Math.random() * (W + 400) - 200;
      return {
        x: x,
        y: resetY ? -30 : Math.random() * H,
        py: resetY ? -30 : 0,
        vy: Math.random() * 8 + 12,
        l: Math.random() * 12 + 15,
        w: Math.random() * 0.8 + 0.8,
        color: Math.random() < 0.6 ? '#3F7D53' : (Math.random() < 0.5 ? '#232427' : '#8B6F47')
      };
    }

    function makeSplash(x, y, color){
      var splashCount = Math.floor(Math.random() * 3) + 2;
      for(var i=0; i<splashCount; i++){
        splashes.push({
          x: x, y: y,
          vx: (Math.random() - 0.5) * 4 + wind * 0.3,
          vy: -Math.random() * 3 - 1,
          r: Math.random() * 0.8 + 0.5,
          color: color, life: 1
        });
      }
    }

    function drawStatic(){ resize(); ctx.clearRect(0, 0, W, H); }

    if(reduced){
      drawStatic();
      window.addEventListener('resize', drawStatic, { passive: true });
      return;
    }

    window.addEventListener('pointermove', function(e){
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.inside = mouse.x >= 0 && mouse.x <= r.width && mouse.y >= 0 && mouse.y <= r.height;
    }, { passive: true });

    (clickTarget || hero).addEventListener('click', function(e){
      if(e.target.closest('a, button, input')) return;
      if(clickFilter && !clickFilter(e)) return;
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      umbrella.open = !umbrella.open;
      if(umbrella.open && umbrella.openT < 0.05){
        umbrella.x = mouse.x; umbrella.y = mouse.y;
        umbrella.vx = 0; umbrella.vy = 0; umbrella.angle = 0; umbrella.aVel = 0;
      }
    });

    function init(){
      resize();
      if (W > 0) { seeded = true; drops = []; for(var i = 0; i < count; i++) drops.push(makeDrop()); }
    }

    window.addEventListener('resize', resize, { passive: true });
    if('ResizeObserver' in window){
      var ro = new ResizeObserver(resize);
      ro.observe(hero);
    }

    init();

    function domeSurfaceY(x){
      var dx = x - umbrella.x;
      var R = umbrella.R * umbrella.openT;
      if(Math.abs(dx) >= R) return null;
      return umbrella.y - Math.sqrt(R * R - dx * dx);
    }

    function drawUmbrella(){
      if(umbrella.openT < 0.02) return;
      var R = umbrella.R;
      ctx.save();
      ctx.translate(umbrella.x, umbrella.y);
      ctx.rotate(umbrella.angle);
      ctx.scale(umbrella.openT, umbrella.openT);
      ctx.strokeStyle = '#232427';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -R - 12);
      ctx.lineTo(0, 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(8, 48, 8, Math.PI, 0, true);
      ctx.stroke();
      ctx.fillStyle = '#232427';
      ctx.beginPath();
      ctx.arc(0, 0, R, Math.PI, Math.PI * 2, false);
      var seg = 4, sw = (2 * R) / seg;
      for(var i = 0; i < seg; i++){
        ctx.quadraticCurveTo(R - sw * (i + 0.5), 13, R - sw * (i + 1), 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1;
      for(var j = 1; j < seg; j++){
        ctx.beginPath();
        ctx.moveTo(0, -R);
        ctx.lineTo(-R + sw * j, 0);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, -R - 12, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#232427';
      ctx.fill();
      ctx.restore();
    }

    function tick(){
      if (active && !active()) { requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, W, H);
      frame++;
      if(frame % 40 === 0) collectRects();

      var targetWind = mouse.inside ? (mouse.x / W - 0.5) * 14 : 0;
      wind += (targetWind - wind) * 0.04;

      umbrella.vx += (mouse.x - umbrella.x) * 0.09;
      umbrella.vy += (mouse.y - umbrella.y) * 0.09;
      umbrella.vx *= 0.82; umbrella.vy *= 0.82;
      umbrella.x += umbrella.vx; umbrella.y += umbrella.vy;
      var targetA = Math.max(-0.5, Math.min(0.5, umbrella.vx * 0.015 + wind * 0.02));
      umbrella.aVel += (targetA - umbrella.angle) * 0.12;
      umbrella.aVel *= 0.86;
      umbrella.angle += umbrella.aVel;
      umbrella.openT += ((umbrella.open ? 1 : 0) - umbrella.openT) * 0.14;

      for(var i = 0; i < drops.length; i++){
        var p = drops[i];
        p.py = p.y;
        var vx = wind * (p.vy / 16);
        p.x += vx;
        p.y += p.vy;

        var hit = false;

        if(umbrella.openT > 0.5){
          var sy = domeSurfaceY(p.x);
          if(sy !== null && p.y >= sy && p.py < sy){
            makeSplash(p.x, sy, p.color);
            Object.assign(p, makeDrop(true));
            hit = true;
          }
        }

        if(!hit){
          for(var r = 0; r < rects.length; r++){
            var rc = rects[r];
            if(p.y >= rc.top && p.py < rc.top && p.x >= rc.left && p.x <= rc.right){
              makeSplash(p.x, rc.top, p.color);
              Object.assign(p, makeDrop(true));
              hit = true;
              break;
            }
          }
        }

        if(!hit && p.y > H - 10){
          makeSplash(p.x, H - 10, p.color);
          Object.assign(p, makeDrop(true));
          hit = true;
        }

        if(!hit){
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.w;
          ctx.lineCap = 'round';
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - wind * (p.l / 16), p.y - p.l);
          ctx.stroke();
        }
      }

      for(var j = splashes.length - 1; j >= 0; j--){
        var s = splashes[j];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.2;
        s.life -= 0.04;

        if(s.life <= 0){
          splashes.splice(j, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, s.life);
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      drawUmbrella();

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  };

  /* ---------------------------------------------------------------- petals (source #footerParticles script) */
  window.dsPetals = function (section, canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (reduced) return;

    let w, h;
    let particles = [];
    let isVisible = false;

    const config = {
      count: 35,
      gravity: 0.8,
      wind: 1.2,
      colors: ['#FFB7C5', '#FFC1CC', '#FFD1DC', '#FDB0C0']
    };

    function resize() {
      w = section.offsetWidth;
      h = section.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function createPetal(respawn = false) {
      return {
        x: Math.random() * w,
        y: respawn ? -20 : Math.random() * h,
        size: Math.random() * 8 + 6,
        vx: Math.random() * 0.5 + config.wind,
        vy: Math.random() * 0.5 + config.gravity,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        color: config.colors[Math.floor(Math.random() * config.colors.length)]
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: config.count }, () => createPetal(false));
    }

    window.addEventListener('resize', resize);

    const io = new IntersectionObserver(entries => {
      isVisible = entries[0].isIntersecting;
      /* catalog: the ground may have been measured while hidden (display:none → 0×0) */
      if (isVisible && (w !== section.offsetWidth || h !== section.offsetHeight)) { var fresh = !w; resize(); if (fresh) particles = Array.from({ length: config.count }, () => createPetal(false)); }
      if (isVisible) requestAnimationFrame(tick);
    }, { threshold: 0 });
    io.observe(section);

    init();

    function tick() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx + Math.sin(p.sway) * 1.5;
        p.y += p.vy;
        p.angle += p.rotSpeed;
        p.sway += p.swaySpeed;

        if (p.y > h + 30 || p.x > w + 30) {
          Object.assign(p, createPetal(true));
          p.x = Math.random() * w;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(p.size, -p.size, p.size, 0);
        ctx.quadraticCurveTo(p.size, p.size, 0, 0);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(tick);
    }
  };
})();
