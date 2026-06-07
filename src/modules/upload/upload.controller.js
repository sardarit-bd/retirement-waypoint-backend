import ApiError from "../../utils/ApiError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import UploadService from "./upload.service.js";

const uploadSingle = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const result = await UploadService.uploadFile(
    req.file,
    req.user.id,
    {
      folder: req.body.folder || 'general',
      description: req.body.description,
      alt: req.body.alt,
      transformations: req.body.transformations ? JSON.parse(req.body.transformations) : undefined
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'File uploaded successfully',
    data: result
  });
});

const uploadMultiple = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files uploaded');
  }

  const result = await UploadService.uploadMultipleFiles(
    req.files,
    req.user.id,
    {
      folder: req.body.folder || 'general',
      description: req.body.description
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: `${result.successful.length} files uploaded successfully`,
    data: result
  });
});

const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const result = await UploadService.uploadFile(
    req.file,
    req.user.id,
    {
      folder: 'profiles',
      transformations: [
        { width: 300, height: 300, crop: 'thumb', gravity: 'face' },
        { radius: 'max' },
        { quality: 'auto' }
      ]
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Profile image uploaded successfully',
    data: result
  });
});

const uploadBookCover = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const result = await UploadService.uploadFile(
    req.file,
    req.user.id,
    {
      folder: 'books/covers',
      transformations: [
        { width: 600, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Book cover uploaded successfully',
    data: result
  });
});

const deleteFile = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  const isAdmin = req.user.role === 'admin';

  const result = await UploadService.deleteFile(publicId, req.user.id, isAdmin);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'File deleted successfully',
    data: result
  });
});

const getUserFiles = catchAsync(async (req, res) => {
  const { page, limit, fileType, folder } = req.query;

  const result = await UploadService.getUserFiles(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    fileType,
    folder
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Files retrieved successfully',
    data: result.files,
    meta: result.pagination
  });
});

const updateFileInfo = catchAsync(async (req, res) => {
  const { publicId } = req.params;
  const { description, alt } = req.body;

  const result = await UploadService.updateFileInfo(
    publicId,
    { description, alt },
    req.user.id
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'File info updated successfully',
    data: result
  });
});

const cleanupExpired = catchAsync(async (req, res) => {
  const result = await UploadService.cleanupExpiredFiles();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Expired files cleaned up',
    data: result
  });
});

export const UploadController = {
  uploadSingle,
  uploadMultiple,
  uploadProfileImage,
  uploadBookCover,
  deleteFile,
  getUserFiles,
  updateFileInfo,
  cleanupExpired
};