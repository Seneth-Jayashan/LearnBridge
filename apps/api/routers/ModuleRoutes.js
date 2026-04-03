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

router.use(protect);

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