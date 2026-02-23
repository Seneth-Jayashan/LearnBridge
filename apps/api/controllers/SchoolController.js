import School from "../models/School.js";

// --- PUBLIC: Get All Verified Schools ---
export const getPublicSchools = async (req, res) => {
    try {
        // Only fetch schools that are verified, active, and not deleted
        const schools = await School.find({ 
            isVerified: true, 
            isActive: true, 
            isDeleted: false 
        })
        .select("name address logoUrl contactEmail contactPhone") // Only public fields
        .sort({ name: 1 });

        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};