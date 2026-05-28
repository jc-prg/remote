"use strict";

const { loadScript } = require("../helpers/load-script");

let rmApi;

beforeAll(() => {
    global.remote_scripts_loaded = 0;

    global.RemoteDefaultClass = class {
        constructor(name) {
            this.name = name;
            this.logging = {
                debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(),
            };
        }
    };

    global.appFW = { requestAPI: jest.fn() };
    global.appMsg = { alert: jest.fn(), confirm: jest.fn() };
    global.lang = jest.fn((key) => key);
    global.document = { getElementById: jest.fn() };

    loadScript("app/remote-v3/rm_functions-api.js");
});

beforeEach(() => {
    rmApi = new RemoteApiControl("rmApi");
    appFW.requestAPI.mockClear();
    appMsg.alert.mockClear();
    appMsg.confirm.mockClear();
    document.getElementById.mockReset();
});

// ---------------------------------------------------------------------------
// Bug #1 — param = param.push(device) overwrites param with the array length
// ---------------------------------------------------------------------------

test("test_push_does_not_overwrite_param", () => {
    // Documents the bug: Array.push() returns the new length (a number), not the array.
    // The fix is to use push() as a statement, not an assignment.
    const param = ["power", "toggle"];
    const returnValue = param.push("mydevice"); // returns new length
    expect(typeof returnValue).toBe("number");
    expect(returnValue).toBe(3);
    // param itself is still the array after a statement push
    expect(Array.isArray(param)).toBe(true);
    expect(param).toEqual(["power", "toggle", "mydevice"]);
});

test("test_command_delete_param_is_array", () => {
    // Regression for bug #1: the old code did `param = param.push(device)` which
    // made param a number. The fix: `param.push(device)` as a statement.
    // Test that after prepare("CommandDelete"), confirm() receives an array param.

    // getElementById: device returns null → device = device_id string
    //                 button returns a mock <select> with one option selected
    document.getElementById.mockImplementation((id) => {
        if (id === "btn_select") {
            return { options: [{ value: "power_toggle" }], selectedIndex: 0 };
        }
        return null;
    });

    const confirmSpy = jest.spyOn(rmApi, "confirm");

    rmApi.call("CommandDelete", ["mydevice", "btn_select"]);

    expect(confirmSpy).toHaveBeenCalled();
    const [, paramArg] = confirmSpy.mock.calls[0];
    // param must be an array — not a number (the old bug) or undefined
    expect(Array.isArray(paramArg)).toBe(true);
    // should contain the device name and the split button parts
    expect(paramArg).toContain("mydevice");
});

// ---------------------------------------------------------------------------
// Bug #4 — double API request when both temp_callback and command.answer are set
// ---------------------------------------------------------------------------

test("test_execute_fires_one_request_with_callback", () => {
    // When only temp_callback is set, exactly one requestAPI call must be made.
    const cb = jest.fn();
    rmApi.temp_callback = cb;
    // Use a command with no answer defined
    rmApi.commands["_TestNoAnswer"] = { command: "test", method: "GET" };

    rmApi.execute("_TestNoAnswer", []);

    expect(appFW.requestAPI).toHaveBeenCalledTimes(1);
    expect(appFW.requestAPI).toHaveBeenCalledWith("GET", ["test"], "", cb, "");
});

test("test_execute_fires_one_request_with_answer", () => {
    // When command.answer is set and no temp_callback, exactly one request is made.
    const answerFn = jest.fn();
    rmApi.temp_callback = undefined;
    rmApi.commands["_TestWithAnswer"] = { command: "test", method: "GET", answer: answerFn };

    rmApi.execute("_TestWithAnswer", []);

    expect(appFW.requestAPI).toHaveBeenCalledTimes(1);
    expect(appFW.requestAPI).toHaveBeenCalledWith("GET", ["test"], "", answerFn, "");
});

test("test_execute_uses_callback_over_answer", () => {
    // Regression for bug #4: old code had two separate if-blocks, firing two requests
    // when both temp_callback and command.answer were set.
    // Fix: `const callback = this.temp_callback || command.answer || ""`  → one call.
    const cb = jest.fn();
    const answerFn = jest.fn();
    rmApi.temp_callback = cb;
    rmApi.commands["_TestBoth"] = { command: "test", method: "GET", answer: answerFn };

    rmApi.execute("_TestBoth", []);

    // Exactly one request, not two
    expect(appFW.requestAPI).toHaveBeenCalledTimes(1);
    // temp_callback takes precedence over command.answer
    expect(appFW.requestAPI).toHaveBeenCalledWith("GET", ["test"], "", cb, "");
});
