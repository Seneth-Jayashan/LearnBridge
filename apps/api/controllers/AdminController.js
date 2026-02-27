import User from "../models/User.js";
import School from "../models/School.js";
import { sendAccountCreationSms } from "../utils/templates/SMS.js";
import { accountCreationEmail } from "../utils/templates/Email.js";
// ==========================================
// --- USER MANAGEMENT (SUPER ADMIN) ---
// ==========================================

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, role, address, grade, level } = req.body;
        const targetRole = role || "student";

        if (targetRole !== "student") {
            const existingUser = await User.findOne({ 
                $or: [{ email: email.toLowerCase() }, { phoneNumber }] 
            });
            if (existingUser) {
                return res.status(400).json({ message: "Email or phone number already in use." });
            }
        }

        if (targetRole === "student" && !grade) {
            return res.status(400).json({ message: "Grade is required when creating a Student account." });
        }

        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password,
            role: targetRole,
            grade: targetRole === "student" ? grade : undefined,
            address,
            requiresPasswordChange: true
        });

        await newUser.save();
        await sendAccountCreationSms(phoneNumber, `${firstName} ${lastName}`, email, password);
        await accountCreationEmail(`${firstName} ${lastName}`,email, password);
        res.status(201).json({ 
            message: "User created successfully", 
            userId: newUser._id 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("grade", "name")
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("grade", "name")
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, role, grade, level, address } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        const finalRole = role || user.role;

        if (finalRole === "student") {
            const willHaveGrade = grade || user.grade; 
            
            if (!willHaveGrade) {
                return res.status(400).json({ 
                    message: "Grade is required for Student accounts. Please select a grade." 
                });
            }
        }

        if (finalRole !== "student" && (email || phoneNumber)) {
            const duplicateQuery = [];
            if (email && email.toLowerCase() !== user.email) duplicateQuery.push({ email: email.toLowerCase() });
            if (phoneNumber && phoneNumber !== user.phoneNumber) duplicateQuery.push({ phoneNumber });
            
            if (duplicateQuery.length > 0) {
                const existing = await User.findOne({ $or: duplicateQuery });
                if (existing) return res.status(400).json({ message: "Email or phone number already in use." });
            }
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email.toLowerCase();
        if (phoneNumber) user.phoneNumber = phoneNumber;
        
        if (role) {
            user.role = role;
        }

        if (grade) user.grade = grade;
        if (level) user.level = level;
        if (address) user.address = { ...user.address, ...address };

        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- USER STATUS & SECURITY ---

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isActive = !user.isActive;
        await user.save();
        res.status(200).json({ message: `User ${user.isActive ? "activated" : "deactivated"} successfully` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const toggleUserLock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isLocked = !user.isLocked;
        await user.save();
        res.status(200).json({ message: `User ${user.isLocked ? "locked" : "unlocked"} successfully` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const restoreUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isDeleted = false;
        user.isActive = true;
        await user.save();
        res.status(200).json({ message: "User restored successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- SCHOOL MANAGEMENT (SUPER ADMIN) ---
// ==========================================

export const createSchoolWithAdmin = async (req, res) => {
    try {
        if (req.user.role !== "super_admin") {
            return res.status(403).json({ message: "Only Super Admins can create schools." });
        }

        const { schoolData, adminData } = req.body;

        const existingAdmin = await User.findOne({
            $or: [{ email: adminData.email.toLowerCase() }, { phoneNumber: adminData.phoneNumber }]
        });
        if (existingAdmin) {
            return res.status(400).json({ message: "School Admin email or phone already in use." });
        }

        const newSchool = new School({
            ...schoolData,
            isVerified: true 
        });
        await newSchool.save();

        const schoolAdmin = new User({
            ...adminData,
            email: adminData.email.toLowerCase(),
            role: "school_admin",
            school: newSchool._id,
            isSchoolVerified: true,
            requiresPasswordChange: true
        });
        await schoolAdmin.save();

        newSchool.admins.push(schoolAdmin._id);
        await newSchool.save();

        res.status(201).json({ 
            message: "School and Admin created successfully", 
            school: newSchool,
            adminId: schoolAdmin._id
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find()
            .populate("admins", "firstName lastName email")
            .sort({ createdAt: -1 });
        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id)
            .populate("admins", "firstName lastName email phoneNumber")
            .populate("teachers", "firstName lastName email")
            .populate("students", "firstName lastName regNumber");
            
        if (!school) return res.status(404).json({ message: "School not found" });
        
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateSchool = async (req, res) => {
    try {
        const { name, contactEmail, contactPhone, address, logoUrl, isActive } = req.body;
        const school = await School.findById(req.params.id);

        if (!school) return res.status(404).json({ message: "School not found" });

        if (name) school.name = name;
        if (contactEmail) school.contactEmail = contactEmail;
        if (contactPhone) school.contactPhone = contactPhone;
        if (logoUrl) school.logoUrl = logoUrl;
        if (isActive !== undefined) school.isActive = isActive;
        
        if (address) {
            school.address = { ...school.address, ...address };
        }

        await school.save();
        res.status(200).json({ message: "School updated successfully", school });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteSchool = async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.params.id);
        if (!school) return res.status(404).json({ message: "School not found" });

        await User.updateMany(
            { school: req.params.id },
            { $set: { school: null, isActive: false } } 
        );

        res.status(200).json({ message: "School deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- UTILITY ROUTES ---
// ==========================================

export const checkPhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const count = await User.countDocuments({ phoneNumber });
        return res.status(200).json({ exists: count > 0, count });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const count = await User.countDocuments({ email: email.toLowerCase() });
        return res.status(200).json({ exists: count > 0, count });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};