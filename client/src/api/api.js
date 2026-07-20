const BASE_URL = '/api';

const parseErrorMessage = (text, status) => {
  if (status === 502) {
    return 'Backend unavailable (502). Restart server with: npm run dev';
  }
  if (!text) return `Error ${status}`;
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    const match = text.match(/<pre>([\s\S]*?)<\/pre>/i);
    const raw = (match?.[1] || text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/Cannot (GET|POST|PUT|DELETE|PATCH)/i.test(raw)) {
      return 'API route not found. Restart the backend server.';
    }
    return raw.slice(0, 180);
  }
  return text.slice(0, 180);
};

const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    let data = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(parseErrorMessage(text, response.status));
      }
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};


export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return url;
  return `/uploads/${url}`;
};

export const uploadAvatar = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${BASE_URL}/auth/profile/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  let data = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Error ${response.status}: ${response.statusText}`);
    }
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload profile photo');
  }

  return data;
};

export default api;
