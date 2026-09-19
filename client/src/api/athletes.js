import apiClient from './client.js';

export const listAthletes = (params = {}) => apiClient.get('/athletes', { params }).then((r) => r.data.data);
export const getAthlete = (id) => apiClient.get(`/athletes/${id}`).then((r) => r.data.data);
export const createAthlete = (payload) => apiClient.post('/athletes', payload).then((r) => r.data.data);
export const updateAthlete = (id, payload) => apiClient.put(`/athletes/${id}`, payload).then((r) => r.data.data);
export const deleteAthlete = (id) => apiClient.delete(`/athletes/${id}`).then((r) => r.data.data);
