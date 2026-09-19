import apiClient from './client.js';

export const listAdmins = () => apiClient.get('/admins').then((r) => r.data.data);
export const getAdmin = (id) => apiClient.get(`/admins/${id}`).then((r) => r.data.data);
export const createAdmin = (payload) => apiClient.post('/admins', payload).then((r) => r.data.data);
export const updateAdmin = (id, payload) => apiClient.put(`/admins/${id}`, payload).then((r) => r.data.data);
export const activateAdmin = (id) => apiClient.patch(`/admins/${id}/activate`).then((r) => r.data.data);
export const deactivateAdmin = (id) => apiClient.patch(`/admins/${id}/deactivate`).then((r) => r.data.data);
export const deleteAdmin = (id) => apiClient.delete(`/admins/${id}`).then((r) => r.data.data);
export const updateAdminPassword = (id, password) =>
  apiClient.patch(`/admins/${id}/password`, { password }).then((r) => r.data.data);
