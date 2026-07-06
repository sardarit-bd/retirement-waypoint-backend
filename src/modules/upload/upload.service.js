import { Readable } from 'stream';
import cloudinary from '../../config/cloudinary.js';
import ApiError from '../../utils/ApiError.js';

class UploadServiceClass {
  async uploadFile(fileBuffer, options = {}) {
    if (!fileBuffer) {
      throw new ApiError(400, 'No file buffer provided');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'retirement-waypoint/uploads',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        transformation: options.transformations || [],
        ...options,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
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

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

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

  async uploadFileWithValidation(file, options = {}) {
    if (!file || !file.buffer) {
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

    return this.uploadFile(file.buffer, options);
  }
}

const UploadService = new UploadServiceClass();
export default UploadService;