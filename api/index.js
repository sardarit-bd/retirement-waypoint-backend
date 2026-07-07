import app from "../src/app.js";
import connectDB from "../src/config/database.js";

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
}
