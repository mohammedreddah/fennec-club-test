import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as recordService from '../services/attendanceRecordService.js';

export const createRecord = asyncHandler(async (req, res) => {
  sendSuccess(res, await recordService.createRecord(req.user, req.body), 201);
});

export const updateRecord = asyncHandler(async (req, res) => {
  sendSuccess(res, await recordService.updateRecord(req.user, req.params.id, req.body));
});

export const deleteRecord = asyncHandler(async (req, res) => {
  sendSuccess(res, await recordService.deleteRecord(req.user, req.params.id));
});
