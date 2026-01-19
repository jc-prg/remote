//--------------------------------
// jc://remote/
//--------------------------------


let rmData = undefined;


/* coordinate data preparation based on data type */
class RemotePrepareData extends RemoteDefaultClass {
    constructor (name, data) {
        super(name);

        this._data = undefined;

        this.apis = new RemotePrepareDataApis(this.name + ".apis");
        this.devices = new RemotePrepareDataDevices(this.name + ".devices");
        this.device_groups = new RemotePrepareDataGroups(this.name + ".device_groups");
        this.elements = new RemotePrepareDataElements(this.name + ".elements");
        this.macros = new RemotePrepareDataMacros(this.name + ".macros");
        this.record = new RemotePrepareDataRecording(this.name + ".record");
        this.scenes = new RemotePrepareDataScenes(this.name + ".scenes")
        this.templates = new RemotePrepareDataTemplates(this.name + ".templates")

        this.update(data);
    }

    // update class data with fresh data from server
    update(data, status_only=false) {
        if (status_only) {
            this._data["STATUS"] = data;
        } else {
            this._data = data;
        }

        this.devices.update( data );
        this.device_groups.update( data );
        this.elements.update( data );
        this.macros.update( data );
        this.record.update( data );
        this.scenes.update( data );
        this.templates.update( data );
        this.apis.update( data );
    }
}


