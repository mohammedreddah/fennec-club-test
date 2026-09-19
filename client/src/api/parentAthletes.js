import apiClient from './client.js';

// Admin: manage which athletes a parent account is linked to
export const getAthletesForParent = (parentId) =>
  apiClient.get(`/parent-athletes/parent/${parentId}`).then((r) => r.data.data);
export const getParentsForAthlete = (athleteId) =>
  apiClient.get(`/parent-athletes/athlete/${athleteId}`).then((r) => r.data.data);
export const setParentAthletes = (parentId, athleteIds) =>
  apiClient.put(`/parent-athletes/parent/${parentId}`, { athleteIds }).then((r) => r.data.data);

// Parent portal: scoped to the logged-in parent's own linked athletes
export const getMyAthletes = () => apiClient.get('/parent-athletes/my-athletes').then((r) => r.data.data);
export const getMyAthleteDetail = (athleteId) =>
  apiClient.get(`/parent-athletes/my-athletes/${athleteId}`).then((r) => r.data.data);
export const getMyAthleteAttendance = (athleteId) =>
  apiClient.get(`/parent-athletes/my-athletes/${athleteId}/attendance`).then((r) => r.data.data);
export const getMyAthleteDocuments = (athleteId) =>
  apiClient.get(`/parent-athletes/my-athletes/${athleteId}/documents`).then((r) => r.data.data);
export const getMyAthleteCoaches = (athleteId) =>
  apiClient.get(`/parent-athletes/my-athletes/${athleteId}/coaches`).then((r) => r.data.data);
