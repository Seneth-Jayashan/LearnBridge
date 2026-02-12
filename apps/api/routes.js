import express from "express";
import AdminRoutes from "./routers/AdminRoutes.js";
import AuthRoutes from "./routers/AuthRoutes.js";
import UserRoutes from "./routers/UserRoutes.js";
import LevelRoutes from "./routers/LevelRoutes.js";
import GradeRoutes from "./routers/GradeRoutes.js";

const router = express.Router();

// --- Route Groups ---
router.use("/admin", AdminRoutes);
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/levels", LevelRoutes);
router.use("/grades", GradeRoutes);

export default router;