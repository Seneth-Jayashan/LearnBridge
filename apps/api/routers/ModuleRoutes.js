import express from "express";
import { 
    createModule, 
    getAllModules, 
    getModuleById, 
    updateModule, 
    deleteModule 
} from "../controllers/ModuleController.js";

import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// --- Public Access (Read Only) for Authenticated Users ---
// Students, Teachers, and Admins can all view modules
router.get("/", getAllModules);
router.get("/:id", getModuleById);

// --- Restricted Access (Write Access) ---
// Only Super Admins can manage modules
router.post(
    "/", 
    restrictTo("super_admin"), 
    createModule
);

router.put(
    "/:id", 
    restrictTo("super_admin"), 
    updateModule
);

router.delete(
    "/:id", 
    restrictTo("super_admin"), 
    deleteModule
);

export default router;