// jest.config.js  (project root)
export default {
  testEnvironment: "node",
  transform: {},                 // no transform – native ESM
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/tests/unit/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "api/controllers/QuizController.js",
    "api/validators/QuizValidator.js",
    "api/models/Quiz.js",
    "api/models/QuizResult.js",
  ],
  coverageThresholds: {
    // Fail CI if coverage drops below these
    global: {
      branches:   80,
      functions:  85,
      lines:      85,
      statements: 85,
    },
  },
  verbose: true,
  // Give async tests a generous but bounded timeout
  testTimeout: 10_000,
};