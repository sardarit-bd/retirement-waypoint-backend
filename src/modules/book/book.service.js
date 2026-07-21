import mongoose from "mongoose";
import { PDFDocument } from "pdf-lib";
import { Book } from "./book.model.js";
import ApiError from "../../utils/ApiError.js";
import UploadService from "../upload/upload.service.js";

// In-memory cache for generated preview PDFs.
// Keyed by `${bookId}_${updatedAt}_${endPage}` so it self-invalidates
// whenever the admin changes preview settings or replaces the PDF.
const PREVIEW_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PREVIEW_CACHE_MAX_ENTRIES = 200;
const previewCache = new Map();

function getCachedPreview(cacheKey) {
  const entry = previewCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    previewCache.delete(cacheKey);
    return null;
  }
  return entry.buffer;
}

function setCachedPreview(cacheKey, buffer) {
  if (previewCache.size >= PREVIEW_CACHE_MAX_ENTRIES) {
    const oldestKey = previewCache.keys().next().value;
    previewCache.delete(oldestKey);
  }
  previewCache.set(cacheKey, {
    buffer,
    expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS,
  });
}

class BookServiceClass {
  // Clamp preview end page so it can never exceed the book's actual page
  // count (and is never less than 1).
  clampPreviewEndPage(previewEndPage, pageCount) {
    if (previewEndPage == null) return previewEndPage;
    const count = Number(pageCount) || 1;
    return Math.min(Math.max(Number(previewEndPage), 1), count);
  }

  // Fetch the source PDF and build a new PDF containing only the first
  // `endPage` pages. This is real page-level enforcement (not CSS hiding) -
  // pages after the limit never exist in the bytes sent to the client.
  async generatePreviewBuffer(pdfUrl, endPage) {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new ApiError(502, "Failed to load book file for preview");
    }
    const arrayBuffer = await response.arrayBuffer();

    const sourceDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });
    const totalPages = sourceDoc.getPageCount();
    const safeEndPage = Math.max(1, Math.min(endPage, totalPages));

    const previewDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: safeEndPage }, (_, i) => i);
    const copiedPages = await previewDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => previewDoc.addPage(page));

    const bytes = await previewDoc.save();
    return Buffer.from(bytes);
  }

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

    // Clamp preview end page to the book's page count
    const previewEndPage = this.clampPreviewEndPage(
      bookData.previewEndPage,
      bookData.pageCount,
    );

    // Create book record
    const book = await Book.create({
      ...bookData,
      slug,
      ...(previewEndPage != null ? { previewEndPage } : {}),
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

    // Clamp preview end page against the (possibly updated) page count
    if (updateData.previewEndPage != null) {
      const effectivePageCount = updateData.pageCount ?? book.pageCount;
      updateData.previewEndPage = this.clampPreviewEndPage(
        updateData.previewEndPage,
        effectivePageCount,
      );
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
  // NOTE: excludes the raw PDF URL - the full book file must never reach
  // an unauthenticated client. Purchased users read via the signed
  // /my-books/:bookId/read|stream endpoints; everyone else only ever gets
  // the page-limited preview from getBookPreviewPdf below.
  async getBookBySlug(slug) {
    const book = await Book.findOne({
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    }).select("-pdfFile -pdfFilePublicId");

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    return book;
  }

  // Get a preview PDF (first N pages only) for a published book.
  // Pages beyond previewEndPage are never included in the generated
  // document, so there is nothing for the client to reach even if it
  // inspects the network response directly.
  async getBookPreviewPdf(slug) {
    const book = await Book.findOne({
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    }).select("title slug pdfFile pageCount previewEnabled previewEndPage updatedAt");

    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (!book.previewEnabled) {
      throw new ApiError(403, "Preview is not available for this book");
    }

    if (!book.pdfFile) {
      throw new ApiError(500, "Book PDF not available");
    }

    const endPage = this.clampPreviewEndPage(
      book.previewEndPage || 5,
      book.pageCount,
    );

    const cacheKey = `${book._id}_${book.updatedAt.getTime()}_${endPage}`;
    let buffer = getCachedPreview(cacheKey);

    if (!buffer) {
      buffer = await this.generatePreviewBuffer(book.pdfFile, endPage);
      setCachedPreview(cacheKey, buffer);
    }

    return {
      buffer,
      fileName: `${book.slug}-preview.pdf`,
      bookTitle: book.title,
    };
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