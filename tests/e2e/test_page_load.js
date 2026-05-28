// @ts-check
"use strict";

// E2E smoke tests for jc://remote/ page load.
//
// Infrastructure (managed by playwright.config.js webServer entries):
//   - Static server:  http://127.0.0.1:8080  (serves app/ directory)
//   - Mock API:       http://127.0.0.1:5001  (Express stub for Flask server)
//
// config_stage.js sets server_port=5001, so the frontend builds its RESTurl as
//   http://127.0.0.1:5001/  (ip[0] from location.host = "127.0.0.1", port 5001)
// which routes directly to the mock server.

const { test, expect } = require("@playwright/test");

// -----------------------------------------------------------------------
// test_page_loads_without_js_errors
// The page must complete its initial load without throwing any uncaught
// JavaScript exceptions. Console errors from 404s for optional assets are
// filtered — only hard JS exceptions count.
// -----------------------------------------------------------------------

test("test_page_loads_without_js_errors", async ({ page }) => {
    const jsErrors = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    // Brief wait so async init code (requestAPI calls etc.) can settle
    await page.waitForTimeout(500);

    expect(jsErrors).toEqual([]);
});

// -----------------------------------------------------------------------
// test_title_element_contains_app_name
// The static <title> in index.html must say "jc://remote/" — if the build
// or serve step mangles the HTML the title would be wrong or missing.
// -----------------------------------------------------------------------

test("test_title_element_contains_app_name", async ({ page }) => {
    await page.goto("/index.html", { waitUntil: "domcontentloaded" });

    const title = await page.title();
    expect(title).toBe("jc://remote/");
});

// -----------------------------------------------------------------------
// test_api_list_called_on_load
// Documents the page-load behaviour: app-main.js calls requestAPI with the
// configured appApiStatus endpoint ("list") immediately on load.
// The test intercepts the request before it leaves the browser.
// -----------------------------------------------------------------------

test("test_api_list_called_on_load", async ({ page }) => {
    let listCallCount = 0;

    await page.route("**/api/list/**", (route) => {
        listCallCount += 1;
        route.continue();
    });

    await page.goto("/index.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    expect(listCallCount).toBeGreaterThanOrEqual(1);
});

// -----------------------------------------------------------------------
// test_no_xml_declaration_in_response
// The server must return HTML, not XML. A mis-configured Content-Type or
// accidentally served XML would break every browser render.
// -----------------------------------------------------------------------

test("test_no_xml_declaration_in_response", async ({ page }) => {
    const response = await page.goto("/index.html");
    const body = await response.text();

    expect(body.trimStart()).not.toMatch(/^<\?xml/);
    expect(body).toContain("<!doctype html>");
});