/* prepare macro data */
class RemotePrepareDataMacros extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this._data = undefined;

        this.categories_global = ["device-on", "device-off", "global"];
        this.categories_scenes = ["scene","scene-on","scene-off","channel"];
        this.categories = ["device-on", "device-off", "global", "scene-on", "scene-off"];

        this.device_groups = new RemotePrepareDataGroups(this.name + ".device_groups");
        this.devices = new RemotePrepareDataDevices(this.name + ".devices");
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_macros = this._data["CONFIG"]["macros"];
        this.config_scene_macros = this.update_scene_macros();
        this.config_scenes = this._data["CONFIG"]["scenes"];
        this.config_devices = this._data["CONFIG"]["devices"];

        this.device_groups.update( data );
        this.devices.update( data );
    }

    // collect macros from scene definitions
    update_scene_macros () {
        let result = {};
        for (let key in this.config_scenes) {
            let macro_channel = this.config_scenes[key]["remote"]["macro-channel"];
            let macro_scene = this.config_scenes[key]["remote"]["macro-scene"];

            //if (this.config_scenes[key]["remote"]["macro-scene-on"]) { macro_scene["scene-on"] = this.config_scenes[key]["remote"]["macro-scene-on"]; }
            //if (this.config_scenes[key]["remote"]["macro-scene-off"]) { macro_scene["scene-off"] = this.config_scenes[key]["remote"]["macro-scene-off"]; }

            result[key] = {
                "channel": macro_channel,
                "scene": macro_scene,
                "scene-on": this.config_scenes[key]["remote"]["macro-scene-on"],
                "scene-off": this.config_scenes[key]["remote"]["macro-scene-off"],
            }
        }
        return result;
    }

    // return complete macro data
    data(category="", macro_id="", expected_type={}) {

        let result = expected_type;
        if (category === "") {
            for (let c in this.categories_global) { this.list_all(c); }
        }
        else if (this.categories_global.includes(category) && macro_id === "") {
            result = this.config_macros[category];
        }
        else if (this.categories_global.includes(category)) {
            result = this.config_macros[category];
            if (result[macro_id]) {
                result = result[macro_id];
            } else {
                result = expected_type;
                this.logging.warn(`data(): macro '${category}:${macro_id}' does not exist.`);
            }
        }
        else if (this.categories_scenes.includes(category) && macro_id !== "") {
            if (this.config_scene_macros[macro_id] && this.config_scene_macros[macro_id][category]) {
                return this.config_scene_macros[macro_id][category];
            } else {
                this.logging.error(`data(): ${macro_id}|${category} not found`);
            }
        }
    else {
            this.logging.error(`data(): category '${category}|${macro_id}' does not exist.`);
        }
        return result;
    }

    // check if macro exists
    exists(category, macro_id) {
        let macros = this.list_all();
        if (macros[category].includes(macro_id)) { return true; }
        else { return false; }
    }

    // list all macros as dict of arrays or all macros of a category as an array
    list_all(category="", scene_id="", incl_on_off=false) {

        if (category === "") {
            let result = {};
            for (let c in this.categories_global) {
                result[this.categories_global[c]] = this.list_all(this.categories_global[c]);
            }
            return result;
        }
        else if (this.categories_global.includes(category)) {
            return Object.keys(this.config_macros[category]);
        }
        else if (this.categories_scenes.includes(category)) {
            return Object.keys(this.config_scene_macros[scene_id][category]);
        }
        else {
            this.logging.error(`list_all(): category "${category}|${scene_id}" does not exist.`);
            return [];
        }
    }

    // list all macro categories as an array
    list_categories() {
        return this.categories;
    }

    // prepare source data for macro editing
    prepare_edit_sources(show_devices=true, devices_include_invisible=false, show_macros_global=false, show_macros_device=false, show_groups=false) {
        let result = {};

        // add device buttons as source
        if (show_devices) {
            let devices = this.devices.list_all(devices_include_invisible);
            for (let i in devices) {
                let device_id = devices[i];
                result[device_id] = {
                    color: "devices",
                    commands: this.devices.list_buttons(device_id),
                    label: this.config_devices[device_id]["settings"]["label"]
                };

            }
        }

        // add global macros as source
        if (show_macros_global) {
            result["macro"] = {
                color: "macros",
                commands: Object.keys(this.config_macros["global"]),
                label: "Global"
            };

        }

        // add dev-on / dev-off macros as source
        if (show_macros_device) {
            result["dev-on"] = {
                color: "macros",
                commands: Object.keys(this.config_macros["device-on"]),
                label: "Device-On"
            };
            result["dev-off"] = {
                color: "macros",
                commands: Object.keys(this.config_macros["device-off"]),
                label: "Device-Off"
            };
        }

        // add group buttons as source
        if (show_groups) {
            let groups = this.device_groups.list_all();
            for (let i in groups) {
                let group_id = groups[i];
                result["group_" + group_id] = {
                    color: "groups",
                    commands: this.device_groups.list_buttons(group_id),
                    label: this.device_groups.config_groups[group_id]["description"] || group_id
                }
            }
        }

        return result;
    }

    // create a dict to be used in a <select> element
    select(category, prefix="", prefix_key="", short=false, initial={}) {
        let result = initial;
        for (let macro_id in this.config_macros["global"]) {
            let key;
            if (prefix_key !== "") { key = `${prefix_key}_${macro_id}`; } else { key = macro_id; }

            if (prefix !== "")              { result[key] = prefix + ": " + macro_id; }
            else                            { result[key] = macro_id;  }
        }
        return result;
    }

}


