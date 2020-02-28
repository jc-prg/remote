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

// slider for volume control

function slider ( name, container, callOnChange ) {

	this.appName      = name;
	this.appContainer = container;
	this.callOnChange = callOnChange;
	

	this.init    = function( data ) {
		main_audio = data["CONFIG"]["main-audio"];
		min        = data["DATA"]["devices"][main_audio]["values"]["vol"]["min"];
		max        = data["DATA"]["devices"][main_audio]["values"]["vol"]["max"];		
		label      = data["DATA"]["devices"][main_audio]["label"];		
		name	   = this.appName;
	
		this.sliderHTML   =  "<div id=\""+name+"_container\" class=\"slidecontainer\" style=\"visibility:hidden\">";
  		this.sliderHTML   += "<input type=\"range\" min=\""+min+"\" max=\""+max+"\" value=\"50\" class=\"slider\" id=\""+name+"\">";
  		this.sliderHTML   += "<br/><div id=\""+name+"_value\" class=\"slidervalue\">xx</div>";
  		this.sliderHTML   += "<div  id=\""+name+"_label\" class=\"sliderlabel\">"+label+"</div>";
		this.sliderHTML   += "</div>";
	
		this.container    		= document.getElementById(this.appContainer);
		this.container.innerHTML	= this.sliderHTML;

		this.slider       = document.getElementById(name);
		this.slider_value = document.getElementById(name+"_value");
		this.slider_cont  = document.getElementById(name+"_container");
		this.slider_label = document.getElementById(name+"_label");

		this.slider_value.innerHTML	= this.slider.value;
		this.slider_label.innerHTML	= label + " (" + main_audio + ")";
	
		this.appMainAudio 	= main_audio;
		this.appMainAudioLabel	= label;
		this.audioMin     	= min;
		this.audioMax     	= max;

		this.slider.oninput = function( ) {
			rm3slider.slider_value.innerHTML	= rm3slider.slider.value;
			//this.slider_value.innerHTML 		= this.slider.value;
		
			vol_color = "white";
			vol_str   = show_volume( rm3slider.slider.value, rm3slider.audioMax, vol_color );
			document.getElementById("audio3").innerHTML = vol_str;
			}
		
		this.slider.onmouseup = function() {
			//this.callOnChange( this.slider.value );
			rm3slider.callOnChange( rm3slider.appMainAudio, rm3slider.slider.value );
			}
		
		this.slider.ontouchend = function() {
			//this.callOnChange( this.slider.value );
			rm3slider.callOnChange( rm3slider.appMainAudio, rm3slider.slider.value );
			}

		}
				
	this.set_value = function( value ) {
		this.slider.value = value;
		this.slider_value.innerHTML = value;
		}
		
	this.show_hide = function() {
		if (this.slider_cont.style.visibility == "hidden") 	{ this.slider_cont.style.visibility = "visible"; }
		else							{ this.slider_cont.style.visibility = "hidden"; }
		}
		
	}

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
}

slider.onmouseup = function() {
   console.log("Set Volume: " + slider.value);  
}

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

//-----------------------------------------

function show_status( color, wait ) {
	showRestStatus( color );
	setTimeout(function(){ showRestStatus("gray"); }, wait*1000);
	}
	
//-----------------------------------------

function show_volume( volume, maximum, vol_color, novol_color="" ) {

	var volume  = Math.round( volume * 20 / maximum );
	var vol_str = "<font color='" + vol_color + "'>";
	for (var i=0; i<volume; i++) { vol_str += "I"; }
	vol_str += "</font>";
	if (novol_color != "") { vol_str += "<font color='" + novol_color + "'>"; }
	for (var i=0; i<20-volume; i++) { vol_str += "I"; }
	return vol_str;
	}

//-----------------------------------------
// check if device status is off -> change color to gray
//-----------------------------------------

// change button color
function set_button_status(id,active) {
	if (document.getElementById(id)) {
		if (active) 	{ document.getElementById(id).style.backgroundColor = ""; } 			// reset to CSS color
		else 		{ document.getElementById(id).style.backgroundColor = color_button_inactive; }	// color defined in rm_config.js
		}
	}
	
//-----------------------------------------
// check if device status
//-----------------------------------------
	
