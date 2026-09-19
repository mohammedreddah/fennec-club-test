import apiClient from './client.js';

export const getChecklistForAthlete = (athleteId) =>
  apiClient.get(`/document-status/athlete/${athleteId}`).then((r) => r.data.data);
export const getAthletesWithMissingDocuments = () =>
  apiClient.get('/document-status/missing').then((r) => r.data.data);
export const markDocumentStatus = (payload) =>
  apiClient.post('/document-status', payload).then((r) => r.data.data);
export const getExportMatrix = () => apiClient.get('/document-status/export-matrix').then((r) => r.data.data);
