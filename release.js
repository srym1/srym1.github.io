(() => {
  const script = document.currentScript;
  const url = new URL('release.json', script.src);
  let current;
  const badge = document.createElement('div');
  badge.id = 'rym-release';
  badge.setAttribute('role', 'status');
  badge.style.cssText = 'position:fixed;bottom:8px;left:12px;z-index:9000;font:10px Tahoma;color:#d9c69d;background:#102724dd;border:1px solid #bca57444;padding:6px 10px;border-radius:4px;max-width:300px;direction:rtl;pointer-events:none';
  document.body.append(badge);
  async function check() {
    try {
      const response = await fetch(url, {cache:'no-store'});
      if (!response.ok) return;
      const release = await response.json();
      if (!/^\d+\.\d+\.\d+$/.test(release.version)) return;
      if (!current) { current = release.version; badge.textContent = `RYM · ${release.version} · ${release.name}`; }
      else if (current !== release.version) badge.textContent = `التحديث ${release.version} متاح — احفظ تقدمك ثم حدّث الصفحة`;
    } catch { /* An offline session should remain playable. */ }
  }
  check();
  setInterval(() => { if (!document.hidden) check(); }, 60000);
})();
