import jwt from "jsonwebtoken";
import User from "../models/User.js";


export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const currentUser = await User.findById(decoded.id).select("-password");
      if (!currentUser) {
        return res.status(401).json({
          message: "The user belonging to this token no longer exists.",
        });
      }

      if (!currentUser.isActive) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      if (currentUser.isLocked) {
        return res.status(403).json({
          message: "Your account is locked. Please reset your password or contact support.",
        });
      }

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

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

