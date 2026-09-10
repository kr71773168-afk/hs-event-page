/* =========================================================================
   Håndværkerskolen – event landing page
   Replaces the Webflow runtime (interactions + embeds) with plain JS.
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Modal (agencyflow form) – opened by every CTA, closed by overlay    */
  /* ------------------------------------------------------------------ */
  function initModal() {
    var modal = document.querySelector('.modal1_component-2.new');
    if (!modal) return;
    var overlay = modal.querySelector('.modal1_background-overlay-2');

    function open(e) {
      if (e) e.preventDefault();
      modal.style.display = 'flex';
      document.documentElement.classList.add('modal-open');
    }
    function close() {
      modal.style.display = 'none';
      document.documentElement.classList.remove('modal-open');
    }

    document.querySelectorAll('.div-block-194.cta-beam').forEach(function (cta) {
      cta.addEventListener('click', open);
    });
    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.style.display === 'flex') close();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Countdown (sticky bar)                                              */
  /* ------------------------------------------------------------------ */
  function initCountdown() {
    var second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24;
    var targetDate = new Date(2026, 8, 28, 19, 0, 0).getTime(); // 28. september 2026 kl. 19:00
    var pad = function (num) { return String(num).padStart(2, '0'); };

    var daysEl = document.getElementById('days');
    var hoursEl = document.getElementById('hours');
    var minutesEl = document.getElementById('minutes');
    var secondsEl = document.getElementById('seconds');
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    var timerId;
    var update = function () {
      var distance = targetDate - Date.now();
      if (distance <= 0) { distance = 0; clearInterval(timerId); }
      daysEl.textContent = pad(Math.floor(distance / day));
      hoursEl.textContent = pad(Math.floor((distance % day) / hour));
      minutesEl.textContent = pad(Math.floor((distance % hour) / minute));
      secondsEl.textContent = pad(Math.floor((distance % minute) / second));
    };
    update();
    timerId = setInterval(update, 1000);
  }

  /* ------------------------------------------------------------------ */
  /* Media logo marquee                                                  */
  /* ------------------------------------------------------------------ */
  function initMarquee() {
    document.querySelectorAll('[marquee]').forEach(function (el, i) {
      var s = el.getAttribute('marquee-speed') || 1145,
          d = el.getAttribute('marquee-direction') || 'right',
          from = d === 'right' ? 'translateX(-100%)' : 'translateX(0)',
          to = d === 'right' ? 'translateX(0)' : 'translateX(-100%)';
      el.setAttribute('marquee', i);
      var c = el.cloneNode(true);
      c.setAttribute('marquee', i);
      c.removeAttribute('id');
      el.parentNode.appendChild(c);
      var style = document.createElement('style');
      style.textContent = '@keyframes m' + i + '{0%{transform:' + from + '}100%{transform:' + to + '}}[marquee="' + i + '"]{animation:m' + i + ' ' + s + 's linear infinite}';
      document.head.appendChild(style);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Animated "beam" border on CTA buttons                               */
  /* ------------------------------------------------------------------ */
  function initBeam() {
    var NS = 'http://www.w3.org/2000/svg';
    function pxToNumber(v) { var n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

    function buildSVG(el, idx) {
      var old = el.querySelector(':scope > svg.cta-beam-svg');
      if (old) old.remove();
      var cs = getComputedStyle(el);
      var rect = el.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      var r = pxToNumber(cs.borderTopLeftRadius);
      if (!r) r = h / 2;
      r = Math.min(r, h / 2);
      var stroke = Math.max(2, Math.round(h * 0.04));
      var gradId = 'beamGrad-' + idx, glowId = 'beamGlow-' + idx;

      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'cta-beam-svg');
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');

      var defs = document.createElementNS(NS, 'defs');
      var grad = document.createElementNS(NS, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
      [{ o: '0%', c: '#ffffff', a: '0' }, { o: '25%', c: '#ee6d1a', a: '1' }, { o: '65%', c: '#ee6d1a', a: '1' }, { o: '100%', c: '#ffffff', a: '0' }]
        .forEach(function (s) {
          var st = document.createElementNS(NS, 'stop');
          st.setAttribute('offset', s.o); st.setAttribute('stop-color', s.c); st.setAttribute('stop-opacity', s.a);
          grad.appendChild(st);
        });
      var filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', glowId);
      filter.setAttribute('x', '-60%'); filter.setAttribute('y', '-60%');
      filter.setAttribute('width', '220%'); filter.setAttribute('height', '220%');
      var blur = document.createElementNS(NS, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '2.2'); blur.setAttribute('result', 'b');
      var merge = document.createElementNS(NS, 'feMerge');
      var m1 = document.createElementNS(NS, 'feMergeNode'); m1.setAttribute('in', 'b');
      var m2 = document.createElementNS(NS, 'feMergeNode'); m2.setAttribute('in', 'SourceGraphic');
      merge.appendChild(m1); merge.appendChild(m2);
      filter.appendChild(blur); filter.appendChild(merge);
      defs.appendChild(grad); defs.appendChild(filter);
      svg.appendChild(defs);

      var rr = document.createElementNS(NS, 'rect');
      rr.setAttribute('x', 0); rr.setAttribute('y', 0);
      rr.setAttribute('width', w); rr.setAttribute('height', h);
      rr.setAttribute('rx', r); rr.setAttribute('ry', r);
      rr.setAttribute('fill', 'none');
      rr.setAttribute('stroke', 'url(#' + gradId + ')');
      rr.setAttribute('stroke-width', stroke);
      rr.setAttribute('stroke-linecap', 'round');
      rr.setAttribute('filter', 'url(#' + glowId + ')');
      rr.setAttribute('pathLength', '100');
      rr.setAttribute('stroke-dasharray', '16 84');
      var anim = document.createElementNS(NS, 'animate');
      anim.setAttribute('attributeName', 'stroke-dashoffset');
      anim.setAttribute('from', '0'); anim.setAttribute('to', '-100');
      anim.setAttribute('dur', '3.5s'); anim.setAttribute('repeatCount', 'indefinite');
      rr.appendChild(anim);
      svg.appendChild(rr);
      el.insertBefore(svg, el.firstChild);
    }

    Array.from(document.querySelectorAll('.cta-beam')).forEach(function (el, i) {
      buildSVG(el, i);
      new ResizeObserver(function () { buildSVG(el, i); }).observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tape measure that follows the scroll (HVORFOR SKAL DU LYTTE TIL OS) */
  /* ------------------------------------------------------------------ */
  function initTape() {
    document.querySelectorAll('.craft-tape').forEach(function (tape) {
      if (tape.dataset.ready) return;
      var section = tape.closest('.tape-section');
      if (!section) return;
      tape.dataset.ready = 'true';
      var blade = tape.querySelector('.craft-tape__blade');
      var numbers = tape.querySelector('.craft-tape__numbers');
      var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
      var pending = false;
      var count = -1;
      function draw() {
        pending = false;
        var bounds = tape.getBoundingClientRect();
        var stop = parseFloat(getComputedStyle(section).getPropertyValue('--tape-stop')) || 0;
        var limit = Math.max(0, tape.clientHeight - 78);
        var travel = reduceMotion.matches ? 0 : Math.min(limit, Math.max(0, stop - bounds.top));
        tape.style.setProperty('--tape-travel', travel + 'px');
        var nextCount = Math.ceil(blade.clientHeight / 30);
        if (nextCount !== count) {
          count = nextCount;
          numbers.replaceChildren();
          var fragment = document.createDocumentFragment();
          for (var i = 1; i <= count; i++) {
            var label = document.createElement('span');
            label.textContent = i % 10;
            fragment.appendChild(label);
          }
          numbers.appendChild(fragment);
        }
      }
      function schedule() { if (!pending) { pending = true; requestAnimationFrame(draw); } }
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      reduceMotion.addEventListener('change', schedule);
      var observer = new ResizeObserver(schedule);
      observer.observe(section);
      observer.observe(tape);
      draw();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Interview videos – thumbnail first, YouTube iframe only on click    */
  /* ------------------------------------------------------------------ */
  function initVideos() {
    var active = null;
    function stop(card) {
      var f = card.querySelector('iframe');
      if (f) f.remove();
      card.classList.remove('is-playing');
    }
    document.querySelectorAll('.video-card[data-yt]').forEach(function (card) {
      card.addEventListener('click', function () {
        if (card.classList.contains('is-playing')) return;
        if (active) stop(active);
        var id = card.getAttribute('data-yt');
        var thumb = card.querySelector('.video-card__thumb');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1';
        iframe.title = thumb ? thumb.alt : 'Interview';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        card.appendChild(iframe);
        card.classList.add('is-playing');
        active = card;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Meta Pixel (PageView) – same pixel as the Webflow site              */
  /* ------------------------------------------------------------------ */
  function initPixel() {
    var PIXEL_ID = '1475358500068619';
    if (!window.fbq) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    try { fbq('init', PIXEL_ID); fbq('trackSingle', PIXEL_ID, 'PageView'); } catch (e) {}
  }

  function init() {
    initModal();
    initCountdown();
    initMarquee();
    initBeam();
    initTape();
    initVideos();
    initPixel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
