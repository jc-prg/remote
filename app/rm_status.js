//--------------------------------
// jc://remote/
//--------------------------------
// Device Status:
// - change color of remote buttons based on status
// - change color of on/off buttons based on status
// - deactivate buttons if device OFF
//--------------------------------

// Check if devices are ON or OFF
// and show buttons in different colors
//-----------------------------------------


function show_status_button(id, status) {

	if (status in colors_power)	{ color = colors_power[status]; }	// color defined in rm_config.js
	else				{ color = ""; } 			// reset to CSS color

	var button = document.getElementById(id);
	if (typeof(button) != 'undefined' && button != null) {
		button.style.backgroundColor      = color;
		}
	}

//-----------------------------------------

function showRestStatus(color) {
	var color_html = "";

	if (color == "red")   { color_html = status_red; }
	if (color == "yellow"){ color_html = status_yellow; }
	if (color == "green") { color_html = status_green; }
	if (color == "gray")  { color_html = status_gray; }

	setTextById("rest_status", color_html);
	}

function show_status( color, wait ) {
	showRestStatus( color );
	pausecmd(wait);
	setTimeout(function(){ showRestStatus("gray"); }, wait*1000);
	}

//-----------------------------------------
// check if device status is off -> change color to gray
//-----------------------------------------

// change button color
function set_button_status(id,active) {
	if (document.getElementById(id)) {
		if (active) 	{ document.getElementById(id).style.backgroundColor = ""; }  // reset to CSS color
		else 		{ document.getElementById(id).style.backgroundColor = "#666666"; }
		}
	}
	
	
// check if device status is off
function check_status_inactive(device="") {

	var dev            = dataAll["DATA"]["devices"];
	var device_status  = {};
	var filter         = false;
	var scene_status   = {};

	if (deactivateButton)	{ return; }
	if (device != "")	{ filter = "true"; }

	// get scene status from devices status and definition (see check_status) -> move to rm_remote.js
	for (var key in dataAll["DATA"]["scenes"]) {

		var required = dataAll["DATA"]["scenes"][key]["devices"];
		var all_dev  = Object.keys(dataAll["DATA"]["devices"]);
		var dev_on   = 0;
		
		for (var i=0;i<all_dev.length;i++)  { device_status[all_dev[i]] = dev[all_dev[i]]["status"]["power"].toUpperCase();  }
		for (var i=0;i<required.length;i++) { if (device_status[required[i]] == "ON") { dev_on += 1; } }

		if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
		else if (dev_on > 0)		{ scene_status[key] = "OTHER"; }
		else				{ scene_status[key] = "OFF"; }
		//console.debug(key + " - on:" + dev_on + " / off:" + required.length + " / " + scene_status[key]);
		}
		
	// deactive makro_buttons (check scene status, deactivate all buttons from list starting with "makro")
	if (rm3remotes.active_type == "scene" && scene_status[rm3remotes.active_name] != "ON") {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { set_button_status(button1[0]+"_"+button1[1],false); }
			}
		}
	else {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") { set_button_status(button1[0]+"_"+button1[1],true); }
			}
		}

	// check device status - if OFF change color of buttons to gray
	for (var key in device_status) {

		// if filter set to only one device -> do not check other
		if (filter == false) { 

			// if device off -> set all buttons off
			if (dev[key]["button_list"] && device_status[key] != "ON") {
				var buttons = dev[key]["button_list"];
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						set_button_status(key+"_"+buttons[i],false);
						}
				}
			}
			// if device on -> set all buttons on
			else if (dev[key] && typeof dev[key]["button_list"] == "object") {
				var buttons = dev[key]["button_list"];
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						set_button_status(key+"_"+buttons[i],true);
						}
					}
				}
			}
		}
	}

//-----------------------------------------

