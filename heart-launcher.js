(() => {
  let overlay = null;
  function launch() {
    if(overlay)return;
    overlay=document.createElement('div');overlay.id='heart-game-overlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:10000;background:#10231f';
    const frame=document.createElement('iframe');frame.title='قلب الغابة — نسخة المنطقة الأولى';frame.src='heart.html';frame.allow='fullscreen; autoplay';frame.style.cssText='width:100%;height:100%;border:0;display:block';
    overlay.append(frame);document.body.append(overlay);document.getElementById('site').classList.add('hide');
    history.replaceState(null,'','#heart');frame.addEventListener('load',()=>frame.focus());
  }
  window.addEventListener('message',e=>{if(e.origin!==location.origin||!overlay||e.source!==overlay.querySelector('iframe').contentWindow)return;if(e.data?.type==='rym-heart-exit'){overlay.remove();overlay=null;document.getElementById('site').classList.remove('hide');history.replaceState(null,'',location.pathname+location.search);document.querySelector('[data-heart-play]')?.focus();}});
  const grid=document.getElementById('game-grid');
  function bind(){const card=grid.querySelector('[data-theme="heart"]');if(!card||card.dataset.heartBound)return;card.dataset.heartBound='true';card.style.cursor='pointer';card.setAttribute('role','button');card.setAttribute('aria-label','افتح قلب الغابة — نسخة قابلة للتجربة');card.tabIndex=0;card.querySelector('.badge').textContent='نسخة أولى · جرّبها الآن';card.querySelector('.meta').textContent='منظور أول 3D · غابة البداية · مستوى 1–10';const old=card.querySelector('.soonbtn');const b=document.createElement('button');b.type='button';b.className='playbtn';b.dataset.heartPlay='true';b.textContent='▶ ادخل الغابة';if(old)old.replaceWith(b);else card.querySelector('.body').append(b);card.addEventListener('click',launch);card.addEventListener('keydown',e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();launch();}});}
  bind();new MutationObserver(bind).observe(grid,{childList:true});
  if(location.hash==='#heart')launch();
})();
