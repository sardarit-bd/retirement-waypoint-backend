import mongoose from "mongoose";
import { Book } from "./book.model.js";
import ApiError from "../../utils/ApiError.js";
import UploadService from "../upload/upload.service.js";

class BookServiceClass {
  // Helper to generate unique slug
  async generateUniqueSlug(title, existingId = null) {
    let slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const query = { slug: uniqueSlug };
      if (existingId && mongoose.Types.ObjectId.isValid(existingId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(existingId) };
      }

      const existingBook = await Book.findOne(query);
      if (!existingBook) break;

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  // Create book with files (uses UploadService)
  async createBook(bookData, coverFile, pdfFile, userId) {
    // Upload cover image using UploadService
    const coverUpload = await UploadService.uploadFileWithValidation(
      coverFile,
      {
        folder: "retirement-waypoint/books/covers",
        resource_type: "image",
        allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxSize: 5 * 1024 * 1024, // 5MB
        transformations: [
          { width: 600, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      }
    );

    // Upload PDF file using UploadService
    const pdfUpload = await UploadService.uploadFileWithValidation(pdfFile, {
      folder: "retirement-waypoint/books/pdfs",
      resource_type: "raw",
      allowedTypes: ["application/pdf"],
      maxSize: 50 * 1024 * 1024, // 50MB
    });

    // Generate unique slug
    const slug = await this.generateUniqueSlug(bookData.title);

    // Create book record
    const book = await Book.create({
      ...bookData,
      slug,
      coverImage: coverUpload.url,
      coverImagePublicId: coverUpload.publicId,
      pdfFile: pdfUpload.url,
      pdfFilePublicId: pdfUpload.publicId,
      status: bookData.status || "DRAFT",
      publishedAt: bookData.status === "PUBLISHED" ? new Date() : null,
    });

    return book;
  }

  // Update book with optional file updates
  async updateBook(bookId, updateData, coverFile = null, pdfFile = null) {
    const book = await Book.findById(bookId);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    // Handle cover image update using UploadService
    if (coverFile) {
      // Delete old cover
      if (book.coverImagePublicId) {
        await UploadService.deleteFile(book.coverImagePublicId);
      }

      // Upload new cover
      const coverUpload = await UploadService.uploadFileWithValidation(
        coverFile,
        {
          folder: "retirement-waypoint/books/covers",
          resource_type: "image",
          allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
          maxSize: 5 * 1024 * 1024,
          transformations: [
            { width: 600, height: 800, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        }
      );

      updateData.coverImage = coverUpload.url;
      updateData.coverImagePublicId = coverUpload.publicId;
    }

    // Handle PDF update using UploadService
    if (pdfFile) {
      // Delete old PDF
      if (book.pdfFilePublicId) {
        await UploadService.deleteFile(book.pdfFilePublicId);
      }

      // Upload new PDF
      const pdfUpload = await UploadService.uploadFileWithValidation(pdfFile, {
        folder: "retirement-waypoint/books/pdfs",
        resource_type: "raw",
        allowedTypes: ["application/pdf"],
        maxSize: 50 * 1024 * 1024,
      });

      updateData.pdfFile = pdfUpload.url;
      updateData.pdfFilePublicId = pdfUpload.publicId;
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== book.title) {
      updateData.slug = await this.generateUniqueSlug(updateData.title, bookId);
    }

    // Handle status change to PUBLISHED
    if (updateData.status === "PUBLISHED" && book.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    // Update book (Note: Soft delete does NOT delete Cloudinary files)
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return updatedBook;
  }

  // Get book by ID
  async getBookById(bookId, includeDeleted = false) {
    const query = { _id: bookId };
    if (!includeDeleted) {
      query.deletedAt = null;
    }

    const book = await Book.findOne(query);
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    return book;
  }

  // Get book by slug (only published)
  async getBookBySlug(slug) {
    const book = await Book.findOne({
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    });

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    return book;
  }

  // Get all books with filters (admin)
  async getAllBooks(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      featured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter = { deletedAt: null };

    if (status) {
      filter.status = status;
    }

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { authorName: searchRegex },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [books, total] = await Promise.all([
      Book.find(filter).sort(sort).skip(skip).limit(limitNumber),
      Book.countDocuments(filter),
    ]);

    return {
      books,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  // Get public books (published only)
  async getPublicBooks(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      featured,
      sortBy = "publishedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter - only published and not deleted
    const filter = {
      status: "PUBLISHED",
      deletedAt: null,
    };

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { authorName: searchRegex },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query (exclude PDF file for public)
    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .select("-pdfFile -pdfFilePublicId"),
      Book.countDocuments(filter),
    ]);

    return {
      books,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: pageNumber * limitNumber < total,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  // Get featured books (public)
  async getFeaturedBooks(limit = 4) {
    const books = await Book.find({
      status: "PUBLISHED",
      deletedAt: null,
      featured: true,
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select("-pdfFile -pdfFilePublicId");

    return books;
  }

  // Publish book
  async publishBook(bookId) {
    const book = await this.getBookById(bookId);

    if (book.status === "PUBLISHED") {
      throw new ApiError(400, "Book is already published");
    }

    book.status = "PUBLISHED";
    book.publishedAt = new Date();
    await book.save();

    return book;
  }

  // Archive book
  async archiveBook(bookId) {
    const book = await this.getBookById(bookId);

    if (book.status === "ARCHIVED") {
      throw new ApiError(400, "Book is already archived");
    }

    book.status = "ARCHIVED";
    await book.save();

    return book;
  }

  // Soft delete book (NOTE: Does NOT delete Cloudinary files)
  async deleteBook(bookId) {
    const book = await this.getBookById(bookId);

    if (book.deletedAt) {
      throw new ApiError(400, "Book is already deleted");
    }

    book.deletedAt = new Date();
    await book.save();

    return { success: true, message: "Book deleted successfully" };
  }
}

const BookService = new BookServiceClass();
export default BookService;