import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as athleteService from '../services/athleteService.js';

export const listAthletes = asyncHandler(async (req, res) => {
  const { categoryId, isActive, search } = req.query;
  sendSuccess(res, await athleteService.listAthletes(req.user, { categoryId, isActive, search }));
});

export const getAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await athleteService.getAthleteById(req.user, req.params.id));
});

export const createAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await athleteService.createAthlete(req.body), 201);
});

export const updateAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await athleteService.updateAthlete(req.params.id, req.body));
});

export const deleteAthlete = asyncHandler(async (req, res) => {
  sendSuccess(res, await athleteService.deleteAthlete(req.params.id));
});
