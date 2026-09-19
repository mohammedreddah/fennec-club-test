import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as coachService from '../services/coachService.js';

export const listCoaches = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.listCoaches());
});

export const getCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.getCoachById(req.params.id));
});

export const createCoach = asyncHandler(async (req, res) => {
  const coach = await coachService.createCoach(req.body);
  sendSuccess(res, coach, 201);
});

export const updateCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.updateCoach(req.params.id, req.body));
});

export const activateCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.setCoachActive(req.params.id, true));
});

export const deactivateCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.setCoachActive(req.params.id, false));
});

export const deleteCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.deleteCoach(req.params.id));
});

export const updateCoachPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachService.updateCoachPassword(req.params.id, req.body.password));
});
