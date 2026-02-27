import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Module from "../models/Module.js";

dotenv.config();

/*
  removeModuleContentUrl.js
  - Purpose: remove the deprecated `contentUrl` field from all Module documents
    (if present). This is useful when the application has migrated away from
    storing content URLs on the Module model and the field should be cleared.
  - Behavior: performs an `updateMany` with `$unset` so the script is safe to
    run multiple times (idempotent for documents that no longer have the field).
*/

const removeContentUrl = async () => {
  try {
    await connectDB();

    const result = await Module.updateMany({ contentUrl: { $exists: true } }, { $unset: { contentUrl: "" } });
    // Log counts so operator knows how many documents were affected
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
