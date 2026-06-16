import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import PaymentService from "./payment.service.js";
import ApiError from "../../utils/ApiError.js";

const createCheckoutSession = catchAsync(async (req, res) => {
  const { orderId } = req.body;
  console.log("REQ ORDER ID =", orderId);
  console.log("USER ID =", req.user.id);
  const result = await PaymentService.createCheckoutSession(
    orderId,
    req.user.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Checkout session created successfully",
    data: result,
  });
});

const retryPayment = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await PaymentService.retryPayment(orderId, req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment retry session created successfully",
    data: result,
  });
});

const webhookHandler = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new ApiError(400, "Stripe signature header is missing");
  }

  // req.body is a Buffer because app.js uses express.raw() for this path
  const event = await PaymentService.verifyWebhookSignature(
    req.body,  // ✅ Buffer from express.raw() — NOT req.rawBody
    signature,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      console.log(`✅ Webhook: checkout.session.completed for ${event.data.object.id}`);
      const result = await PaymentService.handlePaymentSuccess(event.data.object);
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    }

    case "payment_intent.payment_failed": {
      console.log(`❌ Webhook: payment_intent.payment_failed for ${event.data.object.id}`);
      const result = await PaymentService.handlePaymentFailure(event.data.object);
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    }

    case "charge.refunded": {
      console.log(`🔄 Webhook: charge.refunded for ${event.data.object.id}`);
      const result = await PaymentService.handleRefund(event.data.object);
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    }

    default: {
      console.log(`ℹ️ Unhandled webhook event: ${event.type}`);
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        message: `Webhook received: ${event.type}`,
        data: { received: true },
      });
    }
  }
});

export const PaymentController = {
  createCheckoutSession,
  retryPayment,
  webhookHandler,
};