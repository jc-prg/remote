//--------------------------------
// jc://remote/
//--------------------------------

let device_media_info = {};
let status_duration = [];
let status_duration_load = [];
let status_load_first = true;
let statusCheck_power;


// load the devices status -> visualization via function statusCheck();
function statusCheck_load() {
    appFW.requestAPI("GET",["list"], "", statusCheck, "" );
}


// coordinate visualization of the devices status
function statusCheck(data={}) {

    const start = Date.now();

	// if not data includes -> error
	if (!data["CONFIG"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		return;
    } else {
        dataAll = data;
    }

    // first load: create classes for audio and device status
    if (status_load_first) {
        remoteData = new RemotePrepareData("remoteData", data);
        remoteStatus = new RemoteDevicesStatus("remoteStatus", data);

        statusCheck_power = new RemoteVisualizePowerStatus("statusCheck_power", remoteStatus);
        statusCheck_audio = new RemoteVisualizeMainAudioStatus("statusCheck_audio", remoteStatus);

        status_load_first = false;
    }

    // update data and status processing
    remoteData.update(data)
    remoteStatus.update(data);

    // show power status and audio status
    statusCheck_power.show_status(data, rm3remotes.edit_mode);
    statusCheck_audio.show_status(data);

    if (!rm3remotes.edit_mode) {
        statusCheck_displayValues(data);
        statusCheck_deviceActive(data);
        statusCheck_groupPowerButton(data);
        statusCheck_sliderToggleColorPicker(data);
        setTextById("edit1", "");
        }
    else {
        const stop = "remoteToggleEditMode(false);remoteSetCookie();remoteFirstLoad_load();";
        const html = "<img src='/icon/edit_stop.png' onclick='" + stop + "' style='cursor:pointer;width:100%' name='stop editing' alt=''>";
        setTextById("edit1", html);
    }

    statusCheck_measure(data, start);
}

// measure Status Check durations
function statusCheck_measure(data, start) {

    const duration = (Date.now() - start) / 1000;
    if (duration < 0.1) { console.debug("statusCheck: Updated all status elements (" + String(duration) + "s)"); }
    else { console.warn("statusCheck: Updated all status elements - longer than expected (max 0.1s): " + String(duration) + "s"); }

    let average = status_duration.reduce((a, b) => a + b, 0) / status_duration.length;
    let average_load = status_duration_load.reduce((a, b) => a + b, 0) / status_duration_load.length;
    average = Math.round(average * 1000)/1000;
    average_load = Math.round(average_load * 1000)/1000;

    setTextById("average_status_duration", "~"+average+"s ");
    setTextById("average_status_duration_load", "~"+average_load+"s ");
    setTextById("current_server_time", data["REQUEST"]["server-time-local"]);

    status_duration.push(duration);
    if (status_duration.length > 10) { status_duration.shift(); }
    status_duration_load.push(data["REQUEST"]["load-time-app"]/1000);
    if (status_duration_load.length > 10) { status_duration_load.shift(); }
}


// status messages in case the server is offline
function statusCheck_offline(data) {
    console.error("Lost connection to the server.");
    statusCheck_deviceActive(data, true);
    remoteStatus.set_connection_error(true);
    statusCheck_power.set_connection_error(true);
}


// check status for all sliders and toggles -> show via color // IN PROGRESS
function statusCheck_sliderToggleColorPicker(data) {

	let devices    = data["STATUS"]["devices"];

	for (let device in devices) {
	    if (!data["CONFIG"]["devices"][device]) { continue; }
	    let device_api         = data["STATUS"]["devices"][device]["api"];
	    let device_api_power   = data["STATUS"]["devices"][device]["power"];
	    let device_api_status  = data["STATUS"]["interfaces"]["connect"][device_api];
	    let device_commands    = data["CONFIG"]["devices"][device]["commands"]["set"];
        let device_status      = remoteStatus.status_device(device);

        for (let key in devices[device]) {
            // device toggle
            if (document.getElementById("toggle_"+device+"_"+key+"_input")) {
                console.debug("statusCheck_sliderToggle: "+device+"_"+key+" - "+device_status);

                let value = data["STATUS"]["devices"][device][key].toUpperCase();
                if (device_status !== "ON" && device_status !== "OFF" && device_status !== "N/A") { value = "ERROR"; }

                if (device_status === "N/A") {
                    statusShow_toggle(device, "toggle_" + device + "_" + key + "_input", "toggle_" + device + "_" + key + "_last_value", "slider_" + device + "_" + key, device_status, "middle");
                }
                else if (value === "ON") {
                    statusShow_toggle(device,"toggle_"+device+"_"+key+"_input","toggle_"+device+"_"+key+"_last_value", "slider_"+device+"_"+key, value, "on");
                }
                else if (value.includes("OFF") >= 0) {
                    statusShow_toggle(device, "toggle_" + device + "_" + key + "_input", "toggle_" + device + "_" + key + "_last_value", "slider_" + device + "_" + key, value, "off");
                }
                else {
                    statusShow_toggle(device,"toggle_"+device+"_"+key+"_input","toggle_"+device+"_"+key+"_last_value", value, "error");
                }
            }

            // device slider
            if (document.getElementById("slider_"+device+"_send-"+key+"_input")) {
                let value  = getTextById("send-" + key + "_value");
                if (device_api_status.toLowerCase() === "connected" && value.toLowerCase() !== "error")   {
                    console.debug("statusCheck_sliderToggle: "+device+"_"+key+"="+value+" - "+device_api_status)
                    if (device_api_power.toUpperCase() === "ON") { statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "slider_"+device+"_send-"+key, "on"); }
                    else                                         { statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "slider_"+device+"_send-"+key, "off"); }
                    }
                else {
                    value = "Error";
                    console.debug("statusCheck_sliderToggle: "+device+"_send-"+key+"="+value+" - "+device_api_status)
                    statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "slider_"+device+"_send-"+key, "error");
                    }
                }

            // device color picker
            if (document.getElementById("color-picker_"+device)) {
                let color_picker = document.getElementById("color-picker_"+device);
                if (device_api_status.toLowerCase() === "connected" && device_api_power && device_api_power.toUpperCase().indexOf("ON") > -1)   {
                    color_picker.style.opacity = "100%";
                    }
                else {
                    color_picker.style.opacity = "40%";
                    }
                }

            for (let i=0;i<device_commands.length;i++) {
                let command = device_commands[i];

                if (document.getElementById("color-picker_"+device+"_send-"+command)) {
                    const color_picker = document.getElementById("color-picker_"+device+"_send-"+command);
                    if (device_api_status.toLowerCase() === "connected" && device_api_power && device_api_power.toUpperCase().indexOf("ON") > -1)   {
                        color_picker.style.opacity = "100%";
                        }
                    else {
                        color_picker.style.opacity = "40%";
                        }
                    }
                }
            }
	    }
    }


