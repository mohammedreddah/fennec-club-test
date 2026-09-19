import axios from 'axios';
import { getToken, clearToken } from './tokenStorage.js';
import { translations } from '../i18n/translations.js';
import { BACKEND_ERROR_KEYS } from '../i18n/errorMessages.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The backend always replies in English. This looks up the raw message
// against the known message list and returns the translation for whichever
// language is currently active, so error toasts match the rest of the UI.
// Unmapped messages (rare raw database errors) fall through to the original
// English text rather than showing nothing.
function translateBackendMessage(rawMessage) {
  if (!rawMessage) return rawMessage;
  const key = BACKEND_ERROR_KEYS[rawMessage];
  if (!key) return rawMessage;
  const lang = window.localStorage.getItem('fennec_lang') || 'ar';
  return translations[lang]?.[key] || translations.en[key] || rawMessage;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired/invalid token: clear it so the app falls back to the login
    // screen instead of getting stuck retrying with a dead token.
    if (error?.response?.status === 401) {
      clearToken();
    }
    const rawMessage =
      error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
    const message = translateBackendMessage(rawMessage);
    const details = error?.response?.data?.details;
    return Promise.reject({ message, details, status: error?.response?.status });
  }
);

export default apiClient;
