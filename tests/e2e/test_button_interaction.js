// @ts-check
"use strict";

// E2E tests for remote-control button interactions.
//
// Infrastructure:
//   - Static server:  http://127.0.0.1:8080  (serves app/, via playwright.config.js webServer)
//   - API calls:      intercepted via page.route() so tests are isolated from any real server
//
// page.route() intercepts the browser's /api/list/ call and returns controlled mock data
// containing a single device "tv" with a "power" button.  This ensures tests run
// identically regardless of whether the real Flask server is running on port 5001.
//
// Device "tv" renders as <button id="tv_power"> in the remote control.
// Clicking it calls rmApi.call("CommandSend", ["tv_power","","tv"]) which
// (with deactivateButton=false default in config_main.js) dispatches
// GET /api/send_check/tv/power/.

const { test, expect } = require("@playwright/test");

// Minimal CONFIG+STATUS that satisfies all rm_status-devices.js and rm_remote-data.js accessors.
// Shape mirrors rm3api.py:_api_CONFIG() and _api_STATUS().
//
// STATUS.interfaces.structure must have the "test" API + "test_tv" api-device so that
// create_data_api_devices() populates status_data["api-device"]["test_test_tv"].
// STATUS.devices must have "tv" so create_data_devices() runs and populates
// status_data["device"]["tv"] — needed by show_status_devices() which iterates
// Object.keys(CONFIG.devices) = ["tv"].
const MOCK_RESPONSE = {
    CONFIG: {
        apis: {
            list:                ["test"],
            list_devices:        [],
            list_description:    {},
            list_detect:         {},
            list_api_commands:   {},
            list_api_power_device: {},
            list_api_configs:    { list: { test: {} } },
            structure:           {},
        },
        devices: {
            tv: {
                remote:   { remote: ["power"], display: {}, "display-size": "middle" },
                buttons:  ["power"],
                settings: { label: "TV", description: "Test TV", position: 1, visible: "yes", image: "" },
                commands: { definition: {}, set: [], get: [] },
                interface: { api_key: "test", api_device: "test_tv", api: "test_test_tv", remote: "rmc_tv", method: "send" },
                config:   { device: "test-tv", api_key: "test" },
            },
        },
        elements: {
            button_images: {}, button_colors: {}, device_types: [],
            icons: {}, methods: {}, scene_images: {},
            keys_archive: { scenes: [], devices: [] },
        },
        macros: { "device-on": {}, "device-off": {}, "global": {}, "groups": {} },
        "main-audio": "NONE",
        record: { config: {}, available_dates: {} },
        remotes: {},
        scenes:  {},
        templates: { definition: {}, list: [] },
    },
    STATUS: {
        config_errors: { devices: {}, scenes: {} },
        devices: {
            tv: { power: "N/A", availability: "N/A" },
        },
        interfaces: {
            connect:  {},
            active:   { test: true },
            status:   { last_reconnect: "N/A", last_reconnect_device: "", last_discovery: "N/A" },
            structure: {
                test: {
                    api_devices: {
                        test_tv: { active: true, connect: "Connected", power_device: "", power: "" },
                    },
                },
            },
            discovery: false,
        },
        request_time: 0,
        scenes:       {},
        system: { message: "OK", local_network: true, server_start: 0,
                  server_start_duration: 0, server_running: 0, health: {} },
    },
    REQUEST: {},
    DATA:    {},
};

// Helper: intercept all API calls with controlled mock data,
// load the page, and navigate into the "tv" device remote.
// Uses a function predicate for route matching — more reliable than glob patterns.
async function loadDeviceRemote(page) {
    // Intercept only /api/list/ to inject controlled mock data.
    // Other API calls (send, send_check, status, version) pass through to the
    // mock-api-server or are handled by test-specific route handlers registered
    // before this call.  Playwright matches routes LIFO, so a handler registered
    // after this one has higher priority — registering only /api/list/ here lets
    // test-specific send handlers registered *before* this call still fire.
    await page.route(
        (url) => url.href.includes("/api/list/"),
        (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(MOCK_RESPONSE) })
    );

    await page.goto("/index.html", { waitUntil: "domcontentloaded" });

    // Wait until CONFIG data has been processed: rmData.devices must know about "tv"
    // (exists() returns the config object, which is truthy — not the boolean true)
    // and appPrepareFramework() must have created the frame1..5 elements.
    await page.waitForFunction(() => {
        try {
            return (
                typeof rmData   !== "undefined" &&
                typeof rmRemote !== "undefined" &&
                !!rmData.devices.exists("tv") &&
                rmRemote.data && "CONFIG" in rmRemote.data &&
                document.getElementById("frame1") !== null
            );
        } catch (_) { return false; }
    }, { timeout: 10000 });

    // Navigate to the tv device remote via the real rendering code path
    await page.evaluate(() => rmRemote.create("device", "tv"));

    // Wait for the power button to appear (injected by device_remote())
    await page.waitForSelector("#tv_power", { state: "attached", timeout: 5000 });
}

