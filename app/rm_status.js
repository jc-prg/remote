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
	if (status == "ON")		{color = "darkgreen";}
	else if (status == "OFF")	{color = "darkred";}
	else if (status == "OTHER")	{color = "purple";}
	else				{color = "black";}

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
		if (active) 	{ document.getElementById(id).style.backgroundColor = "#000000"; }
		else 		{ document.getElementById(id).style.backgroundColor = "#666666"; }
		}
	}

// check if device status is off
function check_status_inactive(device="") {

	var dev    = dataAll["DATA"]["devices"];
	var filter = false;

	// rm3remotes.active_name
	// rm3remotes.active_type
	// rm3remotes.active_buttons

	var device_status  = dataAll["STATUS"]["devices"];  // !!!!!!!!!!!!!! check based on new infos dataAll["DATA"]["devices"][device"]["STATUS"]
	var scene_status   = {};

	if (deactivateButton)	{ return; }
	if (device != "")	{ filter = "true"; }

	// get scene status from devices status and definition (see check_status) -> move to rm_remote.js
	for (var key in dataAll["DATA"]["scenes"]) {

		var required = dataAll["DATA"]["scenes"][key]["devices"];
		var dev_on   = 0;

		for (var i=0;i<required.length;i++) {
			if (device_status[required[i]] == "ON") {
				dev_on += 1;
				}
			//console.log(required[i]+":"+device_status[required[i]]);
			}

		if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
		else if (dev_on > 0)		{ scene_status[key] = "OTHER"; }
		else				{ scene_status[key] = "OFF"; }

		//console.log(key+":"+scene_status[key]+" - "+dev_on+"/"+required.length);
		}


	// deactive makro_buttons (check scene status, deactivate all buttons from list starting with "makro")
	if (rm3remotes.active_type == "scene" && scene_status[rm3remotes.active_name] == "OFF") {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") {set_button_status(button1[0]+"_"+button1[1],false);}
			}
		}
	else {
		for (var i=0; i<rm3remotes.active_buttons.length; i++) {
			var button1 = rm3remotes.active_buttons[i].split("_");
			if (button1[0] == "makro") {set_button_status(button1[0]+"_"+button1[1],true);}
			}
		}


	// check device status - if OFF change color of buttons to gray
	for (var key in device_status) {

		var dev_stat = key.split("_");

		// if filter set to only one device -> do not check other
		if (filter == false || device == dev_stat[0]) {

			// if device off -> set all buttons off
			if (dev_stat.length == 1 && device_status[key] == "OFF" && dev_stat.includes(dev)) {

				var buttons = Object.keys(dev[dev_stat[0]]["buttons"]); // -> button_list
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						set_button_status(dev_stat[0]+"_"+buttons[i],false);
						}
				}
			}
			// if device on -> set all buttons on
			else if (dev_stat.length == 1 && dev[dev_stat[0]] && typeof dev[dev_stat[0]]["buttons"] == "object") {
				var buttons = Object.keys(dev[dev_stat[0]]["buttons"]); // -> button_list
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						set_button_status(dev_stat[0]+"_"+buttons[i],true);
						}
					}
				}
			}

		}
	}

//-----------------------------------------

function check_status(data={}) {

	if (deactivateButton)	{ return; }

        var devices        = dataAll["DATA"]["devices"];
	var device_status  = dataAll["STATUS"]["devices"];
	var device_audio   = status_mute.split("_");            // ??? from rm_config.js -> to be set to config "main-audio = yes"; incl status_vol_max
	var scene_status   = {};
	var vol_color	   = "white";
	var vol_color2	   = "yellow";
	var novol_color    = "lightblue";

// ????????????????

	// if data -> callback of sendCmd (ON/OFF) -> check_status_inactive()
	if ("Device" in data)	{ check_status_inactive(data["Device"]); }
	else			{ check_status_inactive(); }

	// get scene status from devices status and definition
	for (var key in dataAll["DATA"]["scenes"]) {

		var required = dataAll["DATA"]["scenes"][key]["devices"];
		var dev_on   = 0;

		for (var i=0;i<required.length;i++) {
			if (devices[required[i]]["status"]["power"] == "ON") {
				dev_on += 1;
				}
			//console.log(required[i]+":"+device_status[required[i]]);
			}

		if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
		else if (dev_on > 0)		{ scene_status[key] = "OTHER"; }
		else				{ scene_status[key] = "OFF"; }

		//console.log(key+":"+scene_status[key]+" - "+dev_on+"/"+required.length);
		}

	// check device status and change color of power buttons / main menu buttons device
	for (var key1 in devices) {
	  for (var key2 in devices[key1]["status"]) {
	  
	        key = key1;
	        if (key2 != "power") { key += "_"+key2; }
	        
	        //console.error("TEST "+key1+"_"+key2+" = "+devices[key1]["status"][key2]);

		if (typeof devices[key1]["status"][key2] == "string")	{ check_button = devices[key1]["status"][key2].toUpperCase() }
		else							{ check_button = devices[key1]["status"][key2]; }

		show_status_button( "device_" + key, check_button ); // main menu button
		show_status_button( key + "_on-off", check_button ); // on-off device button
			
		if (typeof check_button == "string" && check_button == "ON") {
			show_status_button( key + "_on",  check_button );
			show_status_button( key + "_off", "" );
			}
		if (typeof check_button == "string" && check_button == "OFF") {
			show_status_button( key + "_off", check_button );
			show_status_button( key + "_on",  "" );
			}	

		if (typeof check_button == "object" && check_button.indexOf("off") >= 0) {
			show_status_button( key + "_off", "OFF" );
			show_status_button( key + "_on",  "" );
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
	if (devices[device_audio[0]]["status"]["mute"] == "ON" || devices[device_audio[0]]["status"]["power"] == "OFF" || devices[device_audio[0]]["status"]["vol"] == 0) {
		document.getElementById("audio1").style.display = "block";
		document.getElementById("audio2").style.display = "none";
		vol_color = "gray";
		}
	else {
		document.getElementById("audio1").style.display = "none";
		document.getElementById("audio2").style.display = "block";
		}
		
	// check status for displays
	for (var key in devices) {
		if (devices[key]["status"] && devices[key]["display"]) {
		        display = devices[key]["display"];
			for (var dkey in display) {
				var vkey    = display[dkey];
				var element = document.getElementById("display_" + key + "_" + vkey);
				var status  = devices[key]["status"][vkey];
				
				if (devices[key]["values"] && devices[key]["values"][vkey] && vkey == "vol") {
					if (devices[key]["values"][vkey]["max"]) { status = show_volume( devices[key]["status"][vkey], devices[key]["values"][vkey]["max"], vol_color2, novol_color ) + " &nbsp; ["+devices[key]["status"][vkey]+"]"; }
					}
				
				if (element) { element.innerHTML = status; }
				}
			}
		}

	// check volume and show in navigation bar
	vol_str = show_volume( devices[device_audio[0]]["status"]["vol"], status_vol_max, vol_color );
	document.getElementById("audio3").innerHTML = vol_str;

	//alert(test);
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

