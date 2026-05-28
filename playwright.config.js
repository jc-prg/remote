// @ts-check
const { defineConfig, devices } = require("@playwright/test");
const fs = require("fs");

// On NixOS, Playwright's bundled Chromium is a generic Linux binary that cannot
// run due to the Nix store's dynamic linker layout.  Find the system Chromium.
// The path is the Nix store path for the currently installed Chromium package.
// Override via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var if needed.
function findSystemChromium() {
    const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

    const candidates = [
        // Nix store path (update hash when Chromium is upgraded)
        "/nix/store/zqg7sy2ig8xzybxd14jd5hxx39mh5jzw-chromium-147.0.7727.137/bin/chromium",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
    ];
    return candidates.find((p) => fs.existsSync(p)) || undefined;
}

module.exports = defineConfig({
    testDir:   "tests/e2e",
    testMatch: "test_*.js",

    use: {
        baseURL:           "http://127.0.0.1:8080",
        browserName:       "chromium",
        headless:          true,
        ignoreHTTPSErrors: true,
        launchOptions: {
            executablePath: findSystemChromium(),
        },
    },

    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

    // Start the mock API server (port 5001) and the static frontend server (port 8080)
    // before any tests run. Playwright waits for both to be ready.
    webServer: [
        {
            command: "node tests/e2e/fixtures/mock-api-server.js 5001",
            url:     "http://127.0.0.1:5001/api/list/",
            reuseExistingServer: true,
            timeout: 10000,
        },
        {
            command: "node tests/e2e/fixtures/static-server.js 8080",
            url:     "http://127.0.0.1:8080/index.html",
            reuseExistingServer: true,
            timeout: 10000,
        },
    ],
});
