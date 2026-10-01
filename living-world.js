(() => {
  const site = document.getElementById('site');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const grid = document.getElementById('game-grid');
  let pointerCard = null, focusCard = null;
  function updateWorld() {
    const card = pointerCard || focusCard;
    site.dataset.world = card?.dataset.theme || 'base';
    grid.querySelectorAll('.gcard').forEach(c => c.classList.toggle('world-selected', c === card));
  }
  function findCard(target) { return target instanceof Element ? target.closest('.gcard') : null; }
  grid.addEventListener('pointerover', e => { if(e.pointerType === 'touch') return; pointerCard = findCard(e.target); updateWorld(); });
  grid.addEventListener('pointerout', e => { if(e.pointerType === 'touch') return; pointerCard = findCard(e.relatedTarget); updateWorld(); });
  grid.addEventListener('pointerleave', () => { pointerCard = null; updateWorld(); });
  grid.addEventListener('focusin', e => { focusCard = findCard(e.target); updateWorld(); });
  grid.addEventListener('focusout', e => { focusCard = findCard(e.relatedTarget); updateWorld(); });
  grid.addEventListener('pointerdown', e => { if(e.pointerType === 'touch') { pointerCard = findCard(e.target); updateWorld(); } });
  site.addEventListener('pointerdown', e => { if(!findCard(e.target)) { pointerCard = null; focusCard = null; updateWorld(); } });
  window.addEventListener('blur', () => { pointerCard = null; focusCard = null; updateWorld(); });
  const decorate = () => grid.querySelectorAll('.gcard').forEach(card => {
    if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
    if (!card.getAttribute('aria-label')) card.setAttribute('aria-label', 'معاينة أجواء ' + (card.querySelector('h2')?.textContent || 'اللعبة'));
  });
  decorate(); new MutationObserver(decorate).observe(grid, { childList: true });
  const batHost = document.querySelector('.world-bats');
  for (let i = 0; i < 7; i++) {
    const bat = document.createElement('div'); bat.className = 'flying-bat';
    bat.style.cssText = `--flight:${17+i*2}s;--delay:-${i*4.7}s;--height:${13+i*8}%;--size:${20+i%3*12}px`;
    bat.innerHTML = '<svg viewBox="0 0 100 50"><path class="bat-left" d="M50 29Q30 5 0 5L10 32Q20 19 29 39Q40 26 50 39Z"/><path class="bat-right" d="M50 29Q70 5 100 5L90 32Q80 19 71 39Q60 26 50 39Z"/><path d="M44 22L44 13L50 20L56 13L56 22L58 36L50 44L42 36Z"/></svg>';
    batHost.append(bat);
  }
  const motes = document.querySelector('.world-motes');
  for (let i=0;i<23;i++) { const m=document.createElement('i');m.style.cssText=`left:${(i*43)%100}%;top:${(i*29)%100}%;--delay:-${i*.8}s;--drift:${7+i%6}s`;motes.append(m); }
  function setMotion(paused) { site.classList.toggle('motion-paused',paused); }
  setMotion(reduced.matches);reduced.addEventListener('change',e=>setMotion(e.matches));
  site.addEventListener('click', e => {
    const b = e.target.closest('button');if(!b || site.classList.contains('motion-paused') || reduced.matches) return;
    b.classList.remove('button-spark');void b.offsetWidth;b.classList.add('button-spark');
  });
  document.addEventListener('visibilitychange',()=>site.classList.toggle('tab-sleeping',document.hidden));
  // Preview refresh is local only; live games are never interrupted by edits.
  if (['127.0.0.1','localhost'].includes(location.hostname)) {
    let version;
    setInterval(async()=>{if(document.hidden||site.classList.contains('hide'))return;try{const r=await fetch('/__rym_version',{cache:'no-store'});if(!r.ok)return;const value=await r.text();if(version && version!==value)location.reload();version=value;}catch{}},1500);
  }
})();
