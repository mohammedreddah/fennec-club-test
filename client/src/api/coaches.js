import apiClient from './client.js';

export const listCoaches = () => apiClient.get('/coaches').then((r) => r.data.data);
export const getCoach = (id) => apiClient.get(`/coaches/${id}`).then((r) => r.data.data);
export const createCoach = (payload) => apiClient.post('/coaches', payload).then((r) => r.data.data);
export const updateCoach = (id, payload) => apiClient.put(`/coaches/${id}`, payload).then((r) => r.data.data);
export const activateCoach = (id) => apiClient.patch(`/coaches/${id}/activate`).then((r) => r.data.data);
export const deactivateCoach = (id) => apiClient.patch(`/coaches/${id}/deactivate`).then((r) => r.data.data);
export const deleteCoach = (id) => apiClient.delete(`/coaches/${id}`).then((r) => r.data.data);
export const updateCoachPassword = (id, password) =>
  apiClient.patch(`/coaches/${id}/password`, { password }).then((r) => r.data.data);
