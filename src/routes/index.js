import express from 'express';
import { UploadRoutes } from '../modules/upload/upload.routes.js'
import {BookRoutes, PublicBookRoutes} from '../modules/book/book.routes.js'
import { OrderRoutes } from '../modules/order/order.routes.js';
import { PurchaseRoutes } from '../modules/purchase/purchase.routes.js';
import { PaymentRoutes } from '../modules/payment/payment.routes.js';
import { InvoiceRoutes } from '../modules/invoice/invoice.routes.js';
import { MyBooksRoutes } from '../modules/my-books/myBooks.routes.js';
import { ReviewRoutes } from '../modules/review/review.routes.js';
import { CouponRoutes } from '../modules/coupon/coupon.routes.js';
import { AnalyticsRoutes } from '../modules/analytics/analytics.routes.js';
import { RefundRoutes } from '../modules/refund/refund.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


router.use('/upload', UploadRoutes);
router.use('/books', BookRoutes);
router.use('/public/books', PublicBookRoutes);
router.use('/orders', OrderRoutes);
router.use('/purchases', PurchaseRoutes);
router.use('/payments', PaymentRoutes);
router.use('/invoices', InvoiceRoutes);
router.use('/my-books', MyBooksRoutes);
router.use('/reviews', ReviewRoutes);
router.use('/coupons', CouponRoutes);
router.use('/admin/analytics', AnalyticsRoutes);
router.use('/refunds', RefundRoutes);

export default router;