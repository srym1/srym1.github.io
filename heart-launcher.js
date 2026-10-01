(() => {
  let overlay = null;
  function launch() {
    if (overlay) return;
    overlay = document.createElement('div'); overlay.id = 'heart-game-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#10231f';
    const frame = document.createElement('iframe');
    frame.title = 'قلب الغابة — المنطقة الأولى'; frame.src = 'heart.html?v=0.8.1';
    frame.allow = 'fullscreen; autoplay'; frame.style.cssText = 'width:100%;height:100%;border:0;display:block';
    overlay.append(frame); document.body.append(overlay); document.getElementById('site').classList.add('hide');
    history.replaceState(null, '', '#heart'); frame.addEventListener('load', () => frame.focus());
  }
  window.addEventListener('message', e => {
    if (e.origin !== location.origin || !overlay || e.source !== overlay.querySelector('iframe').contentWindow) return;
    if (e.data?.type === 'rym-heart-exit') {
      overlay.remove(); overlay = null; document.getElementById('site').classList.remove('hide');
      history.replaceState(null, '', location.pathname + location.search);
      document.querySelector('[data-heart-play]')?.focus();
    }
  });
  const grid = document.getElementById('game-grid');
  function bind() {
    const card = grid.querySelector('[data-theme="heart"]');
    if (!card || card.dataset.heartBound) return;
    card.dataset.heartBound = 'true'; card.classList.remove('soon'); card.classList.add('heart-feature');
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'العب قلب الغابة'); card.tabIndex = 0;
    card.innerHTML = `<div class="art heart-cover" aria-hidden="true"><div class="heart-landscape"></div><div class="heart-cover-mist"></div><div class="heart-cover-embers"><i></i><i></i><i></i><i></i><i></i></div></div><div class="shade"></div><div class="badge">قيد التطوير · تجربة مبكرة</div><div class="infohint">اتبع الأثر إلى قلب الغابة</div><div class="body"><div class="heart-copy"><h2>قلب الغابة</h2><div class="meta"><span>بقاء واستكشاف</span><span>الغابة الأولى</span></div></div><button type="button" class="playbtn" data-heart-play aria-label="العب قلب الغابة">▶ ادخل الغابة <b>PLAY</b></button></div>`;
    card.addEventListener('click', launch);
    card.addEventListener('keydown', e => {
      if (e.target === card && ['Enter', ' '].includes(e.key)) { e.preventDefault(); launch(); }
    });
  }
  bind(); new MutationObserver(bind).observe(grid, { childList: true });
  if (location.hash === '#heart') launch();
})();
