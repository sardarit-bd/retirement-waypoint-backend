import express from 'express';
import { UploadRoutes } from '../modules/upload/upload.routes.js'

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


router.use('/upload', UploadRoutes);

export default router;