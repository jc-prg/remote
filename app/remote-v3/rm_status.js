//--------------------------------
// jc://remote/
//--------------------------------
// Device Status:
// - change color of remote buttons based on status
// - change color of on/off buttons based on status
// - update date in displays
// - deactivate buttons if device OFF
//--------------------------------

var last_media_info_content = "";
var device_media_info       = {};

//-----------------------------------------


// check if device status
function statusCheck_load() { appFW.requestAPI("GET",["list"], "", statusCheck, "" ); }
function statusCheck(data={}) {

	// if not data includes -> error
	if (!data["CONFIG"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}
	var start = Date.now();
	dataAll = data;

    statusCheck_modes();

    if (!rm3remotes.edit_mode) {
        statusCheck_displayValues(data);
        statusCheck_deviceActive(data);
        statusCheck_devicePowerButtonDisplay(data);
        statusCheck_scenePowerButton(data);
        statusCheck_sliderToggleColorPicker(data);
        setTextById("edit1", "");
        }
    else {
        var stop = "remoteToggleEditMode(false);remoteFirstLoad_load();";
        var html = "<img src='/icon/edit_stop.png' onclick='"+stop+"' style='cursor:pointer;width:100%' name='stop editing'>";
        setTextById("edit1", html);
        }
	statusCheck_audioMute(data);
	statusCheck_apiConnection(data);
	statusCheck_deviceIdle(data);
    statusCheck_health(data);
    statusCheck_error(data);

    setTextById("current_server_time", data["REQUEST"]["server-time-local"]);

    var duration = Date.now() - start;
	console.log("statusCheck: Updated all status elements ("+duration+"ms)");
	}


// check and display current volume -> partly removed, final check open if still required
function statusShow_volume_old( volume, maximum, vol_color, novol_color="" ) {

	var volume  = Math.round( volume * 20 / maximum );
	var vol_str = "<font color='" + vol_color + "'>";
	for (var i=0; i<volume; i++) { vol_str += "I"; }
	vol_str += "</font>";
	if (novol_color != "") { vol_str += "<font color='" + novol_color + "'>"; }
	for (var i=0; i<20-volume; i++) { vol_str += "I"; }
	return vol_str;
	}


// check and display current volume
function statusShow_volume( volume ) {

	var vol_color   = "white";
	var novol_color = "#333333";

	var volume  = Math.round( volume * 20 / rm3slider.audioMax );
	var vol_str = "<font color='" + vol_color + "'>";
	for (var i=0; i<volume; i++) { vol_str += "I"; }
	vol_str += "</font>";
	
	if (novol_color != "") { vol_str += "<font color='" + novol_color + "'>"; }
	for (var i=0; i<20-volume; i++) { vol_str += "I"; }
	
	setTextById("audio3",vol_str);
	}


// change slider color
function statusShow_sliderActive(id, active) {
	if (document.getElementById(id)) {
	    slider = document.getElementById(id);
		if (active == "on") {
		    slider.className = "rm-slider device_on";
		    slider.disabled = false;
		    }
		else if (active == "off") {
		    slider.className = "rm-slider device_off";
		    slider.disabled = true;
		    }
		else {
		    slider.className = "rm-slider device_undef";
		    slider.disabled = true;
		    }
		}
	}


// change toggle status color
function statusShow_toggle(device, id_slider, id_value, status) {
    slider          = document.getElementById(id_slider);
    slider_value    = document.getElementById(id_value);
    change          = false;

    if (status.toUpperCase() == "FALSE")            { status = "0"; }
    else if (status.toUpperCase().includes("OFF"))  { status = "0"; }
    else if (status.toUpperCase() == "OFF")         { status = "0"; }
    else if (status.toUpperCase() == "TRUE")        { status = "1"; }
    else if (status.toUpperCase() == "ON")          { status = "1"; }
    else                                            { status = "E"; }

    //if (slider.value == slider_value.value && slider.className.includes("device_set")) {}
    // change only if different value from API (wait in status blue until new status is set server-side)
    if ((slider.className.includes("device_set") && status != slider_value.value) || !slider.className.includes("device_set")) {

        if (status == "0")      { slider.value = 0; }
        else if (status == "1") { slider.value = 1; }
        else if (status == "E") { slider.value = 0; }

        slider_value.value = status;

        if (status == "0")      { slider.className = "rm-slider device_off";   slider.disabled = false; }
        else if (status == "1") { slider.className = "rm-slider device_on";    slider.disabled = false; }
        else if (status == "E") { slider.className = "rm-slider device_undef"; slider.disabled = true; }
        else                    { slider.className = "rm-slider device_undef"; slider.disabled = true; }
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

	if (status in colors_power) { color = colors_power[status]; }	// color defined in rm_config.js
	else                        { color = ""; } 			// reset to CSS color

	var button = document.getElementById(id);
	if (typeof(button) != 'undefined' && button != null) {
		button.style.backgroundColor      = color;
		}
	}


// check if api is connected
function statusCheck_apiConnection(data) {
	// check api status
	var api_summary    = {};
	var config_errors  = data["STATUS"]["config_errors"]["devices"];
	var config_devices = data["STATUS"]["devices"];

	var success_no     = {};
	var error_no       = {};
	var off_no         = {};


	for (var api in data["CONFIG"]["apis"]["structure"]) {
        // update breakdown from API over API Device to Connected devices
        if (document.getElementById("details_"+api+"_overview_body")) {
            var text = rm3settings.module_interface_edit_list(api, data);
            setTextById("details_"+api+"_overview_body", text);
            }

        // set toggle values for apis
	    var slider = document.getElementById("toggle__" + api + "_input");
	    if (slider) {
            var status = data["STATUS"]["connections"][api]["active"];
            if (status == true) {
                slider.value = 1;
                slider.className = "rm-slider device_active";
                slider.disabled = false;
                }
            else if (status == false) {
                slider.value = 0;
                slider.className = "rm-slider device_disabled";
                slider.disabled = false;
                }
            else {
                slider.className = "rm-slider device_undef";
                slider.disabled = true;
                }
            }

	    for (var api_device in data["STATUS"]["connections"][api]["api_devices"]) {

            // power status API-Device details in API settings - depending power device
	        var key = api + "_" + api_device;
	        var element = document.getElementById("power_status_"+key);
	        if (element && data["STATUS"]["connections"][api]["api_devices"][api_device]["power"] != "") {
                console.debug("Set power status: " + api + "_" + api_device + " - " + data["STATUS"]["connections"][api]["api_devices"][api_device]["power_device"]);
                var status = data["STATUS"]["connections"][api]["api_devices"][api_device]["power"]
	            setTextById("power_status_"+key, "&nbsp;(" + status + ")");
	            }
	        }
	    }

    // ******************************* !!! refactoring of following lines to be done

    // summarize connection status for API based on API Devices
	for (var key in data["STATUS"]["interfaces"]["connect"]) {
		var [api, dev] = key.split("_");
		var status_api = data["STATUS"]["interfaces"]["active"][api];
		var status_dev = data["STATUS"]["interfaces"]["connect"][key];

		if (!api_summary[api])   { api_summary[api] = ""; }
        if (!error_no[api])      { error_no[api] = 0; }
        if (!success_no[api])    { success_no[api] = 0; }
        if (!off_no[api])        { off_no[api] = 0; }

		if (status_dev == "Connected")                { success_no[api] += 1; }
		else if (status_dev.indexOf("OFF") > -1)      { off_no[api]     += 1; }
		else if (status_dev.indexOf("DISABLED") > -1) { off_no[api]     += 1; }
		else                                          { error_no[api]   += 1; }

        if (status_api == false)                              { api_summary[api] = "OFF"; }
        else if (error_no[api] > 0 && success_no[api] == 0)   { api_summary[api] = "ERROR"; }
        else if (error_no[api] > 0 && success_no[api] > 0)    { api_summary[api] = "OK + ERROR"; }
        else                                                  { api_summary[api] = "OK"; }

		for (key2 in config_devices) {
			if (config_errors && config_errors[key2] && config_errors[key2] != {} && config_devices[key2]["api"] == key)	{ api_summary[api] = "ERROR"; }
			}
		}

    // update API status in settings
	for (var key in api_summary) {
	    if (document.getElementById("api_status_icon_" + key)) {
	        var message = "<font style='font-size:18px;' color='";
            if (api_summary[key] == "OK")         { message += color_api_connect +      "'>" + sign_ok; }
            else if (api_summary[key] == "ERROR") { message += color_api_error +        "'>" + sign_error; }
            else if (api_summary[key] == "OFF")   { message += color_api_no_connect +   "'>" + ""; }
            else                                  { message += color_api_warning +      "'>" + sign_ok + " " + sign_error; }

            setTextById("api_status_icon_" + key, "</font> " + message);
            }
		}

    // update API status in settings
	for (var key in data["STATUS"]["interfaces"]["connect"]) {
	    if (document.getElementById("api_status_" + key)) {
            var status = data["STATUS"]["interfaces"]["connect"][key];
            if (status == "Connected")                { setTextById("api_status_" + key, "<font color='" + color_api_connect + "'>" + status + "</font>"); }
            else if (status == "Start")               { setTextById("api_status_" + key, "<font color='" + color_api_warning + "'>" + status + "</font>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_" + key, "<font color='" + color_api_no_connect + "'>" + status + "</font>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_" + key, "<font color='" + color_api_no_connect + "'>DISABLED</font>"); }
            else                                      { setTextById("api_status_" + key, "<font color='" + color_api_error + "'>" + status + "</font>"); }

            if (status == "Connected")                { setTextById("api_status_short_" + key, "<font color='" + color_api_connect + "'>OK</font>"); }
            else if (status == "Start")               { setTextById("api_status_short_" + key, "<font color='" + color_api_warning + "'>START</font>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_short_" + key, "<font color='" + color_api_no_connect + "'>OFF</font>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_short_" + key, "<font color='" + color_api_no_connect + "'>DISABLED</font>"); }
            else                                      { setTextById("api_status_short_" + key, "<font color='" + color_api_error + "'>ERROR</font>"); }

            if (status == "Connected")                { setTextById("api_status_icon_" + key, "<font color='" + color_api_connect +    "'>" + sign_ok + "</font>"); }
            else if (status == "Start")               { setTextById("api_status_icon_" + key, "<font color='" + color_api_warning +    "'>" + sign_start + "</font>"); }
            else if (status.indexOf("OFF") > -1)      { setTextById("api_status_icon_" + key, "<font color='" + color_api_no_connect + "'>" + sign_off + "</font>"); }
            else if (status.indexOf("DISABLED") > -1) { setTextById("api_status_icon_" + key, "<font color='" + color_api_no_connect + "'>" + sign_disabled + "</font>"); }
            else                                      { setTextById("api_status_icon_" + key, "<font color='" + color_api_error +      "'>" + sign_error + "</font>"); }
            }

        if (document.getElementById("onoff_"+key.toLowerCase())) {
            var button  = document.getElementById("onoff_"+key.toLowerCase());
            var button2 = document.getElementById("reconnect_"+key.toLowerCase());
            var [api, dev] = key.split("_");

            var connect_status_api      = data["STATUS"]["interfaces"]["active"][api];
            var connect_status          = data["STATUS"]["interfaces"]["connect"][key];
            var devices_per_interface   = data["CONFIG"]["apis"]["structure"];
            var connected_devices       = devices_per_interface[api][dev].length;
            var value = "";

            //if (api == "TEST") { alert(api+":"+connect_status_api); }

            if (connect_status_api == false || connected_devices == 0) { value = "N/A"; }
            else if (connect_status.indexOf("OFF") > -1)      { value = "OFF"; }
            else if (connect_status.indexOf("DISABLED") > -1) { value = "OFF"; }
            else if (connect_status.indexOf("ERROR") > -1)    { value = "ERROR"; }
            else                                              { value = "ON"; }
            button.innerHTML = value;

            if (value == "ON")          { button.style.backgroundColor = colors_power["ON"];     button.disabled = false; }
            else if (value == "OFF")    { button.style.backgroundColor = colors_power["OFF"];    button.disabled = false; }
            else if (value == "ERROR")  { button.style.backgroundColor = colors_power["ERROR"];  button.disabled = false; }
            else if (value == "N/A")    { button.style.backgroundColor = "";                     button.disabled = true; button2.disabled = true; }
            }
		}			

	}


// check status edit mode, intelligent mode & CO
function statusCheck_modes() {
    if (document.getElementById("toggle__edit_input")) {
        slider = document.getElementById("toggle__edit_input");
        if (rm3remotes.edit_mode)   { slider.value = 1; slider.className = "rm-slider device_active"; }
        else                        { slider.value = 0; slider.className = "rm-slider device_disabled"; }
        }
    if (document.getElementById("toggle__intelligent_input")) {
        slider = document.getElementById("toggle__intelligent_input");
        if (!deactivateButton)   { slider.value = 1; slider.className = "rm-slider device_active"; }
        else                     { slider.value = 0; slider.className = "rm-slider device_disabled"; }
        }
    if (document.getElementById("toggle__buttonshow_input")) {
        slider = document.getElementById("toggle__buttonshow_input");
        if (showButton)         { slider.value = 1; slider.className = "rm-slider device_active"; }
        else                    { slider.value = 0; slider.className = "rm-slider device_disabled"; }
        }
    }


// check and show if main audio device is mute
function statusCheck_audioMute(data) {

	// set colors
	var vol_color       = "white";
	var vol_color2      = "yellow";
	var novol_color     = "darkgray";

	var devices             = data["STATUS"]["devices"];
	var devices_config      = data["CONFIG"]["devices"];
	var main_audio          = data["CONFIG"]["main-audio"];

	if (!data["STATUS"]["devices"][main_audio]) { return; }

    var device_api          = data["STATUS"]["devices"][main_audio]["api"];
    var device_api_status   = data["STATUS"]["interfaces"]["connect"][device_api];

    if (!data["STATUS"]["interfaces"]["connect"][device_api]) {
        console.error("Error in device_api definition ("+device_api+").");
        return;
    }

	// check audio status and show mut status in navigation bar
	var power = devices[main_audio]["power"].toUpperCase();
	if (device_api_status.toLowerCase() != "connected") { power = "OFF"; }
	if (devices[main_audio]["mute"].toUpperCase() == "ON" || power.includes("OFF") || devices[main_audio]["vol"] == 0) {
		document.getElementById("audio1").style.display = "block";
		document.getElementById("audio2").style.display = "none";
		vol_color = "gray";
		}
	else {
		document.getElementById("audio1").style.display = "none";
		document.getElementById("audio2").style.display = "block";
		}

	// get data from main audio device
	var main_audio_max	= 100;
	var main_audio_vol	= devices[main_audio]["vol"];
	var main_audio_mute	= devices[main_audio]["mute"].toUpperCase();

	if (devices_config[main_audio]
	    && devices_config[main_audio]["commands"]["definition"]
	    && devices_config[main_audio]["commands"]["definition"]["vol"]
	    && devices_config[main_audio]["commands"]["definition"]["vol"]["values"]
	    && devices_config[main_audio]["commands"]["definition"]["vol"]["values"]["max"]
	    ) {
		main_audio_max  = devices_config[main_audio]["commands"]["definition"]["vol"]["values"]["max"];
		}

	// check volume and show in navigation bar
	rm3slider.set_value( main_audio_vol );
	vol_str = statusShow_volume_old( main_audio_vol, main_audio_max, vol_color );
	document.getElementById("audio3").innerHTML = vol_str;
	}


// check status for all sliders and toggles -> show via color // IN PROGRESS
function statusCheck_sliderToggleColorPicker(data) {

	var devices    = data["STATUS"]["devices"];

	for (var device in devices) {
	    if (!data["CONFIG"]["devices"][device]) { continue; }
	    var device_api         = data["STATUS"]["devices"][device]["api"];
	    var device_api_power   = data["STATUS"]["devices"][device]["power"];
	    var device_api_status  = data["STATUS"]["interfaces"]["connect"][device_api];
	    var device_commands    = data["CONFIG"]["devices"][device]["commands"]["set"];

        for (key in devices[device]) {
            // toggle
            if (document.getElementById("toggle_"+device+"_"+key+"_input")) {

                var toggle = document.getElementById("toggle_"+device+"_"+key+"_input");
                var toggle_value = document.getElementById("toggle_"+device+"_"+key+"_value");

                value  = devices[device][key];
                if (device_api_status.toLowerCase() == "connected" && value.toLowerCase() != "error")   {
                    console.debug("statusCheck_sliderToggle: "+device+"_"+key+"="+value+" - "+device_api_status)
                    }
                else {
                    value = "Error";
                    console.debug("statusCheck_sliderToggle: "+device+"_"+key+"="+value+" - "+device_api_status)
                    }
                statusShow_toggle(device,"toggle_"+device+"_"+key+"_input","toggle_"+device+"_"+key+"_last_value", value);
                }

            // slider
            if (document.getElementById("slider_"+device+"_send-"+key+"_input")) {
                slider = document.getElementById("slider_"+device+"_send-"+key+"_input");
                value  = getTextById("send-" + key + "_value");

                if (device_api_status.toLowerCase() == "connected" && value.toLowerCase() != "error")   {
                    console.debug("statusCheck_sliderToggle: "+device+"_"+key+"="+value+" - "+device_api_status)
                    if (device_api_power.toUpperCase() == "ON") { statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "on"); }
                    else                                        { statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "off"); }
                    }
                else {
                    value = "Error";
                    console.debug("statusCheck_sliderToggle: "+device+"_send-"+key+"="+value+" - "+device_api_status)
                    statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", "error");
                    }
                }

            // color picker
            if (document.getElementById("colorpicker_"+device)) {
                color_picker = document.getElementById("colorpicker_"+device);
                if (device_api_status.toLowerCase() == "connected" && device_api_power && device_api_power.toUpperCase().indexOf("ON") > -1)   {
                    color_picker.style.opacity = "100%";
                    }
                else {
                    color_picker.style.opacity = "40%";
                    }
                }


            for (var i=0;i<device_commands.length;i++) {
                command = device_commands[i];
                //console.debug("colorpicker_"+device+"_send-"+command);
                //console.debug(device_commands);

                if (document.getElementById("colorpicker_"+device+"_send-"+command)) {
                color_picker = document.getElementById("colorpicker_"+device+"_send-"+command);
                if (device_api_status.toLowerCase() == "connected" && device_api_power && device_api_power.toUpperCase().indexOf("ON") > -1)   {
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
function statusCheck_devicePowerStatus (data) {
    var dev_status       = {}
    var dev_status_info  = {}

	var devices_status    = data["STATUS"]["devices"];
	var devices_config    = data["CONFIG"]["devices"];

	for (device in devices_config) {
	    var status            = "N/A";
	    var status_msg        = "N/A";
	    var error_msg         = "";
        var device_api        = devices_config[device]["interface"]["api"];
        var device_api_status = data["STATUS"]["interfaces"]["connect"][device_api];
        var device_api_power  = data["CONFIG"]["apis"]["list_api_power_device"][device_api];

        // check API status
        if (device_api_status.toUpperCase().indexOf("DISABLED") >= 0)        { status = "API_DISABLED"; }
        else if (device_api_status.toUpperCase().indexOf("ERROR") >= 0)      { status = "API_ERROR"; error_msg = device_api_status; }
        else if (device_api_status.toUpperCase().indexOf("CONNECTED") < 0)   { status = "API_ERROR"; }
        else if (device_api_status.toUpperCase().indexOf("CONNECTED") >= 0)  { status = "API_OK"; }

        if (device_api_power != "") {
            // check API status of Power Device
            var power_dev_status  = data["STATUS"]["interfaces"]["connect"][device_api_power];

            if (power_dev_status.toUpperCase().indexOf("DISABLED") >= 0)       { status = "API_PWR_DISABLED"; }
            else if (power_dev_status.toUpperCase().indexOf("ERROR") >= 0)      { status = "API_PWR_ERROR";  error_msg = device_api_status; }
            else if (power_dev_status.toUpperCase().indexOf("CONNECTED") < 0)   { status = "API_PWR_ERROR"; }
            else if (power_dev_status.toUpperCase().indexOf("CONNECTED") >= 0)  { status = "API_OK"; }

            // check power status of Power Device !!! ATTENTION: this has to be changed some when (device at the moment is part of API name will not be in future)
            var [api, power_device] = device_api_power.split("_");
            if (status == "API_OK") {
                if (!devices_status[power_device]["power"])                                        { status = "ERROR_PWR_N/A"; }
                else if (devices_status[power_device]["power"].toUpperCase().indexOf("OFF") >= 0)  { status = "POWER_OFF"; }
                else if (devices_status[power_device]["power"].toUpperCase().indexOf("ON") >= 0)   { status = "POWER_ON"; }
                }
            }

        // check device status
        if (status == "API_OK" || status == "POWER_ON" || status == "N/A") {
            if (devices_status[device]["api-status"].toUpperCase().indexOf("CONNECTED") < 0) { status = "API_ERROR_DEVICE"; }
            else if (!devices_status[device]["power"])                                       { status = "ERROR_N/A"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("N/A") >= 0)      { status = "N/A"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("OFF") >= 0)      { status = "OFF"; }
            else if (devices_status[device]["power"].toUpperCase().indexOf("ON") >= 0)       { status = "ON"; }
            }

        var label       = devices_config[device]["settings"]["label"] + " (" + device + ")";
        var label_pwr   = devices_config[power_device]["settings"]["label"] + " (" + power_device + ")";
        label_pwr       = "<span style=\"cursor:pointer;\" onclick=\"rm3remotes.create('device','"+power_device+"');rm3menu.click_menu();\">" + label_pwr + "</span>";

        // create status messages // IN PROGRESS
        if (status == "ON" || status == "OFF")      { status_msg = lang("STATUS_DEV_OK", [label]); }
        else if (status == "N/A")                   { status_msg = lang("STATUS_DEV_N/A", [label]); }
        else if (status == "POWER_OFF")             { status_msg = lang("STATUS_DEV_POWER_OFF", [label_pwr]); }
        else if (status == "API_DISABLED")          { status_msg = lang("STATUS_DEV_API_DISABLED", [device_api, label]); }
        else if (status == "API_PWR_DISABLED")      { status_msg = lang("STATUS_DEV_API_DISABLED", [device_api_power, label]); }
        else if (status == "API_ERROR")             { status_msg = lang("STATUS_DEV_API_ERROR", [device_api, label, error_msg]); }
        else if (status == "API_PWR_ERROR")         { status_msg = lang("STATUS_DEV_API_ERROR", [device_api_power, label, error_msg]); }
        else if (status == "API_ERROR_DEVICE")      { status_msg = lang("STATUS_DEV_API_ERROR", [device_api, label]); }
        else if (status == "ERROR_N/A")             { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label]); }
        else if (status == "ERROR_PWR_N/A")         { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label_pwr]); }
        else                                        { status_msg = lang("STATUS_DEV_OTHER_ERROR", [label]); }

        dev_status[device]      = status;
        dev_status_info[device] = status_msg;
        }

	return [ dev_status, dev_status_info ];
}


// check power status of devices required for a scene
function statusCheck_scenePowerStatus(data) {

	var scene_status        = {};
	var scene_status_info   = {};
	var devices             = data["CONFIG"]["devices"];
	var devices_status      = data["STATUS"]["devices"];

	var [device_status_x, device_status_log] = statusCheck_devicePowerStatus(data);

	for (var key in data["STATUS"]["scenes"]) {

        var dev_status      = {"ON": 0,  "OFF": 0,  "N/A": 0,  "DISABLED": 0,  "ERROR": 0};
        var dev_list        = {"ON": [], "OFF": [], "N/A": [], "DISABLED": [], "ERROR": []};
		var required        = data["STATUS"]["scenes"][key];
		var required_length = required.length;
		var label           = data["CONFIG"]["scenes"][key]["settings"]["label"] + " (" + key + ")";

        // power device and power status
		var power_device    = "N/A";
		var power_status    = "N/A";
		if (data["CONFIG"]["scenes"][key]["remote"]["power_status"]) { power_device = data["CONFIG"]["scenes"][key]["remote"]["power_status"].split("_"); }
		if (power_device != "N/A" && power_device.length > 1)        { power_status = data["STATUS"]["devices"][power_device[0]][power_device[1]]; }

        // check status of all required devices
		for (var i=0;i<required.length;i++) {
		    var device       = required[i];
    		var device_label = data["CONFIG"]["devices"][device]["settings"]["label"] + " (" + device + ")";
		    var status       = device_status_x[device];

//		    console.error("..." + status + " | " + device);
//		    console.error("...",dev_status);

            var status_check = status;
            if (status == "POWER_OFF")                  { status_check = "OFF"; }
            else if (status.indexOf("ERROR") >= 0)      { status_check = "ERROR"; }
            else if (status.indexOf("DISABLED") >= 0)   { status_check = "DISABLED"; }
            else if (!dev_list[status])                 { status_check = "ERROR"; }

            dev_status[status_check] += 1;
            dev_list[status_check].push(device_label);
            }

        if (power_status == "OFF") {
            scene_status[key] = "POWER_OFF";
            scene_status_info[key] = lang("STATUS_SCENE_POWER_OFF", [label, power_device]);
            }
        else if (dev_status["ON"] == required_length) {
            scene_status[key] = "ON";
            scene_status_info[key] = lang("STATUS_SCENE_OK", [label]);
            }
        else if (dev_status["OFF"] == required_length) {
            scene_status[key] = "OFF";
            scene_status_info[key] = lang("STATUS_SCENE_OK", [label]);
            }
        else if (dev_status["ON"] + dev_status["OFF"] == required_length) {
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


// show power status of devices required for a scene -> color button
function statusCheck_scenePowerButton(data) {

    var scene_status_all = statusCheck_scenePowerStatus(data);
	var scene_status     = scene_status_all[0];

    if (rm3remotes.active_type == "device") { return; }

	for (var key in scene_status) {

	    if (!document.getElementById("scene_on_"+key) && !document.getElementById("scene_off_"+key)) { continue; }
        console.debug("statusCheck_powerButtonScene: SCENE_"+key+"="+scene_status[key]+" ... "+scene_status_all[1][key]);

		if (scene_status[key] == "ON") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, "" );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] == "PARTLY") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, "" );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] == "ERROR") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, scene_status[key] );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] == "DISABLED") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_on_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_off_"+key, scene_status[key] );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] == "OFF") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_off_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_on_"+key, "" );
				}
			statusShow_display(key, scene_status[key]);
			}
		else if (scene_status[key] == "POWER_OFF") {
			if (deactivateButton == false) {
				statusShow_powerButton( "scene_off_"+key,  scene_status[key] );
				statusShow_powerButton( "scene_on_"+key, "" );
				}
		    setTextById("display_POWER_OFF_info_"+key, lang("POWER_DEVICE_OFF_SCENE", [""]));
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
function statusCheck_deviceActive(data) {

	if (deactivateButton)	{ return; }
	if (!data["CONFIG"]) {
		console.error("statusCheck_deviceActive: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	var device_status  = {};
	var devices_status = data["STATUS"]["devices"];
	var devices_config = data["CONFIG"]["devices"];
	var scene          = rm3remotes.active_name;
	var filter         = false;
	var scene_status   = {};

    // check scene status: inactive macro_buttons, deactivate all buttons from list starting with "macro", power message
    if (rm3remotes.active_type == "scene") {
    	var [scene_status, status_log]          = statusCheck_scenePowerStatus(data);
        console.debug("---> " + scene + " " + scene_status[scene] + " - " + status_log[scene]);

        if (scene_status[scene] == "POWER_OFF") {
            for (var i=0; i<rm3remotes.active_buttons.length; i++) {
                var button = rm3remotes.active_buttons[i];
                statusShow_buttonActive(button,false);
                }
            for (var i=0; i<rm3remotes.active_channels.length; i++) {
                var button = rm3remotes.active_channels[i];
                statusShow_buttonActive(button,false);
                }
            //setTextById("header_image_text_info", lang("POWER_DEVICE_OFF_SCENE_INFO"));
            setTextById("scene-power-information-"+scene, lang("POWER_DEVICE_OFF_SCENE_INFO"));
            elementVisible("scene-power-information-"+scene);
            }
        else if (scene_status[scene] != "ON" && scene_status[scene] != "OFF") {
            for (var i=0; i<rm3remotes.active_buttons.length; i++) {
                var button1 = rm3remotes.active_buttons[i].split("_");
                if (button1[0] == "macro") { statusShow_buttonActive(button1[0]+"_"+button1[1],false); }
                }
            setTextById("scene-power-information-"+scene, status_log[scene]);
            elementVisible("scene-power-information-"+scene);
            }
        else {
            for (var i=0; i<rm3remotes.active_buttons.length; i++) {
                var button1 = rm3remotes.active_buttons[i].split("_");
                if (button1[0] == "macro") { statusShow_buttonActive(button1[0]+"_"+button1[1],true); }
                }
            setTextById("scene-power-information-"+scene, "");
            elementHidden("scene-power-information-"+scene);
            }
        }

	// check device status: if OFF change color of buttons to gray
	var [device_status, device_status_log]  = statusCheck_devicePowerStatus(data);
	var buttons_color  = data["CONFIG"]["elements"]["button_colors"];
	var buttons_power  = {"on":1, "off":1, "on-off":1};

	for (var device in devices_status) {

		if (devices_config[device] && devices_config[device]["buttons"] && devices_status[device] && devices_status[device]["power"]) {

		    var status     = device_status[device];
		    var message    = device_status_log[device];
            var power_on   = (status == "ON");

			// show device status
			console.debug("statusCheck_deviceActive: " + device + ", " + power_on + "(" + status + ": " + message + ")");

			// show message
			if (status != "ON" && status != "OFF") {
			    setTextById("remote-power-information-"+device, message);
			    elementVisible("remote-power-information-"+device);
			    }
			else {
			    setTextById("remote-power-information-"+device, "");
			    elementHidden("remote-power-information-"+device);
    			}

            // check if device of slider is active
			for (var i=0;i<devices_config[device]["commands"]["set"].length;i++) {
				var button = devices_config[device]["commands"]["set"][i];
				if (!power_on)  { statusShow_buttonActive("slider_"+device+"_"+button+"_input",false); }
				else            { statusShow_buttonActive("slider_"+device+"_"+button+"_input",true); }
				}

			// check if device of buttons is active
			for (var i=0;i<devices_config[device]["buttons"].length;i++) {
				var button   = devices_config[device]["buttons"][i].toLowerCase();

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
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	for (var device in data["STATUS"]["devices"]) {
	    var device_status   = data["STATUS"]["devices"][device];
	    var last_send       = device_status["api-last-send-tc"];
	    var auto_power_off  = device_status["auto-power-off"];
	    var power_status    = device_status["power"];
	    var current_time    = Math.round(new Date().getTime() / 1000);

	    if (document.getElementById("display_"+device+"_auto-power-off")) {
	        setTextById("display_"+device+"_auto-power-off", power_status);
	    }

        if (last_send != undefined && auto_power_off != undefined) {
            if (power_status == "ON" && (auto_power_off - (current_time - last_send)) > 0) {
	            //console.log(" ....... " + (current_time - last_send) + " ... " + auto_power_off);
	            var off = convert_second2time(auto_power_off - (current_time - last_send));
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
function statusCheck_devicePowerButtonDisplay(data={}) {

	// check device status and change color of power buttons / main menu buttons device
	var device_list    = "";
	var devices        = data["STATUS"]["devices"];
	var devices_config = data["CONFIG"]["devices"];
    var [device_status, device_status_log]  = statusCheck_devicePowerStatus(data);

	for (var device in devices) {

	    if (device == "default")         { continue; }
		if (!devices_config[device])     { console.warn("Device not defined correctly: '" + device + "' has no configuration."); continue; }
	    if (!devices[device]["power"])   { continue; }

        var power_status  = device_status[device];
        var power_message = device_status_log[device];

        // format power buttons
        if (deactivateButton == false) {
            if (power_status.indexOf("ERROR") >= 0) {
                statusShow_powerButton( "device_" + device, "ERROR" ); // main menu button
                statusShow_powerButton( device + "_on-off", "ERROR" ); // on-off device button
                statusShow_powerButton( device + "_on",     "ERROR" );
                statusShow_powerButton( device + "_off",    "ERROR" );
            }
            else if (power_status == "POWER_OFF") {
                statusShow_buttonActive("device_" + device, false);
                statusShow_buttonActive(device + "_on-off", false);
                statusShow_buttonActive(device + "_on", false);
                statusShow_buttonActive(device + "_off", false);
                }
            else if (power_status == "OFF") {
                statusShow_powerButton( "device_" + device, "OFF" ); // main menu button
                statusShow_powerButton( device + "_on-off", "OFF" ); // on-o:16
                statusShow_powerButton( device + "_off", "OFF" );
                statusShow_powerButton( device + "_on",  "" );
                }
            else if (power_status == "ON") {
                statusShow_powerButton( "device_" + device, "ON" ); // main menu button
                statusShow_powerButton( device + "_on-off", "ON" ); // on-off device button
                statusShow_powerButton( device + "_on",  "ON" );
                statusShow_powerButton( device + "_off", "" );
                }
            }

        // format displays
        if (rm3remotes.edit_mode)                           { statusShow_display(device, "EDIT_MODE"); }
        else if (deactivateButton || power_status == "N/A") { statusShow_display(device, "MANUAL"); }
        else if (power_status == "ON")                      { statusShow_display(device, "ON"); }
        else if (power_status == "OFF")                     { statusShow_display(device, "OFF"); }
        else if (power_status.indexOf("ERROR") >= 0) {
            statusShow_display(device, "ERROR");
		    setTextById("display_ERROR_info_"+device, "");
            }
        else if (power_status == "POWER_OFF") {
            statusShow_display(device, "POWER_OFF");
		    setTextById("display_POWER_OFF_info_"+device, "");
            }
        }

    console.debug("statusCheck_powerButton: "+device_list);
	}


// check system health
function statusCheck_health(data={}) {

    if (!data || !data["STATUS"]) { return; }

    var system_health      = data["STATUS"]["system_health"];
    var modules = [];
    var threads = [];

    for (const [key, value] of Object.entries(system_health)) {

        if (value == "registered")      { modules.push(key); }
        else if (value == "stopped")    { threads.push(key + " (stopped)"); }
        else                            {
            var message = key + " (" + value + "s)";
            if (value >= 20)            { threads.push("<font color='darkred'>" + message + "</font>"); }
            else if (value >= 10)       { threads.push("<font color='orange'>" + message + "</font>"); }
            else                        { threads.push("<font color='green'>" + message + "</font>"); }
            }
    }
    health_msg = threads.join(", ");
    if (document.getElementById("system_health")) {
        document.getElementById("system_health").innerHTML = health_msg;
        }
}


// check status information of device -> insert into display
function statusCheck_displayValues(data={}) {

	// check status for displays
	var devices     = data["CONFIG"]["devices"];
	var scenes      = data["CONFIG"]["scenes"];
    var [device_status, device_status_log]  = statusCheck_devicePowerStatus(data);

	// set colors
	var vol_color   = "white";
	var vol_color2  = "yellow";
	var novol_color = "darkgray";

    // fill in values for all device displays
	for (var key in devices) {

	    if (key == "default") { continue; }
		if (!data["CONFIG"]["devices"][key]) {
		    console.warn("Device not defined correctly: '" + key + "' has no configuration.");
		    continue;
		    }

	    // device status
	    var status      = device_status[key];
	    var message     = device_status_log[key];
        var dev_status  = data["STATUS"]["devices"][key];
        var dev_config  = data["CONFIG"]["devices"][key];

        // set values if device is active or scene is active (which can contain several devices)
        if (status == "ON" && (rm3remotes.active_type == "scene" || rm3remotes.active_name == key)) {

			var remote      = devices[key]["remote"]["remote"];
			var display     = devices[key]["remote"]["display"];

			if (!remote.includes("DISPLAY"))            { continue; }
			if (display == {} || display == undefined)  { continue; }

            // set display values
			for (var display_key in display) {
				var value_key      = display[display_key];
				var element        = document.getElementById("display_" + key + "_" + value_key);
				var element2       = document.getElementById("display_full_" + key + "_" + value_key);
				var key_status     = dev_status[value_key];

				if (value_key == "vol"
				    && dev_config["commands"]["definition"]
				    && dev_config["commands"]["definition"][value_key]
				    && dev_config["commands"]["definition"][value_key]["values"]
				    && dev_config["commands"]["definition"][value_key]["values"]["max"]) {

					key_status = statusShow_volume_old( dev_status[value_key], dev_config["commands"]["definition"][value_key]["values"]["max"], vol_color2, novol_color ) + " &nbsp; ["+dev_status[value_key]+"]";
					}

				if (key_status && value_key == "power") {
					//if (connected != "connected")                           { key_status = use_color("<b>"+lang("CONNECTION_ERROR")+":</b><br/>","error")+connected; }
/// ------------> status auswerten
					//if (online_status && online_status == "offline")   { key_status = use_color("<b>"+lang("OFFLINE")+"</b><br/>","hint"); }
			        if (key_status.toUpperCase().indexOf("ON") >= 0)   { key_status = use_color("<b>Power On<b/>","on"); }
					else if (key_status.toUpperCase().indexOf("OFF") >= 0)  { key_status = use_color("<b>Power Off<b/>","hint"); }
					else if (key_status.toUpperCase().indexOf("N/A") >= 0)  { key_status = use_color("<b>Power Status N/A<b/>","hint"); }
                    else                                                    { key_status = use_color("<b>"+lang("ERROR_UNKNOWN")+":</b> ","error")+key_status; }
					}

				if (element)  { element.innerHTML  = key_status; }
				if (element2) { element2.innerHTML = key_status.replace(/,/g,"; "); }
				}
            }

        // set display detail popup values (for devices only)
        if (rm3remotes.active_type == "device" && dev_status && dev_config && dev_config["commands"]["get"]) {

            var additional_keys = ["api","api-status","api-last-query","api-last-record",
                                   "api-last-send","api-auto-off"];
            var display_keys    = dev_config["commands"]["get"];
            var connected       = device_status[key] + ": " + device_status_log[key];

            for (var i=0; i<additional_keys.length; i++) {
                if (!display_keys[additional_keys[i]] && dev_status[additional_keys[i]]) { display_keys.push([additional_keys[i]]); }
                }

            for (var i=0; i<display_keys.length; i++) {
                var value_key   = display_keys[i];
                var key_status  = dev_status[value_key];
                var element2    = document.getElementById("display_full_" + key + "_" + value_key);

                if (typeof(key_status) == "string") {
                    key_status          = key_status.replaceAll("'", "\"");
                    key_status          = key_status.replaceAll("True", "true");
                    key_status          = key_status.replaceAll("False", "false");
                    }
                key_status      = syntaxHighlightJSON(key_status);

                if (value_key == "power") {
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
	for (var key in scenes) {

		if (scenes[key]["remote"] && scenes[key]["remote"]["display-detail"]) {
			// .......
			for (var vkey in scenes[key]["remote"]["display-detail"]) {
				var value           = scenes[key]["remote"]["display-detail"][vkey];
				var element2        = document.getElementById("display_full_" + key + "_" + vkey);
				var values1         = value.split("_");
				var values2         = values1[1].split("||");
				var replace_tag     = values2[0]; // tag/parameter from device to be displayed
				var replace_value   = "";         // value for this tag
				var replace_device  = values1[0]; // device id for displays in scenes
				var replace_index   = values2[1]; // grab index, if value is a dict -> e.g. ['plot']

				var replace_device_status = data["STATUS"]["devices"][replace_device];
				
				if (devices[replace_device] && replace_device_status && replace_device_status[replace_tag]) {
					replace_value = replace_device_status[replace_tag];
					replace_value_org = replace_value;
					if (replace_index && replace_index != "") {
					
						// workaround, check why not in the correct format (KODI?!)
						if (replace_value != "no media" && replace_value != "Error") {
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
    var keys = ["ON", "OFF", "ERROR", "MANUAL", "EDIT_MODE", "POWER_OFF"];
    view = view.toUpperCase();
    if (view == "N/A") { view == "MANUAL"; }
    if (document.getElementById("display_"+id+"_"+view)) {
        for (var i=0;i<keys.length;i++) { elementHidden( "display_"+id+"_"+keys[i]); }
        elementVisible("display_"+id+"_"+view);
        }
    else {
        console.debug("Error showing display: " + id + ":" + view);
        }
}


// check if some fatal error occurred
function statusCheck_error(data) {
    var html = "";
    var alert = "";
    var count = 0;
    var errors = data["STATUS"]["config_errors"];


    Object.keys(errors["devices"]).forEach(key => {
        if (errors["devices"][key] != {}) {
            count += 1;
            alert += "<b>DEVICE - " + key + "</b>:<br>" + JSON.stringify(errors["devices"][key]);
            }
        });
    Object.keys(errors["scenes"]).forEach(key => {
        if (errors["scenes"][key] != {}) {
            count += 1;
            alert += "SCENE - " + key + ": " + JSON.stringify(errors["scenes"][key]);
            }
        });

    if (count > 0) {
        alert = "<font style='color:var(--rm-color-font-error)'><b>Configuration Error:</b></font><br/>&nbsp;<br/>" + alert;
        alert = alert.replaceAll('"','');
        alert = alert.replaceAll('\'','');
        alert = "appMsg.confirm(\""+alert+"\", \"\", 300);";
        html = "<img src='icon/attention.png' onclick='"+alert+"' style='cursor:pointer;'>";
        }

    setTextById("attention", html);
}


// open as big message
function statusCheck_bigMessage(id) {
    var message = getTextById(id);
    message = "<div class=\"remote-power-information big\">" + message + "</div>";
    appMsg.confirm(message, "", 260);
}