// show power status for group power status
function statusCheck_groupPowerButton(data) {

    if (rm3remotes.active_type === "device") { return; }

    const groups = data["CONFIG"]["macros"]["groups"];
    for (let key in groups) {

        let exists = false;
        let options = ["on", "off", "on-off", "ON", "OFF", "ON-OFF"];
        for (let key2 in options) {
            if (document.getElementById("group_" + key + "_" + options[key2])) { exists = true; }
            if (document.getElementById("toggle_group_" + key + "_input")) { exists = true; }
        }
        if (exists) {

            let devices = groups[key]["devices"];
            let count = devices.length;
            let count_on = 0;
            let count_off = 0;
            let count_error = 0;
            let count_na = 0;
            for (let key2 in devices) {

                console.debug(key  + "_" + devices[key2] + " = " + data["STATUS"]["devices"][devices[key2]]["power"] + "/" + data["STATUS"]["devices"][devices[key2]]["api-status"]);
                let status_device = remoteStatus.status_device(devices[key2]);
                if (status_device.toUpperCase() === "ON") { count_on += 1; }
                else if (status_device.toUpperCase() === "OFF") { count_off += 1; }
                else if (status_device.toUpperCase() === "N/A") { count_na += 1; }
                else { count_error += 1; }
            }

            console.debug(count + " = on:" + count_on + " / off:" + count_off + " / error:" + count_error);
            if (count === count_on) {
                statusShow_powerButton( "group_"+key+"_on", "ON");
                statusShow_powerButton( "group_"+key+"_off", "");
                statusShow_powerButton( "group_"+key+"_on-off", "ON");
                statusShow_toggle("","toggle_group_"+key+"_input","toggle_group_"+key+"_last_value", "slider_group_"+key, "ON", "on");
                console.debug("group_" + key + " - ON");

            }
            else if (count === count_off) {
                statusShow_powerButton( "group_"+key+"_on", "");
                statusShow_powerButton( "group_"+key+"_off", "OFF");
                statusShow_powerButton( "group_"+key+"_on-off", "OFF");
                statusShow_toggle("","toggle_group_"+key+"_input","toggle_group_"+key+"_last_value", "slider_group_"+key, "OFF", "off");
                console.debug("group_" + key + " - OFF");
            }
            else if (count === count_off + count_on) {
                // might not be useful for on-off or toggle
                statusShow_powerButton( "group_"+key+"_on", "PARTLY");
                statusShow_powerButton( "group_"+key+"_off", "");
                statusShow_powerButton( "group_"+key+"_on-off", "PARTLY");
                statusShow_toggle("","toggle_group_"+key+"_input","toggle_group_"+key+"_last_value", "slider_group_"+key, "PARTLY", "middle");
                console.debug("group_" + key + " - PARTLY");
            }
            else if (count_na > 0) {
                statusShow_powerButton( "group_"+key+"_on", "");
                statusShow_powerButton( "group_"+key+"_off", "");
                statusShow_powerButton( "group_"+key+"_on-off", "");
                statusShow_toggle("","toggle_group_"+key+"_input","toggle_group_"+key+"_last_value", "slider_group_"+key, "N/A", "");
                console.debug("group_" + key + " - N/A");
            }
            else {
                statusShow_powerButton( "group_"+key+"_on", "ERROR");
                statusShow_powerButton( "group_"+key+"_off", "ERROR");
                statusShow_powerButton( "group_"+key+"_on-off", "ERROR");
                statusShow_toggle("","toggle_group_"+key+"_input","toggle_group_"+key+"_last_value", "slider_group_"+key, "ERROR", "error");
                console.debug("group_" + key + " - ERROR");
            }
        }
    }
}


