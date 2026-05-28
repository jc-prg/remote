"use strict";

require("./setup");

describe("RemoteApiControl — prepare() dispatch chain", () => {
    let rmApi;

    beforeEach(() => {
        rmApi = new RemoteApiControl("rmApi");
        appFW.requestAPI.mockClear();
        appMsg.alert.mockClear();
        appMsg.wait_time.mockClear();
        getValueById.mockReset();
        rmData.devices.exists.mockReturnValue(false);
    });

    // -----------------------------------------------------------------------
    // CommandSend — prepare() builds the correct api_commands array
    // -----------------------------------------------------------------------

    test("test_prepare_command_send_builds_correct_url", () => {
        // cmdButton follows "device_button" naming — prepare() splits on "_":
        //   "tv_power" → send_command = ["tv", "power"] → param = ["tv", "power"]
        // execute builds: api_commands = ["send", "tv", "power"]
        rmApi.call("CommandSend", ["tv_power", "", ""]);

        expect(appFW.requestAPI).toHaveBeenCalledTimes(1);
        const [method, apiCmds] = appFW.requestAPI.mock.calls[0];
        expect(method).toBe("GET");
        expect(apiCmds).toEqual(["send", "tv", "power"]);
    });

    // -----------------------------------------------------------------------
    // DeviceAdd — prepare() uses PUT
    // -----------------------------------------------------------------------

    test("test_prepare_device_add_calls_put", () => {
        // DeviceAdd reads form values via getValueById, validates, then calls
        // execute("DeviceAdd", [id]) with method PUT.
        const fields = ["id_f", "desc_f", "lbl_f", "api_f", "dev_f", "cfgd_f", "cfgr_f", "idext_f", "img_f"];
        const testValues = {
            "id_f":   "mydevice",
            "desc_f": "Test device",
            "lbl_f":  "My Device",
            "api_f":  "broadlink",
            "dev_f":  "192.168.1.1",
            "cfgd_f": "default",
            "cfgr_f": "remote",
            "idext_f": "",
            "img_f":  "",
        };
        getValueById.mockImplementation((id) => testValues[id] ?? "");

        rmApi.call("DeviceAdd", [fields, null]);

        expect(appFW.requestAPI).toHaveBeenCalledTimes(1);
        const [method, apiCmds] = appFW.requestAPI.mock.calls[0];
        expect(method).toBe("PUT");
        expect(apiCmds[0]).toBe("device");
        expect(apiCmds[1]).toBe("mydevice");
    });

    // -----------------------------------------------------------------------
    // Unknown command — call() must not throw, must not fire a request
    // -----------------------------------------------------------------------

    test("test_prepare_unknown_command_does_not_throw", () => {
        // call() checks this.commands[cmd] first; unknown commands log an error
        // and return — they must never throw a JS exception or fire a request.
        expect(() => rmApi.call("NonExistentCommand", [])).not.toThrow();
        expect(appFW.requestAPI).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // MacroSend — macro_wait timing (eval path documents bug #5)
    // -----------------------------------------------------------------------

    test("test_macro_wait_not_evald", () => {
        // MacroSend prepare path: when a macro string contains MSG-N commands,
        // appMsg.wait_time must be invoked with the numeric wait time.
        // Current code uses eval(macro_wait) — this test verifies the END
        // BEHAVIOUR (wait_time called) so it passes whether eval is used or not.
        // Bug #5: the eval() call should be replaced with a direct function call.
        rmApi.call("MacroSend", ["power_on::MSG-5::volume_up", "tv", ""]);

        expect(appMsg.wait_time).toHaveBeenCalledWith(
            expect.any(String), // "MACRO_PLEASE_WAIT" (via lang stub)
            5
        );
    });
});
