//--------------------------------
// jc://remote/
//--------------------------------
// Device Status:
// - change color of remote buttons based on status
// - change color of on/off buttons based on status
// - deactivate buttons if device OFF
//--------------------------------
/* INDEX:
function statusShowVolume_old( volume, maximum, vol_color, novol_color="" )
function statusShowVolume( volume )
function statusButtonActiveInactive(id,active)
function statusButtonSetColor(id, status)
function statusCheck_inactive(data)
function statusCheck_load()
function statusCheck(data={})
function statusCheck_apiConnection(data)
function statusCheck_sceneButton(data)
function statusCheck_audioMute(data)
function statusCheck_buttonsOnOff(data={})
function statusCheck_display(data={})
*/
//--------------------------------

var last_media_info_content = "";
var device_media_info       = {};


//-----------------------------------------

function statusShowVolume_old( volume, maximum, vol_color, novol_color="" ) {

	var volume  = Math.round( volume * 20 / maximum );
	var vol_str = "<font color='" + vol_color + "'>";
	for (var i=0; i<volume; i++) { vol_str += "I"; }
	vol_str += "</font>";
	if (novol_color != "") { vol_str += "<font color='" + novol_color + "'>"; }
	for (var i=0; i<20-volume; i++) { vol_str += "I"; }
	return vol_str;
	}

//-----------------------------------------

function statusShowVolume( volume ) {

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

//-----------------------------------------
// check if device status is off -> change color to gray
//-----------------------------------------

// change button color
function statusSliderActiveInactive(id,active) {
	if (document.getElementById(id)) {
		if (active) 	{ document.getElementById(id).classList.remove("device_off"); } 				// reset to CSS color
		else 		{ document.getElementById(id).classList.add("device_off"); }	// color defined in rm_config.js
		}
	}

function statusButtonActiveInactive(id,active) {
	if (document.getElementById(id)) {
		if (active) 	{ document.getElementById(id).classList.remove("device_off"); }
		else 		{ document.getElementById(id).classList.add("device_off"); }	
		}
	}
		
//-----------------------------------------
// show buttons in different colors (depending if devices are ON or OFF)
//-----------------------------------------

function statusButtonSetColor(id, status) {

	if (status in colors_power)	{ color = colors_power[status]; }	// color defined in rm_config.js
	else				{ color = ""; } 			// reset to CSS color

	var button = document.getElementById(id);
	if (typeof(button) != 'undefined' && button != null) {
		button.style.backgroundColor      = color;
		}
	}

//-----------------------------------------
// check if device status
//-----------------------------------------
	
// check if device status is off
function statusCheck_inactive(data) {

	if (deactivateButton)	{ return; }

	if (!data["DATA"]) {
		console.error("statusCheck_inactive: data not loaded.");
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
				if (devices_status[all_dev[i]]["power"]) 	{ device_status[all_dev[i]] = devices_status[all_dev[i]]["power"].toUpperCase();  }
				else						{ device_status[all_dev[i]] = "" }
				}
			for (var i=0;i<required.length;i++) { if (device_status[required[i]] == "ON") { dev_on += 1; } }

			if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
			else if (dev_on > 0)			{ scene_status[key] = "OTHER"; }
			else					{ scene_status[key] = "OFF"; }
			//console.debug(key + " - on:" + dev_on + " / off:" + required.length + " / " + scene_status[key]);
			}
		else {
			console.error("ERROR statusCheck_inactive");
			console.error(data["DATA"]["scenes"][key]);
			required = [];
			}
		}
		
	// deactive makro_buttons (check scene status, deactivate all buttons from list starting with "makro")
	if (rm3remotes.active_type == "scene" && scene[rm3remotes.active_name] != "ON") {
	
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusButtonActiveInactive(button1[0]+"_"+button1[1],false); }
			}
		}
	else if (rm3remotes.active_type == "scene") {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusButtonActiveInactive(button1[0]+"_"+button1[1],true); }
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
					statusButtonActiveInactive("slider_"+device+"_"+button+"_input",false);
					}
				else {
					statusButtonActiveInactive("slider_"+device+"_"+button+"_input",true);
					}
				}
				
			for (var i=0;i<devices_config[device]["buttons"].length;i++) {
				var button   = devices_config[device]["buttons"][i].toLowerCase();

				if (!buttons_power[button] && !power_on) {
					statusButtonActiveInactive(device+"_"+button,false);
					}
				else if (!buttons_power[button] && power_on) {
					statusButtonActiveInactive(device+"_"+button,true);
					}		
				else {
					statusButtonActiveInactive(device+"_"+button,true);
					}
				}
			}
		}
	}

//-----------------------------------------

