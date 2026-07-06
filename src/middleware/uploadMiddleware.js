import multer from "multer";
import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      ),
      false,
    );
  }
};

export const uploadConfig = {
  images: multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ]),
  }),

  documents: multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  }),

  videos: multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: fileFilter(["video/mp4", "video/mpeg", "video/quicktime"]),
  }),
};

export const uploadSingle = (fieldName, type = "images") => {
  const uploader = uploadConfig[type];
  return uploader.single(fieldName);
};

export const uploadMultiple = (fieldName, maxCount = 10, type = "images") => {
  const uploader = uploadConfig[type];
  return uploader.array(fieldName, maxCount);
};

export const uploadFields = (fields, type = "images") => {
  const uploader = uploadConfig[type];
  return uploader.fields(fields);
};

export const uploadAny = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/", "application/pdf", "video/"];
    const isValid = allowed.some((type) => file.mimetype.startsWith(type));
    if (isValid) {
      cb(null, true);
    } else {
      cb(new ApiError(400, "File type not supported"), false);
    }
  },
});

// Add to existing file
export const bookFilesUpload = (req, res, next) => {
  const upload = multer({
    storage,
    limits: { fileSize: 55 * 1024 * 1024 }, // 55MB total (5MB cover + 50MB PDF)
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith("image/");
      const isPdf = file.mimetype === "application/pdf";

      if (isImage || isPdf) {
        cb(null, true);
      } else {
        cb(new ApiError(400, "Only images and PDF files are allowed"), false);
      }
    },
  }).fields([
    { name: "coverImage", maxCount: 1 },
    { name: "pdfFile", maxCount: 1 },
  ]);

  upload(req, res, (err) => {
    if (err) {
      return next(new ApiError(400, err.message));
    }
    next();
  });
};

// Pre-configured middleware for specific use cases
export const profileImageUpload = uploadConfig.images.single("image");
export const bookCoverUpload = uploadConfig.images.single("cover");
export const bookGalleryUpload = uploadConfig.images.array("gallery", 10);
export const multipleImagesUpload = uploadConfig.images.array("images", 10);
export const documentUpload = uploadConfig.documents.single("document");
export const multipleDocumentsUpload = uploadConfig.documents.array(
  "documents",
  5,
);
export const videoUpload = uploadConfig.videos.single("video");
export const avatarUpload = profileImageUpload;

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadAny,
  profileImageUpload,
  bookCoverUpload,
  bookGalleryUpload,
  multipleImagesUpload,
  documentUpload,
  multipleDocumentsUpload,
  videoUpload,
  avatarUpload,
  uploadConfig,
};
