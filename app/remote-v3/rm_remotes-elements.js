//--------------------------------
// jc://remote/
//--------------------------------

function rmRemoteBasic(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	this.input_width    = "100px";

	this.logging        = new jcLogging(this.app_name);

	// input for text
	this.input	            = function (id,value="")   {

	    return "<div style='width:" + this.input_width + ";margin:0px;'><input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'></div>";
	    }

	// select for different data 
	this.select	            = function (id,title,data,onchange="",selected_value="",sort=false, change_key_value=false) {

	            if (change_key_value) {
	                var new_data = {};
	                for (key in data) {
	                    new_data[data[key]] = key;
	                    }
	                data = new_data;
	                }

                var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
                item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
                keys      = Object.keys(data);
                if (sort) { keys.sort(); }
                for (var i=0;i<keys.length;i++) {
                        var key = keys[i];
                        var selected = "";
                        if (selected_value == key) { selected = "selected"; }
                        if (key != "default") {
                                item += "<option value=\"" + key + "\" "+selected+">" + data[key] + "</option>";
                        }       }
                item     += "</select>";
                return item;
                }

	this.select_array       = function (id,title,data,onchange="",selected_value="") {
	            var control = {};
                var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
                item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
                data.forEach(function(key) {
                        var selected = "";
                        if (selected_value == key) { selected = "selected"; }
                        if (key != "default" && !control[key]) {
                                item += "<option value=\"" + key + "\" "+selected+">" + key + "</option>";
                                control[key] = 1;
                                }
                        });
                item     += "</select>";
                return item;
                }

    // write line with text ...
	this.line	            = function (text="") {
          	var remote = "";
		remote += "<div class='remote-line'><hr/>";
		if (text != "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}
		
	this.edit_line	        = function (text="") {
          	var remote = "";
		remote += "<div style='border:1px solid;height:1px;margin:5px;margin-top:10px;padding:0px;'>";
		if (text != "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}
		
	this.container_open = {};
		
	this.container           = function(id,title,text="",open=true) {
	
		if (this.container_open[id] != undefined)	{ open = this.container_open[id]; }
		else						{ this.container_open[id] = open; }
	
		var onclick  = ' onclick="'+this.app_name+'.container_showHide(\''+id+'\')"; '
		var display  = "";
		var link     = "&minus;";
		var ct       = "";
		
		if (open == false) {
			link    = "+";
			display = "display:none;";
			}
		
		ct  += "<div id='"+id+"_header' class='remote_group_header' "+onclick+">[<span id='"+id+"_link'>"+link+"</span>]&nbsp;&nbsp;<b>"+title+"</b></div>";	
		ct  += "<div id='"+id+"_status' style='display:none;'>"+open+"</div>";
		ct  += "<div id='"+id+"_body'   class='remote_group' style='"+display+"'>";	
		ct  += text;	
		ct  += "</div>";	
		
		return ct;
		}

	this.container_showHide = function( id, open="" ) {
		status = document.getElementById(id+"_status").innerHTML;
		if (status == "true") { 
			document.getElementById(id+"_body").style.display = "none"; 
			document.getElementById(id+"_status").innerHTML   = "false";
			document.getElementById(id+"_link").innerHTML     = "+";
			this.container_open[id] = false;
			}
		else {
			document.getElementById(id+"_body").style.display = "block"; 
			document.getElementById(id+"_status").innerHTML   = "true";
			document.getElementById(id+"_link").innerHTML     = "&minus;";
			this.container_open[id] = true;
			}
		}
	}
	

function rmRemoteTable(name) {

	this.app_name       = name;

	this.start	= function (width="100%") {

		return "<table border=\"0\" width=\""+width+"\">";
		}
		
	this.row	= function (td1,td2="")  { 
		if (td1 == "start")     { return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 == "end")  { return "</table>"; }
		else if (td2 == false)  { return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else                    { return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}

	this.line	= function (text="") {

		return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
		}

	this.end	= function () {

		return "</table>";
		}
	}
	

function rmRemoteButtons(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	
	this.logging        = new jcLogging(this.app_name);
	this.tooltip        = new jcTooltip(this.app_name + ".tooltip");
	this.keyboard       = new rmRemoteKeyboard(name+".keyboard");	// rm_remotes-keyboard.js
	
	// set default button size
	this.default_size	= function () {	
		this.width	= "";
		this.height	= "";
		this.margin	= "";
		}
	this.default_size();

	// default buttons
	this.default         = function (id, label, style, script_apiCommandSend, disabled="", btnstyle="" ){
	
        var onContext  = "";
        var onClick    = "";

        if (Array.isArray(script_apiCommandSend)) {
                var test   = "onmousedown_left_right(event,'alert(#left#);','alert(#right#);');"
                onClick    = "onmousedown_left_right(event,\"" + script_apiCommandSend[0].replaceAll("\"","#") +
                             "\",\"" + script_apiCommandSend[1].replaceAll("\"","#") + "\");";
                onClick    = "onmousedown='"+onClick+"'";
                onContext  = "oncontextmenu=\"return false;\"";
                }
        else if (script_apiCommandSend != "") {
            onClick    = "onclick='" + script_apiCommandSend + "'";
            onClick    = onClick.replaceAll("##", "{{!!}}");
            onClick    = onClick.replaceAll("#", "\"");
            onClick    = onClick.replaceAll("{{!!}}", "#");
            }

        if (!isNaN(label)) { label = "<big>" + label + "</big>"; }
        if (style != "")   { style = " " + style; }

        var button = "<button id='" + id.toLowerCase() + "' class='rm-button" + style + "' " + btnstyle + " " +
                     onClick + " " + onContext + " " + disabled + " >" + label + "</button>"; // style='float:left;'
        return button;
		}

	// default with size from values
	this.sized           = function (id, label, style, script_apiCommandSend, disabled="") {
		var btnstyle	= "";
	        if (this.width  != "") { btnstyle += "width:" + this.width + ";max-width:" + this.width + ";"; }
	        if (this.height != "") { btnstyle += "height:" + this.height + ";max-height:" + this.height + ";"; }
	        if (btnstyle    != "") { btnstyle  = "style='" + btnstyle + "'"; }
	        
	        return this.default(id, label, style, script_apiCommandSend, disabled, btnstyle);
		}
	        
	// button edit mode		
	this.edit            = function (onclick,label,disabled="") {
		var style = "";
		if (this.width != "")  { style += "width:" + this.width + ";"; }
		if (this.height != "") { style += "height:"+this.height+";"; }
		if (this.margin != "") { style += "margin:"+this.margin+";"; }

        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

	// create button for single command
	this.device          = function (id, label, device, style, cmd, disabled ) {

		var label2 	= this.image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = 'apiCommandSend("'+cmd+'","","","'+device+'");';
			}
		return this.default( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command
	this.device_keyboard = function (id, label, device, style, cmd, disabled ) {

		var label2 	= this.image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = this.keyboard.toggle_cmd();
			}
		return this.default( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command -> if no command assigned yet to record command for button
	this.device_add      = function (id, label, device, style, cmd, disabled ) {

        var device_button	= cmd.split("_");
		var label2		= this.image( label, style );
		if (label == ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }
	        
        var button = this.default( id, label2[0], label2[1], 'apiCommandRecord("'+device_button[0]+'","'+device_button[1]+'");', disabled );
		return button;		
		}		

	// create button for multiple commands (macro)
	this.macro           = function (id, label, scene, style, macro, disabled ) {
        if (macro) {
            var d = this.image( label, style );
            var macro_string = "";
            var macro_wait = "";

            for (var i=0; i<macro.length; i++) {

                if (isNaN(macro[i]) && macro[i].indexOf("WAIT") > -1) {
                    var wait = macro[i].split("-");
                    macro_wait = 'appMsg.wait_time("'+lang("MACRO_PLEASE_WAIT")+'", '+wait[1]+');';
                    }
                else {
                    macro_string = macro_string + macro[i] + "::";
                    }
                }
            var b = this.default( id, d[0], d[1], 'apiMacroSend("'+macro_string+'","'+scene+'");'+macro_wait, disabled );
            this.logging.debug("button_macro - "+b);
            return b;
            }
        else { return this.default( id, label, style+" notfound", "", "disabled" ); }
        }
		
	// create button for multiple commands (macro)
	this.btn_group           = function (id, label, scene, style, group, disabled ) {
        if (group) {
            var d = this.image( label, style );
            var b = this.default( id, d[0], d[1], 'apiGroupSend("'+group.join("_")+'","'+scene+'");', disabled );
            this.logging.debug("button_macro - "+b);
            return b;
            }
        else { return this.default( id, label, style+" notfound", "", "disabled" ); }
        }

	// create button for channel (macro)
	this.channel         = function (id, label, scene, macro, style, disabled="") {
    		var macro_string = "";
		for (var i=0; i<macro.length; i++) { macro_string = macro_string + macro[i] + "::"; }

		this.logging.debug(label+" - "+macro_string);
		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:apiMacroSend('" + macro_string + "','"+scene+"','"+label+"');\">" + label + "</button>";
		}

	// check if image exists for button
	this.image           = function (label,style) {

		// set vars
        var button_color = this.data["CONFIG"]["elements"]["button_colors"];  // definition of button color
		var button_img2  = this.data["CONFIG"]["elements"]["button_images"];  // definition of images for buttons (without path and ".png")

		// if image available set image
		var button_img   = [];
		for (var key in button_img2) { button_img[key] = rmImage(button_img2[key]); }

		// check label
        	if (label in button_color)    { style = style + " bg" + label + " "; }
        	if (label in button_img && showImg ) { label = button_img[label]; }

        	return [label, style];
		}

	}


function rmRemoteDisplays(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;

	this.logging        = new jcLogging(this.app_name);

	// create display
	//--------------------------------
	// show display with information
	this.default		= function (id, device, rm_type="devices", style="", display_data={}) {

	    this.check_connection_remote = function(device) {

            var error         = "";
            var power_device  = "";
	        var connected     = "";

            var remote_data	  = this.data["CONFIG"]["devices"][device]["remote"];
            var status_data	  = this.data["STATUS"]["devices"][device];
            var connection_1  = this.data["STATUS"]["connections"][status_data["api"].split("_")[0]];
            var connection_2  = connection_1["api_devices"][status_data["api"].split("_")[1]];

            if (!status_data)                   { error = "Error building display: no status data for " + device + " (" + type + ")"; }
            else if (!status_data["power"])     { error = "Error building display: no status_power data for " + device + " (" + type + ")"; status_data["power"] = "ERROR"; }
            else if (!remote_data)              { error = "Error building display: no remote definition for " + device + " (" + type + ")"; }
            else if (!connection_1)             { error = "Error building display: no API definition for " + status_data["api"].split("_")[0]; }
            else if (!connection_2)             { error = "Error building display: no API device definition for " + status_data["api"]; }
            if (error != "")                    { console.error(error); }

            if ("power" in connection_2) { var connection_3  = connection_2["power"]; }
            var connection_4  = this.data["STATUS"]["devices"][device]["api-status"].toLowerCase();

            var dev_name  = device;
            var dev_infos = this.data["CONFIG"]["devices"][device];
            if (dev_infos)  { dev_name = dev_infos["settings"]["label"]; }

            if (!connection_1["active"])                                    { connected = "API " + status_data["api"].split("_")[0] + " disabled."; }
            else if (!connection_2["active"])                               { connected = "API Device " + status_data["api"] + " disabled."; }
            else if (connection_3 != "ON")                                  { connected = "API Device " + status_data["api"] + " OFF."; }
            else if (connection_2["connect"].toLowerCase() != "connected")  { connected = "API Device " + status_data["api"] + " not connected."; }
            else if (connection_4.toLowerCase() != "connected")             { connected = "Device " + dev_name + " not connected."; }
            else                                                            { connected = "connected"; }

            return connected;
	        }
	    this.check_connection_scene  = function(scene) {

            var connected               = "";
	        var scene_data              = this.data["STATUS"]["scenes"][scene];
	        var scene_power             = this.data["CONFIG"]["scenes"][scene]["remote"]["power_status"];
	        var scene_switch            = "power device";
	        var device_status           = this.data["STATUS"]["devices"];
	        var device_config           = this.data["CONFIG"]["devices"];
	        var scene_devices           = scene_data.length;
	        var connected_devices       = 0;
	        var not_connected           = [];
	        var not_connected_details   = [];

            if (device_status[scene_power.split("_")[0]]) {
                device_field = scene_power.split("_");
                scene_power  = device_status[device_field[0]][device_field[1]];
                scene_switch = device_config[device_field[0]]["settings"]["label"];
                }
            else {
                scene_power  = "N/A";
                }

            console.info("SCENE STATUS - " + scene + " --- "+ scene_power);

	        for (var i=0;i<scene_devices;i++) {
                var device  = scene_data[i];
                var connect = this.check_connection_remote(device);
                if (connect == "connected")  { connected_devices += 1; }
                else {
                    var dev_infos = this.data["CONFIG"]["devices"][device];
                    if (dev_infos)  { not_connected.push(dev_infos["settings"]["label"]); }
                    else            { not_connected.push(device); }
                    not_connected_details.push(connect);
                    }
	            }

	        if (connected_devices == scene_devices)         { connected = lang("CONNECTED"); }
	        else if (scene_power.toUpperCase() == "OFF")    { connected = lang("POWER_DEVICE_OFF", [scene_switch]); }
	        else if (connected_devices == 0)                { connected = lang("NO_DEVICE_CONNECTED"); }
	        else                                            { connected = lang("DEVICES_NOT_CONNECTED")+":<br/>" + not_connected.join(", "); }
	        return [connected, scene_power];
	        }

		if (!this.data["CONFIG"][rm_type]) {
			this.logging.error(this.app_name+".display() - type not supported ("+rm_type+")");
			return;
			}

        var text          = "";
        var status        = "";
        var remote_data	  = this.data["CONFIG"][rm_type][device]["remote"];
        var status_data	  = this.data["STATUS"][rm_type][device];

        // check connection
		if (rm_type == "devices")  { var connected = this.check_connection_remote(device); }
		else                       {
		    var connected   = this.check_connection_scene(device);
		    var scene_power = connected[1];
		    connected       = connected[0];
		    // console.error(scene_power); // ---------------------------------------------- !!!
		    }

        // check display definition
		if (display_data != {})             {}
		else if (remote_data["display"])    { display_data          = remote_data["display"]; }
		else                                { display_data["Error"] = "No display defined"; }

        // create link for details (for scenes not defined yet)
		if (rm_type == "devices")      { var onclick = "onclick=\"" + this.app_name + ".alert('"+id+"','"+device+"','"+rm_type+"','##STYLE##');\""; }
		else                        { var onclick = "disabled"; }

        var display_start = "<button id=\"display_"+device+"_##STATUS##\" class=\"display ##STYLE##\" style=\"display:##DISPLAY##\" "+onclick+">";
        var display_end   = "</button>";

        // set overarching status to activate the right display
		if (this.edit_mode)                                                     { status = "EDIT_MODE"; }
		else if (rm_type == "scenes" && scene_power == "OFF")                   { status = "POWER_OFF"; }
		else if (rm_type == "scenes")                                           { status = "ON"; }
		else if (connected.indexOf("off") > -1)                                 { status = "OFF"; }
		else if (connected != "connected")                                      { status = "ERROR"; }
		else if (status_data["power"].toUpperCase().indexOf("ON") >= 0)         { status = "ON"; }
		else if (status_data["power"].toUpperCase().indexOf("OFF") >= 0)        { status = "OFF" }
		else                                                                    { status = "ERROR";  }


        if (this.edit_mode) {
            // display if EDIT_MODE
            text += display_start;
            text  = text.replace( /##STATUS##/g, "EDIT_MODE" );
            text  = text.replace( /##STYLE##/g, style + " display_on edit" );
            if (this.edit_mode) { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                { text  = text.replace( /##DISPLAY##/g, "none" ); }
            for (var key in display_data) {
                var label = "<data class='display-label'>"+key+":</data>";
                var input = "<data class='display-input-shorten' id='display_"+device+"_"+display_data[key]+"_edit'>{"+display_data[key]+"}</data>";
                text += "<div class='display-element "+style+"'>"+label+input+"</div>";
                }
            text += display_end;
            }

        else {
            // display if ERROR
            text += display_start;
            text  = text.replace( /##STATUS##/g, "ERROR" );
            text  = text.replace( /##STYLE##/g, style + " display_error" );
            if (status == "ERROR" && !this.edit_mode)       { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                                            { text  = text.replace( /##DISPLAY##/g, "none" ); }
            if (status_data["power"] == undefined)          { status_data["power"] = "N/A"; }
            text += "<center><b>Connection Error</b></center>"; //<br/>";
            text += "<center><i><text id='display_ERROR_info_"+device+"'>"+connected+"</text></i></center>";
            text += display_end;

            // display if ON
            text += display_start;
            text  = text.replace( /##STATUS##/g, "ON" );
            text  = text.replace( /##STYLE##/g, style + " display_on" );
            if (status == "ON" && !this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                                    { text  = text.replace( /##DISPLAY##/g, "none" ); }

            for (var key in display_data) {
                var input_id = "";
                if (display_data[key].indexOf("_") >= 0)    { input_id = 'display_' + display_data[key]; }
                else                                        { input_id = 'display_' + device + '_' + display_data[key]; }
                var label    = "<data class='display-label'>"+key+":</data>";
                var input    = "<data class='display-input' id='"+input_id+"'>no data</data>";
                text += "<div class='display-element "+style+"'>"+label+input+"</div>";
                }
            text += display_end;

            // display if MANUAL_MODE
            text += display_start;
            text  = text.replace( /##STATUS##/g, "MANUAL" );
            text  = text.replace( /##STYLE##/g, style + " display_manual" );
            if (rm3settings.manual_mode)    { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                            { text  = text.replace( /##DISPLAY##/g, "none" ); }
            text += "<center>MANUAL MODE<br/><text id='display_MANUAL_info_"+device+"'><i>no information available</i></text></center>";
            text += display_end;

            // display if OFF
            text += display_start;
            text  = text.replace( /##STATUS##/g, "OFF" );
            text  = text.replace( /##STYLE##/g, style + " display_off" );
            if (status == "OFF"  && !this.edit_mode)    { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                                        { text  = text.replace( /##DISPLAY##/g, "none" ); }
            text += "<center><b>Device Off</b><br/><i><text id='display_OFF_info_"+device+"'></text></i></center>";
            text += display_end;

            // display if OFF
            text += display_start;
            text  = text.replace( /##STATUS##/g, "POWER_OFF" );
            text  = text.replace( /##STYLE##/g, style + " display_off" );
            if (status == "POWER_OFF"  && !this.edit_mode)    { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                                              { text  = text.replace( /##DISPLAY##/g, "none" ); }
            text += "<center><b>Power Off</b><br/><i><text id='display_POWER_OFF_info_"+device+"'>"+lang("POWER_DEVICE_OFF", [""])+"</text></i></center>";
            text += display_end;
            }

        return text;
        }

	this.sizes		= function () {
		var sizes = {
			"small" : "Small",
			"middle" : "Middle",
			"big"  : "Big",
			"h1w2" : "1x height / 2x wide",
			"h1w4" : "1x height / 4x wide",
			"h2w2" : "2x height / 2x wide",
			"h2w3" : "2x height / 3x wide",
			"h2w4" : "2x height / 4x wide",
			"h3w2" : "3x height / 2x wide",
			"h4w2" : "4x height / 2x wide"
			}
		return sizes;
		}


        // display all information
	this.alert		= function (id, device, type="", style="" ) {

		var display_data = [];
      		var text  = "Device Information: "+device +"<hr/>";
      		text  += "<div style='width:100%;height:400px;overflow-y:scroll;'>";

		if (type != "devices") {

			if (!this.data["CONFIG"][type][device]["remote"]["display-detail"]) {

				this.logging.warn(this.app_name+".display_alert() not implemented for this type and device ("+type+"/"+device+")");
				this.logging.warn(this.data["CONFIG"][type][device]);
				return;
				}
			else {
				display_data = Object.keys(this.data["CONFIG"][type][device]["remote"]["display-detail"]);
				this.logging.warn(display_data);
				}
			}

		else {
			var power = this.data["STATUS"][type][device];
			if (type != "devices") { power = {}; }
			var queries = this.data["CONFIG"]["devices"][device]["commands"]["definition"];
			if (this.data["CONFIG"]["devices"][device] && queries)	{ display_data = Object.keys(queries); }
			else								{ display_data = ["ERROR","No display defined"]; }

        		this.logging.debug(device,"debug");
        		this.logging.debug(power,"debug");
        		this.logging.debug(queries,"debug");
        		this.logging.debug(display_data,"debug");

			text  += "<center id='display_full_"+device+"_power'>"+power["api-status"]+": "+power["power"] + "</center><hr/>";
			}

      		text  += this.tab_row("start","100%");

        	for (var i=0; i<display_data.length; i++) {

      			if (display_data[i] != "power" && display_data[i].substring && display_data[i].substring(0,3) != "api") { // || display_data[i].indexOf("api") != 0)) {
	        		var label = "<data class='display-label-dialog'>"+display_data[i]+":</data>";
				var input = use_color("<data class='display-detail-dialog' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>", "VALUE");
		        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
		        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
		        	}
	        	}
        	text  += this.tab_row("<hr/>",false);

      		text  += this.tab_row("<data class='display-label-dialog'>API:</data>",             use_color("<data class='display-detail' id='display_full_"+device+"_api'>no data</data>", "VALUE") );
      		text  += this.tab_row("<data class='display-label-dialog'>Status:</data>",          use_color("<data class='display-detail' id='display_full_"+device+"_api-status'>no data</data>", "VALUE") );
      		text  += this.tab_row("<data class='display-label-dialog'>Last&nbsp;Send:</data>",  use_color("<data class='display-detail' id='display_full_"+device+"_api-last-send'>no data</data>", "VALUE") );
      		text  += this.tab_row("<data class='display-label-dialog'>Last&nbsp;Query:</data>", use_color("<data class='display-detail' id='display_full_"+device+"_api-last-query'>no data</data>", "VALUE") );
        	text  += this.tab_row("end");

        	text  += "</div>";
		appMsg.confirm(text,"",500);
		statusCheck_load();
        }

        // idea ... display for media information: mute (icon), volume (bar), info (title/artist/album/episode/...)
        // see: https://www.wbrnet.info/vbhtm/9261_Laufschriften_I.html

	this.mediainfo		= function (id, device, style="") {

        var display      = "";
		var status_data  = this.data["STATUS"]["devices"][device];

        return display;
        }

        // show json for buttons in text field
	this.json		= function ( id, json, format="" ) {

        var text = "";
        text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
        if (format == "buttons") {
	       	var x=0;
	       	text += "[\n";
        	for (var i=0;i<json.length;i++) {
        			x++;
        			text += "\""+json[i]+"\"";
        			if (i+1 < json.length)                                          { text += ", "; }
        			if (Number.isInteger((x)/4))                                    { text += "\n\n"; x = 0; }
        			if (json.length > i+1 && json[i+1].includes("LINE") && x > 0)   { text += "\n\n"; x = 0; }
        			if (json[i].includes("LINE"))                                   { text += "\n\n"; x = 0; }
        			if (json[i].includes("HEADER-IMAGE"))                           { text += "\n\n"; x = 0; }
        			if (json[i].includes("SLIDER"))                                 { text += "\n\n"; x = 0; }
        			if (json[i].includes("COLOR-PICKER"))                           { text += "\n\n"; x = 0; }
        			}
	       	text += "\n]";
        	}
        else if (format == "channels") {
        	json = JSON.stringify(json);
        	json = json.replaceAll( "],", "],\n\n" );
        	json = json.replaceAll( ":", ":\n   " );
        	json = json.replaceAll( "{", "{\n" );
        	json = json.replaceAll( "}", "\n}" );
        	text += json;
        	}
        else {
        	json = JSON.stringify(json);
        	json = json.replaceAll( ",", ",\n" );
        	json = json.replaceAll( "{", "{\n" );
        	json = json.replaceAll( "}", "\n}" );
        	text += json;
        	}
		text += "</textarea></center>";
        return text;
        }

        // write table tags
	this.tab_row             = function (td1,td2="")  {
		if (td1 == "start")     { return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 == "end")	{ return "</table>"; }
		else if (td2 == false)	{ return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else                    { return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}

	this.tab_line	  	  = function (text="") {
		return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
		}

	}


function rmImage(file) {

        return "<img src='icon/"+file+"' class='rm-button-image' alt='"+file+"' />";
        }


function rmRemoteJSON(name) {
	this.app_name       = name;
	this.data           = {};
	this.logging        = new jcLogging(this.app_name);


	// create textarea to edit JSON
	this.textarea           = function ( id, json, format="" ) {
            var text = "";
            text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:95%;height:160px;\">";
            text += this.json2text( id, json, format );
            text.replaceAll('"', '<b>"</b>');
	        text += "</textarea></center>";
        	return text;
		}
		
	// replace JSON in area
	this.textarea_replace   = function ( id, json, format="" ) {
		var text = "";
		text    += this.json2text( id, json, format );
		element  = document.getElementById(id);
		
		if (element)	{ element.value = text; }
		else		{ this.logging.error("Replace JSON in textarea - Element not found: "+id ); }
		}

    // show json for buttons in text field
    this.json2text          = function ( id, json, format="" ) {
		var text = "";
        if (format == "buttons") {
            var x=0;
            text += "[\n";
            for (var i=0;i<json.length;i++) {
                x++;
                text += "\""+json[i]+"\"";
                if (i+1 < json.length)						{ text += ", "; }
                if (Number.isInteger((x)/4))   				{ text += "\n\n"; x = 0; }
                if (json.length > i+1 && json[i+1].includes("LINE") && x > 0) { text += "\n\n"; x = 0; }
                if (json[i].includes("LINE"))                   { text += "\n\n"; x = 0; }
                if (json[i].includes("TOGGLE"))                 { text += "\n\n"; x = 0; }
                if (json[i].includes("HEADER-IMAGE"))           { text += "\n\n"; x = 0; }
                if (json[i].includes("SLIDER"))                 { text += "\n\n"; x = 0; }
                if (json[i].includes("COLOR-PICKER"))           { text += "\n\n"; x = 0; }
                }
            text += "\n]";
            }
        else if (format == "channels") {
            json = JSON.stringify(json);
            json = json.replaceAll( "],", "],\n\n" );
            json = json.replaceAll( ":", ":\n   " );
            json = json.replaceAll( "{", "{\n" );
            json = json.replaceAll( "}", "\n}" );
            text += json;
            }
        else if (format == "macros") {
            json = JSON.stringify(json);
            json = json.replaceAll( "],", "],\n\n" );
            json = json.replaceAll( ":", ":\n" );
            json = json.replaceAll( "{", "{\n" );
            json = json.replaceAll( "}", "\n}" );
            text += json;
            }
        else if (json != undefined) {
            json = JSON.stringify(json);
            json = json.replaceAll( ",", ",\n" );
            json = json.replaceAll( "{", "{\n" );
            json = json.replaceAll( "}", "\n}" );
            text += json;
            }
        return text;
        }
        	
    // convert text 2 json ...
    this.text2json          = function ( json_text, id="" ) {

		// if string return value
        	if (json_text == "" || 
        	   (json_text.indexOf("[") < 0 && json_text.indexOf("{") < 0 && json_text.indexOf("\""))) { return json_text; }
        	
        	// parse and return object
		try 		{ var object = JSON.parse(json_text); } 
		catch(e) 	{ 
			alert(lang("FORMAT_INCORRECT")+": "+e); 
			this.logging.error(lang("FORMAT_INCORRECT")+" / "+id+": "+e);
			this.logging.error(json_text);
			return default_data;
			}
		this.logging.debug(object);
		return object;
        }
        
    // get JSON value (and check if correct)
    this.get_value          = function ( id, default_data="" ) {

        if (typeof id != "string") {
            console.error(this.app_name+".get_value: id is not type 'string' but '"+(typeof id)+"'.");
            console.error(id);
            console.error(default_data);
            return;
        }

		element = document.getElementById(id);
		this.logging.debug(this.app_name+".get_value: "+id);

		if (!element)	{ 
			this.logging.error(this.app_name+".get_value: element not found "+id);
			return default_data;
			}

		return this.text2json( element.value, id );
		}
        	
	}

/*
* class to edit JSON texts in a pre-formated and color coded style
*/
class rmJsonEdit {

    constructor(id, format_style = "default", style = "width: 95%; height: 160px;") {
        this.default_size = style;
        this.format_style = format_style;   // other options: default, leafs, row4

        this.start = this.start.bind(this);
        this.create = this.create.bind(this);
        this.customJSONStringify = this.customJSONStringify.bind(this);
        }

    create(container_id, id, json, format_style = "", style = "") {
        const editor    = this.get(id, json, format_style, style);
        if (document.getElementById(container_id)) {
            const container = document.getElementById(container_id);
            container.innerHTML = editor;
            this.start(id);
            }
        else {
            console.error("rmJsonEdit.create: container for json editor '" + container_id + "' not found." );
            }
        }

    get(id, json, format_style = "", style = "") {
        const id_container = id + "_container";
        const id_highlight = id + "_highlight";
        const id_type      = id + "_type";
        const id_textarea  = id;
        const jsonText     = this.customJSONStringify(json, 2, format_style);

        if (style == "") { style = this.default_size; }

        this.editor     = `<div id="`+id_container+`" class="json-editor-container" style="`+style+`">
            <pre id="`+id_highlight+`">`+this.syntaxHighlight(jsonText)+`</pre>
            <textarea id="`+id_textarea+`" spellcheck="false">`+jsonText+`</textarea>
            <div id="`+id_type+`">`+format_style+`</div>
            </div>`;

        return this.editor;
        }

    start(id) {
        const highlight = document.getElementById(id + "_highlight");
        const format    = document.getElementById(id + "_type");
        const textarea  = document.getElementById(id);

        if (textarea) {
            // overlay highlighted text
            textarea.addEventListener("input", () => {
                highlight.innerHTML = this.syntaxHighlight(textarea.value);
                });

            // Sync scroll position
            textarea.addEventListener("scroll", () => {
                highlight.scrollTop = textarea.scrollTop;
                highlight.scrollLeft = textarea.scrollLeft;
                });

            // Sync size changes with ResizeObserver
            const resizeObserver = new ResizeObserver(() => {
                highlight.style.width = textarea.offsetWidth + "px";
                highlight.style.height = textarea.offsetHeight + "px";
                });
            resizeObserver.observe(textarea);
            }
        else {
            console.error("rmJsonEdit.start: json editor '" + id + "' not found." );
            }
        }

    disable(id, disabled=true) {
        const highlight = document.getElementById(id + "_highlight");
        const textarea  = document.getElementById(id);

        textarea.disabled = disabled;
        if (disabled)   { highlight.style.background = "var(--json-color-background-disabled)"; }
        else            { highlight.style.background = "var(--json-color-background)"; }
    }

    customJSONStringify(obj, indent = 2, format_style = "") {
        const space = " ".repeat(indent);
        let formatStyle = this.format_style;
        if (format_style != "") { formatStyle = format_style; }

        function format(value, level = 0) {
            if (value === null || typeof value !== "object") {
                return JSON.stringify(value);
            }

            // ARRAYS
            if (Array.isArray(value)) {
                if (value.length === 0) return "[]";

                const items = value.map(v => format(v, level + 1));

                if (formatStyle === "compact") {
                    return `[${items.join(", ")}]`; // all inline
                }

                if (formatStyle === "rmc") {
                const lines = [];
                let currentLine = [];

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    // Special elements go on their own line
                    if (
                        item.startsWith('"LINE') ||
                        item.startsWith('"HEADER-IMAGE') ||
                        item.startsWith('"TOGGLE')
                    ) {
                        if (currentLine.length) {
                            lines.push(currentLine.join(", "));
                            currentLine = [];
                        }
                        lines.push(item); // single line
                    } else {
                        currentLine.push(item);
                        // Push line every 4 elements
                        if (currentLine.length === 4) {
                            lines.push(currentLine.join(", "));
                            currentLine = [];
                        }
                    }
                }

                // Push remaining items
                if (currentLine.length) {
                    lines.push(currentLine.join(", "));
                }

                return `[\n${space.repeat(level + 1)}${lines.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
                }

                if (formatStyle === "rmc2") {
                    const lines = [];

                    for (let i = 0; i < items.length; i += 4) {
                        lines.push(items.slice(i, i + 4).join(", "));
                    }
                    return `[\n${space.repeat(level + 1)}${lines.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
                }

                // default: one element per line
                return `[\n${space.repeat(level + 1)}${items.join(`,\n${space.repeat(level + 1)}`)}\n${space.repeat(level)}]`;
            }

            // OBJECTS
            const entries = Object.entries(value);
            const inner = entries
                .map(([k, v]) => `${space.repeat(level + 1)}${JSON.stringify(k)}: ${format(v, level + 1)}`)
                .join(",\n");

            return `{\n${inner}\n${space.repeat(level)}}`;
        }

        return format(obj, 0);
        }

    syntaxHighlight(json) {
        if (!json) return "";
        json = json
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = "json-number";

                if (/^"/.test(match))               { cls = /:$/.test(match) ? "json-key" : "json-string"; }
                else if (/true|false/.test(match))  { cls = "json-boolean"; }
                else if (/null/.test(match))        { cls = "json-null"; }

                if (cls == "json-string") { match = match.replace( /\|\|/g, '<span class="json-separator">||</span>'); }

                return `<span class="${cls}">${match}</span>`;
                }
            );
        }
    }

/*
* class to create a box, where content can be added into several sheets and the sheets can be selected by tabs
*/
var rmSheetBox_open = {};
class rmSheetBox {

    constructor(containerId, height = "300px", scroll_bar = false, scroll_view = false, keep_open = true) {
        this.id = containerId;
        this.container = document.getElementById(containerId);
        this.container.innerHTML = "";
        this.sheets = [];
        this.activeIndex = 0;
        this.scroll = scroll_bar;
        this.scroll_into_view = scroll_view;
        this.keep_open = keep_open;

        // Hauptstruktur
        this.box = document.createElement("div");
        this.box.className = "sheet-box";
        this.box.style.minHeight = height;
        this.box.style.display = "flex";
        this.box.style.flexDirection = "column";

        // Tab-Leiste Wrapper
        this.tabWrapper = document.createElement("div");
        this.tabWrapper.className = "tab-bar-wrapper";

        // Scrollbare Tab-Bar
        this.tabBar = document.createElement("div");
        this.tabBar.className = "tab-bar";

        // Pfeile rechts
        this.arrowContainer = document.createElement("div");
        this.arrowContainer.className = "tab-scroll-right";

        this.btnLeft = document.createElement("button");
        this.btnLeft.className = "tab-scroll-btn";
        this.btnLeft.innerHTML = "&#10094;";
        this.btnLeft.addEventListener("click", () => this.scrollTabs(-150));

        this.btnRight = document.createElement("button");
        this.btnRight.className = "tab-scroll-btn";
        this.btnRight.innerHTML = "&#10095;";
        this.btnRight.addEventListener("click", () => this.scrollTabs(150));

        this.arrowContainer.appendChild(this.btnLeft);
        this.arrowContainer.appendChild(this.btnRight);

        this.tabWrapper.appendChild(this.tabBar);
        this.tabWrapper.appendChild(this.arrowContainer);

        // Inhaltsbereich
        this.contentArea = document.createElement("div");
        this.contentArea.className = "sheet-content";
        this.contentArea.style.position = "relative";

        this.box.appendChild(this.tabWrapper);
        this.box.appendChild(this.contentArea);
        this.container.appendChild(this.box);

        window.addEventListener("resize", () => this.updateArrowVisibility());
        }

    addSheet(title, content) {
        const index = this.sheets.length;

        // Tab erstellen
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.textContent = title;
        tab.addEventListener("click", () => this.setActiveSheet(index));

        // Sheet-Container erstellen
        const sheetDiv = document.createElement("div");
        sheetDiv.className = "sheet-panel";
        sheetDiv.innerHTML = content;
        sheetDiv.style.display = "none"; // inaktiv = unsichtbar
        sheetDiv.style.position = "absolute";
        sheetDiv.style.top = "0";
        sheetDiv.style.left = "0";
        sheetDiv.style.right = "0";
        sheetDiv.style.bottom = "0";

        // Scrollbar nur für das Sheet selbst
        if (this.scroll) {
            sheetDiv.style.overflowY = "auto";
            }

        // Immer im DOM, auch inaktiv
        this.contentArea.appendChild(sheetDiv);

        this.sheets.push({ title, tab, sheetDiv });
        this.tabBar.appendChild(tab);

        // Erstes Sheet aktivieren
        if (this.keep_open)     { this.activateLast(); }
        else if (index === 0)   { this.setActiveSheet(0); }

        this.updateArrowVisibility();
        }

    setActiveSheet(index) {
        this.activeIndex = index;

        this.sheets.forEach((sheet, i) => {
            const active = i === index;
            sheet.tab.classList.toggle("active", active);
            sheet.sheetDiv.style.display = active ? "block" : "none"; // inaktiv = display:none

            if (this.keep_open && active) {
                rmSheetBox_open[this.id] = index;
                }

            if (active && this.scroll_into_view) {
                sheet.tab.scrollIntoView({ behavior: "smooth", inline: "center" });
                }
            });
        }

    activateLast() {
        if (this.keep_open && rmSheetBox_open[this.id]) { this.setActiveSheet(rmSheetBox_open[this.id]); }
        else                                            { this.setActiveSheet(0); }
        }

    scrollTabs(offset) {
        this.tabBar.scrollBy({ left: offset, behavior: "smooth" });
        setTimeout(() => this.updateArrowVisibility(), 200);
        }

    updateArrowVisibility() {
        const { scrollWidth, clientWidth } = this.tabBar;
        this.arrowContainer.style.display = scrollWidth > clientWidth ? "flex" : "none";
        }

    getSheetContent(index) {
        // Zugriff auf die Inhalte auch wenn sie gerade unsichtbar sind
        return this.sheets[index]?.sheetDiv || null;
        }
    }

/*
* class to create a wide box for content, that can be scrolled left and right if it's wider than the box
*/
class rmScrollBox {

    constructor(container="scrollBox", html="") {

        this.update = this.update.bind(this);

        this.id_container   = container;
        this.id_wrapper     = container + "_wrapper";
        this.id_scrollLeft  = container + "_scroll_left";
        this.id_scrollRight = container + "_scroll_right";

        this.boxHTML    = `<div id=`+this.id_wrapper+` class="rm-button_setting_wrapper_top">
            <button class="nav-arrow left" id="`+this.id_scrollLeft+`">❮</button>
            `+html+`
            <button class='nav-arrow right' id="`+this.id_scrollRight+`">❯</button>
	        </div>`;

	    if (document.getElementById(this.id_container)) {

	        this.container = document.getElementById(this.id_container);
	        this.container.innerHTML = this.boxHTML;

	        this.wrapper    = document.getElementById(this.id_wrapper);
	        this.leftArrow  = document.getElementById(this.id_scrollLeft);
	        this.rightArrow = document.getElementById(this.id_scrollRight);

            this.leftArrow.addEventListener('click', () => {
              this.wrapper.scrollBy({ left: -100, behavior: 'smooth' });
            });

            this.rightArrow.addEventListener('click', () => {
              this.wrapper.scrollBy({ left: 100, behavior: 'smooth' });
            });

            this.wrapper.addEventListener('scroll', this.update);
            window.addEventListener('resize', this.update);

            this.update();
	        }
	    else {
	        console.error("rmScrollBox: Container '" + container + "' not found.");
	        }
        }

    update() {
        if (this.wrapper) {
            const scrollLeft = this.wrapper.scrollLeft;
            const maxScroll  = this.wrapper.scrollWidth - this.wrapper.clientWidth;

            this.leftArrow.style.display  = scrollLeft > 0 ? 'block' : 'none';
            this.rightArrow.style.display = scrollLeft < maxScroll - 1 ? 'block' : 'none';
            }
	    else {
	        console.error("rmScrollBox.update: Container '" + this.id_container + "' not found.");
	        }
        }
    }


//----------------------------------
// Handling of Macros
//----------------------------------
// Macroseiten schreiben

function writeMacroButton () {
    var buttons = "";
    var macro   = macro_def["Main"];

    for (var key in macro) {
        id      = macro[key];
        buttons = buttons + sendButtonMacro( id, macro[key], key, "yellow", "" );
        }

    document.getElementById("frame2").innerHTML = buttons;
    }

//--------------------------------
// EOF
