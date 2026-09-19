import apiClient from './client.js';

export const getMyCategories = () => apiClient.get('/coach-categories/my-categories').then((r) => r.data.data);
export const getCategoriesForCoach = (coachId) =>
  apiClient.get(`/coach-categories/coach/${coachId}`).then((r) => r.data.data);
export const setCoachCategories = (coachId, categoryIds) =>
  apiClient.put(`/coach-categories/coach/${coachId}`, { categoryIds }).then((r) => r.data.data);
export const getCoachesForCategory = (categoryId) =>
  apiClient.get(`/coach-categories/category/${categoryId}`).then((r) => r.data.data);