// -----------------------------------------------------------------------
// test_button_click_sends_api_request
// Clicking the power button must fire a request to the send or send_check
// endpoint for tv/power.  With deactivateButton=false (config_main.js
// default), CommandSend is upgraded to CommandSendCheck, which calls
// /api/send_check/{device}/{button}/.
// -----------------------------------------------------------------------

test("test_button_click_sends_api_request", async ({ page }) => {
    const apiCalls = [];
    // Intercept send calls before the loadDeviceRemote catch-all
    await page.route(
        (url) => url.href.includes("/api/send"),
        (route) => {
            apiCalls.push(route.request().url());
            route.fulfill({ contentType: "application/json",
                            body: JSON.stringify({ STATUS: {}, DATA: {}, CONFIG: {},
                                                   REQUEST: { ReturnCode: "ok", Return: "" } }) });
        }
    );

    await loadDeviceRemote(page);
    // dispatchEvent dispatches directly to the element, bypassing the appMsg_cover overlay
    // that would intercept a coordinate-based page.click().
    // waitForResponse waits until the route handler fulfills the send request, which
    // happens deterministically regardless of how many list requests are ahead in the queue.
    const sendResponsePromise = page.waitForResponse(
        (resp) => resp.url().includes("/api/send"),
        { timeout: 5000 }
    );
    await page.dispatchEvent("#tv_power", "click");
    await sendResponsePromise;

    expect(apiCalls.length).toBeGreaterThanOrEqual(1);
    // Matches /api/send/tv/power/ and /api/send_check/tv/power/
    expect(apiCalls[0]).toMatch(/\/api\/send[^/]*\/tv\/power\//);
});

// -----------------------------------------------------------------------
// test_button_click_fires_exactly_one_request
// Each click must cause exactly one API call — regression guard for
// bug #4 (execute() was called twice per command when both a temp_callback
// and a command.answer were set, producing duplicate requests).
// -----------------------------------------------------------------------

test("test_button_click_fires_exactly_one_request", async ({ page }) => {
    const apiCalls = [];
    await page.route((url) => url.href.includes("/api/send"), (route) => {
        apiCalls.push(route.request().url());
        route.fulfill({ contentType: "application/json",
                        body: JSON.stringify({ STATUS: {}, DATA: {}, CONFIG: {},
                                               REQUEST: { ReturnCode: "ok", Return: "" } }) });
    });

    await loadDeviceRemote(page);
    // Wait deterministically for the first response, then an extra queue tick to catch duplicates.
    const sendResponsePromise = page.waitForResponse(
        (resp) => resp.url().includes("/api/send"),
        { timeout: 5000 }
    );
    await page.dispatchEvent("#tv_power", "click");
    await sendResponsePromise;
    // One extra queue interval to detect a duplicate request (regression for bug #4).
    await page.waitForTimeout(600);

    // Exactly one send request per click — not two (regression for bug #4)
    expect(apiCalls.length).toBe(1);
});

// -----------------------------------------------------------------------
// test_button_click_does_not_raise_js_errors
// Clicking a correctly wired button must not throw uncaught JS exceptions.
// Catches regressions where param array manipulation (bug #1) caused
// "param.push is not a function" crashes.
// -----------------------------------------------------------------------

test("test_button_click_does_not_raise_js_errors", async ({ page }) => {
    const jsErrors = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loadDeviceRemote(page);
    await page.dispatchEvent("#tv_power", "click");
    await page.waitForTimeout(1500);

    expect(jsErrors).toEqual([]);
});

// -----------------------------------------------------------------------
// test_power_information_element_present_in_remote
// device_remote() in rm_remotes.js injects a
// #remote-power-information-{device} element above the button grid.
// Its presence confirms the full device remote template was rendered.
// The element is later updated by status polling to show device state.
// -----------------------------------------------------------------------

test("test_power_information_element_present_in_remote", async ({ page }) => {
    await loadDeviceRemote(page);

    const el = await page.locator("#remote-power-information-tv");
    await expect(el).toHaveCount(1);
});
