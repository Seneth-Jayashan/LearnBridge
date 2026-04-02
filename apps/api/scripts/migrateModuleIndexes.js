import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Module from "../models/Module.js";

dotenv.config();

const migrateModuleIndexes = async () => {
  try {
    await connectDB();

    const collection = Module.collection;
    const indexes = await collection.indexes();
    const hasNameUniqueIndex = indexes.some((idx) => idx.name === "name_1");

    if (hasNameUniqueIndex) {
      await collection.dropIndex("name_1");
      console.log("Dropped legacy index: name_1");
    } else {
      console.log("Legacy index name_1 not found");
    }

    await Module.syncIndexes();
    console.log("Module indexes synchronized successfully");

    process.exit(0);
  } catch (error) {
    console.error("Failed to migrate module indexes:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

migrateModuleIndexes();
