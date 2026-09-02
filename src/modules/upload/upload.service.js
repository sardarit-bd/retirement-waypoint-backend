import { Readable } from 'stream';
import cloudinary from '../../config/cloudinary.js';
import ApiError from '../../utils/ApiError.js';

class UploadServiceClass {
  /**
   * Upload single file buffer to Cloudinary
   */
  async uploadFile(fileOrBuffer, userId, options = {}) {
    // If options was passed as second argument
    let actualOptions = options;
    let actualUserId = userId;

    if (typeof userId === 'object' && !options.folder) {
      actualOptions = userId;
      actualUserId = null;
    }

    const buffer = Buffer.isBuffer(fileOrBuffer)
      ? fileOrBuffer
      : fileOrBuffer?.buffer;

    if (!buffer) {
      throw new ApiError(400, 'No valid file buffer provided for upload');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: actualOptions.folder || 'retirement-waypoint/uploads',
        resource_type: actualOptions.resource_type || 'auto',
        public_id: actualOptions.public_id,
        transformation: actualOptions.transformations || [],
        ...actualOptions,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload stream error:', error);
            reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration,
              resourceType: result.resource_type,
            });
          }
        },
      );

      // Stream buffer into Cloudinary uploadStream
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultipleFiles(files = [], userId, options = {}) {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files provided');
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, userId, options)
        .then((result) => ({ status: 'fulfilled', value: result }))
        .catch((error) => ({ status: 'rejected', reason: error.message }))
    );

    const results = await Promise.all(uploadPromises);

    const successful = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason);

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId) {
    if (!publicId) {
      throw new ApiError(400, 'Public ID is required');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Cloudinary delete failed for ${publicId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Upload with custom validation
   */
  async uploadFileWithValidation(file, options = {}) {
    if (!file || (!file.buffer && !Buffer.isBuffer(file))) {
      throw new ApiError(400, 'Invalid file provided');
    }

    // Validate file size if specified
    if (options.maxSize && file.size > options.maxSize) {
      const sizeInMB = (options.maxSize / (1024 * 1024)).toFixed(0);
      throw new ApiError(400, `File size must be less than ${sizeInMB}MB`);
    }

    // Validate file type if specified
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      throw new ApiError(
        400,
        `Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`,
      );
    }

    return this.uploadFile(file, options);
  }
}

const UploadService = new UploadServiceClass();
export default UploadService;