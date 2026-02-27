import Grade from "../models/Grade.js";

// Default grade list used by `seedDefaultGrades` to ensure a consistent
// set of grade documents exist in the database.
const defaultGrades = Array.from({ length: 13 }, (_, i) => ({
    name: String(i + 1),
    description: `Grade ${i + 1}`,
}));

// Create a new grade. Validates that a `name` is provided and that it is
// unique before saving.
export const createGrade = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Grade name is required" });
        }

        // Prevent duplicate grade names.
        const existingGrade = await Grade.findOne({ name: name.trim() });
        if (existingGrade) {
            return res.status(400).json({ message: "Grade with this name already exists" });
        }

        const grade = new Grade({ 
            name: name.trim(), 
            description 
        });
        
        await grade.save();
        res.status(201).json({ message: "Grade created successfully", grade });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Return all grades, sorted by most recently created first.
export const getAllGrades = async (req, res) => {
    try {
        const grades = await Grade.find().sort({ createdAt: -1 });
        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get a single grade by id.
export const getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id);
        if (!grade) {
            return res.status(404).json({ message: "Grade not found" });
        }
        res.status(200).json(grade);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update an existing grade. Ensures the new name (if provided) does not
// collide with another grade's name.
export const updateGrade = async (req, res) => {
    try {
        const { name, description } = req.body;
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: "Grade not found" });
        }

        if (name && name.trim() !== grade.name) {
            const existingGrade = await Grade.findOne({ name: name.trim() });
            if (existingGrade && existingGrade._id.toString() !== req.params.id) {
                return res.status(400).json({ message: "Grade with this name already exists" });
            }
            grade.name = name.trim();
        }

        if (description !== undefined) {
            grade.description = description;
        }

        await grade.save();
        res.status(200).json({ message: "Grade updated successfully", grade });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a grade by id.
export const deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: "Grade not found" });
        }

        res.status(200).json({ message: "Grade deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Ensure a set of default grades exist. Useful for seeding initial data.
// Returns counts of created and updated records.
export const seedDefaultGrades = async (req, res) => {
    try {
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

        res.status(200).json({ message: "Default grades synced successfully", created, updated });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};