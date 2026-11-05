import axios from 'axios';
import { getNeonAccessToken } from './auth.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
});

let accessToken = null;
let tokenExpiresAt = 0;

export function setAccessToken(token) {
  accessToken = token || null;
  tokenExpiresAt = token ? Date.now() + 60_000 : 0;
}

api.interceptors.request.use(async (config) => {
  const route = String(config.url ?? '');
  const needsAuth = /^\/?(auth|users|admin)(\/|$)/.test(route);
  if (needsAuth) {
    try {
      if (!accessToken || Date.now() >= tokenExpiresAt) setAccessToken(await getNeonAccessToken());
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      else if (config.headers?.Authorization) delete config.headers.Authorization;
    } catch {
      accessToken = null;
      tokenExpiresAt = 0;
      if (config.headers?.Authorization) delete config.headers.Authorization;
    }
  }
  return config;
});

export function getApiErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? 'The service is unavailable. Check the API and database connection.';
  }
  return 'An unexpected error occurred.';
}
