(() => {
  'use strict';
  const frame = document.getElementById('prototype-frame');
  const screen = document.getElementById('screen-window');
  const area = document.getElementById('viewer-area');
  const scaleLabel = document.getElementById('viewer-scale');
  const fullscreenButton = document.getElementById('fullscreen-button');
  const buttons = [...document.querySelectorAll('[data-scene]')];
  const targetOrigin = location.origin === 'null' ? '*' : location.origin;
  function fit() {
    const bounds = area.getBoundingClientRect();
    const standHeight = window.innerWidth <= 560 ? 24 : 30;
    const scale = Math.max(.05, Math.min(1, (bounds.width - 20) / 1920, (bounds.height - standHeight - 28) / 1080));
    screen.style.width = `${1920 * scale}px`;
    screen.style.height = `${1080 * scale}px`;
    frame.style.transform = `scale(${scale})`;
    scaleLabel.textContent = `${Math.round(scale * 100)}%`;
    document.body.dataset.previewScale = scale.toFixed(4);
  }
  function navigate(target) {
    frame.contentWindow.postMessage({ type: 'prototype:navigate', target }, targetOrigin);
  }
  buttons.forEach(button => button.addEventListener('click', () => navigate(button.dataset.scene)));
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.data?.type !== 'prototype:state') return;
    const y = event.data.scroll;
    if (!Number.isFinite(y)) return;
    const active = y < 80 ? 'top' : y < 400 ? 'early' : y < 700 ? 'middle' : 'about';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === active)));
    document.body.dataset.sceneScroll = String(y);
  });
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreenButton.title = 'Полноэкранный режим недоступен в этом браузере';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-label', active ? 'Выйти из полноэкранного режима' : 'На весь экран');
    fullscreenButton.title = active ? 'Выйти из полноэкранного режима' : 'На весь экран';
    fit();
  });
  if (!document.documentElement.requestFullscreen) fullscreenButton.hidden = true;
  window.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(area);
  frame.addEventListener('load', fit);
  fit();
})();
