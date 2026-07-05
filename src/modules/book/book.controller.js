import mongoose from "mongoose";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import BookService from "./book.service.js";
import ApiError from "../../utils/ApiError.js";

const createBook = catchAsync(async (req, res) => {
  const coverImage = req.files?.coverImage?.[0];
  const pdfFile = req.files?.pdfFile?.[0];

  if (!coverImage) {
    throw new ApiError(400, "Book cover image is required");
  }

  if (!pdfFile) {
    throw new ApiError(400, "Book PDF file is required");
  }

  const book = await BookService.createBook(
    req.body,
    coverImage,
    pdfFile,
    req.user.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Book created successfully",
    data: book,
  });
});

const updateBook = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Validate if ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book ID format");
  }
  
  const coverImage = req.files?.coverImage?.[0] || null;
  const pdfFile = req.files?.pdfFile?.[0] || null;

  const book = await BookService.updateBook(id, req.body, coverImage, pdfFile);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book updated successfully",
    data: book,
  });
});

const getBookById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Validate if ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book ID format");
  }
  
  const book = await BookService.getBookById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book retrieved successfully",
    data: book,
  });
});

const getAllBooks = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await BookService.getAllBooks(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Books retrieved successfully",
    data: result.books,
    meta: result.pagination,
  });
});

const publishBook = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book ID format");
  }
  
  const book = await BookService.publishBook(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book published successfully",
    data: book,
  });
});

const archiveBook = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book ID format");
  }
  
  const book = await BookService.archiveBook(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book archived successfully",
    data: book,
  });
});

const deleteBook = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid book ID format");
  }
  
  const result = await BookService.deleteBook(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: result.message,
    data: null,
  });
});

// Public controllers
const getPublicBooks = catchAsync(async (req, res) => {
  const query = req.validatedQuery || req.query;
  const result = await BookService.getPublicBooks(query);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Books retrieved successfully",
    data: result.books,
    meta: result.pagination,
  });
});

const getFeaturedBooks = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const books = await BookService.getFeaturedBooks(limit);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Featured books retrieved successfully",
    data: books,
  });
});

const getPublicBookBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const book = await BookService.getBookBySlug(slug);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Book retrieved successfully",
    data: book,
  });
});

export const BookController = {
  createBook,
  updateBook,
  getBookById,
  getAllBooks,
  publishBook,
  archiveBook,
  deleteBook,
  getPublicBooks,
  getFeaturedBooks,
  getPublicBookBySlug,
};