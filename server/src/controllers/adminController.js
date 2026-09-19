import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as adminService from '../services/adminService.js';

export const listAdmins = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.listAdmins());
});

export const getAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.getAdminById(req.params.id));
});

export const createAdmin = asyncHandler(async (req, res) => {
  const admin = await adminService.createAdmin(req.body);
  sendSuccess(res, admin, 201);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.updateAdmin(req.params.id, req.body));
});

export const activateAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.setAdminActive(req.params.id, true));
});

export const deactivateAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.setAdminActive(req.params.id, false));
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.deleteAdmin(req.params.id, req.user.id));
});

export const updateAdminPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, await adminService.updateAdminPassword(req.params.id, req.body.password));
});
