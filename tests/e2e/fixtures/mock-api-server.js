// Mock REST API server for e2e tests.
// Intercepts requests that the frontend would normally send to the Python/Flask server.
// Endpoints mimic the three-section response shape: { CONFIG, STATUS, DATA }.
//
// Usage: node mock-api-server.js [port]

const express = require("express");

const PORT = parseInt(process.argv[2] || "5001", 10);
const app  = express();

app.use(express.json());

// Allow cross-origin requests from the static frontend server
app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});
app.options("*", (_req, res) => res.sendStatus(204));

// /api/list/ — initial page load call; returns minimal CONFIG so rm_main.js renders.
// Shape mirrors the real server's _api_CONFIG() return value (rm3api.py:58-105).
app.get("/api/list/", (_req, res) => {
    res.json({
        CONFIG: {
            // apis section: rm_status-devices.js:84-88 reads these
            apis: {
                list:                [],
                list_devices:        [],
                list_description:    {},
                list_detect:         {},
                list_api_commands:   {},
                list_api_power_device: {},
                list_api_configs:    { list: {} },
                structure:           {},
            },
            devices:      {},
            elements: {
                button_images: {},
                button_colors: {},
                device_types:  [],
                icons:         {},
                methods:       {},
                scene_images:  {},
                keys_archive:  { scenes: [], devices: [] },
            },
            macros: {
                "device-on":  {},
                "device-off": {},
                "global":     {},
                "groups":     {},
            },
            "main-audio": "NONE",
            record: {
                config:          {},
                available_dates: {},
            },
            remotes:    {},
            scenes:     {},
            templates:  { definition: {}, list: [] },
        },
        // STATUS shape from rm3api.py:_api_STATUS() and interfaces.py:api_get_status()
        STATUS: {
            config_errors:   [],
            devices:         {},
            // interfaces section read by rm_status-devices.js:67 (.active) and :84 (.structure)
            interfaces: {
                connect:     {},
                active:      {},
                status: {
                    last_reconnect:        "N/A",
                    last_reconnect_device: "",
                    last_discovery:        "N/A",
                },
                structure:   {},
                discovery:   false,
            },
            request_time: 0,
            scenes:       {},
            system: {
                message:               "OK",
                local_network:         true,
                server_start:          0,
                server_start_duration: 0,
                server_running:        0,
                health:                {},
            },
        },
        DATA:   {},
    });
});

// /api/version/ — called by appCheckUpdates on load; match current app version
app.get("/api/version/:version", (_req, res) => {
    res.json({ STATUS: { api: "CONNECT" }, DATA: { update: false }, CONFIG: {} });
});

// /api/status/ — polling endpoint; return minimal response
app.get("/api/status/", (_req, res) => {
    res.json({ STATUS: { api: "CONNECT" }, DATA: {}, CONFIG: {} });
});

// Catch-all: return empty success so unhandled calls don't cause CORS errors
app.all("*", (_req, res) => {
    res.json({ STATUS: { api: "CONNECT" }, DATA: {}, CONFIG: {} });
});

const server = app.listen(PORT, "127.0.0.1", () => {
    process.stdout.write(`mock-api-server listening on http://127.0.0.1:${PORT}\n`);
});

process.on("SIGTERM", () => { server.close(); process.exit(0); });
process.on("SIGINT",  () => { server.close(); process.exit(0); });
