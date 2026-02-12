import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * PROTECT MIDDLEWARE
 * Verifies the JWT Access Token and attaches the user to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get the token from the header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Check if user still exists
      const currentUser = await User.findById(decoded.id).select("-password");
      if (!currentUser) {
        return res.status(401).json({
          message: "The user belonging to this token no longer exists.",
        });
      }

      // 4. Check if user is active
      if (!currentUser.isActive) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      // 5. Check if user is locked
      if (currentUser.isLocked) {
        return res.status(403).json({
          message: "Your account is locked. Please reset your password or contact support.",
        });
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;
      next();
      
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

/**
 * RESTRICT TO MIDDLEWARE
 * Restricts access to specific roles (e.g., only 'admin' or 'teacher')
 * Usage: router.get('/users', protect, restrictTo('admin'), getAllUsers)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set in the 'protect' middleware above
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};