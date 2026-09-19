import apiClient from './client.js';

export const listFolders = () => apiClient.get('/folders').then((r) => r.data.data);
export const createFolder = (payload) => apiClient.post('/folders', payload).then((r) => r.data.data);
export const updateFolder = (id, payload) => apiClient.put(`/folders/${id}`, payload).then((r) => r.data.data);
export const deleteFolder = (id) => apiClient.delete(`/folders/${id}`).then((r) => r.data.data);

export const createRequirement = (payload) =>
  apiClient.post('/document-requirements', payload).then((r) => r.data.data);
export const updateRequirement = (id, payload) =>
  apiClient.put(`/document-requirements/${id}`, payload).then((r) => r.data.data);
export const deleteRequirement = (id) =>
  apiClient.delete(`/document-requirements/${id}`).then((r) => r.data.data);
