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
function statusButtonActiveInactive(id,active) {
	if (document.getElementById(id)) {
		if (active) 	{ document.getElementById(id).style.backgroundColor = ""; } 			// reset to CSS color
		else 		{ document.getElementById(id).style.backgroundColor = color_button_inactive; }	// color defined in rm_config.js
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

	var device         = data["DATA"]["devices"];
	var device_status  = {};
	var filter         = false;
	var scene_status   = {};

	// get scene status from devices status and definition (see statusCheck) -> move to rm_remote.js
	for (var key in data["DATA"]["scenes"]) {
		if (data["DATA"]["scenes"][key]["remote"] && data["DATA"]["scenes"][key]["remote"]["devices"]) {

			var required = data["DATA"]["scenes"][key]["remote"]["devices"];
			var all_dev  = Object.keys(data["DATA"]["devices"]);
			var dev_on   = 0;
		
			for (var i=0;i<all_dev.length;i++)  { 
				if (device[all_dev[i]]["status"]["power"]) 	{ device_status[all_dev[i]] = device[all_dev[i]]["status"]["power"].toUpperCase();  }
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
	if (rm3remotes.active_type == "scene" && scene_status[rm3remotes.active_name] != "ON") {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusButtonActiveInactive(button1[0]+"_"+button1[1],false); }
			}
		}
	else {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { statusButtonActiveInactive(button1[0]+"_"+button1[1],true); }
			}
		}

	// check device status - if OFF change color of buttons to gray
	for (var key in device_status) {

		// if filter set to only one device -> do not check other
		if (filter == false) { 

			// if device off -> set all buttons off
			if (device[key]["button_list"] && device_status[key] != "ON") {
				var buttons = device[key]["button_list"];
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						statusButtonActiveInactive(key+"_"+buttons[i],false);
						}
				}
			}
			// if device on -> set all buttons on
			else if (device[key] && typeof device[key]["button_list"] == "object") {
				var buttons = device[key]["button_list"];
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						statusButtonActiveInactive(key+"_"+buttons[i],true);
						}
					}
				}
			}
		}
	}

//-----------------------------------------

