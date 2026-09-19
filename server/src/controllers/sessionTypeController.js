import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as sessionTypeService from '../services/sessionTypeService.js';

export const listSessionTypes = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionTypeService.listSessionTypes());
});

export const getSessionType = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionTypeService.getSessionTypeById(req.params.id));
});

export const createSessionType = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionTypeService.createSessionType(req.body), 201);
});

export const updateSessionType = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionTypeService.updateSessionType(req.params.id, req.body));
});

export const deleteSessionType = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionTypeService.deleteSessionType(req.params.id));
});
