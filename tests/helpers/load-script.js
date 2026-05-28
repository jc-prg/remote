// Helper to load vanilla JS files into Jest scope.
// Mirrors browser <script> loading: the file runs in Jest's global context,
// making class/function declarations available as globals.
const vm = require("vm");
const fs = require("fs");
const path = require("path");

// Jest runs each test module in its own vm context.
// vm.createContext(global) contextifies Jest's global so scripts can run in it.
// It is idempotent — calling it again on an already-contextified object is a no-op.
let _ctx = null;

// In jsdom test environments, browser globals like document/window are defined as
// getters on Window.prototype, not as own properties of the global/window object.
// vm.createContext only captures own enumerable properties, so these are invisible
// to scripts running in the context. Copy them as own properties first.
function ensureBrowserGlobalsOwn() {
    const browserKeys = ["document", "window", "navigator", "location", "history"];
    browserKeys.forEach((key) => {
        try {
            if (key in global && !Object.prototype.hasOwnProperty.call(global, key)) {
                const val = global[key]; // invoke getter
                Object.defineProperty(global, key, {
                    value: val,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
        } catch (_) {
            // ignore if property is non-configurable or getter throws
        }
    });
}

function loadScript(relPath) {
    const abs = path.resolve(__dirname, "../../", relPath);
    let src = fs.readFileSync(abs, "utf8");

    // Top-level class declarations in vm scripts are lexically scoped and do NOT
    // automatically become properties of the global object (unlike var).
    // Rewrite `class Foo` → `global.Foo = class Foo` for every top-level class.
    src = src.replace(/^class\s+(\w+)/mg, "global.$1 = class $1");

    if (!_ctx) {
        ensureBrowserGlobalsOwn();
        _ctx = vm.createContext(global);
    }
    vm.runInContext(src, _ctx, { filename: abs });
}

module.exports = { loadScript };
