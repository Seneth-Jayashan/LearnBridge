import { useState } from "react";
import { useOutletContext, Routes, Route, Navigate } from "react-router-dom";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import CreateQuiz from "../pages/teacher/CreateQuiz";
import MyQuizzes from "../pages/teacher/MyQuizzes";
import TeacherDashboard from "../pages/teacher/Dashboard";
import LessonsAdd from "../pages/teacher/lessons/LessonsAdd";
import LessonsManage from "../pages/teacher/lessons/LessonsManage";
import LessonsEdit from "../pages/teacher/lessons/LessonsEdit";
import AssignmentsAdd from "../pages/teacher/assignments/AssignmentsAdd";
import AssignmentsManage from "../pages/teacher/assignments/AssignmentsManage";
import AssignmentsEdit from "../pages/teacher/assignments/AssignmentsEdit";
import KnowledgeBaseAdd from "../pages/teacher/knowledge-base/KnowledgeBaseAdd";
import KnowledgeBaseManage from "../pages/teacher/knowledge-base/KnowledgeBaseManage";
import KnowledgeBaseEdit from "../pages/teacher/knowledge-base/KnowledgeBaseEdit";

const TeacherRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <TeacherSidebar
        isOpen={isMobileMenuOpen}
        close={() => setIsMobileMenuOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
      
      {/* 3. Content area (DashboardLayout now offsets for fixed sidebar) */}
      <div className="w-full transition-all duration-300">
        <div className={`transition-all duration-300 `}>
          <Routes>
            <Route path="dashboard" element={<TeacherDashboard />} />

            {/* Quiz Routes */}
            <Route path="quizzes" element={<MyQuizzes />} />
            <Route path="quiz/create" element={<CreateQuiz />} />
            <Route path="lessons" element={<Navigate to="manage" replace />} />
            <Route path="lessons/add" element={<LessonsAdd />} />
            <Route path="lessons/manage" element={<LessonsManage />} />
            <Route path="lessons/edit/:id" element={<LessonsEdit />} />
            <Route path="assignments" element={<Navigate to="manage" replace />} />
            <Route path="assignments/add" element={<AssignmentsAdd />} />
            <Route path="assignments/manage" element={<AssignmentsManage />} />
            <Route path="assignments/edit/:id" element={<AssignmentsEdit />} />
            <Route path="knowledge-base" element={<Navigate to="manage" replace />} />
            <Route path="knowledge-base/add" element={<KnowledgeBaseAdd />} />
            <Route path="knowledge-base/manage" element={<KnowledgeBaseManage />} />
            <Route path="knowledge-base/edit/:id" element={<KnowledgeBaseEdit />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default TeacherRoutes;