/* prepare group data */
class RemotePrepareDataGroups extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this._data = undefined;
        this.devices = new RemotePrepareDataDevices(this.name+".devices");
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_groups = this._data["CONFIG"]["macros"]["groups"];
        this.config_devices = this._data["CONFIG"]["devices"];

        this.devices.update(data);
    }

    // return a complete data for a group
    data(group_id) {
        if (this.list_all().includes(group_id)) {
            return this.config_groups[group_id];
        }
        else {
            this.logging.error(`data(): group_id "${group_id}" does not exist.`);
            return [];
        }
    }

    // return description of a group
    description(group_id) {
        if (this.config_groups[group_id] && this.config_groups[group_id]["description"]) {
            return this.config_groups[group_id]["description"];
        }
        else if (this.config_groups[group_id]) {
            this.logging.warn(`description(): No description for '${group_id}' available.`)
            return group_id;
        }
        else {
            this.logging.warn(`description(): No group '${group_id}' available.`)
            return group_id;
        }
    }

    // return true, if id exists
    exists(group_id) {
        return this.config_groups[group_id];
    }

    // return devices of a group
    list_devices(group_id) {
        if (this.config_groups[group_id] && this.config_groups[group_id]["devices"]) {
            return this.config_groups[group_id]["devices"];
        }
        else if (this.config_groups[group_id]) {
            this.logging.warn(`description(): No devices for '${group_id}' available.`)
            return group_id;
        }
        else {
            this.logging.warn(`description(): No group '${group_id}' available.`)
            return group_id;
        }

    }

    // list all available group ids as an array
    list_all() {
        return Object.keys(this.config_groups);
    }

    // list all common buttons of all devices combined in a group
    list_buttons(group_id) {
        if (!this.config_groups[group_id]) {
            this.logging.error(`list_buttons(): group_id "${group_id} does not exist."`);
            return [];
        }

        let result = [];
        let buttons = {};
        if (this.config_groups[group_id]["devices"].length > 0) {
            for (let i in this.config_groups[group_id]["devices"]) {
                let device_id = this.config_groups[group_id]["devices"][i];
                buttons[device_id] = this.devices.list_buttons(device_id);
            }
            let result_temp = Object.values(buttons);
            result = result_temp.reduce((common, arr) =>
                common.filter(item => arr.includes(item))
            );
        }
        return result;
    }

    // list all common commands of all devices combined in a group
    list_commands(group_id, get_set) {

        const group_data = this.config_groups[group_id];
        if (group_data && (get_set === "get" || get_set === "set")) {
            let devices = this.list_devices(group_id);
            let buttonArrays = devices.map(device => this.config_devices[device]["commands"][get_set]);
            return buttonArrays.reduce((acc, arr) => acc.filter(btn => arr.includes(btn)));
        } else {
            return [];
        }

    }

    // create a dict to be used in a <select> element
    select(prefix="", prefix_key="", short=false, initial={}) {
        let result = initial;
        for (let group_id in this.config_groups) {
            let key;
            if (prefix_key !== "") { key = `${prefix_key}_${group_id}`; } else { key = group_id; }

            if (prefix !== "")              { result[key] = prefix + ": " + this.description(group_id); }
            else                            { result[key] = this.description(group_id);  }
            if (!short)                     { result[key] += " (" + group_id + ")"; }
        }
        return result;
    }

    // check if device has ranges - for slider option
    has_ranges(group_id, commands=false) {
        let has_ranges_count = 0;
        let has_ranges_cmd = [];

        if (!this.config_groups[group_id]) {
            this.logging.error("has_ranges(): Group '"+group_id+"' doesn't exist.");
            return false;
        }
        let devices = this.list_devices(group_id);
        for (let key in devices) {
            if (!commands && this.devices.has_ranges(devices[key])) { has_ranges_count += 1; }
            else { has_ranges_cmd.push(this.devices.has_ranges(devices[key], true)); }
        }
        if (!commands) {
            return (devices.length === has_ranges_count);
        } else {
            return has_ranges_cmd.reduce((acc, arr) => acc.filter(btn => arr.includes(btn)));
        }
    }

    // check if devices of the group hav color settings - for color picker options
    has_colors(group_id, commands=false) {
        let has_colors_count = 0;
        let has_colors_cmd = [];
        if (!this.config_groups[group_id]) {
            this.logging.error("has_colors(): Group '"+group_id+"' doesn't exist.");
            return false;
        }
        let devices = this.list_devices(group_id);
        for (let key in devices) {
            if (!commands && this.devices.has_colors(devices[key])) { has_colors_count += 1; }
            else { has_colors_cmd.push(this.devices.has_colors(devices[key], true)); }
        }
        if (!commands) {
            return (devices.length === has_colors_count);
        } else {
            return has_colors_cmd.reduce((acc, arr) => acc.filter(btn => arr.includes(btn)));
        }
    }

}


