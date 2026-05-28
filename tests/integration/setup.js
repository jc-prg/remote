// Shared integration test setup.
// Require this file from each integration test: require("./setup")
// The beforeAll hook registers before that test file's tests run.

const { loadScript } = require("../helpers/load-script");

beforeAll(() => {
    global.remote_scripts_loaded = 0;
    global.module_scripts_loaded = 0;

    // --- Base class stubs -----------------------------------------------

    global.RemoteDefaultClass = class {
        constructor(name) {
            this.name = name;
            this.logging = {
                debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(),
            };
        }
    };

    // jcCookie: string-coercing in-memory store (mirrors real document.cookie behaviour)
    global.jcCookie = function(appName) {
        const store = {};
        this.set = (name, value) => { store[name] = String(value === undefined ? "" : value); };
        this.get = (name) => (Object.prototype.hasOwnProperty.call(store, name) ? store[name] : null);
        this.erase = (name) => { delete store[name]; };
    };

    // --- App-framework globals -------------------------------------------

    global.appFW  = { requestAPI: jest.fn(), logging: { info: jest.fn() } };
    global.appMsg = {
        alert:     jest.fn(),
        confirm:   jest.fn(),
        info:      jest.fn(),     // shown when showButton is true
        wait_time: jest.fn(),     // called (via eval) by MacroSend for MSG-N wait commands
    };
    global.lang   = jest.fn((key) => key);

    // --- State globals ---------------------------------------------------

    global.rmRemote = { active_type: "device", active_name: "tv" };

    // rmData: the central data cache — stub the parts used by rm_status.js / rm_functions-api.js
    global.rmData = {
        devices: {
            has_interactive_elements: jest.fn(() => true),
            exists: jest.fn(() => false),   // false = device doesn't exist yet (needed by DeviceAdd)
        },
        macros: {
            decompose: jest.fn(() => ["mock_macro_string", ""]),
        },
        scenes: {
            exists: jest.fn(() => false),
        },
    };

    // rmStatus: device-state accessor used inside RemoteVisualizeStatus methods
    global.rmStatus = {
        status_device: jest.fn().mockImplementation((_id, detailed) => {
            if (detailed) return { message: "mock status" };
            return "ON";
        }),
        status_scene: jest.fn().mockImplementation((_id, detailed) => {
            if (detailed) return { message: "mock scene status" };
            return "ON";
        }),
    };

    global.remoteHints     = false;
    global.easyEdit        = false;
    global.jsonHighlighting= false;
    global.deactivateButton= jest.fn();

    // --- Variables defined as `let` in rm_status.js / config_main.js ----------
    // Top-level `let` declarations inside a vm script are NOT shared with other
    // scripts in the same vm context (unlike `var` or globals). We set them as
    // own properties so rm_functions-api.js can read them.
    global.device_media_info = {};   // rm_status.js:5 — used by MacroSend prepare
    global.showButton        = false; // config_main.js — toggles macro request logging

    // --- DOM helper stubs (non-DOM methods called by rm_status.js) ------

    global.setTextById  = jest.fn();
    global.elementVisible = jest.fn();
    global.elementHidden  = jest.fn();
    global.getValueById   = jest.fn(() => "");
    global.getTextById    = jest.fn(() => "");
    global.setValueById   = jest.fn();
    global.check_if_element_or_value = jest.fn((v) => v);

    // --- DOM stub -------------------------------------------------------
    // vm.createContext only captures own properties of the context object.
    // In jsdom, document/window live on Window.prototype (not own), so they
    // are invisible inside vm scripts. Assign a stub as an own property so
    // vm-loaded scripts can call document.getElementById without using real jsdom.
    global.document = {
        getElementById: jest.fn(),
    };

    // --- Load scripts in browser dependency order -----------------------

    loadScript("app/remote-v3/rm_cookies.js");
    loadScript("app/remote-v3/rm_status.js");
    loadScript("app/remote-v3/rm_functions-api.js");
});
