import apiClient from './client.js';

export const listSessions = (params = {}) =>
  apiClient.get('/attendance-sessions', { params }).then((r) => r.data.data);
export const getSession = (id) => apiClient.get(`/attendance-sessions/${id}`).then((r) => r.data.data);
export const createSession = (payload) =>
  apiClient.post('/attendance-sessions', payload).then((r) => r.data.data);
export const updateSession = (id, payload) =>
  apiClient.put(`/attendance-sessions/${id}`, payload).then((r) => r.data.data);
export const deleteSession = (id) => apiClient.delete(`/attendance-sessions/${id}`).then((r) => r.data.data);

export const updateRecord = (id, payload) =>
  apiClient.put(`/attendance-records/${id}`, payload).then((r) => r.data.data);
export const deleteRecord = (id) => apiClient.delete(`/attendance-records/${id}`).then((r) => r.data.data);