/* prepare device data */
class RemotePrepareDataDevices extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_devices = this._data["CONFIG"]["devices"];
    }

    // returns api method
    api_method(device_id) {
        if (this.exists(device_id)) {
            return this.data(device_id)["interface"]["method"];
        }
    }

    // return a complete data for a device
    data(device_id) {
        if (this.list_all().includes(device_id)) {
            return this.config_devices[device_id];
        }
        else {
            this.logging.error(`data(): device_id "${device_id}" does not exist.`);
            return [];
        }
    }

    // return description of a device
    description(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["settings"]["description"]) { return this.config_devices[device_id]["settings"]["description"]; }
        else {
            this.logging.error(`description(): device_id "${device_id} does not exist."`)
            return device_id;
        }
    }

    // return display of a scene
    display(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["remote"]["display"] && this.config_devices[device_id]["remote"]["display"]["values"]) {
            return this.config_devices[device_id]["remote"]["display"]["values"];
        }
        else if (this.config_devices[device_id] && this.config_devices[device_id]["remote"]["display"]) {
            return this.config_devices[device_id]["remote"]["display"];
        }
        else {
            this.logging.info(`label(): no display for device_id "${device_id}" available.`)
            return {};
        }
    }

    // return if display exists in the remote control
    display_exists(device_id) {
        if (this.exists(device_id)) {
            let def_remote = this.remote(device_id)
            let def_display = this.display(device_id);

            return !!(def_remote.includes("DISPLAY") && def_display && def_display !== {});
        } else {
            this.logging.error(`display_exists(): device ${device_id} not found.`);
        }
    }

    // return display-size of a scene
    display_size(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["remote"]["display"] && this.config_devices[device_id]["remote"]["display"]["size"]) {
            return this.config_devices[device_id]["remote"]["display"]["size"];
        }
        else if (this.config_devices[device_id] && this.config_devices[device_id]["remote"]["display-size"]) {
            return this.config_devices[device_id]["remote"]["display-size"];
        }
        else {
            this.logging.info(`label(): no display-size for device_id "${device_id}" available.`)
            return {};
        }
    }

    // return true, if id exists
    exists(device_id, check_format=false) {
        if (!check_format) { return this.config_devices[device_id]; }
        else { return (this.config_devices[device_id] && this.config_devices[device_id]["remote"] && this.config_devices[device_id]["buttons"] && this.config_devices[device_id]["settings"]); }
    }

    // check if device has ranges - for slider option
    has_ranges(device, commands=false) {
        let has_ranges = false;
        let range_cmd = [];
        let cmd_definition = this.config_devices[device]["commands"]["definition"];
        let cmd_send = this.config_devices[device]["commands"]["set"]
        Object.keys(cmd_definition).forEach(key => {
            let param = cmd_definition[key];
            let send = (cmd_send.indexOf(key) >= 0);
            if (send && param["values"] !== undefined && param["values"]["max"] !== undefined && param["values"]["min"] !== undefined) {
                has_ranges = true;
                range_cmd.push(key);
            }
        });

        if (!commands) {
            return has_ranges;
        } else {
            return range_cmd;
        }
    }

    // check if device has color settings - for color picker options
    has_colors(device, commands=false) {
        let has_colors = false;
        let color_cmd = [];
        let cmd_definition = this.config_devices[device]["commands"]["definition"];
        Object.keys(cmd_definition).forEach(key => {
            if (key.toLowerCase().indexOf("color") >= 0) { has_colors = true; color_cmd.push(key); }
            if (key.toLowerCase().indexOf("brightness") >= 0) { has_colors = true; color_cmd.push(key); }
        });
        if (!commands) {
            return has_colors;
        } else {
            return color_cmd;
        }
    }

    // return label of a device
    image(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["settings"]["image"]) {
            return this.config_devices[device_id]["settings"]["image"];
        }
        else {
            this.logging.error(`label(): image for device_id "${device_id} does not exist."`)
            return "";
        }
    }

    // return label of a device
    label(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["settings"]["label"]) { return this.config_devices[device_id]["settings"]["label"]; }
        else {
            this.logging.error(`label(): device_id "${device_id} does not exist."`)
            return device_id;
        }
    }

    // return a list of all available device ids
    list_all(show_invisible=true) {
        let result = [];
        if (show_invisible) {
            result = Object.keys(this.config_devices);
        }
        else {
            for (let device in this.config_devices) {
                if (this.config_devices[device]["settings"]["visible"] === "yes") {
                    result.push(device);
                }
            }
        }
        return result;
    }

    // return dict of array with all device buttons or an array of buttons for specific devices
    list_buttons(device_id="") {
        if (device_id === "") {
            let result = {};
            for (let device in this.config_devices) { result[device_id] = this.config_devices[device_id]["buttons"]; }
            return result;
        }
        else if (this.list_all().includes(device_id)) {
            return this.config_devices[device_id]["buttons"];
        }
        else {
            this.logging.error(`list_buttons(): device_id "${device_id} does not exist."`);
            return [];
        }
    }

    // return a list of all available commands (get, set)
    list_commands(device_id, get_set) {
        if (this.list_all().includes(device_id) && this.config_devices[device_id]["commands"][get_set]) {
            return this.config_devices[device_id]["commands"][get_set];
        }
        else if(!this.config_devices[device_id]["commands"][get_set]) {
            this.logging.error(`list_commands(): get_set="${get_set}" does not exist for "${device_id}".`);
            return [];
        }
        else {
            this.logging.error(`list_commands(): device_id "${device_id}" does not exist.`);
            return [];
        }

    }

    // return remote definition
    remote(device_id) {
        if (this.list_all().includes(device_id) && this.config_devices[device_id]["remote"]["remote"]) {
            return this.config_devices[device_id]["remote"]["remote"];
        }
        else if (!this.config_devices[device_id]["remote"]["remote"]) {
            this.logging.error(`data(): for device "${device_id}" no remote definition is available.`);
            return [];
        }
        else {
            this.logging.error(`data(): device_id "${device_id}" does not exist.`);
            return [];
        }
    }

    // return description of a device
    remote_position(device_id) {
        if (this.config_devices[device_id] && this.config_devices[device_id]["settings"]["position"]) { return this.config_devices[device_id]["settings"]["position"]; }
        else {
            this.logging.error(`position(): scene_id "${device_id} does not exist."`)
            return 1000;
        }
    }

    // create a dict to be used in a <select> element
    select(prefix="", prefix_key="", short=false, initial={}) {
        let result = initial;
        for (let device_id in this.config_devices) {
            let key;
            if (prefix_key !== "") { key = `${prefix_key}_${device_id}`; } else { key = device_id; }

            if (prefix !== "")              { result[key] = prefix + ": " + this.label(device_id); }
            else                            { result[key] = this.label(device_id);  }
            if (!short)                     { result[key] += " (" + device_id + ")"; }
        }
        return result;
    }

    // no scenes yet
    not_available() {
        return (!this.config_devices || this.list_all().length === 0);
    }

}


