import express from 'express';
import { UploadRoutes } from '../modules/upload/upload.routes.js'
import {BookRoutes, PublicBookRoutes} from '../modules/book/book.routes.js'

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


router.use('/upload', UploadRoutes);
router.use('/books', BookRoutes);
router.use('/public/books', PublicBookRoutes);

export default router;
