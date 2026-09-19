import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as statusService from '../services/athleteDocumentStatusService.js';

export const getChecklistForAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await statusService.getChecklistForAthlete(req.user, req.params.athleteId));
});

export const getAthletesWithMissingDocuments = asyncHandler(async (req, res) => {
  sendSuccess(res, await statusService.getAthletesWithMissingDocuments(req.user));
});

export const markDocumentStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, await statusService.markDocumentStatus(req.user, req.body));
});

export const getExportMatrix = asyncHandler(async (req, res) => {
  sendSuccess(res, await statusService.getExportMatrix());
});
