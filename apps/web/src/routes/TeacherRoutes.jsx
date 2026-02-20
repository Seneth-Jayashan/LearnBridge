import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import CreateQuiz from "../pages/teacher/CreateQuiz";
import MyQuizzes from "../pages/teacher/MyQuizzes";

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

      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-64" : "md:pl-20"}`}>
        <Routes>
          <Route path="dashboard" element={<div>Dashboard Content</div>} />

          {/* ── Quiz Routes ── */}
          <Route path="quizzes" element={<MyQuizzes />} />
          <Route path="quiz/create" element={<CreateQuiz />} />
        </Routes>
      </div>
    </>
  );
};

export default TeacherRoutes;