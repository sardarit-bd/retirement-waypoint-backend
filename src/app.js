import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { AuthRoutes } from './modules/auth/auth.routes.js';
import apiRoutes from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));

// =========================
// CORS Configuration
// =========================
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
)
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`❌ CORS Blocked Origin: ${origin}`);

      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);

// =========================
// Better Auth Routes
// =========================
app.use('/api/auth', AuthRoutes);

// =========================
// Stripe Webhook (Raw Body)
// =========================
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);

// =========================
// Body Parser
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// API Routes
// =========================
app.use('/api', apiRoutes);

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