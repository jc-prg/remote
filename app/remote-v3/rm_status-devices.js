//--------------------------------
// jc://remote/
//--------------------------------

let statusCheck_devices;
let statusCheck_devices_logging = true;


// class that offers all types of status information for apis, api-devices, media devices, and scenes
class RemoteDevicesStatus {
    constructor(name, load_async=false) {
        this.app_name = name;
        this.load_async = load_async;
        this.data = undefined;
        this.app_connection_error = undefined;

        this.status_data = {
            "api": {
            },
            "api-device": {},
            "device": {},
            "scene": {}
        };
        this.active_apis = {};
        this.active_api_devices = {};
        this.status_api_devices_all = {};
        this.status_devices = {};
        this.config_apis = {};
        this.config_devices = {};
        this.power_devices = {}
        this.device_keys = {
            "api" : [],
            "api-device": [],
            "device": [],
            "scene": [],
            "group": []
        }

        this.warning = {}
        this.starting = {}
        this.starting_offset = 10;
    }

    /* set app connection error if detected */
    set_connection_error(error) {
        this.app_connection_error = error;
    }

    /* update main variables and trigger update data structure */
    update (data) {

        this.data = data;

        this.all_apis = this.data["CONFIG"]["apis"]["list"];
        this.active_apis = this.data["STATUS"]["interfaces"]["active"];

        this.status_api_devices = this.data["STATUS"]["interfaces"]["connect"];
        this.status_api_devices_all = this.data["STATUS"]["connections"];
        this.status_devices = this.data["STATUS"]["devices"];

        this.config_apis = this.data["CONFIG"]["apis"]["list_api_configs"]["list"];
        this.config_apis_structure = this.data["CONFIG"]["apis"]["structure"];
        this.config_devices = this.data["CONFIG"]["devices"];
        this.config_scenes = this.data["CONFIG"]["scenes"];

        this.all_keys = {
            "api" : Object.keys(this.config_apis_structure),
            "api-device": this.data["CONFIG"]["apis"]["list_devices"],
            "device": Object.keys(this.config_devices),
            "scene": Object.keys(this.config_scenes),
            "group": []
        }

        if (this.load_async) {
            // trigger structure update asynchronously (as a short delay might be OK)
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => this.create_data());
            } else {
                setTimeout(() => this.create_data(), 0);
            }
        } else {
            // start directly
            this.create_data();
        }
    }

    /* collecting status for all APIs */
    create_data_apis() {
        for (let i=0;i<this.all_apis.length;i++) {
            let api = this.all_apis[i];
            let status_message = "";
            let status_value = "OK";
            if (!this.config_apis[api]) {
                status_value = "ERROR";
                status_message = "No configuration found for API " + api + ".";
            }
            if (!this.active_apis[api]) {
                status_value = "DISABLED";
                status_message = "API " + api + " is disabled.";
            }
            this.status_data["api"][api] = {
                "active": this.active_apis[api],
                "message": status_message,
                "status": status_value
            }
        }
    }

    /* collecting status for all API devices */
    create_data_api_devices() {
        let api_summary = {}
        for (let api in this.status_api_devices_all) {
            let api_summary = [];

            for (let api_device in this.status_api_devices_all[api]["api_devices"]) {
                let key = api + "_" + api_device;
                let status = "OK";

                let power = (this.status_api_devices_all[api]["api_devices"][api_device]["power_device"] && this.status_api_devices_all[api]["api_devices"][api_device]["power_device"] !== "");
                if (power) { this.power_devices[this.status_api_devices_all[api]["api_devices"][api_device]["power_device"]] = ""; }

                if (!this.status_api_devices_all[api]["api_devices"][api_device]["active"]) { status = "DISABLED"; }
                else if (power && this.status_api_devices_all[api]["api_devices"][api_device]["power"] === "OFF") { status = "POWER_OFF"; }
                else if (power && this.status_api_devices_all[api]["api_devices"][api_device]["connect"].indexOf("OFF") > -1) { status = "POWER_OFF"; }
                else if (power && this.status_api_devices_all[api]["api_devices"][api_device]["connect"].indexOf("ERROR") > -1) { status = "POWER_ERROR"; }
                else if (power && this.status_api_devices_all[api]["api_devices"][api_device]["power"] !== "ON") { status = "POWER_ERROR"; }
                else if (this.status_api_devices_all[api]["api_devices"][api_device]["connect"] === "Connected") { status = "OK"; }
                else if (this.status_api_devices_all[api]["api_devices"][api_device]["connect"].indexOf("ERROR") > -1) { status = "ERROR"; }
                else if (this.status_api_devices_all[api]["api_devices"][api_device]["connect"].indexOf("Start") > -1) { status = "STARTING"; }
                else { status = "UNKNOWN"; }

                this.active_api_devices[key] = this.status_api_devices_all[api]["api_devices"][api_device]["active"];
                this.status_data["api-device"][key] = {
                    "api": api,
                    "active": this.status_api_devices_all[api]["api_devices"][api_device]["active"],
                    "message": this.status_api_devices_all[api]["api_devices"][api_device]["connect"],
                    "status": status,
                    "power": this.status_api_devices_all[api]["api_devices"][api_device]["power_device"],
                    "power-status": this.status_api_devices_all[api]["api_devices"][api_device]["power"]
                }
                if (!api_summary.includes(status)) { api_summary.push(status);}
            }
            if (this.status_data["api"][api]) {
                this.status_data["api"][api]["api-device-summary"] = api_summary;
            }
        }
        for (let device in this.power_devices) {
            let [api, api_device] = device.split("_");
            this.power_devices[device] = this.config_apis_structure[api][api_device][0];
            if (this.config_apis_structure[api][api_device].length > 1) {
                let message = "There are several devices defined as power device. A power device usually consists of an API device with just one connected device!" +
                              "(" + device + ": " + this.config_apis_structure[api][api_device] + ")";
                if (!this.warning[message]) { console.warn(message); }
                this.warning[message] = true;
            }
        }
    }

    /* collecting status for all devices */
    create_data_devices() {
        for (let device in this.status_devices) {
            if (device === "default") { continue; }

            let api = this.config_devices[device]["interface"]["api_key"];
            let api_device = this.config_devices[device]["interface"]["api_device"];
            let api_key = api + "_" + api_device;
            let api_status  = this.status_data["api"][api]["status"];
            let api_device_status = this.status_data["api-device"][api_key]["status"];
            let active = (this.config_devices[device]["settings"]["visible"] === "yes");

            let status = "OK";
            let power_device = this.status_data["api-device"][api_key]["power"];
            let power_status;
            if (this.status_devices[device]["power"]) { power_status = this.status_devices[device]["power"].toUpperCase(); }
            else { power_status = "ERROR"; }

            let label_power = "";
            if (this.config_devices[this.power_devices[power_device]]) {
                label_power = this.config_devices[this.power_devices[power_device]]["settings"]["label"];
                label_power = this.message_device_link(this.power_devices[power_device], label_power);
            }
            let label_device = "N/A";
            if (this.config_devices[device] && this.config_devices[device]["settings"]["label"]) {
                label_device = this.config_devices[device]["settings"]["label"];
            }

            // identify device status
            if (api_status === "DISABLED" || api_device_status === "DISABLED") { status = "API_DISABLED"; }
            else if (api_status === "UNKNOWN" || api_device_status === "UNKNOWN") { status = "API_UNKNOWN"; }
            else if (api_status.indexOf("ERROR") > -1 || api_device_status.indexOf("ERROR") > -1) { status = "API_ERROR";
                console.error("!!! " + device + " --- " + api_status + " + " + api_device_status);
            }
            else if (api_device_status === "API_STARTING") { status = "API_STARTING"; }
            else if (api_device_status === "POWER_OFF") { status = "POWER_OFF"; }
            else if (power_status.indexOf("ERROR") > -1) { status = "ERROR"; }
            else if (power_status.indexOf("ON") > -1 || power_status.indexOf("OFF") > -1 || power_status.indexOf("N/A") > -1) { status = power_status; }
            else {
                console.error("UNKNOWN:" + device);
                console.error(power_status);
                status = "UNKNOWN";
            }

            // if API (re)starts, devices usually need some additional time to connected - wait a while, until showing an error (defined in constructor)
            if (status === "API_STARTING") { this.starting[device] = new Date(); }
            if (status === "ERROR" && this.starting[device] && new Date() - this.starting[device] > this.starting_offset * 1000) { status = "API_STARTING"; }

            // set status message
            let message = this.select_message("device", status, {
                "api": api,
                "api_device": api_device,
                "api_device_msg": this.status_data["api-device"][api_key]["message"],
                "device": device,
                "label": label_device,
                "label_pwr": label_power,
            });

            // if disabled, status is still OK (but message shows details)
            if (status !== "API_DISABLED" && !active && status !== "ON" && status !== "OFF") { status = "DISABLED"; }

            this.status_data["device"][device] = {
                "api": api,
                "api-status": this.status_data["api"][api]["status"],
                "api-message": this.status_data["api"][api]["message"],
                "api-device": api_device,
                "api-device-message": this.status_data["api-device"][api_key]["message"],
                "api-device-status": this.status_data["api-device"][api_key]["status"],
                "active": active,
                "status": status,
                "power": power_device,
                "power2": label_power,
                "message": message
            }
        }
    }

    /* collection status data for all scenes */
    create_data_scenes() {
        for (let scene in this.config_scenes) {
            let status = "";
            let label = this.config_scenes[scene]["settings"]["label"];
            let buttons = this.config_scenes[scene]["remote"]["remote"].length;
            let dev_required = this.config_scenes[scene]["remote"]["devices"];
            let dev_required_length = dev_required.length;
            let dev_status = {"ON": 0,  "OFF": 0,  "N/A": 0,  "DISABLED": 0,  "ERROR": 0, "API_STARTING": 0};
            let dev_list = {"ON": [], "OFF": [], "N/A": [], "DISABLED": [], "ERROR": [], "API_STARTING": []};
            let dev_list_off_label = [];
            let messages_extended = [];
            let power_off_list = {};
            let power_off_list_label = {};
            let api_list = {}
            let api_list_error = {}

            // check if power device defined and  get status
            let power_device    = "N/A";
            let power_status    = "N/A";
            if (this.config_scenes[scene]["remote"]["power_status"]) { power_device = this.config_scenes[scene]["remote"]["power_status"].split("_"); }
            if (power_device !== "N/A" && power_device.length > 1) { power_status = this.status_devices[power_device[0]][power_device[1]]; }

            // collect status for required devices
            if (dev_required_length > 0) {
                for (let device_id in dev_required) {
                    // collect status infos for each required device
                    let device = dev_required[device_id];
                    let device_status = this.status_data["device"][device]["status"];
                    let device_label = this.config_devices[device]["settings"]["label"];

                    if (!device_status || !device_label) {
                        console.error("RemoteDeviceStatus.update_data_structure(): No device settings available for " + device);
                        continue;
                    }
                    if (!dev_status[device_status]) {
                        dev_status[device_status] = 0;
                        dev_list[device_status] = [];
                    }
                    dev_status[device_status] += 1;
                    dev_list[device_status].push(device);

                    // collect additional parameter for the status messages
                    if (device_status === "ERROR" || device_status === "API_ERROR" || device_status === "API_DISABLED") {
                        if (this.status_data["device"][device]["api-message"] !== "") { messages_extended.push(this.status_data["device"][device]["api-message"]); }
                        else if (this.status_data["device"][device]["api-device-message"] !== "") { messages_extended.push(this.status_data["device"][device]["api-device-message"]); }
                    }
                    else if (device_status === "OFF") {
                        dev_list_off_label.push(this.config_devices[device]["settings"]["label"]);
                    }
                    else if (device_status === "POWER_OFF" && this.status_data["device"][device_id] && this.status_data["device"][device_id]["power"]) {
                        power_off_list[this.status_data["device"][device_id]["power"]] = true;
                        if (this.status_data["device"][this.status_data["device"][device_id]["power"]]) {
                            let pwr_label = this.config_devices[this.status_data["device"][device_id]["power"]]["settings"]["label"];
                            power_off_list_label[pwr_label] = true;
                        }
                    }
                }
            }

            // identify status and set message
            if (dev_required_length === 0)                                          { status = "N/A"; }
            else if (buttons === 0)                                                 { status = "EMPTY"; }
            else if (power_status === "OFF")                                        { status = "POWER_OFF"; }
            else if (dev_status["API_STARTING"] > 0)                                { status = "DISABLED|1"; }
            else if (dev_status["API_DISABLED"] > 0)                                { status = "DISABLED|2"; }
            else if (dev_status["POWER_OFF"] > 0)                                   { status = "POWER_OFF"; }
            else if (dev_status["ON"] === dev_required_length)                      { status = "ON"; }
            else if (dev_status["OFF"] === dev_required_length)                     { status = "OFF"; }
            else if (dev_status["ON"] + dev_status["OFF"] === dev_required_length)  { status = "PARTLY";  } // dev_list["OFF"].join(", ")
            else if (dev_status["DISABLED"] > 0)                                    { status = "DISABLED|3"; }
            else if (dev_status["ERROR"] > 0)                                       { status = "ERROR"; } // dev_list["ERROR"].join(", ")
            else                                                                    { status = "ERROR"; }

            let message = this.select_message("scene", status, {
                "label": label,
                "label_pwr": Object.keys(power_off_list_label).join(", "),
                "device_list": Object.keys(power_off_list).join(", "),
                "list_off": dev_list_off_label.join("; "),
                "list_errors": messages_extended.join("; "),
                "list_disabled": dev_list["DISABLED"].join("; "),
            });

            this.status_data["scene"][scene] = {
                "devices": dev_required,
                "status": status,
                "status-devices": dev_list,
                "power": power_device,
                "message": message,
                "message-extended": messages_extended.join("; ")
            };

        }
    }

    /* collecting status data for all groups */
    create_data_groups() {
        // not implemented yet
    }

    /* create a structure of status data */
    create_data () {
        let start_time = new Date().getTime() / 1000;

        this.create_data_apis();
        this.create_data_api_devices();
        this.create_data_devices();
        this.create_data_scenes();
        this.create_data_groups(); // not implemented yet

        if (statusCheck_devices_logging) {
            console.warn(this.status_data);
            let duration = Math.round(((new Date().getTime()) / 1000 - start_time) * 1000) / 1000;
            console.warn("Duration data preparation: " + duration + "s");
        }
    }

    /* select status message */
    select_message(device_type, status_id, values) {
        let status_msg = "";
        let error_msg = "";

        if (device_type === "device") {
            if (this.app_connection_error)                  { status_msg = lang("STATUS_NO_SERVER_CONNECT"); }
            else if (status_id === "ON" || status_id === "OFF") { status_msg = lang("STATUS_DEV_OK", [values["label"]]); }
            else if (status_id === "N/A")                   { status_msg = lang("STATUS_DEV_N/A", [values["label"]]); }
            else if (status_id === "POWER_OFF")             { status_msg = lang("STATUS_DEV_POWER_OFF", [values["label_pwr"]]); }
            else if (status_id === "API_STARTING")          { status_msg = lang("STATUS_DEV_API_STARTING", [values["api_device"], values["label"]]); }
            else if (status_id === "API_DISABLED")          { status_msg = lang("STATUS_DEV_API_DISABLED", [values["api_device"], values["label"]]); }
            else if (status_id === "API_PWR_DISABLED")      { status_msg = lang("STATUS_DEV_API_DISABLED", [values["device_pwr"], values["label"]]); }
            else if (status_id === "API_ERROR")             { status_msg = lang("STATUS_DEV_API_ERROR", [values["api_device"], values["label"], values["api_device_msg"]]); }
            //else if (status_id === "API_PWR_ERROR")         { status_msg = lang("STATUS_DEV_API_ERROR", [values["device_pwr"], values["label"], error_msg]); }
            //else if (status_id === "API_ERROR_DEVICE")      { status_msg = lang("STATUS_DEV_API_ERROR", [values["api_device"], values["label"]]); }
            else if (status_id === "ERROR_N/A")             { status_msg = lang("STATUS_DEV_OTHER_ERROR", [values["label"]]); }
            else if (status_id === "ERROR_PWR_N/A")         { status_msg = lang("STATUS_DEV_OTHER_ERROR", [values["label_pwr"]]); }
            else                                            { status_msg = lang("STATUS_DEV_OTHER_ERROR", [values["label"]]); }

        }
        else if (device_type === "scene") {
            if (this.app_connection_error)                      { status_msg = lang("STATUS_NO_SERVER_CONNECT"); }
            else if (status_id === "ON" || status_id === "OFF") { status_msg = lang("STATUS_SCENE_OK", [values["label"]]); }
            else if (status_id.indexOf("DISABLED") > -1 ) {
                if (status_id.split("|")[1] === "1")         { status_msg = lang("STATUS_SCENE_STARTING", [values["label"]]); }
                else if (status_id.split("|")[1] === "2")    { status_msg = lang("STATUS_SCENE_API_DISABLED", [values["label"], values["list_errors"]]); }
                else if (status_id.split("|")[1] === "3")    { status_msg = lang("STATUS_SCENE_DISABLED", [values["label"], values["list_disabled"]]); }
            }
            else if (status_id === "N/A")                    { status_msg = lang("STATUS_SCENE_NO_DEVICES", [values["label"]]); }
            else if (status_id === "EMPTY")                  { status_msg = lang("STATUS_SCENE_EMPTY", [values["label"]]); }
            else if (status_id === "POWER_OFF")              { status_msg = lang("STATUS_SCENE_POWER_OFF", [values["label"], values["label_pwr"]]); }
            else if (status_id === "PARTLY")                 { status_msg = lang("STATUS_SCENE_PARTLY", [values["label"], values["list_off"]]); }
            else if (status_id === "ERROR")                  { status_msg = lang("STATUS_SCENE_ERROR", [values["label"], values["list_errors"]]); }
            else                                             { status_msg = lang("STATUS_SCENE_ERROR", [values["label"], values["list_errors"]]); }
        }
        return status_msg;
    }

    /* create a 'link' to a device for messages*/
    message_device_link(device_id, device_label) {
        return `<span onclick="rm3remotes.create('device','${device_id}');rm3settings.hide();" style="cursor:pointer;">${device_label}</span>`;
    }

    /* get status for all device types, includes checks if available*/
    get_status (device_type, device_id, details=false) {
        if (this.status_data[device_type]) {
            if (this.status_data[device_type][device_id]) {
                if (details) {
                    return this.status_data[device_type][device_id];
                } else {
                    return this.status_data[device_type][device_id]["status"];
                }
            }
            else {
                console.error("RemoteDevicesStatus.get_status(): no status information for '" + device_type + "/" + device_id + "' available.")
            }
        }
        else {
            console.error("RemoteDevicesStatus.get_status(): device-type '" + device_type + "' not available.");
        }
    }

    /* return all available device keys */
    get_keys (device_type) {
        if (device_type === "all") {
            return this.all_keys;
        }
        else if (this.all_keys[device_type]) {
            return this.all_keys[device_type];
        }
        else {
            console.error("RemoteDevicesStatus.get_keys(): Device type '"+device_type+"' not available.");
        }
    }

    /* status is available */
    is_available(device_type, device_id) {
        return !!(this.status_data[device_type] && this.status_data[device_type][device_id]);
    }

    /* get status for APIs */
    status_api (id, details=false) {
        return this.get_status("api", id, details);
    }

    /* get status for API devices */
    status_api_device (id, details=false) {
        return this.get_status("api-device", id, details);
    }

    /* get status for devices */
    status_device (id, details=false) {
        return this.get_status("device", id, details);
    }

    /* get status for scenes */
    status_scene (id, details=false) {
        return this.get_status("scene", id, details);
    }
}