function statusCheck_load() {	rm3app.requestAPI("GET",["list"], "", statusCheck, "" ); }
function statusCheck(data={}) {

	// if manual mode -> ignore status check
	if (deactivateButton) { return; }     

	// if not data includes -> error	
	if (!data["DATA"] || !data["STATUS"]) {
		console.error("statusCheck: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}
			
	statusCheck_inactive(data);
	statusCheck_buttonsOnOff(data);
	statusCheck_sceneButton(data);
	statusCheck_audioMute(data);
	statusCheck_apiConnection(data);
	statusCheck_display(data);
	}


//-----------------------------------------

function statusCheck_apiConnection(data) {
	// check api status
	for (var key in data["STATUS"]["interfaces"]) {
		var status = data["STATUS"]["interfaces"][key];
		if (status == "Connected") 	{ setTextById("api_status_" + key, "<font color='" + color_api_connect + "'>" + status + "</font>"); }
		else				{ setTextById("api_status_" + key, "<font color='" + color_api_error + "'>" + status + "</font>"); }
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

	    		var device_api         = data["STATUS"]["devices"][required[i]]["api"]
	    		var device_api_status  = data["STATUS"]["interfaces"][device_api]
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
			statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
			statusButtonSetColor( "scene_off_"+key, "" );
			}
		else if (scene_status[key] == "OTHER") {
			statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
			statusButtonSetColor( "scene_off_"+key, "" );
			}
		else if (scene_status[key] == "ERROR") {
			statusButtonSetColor( "scene_on_"+key,  scene_status[key] );
			statusButtonSetColor( "scene_off_"+key, scene_status[key] );
			}
		else if (scene_status[key] == "OFF") {
			statusButtonSetColor( "scene_off_"+key,  scene_status[key] );
			statusButtonSetColor( "scene_on_"+key, "" );
			}
		}
	}

	
//-----------------------------------------

function statusCheck_audioMute(data) {

	// set colors
	var vol_color		= "white";
	var vol_color2		= "yellow";
	var novol_color	= "darkgray";

	var main_audio		= ""; 
	var devices		= data["STATUS"]["devices"];
	
	for (var key in devices) {
		if (devices[key]["main-audio"] == "yes") { main_audio = key; }
		}

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

	var devices		= data["DATA"]["devices"];
	if (devices[main_audio] && devices[main_audio]["interface"]["values"] && devices[main_audio]["interface"]["values"]["vol"]) {
		main_audio_max  = devices[main_audio]["interface"]["values"]["vol"]["max"];
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
	
	    var device_api         = data["STATUS"]["devices"][device]["api"]
	    var device_api_status  = data["STATUS"]["interfaces"][device_api]

	    console.debug("Device Status: "+device);

	    for (var key2 in devices[device]) {
	    
	      // if power status
	      if (key2.includes("power")) {
	        key = device;
	        if (key2 != "power") { key += "_"+key2; }
	        
	        //console.error("TEST "+key1+"_"+key2+" = "+devices[key1]["status"][key2]);
		check_button = devices[device][key2];
		connection   = device_api_status.toLowerCase();
			
		if (connection != "connected") {
			statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
			statusButtonSetColor( key + "_on-off", "ERROR" ); // on-off device button		
			statusButtonSetColor( key + "_on",     "ERROR" );
			statusButtonSetColor( key + "_off",    "ERROR" );

			elementVisible("display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_EDIT_MODE");
			}

		else if (typeof check_button == "string") {
			check_button = check_button.toUpperCase()
			
			if (check_button.includes("ON")) {
				statusButtonSetColor( "device_" + key, "ON" ); // main menu button
				statusButtonSetColor( key + "_on-off", "ON" ); // on-off device button		
				statusButtonSetColor( key + "_on",  "ON" );
				statusButtonSetColor( key + "_off", "" );

				elementHidden( "display_"+key+"_ERROR");
				elementVisible("display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				}
			else if (check_button.includes("OFF")) {
				statusButtonSetColor( "device_" + key, "OFF" ); // main menu button
				statusButtonSetColor( key + "_on-off", "OFF" ); // on-o:16
				statusButtonSetColor( key + "_off", "OFF" );
				statusButtonSetColor( key + "_on",  "" );				

				elementHidden( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementVisible("display_"+key+"_OFF");
				}	
			else if (check_button.includes("ERROR")) {
				statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
				statusButtonSetColor( key + "_on-off", "ERROR" ); // on-o:16
				statusButtonSetColor( key + "_off", "ERROR" );
				statusButtonSetColor( key + "_on",  "ERROR" );				

				elementVisible( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementHidden("display_"+key+"_OFF");
				}	
			}
			
		else if (typeof check_button == "object") {
			if (check_button.indexOf("off") >= 0) {
				statusButtonSetColor( "device_" + key, "OFF" ); // main menu button
				statusButtonSetColor( key + "_on-off", "OFF" ); // on-off device button		
				statusButtonSetColor( key + "_off", "OFF" );
				statusButtonSetColor( key + "_on",  "" );

				elementHidden( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementVisible("display_"+key+"_OFF");
				}	
			else if (check_button.indexOf("on") >= 0) {
				statusButtonSetColor( "device_" + key, "ON" ); // main menu button
				statusButtonSetColor( key + "_on-off", "ON" ); // on-off device button		
				statusButtonSetColor( key + "_on",  "ON" );
				statusButtonSetColor( key + "_off", "" );
				elementHidden( "display_"+key+"_ERROR");

				elementVisible("display_"+key+"_ON");
				elementHidden( "display_"+key+"_OFF");
				}
			else if (check_button.includes("Error") || check_button.includes("ERROR") || check_button.includes("error")) {
				statusButtonSetColor( "device_" + key, "ERROR" ); // main menu button
				statusButtonSetColor( key + "_on-off", "ERROR" ); // on-o:16
				statusButtonSetColor( key + "_off", "ERROR" );
				statusButtonSetColor( key + "_on",  "ERROR" );				

				elementVisible( "display_"+key+"_ERROR");
				elementHidden( "display_"+key+"_ON");
				elementHidden("display_"+key+"_OFF");
				}	
			}
		else {
			elementVisible("display_"+key+"_ERROR");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_EDIT_MODE");
			}	
			
		if (rm3remotes.edit_mode) {
			elementVisible("display_"+key+"_EDIT_MODE");
			elementHidden( "display_"+key+"_ON");
			elementHidden( "display_"+key+"_OFF");
			elementHidden( "display_"+key+"_ERROR");
			}
		
	        }
	     }
  	  }
	}

	
//-----------------------------------------

function statusCheck_display(data={}) {

	// check status for displays
	var devices		= data["DATA"]["devices"];
	var vol_color		= "white";
	var vol_color2		= "yellow";
	var novol_color	= "darkgray";

	// set colors
	for (var key in devices) {
	
		// media info ...
		var media_info         = document.getElementById("media_info");
		var media_info_content = document.getElementById("media_info_content");
		
		var device_api         = data["STATUS"]["devices"][key]["api"]
		var device_api_status  = data["STATUS"]["interfaces"][device_api]
		
		if (devices[key]["status"]["power"])	{ var device_status = devices[key]["status"]["power"].toUpperCase(); }
		else					{ var device_status = ""; }
		
		if (device_api_status == "Connected" && device_status.includes("ON")) {
			if (media_info && devices[key]["status"]["current-playing"] && devices[key]["status"]["current-playing"] != "") {

				if (media_info_content)	{ var current_media_info_content = media_info_content.innerHTML; }
				else				{ var current_media_info_content = ""; }
				

				if (devices[key]["status"]["current-playing"] != "no media" && rm3remotes.active_name == key) {				
					current_media_info_content = devices[key]["status"]["current-playing"];
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
		if (devices[key]["status"] && devices[key]["remote"] && devices[key]["remote"]["display"]) {
		
			var display     = devices[key]["remote"]["display"];
	    		var device_api         = data["STATUS"]["devices"][key]["api"]
	    		var device_api_status  = data["STATUS"]["interfaces"][device_api]
			var connected   	= device_api_status.toLowerCase();
		        
			for (var dkey in display) {
				var vkey     = display[dkey];
				var element  = document.getElementById("display_" + key + "_" + vkey);
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status   = devices[key]["status"][vkey];
				
				if (devices[key]["interface"]["values"] && devices[key]["interface"]["values"][vkey] && vkey == "vol") {
					if (devices[key]["interface"]["values"][vkey]["max"]) { 
							status = statusShowVolume_old( devices[key]["status"][vkey], devices[key]["interface"]["values"][vkey]["max"], vol_color2, novol_color ) + " &nbsp; ["+devices[key]["status"][vkey]+"]"; 
							}
					}
									
				if (vkey == "power") {
					if (connected != "connected")						{ status = "<b style='color:red;'>Connection Error:</b><br/>"+connected; }			
			        	else if (status.indexOf("ON") >= 0 || status.indexOf("on") >= 0)	{ status = "<b style='color:lightgreen;'>Connected<b/>"; }
					else if (status.indexOf("OFF") >= 0 || status.indexOf("off") >= 0)	{ status = "<b style='color:gold;'>Connected: Power Off<b/>"; }
        				else 									{ status = "<b style='color:red;'>Unknown Error:</b> "+status; }			
					}

				if (element)  { element.innerHTML  = status; }
				if (element2) { element2.innerHTML = status.replace(/,/g,"; "); }
				}
			}
			
		// fill all keys in alert display
		if (devices[key]["status"] && devices[key]["interface"] && devices[key]["interface"]["query_list"]) {

			var display     	= devices[key]["interface"]["query_list"];
	    		var device_api         = data["STATUS"]["devices"][key]["api"]
	    		var device_api_status  = data["STATUS"]["interfaces"][device_api]
			var connected   	= device_api_status.toLowerCase();

			for (var i=0; i<display.length; i++) {
				var vkey     = display[i];
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status   = devices[key]["status"][vkey];		

				if (vkey == "power") {
					if (connected != "connected")						{ status = "<b style='color:red;'>Connection Error:</b><br/>"+connected; }			
			        	else if (status.indexOf("ON") >= 0 || status.indexOf("on") >= 0)	{ status = "<b style='color:lightgreen;'>Connected<b/>"; }
					else if (status.indexOf("OFF") >= 0 || status.indexOf("off") >= 0)	{ status = "<b style='color:gold;'>Connected: Power Off<b/>"; }
        				else 									{ status = "<b style='color:red;'>Unknown Error:</b> "+status; }			
					}

				if (element2 && status) { element2.innerHTML = status.replace(/,/g,", "); }
				}
			}
		}

	// check status for displays
	for (var key in data["STATUS"]["scenes"]) {
		if (data["DATA"]["scenes"][key]["remote"] && data["DATA"]["scenes"][key]["remote"]["display-detail"]) {
			// .......
			for (var vkey in data["DATA"]["scenes"][key]["remote"]["display-detail"]) {
				var value    = data["DATA"]["scenes"][key]["remote"]["display-detail"][vkey];
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var values1  = value.split("_");
				var values2  = values1[1].split("||");
				var replace_tag     = values2[0];
				var replace_value   = values2[0];
				var replace_device  = values1[0];
				var replace_index   = values2[1];
				
				if (data["DATA"]["devices"][replace_device] && data["DATA"]["devices"][replace_device]["status"] && data["DATA"]["devices"][replace_device]["status"][replace_tag]) {
					replace_value = data["DATA"]["devices"][replace_device]["status"][replace_tag];
					if (replace_index && replace_index != "") {
					
						// workaround, check why not in the correct format (KODI?!)
						if (replace_value != "no media") {
							console.warn(replace_value);
							replace_value = replace_value.replace(/'/g, '"');
							var replace_content = JSON.parse(replace_value);
							var replace_cmd     = "replace_content"+replace_index;
							replace_value = eval(replace_cmd);
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
