import { useState } from "react";
import { useOutletContext, Routes, Route } from "react-router-dom";
import StudentSidebar from "../components/sidebar/StudentSidebar";
import QuizList from "../pages/student/QuizList";
import TakeQuiz from "../pages/student/TakeQuiz";
import QuizResults from "../pages/student/QuizResult";
import StudentModules from "../pages/student/StudentModules";
import StudentAssignments from "../pages/student/StudentAssignments";

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
          <Route path="assignments" element={<StudentAssignments />} />
          {/* ... Add other student routes here ... */}
        </Routes>
      </div>
    </>
  );
};

export default StudentRoutes;