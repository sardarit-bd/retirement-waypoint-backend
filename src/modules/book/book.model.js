import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Book description is required"],
      trim: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, "Book cover image is required"],
    },
    coverImagePublicId: {
      type: String,
      required: true,
      select: false,
    },
    pdfFile: {
      type: String,
      required: [true, "Book PDF file is required"],
    },
    pdfFilePublicId: {
      type: String,
      required: true,
      select: false,
    },
    price: {
      type: Number,
      required: [true, "Book price is required"],
      min: [0, "Price cannot be negative"],
    },
    pageCount: {
      type: Number,
      required: [true, "Page count is required"],
      min: [1, "Page count must be at least 1"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create compound indexes for better performance
bookSchema.index({ status: 1, deletedAt: 1 });
bookSchema.index({ featured: 1, status: 1, deletedAt: 1 });
bookSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug from title
bookSchema.pre("save", function () {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});
// Virtual for isPublished
bookSchema.virtual("isPublished").get(function () {
  return this.status === "PUBLISHED" && !this.deletedAt;
});

// Virtual for isArchived
bookSchema.virtual("isArchived").get(function () {
  return this.status === "ARCHIVED";
});

// Ensure virtuals are included in JSON output
bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

export const Book = mongoose.model("Book", bookSchema);
