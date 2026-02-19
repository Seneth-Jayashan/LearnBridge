import User from "../models/User.js";
import School from "../models/School.js";
import { sendWelcomeSms } from "../utils/templates/SMS.js";

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password, role,  address, grade, level } = req.body;

        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            role: role || "student",
            grade,
            level,
            address,
        });

        await newUser.save();
        await sendWelcomeSms(newUser.phoneNumber, newUser.firstName);

        res.status(201).json({ 
            message: "User created successfully", 
            userId: newUser._id 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkPhoneNumber = async (req, res) => {
    try {
        // Just informs frontend if used, doesn't necessarily have to block it
        const { phoneNumber } = req.body;
        const count = await User.countDocuments({ phoneNumber });
        return res.status(200).json({ exists: count > 0, count });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const checkEmail = async (req, res) => {
    try {
        // Just informs frontend if used, doesn't necessarily have to block it
        const { email } = req.body;
        const count = await User.countDocuments({ email });
        return res.status(200).json({ exists: count > 0, count });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createSchoolWithAdmin = async (req, res) => {
    try {
        // Only Super Admins should hit this route
        if (req.user.role !== "super_admin") {
            return res.status(403).json({ message: "Only Super Admins can create schools." });
        }

        const { schoolData, adminData } = req.body;

        // 1. Create the School (Verified automatically since Super Admin is creating it)
        const newSchool = new School({
            ...schoolData,
            isVerified: true 
        });
        await newSchool.save();

        // 2. Create the School Admin
        const schoolAdmin = new User({
            ...adminData,
            role: "school_admin",
            school: newSchool._id,
            isSchoolVerified: true
        });
        await schoolAdmin.save();

        // 3. Link Admin back to the School
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

// ... getAllUsers, getUserById, updateUser, deleteUser (Standard) ...

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .populate("grade", "name")
            .populate("level", "name");
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
            .populate("level", "name");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        // Allows updating to a shared email/phone
        const { firstName, lastName, email, phoneNumber, role, grade, level, address } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.role = role || user.role;
        user.grade = grade || user.grade;
        user.level = level || user.level;
        user.address = address || user.address;

        await user.save();
        res.status(200).json({ message: "User updated successfully" });
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