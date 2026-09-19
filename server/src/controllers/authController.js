import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/authService.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  sendSuccess(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  await authService.logout(token);
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, req.user);
});
