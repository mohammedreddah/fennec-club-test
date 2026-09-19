import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import coachRoutes from './routes/coachRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import athleteRoutes from './routes/athleteRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import sessionTypeRoutes from './routes/sessionTypeRoutes.js';
import coachCategoryRoutes from './routes/coachCategoryRoutes.js';
import parentAthleteRoutes from './routes/parentAthleteRoutes.js';
import attendanceSessionRoutes from './routes/attendanceSessionRoutes.js';
import attendanceRecordRoutes from './routes/attendanceRecordRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import documentRequirementRoutes from './routes/documentRequirementRoutes.js';
import athleteDocumentStatusRoutes from './routes/athleteDocumentStatusRoutes.js';

import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// The production deployment (see README) runs behind Nginx. Without this,
// express-rate-limit (and req.ip generally) would see every visitor as the
// proxy's own IP, either breaking rate limiting entirely or throttling all
// users as one. "1" trusts exactly one hop (the local Nginx reverse proxy).
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Fennec Club API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/session-types', sessionTypeRoutes);
app.use('/api/coach-categories', coachCategoryRoutes);
app.use('/api/parent-athletes', parentAthleteRoutes);
app.use('/api/attendance-sessions', attendanceSessionRoutes);
app.use('/api/attendance-records', attendanceRecordRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/document-requirements', documentRequirementRoutes);
app.use('/api/document-status', athleteDocumentStatusRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
