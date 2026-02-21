const API_URL = process.env.PUBLIC_API_URL || 'http://localhost:5000/api';

export const fetcher = async (endpoint, options = {}) => {
  const res = await fetch(${API_URL}${endpoint}, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};