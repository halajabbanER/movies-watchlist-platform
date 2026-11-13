export const API_BASE = 'http://localhost:8080/api';
export const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

export async function apiRequest(url, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      const errorMsg =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        (typeof data === 'string' && data.trim()) ||
        `Error ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('فشل الاتصال بالسيرفر: تأكد من تشغيل خادم Backend على http://localhost:8080');
    }
    throw err;
  }
}

