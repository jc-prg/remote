//--------------------------------
// jc://remote/
//--------------------------------

let device_media_info = {};
let status_duration = [];
let status_duration_load = [];

// load the devices status -> visualization via function statusCheck();
function statusCheck_load() {
    appFW.requestAPI("GET",["list"], "", statusCheck, "" );
}


// coordinate visualization of the devices status
function statusCheck(data={}) {

	// if not data includes -> error
	if (!data["CONFIG"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		return;
		}
    const start = Date.now();
    dataAll = data;

    statusCheck_modes();
    statusCheck_messages(data);

    if (!rm3remotes.edit_mode) {
        statusCheck_displayValues(data);
        statusCheck_deviceActive(data);
        statusCheck_devicePowerButtonDisplay(data);
        statusCheck_scenePowerButtonDisplay(data);
        statusCheck_groupPowerButton(data);
        statusCheck_sliderToggleColorPicker(data);
        setTextById("edit1", "");
        }
    else {
        const stop = "remoteToggleEditMode(false);remoteFirstLoad_load();";
        const html = "<img src='/icon/edit_stop.png' onclick='" + stop + "' style='cursor:pointer;width:100%' name='stop editing' alt=''>";
        setTextById("edit1", html);
        //statusCheck_audioMute(data);
    }
	statusCheck_apiConnection(data);
	statusCheck_deviceIdle(data);
    statusCheck_health(data);
    statusCheck_error(data);

    if (statusCheck_audio === undefined) { statusCheck_audio = new RemoteMainAudio("statusCheck_audio"); }
    statusCheck_audio.show_status(data);

    setTextById("current_server_time", data["REQUEST"]["server-time-local"]);

    const duration = (Date.now() - start) / 1000;

    statusCheck_measure(data, duration);
}


// measure Status Check durations
function statusCheck_measure(data, duration) {

    if (duration < 0.1) { console.debug("statusCheck: Updated all status elements (" + String(duration) + "s)"); }
    else { console.warn("statusCheck: Updated all status elements - longer than expected (max 0.1s): " + String(duration) + "s"); }

    let average = status_duration.reduce((a, b) => a + b, 0) / status_duration.length;
    let average_load = status_duration_load.reduce((a, b) => a + b, 0) / status_duration_load.length;
    average = Math.round(average * 1000)/1000;
    average_load = Math.round(average_load * 1000)/1000;
    setTextById("average_status_duration", "~"+average+"s ");
    setTextById("average_status_duration_load", "~"+average_load+"s ");

    status_duration.push(duration);
    if (status_duration.length > 10) { status_duration.shift(); }
    status_duration_load.push(data["REQUEST"]["load-time-app"]/1000);
    if (status_duration_load.length > 10) { status_duration_load.shift(); }
}


// check if server sends asynchronous messages and open in alert, if exists
function statusCheck_messages(data) {

    let return_messages = data["REQUEST"]["server-messages"];
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

// status messages in case the server is offline
function statusCheck_offline(data) {
    console.error("Lost connection to the server.");
    statusCheck_health(data, true);
    statusCheck_deviceActive(data, true);
    statusCheck_devicePowerButtonDisplay(data, true);
    statusCheck_scenePowerButtonDisplay(data, true);
}

// change slider color
function statusShow_sliderActive(id, id_button, active, toggle=false) {
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


// change toggle status color
function statusShow_toggle(device, id_slider, id_value, id_button, status, active) {
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


// change button color
function statusShow_buttonActive(id, active) {
	if (document.getElementById(id)) {
	    slider = document.getElementById(id);
		if (active) {
		    slider.classList.remove("device_off");
		    }
		else {
		    slider.classList.add("device_off");
		    }
		}
	}
		

// show buttons in different colors (depending if devices are ON or OFF)
function statusShow_powerButton(id, status) {

    let color;
	if (status in colors_power) { color = colors_power[status]; }	// color defined in rm_config.js
	else                        { color = ""; } 			// reset to CSS color

	let button = document.getElementById(id);
	if (typeof(button) !== 'undefined' && button !== null) {
		button.style.backgroundColor      = color;
		}
	}


// check if api is connected
function statusCheck_apiConnection(data) {
	let status;
    let key;
    let api_summary = {};
    const config_errors = data["STATUS"]["config_errors"]["devices"];
    const config_devices = data["STATUS"]["devices"];

    let success_no     = {};
    let start_no     = {};
	let error_no       = {};
	let off_no         = {};

    this.slider_status = function(slider, status) {
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

	for (let api in data["CONFIG"]["apis"]["structure"]) {
        // set toggle values for apis
	    const slider = document.getElementById("toggle__" + api + "_input");
        status = data["STATUS"]["connections"][api]["active"];
        this.slider_status(slider, status);

	    for (let api_device in data["STATUS"]["connections"][api]["api_devices"]) {

            // power status API-Device details in API settings - depending power device
            key = api + "_" + api_device;
            const slider = document.getElementById(`toggle__${api}-${api_device}_input`);
            status = data["STATUS"]["connections"][api]["api_devices"][api_device]["active"];
            this.slider_status(slider, status);

            const element = document.getElementById("power_status_" + key);
            if (element && data["STATUS"]["connections"][api]["api_devices"][api_device]["power"] !== "") {
                console.debug("Set power status: " + api + "_" + api_device + " - " + data["STATUS"]["connections"][api]["api_devices"][api_device]["power_device"]);
                status = data["STATUS"]["connections"][api]["api_devices"][api_device]["power"];
                setTextById("power_status_"+key, "&nbsp;(" + status + ")");
	            }
	        }
	    }

    // summarize connection status for API based on API Devices
	for (key in data["STATUS"]["interfaces"]["connect"]) {
		let [api, dev] = key.split("_");
        const status_api = data["STATUS"]["interfaces"]["active"][api];
        const status_dev = data["STATUS"]["interfaces"]["connect"][key];

        if (!api_summary[api])   { api_summary[api] = ""; }
        if (!error_no[api])      { error_no[api] = 0; }
        if (!success_no[api])    { success_no[api] = 0; }
        if (!start_no[api])      { start_no[api] = 0; }
        if (!off_no[api])        { off_no[api] = 0; }

		if (status_dev === "Connected") { success_no[api] += 1; }
		else if (status_dev.indexOf("Start") > -1) { start_no[api] += 1; }
		else if (status_dev.indexOf("OFF") > -1) { off_no[api] += 1; }
		else if (status_dev.indexOf("DISABLED") > -1) { off_no[api] += 1; }
		else { error_no[api] += 1; }

        if (status_api === false)                             { api_summary[api] = "OFF"; }
        else if (start_no[api] > 0)                           { api_summary[api] = "START"; }
        else if (error_no[api] > 0 && success_no[api] === 0)  { api_summary[api] = "ERROR"; }
        else if (error_no[api] > 0 && success_no[api] > 0)    { api_summary[api] = "OK + ERROR"; }
        else                                                  { api_summary[api] = "OK"; }

		for (let key2 in config_devices) {
			if (config_errors && config_errors[key2] && config_errors[key2] !== {} && config_devices[key2]["api"] === key)	{ api_summary[api] = "ERROR"; }
			}
		}

    for (let key in data["CONFIG"]["apis"]["structure"]) {
        console.error(key);
        console.error(data["CONFIG"]["apis"]["list_apis_configs"]["list"]);
        if (data["CONFIG"]["apis"]["list_apis_configs"]["list"][key] === undefined) {
            api_summary[key] = "ERROR";
        }
    }

    // update API status in settings
	for (key in api_summary) {
	    if (document.getElementById("api_status_icon_" + key)) {
            let message = "<span style='font-size:18px;color:";
            if (api_summary[key] === "OK")         { message += color_api_connect +      "'>" + sign_ok; }
            else if (api_summary[key] === "START") { message += color_api_warning +      "'>" + sign_start; }
            else if (api_summary[key] === "ERROR") { message += color_api_error +        "'>" + sign_error; }
            else if (api_summary[key] === "OFF")   { message += color_api_no_connect +   "'>" + ""; }
            else                                   { message += color_api_warning +      "'>" + sign_ok + " " + sign_error; }

            setTextById("api_status_icon_" + key, "</span> " + message);
            }
		}

    // update API status in settings
	for (key in data["STATUS"]["interfaces"]["connect"]) {
	    if (document.getElementById("api_status_" + key)) {
            let status = data["STATUS"]["interfaces"]["connect"][key];
            if (status === "Connected")                { setTextById("api_status_" + key, "<span style='color:" + color_api_connect + "'>" + status + "</span>"); }
            else if (status === "Start")               { setTextById("api_status_" + key, "<span style='color:" + color_api_warning + "'>" + status + "</span>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_" + key, "<span style='color:" + color_api_no_connect + "'>" + status + "</span>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_" + key, "<span style='color:" + color_api_no_connect + "'>DISABLED</span>"); }
            else                                      { setTextById("api_status_" + key, "<span style='color:" + color_api_error + "'>" + status + "</span>"); }

            if (status === "Connected")                { setTextById("api_status_short_" + key, "<span style='color:" + color_api_connect + "'>OK</span>"); }
            else if (status === "Start")               { setTextById("api_status_short_" + key, "<span style='color:" + color_api_warning + "'>START</span>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_short_" + key, "<span style='color:" + color_api_no_connect + "'>OFF</span>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_short_" + key, "<span style='color:" + color_api_no_connect + "'>DISABLED</span>"); }
            else                                      { setTextById("api_status_short_" + key, "<span style='color:" + color_api_error + "'>ERROR</span>"); }

            if (status === "Connected")                { setTextById("api_status_icon_" + key, "<span style='color:" + color_api_connect +    "'>" + sign_ok + "</span>"); }
            else if (status === "Start")               { setTextById("api_status_icon_" + key, "<span style='color:" + color_api_warning +    "'>" + sign_start + "</span>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_icon_" + key, "<span style='color:" + color_api_no_connect + "'>" + sign_off + "</span>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_icon_" + key, "<span style='color:" + color_api_no_connect + "'>" + sign_disabled + "</span>"); }
            else                                      { setTextById("api_status_icon_" + key, "<span style='color:" + color_api_error +      "'>" + sign_error + "</span>"); }
        }

        if (document.getElementById("reconnect_"+key.toLowerCase())) {

            let button2 = document.getElementById("reconnect_"+key.toLowerCase());
            let [api, dev] = key.split("_");

            let connected_devices = 0;
            let connect_status_api      = data["STATUS"]["interfaces"]["active"][api];
            let connect_status          = data["STATUS"]["interfaces"]["connect"][key];
            let devices_per_interface   = data["CONFIG"]["apis"]["structure"];
            if (devices_per_interface[api][dev]) { connected_devices = devices_per_interface[api][dev].length; }
            let value = "";

            if (connect_status_api === false)                 { value = "N/A"; }
            else if (connect_status.indexOf("OFF") > -1)      { value = "OFF"; }
            else if (connect_status.indexOf("DISABLED") > -1) { value = "DISABLED"; }
            else if (connect_status.indexOf("ERROR") > -1)    { value = "ERROR"; }
            else                                              { value = "ON"; }

            if (value === "N/A" || value === "DISABLED") {
                button2.disabled = true;
            }
        }
    }
}


// check status edit mode, intelligent mode & CO
function statusCheck_modes() {

    const status_sliders = ["toggle__edit_input", "toggle__intelligent_input", "toggle__button_input", "toggle__hint_input", "toggle__easy_input"];
    const status_values = [rm3remotes.edit_mode, !deactivateButton, showButton, remoteHints, easyEdit];

    for (let key in status_sliders) {
        if (document.getElementById(status_sliders[key])) {
            let slider = document.getElementById(status_sliders[key]);
            if (status_values[key])   { slider.value = 1; slider.className = "rm-slider device_active"; }
            else                      { slider.value = 0; slider.className = "rm-slider device_disabled"; }
        }
    }
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

        let [devices_status, info] = statusCheck_devicePowerStatus(data);
        let device_status = devices_status[device];

        for (let key in devices[device]) {
            // device toggle
            if (document.getElementById("toggle_"+device+"_"+key+"_input")) {
                console.debug("statusCheck_sliderToggle: "+device+"_"+key+" - "+device_status);

                let value = data["STATUS"]["devices"][device][key].toUpperCase();
                if (device_status !== "ON" && device_status !== "OFF" && device_status !== "N/A") { value = "ERROR"; }

                if (devices_status === "N/A") {
                    statusShow_toggle(device, "toggle_" + device + "_" + key + "_input", "toggle_" + device + "_" + key + "_last_value", "slider_" + device + "_" + key, devices_status, "middle");
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


// check power status of devices
function statusCheck_devicePowerStatus (data, app_connection_error=false) {
    let dev_status       = {}
    let dev_status_info  = {}

	let devices_status    = data["STATUS"]["devices"];
	let devices_config    = data["CONFIG"]["devices"];

	for (let device in devices_config) {
	    let status            = "N/A";
	    let status_msg        = "N/A";
	    let error_msg         = "";
        let power_device= "";
        let api = "";
        let device_api        = devices_config[device]["interface"]["api"];
        let device_api_status = data["STATUS"]["interfaces"]["connect"][device_api];
        let device_api_power  = data["CONFIG"]["apis"]["list_api_power_device"][device_api];

        if (device_api_status === undefined || device_api_power === undefined) {
            console.error("statusCheck_devicePowerStatus: No API status available for " + device_api + " / " + device);
            continue;
        }
        if (data["CONFIG"]["devices"][device]["remote"]["remote"] === undefined) {
            console.error("statusCheck_devicePowerStatus: No remote definition available for " + device_api + " / " + device);
            continue;
        }

        let buttons = data["CONFIG"]["devices"][device]["remote"]["remote"].length;

        // check API status
        if (device_api_status.toUpperCase().indexOf("DISABLED") >= 0)        { status = "API_DISABLED"; }
        else if (device_api_status.toUpperCase().indexOf("START") >= 0)      { status = "API_STARTING"; }
        else if (device_api_status.toUpperCase().indexOf("ERROR") >= 0)      { status = "API_ERROR"; error_msg = device_api_status; }
        else if (device_api_status.toUpperCase().indexOf("CONNECTED") < 0)   { status = "API_ERROR"; }
        else if (device_api_status.toUpperCase().indexOf("CONNECTED") >= 0)  { status = "API_OK"; }

        if (device_api_power !== "" && status !== "API_STARTING") {
            // check API status of Power Device
            let power_dev_status  = data["STATUS"]["interfaces"]["connect"][device_api_power];

            if (power_dev_status.toUpperCase().indexOf("DISABLED") >= 0)       { status = "API_PWR_DISABLED"; }
            else if (power_dev_status.toUpperCase().indexOf("ERROR") >= 0)      { status = "API_PWR_ERROR";  error_msg = device_api_status; }
            else if (power_dev_status.toUpperCase().indexOf("CONNECTED") < 0)   { status = "API_PWR_ERROR"; }
            else if (power_dev_status.toUpperCase().indexOf("CONNECTED") >= 0)  { status = "API_OK"; }

            // check power status of Power Device !!! ATTENTION: this has to be changed some when (device at the moment is part of API name will not be in future)
            [api, power_device] = device_api_power.split("_");
            if (status === "API_OK") {
                if (!devices_status[power_device]["power"])                                        { status = "ERROR_PWR_N/A"; }
                else if (devices_status[power_device]["power"].toUpperCase().indexOf("OFF") >= 0)  { status = "POWER_OFF"; }
                else if (devices_status[power_device]["power"].toUpperCase().indexOf("ON") >= 0)   { status = "POWER_ON"; }
                }
            }

        // check device status
        if (status === "API_OK" || status === "POWER_ON" || status === "N/A") {
            if (devices_status[device]["api-status"].toUpperCase().indexOf("CONNECTED") < 0) { status = "API_ERROR_DEVICE"; }
            else if (!devices_status[device]["power"])                                       { status = "ERROR_N/A"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("N/A") >= 0)      { status = "N/A"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("OFF") >= 0)      { status = "OFF"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("ON") >= 0)       { status = "ON"; }
            }

        let label = devices_config[device]["settings"]["label"] + " (" + device + ")";
        let label_pwr = "";
        if (power_device !== "") {
            label_pwr = devices_config[power_device]["settings"]["label"] + " (" + power_device + ")";
            label_pwr = "<span style=\"cursor:pointer;\" onclick=\"rm3remotes.create('device','"+power_device+"');rm3menu.click_menu();\">" + label_pwr + "</span>";
        }

        // create status messages // IN PROGRESS
        if (app_connection_error)                    { status_msg = lang("STATUS_NO_SERVER_CONNECT"); }
        else if (buttons === 0)                      { status_msg = lang("STATUS_DEV_EMPTY", [label]); }
        else if (status === "ON" || status === "OFF"){ status_msg = lang("STATUS_DEV_OK", [label]); }
        else if (status === "N/A")                   { status_msg = lang("STATUS_DEV_N/A", [label]); }
        else if (status === "POWER_OFF")             { status_msg = lang("STATUS_DEV_POWER_OFF", [label_pwr]); }
        else if (status === "API_STARTING")          { status_msg = lang("STATUS_DEV_API_STARTING", [device_api, label]); }
        else if (status === "API_DISABLED")          { status_msg = lang("STATUS_DEV_API_DISABLED", [device_api, label]); }
        else if (status === "API_PWR_DISABLED")      { status_msg = lang("STATUS_DEV_API_DISABLED", [device_api_power, label]); }
        else if (status === "API_ERROR")             { status_msg = lang("STATUS_DEV_API_ERROR", [device_api, label, error_msg]); }
        else if (status === "API_PWR_ERROR")         { status_msg = lang("STATUS_DEV_API_ERROR", [device_api_power, label, error_msg]); }
        else if (status === "API_ERROR_DEVICE")      { status_msg = lang("STATUS_DEV_API_ERROR", [device_api, label]); }
        else if (status === "ERROR_N/A")             { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label]); }
        else if (status === "ERROR_PWR_N/A")         { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label_pwr]); }
        else                                         { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label]); }

        dev_status[device]      = status;
        dev_status_info[device] = status_msg;
        }

	return [ dev_status, dev_status_info ];
}


// check power status of devices required for a scene
function statusCheck_scenePowerStatus(data, app_connection_error=false) {

	let scene_status        = {};
	let scene_status_info   = {};
	let devices             = data["CONFIG"]["devices"];
	let devices_status      = data["STATUS"]["devices"];

	let [device_status_x, device_status_log] = statusCheck_devicePowerStatus(data, app_connection_error);

	for (let key in data["STATUS"]["scenes"]) {

        let dev_status = {"ON": 0,  "OFF": 0,  "N/A": 0,  "DISABLED": 0,  "ERROR": 0, "API_STARTING": 0};
        let dev_list = {"ON": [], "OFF": [], "N/A": [], "DISABLED": [], "ERROR": [], "API_STARTING": []};
		let required = data["STATUS"]["scenes"][key];
		let required_length = required.length;
		let label = data["CONFIG"]["scenes"][key]["settings"]["label"] + " (" + key + ")";
		let buttons = data["CONFIG"]["scenes"][key]["remote"]["remote"].length;

        // power device and power status
		let power_device    = "N/A";
		let power_status    = "N/A";
		if (data["CONFIG"]["scenes"][key]["remote"]["power_status"]) { power_device = data["CONFIG"]["scenes"][key]["remote"]["power_status"].split("_"); }
		if (power_device !== "N/A" && power_device.length > 1) { power_status = data["STATUS"]["devices"][power_device[0]][power_device[1]]; }

        // check status of all required devices
		for (let i=0;i<required.length;i++) {
		    let device       = required[i];
		    let status       = device_status_x[device];

            if (status === undefined) {
                console.error("statusCheck_scenePowerStatus: No API status available for " + device);
                continue;
            }
            if (data["CONFIG"]["devices"][device]["settings"] === undefined) {
                console.error("statusCheck_scenePowerStatus: No device settings available for " + device);
                continue;
            }


            let device_label = data["CONFIG"]["devices"][device]["settings"]["label"] + " (" + device + ")";
            let status_check = status;
            if (status === "POWER_OFF") { status_check = "OFF"; }
            else if (status === "API_STARTING") { status_check = "API_STARTING"; }
            else if (status.indexOf("ERROR") >= 0) { status_check = "ERROR"; }
            else if (status.indexOf("DISABLED") >= 0) { status_check = "DISABLED"; }
            else if (!dev_list[status]) { status_check = "ERROR"; }

            dev_status[status_check] += 1;
            dev_list[status_check].push(device_label);
            }

        if (buttons === 0) {
            scene_status[key] = "N/A";
            scene_status_info[key] = lang("STATUS_SCENE_EMPTY", [label, power_device]);
        }
        else if (power_status === "OFF") {
            scene_status[key] = "POWER_OFF";
            scene_status_info[key] = lang("STATUS_SCENE_POWER_OFF", [label, power_device]);
            }
        else if (dev_status["API_STARTING"] > 0) {
            scene_status[key] = "DISABLED";
            scene_status_info[key] = lang("STATUS_SCENE_STARTING", [label]);
            }
        else if (dev_status["ON"] === required_length) {
            scene_status[key] = "ON";
            scene_status_info[key] = lang("STATUS_SCENE_OK", [label]);
            }
        else if (dev_status["OFF"] === required_length) {
            scene_status[key] = "OFF";
            scene_status_info[key] = lang("STATUS_SCENE_OK", [label]);
            }
        else if (dev_status["ON"] + dev_status["OFF"] === required_length) {
            scene_status[key] = "PARTLY";
            scene_status_info[key] = lang("STATUS_SCENE_PARTLY", [label, dev_list["OFF"].join(", ")]);
            }
        else if (dev_status["DISABLED"] > 0) {
            scene_status[key] = "DISABLED";
            scene_status_info[key] = lang("STATUS_SCENE_DISABLED", [label]);
            }
        else if (dev_status["ERROR"] > 0) {
            scene_status[key] = "ERROR";
            scene_status_info[key] = lang("STATUS_SCENE_ERROR", [label, dev_list["ERROR"].join(", ")]);
            }
        }

	return [ scene_status, scene_status_info ];
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
                let [status_device, info] = statusCheck_devicePowerStatus(data);
                status_device = status_device[devices[key2]];
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


// show power status of devices required for a scene -> color button
function statusCheck_scenePowerButtonDisplay(data, app_connection_error=false) {

    const scene_status_all = statusCheck_scenePowerStatus(data);
    const scene_status = scene_status_all[0];

    if (rm3remotes.active_type === "device") { return; }

	for (let key in scene_status) {

	    if (!document.getElementById("scene_on_"+key) && !document.getElementById("scene_off_"+key)) { continue; }
        console.debug("statusCheck_powerButtonScene: SCENE_"+key+"="+scene_status[key]+" ... "+scene_status_all[1][key]);

        if (app_connection_error) {
            statusShow_powerButton( "scene_on_"+key,  "ERROR" );
            statusShow_powerButton( "scene_off_"+key, "ERROR" );
            statusShow_display(key, "ERROR");
        }
		else if (scene_status[key] === "ON" || scene_status[key] === "PARTLY") {
			if (deactivateButton === false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, "" );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] === "ERROR" || scene_status[key] === "DISABLED") {
			if (deactivateButton === false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, scene_status[key] );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] === "OFF" || scene_status[key] === "POWER_OFF") {
			if (deactivateButton === false) {
				statusShow_powerButton( "scene_off_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_on_"+key, "" );
				}
			statusShow_display(key, scene_status[key]);
			}
		if (deactivateButton) {
			statusShow_display(key, "MANUAL");
			}
		if (rm3remotes.edit_mode) {
			statusShow_display(key, "EDIT_MODE");
			}
		}

    if (document.getElementById('button_edit_mode')) {
        statusShow_powerButton('button_edit_mode',   getTextById('button_edit_mode'));
        statusShow_powerButton('button_manual_mode', getTextById('button_manual_mode'));
        statusShow_powerButton('button_show_code',   getTextById('button_show_code'));
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
    if (rm3remotes.active_type === "scene") {
    	let [scene_status, status_log] = statusCheck_scenePowerStatus(data, app_connection_error);
        console.debug("---> " + scene + " " + scene_status[scene] + " - " + status_log[scene]);

        let message = "<div class='remote-power-information-image'  onclick='statusCheck_bigMessage(\"scene-power-information-" + scene + "\");'></div>";

        if (app_connection_error) {
            scene_status[scene] = "ERROR";
            status_log[scene] = lang("STATUS_NO_SERVER_CONNECT");
        }
        if (scene_status[scene] === "POWER_OFF") {
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
        else if (scene_status[scene] !== "ON" && scene_status[scene] !== "OFF") {
            for (let i=0; i<rm3remotes.active_buttons.length; i++) {
                let button1 = rm3remotes.active_buttons[i].split("_");
                if (button1[0] === "macro") { statusShow_buttonActive(button1[0]+"_"+button1[1],false); }
                }
            if (remoteHints || scene_status[scene] && (scene_status[scene].indexOf("ERROR") >= 0 || scene_status[scene].indexOf("DISABLED") >= 0)) {
                setTextById("scene-power-information-"+scene, message + status_log[scene]);
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
	let [device_status, device_status_log]  = statusCheck_devicePowerStatus(data, app_connection_error);
	let buttons_power  = {"on":1, "off":1, "on-off":1};

	for (let device in devices_status) {

		if (devices_config[device] && devices_config[device]["buttons"] && devices_status[device] && devices_status[device]["power"]) {

		    let status = device_status[device];
            let info_sign = "<div class='remote-power-information-image'  onclick='statusCheck_bigMessage(\"remote-power-information-" + device + "\");'></div>";
		    let message = info_sign + device_status_log[device];
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


// check how long device was idle (relevant for auto power off)
function statusCheck_deviceIdle(data) {

	if (!data["CONFIG"]) {
		console.error("statusCheck_deviceActive: data not loaded.");
		return;
		}

	for (let device in data["STATUS"]["devices"]) {
        const device_status = data["STATUS"]["devices"][device];
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
	}


// check power status of device -> color button
function statusCheck_devicePowerButtonDisplay(data={}, app_connection_error=false) {

	// check device status and change color of power buttons / main menu buttons device
	let device_list    = "";
	let devices        = data["STATUS"]["devices"];
	let devices_config = data["CONFIG"]["devices"];
    let [device_status, device_status_log]  = statusCheck_devicePowerStatus(data);

	for (let device in devices) {

	    if (device === "default")        { continue; }
		if (!devices_config[device])     { console.warn("Device not defined correctly: '" + device + "' has no configuration."); continue; }
	    if (!devices[device]["power"])   { continue; }

        let power_status  = device_status[device];
        let power_message = device_status_log[device];

        if (power_status === undefined) {
            console.error("statusCheck_devicePowerButtonDisplay: No API status available for " + device);
            continue;
        }

        // format power buttons
        if (deactivateButton === false) {
            if (power_status.indexOf("ERROR") >= 0 || app_connection_error) {
                statusShow_powerButton( "device_" + device, "ERROR" ); // main menu button
                statusShow_powerButton( device + "_on-off", "ERROR" ); // on-off device button
                statusShow_powerButton( device + "_on",     "ERROR" );
                statusShow_powerButton( device + "_off",    "ERROR" );
            }
            else if (power_status === "POWER_OFF") {
                statusShow_buttonActive("device_" + device, false);
                statusShow_buttonActive(device + "_on-off", false);
                statusShow_buttonActive(device + "_on", false);
                statusShow_buttonActive(device + "_off", false);
                }
            else if (power_status === "OFF") {
                statusShow_powerButton( "device_" + device, "OFF" ); // main menu button
                statusShow_powerButton( device + "_on-off", "OFF" ); // on-o:16
                statusShow_powerButton( device + "_off", "OFF" );
                statusShow_powerButton( device + "_on",  "" );
                }
            else if (power_status === "ON") {
                statusShow_powerButton( "device_" + device, "ON" ); // main menu button
                statusShow_powerButton( device + "_on-off", "ON" ); // on-off device button
                statusShow_powerButton( device + "_on",  "ON" );
                statusShow_powerButton( device + "_off", "" );
                }
            }

        // format displays
        if (app_connection_error) {
            statusShow_display(device, "ERROR");
            if (remoteHints) { setTextById("display_ERROR_info_"+device,""); }
            else { setTextById("display_ERROR_info_" + device, lang("STATUS_NO_SERVER_CONNECT")); }
        }
        else if (rm3remotes.edit_mode)                       { statusShow_display(device, "EDIT_MODE"); }
        else if (deactivateButton || power_status === "N/A") { statusShow_display(device, "MANUAL"); }
        else if (power_status === "ON")                      { statusShow_display(device, "ON"); }
        else if (power_status === "OFF")                     { statusShow_display(device, "OFF"); }
        else if (power_status.indexOf("ERROR") >= 0) {
            statusShow_display(device, "ERROR");
            if (remoteHints) { setTextById("display_ERROR_info_"+device,""); }
            else { setTextById("display_ERROR_info_" + device, power_message); }
            }
        else if (power_status === "POWER_OFF") {
            statusShow_display(device, "POWER_OFF");
		    setTextById("display_POWER_OFF_info_"+device, "");
            }
        }

    console.debug("statusCheck_powerButton: "+device_list);
	}


// check system health
function statusCheck_health(data={}, app_connection_error=false) {

    if (!data || !data["STATUS"]) { return; }

    const system_health = data["STATUS"]["system_health"];
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
    if (app_connection_error) { health_msg = "<span style='color:var(--rm-color-signal-power-error)'><b>" + lang("STATUS_NO_SERVER_CONNECT") + "</b></span>";}
    if (document.getElementById("system_health")) {
        document.getElementById("system_health").innerHTML = health_msg;
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
    const [device_status, device_status_log] = statusCheck_devicePowerStatus(data);

    // set colors
    const vol_color2 = "yellow";
    const no_vol_color = "darkgray";

    // fill in values for all device displays
	for (key in devices) {

	    if (key === "default") { continue; }
		if (!data["CONFIG"]["devices"][key]) {
		    console.warn("Device not defined correctly: '" + key + "' has no configuration.");
		    continue;
		    }

	    // device status
        const status = device_status[key];
        const message = device_status_log[key];
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
					//if (connected != "connected")                           { key_status = use_color("<b>"+lang("CONNECTION_ERROR")+":</b><br/>","error")+connected; }
/// ------------> status auswerten
					//if (online_status && online_status == "offline")   { key_status = use_color("<b>"+lang("OFFLINE")+"</b><br/>","hint"); }
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

            var additional_keys = ["api","api-status","api-last-query","api-last-record",
                                   "api-last-send","api-auto-off"];
            var display_keys    = dev_config["commands"]["get"];
            var connected       = device_status[key] + ": " + device_status_log[key];

            for (var i=0; i<additional_keys.length; i++) {
                if (!display_keys[additional_keys[i]] && dev_status[additional_keys[i]]) { display_keys.push([additional_keys[i]]); }
                }

            for (var i=0; i<display_keys.length; i++) {
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


// show specific display and hide the others
function statusShow_display(id, view) {
    let keys = ["ON", "OFF", "ERROR", "MANUAL", "EDIT_MODE", "POWER_OFF"];
    view = view.toUpperCase();
    if (view === "N/A") { view = "MANUAL"; }
    if (document.getElementById("display_"+id+"_"+view)) {
        for (let i=0;i<keys.length;i++) { elementHidden( "display_"+id+"_"+keys[i]); }
        elementVisible("display_"+id+"_"+view);
        }
    else {
        console.debug("Error showing display: " + id + ":" + view);
        }
}


// check if some fatal error occurred
function statusCheck_error(data) {
    let html = "";
    let alert = "";
    let count = 0;
    const errors = data["STATUS"]["config_errors"];

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


// open as big message
function statusCheck_bigMessage(id) {
    var message = getTextById(id);
    message = "<div class=\"remote-power-information big\">" + message + "</div>";
    appMsg.confirm(message, "", 280);
}