// check if scene and/or device status is off - format buttons; show status message
function statusCheck_deviceActive(data, app_connection_error=false) {

	if (deactivateButton)	{ return; }
	if (!data["CONFIG"]) {
		console.error("statusCheck_deviceActive: data not loaded.");
		return;
		}

	let devices_status = data["STATUS"]["devices"];
	let devices_config = data["CONFIG"]["devices"];
	let scene = rm3remotes.active_name;

    // check scene status: inactive macro_buttons, deactivate all buttons from list starting with "macro", power message
    if (rm3remotes.active_type === "scene" && scene) {
        let scene_status = remoteStatus.status_scene(scene);
        let status_log = remoteStatus.status_scene(scene, true)["message"];

        console.debug("---> " + scene + " " + scene_status + " - " + status_log);

        let message = "<div class='remote-power-information-image'  onclick='statusCheck_bigMessage(\"scene-power-information-" + scene + "\");'></div>";

        if (scene_status === "POWER_OFF") {
            for (let i=0; i<rm3remotes.active_buttons.length; i++) {
                let button = rm3remotes.active_buttons[i];
                statusShow_buttonActive(button,false);
                }
            for (let i=0; i<rm3remotes.active_channels.length; i++) {
                let button = rm3remotes.active_channels[i];
                statusShow_buttonActive(button,false);
                }
            if (remoteHints) {
                setTextById("scene-power-information-"+scene, message + lang("POWER_DEVICE_OFF_SCENE_INFO"));
                elementVisible("scene-power-information-"+scene);
                }
            else {
                setTextById("scene-power-information-"+scene, "");
                elementHidden("scene-power-information-"+scene);
                }
            }
        else if (scene_status !== "ON" && scene_status !== "OFF"  && scene_status !== "N/A") {
            for (let i=0; i<rm3remotes.active_buttons.length; i++) {
                let button1 = rm3remotes.active_buttons[i].split("_");
                if (button1[0] === "macro") { statusShow_buttonActive(button1[0]+"_"+button1[1],false); }
                }
            if (remoteHints || scene_status && (scene_status.indexOf("ERROR") >= 0 || scene_status.indexOf("DISABLED") >= 0)) {
                setTextById("scene-power-information-"+scene, message + status_log);
                elementVisible("scene-power-information-"+scene);
                }
            else {
                setTextById("scene-power-information-"+scene, "");
                elementHidden("scene-power-information-"+scene);
                }
            }
        else {
            for (let i=0; i<rm3remotes.active_buttons.length; i++) {
                let button1 = rm3remotes.active_buttons[i].split("_");
                if (button1[0] === "macro") { statusShow_buttonActive(button1[0]+"_"+button1[1],true); }
                }
            setTextById("scene-power-information-"+scene, "");
            elementHidden("scene-power-information-"+scene);
            }
        }

	// check device status: if OFF change color of buttons to gray
	let buttons_power  = {"on":1, "off":1, "on-off":1};

	for (let device in devices_status) {

		if (devices_config[device] && devices_config[device]["buttons"] && devices_status[device] && devices_status[device]["power"]) {

		    let status = remoteStatus.status_device(device);
            let info_sign = "<div class='remote-power-information-image'  onclick='statusCheck_bigMessage(\"remote-power-information-" + device + "\");'></div>";
		    let message = info_sign + remoteStatus.status_device(device, true)["message"]; //device_status_log[device];
            let power_on = (status === "ON" || status === "N/A");

			// show device status
			console.debug("statusCheck_deviceActive: " + device + ", " + power_on + "(" + status + ": " + message + ")");

			// show message
            if (app_connection_error) {
                status = "ERROR";
                message = info_sign + lang("STATUS_NO_SERVER_CONNECT");
            }
			if (status !== "ON" && status !== "OFF") {
                if (remoteHints || status && (status.indexOf("ERROR") >= 0 || status.indexOf("DISABLED") >= 0)) {
                    setTextById("remote-power-information-"+device, message);
                    elementVisible("remote-power-information-"+device);
                    }
                else {
                    setTextById("remote-power-information-"+device, "");
                    elementHidden("remote-power-information-"+device);
                    }
			    }
			else {
			    setTextById("remote-power-information-"+device, "");
			    elementHidden("remote-power-information-"+device);
    			}

            // check if device of slider is active
			for (let i=0;i<devices_config[device]["commands"]["set"].length;i++) {

				let button = devices_config[device]["commands"]["set"][i];

                if (document.getElementById("slider_"+device+"_"+button+"_input")) {
                    if (!power_on) {
                        statusShow_buttonActive("slider_" + device + "_" + button + "_input", false);
                    } else {
                        statusShow_buttonActive("slider_" + device + "_" + button + "_input", true);
                    }
                    console.debug("slider_" + device + "_" + button + " _____ " + status + " __ " + power_on);
                }
            }

			// check if device of buttons is active
            devices_config[device]["buttons"].push("keyboard");
			for (let i=0;i<devices_config[device]["buttons"].length;i++) {
				let button   = devices_config[device]["buttons"][i].toLowerCase();

				if (!buttons_power[button] && !power_on)        { statusShow_buttonActive(device+"_"+button,false); }
				else if (!buttons_power[button] && power_on)    { statusShow_buttonActive(device+"_"+button,true); }
				else                                            { statusShow_buttonActive(device+"_"+button,true); }
				}
			}
		}
	}


