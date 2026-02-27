import User from "../models/User.js";
import { sendVerificationSms } from "../utils/templates/SMS.js";
import { sendVerificationEmail } from "../utils/templates/Email.js"; 
import jwt from "jsonwebtoken";

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: process.env.NODE_ENV === "production" ? true : false, 
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
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

        // ==========================================
        // --- NEW: FIRST LOGIN OTP INTERCEPTION ---
        // ==========================================
        if (targetUser.requiresPasswordChange) {
            const otp = targetUser.generateOTP();
            await targetUser.save();

            // Send OTP to both Email and Phone
            await sendVerificationEmail(targetUser.email, otp);
            await sendVerificationSms(targetUser.phoneNumber, otp);

            // STOP the login process here and return the flag
            return res.status(200).json({
                message: "First login detected. OTP sent to your email and phone.",
                requiresOtpVerification: true,
                userId: targetUser._id
            });
        }

        // --- NORMAL LOGIN PROCEEDS HERE ---
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
                school: targetUser.school || null,
                isSchoolVerified: targetUser.isSchoolVerified
            } 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- NEW: VERIFY FIRST LOGIN OTP ---
// ==========================================
export const verifyFirstLoginOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        const otpCheck = user.verifyOTP(otp);
        
        if (!otpCheck.success) {
            await user.save(); 
            return res.status(400).json({ message: otpCheck.message });
        }

        // OTP is valid! Generate a secure token just for resetting the password
        const resetToken = jwt.sign(
            { id: user._id, intent: 'first_login_reset' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

        await user.save(); // OTP is cleared out inside verifyOTP()

        res.status(200).json({ 
            message: "OTP verified successfully. Please enter your new password.", 
            resetToken 
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ==========================================
// --- NEW: SETUP NEW PASSWORD (FINAL STEP) ---
// ==========================================
export const setupNewPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        
        // Verify the secure token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.intent !== 'first_login_reset') {
            return res.status(400).json({ message: "Invalid token intent." });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update password using the schema helper method
        await user.updatePassword(newPassword);

        // --- Automatically Log the User In ---
        user.loginAttempts = 0;
        user.lastLogin = Date.now();

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);
        
        user.refreshToken.push({ token: refreshToken });
        if (user.refreshToken.length > 5) user.refreshToken.shift();
        
        await user.save();

        res.cookie("refreshToken", refreshToken, cookieOptions);

        res.status(200).json({ 
            message: "Password updated successfully. Welcome to your dashboard!",
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                regNumber: user.regNumber || null,
                school: user.school || null,
                isSchoolVerified: user.isSchoolVerified
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Reset session expired. Please log in again." });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("grade", "name")
            .populate("school", "name logoUrl isVerified");

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
        await sendVerificationEmail(user.email, otp);
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

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token" });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "User not found" });

        const isValidToken = user.refreshToken.some(rt => rt.token === refreshToken);
        if (!isValidToken) return res.status(403).json({ message: "Invalid refresh token" });

        const accessToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "15m" }
        );

        console.log(`Refresh successful for user ${user._id}. New Access Token issued.`);
        res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(403).json({ message: "Token expired or invalid" });
    }
};