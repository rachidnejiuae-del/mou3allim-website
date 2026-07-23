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
    <nav class="nav">
      <div class="nav-inner">
        <a href="index.html" class="logo">
          <span class="logo-mark">M</span>
          Mou3allim
        </a>
        <div class="nav-links">
          <a href="search.html" class="nav-link nav-link-desktop" data-i18n="nav_find_teacher">${t('nav_find_teacher')}</a>
          <div class="lang-switch">
            <button class="lang-btn ${lang === 'fr' ? 'active' : ''}" id="langFr">FR</button>
            <button class="lang-btn ${lang === 'ar' ? 'active' : ''}" id="langAr">عربي</button>
          </div>
          ${rightSide}
        </div>
      </div>
    </nav>
  `;

  document.getElementById('langFr').addEventListener('click', () => { setLang('fr'); renderNav(active); });
  document.getElementById('langAr').addEventListener('click', () => { setLang('ar'); renderNav(active); });
  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { auth.clear(); window.location.href = 'index.html'; });

  applyLang();
}
