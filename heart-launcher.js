(() => {
  let overlay = null;
  function launch() {
    if (overlay) return;
    overlay = document.createElement('div'); overlay.id = 'heart-game-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#10231f';
    const frame = document.createElement('iframe');
    frame.title = 'قلب الغابة — المنطقة الأولى'; frame.src = 'heart.html?v=0.10.0';
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
  // Match the existing cover crop, so the flame stays on the photographed fire.
  const coverResize = new ResizeObserver(entries => entries.forEach(({target,contentRect:r}) => {
    const scale=Math.max(r.width/1983,r.height/793),w=1983*scale,h=793*scale;
    target.style.setProperty('--heart-fire-x',(.287*w+.36*(r.width-w))+'px');
    target.style.setProperty('--heart-fire-y',(.674*h+.5*(r.height-h))+'px');
  }));
  function bind() {
    const card = grid.querySelector('[data-theme="heart"]');
    if (!card || card.dataset.heartBound) return;
    card.dataset.heartBound = 'true'; card.classList.remove('soon'); card.classList.add('heart-feature');
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'العب قلب الغابة'); card.tabIndex = 0;
    card.innerHTML = `<div class="art heart-cover" aria-hidden="true"><div class="heart-landscape"><div class="heart-tree-sway tree-near"></div><div class="heart-tree-sway tree-far"></div><div class="heart-fire-glow"></div><div class="heart-fire-live"><i></i><i></i><i></i></div><div class="heart-wind-leaves"><i style="--leaf:0;--delay:-0s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:1;--delay:-1.37s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:2;--delay:-2.74s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:3;--delay:-4.11s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:4;--delay:-5.48s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:5;--delay:-6.8500000000000005s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i><i style="--leaf:6;--delay:-8.22s"><svg viewBox="0 0 30 16"><path d="M1 8Q14-4 29 4Q20 20 1 8Z" fill="currentColor"/><path d="M2 8L25 5" fill="none" stroke="#d4c6a3" stroke-opacity=".45" stroke-width=".7"/></svg></i></div></div><div class="heart-cover-mist"></div><div class="heart-cover-embers"><i></i><i></i><i></i><i></i><i></i></div></div><div class="shade"></div><div class="badge">قيد التطوير · تجربة مبكرة</div><div class="infohint">اتبع الأثر إلى قلب الغابة</div><div class="body"><div class="heart-copy"><h2>قلب الغابة</h2><div class="meta"><span>بقاء واستكشاف</span><span>الغابة الأولى</span></div></div><button type="button" class="playbtn" data-heart-play aria-label="العب قلب الغابة">▶ ادخل الغابة <b>PLAY</b></button></div>`;
    coverResize.disconnect(); coverResize.observe(card.querySelector('.heart-landscape'));
    card.addEventListener('click', launch);
    card.addEventListener('keydown', e => {
      if (e.target === card && ['Enter', ' '].includes(e.key)) { e.preventDefault(); launch(); }
    });
  }
  bind(); new MutationObserver(bind).observe(grid, { childList: true });
  if (location.hash === '#heart') launch();
})();
