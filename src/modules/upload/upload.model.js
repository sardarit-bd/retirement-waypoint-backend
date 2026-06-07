import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true,
    unique: true
  },
  fileType: {
    type: String,
    enum: ['image', 'document', 'video', 'other'],
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  folder: {
    type: String,
    default: 'general'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    description: String,
    alt: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ publicId: 1 });
uploadSchema.index({ fileType: 1 });
uploadSchema.index({ folder: 1 });

uploadSchema.virtual('fileSizeMB').get(function() {
  return (this.size / (1024 * 1024)).toFixed(2);
});

uploadSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  await this.save();
  return this;
};

const Upload = mongoose.model('Upload', uploadSchema);
export default Upload;