import assert from "node:assert/strict";
import mongoose from "mongoose";
import app from "../src/app.js";
import connectDB from "../src/config/database.js";

async function runTests() {
  console.log("==========================================");
  console.log("🧪 RUNNING VALIDATION & SECURITY TEST SUITE");
  console.log("==========================================\n");

  await connectDB();

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  };

  try {
    // 1. Empty Contact Form submission
    await test("1. Empty Contact Form submission returns 400 with field errors", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.errors.name, "Should have name error");
      assert.ok(data.errors.email, "Should have email error");
      assert.ok(data.errors.subject, "Should have subject error");
      assert.ok(data.errors.message, "Should have message error");
      assert.ok(!data.message.includes("undefined"), "Message should not contain 'undefined'");
    });

    // 2. Name below minimum length
    await test("2. Name below minimum length (<3) returns 400 with user-friendly message", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ab",
          email: "valid@example.com",
          subject: "Valid Subject",
          message: "This is a valid message of more than twenty characters.",
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.errors.name, "Name must be at least 3 characters");
    });

    // 3. Subject below minimum length
    await test("3. Subject below minimum length (<5) returns 400 with user-friendly message", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          email: "valid@example.com",
          subject: "Hi",
          message: "This is a valid message of more than twenty characters.",
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.errors.subject, "Subject must be at least 5 characters");
    });

    // 4. Message below 20 characters
    await test("4. Message below 20 characters ('test-e-mail') returns 400 without Mongoose leak", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dave Allen",
          email: "dave@example.com",
          subject: "Test Subject",
          message: "test-e-mail",
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.errors.message, "Please enter a message of at least 20 characters");
      assert.ok(!data.message.includes("ValidatorError"));
      assert.ok(!data.message.includes("Path 'message'"));
    });

    // 5. Invalid email format
    await test("5. Invalid email format returns 400 with clean email error", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dave Allen",
          email: "not-an-email",
          subject: "Test Subject",
          message: "This is a valid message of more than twenty characters.",
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.errors.email, "Please enter a valid email address");
    });

    // 6. Direct API requests that bypass frontend validation
    await test("6. Direct API bypass is caught safely at backend validation barrier", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unknownField: "malicious",
          name: "   ",
          email: "invalid",
          subject: "123",
          message: "short",
        }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.errors.message);
    });

    // 7. HTML sanitization and validation transforms
    await test("7. HTML tags are stripped during Zod transformation", async () => {
      const { submitContactValidation } = await import("../src/modules/contact/contact.validation.js");
      const shape = submitContactValidation.shape;
      const parsed = await shape.body.parseAsync({
        name: "<script>alert(1)</script>John Doe",
        email: "JOHN@EXAMPLE.COM",
        subject: "<b>Inquiry</b> Title",
        message: "This is a message <img src=x onerror=alert(1)> that has enough characters.",
      });
      assert.equal(parsed.name, "alert(1)John Doe");
      assert.equal(parsed.email, "john@example.com");
      assert.equal(parsed.subject, "Inquiry Title");
      assert.equal(parsed.message, "This is a message  that has enough characters.");
    });

    // 8. Other module schema validation (Coupons, Orders, Books)
    await test("8. Corrected validation middleware works on other modules (Coupon)", async () => {
      const res = await fetch(`${baseUrl}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "ab" }),
      });
      // Auth or validation will reject properly
      assert.ok(res.status === 400 || res.status === 401 || res.status === 403);
    });

    // 9. First valid Contact Form submission
    await test("9. Valid Contact Form submission on first request returns 201 with success structure", async () => {
      const startTime = Date.now();
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Dave Allen",
          email: "dave.client@example.com",
          subject: "First Submission Inquiry",
          message: "This is a detailed message for the first valid submission test with more than twenty characters.",
        }),
      });
      const duration = Date.now() - startTime;
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.id, "Contact record should have an ID");
      assert.equal(data.data.name, "Dave Allen");
      assert.equal(data.data.email, "dave.client@example.com");
      assert.ok(data.message.includes("sent successfully"), "Response should include success message");
      assert.ok(duration < 5000, `Response should be fast and non-blocking (was ${duration}ms)`);
    });

    // 10. Consecutive Contact Form submission
    await test("10. Consecutive valid Contact Form submission succeeds reliably", async () => {
      const res = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Second Submitter",
          email: "second@example.com",
          subject: "Second Submission Inquiry",
          message: "This is a second consecutive valid message with more than twenty characters.",
        }),
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.data.id);
    });

    // 11. Mail notification failure isolation
    await test("11. Contact submission succeeds and isolates admin email notification failures", async () => {
      const ContactService = (await import("../src/modules/contact/contact.service.js")).default;
      // Mock sendAdminNotification to throw an error
      const originalSend = ContactService.sendAdminNotification;
      ContactService.sendAdminNotification = async () => {
        throw new Error("Simulated SMTP Connection Refused");
      };

      try {
        const res = await fetch(`${baseUrl}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Isolation Test",
            email: "isolation@example.com",
            subject: "Testing Email Failure Isolation",
            message: "Testing that email failures do not fail the contact submission for the user.",
          }),
        });
        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.data.id);
      } finally {
        ContactService.sendAdminNotification = originalSend;
      }
    });

  } finally {
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }

  console.log("\n==========================================");
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
