import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as folderService from '../services/folderService.js';

export const listFolders = asyncHandler(async (req, res) => {
  sendSuccess(res, await folderService.listFolders());
});

export const getFolder = asyncHandler(async (req, res) => {
  sendSuccess(res, await folderService.getFolderById(req.params.id));
});

export const createFolder = asyncHandler(async (req, res) => {
  sendSuccess(res, await folderService.createFolder(req.body), 201);
});

export const updateFolder = asyncHandler(async (req, res) => {
  sendSuccess(res, await folderService.updateFolder(req.params.id, req.body));
});

export const deleteFolder = asyncHandler(async (req, res) => {
  sendSuccess(res, await folderService.deleteFolder(req.params.id));
});
