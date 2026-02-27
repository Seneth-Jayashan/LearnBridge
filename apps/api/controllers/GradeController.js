import Grade from "../models/Grade.js";

const defaultGrades = Array.from({ length: 13 }, (_, i) => ({
    name: String(i + 1),
    description: `Grade ${i + 1}`,
}));

export const createGrade = async (req, res) => {
    try {
        const { name, description } = req.body;

        // 1. Validation: Check if name exists
        if (!name) {
            return res.status(400).json({ message: "Grade name is required" });
        }

        // 2. Check for duplicates (Case insensitive is usually better, but keeping strict trim match here)
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

export const getAllGrades = async (req, res) => {
    try {
        const grades = await Grade.find().sort({ createdAt: -1 });
        res.status(200).json(grades);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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

export const updateGrade = async (req, res) => {
    try {
        const { name, description } = req.body;
        const grade = await Grade.findById(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: "Grade not found" });
        }

        // 1. Handle Name Update (with Duplicate Check)
        if (name && name.trim() !== grade.name) {
            const existingGrade = await Grade.findOne({ name: name.trim() });
            
            // Ensure the found grade is not the one we are currently updating
            if (existingGrade && existingGrade._id.toString() !== req.params.id) {
                return res.status(400).json({ message: "Grade with this name already exists" });
            }
            grade.name = name.trim();
        }

        // 2. Handle Description Update
        if (description !== undefined) {
            grade.description = description;
        }

        await grade.save();
        res.status(200).json({ message: "Grade updated successfully", grade });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteGrade = async (req, res) => {
    try {
        // Optimization: Find and Delete in one operation
        const grade = await Grade.findByIdAndDelete(req.params.id);

        if (!grade) {
            return res.status(404).json({ message: "Grade not found" });
        }

        res.status(200).json({ message: "Grade deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

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