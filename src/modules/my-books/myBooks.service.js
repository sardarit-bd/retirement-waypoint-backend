import mongoose from "mongoose";
import { Purchase } from "../purchase/purchase.model.js";
import { DownloadLog } from "../download/downloadLog.model.js";
import { Book } from "../book/book.model.js";
import { Order } from "../order/order.model.js";
import { Invoice } from "../invoice/invoice.model.js";
import ApiError from "../../utils/ApiError.js";
import cloudinary from "../../config/cloudinary.js";

class MyBooksServiceClass {
  /**
   * Check if user has purchased a book (REUSABLE HELPER)
   * This will be used by Review Module later
   */
  async hasPurchasedBook(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    return !!purchase;
  }

  /**
   * Get purchase by user and book
   */
  async getPurchaseByUserAndBook(userId, bookId) {
    const purchase = await Purchase.findOne({
      userId,
      bookId,
      accessStatus: "ACTIVE",
    });
    return purchase;
  }

  /**
   * Get all books purchased by user
   */
  async getUserBooks(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "purchasedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // Get all purchases for user with ACTIVE access
    const filter = {
      userId,
      accessStatus: "ACTIVE",
    };

    const sort = {};
    sort[sortBy === "purchasedAt" ? "purchasedAt" : "createdAt"] = 
      sortOrder === "asc" ? 1 : -1;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate("orderId"),
      Purchase.countDocuments(filter),
    ]);

    if (purchases.length === 0) {
      return {
        books: [],
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    // Get all book IDs
    const bookIds = purchases.map((p) => p.bookId);

    // Fetch books
    let bookFilter = { _id: { $in: bookIds } };
    
    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      bookFilter = {
        ...bookFilter,
        $or: [
          { title: searchRegex },
          { authorName: searchRegex },
        ],
      };
    }

    const books = await Book.find(bookFilter).select("-pdfFile -pdfFilePublicId");

    // Create book map for quick lookup
    const bookMap = new Map();
    books.forEach((book) => {
      bookMap.set(book._id.toString(), book);
    });

    // Get invoices for each purchase
    const invoicePromises = purchases.map((purchase) =>
      Invoice.findOne({ orderId: purchase.orderId }).select("invoiceNumber")
    );
    const invoices = await Promise.all(invoicePromises);
    const invoiceMap = new Map();
    invoices.forEach((invoice, index) => {
      if (invoice) {
        invoiceMap.set(purchases[index].orderId.toString(), invoice.invoiceNumber);
      }
    });

    // Build enriched book list
    const enrichedBooks = purchases
      .map((purchase) => {
        const book = bookMap.get(purchase.bookId);
        if (!book) return null;

        const order = purchase.orderId;
        const invoiceNumber = invoiceMap.get(order?._id?.toString()) || null;

        return {
          bookId: book._id,
          title: book.title,
          authorName: book.authorName,
          coverImage: book.coverImage,
          price: book.price,
          pageCount: book.pageCount,
          description: book.description,
          featured: book.featured,
          purchasedAt: purchase.purchasedAt,
          accessStatus: purchase.accessStatus,
          orderNumber: order?.orderNumber || null,
          invoiceNumber: invoiceNumber,
          purchaseId: purchase._id,
        };
      })
      .filter((book) => book !== null);

    // Apply search filter (additional filtering if needed)
    let filteredBooks = enrichedBooks;
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      filteredBooks = enrichedBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchLower) ||
          book.authorName.toLowerCase().includes(searchLower)
      );
    }

    // Sort filtered books
    if (sortBy === "title") {
      filteredBooks.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return sortOrder === "asc" ? comparison : -comparison;
      });
    } else if (sortBy === "authorName") {
      filteredBooks.sort((a, b) => {
        const comparison = a.authorName.localeCompare(b.authorName);
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return {
      books: filteredBooks,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: filteredBooks.length,
        totalPages: Math.ceil(filteredBooks.length / limitNumber),
        hasNextPage: pageNumber * limitNumber < filteredBooks.length,
        hasPrevPage: pageNumber > 1,
      },
    };
  }

  /**
   * Get single purchased book with details
   */
  async getUserBookById(userId, bookId) {
    // Verify purchase
    const purchase = await this.getPurchaseByUserAndBook(userId, bookId);
    if (!purchase) {
      throw new ApiError(404, "Book not found in your library");
    }

    // Get book details
    const book = await Book.findById(bookId).select("-pdfFile -pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    // Get order and invoice
    const order = await Order.findById(purchase.orderId);
    const invoice = await Invoice.findOne({ orderId: purchase.orderId }).select(
      "invoiceNumber"
    );

    return {
      bookId: book._id,
      title: book.title,
      slug: book.slug,
      description: book.description,
      authorName: book.authorName,
      coverImage: book.coverImage,
      price: book.price,
      pageCount: book.pageCount,
      featured: book.featured,
      purchasedAt: purchase.purchasedAt,
      accessStatus: purchase.accessStatus,
      orderNumber: order?.orderNumber || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      purchaseId: purchase._id,
    };
  }

  /**
   * Generate secure download URL for book
   */
  async generateSecureDownloadUrl(userId, bookId, ipAddress, userAgent) {
    // Verify purchase
    const purchase = await this.getPurchaseByUserAndBook(userId, bookId);
    if (!purchase) {
      throw new ApiError(403, "You don't have access to this book");
    }

    // Get book with PDF details
    const book = await Book.findById(bookId).select("+pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (!book.pdfFilePublicId) {
      throw new ApiError(500, "Book PDF not available");
    }

    // Generate signed URL with 15-minute expiry
    const signedUrl = cloudinary.url(book.pdfFilePublicId, {
      resource_type: "raw",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    });

    // Log download
    await DownloadLog.create({
      userId,
      bookId,
      purchaseId: purchase._id,
      ipAddress,
      userAgent,
      downloadedAt: new Date(),
    });

    return {
      downloadUrl: signedUrl,
      expiresIn: "15 minutes",
      bookTitle: book.title,
      fileName: `${book.slug}.pdf`,
    };
  }

  /**
   * Generate secure read URL for PDF viewer (longer expiry)
   */
  async generateReadUrl(userId, bookId) {
    // Verify purchase
    const purchase = await this.getPurchaseByUserAndBook(userId, bookId);
    if (!purchase) {
      throw new ApiError(403, "You don't have access to this book");
    }

    // Get book with PDF details
    const book = await Book.findById(bookId).select("+pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (!book.pdfFilePublicId) {
      throw new ApiError(500, "Book PDF not available");
    }

    // Generate signed URL with longer expiry for reading
    const signedUrl = cloudinary.url(book.pdfFilePublicId, {
      resource_type: "raw",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    return {
      pdfUrl: signedUrl,
      expiresIn: "1 hour",
      bookTitle: book.title,
      bookId: book._id,
      purchaseId: purchase._id,
    };
  }

  /**
   * Stream PDF directly (with tracking)
   */
  async streamBookPdf(userId, bookId, ipAddress, userAgent) {
    // Verify purchase
    const purchase = await this.getPurchaseByUserAndBook(userId, bookId);
    if (!purchase) {
      throw new ApiError(403, "You don't have access to this book");
    }

    // Get book with PDF details
    const book = await Book.findById(bookId).select("+pdfFilePublicId");
    if (!book) {
      throw new ApiError(404, "Book not found");
    }

    if (!book.pdfFilePublicId) {
      throw new ApiError(500, "Book PDF not available");
    }

    // Get the PDF URL (Cloudinary direct URL)
    const pdfUrl = cloudinary.url(book.pdfFilePublicId, {
      resource_type: "raw",
      secure: true,
    });

    // Log download
    await DownloadLog.create({
      userId,
      bookId,
      purchaseId: purchase._id,
      ipAddress,
      userAgent,
      downloadedAt: new Date(),
    });

    return {
      pdfUrl,
      fileName: `${book.slug}.pdf`,
      purchaseId: purchase._id,
    };
  }

  /**
   * Get download logs for admin
   */
  async getDownloadLogs(query = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      bookId,
      sortBy = "downloadedAt",
      sortOrder = "desc",
    } = query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    if (userId) filter.userId = userId;
    if (bookId) filter.bookId = bookId;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [logs, total] = await Promise.all([
      DownloadLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate({
          path: "purchaseId",
          select: "userId bookId orderId",
        }),
      DownloadLog.countDocuments(filter),
    ]);

    // Enrich with book and user details
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const book = await Book.findById(log.bookId).select(
          "title authorName coverImage"
        );
        return {
          ...log.toObject(),
          book,
        };
      })
    );

    return {
      logs: enrichedLogs,
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

  /**
   * Get download statistics for admin
   */
  async getDownloadStats(query = {}) {
    const { bookId, startDate, endDate } = query;

    const filter = {};
    if (bookId) filter.bookId = bookId;
    if (startDate || endDate) {
      filter.downloadedAt = {};
      if (startDate) filter.downloadedAt.$gte = new Date(startDate);
      if (endDate) filter.downloadedAt.$lte = new Date(endDate);
    }

    const stats = await DownloadLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            bookId: "$bookId",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$downloadedAt" } },
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $group: {
          _id: "$_id.bookId",
          totalDownloads: { $sum: "$count" },
          uniqueUsers: { $sum: { $size: "$uniqueUsers" } },
          dailyData: {
            $push: {
              date: "$_id.date",
              count: "$count",
            },
          },
        },
      },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      {
        $unwind: {
          path: "$book",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          bookId: "$_id",
          bookTitle: "$book.title",
          bookAuthor: "$book.authorName",
          totalDownloads: 1,
          uniqueUsers: 1,
          dailyData: 1,
        },
      },
    ]);

    return stats;
  }
}

const MyBooksService = new MyBooksServiceClass();
export default MyBooksService;