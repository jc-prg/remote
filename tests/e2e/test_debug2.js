// @ts-check
const { test, expect } = require("@playwright/test");

const MOCK = {
    CONFIG: {
        apis: { list: [], list_devices: [], list_description: {}, list_detect: {}, list_api_commands: {}, list_api_power_device: {}, list_api_configs: { list: {} }, structure: {} },
        devices: {
            tv: {
                remote: { remote: ["power"], display: {}, "display-size": "middle" },
                buttons: ["power"],
                settings: { label: "TV", description: "Test TV", position: 1, visible: true, image: "" },
                commands: { definition: {}, set: [], get: [] },
                interface: { api_key: "test", api_device: "test_tv", api: "test_test_tv", remote: "rmc_tv", method: "send" },
                config: { device: "test-tv", api_key: "test" },
            },
        },
        elements: { button_images: {}, button_colors: {}, device_types: [], icons: {}, methods: {}, scene_images: {}, keys_archive: { scenes: [], devices: [] } },
        macros: { "device-on": {}, "device-off": {}, "global": {}, "groups": {} },
        "main-audio": "NONE",
        record: { config: {}, available_dates: {} },
        remotes: {}, scenes: {}, templates: { definition: {}, list: [] },
    },
    STATUS: {
        config_errors: [], devices: {},
        interfaces: { connect: {}, active: {}, status: { last_reconnect: "N/A", last_reconnect_device: "", last_discovery: "N/A" }, structure: {}, discovery: false },
        request_time: 0, scenes: {},
        system: { message: "OK", local_network: true, server_start: 0, server_start_duration: 0, server_running: 0, health: {} },
    },
    REQUEST: {}, DATA: {},
};

// Test WITH pre-registered send route (simulates tests 1-3)
test("test_with_pre_route_then_create", async ({ page }) => {
    // Pre-register send route FIRST
    const apiCalls = [];
    await page.route(
        (url) => url.href.includes("/api/send"),
        (route) => {
            apiCalls.push(route.request().url());
            route.fulfill({ contentType: "application/json", body: JSON.stringify({ STATUS: {}, DATA: {}, CONFIG: {}, REQUEST: { ReturnCode: "ok", Return: "" } }) });
        }
    );

    // Then loadDeviceRemote equivalent
    await page.route(
        (url) => url.href.includes("/api/"),
        (route) => {
            if (route.request().url().includes("/api/list/")) {
                route.fulfill({ contentType: "application/json", body: JSON.stringify(MOCK) });
            } else {
                route.fulfill({ contentType: "application/json", body: JSON.stringify({ STATUS: {}, DATA: {}, CONFIG: {}, REQUEST: {} }) });
            }
        }
    );

    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
        try { return typeof rmData !== "undefined" && !!rmData.devices.exists("tv") && !!document.getElementById("frame1"); }
        catch(_) { return false; }
    }, { timeout: 10000 });

    const result = await page.evaluate(() => {
        try {
            rmRemote.create("device", "tv");
            return { 
                success: true, 
                frame3: document.getElementById("frame3") ? document.getElementById("frame3").innerHTML.substring(0, 200) : "NULL",
                tv_power: !!document.getElementById("tv_power")
            };
        } catch(e) { return { error: e.message, stack: e.stack }; }
    });
    console.log("RESULT:", JSON.stringify(result, null, 2));
    console.log("API CALLS:", apiCalls);
    expect(result.error).toBeUndefined();
});
