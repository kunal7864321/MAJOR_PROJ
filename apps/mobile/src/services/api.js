let token = null;
let baseUrl = 'http://localhost:4000/api';

export function configureApi(newToken, newUrl) {
  if (newToken !== undefined) token = newToken;
  if (newUrl) baseUrl = newUrl.replace(/\/+$/, '');
}

export async function apiRequest(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options.isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  const responseText = await res.text();
  const data = responseText ? JSON.parse(responseText) : null;
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}
