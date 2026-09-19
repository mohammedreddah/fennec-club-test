import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as userService from '../services/userService.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const users = await userService.listProfiles(role);
  sendSuccess(res, users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getProfileById(req.params.id);
  sendSuccess(res, user);
});
