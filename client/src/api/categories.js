import apiClient from './client.js';

export const listCategories = () => apiClient.get('/categories').then((r) => r.data.data);
export const getCategory = (id) => apiClient.get(`/categories/${id}`).then((r) => r.data.data);
export const createCategory = (payload) => apiClient.post('/categories', payload).then((r) => r.data.data);
export const updateCategory = (id, payload) => apiClient.put(`/categories/${id}`, payload).then((r) => r.data.data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`).then((r) => r.data.data);
