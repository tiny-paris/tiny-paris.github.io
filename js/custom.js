document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.index-card')) {
    document.body.classList.add('page-home');
  }

  initCursorMotion();
  initRevealMotion();
});

function initCursorMotion() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  if (reducedMotion || !finePointer) {
    return;
  }

  var dot = document.createElement('div');
  var ring = document.createElement('div');

  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';

  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('motion-enabled');

  var mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  var ringPos = {
    x: mouse.x,
    y: mouse.y
  };

  function updateCursor() {
    ringPos.x += (mouse.x - ringPos.x) * 0.28;
    ringPos.y += (mouse.y - ringPos.y) * 0.28;

    dot.style.transform = 'translate3d(' + mouse.x + 'px, ' + mouse.y + 'px, 0) translate(-50%, -50%)';
    ring.style.transform = 'translate3d(' + ringPos.x + 'px, ' + ringPos.y + 'px, 0) translate(-50%, -50%)';

    window.requestAnimationFrame(updateCursor);
  }

  var hoverSelector = 'a, button, input, textarea, select, summary, .nav-link, .index-card, .links .card, .post-content img';

  window.addEventListener('mousemove', function (event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    document.body.classList.add('cursor-active');

    var hoverTarget = event.target.closest(hoverSelector);
    document.body.classList.toggle('cursor-hover', Boolean(hoverTarget));
  }, { passive: true });

  window.addEventListener('mouseout', function () {
    document.body.classList.remove('cursor-active');
    document.body.classList.remove('cursor-hover');
  }, { passive: true });

  updateCursor();
}

function initRevealMotion() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    return;
  }

  var selectors = [
    '.index-card',
    '#board',
    '.post-content > *',
    '.links .card',
    '.about-content',
    '.tagcloud',
    '.archive',
    '.category-list',
    '.post-prevnext',
    '#comments'
  ];

  var elements = [];

  selectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (element) {
      if (!elements.includes(element)) {
        elements.push(element);
      }
    });
  });

  elements.forEach(function (element, index) {
    element.classList.add('motion-fade');
    element.style.setProperty('--motion-delay', Math.min(index * 45, 320) + 'ms');
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px'
  });

  elements.forEach(function (element) {
    observer.observe(element);
  });
}
