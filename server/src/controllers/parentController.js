import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as parentService from '../services/parentService.js';

export const listParents = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.listParents());
});

export const getParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.getParentById(req.params.id));
});

export const createParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.createParent(req.body), 201);
});

export const updateParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.updateParent(req.params.id, req.body));
});

export const activateParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.setParentActive(req.params.id, true));
});

export const deactivateParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.setParentActive(req.params.id, false));
});

export const updateParentPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.updateParentPassword(req.params.id, req.body.password));
});

export const deleteParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await parentService.deleteParent(req.params.id));
});
