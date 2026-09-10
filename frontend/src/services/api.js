const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('kathacheck_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('kathacheck_token');
    localStorage.removeItem('kathacheck_user');
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload) => request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/api/auth/me'),

  // Partners & Capital
  getPartners: () => request('/api/partners'),
  getInvestments: () => request('/api/partners/investments'),
  addInvestment: (payload) => request('/api/partners/investments', { method: 'POST', body: JSON.stringify(payload) }),
  withdrawCapital: (payload) => request('/api/partners/withdrawals', { method: 'POST', body: JSON.stringify(payload) }),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.area) query.append('area', params.area);
    if (params.partner_id) query.append('partner_id', params.partner_id);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/api/customers${qs ? '?' + qs : ''}`);
  },
  createCustomer: (payload) => request('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getCustomer: (id) => request(`/api/customers/${id}`),
  getCustomerHistory: (id) => request(`/api/customers/${id}/history`),

  // Loans & Schedules
  getLoans: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.customer_id) query.append('customer_id', params.customer_id);
    if (params.partner_id) query.append('partner_id', params.partner_id);
    const qs = query.toString();
    return request(`/api/loans${qs ? '?' + qs : ''}`);
  },
  calculateLoan: (payload) => request('/api/loans/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  createLoan: (payload) => request('/api/loans', { method: 'POST', body: JSON.stringify(payload) }),
  getLoanSchedule: (loanId) => request(`/api/loans/${loanId}/schedule`),

  // Collections & Route Desk
  getCollections: (params = {}) => {
    const query = new URLSearchParams();
    if (params.payment_mode) query.append('payment_mode', params.payment_mode);
    if (params.loan_id) query.append('loan_id', params.loan_id);
    if (params.customer_id) query.append('customer_id', params.customer_id);
    if (params.partner_id) query.append('partner_id', params.partner_id);
    const qs = query.toString();
    return request(`/api/collections${qs ? '?' + qs : ''}`);
  },
  recordCollection: (payload) => request('/api/collections', { method: 'POST', body: JSON.stringify(payload) }),
  getTodayRoute: (params = {}) => {
    const query = new URLSearchParams();
    if (params.area) query.append('area', params.area);
    if (params.partner_id) query.append('partner_id', params.partner_id);
    const qs = query.toString();
    return request(`/api/collections/today${qs ? '?' + qs : ''}`);
  },
  getTodaySummary: () => request('/api/collections/today/summary'),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.payment_mode) query.append('payment_mode', params.payment_mode);
    const qs = query.toString();
    return request(`/api/expenses${qs ? '?' + qs : ''}`);
  },
  createExpense: (payload) => request('/api/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteExpense: (id) => request(`/api/expenses/${id}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: () => request('/api/audit'),

  // Reports
  getReportsSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    if (params.area) query.append('area', params.area);
    if (params.partner_id) query.append('partner_id', params.partner_id);
    const qs = query.toString();
    return request(`/api/reports/summary${qs ? '?' + qs : ''}`);
  },
  getCollectionsCsvUrl: () => `${BASE_URL}/api/reports/export/collections.csv`,
  getOverdueCsvUrl: () => `${BASE_URL}/api/reports/export/overdue.csv`,

  // Dashboard
  getMetrics: () => request('/api/dashboard/metrics'),
};
