import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import config from "./config";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.dbUrl);
    console.log("MongoDB connected!");
  } catch (error: unknown) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
