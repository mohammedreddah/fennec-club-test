import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as requirementService from '../services/documentRequirementService.js';

export const createRequirement = asyncHandler(async (req, res) => {
  sendSuccess(res, await requirementService.createRequirement(req.body), 201);
});

export const updateRequirement = asyncHandler(async (req, res) => {
  sendSuccess(res, await requirementService.updateRequirement(req.params.id, req.body));
});

export const deleteRequirement = asyncHandler(async (req, res) => {
  sendSuccess(res, await requirementService.deleteRequirement(req.params.id));
});
