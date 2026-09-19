// The backend always replies in English (it has no language awareness).
// This maps each known backend message to a translation key in translations.js,
// so the API client can show the translated version instead. Anything not
// listed here (rare raw database errors, unexpected messages) falls back to
// the original English text as-is - safer than showing nothing.
export const BACKEND_ERROR_KEYS = {
  // Auth
  'Invalid email or password': 'errors.invalidCredentials',
  'This account has been deactivated. Contact an administrator.': 'errors.accountDeactivated',
  'Missing or invalid Authorization header': 'errors.sessionExpired',
  'Invalid or expired session': 'errors.sessionExpired',
  'No profile found for this account': 'errors.sessionExpired',
  'Authentication required': 'errors.sessionExpired',
  'You do not have permission to perform this action': 'errors.noPermission',

  // Not found
  'Admin not found': 'errors.notFound',
  'Athlete not found': 'errors.notFound',
  'Attendance record not found': 'errors.notFound',
  'Attendance session not found': 'errors.notFound',
  'Category not found': 'errors.notFound',
  'Coach not found': 'errors.notFound',
  'Document requirement not found': 'errors.notFound',
  'Folder not found': 'errors.notFound',
  'Profile not found': 'errors.notFound',

  // Conflicts / scoping
  'An account with this email already exists': 'errors.emailTaken',
  'Another account already uses this email': 'errors.emailTaken',
  'This category still has athletes assigned to it and cannot be deleted': 'errors.categoryHasAthletes',
  'You are not assigned to this category': 'errors.categoryNotAssigned',
  'You cannot delete your own admin account while logged in as it': 'errors.cannotDeleteSelf',
  'You do not have access to this athlete': 'errors.noAccess',
  'You do not have access to this attendance record': 'errors.noAccess',
  'You do not have access to this attendance session': 'errors.noAccess',

  // Validation
  'Validation failed': 'errors.validationFailed',
  'A valid athlete is required': 'errors.validationFailed',
  'A valid category is required': 'errors.validationFailed',
  'Category must be a valid category': 'errors.validationFailed',
  'A valid date of birth is required': 'errors.validationFailed',
  'A valid document requirement is required': 'errors.validationFailed',
  'A valid email is required': 'errors.validationFailed',
  'A valid folder is required': 'errors.validationFailed',
  'Parent phone number must be exactly 10 digits': 'errors.validationFailed',
  'Phone number must be exactly 10 digits': 'errors.validationFailed',
  'A valid session is required': 'errors.validationFailed',
  'At least one attendance record is required': 'errors.validationFailed',
  'Category name cannot be empty': 'errors.validationFailed',
  'Category name is required': 'errors.validationFailed',
  'Document name is required': 'errors.validationFailed',
  'Each record needs a valid athlete_id': 'errors.validationFailed',
  'First name is required': 'errors.validationFailed',
  'Folder name is required': 'errors.validationFailed',
  'Full name cannot be empty': 'errors.validationFailed',
  'Full name is required': 'errors.validationFailed',
  'Gender must be male or female': 'errors.validationFailed',
  'Guardian name is required': 'errors.validationFailed',
  'Last name is required': 'errors.validationFailed',
  'Password is required': 'errors.validationFailed',
  'Password must be at least 8 characters': 'errors.passwordTooShort',
  'Status must be present or absent': 'errors.validationFailed',
  'categoryIds must be an array of category IDs': 'errors.validationFailed',
  'is_received must be true or false': 'errors.validationFailed',

  // Rate limiting
  'Too many requests. Please try again later.': 'errors.tooManyRequests',
  'Too many login attempts. Please wait a few minutes and try again.': 'errors.tooManyLoginAttempts',

  // Generic
  'Internal server error': 'errors.serverError',
  'Request body is too large.': 'errors.payloadTooLarge',
  'Malformed JSON in request body.': 'errors.serverError',
};
