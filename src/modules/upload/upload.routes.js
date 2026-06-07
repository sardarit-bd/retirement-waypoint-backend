import express from 'express';
import { bookCoverUpload, profileImageUpload, uploadMultiple, uploadSingle } from '../../middleware/uploadMiddleware.js';
import { deleteFileValidation, getUserFilesValidation, updateFileInfoValidation, uploadMultipleValidation, uploadSingleValidation, validate } from './upload.validation.js';
import { UploadController } from './upload.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';


const router = express.Router();

router.use(protect);


router.post(
  '/single',
  uploadSingle('file'),
  validate(uploadSingleValidation),
  UploadController.uploadSingle
);

router.post(
  '/multiple',
  uploadMultiple('files', 10),
  validate(uploadMultipleValidation),
  UploadController.uploadMultiple
);

router.post(
  '/profile-image',
  profileImageUpload,
  UploadController.uploadProfileImage
);

router.post(
  '/book-cover',
  bookCoverUpload,
  UploadController.uploadBookCover
);

router.get(
  '/my-files',
  validate(getUserFilesValidation),
  UploadController.getUserFiles
);

router.patch(
  '/:publicId',
  validate(updateFileInfoValidation),
  UploadController.updateFileInfo
);

router.delete(
  '/:publicId',
  validate(deleteFileValidation),
  UploadController.deleteFile
);

router.delete(
  '/cleanup/expired',
  restrictTo('admin'),
  UploadController.cleanupExpired
);

export const UploadRoutes = router;