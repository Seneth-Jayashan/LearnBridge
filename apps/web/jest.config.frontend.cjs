module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    // ── Static assets ────────────────────────────────────────────────────────
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.cjs",
    "\\.(jpg|jpeg|png|gif|svg|ico)$": "<rootDir>/__mocks__/fileMock.cjs",
    "^lucide-react$": "<rootDir>/__mocks__/lucide-react.cjs",

    // ── Teacher quiz components (tests use old components/ path) ─────────────
    "^../../../components/teacher/quiz/CreateQuiz\\.jsx$":
      "<rootDir>/src/pages/teacher/Quiz/CreateQuiz.jsx",
    "^../../../components/teacher/quiz/EditQuiz\\.jsx$":
      "<rootDir>/src/pages/teacher/Quiz/EditQuiz.jsx",
    "^../../../components/teacher/quiz/MyQuizzes\\.jsx$":
      "<rootDir>/src/pages/teacher/Quiz/MyQuizzes.jsx",
    "^../../../components/teacher/quiz/QuizResults\\.jsx$":
      "<rootDir>/src/pages/teacher/Quiz/QuizResults.jsx",

    // ── QuizResults test also imports via ../../components/ path ─────────────
    "^../../components/teacher/quiz/QuizResults\\.jsx$":
      "<rootDir>/src/pages/teacher/Quiz/QuizResults.jsx",

    // ── Student pages (tests use flat pages/ path) ───────────────────────────
    "^../../pages/QuizList\\.jsx$":
      "<rootDir>/src/pages/student/QuizList.jsx",
    "^../../pages/QuizResults\\.jsx$":
      "<rootDir>/src/pages/student/QuizResult.jsx",
    "^../../pages/TakeQuiz\\.jsx$":
      "<rootDir>/src/pages/student/TakeQuiz.jsx",

    // ── Services & contexts ──────────────────────────────────────────────────
    "^../../../services/(.*)$": "<rootDir>/src/services/$1",
    "^../../services/(.*)$":    "<rootDir>/src/services/$1",
    "^../../../contexts/(.*)$": "<rootDir>/src/contexts/$1",
    "^../../contexts/(.*)$":    "<rootDir>/src/contexts/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
  testMatch: ["**/tests/unit/**/*.test.jsx", "**/tests/unit/**/*.test.js"],
  coverageThreshold: {
    global: { branches: 75, functions: 80, lines: 80, statements: 80 },
  },
  verbose: true,
  testTimeout: 10000,
};
