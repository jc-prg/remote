// Minimal static file server for e2e tests.
// Serves the app/ directory as document root on the given port.
// Usage: node static-server.js [port]
//
// Docker/Apache normally serves app/ at the root.
// This replaces that for test environments where PHP is not available.

const express = require("express");
const path    = require("path");

const PORT    = parseInt(process.argv[2] || "8080", 10);
const appRoot = path.resolve(__dirname, "../../../app");

const app = express();
app.use(express.static(appRoot));

const server = app.listen(PORT, "127.0.0.1", () => {
    process.stdout.write(`static-server listening on http://127.0.0.1:${PORT}\n`);
});

// Keep alive until parent process exits
process.on("SIGTERM", () => { server.close(); process.exit(0); });
process.on("SIGINT",  () => { server.close(); process.exit(0); });
