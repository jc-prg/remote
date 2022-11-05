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
function statusCheck_load() {	rm3app.requestAPI("GET",["list"], "", statusCheck, "" ); }
function statusCheck(data={}) {

	// if not data includes -> error
	if (!data["DATA"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}
	var start = Date.now();

	statusCheck_display(data);
	statusCheck_deviceActive(data);
	statusCheck_powerButton(data);
	statusCheck_sliderToggle(data);
	statusCheck_powerButtonScene(data);
	statusCheck_audioMute(data);
	statusCheck_apiConnection(data);

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


// check status for all sliders and toggles -> show via color // IN PROGRESS
function statusCheck_sliderToggle(data) {

	var devices    = data["STATUS"]["devices"];
	for (var device in devices) {
	    if (!data["CONFIG"]["devices"][device]) { continue; }
	    var device_api         = data["STATUS"]["devices"][device]["api"];
	    var device_api_status  = data["STATUS"]["interfaces"][device_api];

        for (key in devices[device]) {
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

            if (document.getElementById("slider_"+device+"_send-"+key+"_input")) {
                slider = document.getElementById("slider_"+device+"_send-"+key+"_input");
                if (device_api_status.toLowerCase() == "connected" && value.toLowerCase() != "error")   {
                    console.debug("statusCheck_sliderToggle: "+device+"_"+key+"="+value+" - "+device_api_status)
                    statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", true);
                    }
                else {
                    value = "Error";
                    console.debug("statusCheck_sliderToggle: "+device+"_send-"+key+"="+value+" - "+device_api_status)
                    statusShow_sliderActive("slider_"+device+"_send-"+key+"_input", false);
                    }
                }
            }
	    }
    }


// change slider color
function statusShow_sliderActive(id, active) {
	if (document.getElementById(id)) {
	    slider = document.getElementById(id);
		if (active) {
		    slider.className = "rm-slider device_on";
		    slider.disabled = false;
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
    else if (status.toUpperCase() == "OFF")         { status = "0"; }
    else if (status.toUpperCase().includes("OFF"))  { status = "0"; }
    else if (status.toUpperCase() == "TRUE")        { status = "1"; }
    else if (status.toUpperCase() == "ON")          { status = "1"; }
    else                                            { status = "E"; }

    //if (slider.value == slider_value.value && slider.className.includes("device_set")) {}
    // change only if different value from API (wait in status blue until new status is set server-side)
    if (status != slider_value.value) {

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

	if (status in colors_power)	{ color = colors_power[status]; }	// color defined in rm_config.js
	else				{ color = ""; } 			// reset to CSS color

	var button = document.getElementById(id);
	if (typeof(button) != 'undefined' && button != null) {
		button.style.backgroundColor      = color;
		}
	}


// check if device status is off
function statusCheck_deviceActive(data) {

	if (deactivateButton)	{ return; }

	if (!data["DATA"]) {
		console.error("statusCheck_deviceActive: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	var device_status  = {};
	var devices_status = data["STATUS"]["devices"];
	var devices_config = data["CONFIG"]["devices"];
	var filter         = false;
	var scene_status   = {};
	
	// get scene status from devices status and definition (see statusCheck) -> move to rm_remote.js
	for (var key in data["DATA"]["scenes"]) {
		if (data["DATA"]["scenes"][key]["remote"] && data["DATA"]["scenes"][key]["remote"]["devices"]) {

			var required = data["DATA"]["scenes"][key]["remote"]["devices"];
			var all_dev  = Object.keys(data["DATA"]["devices"]);
			var dev_on   = 0;
		
			for (var i=0;i<all_dev.length;i++)  { 
				if (devices_status[all_dev[i]]["power"]) {
				    device_status[all_dev[i]] = devices_status[all_dev[i]]["power"].toUpperCase();
				    }
				else {
				    device_status[all_dev[i]] = ""
				    }
				}
			for (var i=0;i<required.length;i++) { if (device_status[required[i]] == "ON") { dev_on += 1; } }

			if (dev_on == required.length)  { scene_status[key] = "ON"; }
			else if (dev_on > 0)            { scene_status[key] = "OTHER"; }
			else                            { scene_status[key] = "OFF"; }
			//console.debug(key + " - on:" + dev_on + " / off:" + required.length + " / " + scene_status[key]);
			}
		else {
			console.warn("ERROR statusCheck_deviceActive: "+key);
			console.warn(data["DATA"]["scenes"][key]);
			required = [];
			}
		}
		
	// deactive makro_buttons (check scene status, deactivate all buttons from list starting with "makro")
	if (rm3remotes.active_type == "scene" && scene_status[rm3remotes.active_name] != "ON") {
	
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusShow_buttonActive(button1[0]+"_"+button1[1],false); }
			}
		}
	else if (rm3remotes.active_type == "scene") {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusShow_buttonActive(button1[0]+"_"+button1[1],true); }
			}
		}

	// check device status - if OFF change color of buttons to gray
	var buttons_color  = data["CONFIG"]["button_colors"];
	var buttons_power  = {"on":1, "off":1, "on-off":1};

	for (var device in devices_status) { 
	
		if (devices_config[device] && devices_config[device]["buttons"] && devices_status[device] && devices_status[device]["power"]) {

			var api        = devices_config[device]["interface"]["api"];
			var api_status = data["STATUS"]["interfaces"][api]; 
			
			var power_on = true; 
			if (devices_status[device]["power"].toUpperCase() != "ON") { power_on = false; }
			if (devices_status[device]["api-status"] != "Connected")   { power_on = false; }
			if (api_status != "Connected")                             { power_on = false; }

			for (var i=0;i<devices_config[device]["commands"]["set"].length;i++) {
				var button = devices_config[device]["commands"]["set"][i];
				if (!power_on) {
					statusShow_buttonActive("slider_"+device+"_"+button+"_input",false);
					}
				else {
					statusShow_buttonActive("slider_"+device+"_"+button+"_input",true);
					}
				}
				
			for (var i=0;i<devices_config[device]["buttons"].length;i++) {
				var button   = devices_config[device]["buttons"][i].toLowerCase();

				if (!buttons_power[button] && !power_on) {
					statusShow_buttonActive(device+"_"+button,false);
					}
				else if (!buttons_power[button] && power_on) {
					statusShow_buttonActive(device+"_"+button,true);
					}		
				else {
					statusShow_buttonActive(device+"_"+button,true);
					}
				}
			}
		}
	}


// check if api is connected
function statusCheck_apiConnection(data) {
	// check api status
	var api_summary    = {};
	var config_errors  = data["STATUS"]["config_errors"]["devices"];
	var config_devices = data["STATUS"]["devices"]; 
	
	for (var key in data["STATUS"]["interfaces"]) {
		var api_dev = key.split("_");
		if (!api_summary[api_dev[0]]) { api_summary[api_dev[0]] = ""; }
		if (data["STATUS"]["interfaces"][key] == "Connected" && api_summary[api_dev[0]] != "ERROR") 	{ api_summary[api_dev[0]] = "OK"; } 
		else													{ api_summary[api_dev[0]] = "ERROR"; } 
		for (key2 in config_devices) {
			if (config_errors[key2] && config_errors[key2] != {} && config_devices[key2]["api"] == key)	{ api_summary[api_dev[0]] = "ERROR"; } 
			}
		}
		
	for (var key in api_summary) {
	    if (document.getElementById("api_status_" + key)) {
            if (api_summary[key] == "OK")   { setTextById("api_status_" + key, " &nbsp;...&nbsp; <font color='" + color_api_connect + "'>" + api_summary[key] + "</font>"); }
            else                            { setTextById("api_status_" + key, " &nbsp;...&nbsp; <font color='" + color_api_error + "'>" + api_summary[key] + "</font>"); }
            }
		}
	
	for (var key in data["STATUS"]["interfaces"]) {
	    if (document.getElementById("api_status_" + key)) {
            var status = data["STATUS"]["interfaces"][key];
            if (status == "Connected")  { setTextById("api_status_" + key, "<font color='" + color_api_connect + "'>" + status + "</font>"); }
            else                        { setTextById("api_status_" + key, "<font color='" + color_api_error + "'>" + status + "</font>"); }
            }
		}			
	}


// check power status of devices required for a scene
function statusCheck_sceneDevices(data) {

	var scene_status = {};
	var log_data = {};
	var devices = data["DATA"]["devices"]

	for (var key in data["STATUS"]["scenes"]) {
		var dev_on         = 0;
		var dev_error      = 0;
		var required       = data["STATUS"]["scenes"][key];
		log_data[key]  = "";

		for (var i=0;i<required.length;i++) {

	        var device_api         = data["STATUS"]["devices"][required[i]]["api"];
	        var device_api_status  = data["STATUS"]["interfaces"][device_api];
	        log_data[key]         += required[i];

            if (devices[required[i]]["status"]["power"]) {
                device_status[required[i]]  = devices[required[i]]["status"]["power"].toUpperCase();
                log_data[key] += "="+device_status[required[i]]+"  ";
                }
            else {
                device_status[required[i]] = "";
                log_data[key] += "=<NO-POWER-STATUS>  ";
                }

            if (device_status[required[i]] == "ON") { dev_on += 1; }
            if (device_api_status != "Connected")   { dev_error += 1; }
            }

        if (dev_error > 0)                  { scene_status[key] = "ERROR"; }
        else if (dev_on == required.length) { scene_status[key] = "ON"; }
        else if (dev_on > 0)                { scene_status[key] = "OTHER"; }
        else                                { scene_status[key] = "OFF"; }
        }

	return [ scene_status, log_data ];
    }


// show power status of devices required for a scene -> color button
function statusCheck_powerButtonScene(data) {

    var scene_status_all = statusCheck_sceneDevices(data);
	var scene_status = scene_status_all[0];

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
		else if (scene_status[key] == "OTHER") {
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
		else if (scene_status[key] == "OFF") {
			if (deactivateButton == false) {
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
    var device_api          = data["STATUS"]["devices"][main_audio]["api"];
    var device_api_status   = data["STATUS"]["interfaces"][device_api];

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

	
// check power status of device -> color button
function statusCheck_powerButton(data={}) {

	// check device status and change color of power buttons / main menu buttons device
	var devices     = data["STATUS"]["devices"];
	var device_list = "";
	for (var device in devices) {
	
	    if (!data["CONFIG"]["devices"][device]) { continue; }

	    var device_api         = data["STATUS"]["devices"][device]["api"];
	    var device_api_status  = data["STATUS"]["interfaces"][device_api];
	    device_list += device + " ";

	    for (var key2 in devices[device]) {
	    
	        // if power status
	        if (key2.includes("power") ) {

                var key = device;
                if (key2 != "power") { key += "_"+key2; }
                if (!document.getElementById(key+"_on-off") && !document.getElementById(key+"_on") && !document.getElementById(key+"_off")) { continue; }

                check_button = devices[device][key2];
                connection   = device_api_status.toLowerCase();					 // indicator if server is already ready to interact with client
                console.debug("statusCheck_powerButton: "+key+"="+check_button+" - "+connection);

                if (connection.toLowerCase() != "connected") {
                    if (deactivateButton == false) {
                        statusShow_powerButton( "device_" + key, "ERROR" ); // main menu button
                        statusShow_powerButton( key + "_on-off", "ERROR" ); // on-off device button
                        statusShow_powerButton( key + "_on",     "ERROR" );
                        statusShow_powerButton( key + "_off",    "ERROR" );
                        }
                    statusShow_display(key, "ERROR");
                    console.debug("statusCheck_powerButton: "+device+"_"+key+"="+check_button+" - "+connection)
                    continue;
                    }

                if (typeof check_button == "string") {
                    check_button = check_button.toUpperCase()

                    if (check_button.includes("ON")) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "ON" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "ON" ); // on-off device button
                            statusShow_powerButton( key + "_on",  "ON" );
                            statusShow_powerButton( key + "_off", "" );
                            }
                        statusShow_display(key, "ON");
                        }
                    else if (check_button.includes("OFF")) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "OFF" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "OFF" ); // on-o:16
                            statusShow_powerButton( key + "_off", "OFF" );
                            statusShow_powerButton( key + "_on",  "" );
                            }
                        statusShow_display(key, "OFF");
                        }
                    else if (check_button.includes("ERROR")) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "ERROR" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "ERROR" ); // on-o:16
                            statusShow_powerButton( key + "_off", "ERROR" );
                            statusShow_powerButton( key + "_on",  "ERROR" );
                            }
                        statusShow_display(key, "ERROR");
                        }
                    }

                else if (typeof check_button == "object") {
                    if (check_button.indexOf("off") >= 0) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "OFF" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "OFF" ); // on-off device button
                            statusShow_powerButton( key + "_off", "OFF" );
                            statusShow_powerButton( key + "_on",  "" );
                            }
                        statusShow_display(key, "OFF");
                        }
                    else if (check_button.indexOf("on") >= 0) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "ON" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "ON" ); // on-off device button
                            statusShow_powerButton( key + "_on",  "ON" );
                            statusShow_powerButton( key + "_off", "" );
                            }
                        statusShow_display(key, "ON");
                        }
                    else if (check_button.includes("Error") || check_button.includes("ERROR") || check_button.includes("error")) {
                        if (deactivateButton == false) {
                            statusShow_powerButton( "device_" + key, "ERROR" ); // main menu button
                            statusShow_powerButton( key + "_on-off", "ERROR" ); // on-o:16
                            statusShow_powerButton( key + "_off", "ERROR" );
                            statusShow_powerButton( key + "_on",  "ERROR" );
                            }
                        statusShow_display(key, "ERROR");
                        }
                    }

                else {
                    statusShow_display(key, "ERROR");
                    }

                if (deactivateButton) {
                    statusShow_display(key, "MANUAL");
                    }
                if (rm3remotes.edit_mode) {
                    statusShow_display(key, "EDIT_MODE");
                    }

	        }
	        }
  	    }
    console.debug("statusCheck_powerButton: "+device_list)
	}

	
