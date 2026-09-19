import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiResponse.js';

// Runs an array of express-validator chains, then throws a formatted
// ApiError(422) if any of them failed. Use as the last middleware before
// the controller: [...validators, validate, controller]
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(422, 'Validation failed', details));
  }
  next();
};
