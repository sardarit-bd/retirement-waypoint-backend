import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true,
    message: 'API Server is running',
    endpoints: {
      api: '/api',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`
  });
});

app.use(errorMiddleware);

export default app;