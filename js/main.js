(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  var reveals = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && !prefersReduced) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute('data-delay'), 10);
            entry.target.style.transitionDelay = isNaN(delay) ? '0ms' : delay + 'ms';
            entry.target.classList.add('in');
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
})();