/* prepare scene data */
class RemotePrepareDataScenes extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_scenes = this._data["CONFIG"]["scenes"];
    }

    // return a complete data for a scene
    data(scene_id) {
        if (this.exists(scene_id)) {
            return this.config_scenes[scene_id];
        }
        else {
            this.logging.error(`data(): device_id "${scene_id}" does not exist.`);
            return [];
        }
    }

    // return description of a device
    description(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["settings"]["description"]) { return this.config_scenes[scene_id]["settings"]["description"]; }
        else {
            this.logging.error(`description(): scene_id "${scene_id} does not exist."`)
            return scene_id;
        }
    }

    // return chart of a scene
    chart(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"]["chart"] && this.config_scenes[scene_id]["remote"]["chart"]["values"]) {
            return this.config_scenes[scene_id]["remote"]["chart"]["values"];
        }
        else {
            this.logging.info(`chart(): no display for device_id "${scene_id}" available.`)
            return [];
        }
    }

    // return display of a scene
    display(scene_id) {

        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"]["display"] && this.config_scenes[scene_id]["remote"]["display"]["values"]) {
            return this.config_scenes[scene_id]["remote"]["display"]["values"];
        }
        else if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"]["display"]) {
            return this.config_scenes[scene_id]["remote"]["display"];
        }
        else {
            this.logging.info(`display(): no display for device_id "${scene_id}" available.`)
            return {};
        }
    }

    // return display-size of a scene
    display_size(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"]["display"] && this.config_scenes[scene_id]["remote"]["display"]["size"]) {
            return this.config_scenes[scene_id]["remote"]["display"]["size"];
        }
        else if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"]["display-size"]) {
            return this.config_scenes[scene_id]["remote"]["display-size"];
        }
        else {
            this.logging.info(`display(): no display-size for device_id "${scene_id}" available.`)
            return {};
        }
    }

    // return true, if id exists
    exists(scene_id, check_format=false) {
        if (!check_format) { return this.config_scenes[scene_id]; }
        else { return (this.config_scenes[scene_id] && this.config_scenes[scene_id]["remote"] && this.config_scenes[scene_id]["settings"]); }
    }

    // return label of a scene
    label(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["settings"]["label"]) { return this.config_scenes[scene_id]["settings"]["label"]; }
        else {
            this.logging.error(`label(): device_id "${scene_id}" does not exist.`)
            return scene_id;
        }
    }

    // return label of a scene
    image(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["settings"]["image"]) {
            return this.config_scenes[scene_id]["settings"]["image"];
        }
        else {
            this.logging.error(`label(): image for scene_id "${scene_id} does not exist."`)
            return "";
        }
    }

    // return a list of all available device ids
    list_all(show_invisible=true) {
        let result = [];
        if (show_invisible) {
            result = Object.keys(this.config_scenes);
        }
        else {
            for (let device in this.config_scenes) {
                if (this.config_scenes[device]["settings"]["visible"] === "yes") {
                    result.push(device);
                }
            }
        }
        return result;
    }

    // return dict of array with all device buttons or an array of buttons for specific devices
    list_buttons(scene_id="") {
        if (scene_id === "") {
            let result = {};
            for (let device in this.config_scenes) { result[scene_id] = this.config_scenes[scene_id]["buttons"]; }
            return result;
        }
        else if (this.list_all().includes(scene_id)) {
            return Object.keys(this.config_scenes[scene_id]["remote"]["remote"]).sort();
        }
        else {
            this.logging.error(`list_buttons(): device_id "${scene_id} does not exist."`);
            return [];
        }
    }

    // return remote definition
    remote(scene_id) {
        if (this.list_all().includes(scene_id) && this.config_scenes[scene_id]["remote"]["remote"]) {
            return this.config_scenes[scene_id]["remote"]["remote"];
        }
        else if (!this.config_scenes[scene_id]["remote"]["remote"]) {
            this.logging.error(`data(): for device "${scene_id}" no remote definition is available.`);
            return [];
        }
        else {
            this.logging.error(`data(): device_id "${scene_id}" does not exist.`);
            return [];
        }
    }

    // return description of a device
    remote_position(scene_id) {
        if (this.config_scenes[scene_id] && this.config_scenes[scene_id]["settings"]["position"]) { return this.config_scenes[scene_id]["settings"]["position"]; }
        else {
            this.logging.error(`postion(): scene_id "${scene_id} does not exist."`)
            return 1000;
        }
    }

    // no scenes yet
    not_available() {
        return (!this.config_scenes || this.list_all().length === 0);
    }
}


