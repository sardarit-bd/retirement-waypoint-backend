import { Readable } from 'stream';
import cloudinary from '../../config/cloudinary.js';
import Upload from './upload.model.js';
import ApiError from '../../utils/ApiError.js';

class UploadServiceClass {
  async uploadToCloudinary(fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: options.folder || 'retirement-waypoint/uploads',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        transformation: options.transformation || [],
        ...options
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
              resourceType: result.resource_type
            });
          }
        }
      );

      Readable.from(fileBuffer).pipe(uploadStream);
    });
  }

  async saveUploadRecord(uploadData, userId) {
    const upload = await Upload.create({
      filename: uploadData.publicId.split('/').pop(),
      originalName: uploadData.originalName,
      url: uploadData.url,
      publicId: uploadData.publicId,
      fileType: uploadData.fileType,
      mimeType: uploadData.mimeType,
      size: uploadData.size,
      folder: uploadData.folder,
      uploadedBy: userId,
      metadata: {
        width: uploadData.width,
        height: uploadData.height,
        duration: uploadData.duration,
        description: uploadData.description,
        alt: uploadData.alt
      }
    });

    return upload;
  }

  async uploadFile(file, userId, options = {}) {
    const validation = this.validateFile(file, options);
    if (!validation.isValid) {
      throw new ApiError(400, validation.error);
    }

    const cloudinaryResult = await this.uploadToCloudinary(file.buffer, {
      folder: options.folder,
      transformation: options.transformations
    });

    const dbRecord = await this.saveUploadRecord({
      ...cloudinaryResult,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileType: this.getFileType(file.mimetype),
      folder: options.folder || 'general',
      description: options.description,
      alt: options.alt,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      duration: cloudinaryResult.duration
    }, userId);

    return {
      _id: dbRecord._id,
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      filename: dbRecord.filename,
      originalName: dbRecord.originalName,
      size: cloudinaryResult.size,
      fileType: dbRecord.fileType,
      metadata: dbRecord.metadata,
      createdAt: dbRecord.createdAt
    };
  }

  async uploadMultipleFiles(files, userId, options = {}) {
    const results = {
      successful: [],
      failed: []
    };

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, userId, options);
        results.successful.push(result);
      } catch (error) {
        results.failed.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    return results;
  }

  async deleteFile(publicId, userId, isAdmin = false) {
    const uploadRecord = await Upload.findOne({ publicId });
    
    if (!uploadRecord) {
      throw new ApiError(404, 'File not found');
    }

    if (!isAdmin && uploadRecord.uploadedBy.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to delete this file');
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);
    
    if (cloudinaryResult.result !== 'ok') {
      throw new ApiError(500, 'Failed to delete file from cloud storage');
    }

    await uploadRecord.softDelete();

    return {
      success: true,
      message: 'File deleted successfully',
      publicId
    };
  }

  async getUserFiles(userId, query = {}) {
    const { page = 1, limit = 20, fileType, folder } = query;
    
    const filter = {
      uploadedBy: userId,
      isDeleted: false
    };
    
    if (fileType) filter.fileType = fileType;
    if (folder) filter.folder = folder;
    
    const skip = (page - 1) * limit;
    
    const [files, total] = await Promise.all([
      Upload.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Upload.countDocuments(filter)
    ]);
    
    return {
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
      }
    };
  }

  validateFile(file, options = {}) {
    const maxSize = options.maxSize || 5; // MB
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }
    
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return { isValid: false, error: `File size exceeds ${maxSize}MB (Current: ${sizeInMB.toFixed(2)}MB)` };
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      return { isValid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
    }
    
    return { isValid: true };
  }

  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf' || mimeType.includes('document')) return 'document';
    return 'other';
  }

  async updateFileInfo(publicId, updateData, userId) {
    const uploadRecord = await Upload.findOne({ publicId });
    
    if (!uploadRecord) {
      throw new ApiError(404, 'File not found');
    }
    
    if (uploadRecord.uploadedBy.toString() !== userId.toString()) {
      throw new ApiError(403, 'You are not authorized to update this file');
    }
    
    if (updateData.description) uploadRecord.metadata.description = updateData.description;
    if (updateData.alt) uploadRecord.metadata.alt = updateData.alt;
    
    await uploadRecord.save();
    
    return uploadRecord;
  }

  async cleanupExpiredFiles() {
    const result = await Upload.updateMany(
      {
        expiresAt: { $lte: new Date() },
        isDeleted: false
      },
      {
        isDeleted: true
      }
    );
    
    return {
      cleaned: result.modifiedCount,
      message: `${result.modifiedCount} expired files cleaned up`
    };
  }
}

const UploadService = new UploadServiceClass();
export default UploadService;