//--------------------------------
// jc://remote/
//--------------------------------


let remoteData = undefined;



/* coordinate data preparation based on data type */
class RemotePrepareData {
    constructor (name, data) {
        this.app_name = name;
        this._data = undefined;

        this.devices = new RemotePrepareDataDevices(this.app_name + ".device");
        this.groups = new RemotePrepareDataGroups(this.app_name + ".group");
        this.macros = new RemotePrepareDataMacros(this.app_name + ".macro");

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
        this.groups.update( data );
        this.macros.update( data );
    }
}


/* prepare macro data */
class RemotePrepareDataMacros {
    constructor(name) {
        this.app_name = name;
        this._data = undefined;

        this.categories_global = ["device-on", "device-off", "global"];
        this.categories_scenes = ["scene-on", "scene-off"];
        this.categories = ["device-on", "device-off", "global", "scene-on", "scene-off"];

        this.groups = new RemotePrepareDataGroups(this.app_name + ".groups");
        this.devices = new RemotePrepareDataDevices(this.app_name + ".devices");
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_macros = this._data["CONFIG"]["macros"];
        this.config_scenes = this._data["CONFIG"]["scenes"];
        this.config_devices = this._data["CONFIG"]["devices"];

        this.groups.update( data );
        this.devices.update( data );
    }

    // list all macros as dict of arrays or all macros of a category as an array
    list(category="") {

        if (category === "") {
            let result = {};
            for (let c in this.categories) { this.list(c); }
            return result;
        }
        else if (this.categories_global.includes(category)) {
            return Object.keys(this.config_macros[category]);
        }
        else if (this.categories_scenes.includes(category)) {
            let result = {};
            for (let scene in this.config_scenes) {
                if (this.config_scenes[scene]["macro-"+category]) { result[scene] = Object.keys(this.config_scenes[scene]["macro-"+category]); }
            }
            return result;
        }
        else {
            console.error(`RemotePrepareDataMacros.list(): category "${category} does not exist."`);
            return [];
        }
    }

    // return complete macro data
    data(category="") {

        let result = {};
        if (category === "") {
            for (let c in this.categories) { this.list(c); }
        }
        else if (this.categories_global.includes(category)) {
            result = this.config_macros[category];
        }
        else if (this.categories_scenes.includes(category)) {
            for (let scene in this.config_scenes) {
                if (this.config_scenes[scene]["macro-"+category]) { result[scene] = this.config_scenes[scene]["macro-"+category]; }
            }
        }
        else {
            console.error(`RemotePrepareDataMacros.data(): category "${category} does not exist."`);
        }
        return result;
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
            let devices = this.devices.list(devices_include_invisible);
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
            let groups = this.groups.list();
            for (let i in groups) {
                let group_id = groups[i];
                result["group_" + group_id] = {
                    color: "groups",
                    commands: this.groups.list_common_buttons(group_id),
                    label: this.groups.config_groups[group_id]["description"] || group_id
                }
            }
        }

        return result;
    }
}


/* prepare group data */
class RemotePrepareDataGroups {
    constructor() {
        this.app_name = name;
        this._data = undefined;

        this.devices = new RemotePrepareDataDevices(this.app_name+".devices");
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_groups = this._data["CONFIG"]["macros"]["groups"];

        this.devices.update(data);
    }

    // list all available group ids as an array
    list() {
        return Object.keys(this.config_groups);
    }

    // list all common buttons of all devices combined in a group
    list_common_buttons(group_id) {
        if (!this.config_groups[group_id]) {
            console.error(`RemotePrepareDataMacros.common_buttons(): group_id "${group_id} does not exist."`);
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
}


/* prepare group data */
class RemotePrepareDataDevices {
    constructor() {
        this.app_name = name;
        this._data = undefined;
    }

    // update class data with fresh data from server
    update(data) {
        this._data = data;

        this.config_devices = this._data["CONFIG"]["devices"];
    }

    // return a list of all available device ids
    list(show_invisible=true) {
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
        else if (this.list().includes(device_id)) {
            return this.config_devices[device_id]["buttons"];
        }
        else {
            console.error(`RemotePrepareDataDevices.list_buttons(): device_id "${device_id} does not exist."`);
            return [];
        }
    }
}