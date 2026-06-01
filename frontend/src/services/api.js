const BASE_URL = '/api';

async function handleResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    // Standardize error messaging
    const errorMsg = data?.message || data?.error || response.statusText || 'An error occurred';
    const errorCode = data?.error_code || 'API_ERROR';
    
    const error = new Error(errorMsg);
    error.status = response.status;
    error.errorCode = errorCode;
    error.details = data;
    throw error;
  }

  return data;
}

export const api = {
  // Dashboard API
  dashboard: {
    get: () => fetch(`${BASE_URL}/dashboard`).then(handleResponse),
  },

  // Products API
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category) query.append('category', params.category);
      if (params.sort_by) query.append('sort_by', params.sort_by);
      if (params.sort_order) query.append('sort_order', params.sort_order);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      return fetch(`${BASE_URL}/products?${query.toString()}`).then(handleResponse);
    },
    get: (id) => fetch(`${BASE_URL}/products/${id}`).then(handleResponse),
    create: (data) => fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    update: (id, data) => fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    delete: (id) => fetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
  },

  // Customers API
  customers: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      return fetch(`${BASE_URL}/customers?${query.toString()}`).then(handleResponse);
    },
    get: (id) => fetch(`${BASE_URL}/customers/${id}`).then(handleResponse),
    create: (data) => fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    delete: (id) => fetch(`${BASE_URL}/customers/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
  },

  // Orders API
  orders: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      return fetch(`${BASE_URL}/orders?${query.toString()}`).then(handleResponse);
    },
    get: (id) => fetch(`${BASE_URL}/orders/${id}`).then(handleResponse),
    create: (data) => fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateStatus: (id, status) => fetch(`${BASE_URL}/orders/${id}/status?order_status=${status}`, {
      method: 'PUT',
    }).then(handleResponse),
    delete: (id) => fetch(`${BASE_URL}/orders/${id}`, {
      method: 'DELETE',
    }).then(handleResponse),
  },
};
