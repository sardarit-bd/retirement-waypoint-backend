/**
 * Retirement Waypoint - Payment Integration Verification Script
 * Validates Stripe bug fixes, PayPal service architecture, and schema integrity
 */

import PaymentService from "../modules/payment/payment.service.js";
import PayPalService from "../modules/payment/paypal.service.js";
import { isPayPalConfigured, PAYPAL_API_BASE, PAYPAL_MODE } from "../config/paypal.js";
import {
  createPayPalOrderValidation,
  capturePayPalOrderValidation,
} from "../modules/payment/payment.validation.js";
import { Order } from "../modules/order/order.model.js";
import { RefundRequest } from "../modules/refund/refundRequest.model.js";

async function runTests() {
  console.log("====================================================");
  console.log("🚀 RETIREMENT WAYPOINT - PAYMENT INTEGRATION TESTS");
  console.log("====================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Stripe Line Item Calculation (Fixing Issue A)
  console.log("--- TEST 1: Stripe Line Item Calculation ---");

  // Scenario 1A: Single book purchase ($29.99)
  const singleOrder = {
    _id: "660000000000000000000001",
    subtotal: 29.99,
    discountAmount: 0,
    totalAmount: 29.99,
    items: [
      {
        bookId: "book-1",
        bookTitle: "Retirement Waypoint Guide",
        bookPrice: 29.99,
      },
    ],
  };
  const singleLineItems = PaymentService.buildStripeLineItems(singleOrder);
  const singleSum = singleLineItems.reduce((sum, item) => sum + item.price_data.unit_amount, 0);
  assert(
    singleSum === 2999 && singleLineItems.length === 1,
    `Single book line items sum (${singleSum} cents) matches totalAmount (2999 cents)`
  );

  // Scenario 1B: Multiple books without discount ($20 + $30 = $50)
  // In the old buggy code, each item was charged $50 (total $100!).
  const multiOrderNoDiscount = {
    _id: "660000000000000000000002",
    subtotal: 50.00,
    discountAmount: 0,
    totalAmount: 50.00,
    items: [
      { bookId: "book-1", bookTitle: "Book A", bookPrice: 20.00 },
      { bookId: "book-2", bookTitle: "Book B", bookPrice: 30.00 },
    ],
  };
  const multiLineItemsNoDiscount = PaymentService.buildStripeLineItems(multiOrderNoDiscount);
  const multiSumNoDiscount = multiLineItemsNoDiscount.reduce(
    (sum, item) => sum + item.price_data.unit_amount,
    0
  );
  assert(
    multiSumNoDiscount === 5000,
    `Multi-book without coupon sum (${multiSumNoDiscount} cents) matches totalAmount (5000 cents)`
  );
  assert(
    multiLineItemsNoDiscount[0].price_data.unit_amount === 2000 &&
    multiLineItemsNoDiscount[1].price_data.unit_amount === 3000,
    `Individual item amounts are preserved correctly (2000 cents and 3000 cents)`
  );

  // Scenario 1C: Multiple books with coupon discount ($20 + $30 = $50, $10 off coupon -> $40 total)
  const multiOrderWithDiscount = {
    _id: "660000000000000000000003",
    subtotal: 50.00,
    discountAmount: 10.00,
    totalAmount: 40.00,
    items: [
      { bookId: "book-1", bookTitle: "Book A", bookPrice: 20.00 },
      { bookId: "book-2", bookTitle: "Book B", bookPrice: 30.00 },
    ],
  };
  const multiLineItemsWithDiscount = PaymentService.buildStripeLineItems(multiOrderWithDiscount);
  const multiSumWithDiscount = multiLineItemsWithDiscount.reduce(
    (sum, item) => sum + item.price_data.unit_amount,
    0
  );
  assert(
    multiSumWithDiscount === 4000,
    `Multi-book with coupon sum (${multiSumWithDiscount} cents) matches discounted totalAmount (4000 cents)`
  );

  // TEST 2: AuthService import verification in PaymentService (Fixing Issue B)
  console.log("\n--- TEST 2: AuthService & fulfillPaidOrder in PaymentService ---");
  assert(
    typeof PaymentService.fulfillPaidOrder === "function",
    "PaymentService.fulfillPaidOrder is defined as a universal fulfillment method"
  );
  assert(
    typeof PaymentService.handlePaymentSuccess === "function",
    "PaymentService.handlePaymentSuccess is retained for Stripe webhook compatibility"
  );

  // TEST 3: PayPal Configuration & Module Exports
  console.log("\n--- TEST 3: PayPal Config Module ---");
  assert(
    PAYPAL_MODE === "sandbox" || PAYPAL_MODE === "live",
    `PayPal mode is configured as '${PAYPAL_MODE}'`
  );
  assert(
    PAYPAL_API_BASE.startsWith("https://api-m."),
    `PayPal API Base URL is valid: ${PAYPAL_API_BASE}`
  );
  assert(
    typeof isPayPalConfigured === "function",
    "isPayPalConfigured() helper is exported"
  );

  // TEST 4: PayPal Validation Schemas
  console.log("\n--- TEST 4: Zod Validations for PayPal Endpoints ---");
  const validCreate = createPayPalOrderValidation.shape.body.safeParse({ orderId: "660000000000000000000001" });
  assert(validCreate.success, "createPayPalOrderValidation accepts valid orderId");

  const invalidCreate = createPayPalOrderValidation.shape.body.safeParse({ orderId: "" });
  assert(!invalidCreate.success, "createPayPalOrderValidation rejects empty orderId");

  const validCapture = capturePayPalOrderValidation.shape.body.safeParse({
    paypalOrderId: "PAYPAL-ORDER-12345",
    orderId: "660000000000000000000001",
  });
  assert(validCapture.success, "capturePayPalOrderValidation accepts valid payload");

  const invalidCapture = capturePayPalOrderValidation.shape.body.safeParse({});
  assert(!invalidCapture.success, "capturePayPalOrderValidation rejects missing paypalOrderId");

  // TEST 5: PayPalService Methods
  console.log("\n--- TEST 5: PayPalService Interface ---");
  assert(typeof PayPalService.createOrder === "function", "PayPalService.createOrder is implemented");
  assert(typeof PayPalService.captureOrder === "function", "PayPalService.captureOrder is implemented");
  assert(typeof PayPalService.verifyWebhookSignature === "function", "PayPalService.verifyWebhookSignature is implemented");
  assert(typeof PayPalService.handleWebhookEvent === "function", "PayPalService.handleWebhookEvent is implemented");
  assert(typeof PayPalService.refundCapture === "function", "PayPalService.refundCapture is implemented");

  // TEST 6: Mongoose Schema Model Verification
  console.log("\n--- TEST 6: Schema Path Verification ---");
  const orderPaths = Order.schema.paths;
  assert("paypalOrderId" in orderPaths, "Order schema includes 'paypalOrderId'");
  assert("paypalCaptureId" in orderPaths, "Order schema includes 'paypalCaptureId'");
  assert("paypalPayerEmail" in orderPaths, "Order schema includes 'paypalPayerEmail'");
  assert("stripeSessionId" in orderPaths, "Order schema retains 'stripeSessionId'");
  assert("stripePaymentIntentId" in orderPaths, "Order schema retains 'stripePaymentIntentId'");

  const refundPaths = RefundRequest.schema.paths;
  assert("paypalRefundId" in refundPaths, "RefundRequest schema includes 'paypalRefundId'");
  assert("stripeRefundId" in refundPaths, "RefundRequest schema retains 'stripeRefundId'");

  console.log("\n====================================================");
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
