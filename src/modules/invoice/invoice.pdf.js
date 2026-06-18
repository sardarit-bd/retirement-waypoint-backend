import PDFDocument from "pdfkit";
import { Readable } from "stream";

/**
 * Generate professional PDF invoice
 */
export const generateInvoicePDF = (invoice, order, orderItems, bookMap) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on("error", reject);

      // Helper function to format currency
      const formatCurrency = (amount) => {
        return `$${amount.toFixed(2)}`;
      };

      // Helper function to format date
      const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      // ========== HEADER ==========
      // Company Logo/Name
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1B2B4B")
        .text("Retirement Waypoint", 50, 50);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Digital E-books for Retirement Transition", 50, 80);

      // Invoice Title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#1B2B4B")
        .text("INVOICE", 450, 50, { align: "right" });

      // ========== INVOICE INFO ==========
      const infoY = 120;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333");

      // Left side - Company info
      doc.text("Retirement Waypoint", 50, infoY);
      doc.text("Rosarito Beach, México", 50, infoY + 15);
      doc.text("dave@retirementwaypoint.com", 50, infoY + 30);
      doc.text("+1 (000) 000-0000", 50, infoY + 45);

      // Right side - Invoice details
      const rightX = 400;
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, rightX, infoY, { align: "right" });
      doc.text(`Invoice Date: ${formatDate(invoice.issuedAt)}`, rightX, infoY + 15, { align: "right" });
      doc.text(`Order Number: ${order.orderNumber || "N/A"}`, rightX, infoY + 30, { align: "right" });
      doc.text(`Status: ${invoice.status}`, rightX, infoY + 45, { align: "right" });

      // ========== SEPARATOR LINE ==========
      doc
        .moveTo(50, 185)
        .lineTo(550, 185)
        .strokeColor("#C9A84C")
        .lineWidth(2)
        .stroke();

      // ========== BILLING SECTION ==========
      const billingY = 205;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#1B2B4B")
        .text("Bill To:", 50, billingY);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`User ID: ${invoice.userId}`, 50, billingY + 20);

      // ========== ORDER ITEMS TABLE ==========
      const tableY = 260;
      
      // Table Header
      const col1 = 50;
      const col2 = 200;
      const col3 = 400;
      const col4 = 480;
      const rowHeight = 25;

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#1B2B4B")
        .text("Item", col1, tableY)
        .text("Book ID", col2, tableY)
        .text("Price", col3, tableY)
        .text("Total", col4, tableY);

      // Table Header Line
      doc
        .moveTo(50, tableY + 20)
        .lineTo(550, tableY + 20)
        .strokeColor("#CCCCCC")
        .lineWidth(1)
        .stroke();

      // Table Rows
      let currentY = tableY + 30;
      doc.font("Helvetica").fillColor("#333333");

      orderItems.forEach((item) => {
        const book = bookMap.get(item.bookId);
        const bookTitle = book ? book.title : item.bookTitle;
        const bookPrice = item.bookPrice;

        // Description
        doc.text(bookTitle.substring(0, 60), col1, currentY, {
          width: 140,
          ellipsis: true,
        });

        // Book ID
        doc.text(item.bookId.substring(0, 12), col2, currentY);

        // Price
        doc.text(formatCurrency(bookPrice), col3, currentY, { align: "right" });

        // Total (same as price for quantity 1)
        doc.text(formatCurrency(bookPrice), col4, currentY, { align: "right" });

        currentY += rowHeight + 5;

        // Add line between items
        doc
          .moveTo(50, currentY - 2)
          .lineTo(550, currentY - 2)
          .strokeColor("#EEEEEE")
          .lineWidth(0.5)
          .stroke();
      });

      // ========== TOTALS ==========
      const totalsY = currentY + 20;
      
      // Subtotal
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", 400, totalsY, { align: "right" })
        .text(formatCurrency(invoice.subtotal), 500, totalsY, { align: "right" });

      // Tax (0 for digital goods)
      doc
        .text("Tax (0%):", 400, totalsY + 18, { align: "right" })
        .text("$0.00", 500, totalsY + 18, { align: "right" });

      // Total
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#C9A84C")
        .text("Total:", 400, totalsY + 40, { align: "right" })
        .text(formatCurrency(invoice.totalAmount), 500, totalsY + 40, { align: "right" });

      // ========== FOOTER ==========
      const footerY = 700;
      
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text("Thank you for your purchase!", 50, footerY, { align: "center" })
        .text(
          "This is a digital product. All sales are final.",
          50,
          footerY + 15,
          { align: "center" }
        )
        .text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          footerY + 30,
          { align: "center" }
        );

      // ========== BORDER ==========
      doc
        .rect(30, 30, 540, 750)
        .strokeColor("#C9A84C")
        .lineWidth(1)
        .stroke();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default generateInvoicePDF;