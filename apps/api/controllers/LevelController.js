import Level from "../models/Level.js";

export const createLevel = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Level name is required" });
        }

        const existingLevel = await Level.findOne({ name: name.trim() });
        if (existingLevel) {
            return res.status(400).json({ message: "Level with this name already exists" });
        }

        const level = new Level({ 
            name: name.trim(), 
            description 
        });
        
        await level.save();
        res.status(201).json({ message: "Level created successfully", level });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllLevels = async (req, res) => {
    try {
        const levels = await Level.find().sort({ createdAt: -1 });
        res.status(200).json(levels);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getLevelById = async (req, res) => {
    try {
        const level = await Level.findById(req.params.id);
        if (!level) {
            return res.status(404).json({ message: "Level not found" });
        }
        res.status(200).json(level);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateLevel = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const level = await Level.findById(req.params.id);
        if (!level) {
            return res.status(404).json({ message: "Level not found" });
        }

        if (name) {
            const newName = name.trim();
            
            if (newName !== level.name) {
                const existingLevel = await Level.findOne({ name: newName });
                if (existingLevel) {
                    return res.status(400).json({ message: "Level with this name already exists" });
                }
                level.name = newName;
            }
        }

        if (description !== undefined) {
            level.description = description;
        }

        await level.save();
        res.status(200).json({ message: "Level updated successfully", level });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteLevel = async (req, res) => {
    try {
        const level = await Level.findByIdAndDelete(req.params.id);

        if (!level) {
            return res.status(404).json({ message: "Level not found" });
        }
        
        res.status(200).json({ message: "Level deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};