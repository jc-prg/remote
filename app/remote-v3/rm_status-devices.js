//--------------------------------
// jc://remote/
//--------------------------------

let rmStatus;
let rmStatus_logging = false;


// class that offers all types of status information for apis, api-devices, media devices, and scenes
class RemoteDevicesStatus extends RemoteDefaultClass {
    constructor(name, data, load_async=false) {
        super(name);

        this.load_async = load_async;
        this.data = undefined;
        this.app_connection_error = undefined;

        this.status_data = {
            "api": {
            },
            "api-device": {},
            "device": {},
            "scene": {},
            "group": {}
        };
        this.active_apis = {};
        this.active_api_devices = {};
        this.status_api_devices_all = {};
        this.status_devices = {};
        this.config_apis = {};
        this.config_devices = {};
        this.power_devices = {}
        this.power_devices_status = {}
        this.device_keys = {
            "api" : [],
            "api-device": [],
            "device": [],
            "scene": [],
            "group": []
        }

        this.warning = {}
        this.starting = {}
        this.starting_offset = 3 * 60; // if device in this time after API_STARTING shows an error, it is still handled as starting
        this.tab = new RemoteElementTable(this.name + ".tab");

        this.update(data);
    }

    /* set app connection error if detected */
    set_connection_error(error) {
        this.app_connection_error = error;
        this.update();
    }

