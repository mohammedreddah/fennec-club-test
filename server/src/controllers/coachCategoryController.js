import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiResponse.js';
import * as coachCategoryService from '../services/coachCategoryService.js';

export const getCategoriesForCoach = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachCategoryService.getCategoriesForCoach(req.params.coachId));
});

export const getCoachesForCategory = asyncHandler(async (req, res) => {
  if (req.user.role === 'coach') {
    const myCategories = await coachCategoryService.getCategoriesForCoach(req.user.id);
    const isAssigned = myCategories.some((c) => c.id === req.params.categoryId);
    if (!isAssigned) {
      throw new ApiError(403, 'You are not assigned to this category');
    }
  }
  sendSuccess(res, await coachCategoryService.getCoachesForCategory(req.params.categoryId));
});

export const setCoachCategories = asyncHandler(async (req, res) => {
  const { categoryIds } = req.body;
  sendSuccess(res, await coachCategoryService.setCoachCategories(req.params.coachId, categoryIds));
});

// Returns the categories assigned to the currently logged-in coach.
export const getMyCategories = asyncHandler(async (req, res) => {
  sendSuccess(res, await coachCategoryService.getCategoriesForCoach(req.user.id));
});
