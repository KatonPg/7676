(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const stage = $('#stage'), space = $('#scroll-space'), hero = $('#hero'), title = $('#hero-title');
  const content = $('#content'), filter = $('#filter'), header = $('#site-header'), pageMenu = $('#page-menu-wrap');
  const dialog = $('#dialog'), dialogBody = $('#dialog-body');
  const state = { rooms: new Set(), price: [13, 71.5], area: [19, 165], finish: 'Любая', delivery: 'Любой', gallery: 2 };
  const photos = ['3e19d.png', 'b51b7.png'];
  // Figma defines five gallery positions but supplies two source photographs.
  // This bounded prototype cycles only the supplied photographs.
  let galleryMoved = false, scale = 1, viewportHeight = 1080, framePending = false, toastTimeout;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  const fmt = n => Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  const interpolate = (y, a, b, c) => y <= 159 ? mix(a, b, clamp(y / 159)) : mix(b, c, clamp((y - 159) / 443));

  const heroVideo = $('#hero-video');
  // Keep autoplay silent in browsers that restore media element preferences.
  heroVideo.defaultMuted = true;
  heroVideo.muted = true;
  function playHeroVideo() {
    const playback = heroVideo.play();
    if (playback) playback.catch(() => {});
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) playHeroVideo();
  });
  playHeroVideo();

  function resize() {
    scale = Math.min(window.innerWidth / 1920, 1);
    viewportHeight = window.innerHeight / scale;
    stage.style.transform = `scale(${scale})`;
    stage.style.left = `${Math.max(0, (window.innerWidth - 1920 * scale) / 2)}px`;
    stage.style.height = `${viewportHeight}px`;
    const expandedHeight = $('#more-copy').hidden ? 0 : $('#more-copy').offsetHeight + 24;
    space.style.height = `${(viewportHeight + 1011 + expandedHeight) * scale}px`;
    hero.style.height = `${viewportHeight - 112}px`;
    $('.hero-media').style.height = `${viewportHeight - 130}px`;
    paint();
  }

  function paint() {
    framePending = false;
    const y = window.scrollY / scale;
    const deltaHeight = viewportHeight - 1080;
    const filterStart = 823 + deltaHeight, contentStart = 959 + deltaHeight;
    const dockingAt = filterStart - 123;
    const dockProgress = clamp((y - dockingAt + 80) / 80);
    const ease = dockProgress * dockProgress * (3 - 2 * dockProgress);
    const white = clamp(y / 80);
    hero.style.transform = `translateY(${-interpolate(y, 0, 136, 579) - Math.max(0, y - 602)}px)`;
    title.style.transform = `translateY(${-y}px)`;
    content.style.transform = `translateY(${-y}px)`;
    content.style.top = `${contentStart}px`;
    filter.style.top = `${Math.max(123, filterStart - y)}px`;
    filter.style.left = `${mix(72, 0, ease)}px`;
    filter.style.width = `${mix(1776, 1920, ease)}px`;
    filter.style.height = `${mix(88, 81, ease)}px`;
    filter.style.padding = `${mix(20, 16, ease)}px 20px`;
    filter.style.borderRadius = `${64 * (1 - ease)}px`;
    filter.classList.toggle('docked', y >= dockingAt);
    header.style.setProperty('--header-white', white.toFixed(3));
    header.classList.toggle('is-white', y > 40);
    const finalProgress = clamp((y - 602) / 357);
    $('.airport-final').style.opacity = finalProgress;
    $('#about').style.paddingTop = `${100 - 13 * finalProgress}px`;
    pageMenu.classList.toggle('visible', y >= dockingAt + 80);
    pageMenu.inert = y < dockingAt + 80;
    stage.dataset.scrollState = y < 80 ? 'start' : y < 400 ? 'scroll' : y < dockingAt ? 'project' : 'docked';
    stage.dataset.scrollPosition = Math.round(y);
    if (window.parent !== window) window.parent.postMessage({ type: 'prototype:state', scroll: Math.round(y), state: stage.dataset.scrollState }, location.origin === 'null' ? '*' : location.origin);
  }

  function requestPaint() {
    if (!framePending) { framePending = true; requestAnimationFrame(paint); }
  }
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('resize', resize);

  function jump(where) {
    closePopovers();
    const deltaHeight = viewportHeight - 1080;
    const destinations = { top: 0, early: 159, middle: 602, about: 959 };
    window.scrollTo({ top: Math.max(0, ((destinations[where] || 0) + (where === 'top' ? 0 : deltaHeight))) * scale, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.hidden = true, 2600);
  }

  function count() {
    if (!state.rooms.size && state.price[0] === 13 && state.price[1] === 71.5 && state.area[0] === 19 && state.area[1] === 165 && state.finish === 'Любая' && state.delivery === 'Любой') return 2323;
    const roomRatio = !state.rooms.size ? 1 : state.rooms.size / 5;
    const priceRatio = (state.price[1] - state.price[0]) / 58.5;
    const areaRatio = (state.area[1] - state.area[0]) / 146;
    return Math.round(2323 * roomRatio * priceRatio * areaRatio * (state.finish === 'Любая' ? 1 : .64) * (state.delivery === 'Любой' ? 1 : .7));
  }
  function apartmentWord(n) { const a = n % 100, b = n % 10; return a >= 11 && a <= 14 ? 'квартир' : b === 1 ? 'квартиру' : b >= 2 && b <= 4 ? 'квартиры' : 'квартир'; }
  function updateCount() { const n = count(); $('#results-button').textContent = `Смотреть ${fmt(n)} ${apartmentWord(n)}`; }

  $$('.room-chips .chip').forEach(button => button.addEventListener('click', () => {
    const room = button.dataset.room;
    if (state.rooms.has(room)) state.rooms.delete(room); else state.rooms.add(room);
    button.setAttribute('aria-pressed', String(state.rooms.has(room)));
    updateCount();
  }));

  $$('.range-field').forEach(field => {
    const key = field.dataset.range;
    const numberInputs = $$('.number-fields input', field);
    const sliders = $$('.dual-range input', field);
    const min = Number(sliders[0].min), max = Number(sliders[1].max);
    function sync(index, raw) {
      let v = Number(raw);
      if (!Number.isFinite(v)) return;
      v = clamp(v, min, max);
      v = index === 0 ? Math.min(v, state[key][1]) : Math.max(v, state[key][0]);
      state[key][index] = v;
      [...numberInputs, ...sliders].forEach((input, i) => input.value = state[key][i % 2]);
      const start = 100 * (state[key][0] - min) / (max - min), end = 100 * (state[key][1] - min) / (max - min);
      $('.range-track', field).style.background = `linear-gradient(to right,var(--outline) ${start}%,var(--red) ${start}%,var(--red) ${end}%,var(--outline) ${end}%)`;
      sliders[0].style.zIndex = state[key][0] > (min + max) / 2 ? 2 : 0;
      updateCount();
    }
    sliders.forEach((input, i) => input.addEventListener('input', () => sync(i, input.value)));
    numberInputs.forEach((input, i) => input.addEventListener('input', () => {
      if (input.value === '') return;
      const value = Number(input.value);
      if (Number.isFinite(value) && value >= min && value <= max && (i === 0 ? value <= state[key][1] : value >= state[key][0])) sync(i, value);
    }));
    numberInputs.forEach((input, i) => input.addEventListener('change', () => sync(i, input.value)));
    numberInputs.forEach(input => input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); input.blur(); } }));
  });

  function openDialog(html, photo = false) {
    closePopovers();
    dialog.classList.toggle('photo-dialog', photo);
    dialogBody.innerHTML = html;
    const heading = dialogBody.querySelector('h2');
    if (heading) { heading.id = 'dialog-title'; dialog.setAttribute('aria-labelledby', 'dialog-title'); }
    else { dialog.removeAttribute('aria-labelledby'); dialog.setAttribute('aria-label', 'Фотография проекта'); }
    dialog.showModal();
  }
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });

  function showResults() {
    const n = count();
    openDialog(`<h2 class="dialog-title">${fmt(n)} ${apartmentWord(n)}</h2><p class="dialog-lead">Выбранные параметры поиска</p><dl class="summary-list"><div><dt>Комнаты</dt><dd>${state.rooms.size ? [...state.rooms].join(', ') : 'Любые'}</dd></div><div><dt>Стоимость</dt><dd>${fmt(state.price[0])} – ${fmt(state.price[1])} млн ₽</dd></div><div><dt>Площадь</dt><dd>${fmt(state.area[0])} – ${fmt(state.area[1])} м²</dd></div><div><dt>Отделка</dt><dd>${state.finish}</dd></div><div><dt>Выдача ключей</dt><dd>${state.delivery}</dd></div></dl><p class="demo-note">Демонстрационный результат прототипа. Количество меняется для проверки взаимодействия; подключение к каталогу квартир не предусмотрено макетом.</p><div class="dialog-actions"><button class="pill primary" id="back-to-filter">Вернуться к подбору</button></div>`);
    $('#back-to-filter').addEventListener('click', () => dialog.close());
  }
  filter.addEventListener('submit', event => { event.preventDefault(); showResults(); });
  $('#all-filters').addEventListener('click', () => {
    openDialog(`<h2 class="dialog-title">Все фильтры</h2><p class="dialog-lead">Дополнительные параметры подбора квартиры</p><div class="dialog-fields"><label class="dialog-field">Отделка<select id="finish"><option>Любая</option><option>С отделкой</option><option>Без отделки</option></select></label><label class="dialog-field">Выдача ключей<select id="delivery"><option>Любой</option><option>2026</option><option>2027</option><option>2028</option></select></label></div><p class="demo-note">Демонстрационное окно: дополнительный экран фильтров отсутствует в исходном макете.</p><div class="dialog-actions"><button class="pill" id="reset-filters">Сбросить</button><button class="pill primary" id="apply-filters">Применить</button></div>`);
    $('#finish').value = state.finish; $('#delivery').value = state.delivery;
    $('#apply-filters').addEventListener('click', () => { state.finish = $('#finish').value; state.delivery = $('#delivery').value; updateCount(); dialog.close(); });
    $('#reset-filters').addEventListener('click', () => {
      state.rooms.clear(); state.price = [13, 71.5]; state.area = [19, 165]; state.finish = 'Любая'; state.delivery = 'Любой';
      $$('.room-chips .chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
      $$('.range-field').forEach(field => { const key = field.dataset.range; $$('.number-fields input', field).forEach((input, i) => { input.value = state[key][i]; input.dispatchEvent(new Event('change')); }); });
      updateCount(); dialog.close(); toast('Параметры подбора сброшены');
    });
  });

  $('#read-more').addEventListener('click', () => {
    const button = $('#read-more'), more = $('#more-copy'), open = more.hidden;
    more.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.firstChild.textContent = open ? 'Свернуть ' : 'Читать ещё ';
    resize();
  });
  $('#favorite').addEventListener('click', () => {
    const button = $('#favorite'), added = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(added)); button.setAttribute('aria-label', added ? 'Удалить проект из избранного' : 'Добавить проект в избранное');
    toast(added ? 'Проект добавлен в избранное' : 'Проект удалён из избранного');
  });

  function changePhoto(direction) {
    if (!galleryMoved) { state.gallery = direction > 0 ? 0 : 1; galleryMoved = true; }
    else state.gallery = (state.gallery + direction + photos.length) % photos.length;
    $('#gallery-image').src = `assets/${photos[state.gallery]}`;
    $('#gallery-count').textContent = `${state.gallery + 1} / ${photos.length}`;
    $('#pagination').title = 'В макете доступны два исходных фото';
  }
  $('#gallery-prev').addEventListener('click', () => changePhoto(-1));
  $('#gallery-next').addEventListener('click', () => changePhoto(1));
  $('#gallery-expand').addEventListener('click', () => openDialog(`<img src="${$('#gallery-image').getAttribute('src')}" alt="Фотография проекта Скандинавия">`, true));

  function closePopovers() {
    $('#header-popover').hidden = true; $('#page-popover').hidden = true;
    [$('#property-button'), $('#menu-button'), $('#page-menu-button')].forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  function headerPopover(button, html, right = false) {
    const pop = $('#header-popover'), wasOpen = !pop.hidden && button.getAttribute('aria-expanded') === 'true';
    closePopovers();
    if (wasOpen) return;
    pop.innerHTML = html; pop.hidden = false; pop.style.left = right ? 'auto' : button.id === 'location-button' ? '336px' : '72px'; pop.style.right = right ? '20px' : 'auto'; button.setAttribute('aria-expanded', 'true');
  }
  $('#property-button').addEventListener('click', () => headerPopover($('#property-button'), '<button data-property="Жилая недвижимость">Жилая недвижимость</button><button data-property="Коммерческая недвижимость">Коммерческая недвижимость</button>'));
  $('#location-button').addEventListener('click', () => headerPopover($('#location-button'), '<button data-city="Москва">Москва</button><button data-city="Санкт-Петербург">Санкт-Петербург</button>'));
  $('#menu-button').addEventListener('click', () => headerPopover($('#menu-button'), '<button data-jump="top">Первый экран</button><button data-jump="about">О проекте</button><button data-action="results">Выбрать квартиру</button><button data-info="Контакты">Контакты</button>', true));
  $('#page-menu-button').addEventListener('click', () => { const open = $('#page-popover').hidden; closePopovers(); $('#page-popover').hidden = !open; $('#page-menu-button').setAttribute('aria-expanded', String(open)); });

  document.addEventListener('click', event => {
    const jumpButton = event.target.closest('[data-jump]'); if (jumpButton) jump(jumpButton.dataset.jump);
    const action = event.target.closest('[data-action]'); if (action?.dataset.action === 'results') showResults();
    const info = event.target.closest('[data-info]');
    if (info) openDialog(`<h2 class="dialog-title">${info.dataset.info}</h2><p class="dialog-lead">${info.dataset.info === 'Контакты' ? 'Позвоните нам: <a href="tel:+74951274098">+7 495 127 40 98</a>' : 'Этот раздел находится за пределами показанного в Figma первого блока страницы.'}</p><p class="demo-note">Интерактивный прототип страницы проекта.</p>`);
    const property = event.target.closest('[data-property]'); if (property) { $('#property-button').firstChild.textContent = property.dataset.property; closePopovers(); }
    const city = event.target.closest('[data-city]'); if (city) { $('#location-button').lastChild.textContent = city.dataset.city; closePopovers(); }
    if (!event.target.closest('#header-popover, #page-popover, #property-button, #location-button, #menu-button, #page-menu-button')) closePopovers();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePopovers(); });
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.type !== 'prototype:navigate') return;
    if (['top', 'early', 'middle', 'about'].includes(event.data.target)) jump(event.data.target);
  });
  document.fonts.ready.then(resize);
  resize();
})();
