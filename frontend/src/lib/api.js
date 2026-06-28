const BASE = '/api';

function getToken() {
  return localStorage.getItem('riq_token');
}

async function req(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (body) => req('POST', '/auth/register', body),
  login: (body) => req('POST', '/auth/login', body),
  me: () => req('GET', '/auth/me'),

  // Dashboard
  dashboard: () => req('GET', '/dashboard'),

  // Jobs
  getJobs: () => req('GET', '/jobs'),
  createJob: (body) => req('POST', '/jobs', body),
  updateJob: (id, body) => req('PUT', `/jobs/${id}`, body),
  deleteJob: (id) => req('DELETE', `/jobs/${id}`),

  // Criteria
  getCriteria: (jobId) => req('GET', `/jobs/${jobId}/criteria`),
  addCriterion: (jobId, body) => req('POST', `/jobs/${jobId}/criteria`, body),
  deleteCriterion: (id) => req('DELETE', `/criteria/${id}`),

  // Applicants
  getApplicants: (jobId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/jobs/${jobId}/applicants${qs ? '?' + qs : ''}`);
  },
  getApplicant: (id) => req('GET', `/applicants/${id}`),
  updateStatus: (id, status) => req('PATCH', `/applicants/${id}/status`, { status }),
  deleteApplicant: (id) => req('DELETE', `/applicants/${id}`),
  uploadCV: (jobId, formData) => req('POST', `/jobs/${jobId}/upload`, formData, true),
};
