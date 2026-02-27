import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import StudentSidebar from "../components/sidebar/StudentSidebar";
import QuizList from "../pages/student/QuizList";
import TakeQuiz from "../pages/student/TakeQuiz";
import QuizResults from "../pages/student/QuizResult";
import StudentSidebar from "../components/sidebar/StudentSidebar"; // Adjust path if needed
import StudentModules from "../pages/student/StudentModules";

const StudentRoutes = () => {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useOutletContext();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <StudentSidebar
        isOpen={isMobileMenuOpen}
        close={() => setIsMobileMenuOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />

      <div className={`transition-all duration-300 ${isExpanded ? "md:pl-72" : "md:pl-32"}`}>
        <Routes>
          <Route path="dashboard" element={<div>Dashboard Content</div>} />

          {/* ── Quiz Routes ── */}
          <Route path="quizzes/:courseId" element={<QuizList />} />
          <Route path="quiz/:id" element={<TakeQuiz />} />
          <Route path="results" element={<QuizResults />} />
          <Route path="modules" element={<StudentModules />} />
          {/* ... Add other student routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default StudentRoutes;