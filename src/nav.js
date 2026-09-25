// Shared navigation bar, injected into every page's <div id="nav-root"></div>
function renderNav(active) {
  // ---- PWA setup (runs once per page load, on every page that uses the nav) ----
  setupPWA();

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
          <div class="lang-switch" id="langSwitch">
            <button class="lang-btn ${lang === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
            <button class="lang-btn ${lang === 'ar' ? 'active' : ''}" data-lang="ar">ع</button>
          </div>
          ${rightSide}
        </div>
      </div>
    </nav>
  `;

  // Language switch (default is French via getLang(); choice is remembered).
  document.querySelectorAll('#langSwitch .lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const chosen = btn.getAttribute('data-lang');
      if (chosen === getLang()) return;
      setLang(chosen);          // saves choice + calls applyLang()
      renderNav(active);        // re-render nav so the active pill + direction update
    });
  });

  const logoutBtn = document.getElementById('navLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { auth.clear(); window.location.href = 'index.html'; });

  applyLang();
}

// ---- Progressive Web App: manifest + tags + service worker + install hints ----
let _deferredInstallPrompt = null;

function setupPWA() {
  try {
    // Add manifest + theme + apple tags to <head> once.
    if (!document.querySelector('link[rel="manifest"]')) {
      const head = document.head;
      const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); head.appendChild(el); };
      add('link', { rel: 'manifest', href: '/manifest.json' });
      add('meta', { name: 'theme-color', content: '#0E7C66' });
      add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
      add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
      add('meta', { name: 'apple-mobile-web-app-title', content: 'Mou3allim' });
      add('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
    }

    // Register the service worker.
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    // Android/Chrome: capture the install prompt so we can show our own button.
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _deferredInstallPrompt = e;
      showInstallButton();
      showInstallHint('android');
    });
    window.addEventListener('appinstalled', () => {
      _deferredInstallPrompt = null;
      const b = document.getElementById('pwaInstallBtn');
      if (b) b.remove();
      dismissHint();
    });

    // iPhone/Safari: no beforeinstallprompt exists. Detect iOS Safari (not already
    // installed) and show the manual "Add to Home Screen" hint.
    setTimeout(maybeShowIosHint, 1500);
  } catch (e) {}
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function maybeShowIosHint() {
  try {
    if (isStandalone()) return;
    const ua = window.navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    if (isIos && isSafari) showInstallHint('ios');
  } catch (e) {}
}

// Shows a one-time dismissible install hint. type = 'android' | 'ios'.
function showInstallHint(type) {
  try {
    if (isStandalone()) return;
    // Only show once per device (remember dismissal).
    if (localStorage.getItem('pwa_hint_dismissed') === '1') return;
    if (document.getElementById('pwaHint')) return;

    const msg = type === 'ios'
      ? `📲 Installez Mou3allim : appuyez sur <b>Partager</b> ⬆️ puis <b>« Sur l'écran d'accueil »</b>.`
      : `📲 Installez l'application Mou3allim sur votre téléphone — appuyez sur le bouton vert <b>« Installer »</b> ci-dessous.`;

    const bar = document.createElement('div');
    bar.id = 'pwaHint';
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:76px;z-index:9998;background:#fff;border:1px solid #ECE7DE;border-left:4px solid #0E7C66;border-radius:14px;padding:13px 44px 13px 15px;box-shadow:0 8px 28px rgba(20,50,40,.18);font-family:inherit;font-size:13.5px;color:#1C1C1E;line-height:1.5;max-width:520px;margin:0 auto;';
    bar.innerHTML = `${msg}<button id="pwaHintClose" aria-label="Fermer" style="position:absolute;top:8px;right:10px;background:none;border:none;font-size:18px;color:#999;cursor:pointer;line-height:1;">×</button>`;
    document.body.appendChild(bar);
    document.getElementById('pwaHintClose').addEventListener('click', dismissHint);
  } catch (e) {}
}

function dismissHint() {
  try { localStorage.setItem('pwa_hint_dismissed', '1'); } catch (e) {}
  const b = document.getElementById('pwaHint');
  if (b) b.remove();
}

function showInstallButton() {
  if (document.getElementById('pwaInstallBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'pwaInstallBtn';
  btn.textContent = '📲 Installer l\'application';
  btn.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9999;background:#0E7C66;color:#fff;border:none;padding:13px 22px;border-radius:999px;font-weight:700;font-size:14px;box-shadow:0 6px 20px rgba(14,124,102,.4);cursor:pointer;font-family:inherit;';
  btn.addEventListener('click', async () => {
    if (!_deferredInstallPrompt) return;
    _deferredInstallPrompt.prompt();
    await _deferredInstallPrompt.userChoice;
    _deferredInstallPrompt = null;
    btn.remove();
    dismissHint();
  });
  document.body.appendChild(btn);
}