// check status information of device -> insert into display
function statusCheck_displayValues(data={}) {

	let key_status;
    let element2;
    let value_key;
    let key;

    // check status for displays
    const devices = data["CONFIG"]["devices"];
    const scenes = data["CONFIG"]["scenes"];

    // fill in values for all device displays
	for (key in devices) {

	    if (key === "default") { continue; }
		if (!data["CONFIG"]["devices"][key]) {
		    console.warn("Device not defined correctly: '" + key + "' has no configuration.");
		    continue;
		    }

	    // device status
        const status = remoteStatus.status_device(key);
        const dev_status = data["STATUS"]["devices"][key];
        const dev_config = data["CONFIG"]["devices"][key];

        // set values if device is active or scene is active (which can contain several devices)
        if (status === "ON" && (rm3remotes.active_type === "scene" || rm3remotes.active_name === key)) {

            const remote = devices[key]["remote"]["remote"];
            const display = devices[key]["remote"]["display"];

            if (!remote.includes("DISPLAY"))         { continue; }
			if (display === {} || display === undefined)  { continue; }

            // set display values
			for (const display_key in display) {
                value_key = display[display_key];
                const element = document.getElementById("display_" + key + "_" + value_key);
                element2 = document.getElementById("display_full_" + key + "_" + value_key);
                key_status = dev_status[value_key];
				if (key_status && value_key === "power") {
			        if (key_status.toUpperCase().indexOf("ON") >= 0)        { key_status = use_color("<b>Power On<b/>","on"); }
					else if (key_status.toUpperCase().indexOf("OFF") >= 0)  { key_status = use_color("<b>Power Off<b/>","hint"); }
					else if (key_status.toUpperCase().indexOf("N/A") >= 0)  { key_status = use_color("<b>Power Status N/A<b/>","hint"); }
                    else                                                    { key_status = use_color("<b>"+lang("ERROR_UNKNOWN")+":</b> ","error")+key_status; }
					}

				if (element)  { element.innerHTML  = key_status; }
				if (element2) { element2.innerHTML = key_status.replace(/,/g,"; "); }
				}
            }

        // set display detail popup values (for devices only)
        if (rm3remotes.active_type === "device" && dev_status && dev_config && dev_config["commands"]["get"]) {

            const additional_keys = ["api","api-status","api-last-query","api-last-record", "api-last-send","api-auto-off"];
            const display_keys = dev_config["commands"]["get"];
            const connected= remoteStatus.status_device(key) + ": " + remoteStatus.status_device(key, true)["message"];

            for (let i=0; i<additional_keys.length; i++) {
                if (!display_keys[additional_keys[i]] && dev_status[additional_keys[i]]) { display_keys.push([additional_keys[i]]); }
                }

            for (let i=0; i<display_keys.length; i++) {
                value_key = display_keys[i];
                key_status = dev_status[value_key];
                element2 = document.getElementById("display_full_" + key + "_" + value_key);

                if (typeof(key_status) == "string") {
                    key_status          = key_status.replaceAll("'", "\"");
                    key_status          = key_status.replaceAll("True", "true");
                    key_status          = key_status.replaceAll("False", "false");
                    }
                key_status      = syntaxHighlightJSON(key_status);

                if (value_key === "power") {
                    if (connected.indexOf("ERROR") >= 0)                    { key_status = use_color("<b>"+lang("CONNECTION_ERROR")+":</b><br/>","error")+connected; }
                    else if (typeof(key_status) != "string")                { key_status = use_color("<b>"+lang("ERROR_UNKNOWN")+":</b> ","error")+key_status; }
                    else if (key_status.toUpperCase().indexOf("ON") >= 0)   { key_status = use_color("<b>"+lang("CONNECTED")+"<b/>","on"); }
                    else if (key_status.toUpperCase().indexOf("OFF") >= 0)  { key_status = use_color("<b>"+lang("CONNECTED")+": Power Off<b/>","hint"); }
                    else 									                { key_status = use_color("<b>"+lang("ERROR_UNKNOWN")+":</b> ","error")+key_status; }
                    }

                if (key_status && key_status.replace) { key_status = key_status.replace(/,/g,", "); }
                if (key_status && element2)           { element2.innerHTML = key_status; }
                }
            }
        }

	// fill in values for all scene displays
	for (key in scenes) {

		if (scenes[key]["remote"] && scenes[key]["remote"]["display-detail"]) {
			// .......
			for (const vkey in scenes[key]["remote"]["display-detail"]) {
				let value           = scenes[key]["remote"]["display-detail"][vkey];
                element2 = document.getElementById("display_full_" + key + "_" + vkey);
                let values1         = value.split("_");
				let values2         = values1[1].split("||");
				let replace_tag     = values2[0]; // tag/parameter from device to be displayed
				let replace_value = "";         // value for this tag
				let replace_value_org = "";         // value for this tag
				let replace_device  = values1[0]; // device id for displays in scenes
				let replace_index   = values2[1]; // grab index, if value is a dict -> e.g. ['plot']

				let replace_device_status = data["STATUS"]["devices"][replace_device];
				
				if (devices[replace_device] && replace_device_status && replace_device_status[replace_tag]) {
					replace_value = replace_device_status[replace_tag];
					replace_value_org = replace_value;
					if (replace_index && replace_index !== "") {
					
						// workaround, check why not in the correct format (KODI?!)
						if (replace_value !== "no media" && replace_value !== "Error") {
							//console.warn(replace_value);
							replace_value       = replace_value.replaceAll(": \"", "##!##");
							replace_value       = replace_value.replaceAll("\",", "',");
							replace_value       = replace_value.replaceAll("' ", "&#39; ");
							replace_value       = replace_value.replaceAll("##!##", ": '");
							//console.warn(replace_value);
							replace_value       = replace_value.replaceAll("\"", '&quot;');
							replace_value       = replace_value.replaceAll("'", '"');
							console.debug("--------------------");
							//console.debug(replace_value_org);
							console.debug(replace_value);

							try {
                                replace_content = JSON.parse(replace_value)
                            } catch (e) {
                                replace_content = replace_value;
                            }
							replace_value = replace_content + replace_index
							}
						}
					}
				
				if (element2) { element2.innerHTML = replace_value; }
				}
			}
		}
	}


// -----------------------


// change button color
function statusShow_buttonActive(id, active) {
    statusCheck_power.visualize_element_disabled(id, active);
} // to be replaced -> statusCheck_power.disable_element()

// show buttons in different colors (depending if devices are ON or OFF)
function statusShow_powerButton(id, status) {
    statusCheck_power.visualize_element_button(id, status);
} // to be replaced -> statusCheck_power.visualize_element_button()

// change slider color
function statusShow_sliderActive(id, id_button, active) {
    statusCheck_power.visualize_element_slider(id, id_button, active);
} // to be replaced -> statusCheck_power.visualize_element_slider()

// change toggle status color
function statusShow_toggle(device, id_slider, id_value, id_button, status, active) {
    statusCheck_power.visualize_element_toggle(device, id_slider, id_value, id_button, status, active);
} // to be replaced -> statusCheck_power.visualize_element_toggle()

// open as big message
function statusCheck_bigMessage(id) {
    statusCheck_power.visualizes_element_big_message(id);
} // to be replaced -> statusCheck_power.visualizes_element_big_message()


// -----------------------------
// refactored already ...