function statusCheck_load() {	rm3app.requestAPI("GET",["list"], "", statusCheck, "" ); }
function statusCheck(data={}) {

	// if not data includes -> error	
	if (!data["DATA"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}
			
	statusCheck_display(data);
	statusCheck_inactive(data);
	statusCheck_buttonsOnOff(data);
	statusCheck_sceneButton(data);
	statusCheck_audioMute(data);
	statusCheck_apiConnection(data);
	}


//-----------------------------------------

function statusCheck_apiConnection(data) {
	// check api status
	var api_summary = {};
	
	for (var key in data["STATUS"]["interfaces"]) {
		var api_dev = key.split("_");
		if (!api_summary[api_dev[0]]) { api_summary[api_dev[0]] = ""; }
		if (data["STATUS"]["interfaces"][key] == "Connected" && api_summary[api_dev[0]] != "ERROR") 	{ api_summary[api_dev[0]] = "OK"; } 
		else													{ api_summary[api_dev[0]] = "ERROR"; } 
		}
		
	for (var key in api_summary) {
		if (api_summary[key] == "OK") 	{ setTextById("api_status_" + key, " &nbsp;...&nbsp; <font color='" + color_api_connect + "'>" + api_summary[key] + "</font>"); }
		else					{ setTextById("api_status_" + key, " &nbsp;...&nbsp; <font color='" + color_api_error + "'>" + api_summary[key] + "</font>"); }
		}
	
	for (var key in data["STATUS"]["interfaces"]) {
		var status = data["STATUS"]["interfaces"][key];
		if (status == "Connected") 		{ setTextById("api_status_" + key, "<font color='" + color_api_connect + "'>" + status + "</font>"); }
		else					{ setTextById("api_status_" + key, "<font color='" + color_api_error + "'>" + status + "</font>"); }
		}			
	}


//-----------------------------------------

function statusCheck_sceneButton(data) {

	var scene_status = {};
	var devices = data["DATA"]["devices"]

	// get scene status from devices status and definition (see statusCheck) -> move to rm_remote.js
	for (var key in data["STATUS"]["scenes"]) {

		var dev_on    = 0;
		var dev_error = 0;
		var required = data["STATUS"]["scenes"][key];
		for (var i=0;i<required.length;i++) {

	    		var device_api         = data["STATUS"]["devices"][required[i]]["api"];
	    		var device_api_status  = data["STATUS"]["interfaces"][device_api];
			device_status[required[i]]  = devices[required[i]]["status"]["power"].toUpperCase();

			if (device_status[required[i]] == "ON")	{ dev_on += 1; }
			if (device_api_status != "Connected")		{ dev_error += 1; }
			}

		if (dev_error > 0)		 	{ scene_status[key] = "ERROR"; }
		else if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
		else if (dev_on > 0)			{ scene_status[key] = "OTHER"; }
		else					{ scene_status[key] = "OFF"; }
		}

	// check scene status and change color of power buttons
	for (var key in scene_status) {
	
		if (scene_status[key] == "ON") {
			if (deactivateButton == false) {
				statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
				statusButtonSetColor( "scene_off_"+key, "" );
				}
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementVisible("display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		else if (scene_status[key] == "OTHER") {
			if (deactivateButton == false) {
				statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
				statusButtonSetColor( "scene_off_"+key, "" );
				}
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementVisible("display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		else if (scene_status[key] == "ERROR") {
			if (deactivateButton == false) {
				statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
				statusButtonSetColor( "scene_off_"+key, scene_status[key] );
				}
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementVisible("display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		else if (scene_status[key] == "OFF") {
			if (deactivateButton == false) {
				statusButtonSetColor( "scene_off_"+key,  scene_status[key] );
				statusButtonSetColor( "scene_on_"+key, "" );
				}
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementVisible("display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		if (deactivateButton) {
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementVisible("display_"+key+"_MANUAL");
			}
		if (rm3remotes.edit_mode) {
			elementVisible("display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		}
	}
	
//-----------------------------------------

function statusCheck_audioMute(data) {

	// set colors
	var vol_color		= "white";
	var vol_color2		= "yellow";
	var novol_color	= "darkgray";

	var devices		= data["STATUS"]["devices"];
	var devices_config     = data["CONFIG"]["devices"];
	
	var main_audio		= data["CONFIG"]["main-audio"]; 
	
	// check audio status and show mut status in navigation bar
	var power = devices[main_audio]["power"].toUpperCase();
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

	if (devices_config[main_audio] && devices_config[main_audio]["data"]["values"] && devices_config[main_audio]["data"]["values"]["vol"]) {
		main_audio_max  = devices_config[main_audio]["data"]["values"]["vol"]["max"];
		}

	// check volume and show in navigation bar
	rm3slider.set_value( main_audio_vol );
	vol_str = statusShowVolume_old( main_audio_vol, main_audio_max, vol_color );
	document.getElementById("audio3").innerHTML = vol_str;
	}

	
//-----------------------------------------

function statusCheck_buttonsOnOff(data={}) {


	// check device status and change color of power buttons / main menu buttons device
	var devices    = data["STATUS"]["devices"];
	for (var device in devices) {
	
	    var device_api         = data["STATUS"]["devices"][device]["api"];
	    var device_api_status  = data["STATUS"]["interfaces"][device_api];

	    console.debug("Device Status: "+device);
	    for (var key2 in devices[device]) {
	    
	      // if power status
	      if (key2.includes("power")) {

	        var key = device;
	        if (key2 != "power") { key += "_"+key2; }
	        
	        //console.error("TEST "+key1+"_"+key2+" = "+devices[key1]["status"][key2]);
		check_button = devices[device][key2];
		connection   = device_api_status.toLowerCase();					 // indicator if server is already ready to interact with client

		if (connection != "connected") {
			if (deactivateButton == false) {			
				statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
				statusButtonSetColor( key + "_on-off", "ERROR" ); // on-off device button		
				statusButtonSetColor( key + "_on",     "ERROR" );
				statusButtonSetColor( key + "_off",    "ERROR" );
				}
			elementVisible("display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_MANUAL");
			}

		else if (typeof check_button == "string") {
			check_button = check_button.toUpperCase()
			
			if (check_button.includes("ON")) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "ON" ); // main menu button
					statusButtonSetColor( key + "_on-off", "ON" ); // on-off device button		
					statusButtonSetColor( key + "_on",  "ON" );
					statusButtonSetColor( key + "_off", "" );
					}
				elementHidden( "display_"+key+"_ERROR");
				elementVisible("display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}
			else if (check_button.includes("OFF")) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "OFF" ); // main menu button
					statusButtonSetColor( key + "_on-off", "OFF" ); // on-o:16
					statusButtonSetColor( key + "_off", "OFF" );
					statusButtonSetColor( key + "_on",  "" );				
					}
				elementHidden( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementVisible("display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}	
			else if (check_button.includes("ERROR")) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
					statusButtonSetColor( key + "_on-off", "ERROR" ); // on-o:16
					statusButtonSetColor( key + "_off", "ERROR" );
					statusButtonSetColor( key + "_on",  "ERROR" );				
					}
				elementVisible("display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}	
			}
			
		else if (typeof check_button == "object") {
			if (check_button.indexOf("off") >= 0) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "OFF" ); // main menu button
					statusButtonSetColor( key + "_on-off", "OFF" ); // on-off device button		
					statusButtonSetColor( key + "_off", "OFF" );
					statusButtonSetColor( key + "_on",  "" );
					}
				elementHidden( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementVisible("display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}	
			else if (check_button.indexOf("on") >= 0) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "ON" ); // main menu button
					statusButtonSetColor( key + "_on-off", "ON" ); // on-off device button		
					statusButtonSetColor( key + "_on",  "ON" );
					statusButtonSetColor( key + "_off", "" );
					}
				elementHidden( "display_"+key+"_ERROR");
				elementVisible("display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}
			else if (check_button.includes("Error") || check_button.includes("ERROR") || check_button.includes("error")) {
				if (deactivateButton == false) {			
					statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
					statusButtonSetColor( key + "_on-off", "ERROR" ); // on-o:16
					statusButtonSetColor( key + "_off", "ERROR" );
					statusButtonSetColor( key + "_on",  "ERROR" );				
					}
				elementVisible("display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				elementHidden( "display_"+key+"_MANUAL");
				}	
			}
		else {
			elementVisible("display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_MANUAL");
			}	
			
		if (deactivateButton) {
			elementHidden( "display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementVisible("display_"+key+"_MANUAL");
			}
		if (rm3remotes.edit_mode) {
			elementVisible("display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_MANUAL");
			}
		
	        }
	     }
  	  }
	}

	
//-----------------------------------------

function statusCheck_display(data={}) {

	// check status for displays
	var devices		= data["DATA"]["devices"];
	var scenes             = data["DATA"]["scenes"];
	var vol_color		= "white";
	var vol_color2		= "yellow";
	var novol_color	= "darkgray";

	// set colors
	for (var key in devices) {
	
		// media info ...
		var media_info         = document.getElementById("media_info");
		var media_info_content = document.getElementById("media_info_content");
		
    		var device_config      = data["CONFIG"]["devices"][key];
		var device_status      = data["STATUS"]["devices"][key]; 
		var device_api         = data["STATUS"]["devices"][key]["api"];
		var device_api_status  = data["STATUS"]["interfaces"][device_api];
		
		if (device_status["power"])	{ var device_status = device_status["power"].toUpperCase(); }
		else				{ var device_status = ""; }
		
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
				
				if (device_config["data"]["values"] && device_config["data"]["values"][vkey] && vkey == "vol") {
					if (device_config["data"]["values"][vkey]["max"]) { 
							status = statusShowVolume_old( device_status[vkey], device_config["data"]["values"][vkey]["max"], vol_color2, novol_color ) + " &nbsp; ["+device_status[vkey]+"]"; 
							}
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

				if (status.replace)		{ status = status.replace(/,/g,", "); }
				if (element2 && status)	{ element2.innerHTML = status; }
				}
			}
		}

	// check status for displays
	for (var key in scenes) {
		if (scenes[key]["remote"] && scenes[key]["remote"]["display-detail"]) {
			// .......
			for (var vkey in scenes[key]["remote"]["display-detail"]) {
				var value    = scenes[key]["remote"]["display-detail"][vkey];
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var values1  = value.split("_");
				var values2  = values1[1].split("||");
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
							replace_value       = replace_value.replace(/'/g, '"');
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
		
//--------------------------------
// EOF
