import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as categoryService from '../services/categoryService.js';

export const listCategories = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.listCategories());
});

export const getCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.getCategoryById(req.params.id));
});

export const createCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.createCategory(req.body), 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.updateCategory(req.params.id, req.body));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, await categoryService.deleteCategory(req.params.id));
});
