import Level from "../models/Level.js";

const defaultLevels = [
    { name: "Primary Education", description: "Grade 1 – 5" },
    { name: "Junior Secondary", description: "Grade 6 – 9" },
    { name: "Senior Secondary – G.C.E. O/L", description: "Grade 10 – 11" },
    { name: "Advanced Level – G.C.E. A/L", description: "Grade 12 – 13" },
];

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

export const seedDefaultLevels = async (req, res) => {
    try {
        let created = 0;
        let updated = 0;

        for (const level of defaultLevels) {
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

        res.status(200).json({
            message: "Default levels synced successfully",
            created,
            updated,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};