/* prepare scene data */
class RemotePrepareDataTemplates extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_templates = this._data["CONFIG"]["templates"]["definition"];
        this.list_templates = this._data["CONFIG"]["templates"]["list"];
    }

    // return data for a template
    data(template_id) {
        if (this.list_all().includes(template_id)) {
            return this.config_templates[template_id];
        }
        else {
            this.logging.error(`data(): template_id "${template_id}" does not exist.`);
            return [];
        }
    }

    // return description of a template
    description(template_id) {
        if (this.config_templates[template_id] && this.config_templates[template_id]["description"]) {
            return this.config_templates[template_id]["description"];
        }
        else if (this.config_templates[template_id]) {
            this.logging.warn(`description(): No description for '${template_id}' available.`)
            return template_id;
        }
        else {
            this.logging.warn(`description(): No template '${template_id}' available.`)
            return template_id;
        }
    }

    // list all template keys
    list_all() {
        return Object.keys(this.config_templates);
    }

    // return dict for select
    select(template_type="", prefix="", prefix_key="", short=true, initial={}) {
        let result = initial;
        for (let template_id in this.config_templates) {
            let key;
            if (prefix_key !== "") { key = `${prefix_key}_${template_id}`; } else { key = template_id; }

            if (template_type === "" || template_type === this.type(template_id)) {
                if (prefix !== "")  { result[key] = prefix + ": " + this.description(template_id); }
                else                { result[key] = this.description(template_id); }
                if (!short)         { result[key] += " (" + template_id + ")"; }
            }
        }
        return result;
    }

    // return type of template
    type(template_id) {
        if (this.config_templates[template_id] && this.config_templates[template_id]["type"]) {
            return this.config_templates[template_id]["type"];
        }
        else if (this.config_templates[template_id]) {
            this.logging.warn(`description(): No description for '${template_id}' available.`)
            return "unknown";
        }
        else {
            this.logging.warn(`description(): No template '${template_id}' available.`)
            return "unknown";
        }
    }
}


