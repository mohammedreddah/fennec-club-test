import apiClient from './client.js';

export const listSessionTypes = () => apiClient.get('/session-types').then((r) => r.data.data);
export const getSessionType = (id) => apiClient.get(`/session-types/${id}`).then((r) => r.data.data);
export const createSessionType = (payload) => apiClient.post('/session-types', payload).then((r) => r.data.data);
export const updateSessionType = (id, payload) =>
  apiClient.put(`/session-types/${id}`, payload).then((r) => r.data.data);
export const deleteSessionType = (id) => apiClient.delete(`/session-types/${id}`).then((r) => r.data.data);
