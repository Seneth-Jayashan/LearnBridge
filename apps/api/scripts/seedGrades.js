import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Grade from "../models/Grade.js";

dotenv.config();

const defaultGrades = Array.from({ length: 13 }, (_, i) => ({
  name: String(i + 1),
  description: `Grade ${i + 1}`,
}));

const seedGrades = async () => {
  try {
    await connectDB();

    let created = 0;
    let updated = 0;

    for (const grade of defaultGrades) {
      const result = await Grade.updateOne(
        { name: grade.name },
        { $set: { description: grade.description } },
        { upsert: true },
      );

      if (result.upsertedCount > 0) {
        created += 1;
      } else if (result.modifiedCount > 0) {
        updated += 1;
      }
    }

    console.log(`Grades seeded successfully. Created: ${created}, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed grades:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seedGrades();