/* class to visualize the power status of apis, api devices, devices and scenes */
class RemoteVisualizePowerStatus {
    constructor(name, status) {
        this.name = name;
        this.data = undefined;
        this.edit_mode = undefined;
        this.status = status;

        this.colors = {
            "api-status": {
                "CONNECT": "lightgreen",
                "NO_CONNECT": "white",
                "WARNING": "yellow",
                "ERROR": "#FF6666",
                "OTHER": "#DDDDDD"
            },
            "power-button": {
                "ON"        : "var(--rm-color-signal-power-on)",
                "OFF"       : "var(--rm-color-signal-power-off)",
                "OTHER"	    : "var(--rm-color-signal-power-other)",
                "PARTLY"    : "var(--rm-color-signal-power-other)",
                "ERROR"	    : "var(--rm-color-signal-power-error)",
            }

        }
        this.signs = {
            "OK": "&#10003;",       // &#9745;
            "ERROR": "&#10008;",       // &#9746;
            "OFF": "&nbsp;<small>OFF</small>", // "&#9744;";
            "DISABLED": "&nbsp;<small>DISABLED</small>", // "&#9744;";
            "START": "&#10138;",
        }
        this.signs_size = "18px";

        this.logging = new jcLogging(this.name + ".logging");
        this.app_connection_error = false;
    }

    /* update class data */
    update(data, edit_mode) {
        this.data = data;
        this.edit_mode = edit_mode;
        this.app_connection_error = false;
    }

    /* set app connection status, e.g., if offline */
    set_connection_error(state) {
        this.app_connection_error = state;

    }

    /* coordinate status visualization for all device types */
    show_status(data, edit_mode) {
        this.update(data, edit_mode);

        this.show_status_apis();
        this.show_status_api_devices();
        this.show_status_devices();
        this.show_status_scenes();
        this.show_status_groups();

        this.show_status_return_messages();
        this.show_status_config_errors();
        this.show_status_system_health();
        this.show_status_app_modes();
    }


    /* visualize status for APIs: active -> toggles */
    show_status_apis () {
        let all_keys = this.status.get_keys("api");
        for (let i in all_keys) {
            let key = all_keys[i];
            let status = this.status.status_api(key, true);

            this.visualize_api_slider(`toggle__${key}_input`, status["active"]);
            if (status["active"]) {
                // TBC: what, if not active -> remove value, "empty visualization"?
                this.visualize_api_summary(`api_status_icon_${key}`, status["api-device-summary"]);
            }
        }
    }

    /* visualize status for APIs: active -> toggles */
    show_status_api_devices () {
        let all_keys = this.status.get_keys("api-device");
        for (let i in all_keys) {
            let key = all_keys[i];
            let [api, api_device] = key.split("_");
            let status = this.status.status_api_device(key, true);

            this.visualize_api_slider(`toggle__${api}-${api_device}_input`, status["active"]);
            this.visualize_status_text("power_status_"+key, "&nbsp;(" + status["power-status"] + ")", (status["power"] !== ""));
            this.visualize_status_text("api_status_"+key, status["message"], true, "api-status");
            this.visualize_status_text("api_status_short_"+key, status["status"], true, "api-status");
            this.visualize_api_device_summary(`api_status_icon_${key}`, status["status"]);
            this.disable_buttons("reconnect_"+key.toLowerCase(), (status["status"].indexOf("ERROR") > -1 || status["status"].indexOf("DISABLE") > - 1));
        }
    }

    /* visualizes status for devices */ // in progress
    show_status_devices () {
        let all_keys = this.status.get_keys("device");
        for (let i in all_keys) {
            let key = all_keys[i];
            if (key === "default")        { continue; }

            let power_status  = remoteStatus.status_device(key);
            let power_message = remoteStatus.status_device(key, true)["message"];

            if (!this.edit_mode) {
                this.visualize_power_button_device(key, power_status);
                this.visualize_power_display_device(key, power_status, power_message);
            }
            this.visualize_device_idle_time(key);
        }

    }

    /* visualizes status for scenes */ // in progress
    show_status_scenes () {
        let all_keys = this.status.get_keys("scene");
        for (let i in all_keys) {
            let key = all_keys[i];
            if (key === "default") { continue; }

            let power_status  = remoteStatus.status_scene(key);
            let power_message = remoteStatus.status_scene(key, true)["message"];

            if (!this.edit_mode) {
                this.visualize_power_button_scene(key, power_status, power_message);
                this.visualize_power_display_scene(key, power_status, power_message);
            }
        }
    }

    // not implemented yet
    show_status_groups() {

    }

    /* check if server sends asynchronous messages and open in alert, if exists */
    show_status_return_messages() {

        let return_messages = this.data["REQUEST"]["server-messages"];
        if (return_messages && return_messages.length > 0) {
            let text = "";
            for (let i=0; i<return_messages.length; i++) {
                let message;
                let values;
                if (Array.isArray(return_messages[i])) {
                    message = return_messages[i][0];
                    values = return_messages[i][1];
                    if (!Array.isArray(values)) { values = [values]; }
                }
                else {
                    message = return_messages[i];
                }
                text += lang(message,values) + "<br/>&nbsp;<br/>";
            }
            appMsg.alert(text);
        }
    }

    /* check if some fatal configuration error occurred */
    show_status_config_errors() {
        let html = "";
        let alert = "";
        let count = 0;
        const errors = this.data["STATUS"]["config_errors"];

        Object.keys(errors).forEach(error_key => {
            Object.keys(errors[error_key]).forEach(key => {
                if (errors[error_key][key] !== {}) {
                    count += 1;
                    let msg = "<b>" + error_key.toUpperCase() + " - " + key + "</b>:<br>" + JSON.stringify(errors[error_key][key]) + "<br/>&nbsp;<br/>";
                    alert += msg;
                }
            });
        });

        if (count > 0) {
            alert = "<div style='color:var(--rm-color-font-warning);'><b>" + count + " Configuration Error(s):</b></div><div id='attention-alert' style='text-align:left;'>" + alert + "</div>";
            alert = alert.replaceAll('"','');
            alert = alert.replaceAll('\'','');
            alert = "appMsg.confirm(\""+alert+"\", \"\", 300);";

            html = "<img src='icon/attention.png' onclick='"+alert+"' style='cursor:pointer;width:100%;height:auto;' alt=''>";
            setTextById("attention", html);
            elementVisible("attention");
        }
        else {
            setTextById("attention", "");
        }

    }

