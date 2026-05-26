const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  getTasks: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'all') qs.set('status', params.status);
    if (params.minImportance && params.minImportance > 1)
      qs.set('minImportance', params.minImportance);
    const query = qs.toString();
    return apiFetch(`/bfhl/tasks${query ? `?${query}` : ''}`);
  },

  createTask: (body) =>
    apiFetch('/bfhl/tasks', { method: 'POST', body: JSON.stringify(body) }),

  updateTask: (id, body) =>
    apiFetch(`/bfhl/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteTask: (id) => apiFetch(`/bfhl/tasks/${id}`, { method: 'DELETE' }),

  getStats: () => apiFetch('/bfhl/tasks/stats'),
};
