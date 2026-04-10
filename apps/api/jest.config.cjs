module.exports = {
  testEnvironment: "node",
  silent: true,
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js", "**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "!**/node_modules/**",
  ],
};