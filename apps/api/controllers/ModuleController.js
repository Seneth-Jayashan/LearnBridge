import Module from "../models/Module.js";

// --- Create a New Module ---
export const createModule = async (req, res) => {
    try {
        const { name, description, contentUrl } = req.body;

        // Check if module name already exists
        const existingModule = await Module.findOne({ name });
        if (existingModule) {
            return res.status(400).json({ message: "Module with this name already exists." });
        }

        const newModule = new Module({
            name,
            description,
            contentUrl
        });

        await newModule.save();

        res.status(201).json({ 
            message: "Module created successfully", 
            module: newModule 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Get All Modules ---
export const getAllModules = async (req, res) => {
    try {
        const modules = await Module.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json(modules);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Get Single Module by ID ---
export const getModuleById = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        res.status(200).json(module);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Update Module ---
export const updateModule = async (req, res) => {
    try {
        const { name, description, contentUrl } = req.body;
        
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        // If updating name, check for duplicates
        if (name && name !== module.name) {
            const duplicate = await Module.findOne({ name });
            if (duplicate) {
                return res.status(400).json({ message: "Module name already in use." });
            }
        }

        module.name = name || module.name;
        module.description = description || module.description;
        module.contentUrl = contentUrl || module.contentUrl;

        await module.save();

        res.status(200).json({ 
            message: "Module updated successfully", 
            module 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- Delete Module ---
export const deleteModule = async (req, res) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        
        if (!module) {
            return res.status(404).json({ message: "Module not found" });
        }

        res.status(200).json({ message: "Module deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};