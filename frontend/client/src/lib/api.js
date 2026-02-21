const API_URL = import.meta.env.VITE_API_URL || '';

/* ── helpers ──────────────────────────────────────────────── */

function getToken() {
  try {
    const s = localStorage.getItem('ff_session');
    return s ? JSON.parse(s).accessToken : null;
  } catch { return null; }
}

function getRefreshToken() {
  try {
    const s = localStorage.getItem('ff_session');
    return s ? JSON.parse(s).refreshToken : null;
  } catch { return null; }
}

function saveTokens(accessToken, refreshToken) {
  try {
    const s = JSON.parse(localStorage.getItem('ff_session') || '{}');
    s.accessToken = accessToken;
    if (refreshToken) s.refreshToken = refreshToken;
    localStorage.setItem('ff_session', JSON.stringify(s));
  } catch { /* ignore */ }
}

/* ── core fetcher ─────────────────────────────────────────── */

export const fetcher = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // Attempt token refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshRes = await fetch(`${API_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.success) {
        saveTokens(data.accessToken, data.refreshToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      }
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message || body.reason || body.detail || body.error || 'An error occurred.';
    const err = new Error(msg);
    err.status = res.status;
    err.code = body.code;
    err.body = body;
    throw err;
  }
  return body;
};

/* ── Auth ──────────────────────────────────────────────────── */

export const authAPI = {
  login: (login, password) =>
    fetcher('/users/login', { method: 'POST', body: JSON.stringify({ login, password }) }),

  register: (username, email, password, confirmPassword, role) =>
    fetcher('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword, role }),
    }),

  logout: () =>
    fetcher('/users/logout', { method: 'POST' }),
};

/* ── Vehicles ─────────────────────────────────────────────── */

export const vehicleAPI = {
  getAll: (params = '') => fetcher(`/vehicle${params ? '?' + params : ''}`),
  getById: (id) => fetcher(`/vehicle/${id}`),
  create: (data) => fetcher('/vehicle/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetcher(`/vehicle/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  retire: (id) => fetcher(`/vehicle/${id}/retire`, { method: 'PATCH' }),
  remove: (id) => fetcher(`/vehicle/${id}`, { method: 'DELETE' }),
};

/* ── Drivers ──────────────────────────────────────────────── */

export const driverAPI = {
  getAll: (params = '') => fetcher(`/driver${params ? '?' + params : ''}`),
  getById: (id) => fetcher(`/driver/${id}`),
  create: (data) => fetcher('/driver', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetcher(`/driver/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  patchStatus: (id, status) =>
    fetcher(`/driver/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id) => fetcher(`/driver/${id}`, { method: 'DELETE' }),
};

/* ── Trips ────────────────────────────────────────────────── */

export const tripAPI = {
  getAll: (params = '') => fetcher(`/api/trips${params ? '?' + params : ''}`),
  getById: (id) => fetcher(`/api/trips/${id}`),
  getPending: () => fetcher('/api/trips/pending'),
  create: (data) => fetcher('/api/trips', { method: 'POST', body: JSON.stringify(data) }),
  complete: (data) => fetcher('/api/trips/complete', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (trip_id) => fetcher('/api/trips/cancel', { method: 'POST', body: JSON.stringify({ trip_id }) }),
};

/* ── Maintenance ──────────────────────────────────────────── */

export const maintenanceAPI = {
  getAll: (params = '') => fetcher(`/maintenance${params ? '?' + params : ''}`),
  add: (data) => fetcher('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
};

/* ── Analytics ────────────────────────────────────────────── */

export const analyticsAPI = {
  dashboard: () => fetcher('/analytics/dashboard'),
  vehicle: (id) => fetcher(`/analytics/vehicle/${id}`),
  monthlyFinancial: (year) => fetcher(`/analytics/financial/monthly?year=${year}`),
  report: () => fetcher('/analytics/report'),
};

/* ── Alerts ────────────────────────────────────────────────── */

export const alertAPI = {
  getAll: (params = '') => fetcher(`/alerts${params ? '?' + params : ''}`),
  summary: () => fetcher('/alerts/summary'),
  thresholds: () => fetcher('/alerts/thresholds'),
  acknowledge: (id) => fetcher(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  resolve: (id) => fetcher(`/alerts/${id}/resolve`, { method: 'POST' }),
  scanOdometer: () => fetcher('/alerts/scan/odometer', { method: 'POST' }),
  scanPredictive: () => fetcher('/alerts/scan/predictive', { method: 'POST' }),
};

/* ── Export ────────────────────────────────────────────────── */

export const exportAPI = {
  financialCSV: () => `${API_URL}/export/financial/csv`,
  financialPDF: () => `${API_URL}/export/financial/pdf`,
  payrollCSV: (year, month) => `${API_URL}/export/payroll/csv?year=${year}&month=${month}`,
  vehicleHealthCSV: () => `${API_URL}/export/vehicle-health/csv`,
};