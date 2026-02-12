import express from "express";
import { 
    createUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser, 
    checkPhoneNumber, 
    checkEmail 
} from "../controllers/adminController.js"; // Ensure filename casing matches your system

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { validate } from "../middlewares/Validate.js";
import { 
    createUserSchema, 
    updateUserSchema, 
    checkPhoneSchema, 
    checkEmailSchema 
} from "../validators/AdminValidator.js";

const router = express.Router();

// --- Admin User Management Routes ---

// Create User: Protect -> Admin Only -> Validate Body -> Controller
router.post(
    "/create-user", 
    protect, 
    restrictTo("admin"), 
    validate(createUserSchema), 
    createUser
);

router.get(
    "/users", 
    protect, 
    restrictTo("admin"), 
    getAllUsers
);

router.get(
    "/users/:id", 
    protect, 
    restrictTo("admin"), 
    getUserById
);

// Update User: Protect -> Admin Only -> Validate Body -> Controller
router.put(
    "/users/:id", 
    protect, 
    restrictTo("admin"), 
    validate(updateUserSchema), 
    updateUser
);

router.delete(
    "/users/:id", 
    protect, 
    restrictTo("admin"), 
    deleteUser
);

// --- Utility Routes for Frontend Validation ---

router.post(
    "/check-phone", 
    protect, 
    restrictTo("admin"), 
    validate(checkPhoneSchema), 
    checkPhoneNumber
);

router.post(
    "/check-email", 
    protect, 
    restrictTo("admin"), 
    validate(checkEmailSchema), 
    checkEmail
);

export default router;