    /* check and visualize system health */
    show_status_system_health() {

        const system_health = this.data["STATUS"]["system_health"];
        let threads = [];

        for (const [key, value] of Object.entries(system_health)) {

            if (value === "registered") {}
            else if (value === "stopped") { threads.push(key + " (stopped)"); }
            else {
                let message = key + " (" + value + "s)";
                if (value >= 20)            { threads.push("<span style='color:var(--rm-color-signal-power-error)'>" + message + "</span>"); }
                else if (value >= 10)       { threads.push("<span style='color:var(--rm-color-signal-power-off)'>" + message + "</span>"); }
                else                        { threads.push("<span style='color:var(--rm-color-signal-power-on)'>" + message + "</span>"); }
            }
        }
        let health_msg = threads.join(", ");
        if (this.app_connection_error) {
            health_msg = "<span style='color:var(--rm-color-signal-power-error)'><b>" + lang("STATUS_NO_SERVER_CONNECT") + "</b></span>";
        }
        if (document.getElementById("system_health")) {
            document.getElementById("system_health").innerHTML = health_msg;
        }
    }

    /* check & visualize status edit mode, intelligent mode & CO */
    show_status_app_modes() {
        const status_sliders = ["toggle__edit_input", "toggle__intelligent_input", "toggle__button_input", "toggle__hint_input", "toggle__easy_input", "toggle__json_input"];
        const status_values = [rm3remotes.edit_mode, !deactivateButton, showButton, remoteHints, easyEdit, jsonHighlighting];

        for (let key in status_sliders) {
            if (document.getElementById(status_sliders[key])) {
                let slider = document.getElementById(status_sliders[key]);
                if (status_values[key])   { slider.value = 1; slider.className = "rm-slider device_active"; }
                else                      { slider.value = 0; slider.className = "rm-slider device_disabled"; }
            }
        }
    }


    /* disable buttons if condition ... */
    disable_buttons(div_id, condition=false) {
        if (document.getElementById(div_id) && condition) {
            document.getElementById(div_id).disabled = true;
        } else if (document.getElementById(div_id)) {
            document.getElementById(div_id).disabled = false;
        }
    }

    /* visualize api device summary with signs */
    visualize_api_summary(div_id, status_summary) {
        if (!document.getElementById(div_id)) { return; }

        let sign = "";
        let color = "";

        if (status_summary.length === 1 && status_summary[0] === "OK")  {
            sign = this.signs["OK"];
            color = this.colors["api-status"]["CONNECT"];
        }
        else if (status_summary.length === 1 && status_summary[0] === "POWER_OFF")  {
            sign = this.signs["OK"];
            color = this.colors["api-status"]["CONNECT"];
        }
        else if (status_summary.length === 1 && status_summary[0].includes("ERROR"))  {
            sign = this.signs["ERROR"];
            color = this.colors["api-status"]["ERROR"];
        }
        else if (status_summary.includes("STARTING"))  {
            sign = this.signs["START"];
            color = this.colors["api-status"]["WARNING"];
        }
        else if ((status_summary.includes("ERROR") || status_summary.includes("POWER_ERROR"))
                && (status_summary.includes("OK") || status_summary.includes("POWER_OFF") || status_summary.includes("DISABLED")))  {
            sign = this.signs["OK"] + " " + this.signs["ERROR"];
            color = this.colors["api-status"]["WARNING"];
        }
        else if (status_summary.includes("DISABLED") && status_summary.includes("OK"))  {
            sign = this.signs["OK"];
            color = this.colors["api-status"]["CONNECT"];
        }

        let message = `<span style='color:${color};font-size:${this.signs_size}'>${sign}</span>`;
        setTextById(div_id, message);
    }

    /* visualize api device summary with signs */
    visualize_api_device_summary(div_id, status_summary) {
        if (!document.getElementById(div_id)) { return; }

        let sign = "";
        let color = "";

        if (status_summary === "OK")  {
            sign = this.signs["OK"];
            color = this.colors["api-status"]["CONNECT"];
        }
        else if (status_summary.indexOf("ERROR") > -1)  {
            sign = this.signs["ERROR"];
            color = this.colors["api-status"]["ERROR"];
        }
        else if (status_summary === "DISABLED")  {
            sign = this.signs["DISABLED"];
            color = this.colors["api-status"]["NO_CONNECT"];
        }
        else if (status_summary.indexOf("STARTING") > -1)  {
            sign = this.signs["START"];
            color = this.colors["api-status"]["WARNING"];
        }
        else if (status_summary.indexOf("OFF") > -1)  {
            sign = this.signs["OK"];
            color = this.colors["api-status"]["NO_CONNECT"];
        }

        let message = `<span style='color:${color};'>${sign}</span>`;
        setTextById(div_id, message);
    }

    /* visualize color depending on status */
    visualize_element_button (id, status) {

        let color = "";
        if (status in this.colors["power-button"]) {
            color = this.colors["power-button"][status];
        }

        let button = document.getElementById(id);
        if (typeof(button) !== 'undefined' && button !== null) {
            button.style.backgroundColor = color;
        }

    }

    /* visualize disabled elements such as buttons, sliders, ... */
    visualize_element_disabled(div_id, active) {
        if (document.getElementById(div_id)) {
            let element = document.getElementById(div_id);
            if (active) {
                element.classList.remove("device_off");
            }
            else {
                element.classList.add("device_off");
            }
        } else {
            this.logging.debug("disable_element(): element '"+div_id+"' does not exist.");
        }
    }

    /* visualize display depending on status */
    visualize_element_display(id, view) {
        let keys = ["ON", "OFF", "ERROR", "MANUAL", "EDIT_MODE", "POWER_OFF"];
        view = view.toUpperCase();

        if (view === "N/A") { view = "MANUAL"; }
        if (document.getElementById("display_"+id+"_"+view)) {
            for (let i=0;i<keys.length;i++) { elementHidden( "display_"+id+"_"+keys[i]); }
            elementVisible("display_"+id+"_"+view);
        }
        else {
            this.logging.debug("Error showing display: " + id + ":" + view);
        }
    }

