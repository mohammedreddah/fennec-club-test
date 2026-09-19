import rateLimit from 'express-rate-limit';

// Applied to every /api request. A generous ceiling meant to stop scripted
// abuse/scraping, not to get in the way of normal club-sized usage.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Applied only to POST /api/auth/login. Tight enough to make password
// brute-forcing and credential stuffing impractical, generous enough that a
// coach fumbling their password a few times in a row never gets locked out.
// Keyed by IP, not by the submitted email, so an attacker can't use someone
// else's account to burn through a shared budget.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait a few minutes and try again.' },
  skipSuccessfulRequests: true, // only failed attempts count against the limit
});
