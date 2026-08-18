(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var interactive = finePointer && !prefersReduced;

  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navPanel = document.getElementById('navPanel');

  function closePanel() {
    navPanel.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
  }

  if (navToggle && navPanel) {
    navToggle.addEventListener('click', function () {
      var open = navPanel.hidden;
      navPanel.hidden = !open;
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    navPanel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closePanel);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !navPanel.hidden) closePanel();
    });
  }

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveals direccionales: las direcciones up|left|right|scale se resuelven
     en CSS mediante [data-reveal="..."]. Aquí solo se activa el estado .in. */
  var reveals = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReduced) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute('data-delay'), 10);
            entry.target.style.transitionDelay = isNaN(delay) ? '0ms' : delay + 'ms';
            entry.target.classList.add('in');
            /* Limpia el delay inline para que hovers posteriores no lo hereden */
            setTimeout(function () {
              entry.target.style.transitionDelay = '';
            }, (isNaN(delay) ? 0 : delay) + 900);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add('in');
    });
  }

  /* ===== 1. Shimmer de imágenes lazy: marca el wrapper cuando está todo listo ===== */
  function markImgReady(img) {
    var wrap = img.closest('.cat-img, .car-img, .about-photo, .loc-photos');
    if (!wrap) return;
    var imgs = wrap.querySelectorAll('img');
    var ready = true;
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) { ready = false; break; }
    }
    if (ready) wrap.classList.add('loaded');
  }

  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete) {
      markImgReady(img);
    } else {
      img.addEventListener('load', function () { markImgReady(img); });
      img.addEventListener('error', function () { markImgReady(img); });
    }
  });

  /* ===== 2. Parallax del hero (desktop, respeta reduced-motion) ===== */
  var hero = document.getElementById('inicio');

  if (hero && interactive) {
    var layers = hero.querySelectorAll('.hv-main img, .hv-float');
    var strengths = [12, 18, 26, 20, 30];

    function setParallax(nx, ny) {
      layers.forEach(function (el, i) {
        var s = strengths[i % strengths.length] || 16;
        el.style.setProperty('--pfx', (nx * s).toFixed(2) + 'px');
        el.style.setProperty('--pfy', (ny * s).toFixed(2) + 'px');
      });
    }

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      setParallax(
        (e.clientX - r.left) / r.width - 0.5,
        (e.clientY - r.top) / r.height - 0.5
      );
    });

    hero.addEventListener('mouseleave', function () { setParallax(0, 0); });
  }

  /* ===== 3. Botones magnéticos + ripple (desktop) ===== */
  var magBtns = document.querySelectorAll('.btn-cat, .btn-wa');

  if (interactive) {
    magBtns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.setProperty('--mx', (dx * 5).toFixed(2) + 'px');
        btn.style.setProperty('--my', (dy * 5).toFixed(2) + 'px');
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* Ripple en botones, tarjetas de contacto y flechas del carrusel.
     Funciona con ratón y con dedo (pointerdown), respetando reduced-motion. */
  if (!prefersReduced) {
    document.addEventListener('pointerdown', function (e) {
      var target = e.target.closest ? e.target.closest('.btn, .contact-card, .car-btn') : null;
      if (!target) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var r = target.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2.2;
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = d + 'px';
      span.style.left = (e.clientX - r.left - d / 2) + 'px';
      span.style.top = (e.clientY - r.top - d / 2) + 'px';
      target.appendChild(span);
      setTimeout(function () {
        if (span.parentNode) span.parentNode.removeChild(span);
      }, 500);
    });
  }

  /* ===== 4. Tilt 3D de cards + glow que sigue al cursor ===== */
  var tiltCards = document.querySelectorAll('.cat-card, .car-card');

  if (interactive) {
    tiltCards.forEach(function (card) {
      var imgWrap = card.querySelector('.cat-img, .car-img');

      card.addEventListener('mouseenter', function () {
        if (imgWrap) imgWrap.classList.add('tilting');
      });

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var px = (e.clientX - cx) / (r.width / 2);
        var py = (e.clientY - cy) / (r.height / 2);
        if (imgWrap) {
          imgWrap.style.setProperty('--rx', (py * -6).toFixed(2) + 'deg');
          imgWrap.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
        }
        card.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
        card.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
      });

      card.addEventListener('mouseleave', function () {
        if (imgWrap) {
          imgWrap.classList.remove('tilting');
          imgWrap.style.setProperty('--rx', '0deg');
          imgWrap.style.setProperty('--ry', '0deg');
        }
        card.style.setProperty('--gx', '50%');
        card.style.setProperty('--gy', '60%');
      });
    });
  }

  /* ===== 5. Marquee: velocidad ligada al scroll de página, con deceleración ===== */
  var track = document.querySelector('.marquee-track');

  if (track && !prefersReduced && 'IntersectionObserver' in window) {
    var pos = 0;
    var extra = 0;
    var lastScroll = window.scrollY;
    var running = false;
    var lastTime = 0;
    var halfWidth = 0;

    track.style.animation = 'none';

    function measure() {
      halfWidth = track.scrollWidth / 2 || 1;
    }

    measure();
    window.addEventListener('resize', measure);

    window.addEventListener('scroll', function () {
      var d = Math.abs(window.scrollY - lastScroll);
      extra = Math.min(extra + d * 0.004, 1.5);
      lastScroll = window.scrollY;
    }, { passive: true });

    var marqueeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        running = entry.isIntersecting;
        if (running) lastTime = 0;
      });
    }, { rootMargin: '120px 0px' });

    marqueeIO.observe(track);

    function frame(now) {
      if (running) {
        if (!lastTime) lastTime = now;
        var dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        if (dt > 0) {
          pos += (34 + extra * 70) * dt;
          pos %= halfWidth;
          track.style.transform = 'translate3d(' + (-pos).toFixed(2) + 'px, 0, 0)';
        }
        extra *= 0.94; /* deceleración suave al soltar el scroll */
      } else {
        lastTime = 0;
      }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ===== 6. Carrusel (sin cambios de comportamiento) ===== */
  var carousel = document.getElementById('carousel');
  var carPrev = document.getElementById('carPrev');
  var carNext = document.getElementById('carNext');

  function scrollCarousel(dir) {
    if (!carousel) return;
    var card = carousel.querySelector('.car-card');
    if (!card) return;
    var width = card.getBoundingClientRect().width + 18;
    carousel.scrollBy({ left: dir * width, behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  if (carPrev && carousel) {
    carPrev.addEventListener('click', function () {
      scrollCarousel(-1);
    });
  }

  if (carNext && carousel) {
    carNext.addEventListener('click', function () {
      scrollCarousel(1);
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ===== 7. Scrollspy: resalta la sección activa en el menú ===== */
  var spyLinks = navPanel
    ? Array.prototype.slice.call(navPanel.querySelectorAll('a[href^="#"]'))
    : [];
  var spySections = spyLinks
    .map(function (a) {
      var el = document.querySelector(a.getAttribute('href'));
      return el && el.id ? el : null;
    })
    .filter(Boolean);

  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spyIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          spyLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    spySections.forEach(function (s) {
      spyIO.observe(s);
    });
  }
})();