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

router.use(protect);

router.get("/", getAllModules);
router.get("/:id", getModuleById);

router.post(
    "/", 
    restrictTo("super_admin", "school_admin"), 
    createModule
);

router.put(
    "/:id", 
    restrictTo("super_admin", "school_admin"), 
    updateModule
);

router.delete(
    "/:id", 
    restrictTo("super_admin", "school_admin"), 
    deleteModule
);

export default router;