    /* visualize slider depending on status */
    visualize_element_slider(id, id_button, active) {

        if (document.getElementById(id)) {
            let slider = document.getElementById(id);
            let slider_button = document.getElementById(id_button);
            if (active === "on") {
                slider.className = "rm-slider device_on";
                slider_button.className = "rm-slider-button device_on";
                slider.disabled = false;
            }
            else if (active === "off") {
                slider.className = "rm-slider device_off";
                slider_button.className = "rm-slider-button device_off";
                slider.disabled = true;
            }
            else {
                slider.className = "rm-slider device_undef";
                slider_button.className = "rm-slider-button device_undef";
                slider.disabled = true;
            }
        }
    }

    /* visualize toggle depending on status */
    visualize_element_toggle(device, id_slider, id_value, id_button, status, active) {
        let slider = document.getElementById(id_slider);
        let slider_value = document.getElementById(id_value);
        let slider_button= document.getElementById(id_button);
        let slider_button2= document.getElementById(id_button+"2");

        if (!slider) { return; }

        if (status.toUpperCase() === "FALSE")            { status = "0"; }
        else if (status.toUpperCase().includes("OFF"))   { status = "0"; }
        else if (status.toUpperCase() === "OFF")         { status = "0"; }
        else if (status.toUpperCase() === "TRUE")        { status = "1"; }
        else if (status.toUpperCase() === "ON")          { status = "1"; }
        else if (status.toUpperCase() === "PARTLY")      { status = "0.5"; }
        else if (status.toUpperCase() === "N/A")         { status = "U"; }
        else                                             { status = "E"; }

        //if (slider.value == slider_value.value && slider.className.includes("device_set")) {}
        // change only if different value from API (wait in status blue until new status is set server-side)
        if ((slider.className.includes("device_set") && status !== slider_value.value) || !slider.className.includes("device_set")) {

            slider.setAttribute('step', '1');

            if (status === "0")        { slider.value = 0; }
            else if (status === "1")   { slider.value = 1; }
            else if (status === "0.5") { slider.setAttribute('step', '0.5'); slider.value = 0.5; }
            else if (status === "U")   { slider.value = 0; }
            else if (status === "E")   { slider.value = 0; }

            slider_value.value = status;

            if (status === "0")        { slider.className = "rm-slider device_off";    slider.disabled = false; }
            else if (status === "1")   { slider.className = "rm-slider device_on";     slider.disabled = false; }
            else if (status === "0.5") { slider.className = "rm-slider device_middle"; slider.disabled = false; }
            else if (status === "U")   { slider.className = "rm-slider device_undef";  slider.disabled = false; }
            else if (status === "E")   { slider.className = "rm-slider device_undef";  slider.disabled = true; }
            else                       { slider.className = "rm-slider device_undef";  slider.disabled = true; }
        }
        if (slider && slider_button) {
            if (active === "on") {
                slider_button.className = "rm-toggle-label device_on";
                slider_button2.className = "rm-toggle-button device_on";
                //slider.setAttribute('step', '1');
                slider.disabled = false;
            }
            else if (active === "off") {
                slider_button.className = "rm-toggle-label device_off";
                slider_button2.className = "rm-toggle-button device_off";
                //slider.setAttribute('step', '1');
                slider.disabled = false;
            }
            else if (active === "middle") {
                slider_button.className = "rm-toggle-label device_middle";
                slider_button2.className = "rm-toggle-button device_middle";
                //slider.setAttribute('step', '0.5');
                //slider.value = "0.5";
                slider.disabled = false;
            }
            else {
                slider_button.className = "rm-toggle-label device_undef";
                slider_button2.className = "rm-toggle-button device_undef";
                //slider.setAttribute('step', '1');
                slider.disabled = true;
            }
        }
    }

    /* open as big message */
    visualizes_element_big_message(id) {
        let message = getTextById(id);
        message = "<div class=\"remote-power-information big\">" + message + "</div>";
        appMsg.confirm(message, "", 280);
    }

    /* visualize status for devices by setting color of power buttons */
    visualize_power_button_device (device_id, power_status) {

        if (deactivateButton === false) {
            if (power_status.indexOf("ERROR") >= 0 || this.app_connection_error) {
                this.visualize_element_button("device_" + device_id, "ERROR"); // main menu button
                this.visualize_element_button(device_id + "_on-off", "ERROR"); // on-off device button
                this.visualize_element_button(device_id + "_on", "ERROR");
                this.visualize_element_button(device_id + "_off", "ERROR");
            } else if (power_status === "POWER_OFF") {
                this.visualize_element_button("device_" + device_id, false);
                this.visualize_element_button(device_id + "_on-off", false);
                this.visualize_element_button(device_id + "_on", false);
                this.visualize_element_button(device_id + "_off", false);
            } else if (power_status === "OFF") {
                this.visualize_element_button("device_" + device_id, "OFF"); // main menu button
                this.visualize_element_button(device_id + "_on-off", "OFF"); // on-o:16
                this.visualize_element_button(device_id + "_off", "OFF");
                this.visualize_element_button(device_id + "_on", "");
            } else if (power_status === "ON") {
                this.visualize_element_button("device_" + device_id, "ON"); // main menu button
                this.visualize_element_button(device_id + "_on-off", "ON"); // on-off device button
                this.visualize_element_button(device_id + "_on", "ON");
                this.visualize_element_button(device_id + "_off", "");
            }
        }
    }

