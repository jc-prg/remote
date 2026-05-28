"use strict";

require("./setup");

describe("RemoteVisualizeStatus", () => {
    let rmStatusShow;

    beforeEach(() => {
        rmStatusShow = new RemoteVisualizeStatus("rmStatusShow", {});
        // Restore default rmRemote state
        global.rmRemote.active_type = "device";
        global.rmRemote.active_name = "tv";
        // Reset mocks
        document.getElementById.mockReset();
        setTextById.mockClear();
        elementVisible.mockClear();
        elementHidden.mockClear();
        rmStatus.status_device.mockReset();
        rmStatus.status_device.mockImplementation((_id, detailed) => {
            if (detailed) return { message: "mock status" };
            return "ON";
        });
    });

    // -----------------------------------------------------------------------
    // visualize_message_device — guard conditions (bug #2 regression)
    // The original bug used && instead of || in the guard, so the function
    // only returned early when BOTH conditions were wrong simultaneously.
    // -----------------------------------------------------------------------

    test("test_visualize_message_device_skips_wrong_name", () => {
        // active_name is "tv" but we pass "stereo" — should return immediately
        rmStatusShow.visualize_message_device("stereo");

        // document.getElementById must NOT have been reached
        expect(document.getElementById).not.toHaveBeenCalled();
        expect(setTextById).not.toHaveBeenCalled();
    });

    test("test_visualize_message_device_skips_wrong_type", () => {
        // active_type is "scene", not "device" — should return immediately
        global.rmRemote.active_type = "scene";

        rmStatusShow.visualize_message_device("tv");

        expect(document.getElementById).not.toHaveBeenCalled();
        expect(setTextById).not.toHaveBeenCalled();
    });

    test("test_visualize_message_device_runs_for_correct_device", () => {
        // active_type = "device", active_name = "tv" = device_id → guard passes
        // getElementById returns a truthy element so the second guard also passes
        document.getElementById.mockReturnValue({ id: "remote-power-information-tv" });

        // Use ERROR status: triggers the remoteHints/ERROR branch → elementVisible
        rmStatus.status_device.mockImplementation((_id, detailed) => {
            if (detailed) return { message: "Device error" };
            return "ERROR";
        });

        rmStatusShow.visualize_message_device("tv");

        // Visualization ran — setTextById must have been called
        expect(setTextById).toHaveBeenCalledWith(
            "remote-power-information-tv", expect.any(String)
        );
    });

    // -----------------------------------------------------------------------
    // visualize_attentions — bug #8: helper functions re-defined on every call
    // -----------------------------------------------------------------------

    test("test_visualize_attentions_no_recreate_on_repeat_call", () => {
        // Bug #8: prepare_config_errors and prepare_thread_errors are assigned as
        // `this.fn = function() {}` INSIDE visualize_attentions(), so a new function
        // object is created on every invocation. This documents the current behaviour.
        //
        // If this assertion ever flips to toBe(), the bug has been fixed.
        rmStatusShow.attention_config = false;
        rmStatusShow.attention_threads = false;
        rmStatusShow.attention_local_network = false;
        rmStatusShow.app_connection_error = false;

        rmStatusShow.visualize_attentions();
        const fn1 = rmStatusShow.prepare_config_errors;

        rmStatusShow.visualize_attentions();
        const fn2 = rmStatusShow.prepare_config_errors;

        // Current behaviour: a new function object is created on each call
        expect(fn1).not.toBe(fn2);
    });

    // -----------------------------------------------------------------------
    // colors object structure
    // -----------------------------------------------------------------------

    test("test_colors_object_has_required_keys", () => {
        // The api-status color map is referenced throughout the visualization
        // methods. All keys must be present or colour lookups silently return
        // undefined and break the UI.
        const apiStatus = rmStatusShow.colors["api-status"];
        expect(apiStatus).toHaveProperty("CONNECT");
        expect(apiStatus).toHaveProperty("NO_CONNECT");
        expect(apiStatus).toHaveProperty("WARNING");
        expect(apiStatus).toHaveProperty("ERROR");
        expect(apiStatus).toHaveProperty("OTHER");
    });
});
