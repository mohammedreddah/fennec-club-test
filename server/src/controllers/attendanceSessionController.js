import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as sessionService from '../services/attendanceSessionService.js';

export const listSessions = asyncHandler(async (req, res) => {
  const { categoryId, coachId, dateFrom, dateTo } = req.query;
  sendSuccess(res, await sessionService.listSessions(req.user, { categoryId, coachId, dateFrom, dateTo }));
});

export const getSession = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionService.getSessionById(req.user, req.params.id));
});

export const createSession = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionService.createSessionWithRecords(req.user, req.body), 201);
});

export const updateSession = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionService.updateSession(req.user, req.params.id, req.body));
});

export const deleteSession = asyncHandler(async (req, res) => {
  sendSuccess(res, await sessionService.deleteSession(req.user, req.params.id));
});
