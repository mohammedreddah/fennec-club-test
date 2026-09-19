import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as service from '../services/parentAthleteService.js';

// Admin: manage links
export const getAthletesForParent = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getAthletesForParent(req.params.parentId));
});

export const getParentsForAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getParentsForAthlete(req.params.athleteId));
});

export const setParentAthletes = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.setParentAthletes(req.params.parentId, req.body.athleteIds));
});

// Parent portal: scoped to the logged-in parent's own linked athletes
export const getMyAthletes = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getAthletesForParent(req.user.id));
});

export const getMyAthleteDetail = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getAthleteForParent(req.user.id, req.params.athleteId));
});

export const getMyAthleteAttendance = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getAttendanceForParent(req.user.id, req.params.athleteId));
});

export const getMyAthleteDocuments = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getDocumentsForParent(req.user.id, req.params.athleteId));
});

export const getMyAthleteCoaches = asyncHandler(async (req, res) => {
  sendSuccess(res, await service.getCoachesForParent(req.user.id, req.params.athleteId));
});
