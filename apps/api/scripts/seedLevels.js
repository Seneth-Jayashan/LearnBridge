import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/Database.js";
import Level from "../models/Level.js";

dotenv.config();

/*
  seedLevels.js
  - Purpose: populate a set of educational `Level` documents (e.g. Primary, Junior Secondary).
  - Behavior: idempotent upsert loop so the script can be re-run safely; logs created/updated counts.
*/

const defaultLevels = [
    { name: "Primary Education", description: "Grade 1 – 5" },
    { name: "Junior Secondary", description: "Grade 6 – 9" },
    { name: "Senior Secondary – G.C.E. O/L", description: "Grade 10 – 11" },
    { name: "Advanced Level – G.C.E. A/L", description: "Grade 12 – 13" },
];

const seedLevels = async () => {
    try {
        await connectDB();

        let created = 0;
        let updated = 0;

        for (const level of defaultLevels) {
            // Upsert each level so existing entries are updated and missing ones created
            const result = await Level.updateOne(
                { name: level.name },
                { $set: { description: level.description } },
                { upsert: true },
            );

            if (result.upsertedCount > 0) {
                created += 1;
            } else if (result.modifiedCount > 0) {
                updated += 1;
            }
        }

        console.log(`Levels seeded successfully. Created: ${created}, Updated: ${updated}`);
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed levels:", error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

seedLevels();