    /* visualize status for scenes by setting color of power buttons */
    visualize_power_button_scene(key, scene_status, scene_status_log) {

        if (!document.getElementById("scene_on_"+key) && !document.getElementById("scene_off_"+key)) { return; }
        this.logging.debug("visualize_power_button_scene(): SCENE_"+key+"="+scene_status+" ... "+scene_status_log);

        if (this.app_connection_error) {
            this.visualize_element_button( "scene_on_"+key,  "ERROR" );
            this.visualize_element_button( "scene_off_"+key, "ERROR" );
        }
        else if (scene_status === "ON" || scene_status === "PARTLY") {
            if (deactivateButton === false) {
                this.visualize_element_button( "scene_on_"+key,  scene_status );
                this.visualize_element_button( "scene_off_"+key, "" );
            }
        }
        else if (scene_status === "ERROR" || scene_status === "DISABLED") {
            if (deactivateButton === false) {
                this.visualize_element_button( "scene_on_"+key,  scene_status );
                this.visualize_element_button( "scene_off_"+key, scene_status );
            }
        }
        else if (scene_status === "OFF" || scene_status === "POWER_OFF") {
            if (deactivateButton === false) {
                this.visualize_element_button( "scene_off_"+key,  scene_status );
                this.visualize_element_button( "scene_on_"+key, "" );
            }
        }
    }

    /* visualize status for devices by setting color of displays */
    visualize_power_display_device (device_id, power_status, power_message) {

        if (this.app_connection_error) {
            this.visualize_element_display(device_id, "ERROR");
            if (remoteHints) { setTextById("display_ERROR_info_"+device_id,""); }
            else { setTextById("display_ERROR_info_" + device_id, lang("STATUS_NO_SERVER_CONNECT")); }
        }
        else if (rm3remotes.edit_mode)                       { this.visualize_element_display(device_id, "EDIT_MODE"); }
        else if (deactivateButton || power_status === "N/A") { this.visualize_element_display(device_id, "MANUAL"); }
        else if (power_status === "ON")                      { this.visualize_element_display(device_id, "ON"); }
        else if (power_status === "OFF")                     { this.visualize_element_display(device_id, "OFF"); }
        else if (power_status.indexOf("ERROR") >= 0) {
            this.visualize_element_display(device_id, "ERROR");
            if (remoteHints) { setTextById("display_ERROR_info_"+device_id,""); }
            else { setTextById("display_ERROR_info_" + device_id, power_message); }
        }
        else if (power_status === "POWER_OFF") {
            this.visualize_element_display(device_id, "POWER_OFF");
            setTextById("display_POWER_OFF_info_"+device_id, "");
        }
    }

    /* visualize status for scenes by setting color of displays */
    visualize_power_display_scene(key, scene_status, scene_status_log) {

        if (!document.getElementById("scene_on_"+key) && !document.getElementById("scene_off_"+key)) { return; }
        console.debug("visualize_power_display_scene(): SCENE_"+key+"="+scene_status+" ... "+scene_status_log);

        if (this.app_connection_error) {
            this.visualize_element_display(key, "ERROR");
        }
        else if (scene_status === "ON" || scene_status === "PARTLY") {
            this.visualize_element_display(key, scene_status);
        }
        else if (scene_status === "ERROR" || scene_status === "DISABLED") {
            this.visualize_element_display(key, scene_status);
        }
        else if (scene_status === "OFF" || scene_status === "POWER_OFF") {
            this.visualize_element_display(key, scene_status);
        }
        if (deactivateButton) {
            this.visualize_element_display(key, "MANUAL");
        }
        if (rm3remotes.edit_mode) {
            this.visualize_element_display(key, "EDIT_MODE");
        }

    }

    // check how long device was idle (relevant for auto power off)
    visualize_device_idle_time(device) {

        const device_status = this.data["STATUS"]["devices"][device];
        const last_send = device_status["api-last-send-tc"];
        const auto_power_off = device_status["auto-power-off"];
        const power_status = device_status["power"];
        const current_time = Math.round(new Date().getTime() / 1000);

        if (document.getElementById("display_"+device+"_auto-power-off")) {
            setTextById("display_"+device+"_auto-power-off", power_status);
        }

        if (last_send !== undefined && auto_power_off !== undefined) {
            if (power_status === "ON" && (auto_power_off - (current_time - last_send)) > 0) {
                //console.log(" ....... " + (current_time - last_send) + " ... " + auto_power_off);
                const off = convert_second2time(auto_power_off - (current_time - last_send));
                setTextById("device_auto_off_"+device, "-&gt;&nbsp;Auto-Power-Off  in " + off);
                setTextById("display_"+device+"_auto-power-off", "-" + off);
            }
            else {
                setTextById("device_auto_off_"+device, "°");
            }
        }
    }


    /* visualize colored status */
    visualize_status_text(div_id, status_text, condition=true, colors="") {
        if (!condition || !document.getElementById(div_id)) { return; }

        let status_color = "";
        if (colors === "api-status") {
            if (status_text.indexOf("ERROR") > -1) { status_color = this.colors["api-status"]["ERROR"]; }
            else if (status_text.indexOf("STARTING") > -1) { status_color = this.colors["api-status"]["WARNING"]; }
            else if (status_text.indexOf("Start") > -1) { status_color = this.colors["api-status"]["WARNING"]; }
            else if (status_text.indexOf("DISABLED") > -1) { status_color = this.colors["api-status"]["NO_CONNECT"]; }
            else if (status_text.indexOf("OK") > -1) { status_color = this.colors["api-status"]["CONNECT"]; }
            else if (status_text.indexOf("Connected") > -1) { status_color = this.colors["api-status"]["CONNECT"]; }
            else { status_color = this.colors["api-status"]["OTHER"]; }
        }

        if (colors !== "") {
            status_text = `<span style='color:${status_color};'>${status_text}</span>`;
        }

        setTextById(div_id, status_text);
    }

    /* visualize status on a slider: apis, api-devices */
    visualize_api_slider(slider_id, status) {
        const slider = document.getElementById(slider_id);
        if (slider) {
            if (status === true) {
                slider.value = 1;
                slider.className = "rm-slider device_active";
                slider.disabled = false;
            }
            else if (status === false) {
                slider.value = 0;
                slider.className = "rm-slider device_disabled";
                slider.disabled = false;
            }
            else {
                slider.className = "rm-slider device_undef";
                slider.disabled = true;
            }
        }
    }
}
