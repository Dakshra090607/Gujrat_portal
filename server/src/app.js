import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { db } from './config/database.js';
import documentsRouter from './modules/documents/routes.js';
import regulationsRouter from './modules/regulations/routes.js';
import searchRouter from './modules/search/routes.js';
import complianceRouter from './modules/compliance/routes.js';
import authRouter from './modules/auth/routes.js';
import reviewRouter from './modules/review/routes.js';
import adminRouter from './modules/admin/routes.js';
import usersRouter from './modules/users/routes.js';

export function createApp() {
  const app = express();
  const configuredOrigin = process.env.CLIENT_ORIGIN;
  const isAllowedOrigin = (origin) => {
    // Same-origin requests, mobile apps, or curl don't send an Origin header
    if (!origin) return true;
    if (configuredOrigin && origin === configuredOrigin) return true;
    if (process.env.NODE_ENV !== 'production' && (origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173')) {
      return true;
    }
    return false;
  };

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get(['/', '/api', '/api/v1', '/v1'], (_req, res) => {
    res.json({ service: 'buildrule-gujarat-api', status: 'online' });
  });

  app.get(['/api/v1/health', '/v1/health', '/health'], async (_req, res) => {
    const databaseConnected = await db.isConnected();
    res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? 'ready' : 'database_unavailable',
      service: 'buildrule-gujarat-api',
      database: databaseConnected ? 'connected' : 'disconnected',
    });
  });

  app.use(['/api/v1/auth', '/v1/auth'], authRouter);
  app.use(['/api/v1/users', '/v1/users'], usersRouter);

  app.use([
    '/api/v1/documents', '/v1/documents',
    '/api/v1/parts', '/v1/parts',
    '/api/v1/chapters', '/v1/chapters',
    '/api/v1/regulations', '/v1/regulations'
  ], async (_req, res, next) => {
    if (!await db.isConnected()) {
      return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'PostgreSQL is unavailable. Source records cannot be loaded until the database is connected.' } });
    }
    next();
  });

  app.use(['/api/v1/documents', '/v1/documents'], documentsRouter);
  app.use(['/api/v1', '/v1'], regulationsRouter);
  app.use(['/api/v1/search', '/v1/search'], searchRouter);
  app.use(['/api/v1', '/v1'], complianceRouter);
  app.use(['/api/v1/admin', '/v1/admin'], adminRouter);
  app.use(['/api/v1/admin', '/v1/admin'], reviewRouter);

  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
  app.use((error, _req, res, _next) => {
    console.error('API Error:', error);
    const databaseUnavailable = !process.env.DATABASE_URL || ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', '08000', '08001', '08003', '08004', '08006', '53300'].includes(error.code);
    const status = Number.isInteger(error.status) ? error.status : databaseUnavailable ? 503 : 500;
    const isMissingConfig = !process.env.DATABASE_URL || !process.env.NEON_AUTH_BASE_URL;
    res.status(status).json({ error: {
      code: status === 503 ? 'DATABASE_UNAVAILABLE' : error.code ?? 'INTERNAL_ERROR',
      message: (status >= 500 && !isMissingConfig) ? 'An unexpected server error occurred.' : (error.message || 'An unexpected server error occurred.'),
      ...(status < 500 && error.details ? { details: error.details } : {}),
    } });
  });

  return app;
}
