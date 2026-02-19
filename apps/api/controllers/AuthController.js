import User from "../models/User.js";
import { sendVerificationSms } from "../utils/templates/SMS.js"; 
import jwt from "jsonwebtoken";

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", 
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Please provide credentials." });
        }

        const isEmail = identifier.includes("@");
        const isRegNumFormat = identifier.toUpperCase().startsWith("STU") && !isEmail;

        let targetUser = null;

        // --- SCENARIO 1: Student Login (Unique RegNumber) ---
        if (isRegNumFormat) {
            targetUser = await User.findOne({ regNumber: identifier });
            
            if (!targetUser) return res.status(404).json({ message: "Invalid Registration Number." });
            
            if (targetUser.role !== "student") {
                return res.status(403).json({ message: "Only Students can login with Registration Number." });
            }

            const isMatch = await targetUser.comparePassword(password);
            if (!isMatch) {
                targetUser.loginAttempts += 1;
                if (targetUser.loginAttempts >= 5) targetUser.isLocked = true;
                await targetUser.save();
                return res.status(401).json({ message: "Invalid credentials." });
            }
        } 
        
        // --- SCENARIO 2: Staff/Admin/Donor Login (Phone OR Email) ---
        else {
            const users = await User.find({ 
                $or: [{ email: identifier.toLowerCase() }, { phoneNumber: identifier }] 
            });

            if (users.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            
            let matchCount = 0;
            for (const user of users) {
                // Skip students (they MUST use RegNumber)
                if (user.role === "student") continue; 

                const isMatch = await user.comparePassword(password);
                if (isMatch) {
                    targetUser = user;
                    matchCount++;
                }
            }

            if (matchCount === 0) {
                return res.status(401).json({ message: "Invalid credentials." });
            }

            if (matchCount > 1) {
                return res.status(409).json({ 
                    message: "Ambiguous account. Multiple users share these credentials. Please contact System Admin." 
                });
            }
        }

        // --- Common Final Checks ---
        if (!targetUser.isActive) return res.status(403).json({ message: "Account is inactive." });
        if (targetUser.isLocked) return res.status(403).json({ message: "Account is locked." });

        // NOTE: We don't block login if !isSchoolVerified. We pass it to the frontend 
        // so the frontend can redirect them to an "Awaiting Verification" screen!

        targetUser.loginAttempts = 0;
        targetUser.lastLogin = Date.now();
        
        const { accessToken, refreshToken } = generateTokens(targetUser._id, targetUser.role);
        
        targetUser.refreshToken.push({ token: refreshToken });
        if (targetUser.refreshToken.length > 5) targetUser.refreshToken.shift();
        
        await targetUser.save();

        res.cookie("refreshToken", refreshToken, cookieOptions);
        
        // --- UPDATED RESPONSE PAYLOAD ---
        res.status(200).json({ 
            message: "Login successful", 
            accessToken, 
            user: {
                id: targetUser._id,
                firstName: targetUser.firstName,
                lastName: targetUser.lastName,
                role: targetUser.role,
                regNumber: targetUser.regNumber || null,
                school: targetUser.school || null,             // Added multi-tenant school ID
                isSchoolVerified: targetUser.isSchoolVerified  // Added verification status
            } 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        // --- UPDATED POPULATION ---
        // We now populate the 'school' field so the frontend gets the School Name and Logo
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("grade", "name")
            .populate("level", "name")
            .populate("school", "name logoUrl isVerified"); // New population

        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ 
             $or: [{ regNumber: identifier }, { phoneNumber: identifier }, { email: identifier.toLowerCase() }] 
        });

        if (!user) return res.status(404).json({ message: "User not found." });

        const otp = user.generateOTP(); 
        await user.save();
        
        await sendVerificationSms(user.phoneNumber, otp);
        res.status(200).json({ message: "OTP sent.", success: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        
        const user = await User.findOne({ 
             $or: [{ regNumber: identifier }, { phoneNumber: identifier }, { email: identifier.toLowerCase() }] 
        });

        if (!user) return res.status(404).json({ message: "User not found." });

        const verify = user.verifyOTP(otp);
        if (!verify.success) {
            await user.save(); 
            return res.status(400).json(verify);
        }

        user.password = newPassword;
        await user.save();
        
        res.status(200).json({ message: "Password reset successfully", success: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(400).json({ message: "No refresh token provided." });

        const user = await User.findOne({ "refreshToken.token": refreshToken });
        if (user) {
            user.refreshToken = user.refreshToken.filter(rt => rt.token !== refreshToken);
            await user.save();
        }
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};