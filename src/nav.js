// Shared navigation bar, injected into every page's <div id="nav-root"></div>
function renderNav(active) {
  const root = document.getElementById('nav-root');
  if (!root) return;
  const user = auth.getUser();
  const lang = getLang();

  let rightSide = '';
  if (user) {
    rightSide = `
      <a href="${user.role === 'teacher' ? 'dashboard.html' : 'search.html'}" class="nav-link nav-link-desktop">${escapeHtml(user.full_name.split(' ')[0])}</a>
      <button class="btn btn-outline btn-sm" id="navLogoutBtn" data-i18n="nav_logout">${t('nav_logout')}</button>
    `;
  } else {
    rightSide = `
      <a href="auth.html?role=teacher" class="btn btn-amber btn-sm" data-i18n="nav_teacher_login">${t('nav_teacher_login')}</a>
    `;
  }

  root.innerHTML = `
    <style>
      .nav-jeux{
        display:inline-flex;align-items:center;gap:6px;
        background:linear-gradient(135deg,#F2A63B,#E8912A);color:#fff;
        padding:9px 16px;border-radius:999px;font-weight:700;font-size:14px;
        text-decoration:none;box-shadow:0 4px 12px rgba(232,163,61,.35);
        transition:transform .12s, box-shadow .12s;white-space:nowrap;
      }
      .nav-jeux:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(232,163,61,.45);}
      .nav-jeux:active{transform:translateY(0);}
    </style>
    <nav class="nav">
      <div class="nav-inner">
        <a href="index.html" class="logo">
          <span class="logo-mark">M</span>
          Mou3allim
        </a>
        <div class="nav-links">
          <a href="search.html" class="nav-link nav-link-desktop" data-i18n="nav_find_teacher">${t('nav_find_teacher')}</a>
          <a href="jeux.html" class="nav-jeux">🎮 Jeux gratuits</a>
          ${rightSide}
        </div>
      </div>
    </nav>
  `;

  // Arabic temporarily hidden until it is translated properly. Force French so
  // no one is stuck on a half-translated Arabic view. Re-enable by restoring the
  // lang-switch block above and these listeners.
  if (getLang() !== 'fr') setLang('fr');
  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { auth.clear(); window.location.href = 'index.html'; });

  applyLang();
}