// check status information of device -> insert into display
function statusCheck_display(data={}) {

	// check status for displays
	var devices		= data["DATA"]["devices"];
	var scenes             = data["DATA"]["scenes"];
	var vol_color		= "white";
	var vol_color2		= "yellow";
	var novol_color	= "darkgray";

	// set colors
	for (var key in devices) {
	
		if (!data["CONFIG"]["devices"][key]) { continue; }
	
		// media info ...
		var media_info         = document.getElementById("media_info");
		var media_info_content = document.getElementById("media_info_content");
		
    	var device_config      = data["CONFIG"]["devices"][key];
		var device_status      = data["STATUS"]["devices"][key]; 
		var device_api         = data["STATUS"]["devices"][key]["api"];
		var device_api_status  = data["STATUS"]["interfaces"][device_api];
		
		if (device_status["power"]) { var device_status = device_status["power"].toUpperCase(); }
		else                        { var device_status = ""; }
		
		if (device_api_status == "Connected" && device_status["power"] && device_status["power"].includes("ON")) {
		
			// to be transfered to server: single source for playing information
			// -> add 'queries-content-info = ["current-playing","usb-net-title"]' to config files
			// -> offer value via API
			// -> use it here to check if one of those values contains (relevant) information
					
			var playing_information = ["current-playing","usb-net-title"];
			var playing_content     = "";
			
			for (var i=0;i<playing_information.length;i++) {

				if (device_status[playing_information[i]] 
				    && device_status[playing_information[i]] != "" 
				    && device_status[playing_information[i]] != "Error"
				    && device_status[playing_information[i]] != "no media"
				    && device_status[playing_information[i]] != "no data"
				    ) {
					playing_content = device_status[playing_information[i]];
					}
				}
		
			if (media_info && playing_content != "") {

				if (media_info_content)	{ var current_media_info_content = media_info_content.innerHTML; }
				else				{ var current_media_info_content = ""; }
				
				if (playing_content != "" && rm3remotes.active_name == key) {				
					current_media_info_content = playing_content;
					current_playing            = "&nbsp;<br/><center>";
					current_playing           += "<marquee style='width:98%' scrollamount='3' scrolldelay='10' id='media_info_content'>"+current_media_info_content+"</marquee>";
					current_playing           += "</center>&nbsp;<hr/>";
					device_media_info[key]     = current_media_info_content;
					}
				else {	current_playing            = "";
					device_media_info[key]     = "";
					}

				if (current_media_info_content != last_media_info_content) { 
					media_info.innerHTML    = current_playing;
					last_media_info_content = current_media_info_content;
					}
	 			}
	 		}

		// fill keys with displays
		if (device_status && devices[key]["remote"] && devices[key]["remote"]["display"]) {
		
			var display     	= devices[key]["remote"]["display"];
			var connected   	= device_api_status.toLowerCase();
			var device_status      = data["STATUS"]["devices"][key]; 
		        
			for (var dkey in display) {
				var vkey     = display[dkey];
				var element  = document.getElementById("display_" + key + "_" + vkey);
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status   = device_status[vkey];
				
				if (vkey == "vol" 	
				    && device_config["commands"]["definition"] 
				    && device_config["commands"]["definition"][vkey]
				    && device_config["commands"]["definition"][vkey]["values"]
				    && device_config["commands"]["definition"][vkey]["values"]["max"]) {
				    
					status = statusShow_volume_old( device_status[vkey], device_config["commands"]["definition"][vkey]["values"]["max"], vol_color2, novol_color ) + " &nbsp; ["+device_status[vkey]+"]"; 
					}
									
				if (status && vkey == "power") {
					if (connected != "connected")						{ status = "<b style='color:red;'>Connection Error:</b><br/>"+connected; }			
			        	else if (status.indexOf("ON") >= 0 || status.indexOf("on") >= 0)	{ status = "<b style='color:lightgreen;'>Connected<b/>"; }
					else if (status.indexOf("OFF") >= 0 || status.indexOf("off") >= 0)	{ status = "<b style='color:gold;'>Connected: Power Off<b/>"; }
        				else 									{ status = "<b style='color:red;'>Unknown Error:</b> "+status; }			
					}
				if (status && element)  { element.innerHTML  = status; }
				if (status && element2) { element2.innerHTML = status.replace(/,/g,"; "); }
				}
			}
			
		// fill all keys in alert display
		if (device_status && device_config && device_config["commands"]["get"]) {

			var additional_keys    = ["api","api-status","api-last-query","api-last-record","api-last-send"];
			var display     	= device_config["commands"]["get"];
			var connected   	= device_api_status.toLowerCase();
			var device_status      = data["STATUS"]["devices"][key]; 

			for (var i=0; i<additional_keys.length; i++) {
				if (!display[additional_keys[i]] && device_status[additional_keys[i]]) { display.push([additional_keys[i]]); }
				}

			for (var i=0; i<display.length; i++) {
				var vkey     		= display[i];
				var element2 		= document.getElementById("display_full_" + key + "_" + vkey);
				var status   		= device_status[vkey];		

				if (status && vkey == "power") {
					if (connected != "connected")						{ status = "<b style='color:red;'>Connection Error:</b><br/>"+connected; }			
			        	else if (status.indexOf("ON") >= 0 || status.indexOf("on") >= 0)	{ status = "<b style='color:lightgreen;'>Connected<b/>"; }
					else if (status.indexOf("OFF") >= 0 || status.indexOf("off") >= 0)	{ status = "<b style='color:gold;'>Connected: Power Off<b/>"; }
        				else 									{ status = "<b style='color:red;'>Unknown Error:</b> "+status; }			
					}
				else if (status && vkey == "api-status") {
					status = device_api_status;
					}

				if (status && status.replace)	{ status = status.replace(/,/g,", "); }
				if (element2 && status)	{ element2.innerHTML = status; }
				}
			}
		}

	// check status for displays
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
					if (replace_index && replace_index != "") {
					
						// workaround, check why not in the correct format (KODI?!)
						if (replace_value != "no media" && replace_value != "Error") {
							//console.warn(replace_value);
							replace_value       = replace_value.replaceAll("'", '"');
							eval ("var replace_content = JSON.parse(replace_value);");	 // refactor with let (otherwise security issue)
							eval ("var replace_value = replace_content"+replace_index);	 // refactor with let (otherwise security issue)
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
    var keys = ["ON", "OFF", "ERROR", "MANUAL", "EDIT_MODE"];
    if (document.getElementById("display_"+id+"_ON")) {
        for (var i=0;i<keys.length;i++) { elementHidden( "display_"+id+"_"+keys[i]); }
        elementVisible("display_"+id+"_"+view);
        }
}

