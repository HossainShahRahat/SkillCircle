const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
let unauthorizedHandler = null;

async function request(path, options = {}) {
  const token = localStorage.getItem('skillcircle-token');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && unauthorizedHandler) {
    unauthorizedHandler();
  }
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    request(path, {
      method: 'DELETE',
    }),
  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}
