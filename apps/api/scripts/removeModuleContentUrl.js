import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Module from "../models/Module.js";

dotenv.config();

const removeContentUrl = async () => {
  try {
    await connectDB();

    const result = await Module.updateMany({ contentUrl: { $exists: true } }, { $unset: { contentUrl: "" } });
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    console.log("Successfully removed contentUrl from existing Module documents (if any).");
    process.exit(0);
  } catch (error) {
    console.error("Failed to remove contentUrl:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

removeContentUrl();
