document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.index-card')) {
    document.body.classList.add('page-home');
  }

  initCursorMotion();
  initRevealMotion();
  initWalineMarkdownPreview();
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
  var mobileViewport = window.matchMedia('(max-width: 991.98px)').matches;
  if (reducedMotion) {
    return;
  }

  // Avoid content flash/hidden issues on mobile and embedded webviews.
  if (mobileViewport) {
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

  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (element) {
      element.classList.add('is-visible');
    });
    return;
  }

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

function initWalineMarkdownPreview() {
  var walineRoot = document.getElementById('waline');
  if (!walineRoot) {
    return;
  }

  var observer = new MutationObserver(function () {
    mountWalinePreview(walineRoot);
  });

  observer.observe(walineRoot, {
    childList: true,
    subtree: true
  });

  mountWalinePreview(walineRoot);
}

function mountWalinePreview(walineRoot) {
  var editor = walineRoot.querySelector('.wl-editor');
  if (!editor || walineRoot.querySelector('.wl-md-preview-btn')) {
    return;
  }

  var actionBar = walineRoot.querySelector('.wl-action');
  if (!actionBar) {
    actionBar = document.createElement('div');
    actionBar.className = 'wl-action';
    editor.insertAdjacentElement('afterend', actionBar);
  }

  var previewBtn = document.createElement('button');
  previewBtn.type = 'button';
  previewBtn.className = 'wl-action-item wl-md-preview-btn';
  previewBtn.textContent = 'MD 预览';
  actionBar.appendChild(previewBtn);

  var previewPanel = document.createElement('div');
  previewPanel.className = 'wl-md-preview-panel';
  previewPanel.innerHTML =
    '<div class="wl-md-preview-title">Markdown 预览</div>' +
    '<div class="wl-md-preview-body">预览内容会显示在这里</div>';
  actionBar.insertAdjacentElement('afterend', previewPanel);

  var previewBody = previewPanel.querySelector('.wl-md-preview-body');

  function renderPreview() {
    var content = editor.value || '';
    if (!content.trim()) {
      previewBody.innerHTML = '预览内容会显示在这里';
      return;
    }

    renderMarkdown(content).then(function (html) {
      previewBody.innerHTML = html;
    });
  }

  previewBtn.addEventListener('click', function () {
    previewPanel.classList.toggle('is-visible');
    previewBtn.classList.toggle('is-active');
    renderPreview();
  });

  editor.addEventListener('input', function () {
    if (previewPanel.classList.contains('is-visible')) {
      renderPreview();
    }
  });
}

var markedLoaderPromise = null;

function loadMarked() {
  if (window.marked && typeof window.marked.parse === 'function') {
    return Promise.resolve(window.marked);
  }

  if (markedLoaderPromise) {
    return markedLoaderPromise;
  }

  markedLoaderPromise = new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.async = true;
    script.onload = function () {
      if (window.marked && typeof window.marked.parse === 'function') {
        resolve(window.marked);
      } else {
        reject(new Error('marked loaded but unavailable'));
      }
    };
    script.onerror = function () {
      reject(new Error('failed to load marked'));
    };
    document.head.appendChild(script);
  });

  return markedLoaderPromise;
}

function renderMarkdown(text) {
  return loadMarked()
    .then(function (marked) {
      return marked.parse(text);
    })
    .catch(function () {
      return fallbackMarkdownRender(text);
    });
}

function fallbackMarkdownRender(text) {
  var escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  escaped = escaped.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  escaped = escaped.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  escaped = escaped.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  escaped = escaped.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  escaped = escaped.replace(/`([^`]+)`/gim, '<code>$1</code>');
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}
