import Grade from "../models/Grade.js";

export const createGrade = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Grade name is required" });
        }

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