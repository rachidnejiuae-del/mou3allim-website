// ============================================
// Mou3allim Website — Shared API client
// ============================================
const API_BASE_URL = 'https://mou3allim-backend-1.onrender.com/api';
const BACKEND_ORIGIN = 'https://mou3allim-backend-1.onrender.com';

const MALE_AVATAR = 'https://i.ibb.co/8DZjzRhB/male-teacher.jpg';
const FEMALE_AVATAR = 'https://i.ibb.co/Kzw9Y1BF/female-teacher.jpg';

function getAvatar(teacher) {
  if (teacher.photo_url) {
    return teacher.photo_url.startsWith('http')
      ? teacher.photo_url
      : `${BACKEND_ORIGIN}${teacher.photo_url}`;
  }
  return teacher.gender === 'female' ? FEMALE_AVATAR : MALE_AVATAR;
}

async function apiRequest(path, { method = 'GET', body, auth = true, timeoutMs = 20000 } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('mou3allim_token');
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Le serveur met du temps à répondre (il se réveille peut-être). Réessayez.');
    }
    throw err;
  }
}

const api = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload, auth: false }),
  sendOtp: (phone) => apiRequest('/auth/send-otp', { method: 'POST', body: { phone }, auth: false }),
  verifyOtp: (phone, code) => apiRequest('/auth/verify-otp', { method: 'POST', body: { phone, code }, auth: false }),
  resetPassword: (phone, code, new_password) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: { phone, code, new_password }, auth: false }),

  getSubjects: () => apiRequest('/subjects', { auth: false }),
  getGovernorates: () => apiRequest('/governorates', { auth: false }),
  getAreas: (gov) => apiRequest(`/areas?governorate=${encodeURIComponent(gov)}`, { auth: false }),
  getDegrees: () => apiRequest('/degrees', { auth: false }),
  getExperience: () => apiRequest('/experience', { auth: false }),
  getLevels: () => apiRequest('/levels', { auth: false }),

  searchTeachers: (params) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v) qs.append(k, v); });
    return apiRequest(`/teachers/search?${qs.toString()}`, { auth: false });
  },
  getTeacher: (id) => apiRequest(`/teachers/${id}`, { auth: false }),
  getRatings: (id) => apiRequest(`/teachers/${id}/ratings`, { auth: false }),
  rateTeacher: (id, payload) => apiRequest(`/teachers/${id}/ratings`, { method: 'POST', body: payload, auth: true }),

  getMyProfile: () => apiRequest('/teachers/me', { auth: true }),
  updateMyProfile: (payload) => apiRequest('/teachers/me', { method: 'PUT', body: payload, auth: true }),
  getMySubscription: () => apiRequest('/subscriptions/me', { auth: true }),
  redeemCode: (code) => apiRequest('/subscriptions/redeem', { method: 'POST', body: { code }, auth: true }),
};

// ---------- Auth state helpers ----------
const auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('mou3allim_user') || 'null'); }
    catch { return null; }
  },
  getToken() { return localStorage.getItem('mou3allim_token'); },
  setSession(token, user) {
    localStorage.setItem('mou3allim_token', token);
    localStorage.setItem('mou3allim_user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('mou3allim_token');
    localStorage.removeItem('mou3allim_user');
  },
  isLoggedIn() { return !!this.getToken(); },
};

// ---------- Small UI helpers ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function showToast(message) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function starsHtml(rating, size = 14) {
  const full = Math.round(rating || 0);
  let html = '<span style="display:inline-flex;gap:1px;vertical-align:middle;">';
  for (let i = 1; i <= 5; i++) {
    html += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${i <= full ? '#E8A33D' : 'none'}" stroke="#E8A33D" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  html += '</span>';
  return html;
}

function requireAuth(redirectRole) {
  if (!auth.isLoggedIn()) {
    window.location.href = `auth.html${redirectRole ? '?role=' + redirectRole : ''}`;
    return false;
  }
  return true;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function daysRemaining(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
