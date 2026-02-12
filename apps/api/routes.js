import express from "express";
import AdminRoutes from "./routers/AdminRoutes.js";
import AuthRoutes from "./routers/AuthRoutes.js";

const router = express.Router();

// --- Route Groups ---
router.use("/admin", AdminRoutes);
router.use("/auth", AuthRoutes);

export default router;