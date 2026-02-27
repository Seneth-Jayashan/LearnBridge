import School from "../models/School.js";

export const getPublicSchools = async (req, res) => {
    try {
        const schools = await School.find({ 
            isVerified: true, 
            isActive: true, 
            isDeleted: false 
        })
        .select("name address logoUrl contactEmail contactPhone")
        .sort({ name: 1 });

        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};