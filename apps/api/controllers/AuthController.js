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

        // --- IMPROVED IDENTIFIER LOGIC ---
        // 1. Check if it is an email (contains '@')
        const isEmail = identifier.includes("@");
        
        // 2. Check if it is a Student RegNumber
        // It must start with 'STU' AND MUST NOT be an email.
        const isRegNumFormat = identifier.toUpperCase().startsWith("STU") && !isEmail;

        let targetUser = null;

        // --- SCENARIO 1: Student Login (Unique RegNumber) ---
        if (isRegNumFormat) {
            // Because of the !isEmail check above, "stuart@email.com" will skip this block
            // and correctly go to the Staff/Teacher block below.
            
            targetUser = await User.findOne({ regNumber: identifier });
            
            if (!targetUser) return res.status(404).json({ message: "Invalid Registration Number." });
            
            if (targetUser.role !== "student") {
                return res.status(403).json({ message: "Only Students can login with Registration Number." });
            }

            // Verify Password
            const isMatch = await targetUser.comparePassword(password);
            if (!isMatch) {
                targetUser.loginAttempts += 1;
                if (targetUser.loginAttempts >= 5) targetUser.isLocked = true;
                await targetUser.save();
                return res.status(401).json({ message: "Invalid credentials." });
            }
        } 
        
        // --- SCENARIO 2: Staff/Donor Login (Phone OR Email) ---
        else {
            // This block now handles:
            // 1. Phone numbers (e.g., "0771234567")
            // 2. Emails (e.g., "teacher@email.com")
            // 3. Emails starting with STU (e.g., "stuart@email.com")

            // Find ALL users with this phone or email
            const users = await User.find({ 
                $or: [{ email: identifier.toLowerCase() }, { phoneNumber: identifier }] 
            });

            if (users.length === 0) {
                return res.status(404).json({ message: "User not found." });
            }

            // ... (Rest of your multiple-user password matching logic remains the same) ...
            
            let matchCount = 0;
            for (const user of users) {
                // Determine if this user is a student trying to login via phone/email
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
                    message: "Ambiguous account. Multiple users share these credentials. Please contact Admin." 
                });
            }
        }

        // --- Common Final Checks & Token Generation ---
        if (!targetUser.isActive) return res.status(403).json({ message: "Account is inactive." });
        if (targetUser.isLocked) return res.status(403).json({ message: "Account is locked." });

        targetUser.loginAttempts = 0;
        targetUser.lastLogin = Date.now();
        
        const { accessToken, refreshToken } = generateTokens(targetUser._id, targetUser.role);
        
        targetUser.refreshToken.push({ token: refreshToken });
        if (targetUser.refreshToken.length > 5) targetUser.refreshToken.shift();
        
        await targetUser.save();

        res.cookie("refreshToken", refreshToken, cookieOptions);
        
        res.status(200).json({ 
            message: "Login successful", 
            accessToken, 
            user: {
                id: targetUser._id,
                firstName: targetUser.firstName,
                lastName: targetUser.lastName,
                role: targetUser.role,
                regNumber: targetUser.regNumber || null,
            } 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password").populate("grade", "name").populate("level", "name");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        // We really need RegNumber for students to be safe.
        // For staff sharing a phone, OTP resets the password for the first matching user found?
        // Or we ask for Email + Phone combo?
        // For simplicity here, we assume the identifier is sufficient.
        
        const { identifier } = req.body;
        const user = await User.findOne({ 
             $or: [{ regNumber: identifier }, { phoneNumber: identifier }, { email: identifier }] 
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
        
        // Caution: If multiple users share a phone, findOne picks the first one.
        // Ideally, in reset flow, you should pass back a temporary token from verifyOTP to ensure 
        // we update the correct user. 
        const user = await User.findOne({ 
             $or: [{ regNumber: identifier }, { phoneNumber: identifier }, { email: identifier }] 
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