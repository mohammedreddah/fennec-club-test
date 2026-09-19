import apiClient from './client.js';

export const listParents = () => apiClient.get('/parents').then((r) => r.data.data);
export const getParent = (id) => apiClient.get(`/parents/${id}`).then((r) => r.data.data);
export const createParent = (payload) => apiClient.post('/parents', payload).then((r) => r.data.data);
export const updateParent = (id, payload) => apiClient.put(`/parents/${id}`, payload).then((r) => r.data.data);
export const activateParent = (id) => apiClient.patch(`/parents/${id}/activate`).then((r) => r.data.data);
export const deactivateParent = (id) => apiClient.patch(`/parents/${id}/deactivate`).then((r) => r.data.data);
export const updateParentPassword = (id, password) =>
  apiClient.patch(`/parents/${id}/password`, { password }).then((r) => r.data.data);
export const deleteParent = (id) => apiClient.delete(`/parents/${id}`).then((r) => r.data.data);
