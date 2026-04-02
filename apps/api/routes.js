import express from "express";
import AdminRoutes from "./routers/AdminRoutes.js";
import AuthRoutes from "./routers/AuthRoutes.js";
import UserRoutes from "./routers/UserRoutes.js";
import LevelRoutes from "./routers/LevelRoutes.js";
import GradeRoutes from "./routers/GradeRoutes.js";
import SchoolAdminRoutes from "./routers/SchoolAdminRoutes.js";
import ModuleRoutes from "./routers/ModuleRoutes.js";
import QuizRoutes from "./routers/QuizRoutes.js";
import DonorRoutes from "./routers/DonorRoutes.js";
import PaymentRoutes from "./routers/PaymentRoutes.js"
import PdfRoutes from "./routers/PdfRoutes.js";
import LessonRoutes from "./routers/LessonRoutes.js";
import KnowledgeBaseRoutes from "./routers/KnowledgeBaseRoutes.js";
import AssignmentRoutes from "./routers/AssignmentRoutes.js";

const router = express.Router();

// --- Route Groups ---
router.use("/admin", AdminRoutes);
router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/payments", PaymentRoutes );
router.use("/donor", DonorRoutes);
router.use("/school-admin", SchoolAdminRoutes);

router.use("/levels", LevelRoutes);
router.use("/grades", GradeRoutes);
router.use("/modules", ModuleRoutes);
router.use("/quizzes", QuizRoutes);
router.use("/pdf", PdfRoutes);
router.use("/lessons", LessonRoutes);
router.use("/knowledge-base", KnowledgeBaseRoutes);
router.use("/assignments", AssignmentRoutes);

export default router;