    /* update main variables and trigger update data structure */
    update (data = undefined) {

        if (data) {
            this.data = data;
            this.set_connection_error(false);
        }

        this.all_apis = this.data["CONFIG"]["apis"]["list"];
        this.active_apis = this.data["STATUS"]["interfaces"]["active"];

        this.status_api_devices = this.data["STATUS"]["interfaces"]["connect"];
        this.status_api_devices_all = this.data["STATUS"]["interfaces"]["structure"];
        this.status_devices = this.data["STATUS"]["devices"];

        this.status_elements = {
            "config_errors": this.data["STATUS"]["config_errors"],
            "structure": this.data["STATUS"]["interfaces"]["structure"],
            "health": this.data["STATUS"]["system"]["health"],
            "interfaces": this.data["STATUS"]["interfaces"],
            "request_time": this.data["STATUS"]["request_time"],
            "system": this.data["STATUS"]["system"],
        }

        this.config_apis = this.data["CONFIG"]["apis"]["list_api_configs"]["list"];
        this.config_apis_structure = this.data["CONFIG"]["apis"]["structure"];
        this.config_devices = this.data["CONFIG"]["devices"];
        this.config_scenes = this.data["CONFIG"]["scenes"];
        this.config_groups = this.data["CONFIG"]["macros"]["groups"];

        this.all_keys = {
            "api" : Object.keys(this.config_apis_structure),
            "api-device": this.data["CONFIG"]["apis"]["list_devices"],
            "device": Object.keys(this.config_devices),
            "scene": Object.keys(this.config_scenes),
            "group": Object.keys(this.config_groups),
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

    /* create a structure of status data */
    create_data () {
        let start_time = new Date().getTime() / 1000;

        this.create_data_apis();
        this.create_data_power_devices();
        this.create_data_api_devices();
        this.create_data_devices();
        this.create_data_scenes();
        this.create_data_groups(); // not implemented yet

        if (rmStatus_logging) {
            this.logging.warn(this.status_data);
            let duration = Math.round(((new Date().getTime()) / 1000 - start_time) * 1000) / 1000;
            this.logging.warn("Duration data preparation: " + duration + "s");
        }
    }

    /* create power devices information */
    create_data_power_devices() {
        let list_power_devices = this.data["CONFIG"]["apis"]["list_api_power_device"];
        let power_devices = [];
        for (let device in list_power_devices) {
            let power_device = list_power_devices[device]
            this.power_devices[power_device] = "";
            this.power_devices_status[power_device] = "N/A";
        }
        for (let device in this.power_devices) {
            if (!device) { continue; }
            let [api, api_device] = device.split("_");
            this.power_devices[device] = this.config_apis_structure[api][api_device][0];
            this.power_devices_status[device] = this.status_devices[this.power_devices[device]]["power"].toUpperCase();
            if (this.config_apis_structure[api][api_device].length > 1) {
                let message = "There are several devices defined as power device. A power device usually consists of an API device with just one connected device!" +
                    "(" + device + ": " + this.config_apis_structure[api][api_device] + ")";
                if (!this.warning[message]) { this.logging.warn(message); }
                this.warning[message] = true;
            }
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

                let power_device = "";
                let power_status = "";
                let power = (this.status_api_devices_all[api]["api_devices"][api_device]["power_device"] && this.status_api_devices_all[api]["api_devices"][api_device]["power_device"] !== "");
                if (power) {
                    power_device = this.power_devices[this.status_api_devices_all[api]["api_devices"][api_device]["power_device"]];
                    power_status = this.status_devices[power_device]["power"];
                }

                if (!this.status_api_devices_all[api]["api_devices"][api_device]["active"]) { status = "DISABLED"; }
                else if (power && this.status_api_devices_all[api]["api_devices"][api_device]["power"] === "OFF") { status = "POWER_OFF"; }
                else if (power && power_status && power_status.indexOf("OFF") > -1) { status = "POWER_OFF"; }
                else if (power && power_status && power_status.indexOf("ERROR") > -1) { status = "POWER_ERROR"; }
                else if (power && power_status && power_status !== "ON") { status = "POWER_ERROR"; }
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
                    "power-status": power_status
                }
                if (!api_summary.includes(status)) { api_summary.push(status);}
            }
            if (this.status_data["api"][api]) {
                this.status_data["api"][api]["api-device-summary"] = api_summary;
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

            // identify power status devices
            let power_status;
            if (this.status_devices[device]["power"]) { power_status = this.status_devices[device]["power"].toUpperCase(); } else { power_status = "ERROR"; }
            if (power_status === "N/A" && this.status_devices[device]["availability"].toUpperCase().indexOf("ONLINE") > -1) { power_status = "ON"; }

            // check, if other status available (Zigbee) ... others might have to follow
            if (power_status === "N/A") {
                let power_details = this.status_device_raw(device);
                if (power_details["availability"] && power_details["availability"].toUpperCase().indexOf("ONLINE") > -1) { power_status = "ON"; }
            }

            // identify labels
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
            else if (api_status.indexOf("ERROR") > -1 || api_device_status.indexOf("ERROR") > -1) { status = "API_ERROR"; }
            else if (api_device_status === "API_STARTING") { status = "API_STARTING"; }
            else if (api_device_status === "POWER_OFF") { status = "POWER_OFF"; }
            else if (power_status.indexOf("ERROR") > -1) { status = "ERROR"; }
            else if (power_status.indexOf("ON") > -1 || power_status.indexOf("OFF") > -1 || power_status.indexOf("N/A") > -1) { status = power_status; }
            else {
                this.logging.error("UNKNOWN:" + device);
                this.logging.error(power_status);
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
                "label_pwr": label_power || power_device,
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
                        this.logging.error("update_data_structure(): No device settings available for " + device);
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

            if (status.indexOf("DISABLED") === 0) { status = "DISABLED"; }

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
        for (let group_id in this.config_groups) {
            let status_check = [];
            let status_device = {};
            let status_apis = [];
            let status_group = "";
            let group = this.config_groups[group_id];
            let message = "";
            let devices_power_off = [];
            let devices_disabled = [];
            let devices_error = [];

            for (let i in group["devices"]) {
                let device_status;
                let device_id = group["devices"][i];

                if (!this.config_devices[device_id]) {
                    device_status = {"status": "ERROR"};
                    message = `The group '${group_id}' contains the device ${device_id} that is not defined.`;
                    this.logging.error(message);
                } else {
                    device_status = this.status_device(device_id, true);
                }
                let api_device = device_status["api"] + "_" + device_status["api-device"];
                if (!status_check.includes(device_status["status"])) { status_check.push(device_status["status"]); }
                if (!status_apis.includes(api_device)) { status_apis.push(api_device); }
                status_device[device_id] = device_status["status"];

                if (device_status["status"].indexOf("ERROR")) { devices_error.push(device_status["message"]); }
                if (device_status["status"].indexOf("DISABLED")) { devices_disabled.push(device_id); }
                if (device_status["status"].indexOf("POWER_OFF")) { devices_power_off.push(device_id); }
            }

            if (status_check.length === 0) {
                status_group = "EMPTY";
            }
            else if (status_check.length === 1) {
                status_group = status_check[0];
            }
            else if (status_check.length > 1 && status_check.includes("API_STARTING")) {
                status_group = "API_STARTING";
            }
            else if (status_check.length > 1 && (status_check.includes("ERROR") || status_check.includes("API_ERROR") || status_check.includes("UNKNOWN"))) {
                status_group = "ERROR";
            }
            else if (status_check.length === 2 && status_check.includes("ON") && status_check.includes("OFF")) {
                status_group = "PARTLY";
            }
            else if (status_check.length > 2 && (status_check.includes("ON") || status_check.includes("OFF")) && (status_check.includes("DISABLED") || status_check.includes("API_DISABLED"))) {
                status_group = "PARTLY_DISABLED";
            }

            if (message === "") {
                // not implemented yet
                message = this.select_message("group", status_group, {
                    "label": group["description"],
                    "devices": group["devices"],
                    "device-errors": devices_error.join(", "),
                    "devices-off": devices_power_off.join(", "),
                    "devices-disabled": devices_disabled.join(", "),
                })
            }

            this.status_data["group"][group_id] = {
                "api-devices": status_apis,
                "devices": group["devices"],
                "message": message,
                "status": status_group,
                "status-devices": status_device,
            }
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
        else if (device_type === "group") {
            if (this.app_connection_error)                      { status_msg = lang("STATUS_NO_SERVER_CONNECT"); }
            else if (status_id === "ON" || status_id === "OFF") { status_msg = lang("STATUS_GROUP_OK", [values["label"]]); }
            else if (status_id === "ERROR")                     { status_msg = lang("STATUS_GROUP_ERROR", [values["label"], values["device-errors"]]); }
            else if (status_id === "API_STARTING")              { status_msg = lang("STATUS_GROUP_API_STARTING", [values["label"]]); }
            else if (status_id === "POWER_OFF")                 { status_msg = lang("STATUS_GROUP_POWER_OFF", [values["label"], values["devices-off"]]); }
            else if (status_id === "PARTLY_DISABLED")           { status_msg = lang("STATUS_GROUP_DISABLED", [values["label"], values["devices-disabled"]]); }
            else if (status_id === "PARTLY")                    { status_msg = lang("STATUS_GROUP_OK", [values["label"]]); }
            else if (status_id === "N/A")                       { status_msg = lang("STATUS_GROUP_N/A", [values["label"]]); }
            else if (status_id === "EMPTY")                     { status_msg = lang("STATUS_GROUP_EMPTY", [values["label"]]); }
            else                                                { status_msg = lang("STATUS_GROUP_OTHER_ERROR", [values["label"]]); }
        }
        return status_msg;
    }

    /* create a 'link' to a device for messages*/
    message_device_link(device_id, device_label) {
        return `<span onclick="rmRemote.create('device','${device_id}');rmSettings.hide();" style="cursor:pointer;">${device_label}</span>`;
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
                this.logging.error("get_status(): no status information for '" + device_type + "/" + device_id + "' available.")
            }
        }
        else {
            this.logging.error("get_status(): device-type '" + device_type + "' not available.");
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
            this.logging.error("get_keys(): Device type '"+device_type+"' not available.");
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

    /* get raw status for devices */
    status_device_raw (id) {
        if (this.status_devices[id]) {
            return this.status_devices[id];
        } else  {
            this.logging.error(`No status for device '${id}' available.`);
        }
    }

    /* get status for scenes */
    status_scene (id, details=false) {
        return this.get_status("scene", id, details);
    }

    /* get status for groups */
    status_group (id, details=false) {
        return this.get_status("group", id, details);
    }

    /* return several raw data from status ... potential for more */
    status_system (id) {
        if (this.status_elements[id]) {
            return this.status_elements[id];
        } else {
            this.logging.error(`status_system(): No data available for id '${id}'.`)
            return {};
        }
    }

    /* create a summary of all status information */
    status_summary () {
        let result = "";
        result += this.tab.start();

        for (let api in this.config_apis) {
            let api_status = this.status_api(api, true);
            result += this.tab.line();
            result += this.tab.row("<b>API:</b><br/>", false);
            result += this.tab.row("-&nbsp;"+api, "<b>"+api_status["status"] + "</b> / " + api_status["message"]);

            for (let api_device in this.config_apis_structure[api]) {
                let api_device_status = this.status_api_device(api+"_"+api_device, true);
                result += this.tab.row("&nbsp;<br/><b>API-Device:</b>", false);
                result += this.tab.row("-&nbsp;"+api_device, "<b>"+api_device_status["status"] + "</b> / " + api_device_status["message"]);

                let count = 0;
                for (let device in this.config_devices) {
                    let device_status = this.status_device(device, true);
                    if (device_status["api"] === api && device_status["api-device"] === api_device) {
                        if (count === 0) {
                            result += this.tab.row("&nbsp;<br/><b>Devices:</b>");
                        }
                        result += this.tab.row("-&nbsp;"+device, "<b>"+device_status["status"] + "</b> / " + device_status["message"]);
                        count += 1;
                    }

                }
            }
        }

        result += this.tab.line();
        result += this.tab.row("<b>Scenes:</b>", false);
        for (let scene in this.config_scenes) {
            let scene_status = this.status_scene(scene, true);
            result += this.tab.row("-&nbsp;"+scene, "<b>"+scene_status["status"] + "</b> / " + scene_status["message"]);
        }

        result += this.tab.line();
        result += this.tab.row("<b>Groups:</b>", false);
        for (let group in this.config_groups) {
            let group_status = this.status_group(group, true);
            result += this.tab.row("-&nbsp;"+group, "<b>"+group_status["status"] + "</b> / " + group_status["message"]);
        }

        result += this.tab.end();

        return result;
    }
}


remote_scripts_loaded += 1;