// check if device status is off
function check_status_inactive(data) {

	if (deactivateButton)	{ return; }

	if (!data["DATA"]) {
		console.error("check_status_inactive: data not loaded.");
		show_status("red", showButtonTime);
		return;
		}

	var device         = data["DATA"]["devices"];
	var device_status  = {};
	var filter         = false;
	var scene_status   = {};

	// get scene status from devices status and definition (see check_status) -> move to rm_remote.js
	for (var key in data["DATA"]["scenes"]) {
		if (data["DATA"]["scenes"][key]["devices"]) {

			var required = data["DATA"]["scenes"][key]["devices"];
			var all_dev  = Object.keys(data["DATA"]["devices"]);
			var dev_on   = 0;
		
			for (var i=0;i<all_dev.length;i++)  { device_status[all_dev[i]] = device[all_dev[i]]["status"]["power"].toUpperCase();  }
			for (var i=0;i<required.length;i++) { if (device_status[required[i]] == "ON") { dev_on += 1; } }

			if (dev_on == required.length) 	{ scene_status[key] = "ON"; }
			else if (dev_on > 0)		{ scene_status[key] = "OTHER"; }
			else				{ scene_status[key] = "OFF"; }
			//console.debug(key + " - on:" + dev_on + " / off:" + required.length + " / " + scene_status[key]);
			}
		else {
			console.error("ERROR check_status_inactive");
			console.error(data["DATA"]["scenes"][key]);
			required = [];
			}
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
			if (device[key]["button_list"] && device_status[key] != "ON") {
				var buttons = device[key]["button_list"];
				for (var i=0; i<buttons.length; i++) {
					if (buttons[i] != "red" && buttons[i] != "blue" && buttons[i] != "yellow" && buttons[i] != "green"
						&& buttons[i] != "on" && buttons[i] != "off" && buttons[i] != "on-off") {
						set_button_status(key+"_"+buttons[i],false);
						}
				}
			}
			// if device on -> set all buttons on
			else if (device[key] && typeof device[key]["button_list"] == "object") {
				var buttons = device[key]["button_list"];
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

function check_status_load() {	rm3app.requestAPI("GET",["list"], "", check_status, "" ); }
function check_status(data={}) {

	if (deactivateButton)			{ return; }     // if manual mode <- deactivateButton == true
	if (!data["DATA"]) {
		console.error("check_status: data not loaded.");
		show_status("red", showButtonTime);
		return;
		}
			
        var devices        = data["DATA"]["devices"];
	var scene_status   = {};
	var device_status  = {}

	// get data from main audio device
	var main_audio      = data["CONFIG"]["main-audio"];  // get main audio device from file
	var main_audio_max  = "";
	var main_audio_vol  = devices[main_audio]["status"]["vol"];
	var main_audio_mute = devices[main_audio]["status"]["mute"].toUpperCase();
	if (devices[main_audio] && devices[main_audio]["values"]) {
		main_audio_max  = devices[main_audio]["values"]["vol"]["max"];
		}

	// set colors
	var vol_color	   = "white";
	var vol_color2	   = "yellow";
	var novol_color    = "darkgray";
	
	// if data -> callback of sendCmd (ON/OFF) -> check_status_inactive()
	check_status_inactive(data);

	// get scene status from devices status and definition (see check_status) -> move to rm_remote.js
	for (var key in data["DATA"]["scenes"]) {

		var dev_on   = 0;
		var required = data["DATA"]["scenes"][key]["devices"];
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
				show_status_button( key + "_on-off", "OFF" ); // on-o:16
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
	rm3slider.set_value( main_audio_vol );
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
					if (devices[key]["values"][vkey]["max"]) { 
							status = show_volume( devices[key]["status"][vkey], devices[key]["values"][vkey]["max"], vol_color2, novol_color ) + " &nbsp; ["+devices[key]["status"][vkey]+"]"; 
							}
					}
				
				if (element)  { element.innerHTML  = status; }
				if (element2) { element2.innerHTML = status.replace(/,/g,"; "); }
				}
			}
		if (devices[key]["status"] && devices[key]["query_list"]) {
		        display = devices[key]["query_list"];
			for (var i=0; i<display.length; i++) {
				var vkey    = display[i];
				var element2 = document.getElementById("display_full_" + key + "_" + vkey);
				var status  = devices[key]["status"][vkey];		
				if (element2) { element2.innerHTML = status.replace(/,/g,", "); }
				}
			}
		}	
	}
	



//--------------------------------
// EOF
