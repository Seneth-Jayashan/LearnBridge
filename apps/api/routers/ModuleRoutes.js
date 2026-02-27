import express from "express";
import { 
    createModule, 
    getAllModules, 
    getModuleById, 
    updateModule, 
    deleteModule 
} from "../controllers/ModuleController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { uploadModuleThumbnail } from "../middlewares/UploadMiddleware.js";
import { validate } from "../middlewares/ValidateMiddleware.js";
import {
    createModuleSchema,
    updateModuleSchema,
} from "../validators/ModuleValidator.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/*
    Module Routes
    - Authentication is applied to all routes via `protect`.
    - Read endpoints are available to authenticated users; write operations
        (create/update/delete) are restricted to `super_admin` only.
    - Thumbnails use `uploadModuleThumbnail` to validate image uploads.
*/

// --- Public Access (Read Only) for Authenticated Users ---
// Students, Teachers, and Admins can all view modules
router.get("/", getAllModules);
router.get("/:id", getModuleById);

// --- Restricted Access (Write Access) ---
// Only Super Admins can manage modules
router.post(
    "/", 
    restrictTo("super_admin"),
    uploadModuleThumbnail,
    validate(createModuleSchema),
    createModule
);

router.put(
    "/:id", 
    restrictTo("super_admin"),
    uploadModuleThumbnail,
    validate(updateModuleSchema),
    updateModule
);

router.delete(
    "/:id", 
    restrictTo("super_admin"), 
    deleteModule
);

export default router;