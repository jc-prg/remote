"use strict";

const { loadScript } = require("../helpers/load-script");

// Stub globals required by rm_cookies.js before loading the script.
beforeAll(() => {
    global.remote_scripts_loaded = 0;

    // Minimal RemoteDefaultClass — only logging is used by RemoteCookies
    global.RemoteDefaultClass = class {
        constructor(name) {
            this.name = name;
            this.logging = {
                debug: jest.fn(),
                info: jest.fn(),
                error: jest.fn(),
                warning: jest.fn(),
            };
        }
    };

    // jcCookie stub: stores values as strings (mimics document.cookie serialisation)
    global.jcCookie = function(appName) {
        const store = {};
        this.set = (name, value) => {
            store[name] = String(value === undefined ? "" : value);
        };
        this.get = (name) => (Object.prototype.hasOwnProperty.call(store, name) ? store[name] : null);
        this.erase = (name) => { delete store[name]; };
    };

    loadScript("app/remote-v3/rm_cookies.js");
});

describe("RemoteCookies", () => {
    let rc;

    beforeEach(() => {
        rc = new RemoteCookies("testapp");
    });

    test("test_set_with_string_value", () => {
        // set() with a plain string stores it directly in the cookie
        rc.set("hello");
        expect(rc.cookie.get(rc.cookie_remote)).toBe("hello");
        expect(rc.get()).toEqual(["hello"]);
    });

    test("test_set_with_array_joins_with_separator", () => {
        // set() with a non-empty array joins elements with ::
        rc.set(["a", "b"]);
        expect(rc.cookie.get(rc.cookie_remote)).toBe("a::b");
        expect(rc.get()).toEqual(["a", "b"]);
    });

    test("test_set_with_empty_array_does_not_store", () => {
        // set() with an empty array should not store a non-empty value — regression for bug #3
        // (old code: `values !== []` was always true, calling join() on every array)
        rc.set([]);
        // get() must return an empty array, not [""]
        expect(rc.get()).toEqual([]);
    });

    test("test_set_reference_check_never_blocks_array", () => {
        // Confirms bug #3 fix: Array.isArray(values) && values.length > 0 is used,
        // not the always-true `values !== []` reference comparison.
        // Non-empty arrays must use :: separator:
        rc.set(["device", "tv", "Television"]);
        expect(rc.cookie.get(rc.cookie_remote)).toBe("device::tv::Television");
        // Empty array must not produce a :: separated string:
        rc.set([]);
        expect(rc.cookie.get(rc.cookie_remote)).not.toContain("::");
    });

    test("test_get_returns_correct_value", () => {
        // get() returns the stored values as an array
        rc.set("myvalue");
        expect(rc.get()).toEqual(["myvalue"]);
    });

    test("test_get_missing_key_returns_empty_array", () => {
        // When no cookie has been set, get() returns [] (not null, not an exception)
        const fresh = new RemoteCookies("fresh_instance");
        expect(fresh.get()).toEqual([]);
    });
});
