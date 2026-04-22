import api from './api';

const createService = (endpoint) => ({
  getAll: (params) => api.get(`/${endpoint}`, { params }).then(res => res.data),
  getById: (id) => api.get(`/${endpoint}/${id}`).then(res => res.data),
  create: (data) => api.post(`/${endpoint}`, data).then(res => res.data),
  update: (id, data) => api.put(`/${endpoint}/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/${endpoint}/${id}`).then(res => res.data),
});

export const productService = createService('products');
export const categoryService = createService('categories');
export const supplierService = createService('suppliers');
export const customerService = createService('customers');
export const userService = createService('users');
export const warehouseService = createService('warehouses');
export const inventoryService = {
  getAll: () => api.get('/inventory').then(res => res.data),
  getLowStock: () => api.get('/inventory/low-stock').then(res => res.data),
  adjust: (data) => api.post('/inventory/adjust', data).then(res => res.data),
};
export const orderService = {
  getAll: (params) => api.get('/orders', { params }).then(res => res.data),
  getById: (id) => api.get(`/orders/${id}`).then(res => res.data),
  create: (data) => api.post('/orders', data).then(res => res.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then(res => res.data),
};
export const paymentService = {
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`).then(res => res.data),
  create: (data) => api.post('/payments', data).then(res => res.data),
};
export const returnService = {
  getAll: () => api.get('/returns').then(res => res.data),
  create: (data) => api.post('/returns', data).then(res => res.data),
};

export const authService = {
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  login: async (credentials) => { 
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getMe: () => api.get('/auth/me').then(res => res.data),
};