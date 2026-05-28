/** @type {import('jest').Config} */
module.exports = {
    testMatch: ["**/tests/unit/test_*.js", "**/tests/integration/test_*.js"],
    testPathIgnorePatterns: ["/node_modules/"],
    testEnvironment: "node",
};