function check_status_fresh() {	rm3app.requestAPI("GET",["list"], "", printRmStatus, "" ); }
function check_status(data={}) {

	if (deactivateButton)			{ return; }     // if manual mode <- deactivateButton == true
	if (!dataAll["DATA"]["devices"]) 	{ return; }	// if no data loaded return
	
        var devices        = dataAll["DATA"]["devices"];
	var scene_status   = {};
	var device_status  = {}

	// get data from main audio device
	var main_audio      = dataAll["CONFIG"]["main-audio"];  // get main audio device from file
	var main_audio_max  = "";
	var main_audio_vol  = devices[main_audio]["status"]["vol"];
	var main_audio_mute = devices[main_audio]["status"]["mute"].toUpperCase();
	if (devices[main_audio] && devices[main_audio]["values"]) {
		main_audio_max  = devices[main_audio]["values"]["vol"]["max"];
		}

	// set colors
	var vol_color	   = "white";
	var vol_color2	   = "yellow";
	var novol_color    = "lightblue";
	
	// if data -> callback of sendCmd (ON/OFF) -> check_status_inactive()
	if ("Device" in data)	{ check_status_inactive(data["Device"]); }
	else			{ check_status_inactive(); }

	// get scene status from devices status and definition (see check_status) -> move to rm_remote.js
	for (var key in dataAll["DATA"]["scenes"]) {

		var dev_on   = 0;
		var required = dataAll["DATA"]["scenes"][key]["devices"];
		for (var i=0;i<required.length;i++) {
		        device_status[required[i]] = devices[required[i]]["status"]["power"].toUpperCase();
		        if (device_status[required[i]] == "ON") { dev_on += 1; }
			}

		if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
		else if (dev_on > 0)		{ scene_status[key] = "OTHER"; }
		else				{ scene_status[key] = "OFF"; }
		//console.debug(key + " - on:" + dev_on + " / off:" + required.length + " / " + scene_status[key]);
		}
		
	// check device status and change color of power buttons / main menu buttons device
	for (var device in devices) {
	
	  // if device is visible
	  if (devices[device]["visible"] == "yes") {
	    for (var key2 in devices[device]["status"]) {
	    
	      // if power status
	      if (key2.includes("power")) {
	        key = device;
	        if (key2 != "power") { key += "_"+key2; }
	        
	        //console.error("TEST "+key1+"_"+key2+" = "+devices[key1]["status"][key2]);
		check_button = devices[device]["status"][key2];
		connection   = devices[device]["connected"].toLowerCase();
		
		if (connection != "connected") {
			show_status_button( "device_" + key, "ERROR" ); // main menu button
			show_status_button( key + "_on-off", "ERROR" ); // on-off device button		
			show_status_button( key + "_on",     "ERROR" );
			show_status_button( key + "_off",    "ERROR" );
			}

		else if (typeof check_button == "string") {
			check_button = check_button.toUpperCase()
			
			if (check_button.includes("ON")) {
				show_status_button( "device_" + key, "ON" ); // main menu button
				show_status_button( key + "_on-off", "ON" ); // on-off device button		
				show_status_button( key + "_on",  "ON" );
				show_status_button( key + "_off", "" );
				}
			else if (check_button.includes("OFF")) {
				show_status_button( "device_" + key, "OFF" ); // main menu button
				show_status_button( key + "_on-off", "OFF" ); // on-off device button		
				show_status_button( key + "_off", "OFF" );
				show_status_button( key + "_on",  "" );
				}	
			}
			
		else if (typeof check_button == "object") {
			if (check_button.indexOf("off") >= 0) {
				show_status_button( "device_" + key, "OFF" ); // main menu button
				show_status_button( key + "_on-off", "OFF" ); // on-off device button		
				show_status_button( key + "_off", "OFF" );
				show_status_button( key + "_on",  "" );
				}	
			else if (check_button.indexOf("on") >= 0) {
				show_status_button( "device_" + key, "ON" ); // main menu button
				show_status_button( key + "_on-off", "ON" ); // on-off device button		
				show_status_button( key + "_on",  "ON" );
				show_status_button( key + "_off", "" );
				}
			}	
		}
	      }
	   }
	}

	// check scene status and change color of power buttons
	for (var key in scene_status) {
		if (scene_status[key] == "ON") {
			show_status_button( "scene_on_"+key,  scene_status[key] );
			show_status_button( "scene_off_"+key, "" );
			}
		if (scene_status[key] == "OTHER") {
			show_status_button( "scene_on_"+key,  scene_status[key] );
			show_status_button( "scene_off_"+key, "" );
			}
		if (scene_status[key] == "OFF") {
			show_status_button( "scene_off_"+key,  scene_status[key] );
			show_status_button( "scene_on_"+key, "" );

			// -> loop to deactivate all makro buttons?!
			}
		}

	// check audio status and show in navigation bar
	var power = devices[main_audio]["status"]["power"].toUpperCase();
	if (devices[main_audio]["status"]["mute"].toUpperCase() == "ON" || power.includes("OFF") || devices[main_audio]["status"]["vol"] == 0) {
		document.getElementById("audio1").style.display = "block";
		document.getElementById("audio2").style.display = "none";
		vol_color = "gray";
		}
	else {
		document.getElementById("audio1").style.display = "none";
		document.getElementById("audio2").style.display = "block";
		}
		
	// check volume and show in navigation bar
	vol_str = show_volume( main_audio_vol, main_audio_max, vol_color );
	document.getElementById("audio3").innerHTML = vol_str;

	// check status for displays
	for (var key in devices) {
		if (devices[key]["status"] && devices[key]["display"]) {
		        display = devices[key]["display"];
			for (var dkey in display) {
				var vkey    = display[dkey];
				var element  = document.getElementById("display_" + key + "_" + vkey);
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status  = devices[key]["status"][vkey];
				
				if (devices[key]["values"] && devices[key]["values"][vkey] && vkey == "vol") {
					if (devices[key]["values"][vkey]["max"]) { status = show_volume( devices[key]["status"][vkey], devices[key]["values"][vkey]["max"], vol_color2, novol_color ) + " &nbsp; ["+devices[key]["status"][vkey]+"]"; }
					}
				
				if (element)  { element.innerHTML  = status; }
				if (element2) { element2.innerHTML = status; }
				}
			}
		if (devices[key]["status"] && devices[key]["query_list"]) {
		        display = devices[key]["query_list"];
			for (var i=0; i<display.length; i++) {
				var vkey    = display[i];
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status  = devices[key]["status"][vkey];		
				if (element2) { element2.innerHTML = status; }
				}
			}
		}	
	}
	
function show_volume (volume, maximum, vol_color, novol_color="") {

	var volume  = Math.round( volume * 20 / maximum );
	var vol_str = "<font color='" + vol_color + "'>";
	for (var i=0; i<volume; i++) { vol_str += "I"; }
	vol_str += "</font>";
	if (novol_color != "") { vol_str += "<font color='" + novol_color + "'>"; }
	for (var i=0; i<20-volume; i++) { vol_str += "I"; }
	return vol_str;
	}

function check_status_dev(device) {

	loadRemote("list");
	var Status = dataAll["STATUS"]["devices"];

	return Status[device];
	}

//--------------------------------
// Refresh Status every x seconds ...
//--------------------------------

//setInterval(function(){check_status()}, 1000 * reloadInterval);

//--------------------------------