/* prepare data for charts of recorded data */
class RemotePrepareDataRecording extends RemoteDefaultClass {
    constructor(name) {
        super(name);
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_record = this._data["CONFIG"]["record"]["config"];
        this.config_available = this._data["CONFIG"]["record"]["available_dates"];
        this.config_values = this._data["CONFIG"]["record"]["config"]["record"];
    }

    // return recording configuration
    configuration() {
        return this.config_record;
    }

    // return available dates where recorded data exist
    available() {
        return this.config_available;
    }

    // return recorded values
    recorded_values() {
        return Object.keys(this.config_values);
    }
}


/* prepare other elements data */
class RemotePrepareDataElements extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_apis = this._data["CONFIG"]["apis"];
        this.config_elements = this._data["CONFIG"]["elements"];
        this.config_remotes = this._data["CONFIG"]["remotes"];
    }

    // return description of a template
    data(element_id) {
        if (element_id === "apis") {
            return this.config_apis;
        }
        else if (element_id === "remotes") {
            return this.config_remotes;
        }
        else if (this.config_elements[element_id]) {
            return this.config_elements[element_id];
        }
        else {
            this.logging.warn(`description(): No element '${element_id}' available.`)
            return {};
        }
    }

    // list all template keys
    list_all() {
        let result = Object.keys(this.config_elements);
        result.push("apis");
        result.push("remotes");
        return result;
    }
}


/* prepare data for APIs and API-Device; initial step just offer raw data ... later more logic possible */
class RemotePrepareDataApis extends RemoteDefaultClass {
    constructor(name) {
        super(name);
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;
        this.config_apis = this._data["CONFIG"]["apis"];
    }

    data(element_id) {
        if (this.config_apis[element_id]) {
            return this.config_apis[element_id];
        } else {
            this.logging.error(`data(): No element with the id ${element_id} available.`)
        }
    }

}


remote_scripts_loaded += 1;
