import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sanitizeMongoInput } from './middleware/mongoSanitizeMiddleware.js';

import { AuthRoutes } from './modules/auth/auth.routes.js';
import apiRoutes from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import { isAllowedOrigin } from './config/origins.js';
import { globalLimiter, authLimiter } from './middleware/rateLimitMiddleware.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));

// =========================
// CORS Configuration
// =========================
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error(`❌ CORS Blocked Origin: ${origin}`);

      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);

// =========================
// Better Auth Routes (Rate Limited)
// =========================
app.use('/api/auth', authLimiter, AuthRoutes);

// =========================
// Stripe Webhook (Raw Body)
// =========================
app.use(
  ['/api/payments/webhook', '/api/payment/webhook'],
  express.raw({ type: 'application/json' })
);

// =========================
// Body Parser & NoSQL Injection Sanitization
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMongoInput);

// =========================
// API Routes (Globally Rate Limited)
// =========================
app.use('/api', globalLimiter, apiRoutes);

// =========================
// Root Route
// =========================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Server is running',
    endpoints: {
      auth: '/api/auth',
      api: '/api',
      health: '/api/health',
    },
    timestamp: new Date().toISOString(),
  });
});

// =========================
// 404 Handler
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// =========================
// Global Error Handler
// =========================
app.use(errorMiddleware);

export default app;
