import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Module from "../models/Module.js";

dotenv.config();
/*
  migrateModuleIndexes.js
  - Purpose: remove a legacy index ("name_1") from the `modules` collection
    if it exists, then call `Module.syncIndexes()` so Mongoose ensures the
    collection's indexes match the model's declared indexes.
  - Usage: run once during a migration when index definitions changed and
    the old index would block `syncIndexes()` from creating the desired index.
*/

const migrateModuleIndexes = async () => {
  try {
    await connectDB();
    // Ensure DB connection established before touching indexes
    const collection = Module.collection;
    const indexes = await collection.indexes();
    const hasNameUniqueIndex = indexes.some((idx) => idx.name === "name_1");

    // If a legacy unique index named `name_1` exists, drop it so
    // `syncIndexes()` can recreate the proper indexes defined on the model.
    if (hasNameUniqueIndex) {
      await collection.dropIndex("name_1");
      console.log("Dropped legacy index: name_1");
    } else {
      console.log("Legacy index name_1 not found");
    }

    // Synchronize Mongoose model indexes with the collection
    await Module.syncIndexes();
    console.log("Module indexes synchronized successfully");

    // Exit with success code for script-runner conventions
    process.exit(0);
  } catch (error) {
    console.error("Failed to migrate module indexes:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

migrateModuleIndexes();
