//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------


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
            onClick    = onClick.replaceAll("##", "$$!$$");
            onClick    = onClick.replaceAll("#", "\"");
            onClick    = onClick.replaceAll("$$!$$", "#");
            }
	
        if (style != "") { style = " " + style; }
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
	this.macro           = function (id, label, scene, style, macro, disabled ) {	// ALT: ( id, macro, label, style, disabled ) {
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
		for (var key in button_img2) { button_img[key] = image(button_img2[key]); }

		// check label
        	if (label in button_color)    { style = style + " bg" + label + " "; }
        	if (label in button_img && showImg ) { label = button_img[label]; }

        	return [label, style];
		}

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
		element = document.getElementById(id);
		this.logging.debug(this.app_name+".get_value: "+id);

		if (!element)	{ 
			this.logging.error(this.app_name+".get_value: element not found "+id);
			return default_data;
			}

		return this.text2json( element.value, id );
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
	this.default		= function (id, device, type="devices", style="", display_data={}) {

		if (!this.data["CONFIG"][type]) {
			this.logging.error(this.app_name+".display() - type not supported ("+type+")");
			return;
			}

		var remote_data	= this.data["CONFIG"][type][device]["remote"];
		var status_data	= this.data["STATUS"][type][device];

		if (!status_data)           { console.error("Error building display: no status data for " + device + " (" + type + ")"); }
		if (!status_data["power"])  { console.error("Error building display: no status_power data for " + device + " (" + type + ")"); status_data["power"] = "ERROR"; }
		if (!remote_data)           { console.error("Error building display: no remote definition for " + device + " (" + type + ")"); }

		if (type == "devices") { var connected = this.data["STATUS"]["devices"][device]["api-status"].toLowerCase(); }
		else                   { var connected = "unknown"; status_data = {}; }

		if (display_data != {})             {}
		else if (remote_data["display"])    { display_data          = remote_data["display"]; }
		else                                { display_data["Error"] = "No display defined"; }

        var text    = "";
        var status  = "";

		if (type == "devices")      { var onclick = "onclick=\"" + this.app_name + ".alert('"+id+"','"+device+"','"+type+"','##STYLE##');\""; }
		else                        { var onclick = "disabled"; }

        var display_start = "<button id=\"display_"+device+"_##STATUS##\" class=\"display ##STYLE##\" style=\"display:##DISPLAY##\" "+onclick+">";
        var display_end   = "</button>";

		if (this.edit_mode)                                                     { status = "EDIT_MODE"; }
		else if (type == "scenes")                                              { status = "ON"; }
		else if (connected.indexOf("off") > -1)                                 { status = "OFF"; }
		else if (connected != "connected")                                      { status = "ERROR"; }
		else if (status_data["power"].toUpperCase().indexOf("ON") >= 0)         { status = "ON"; }
		else if (status_data["power"].toUpperCase().indexOf("OFF") >= 0)        { status = "OFF" }
		else                                                                    { status = "ERROR"; }

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
            text += "<center><b>Connection Error</b>:</center>"; //<br/>";
            text += "<center><i>"+connected+" :: Power-Status: "+status_data["power"].toUpperCase()+"</i></center>";
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
            text += "<center>MANUAL MODE<br/><i>no information available</i></center>";
            text += display_end;

            // display if OFF
            text += display_start;
            text  = text.replace( /##STATUS##/g, "OFF" );
            text  = text.replace( /##STYLE##/g, style + " display_off" );
            if (status == "OFF"  && !this.edit_mode)    { text  = text.replace( /##DISPLAY##/g, "block" ); }
            else                                        { text  = text.replace( /##DISPLAY##/g, "none" ); }
            text += "<center>power off<br/><i><text id='display_power_info_"+device+"'></text></i></center>";
            text += display_end;
            }

        return text;
        }
        	
	this.sizes		= function () {
		var sizes = {
			"small" : "Small",
			"middle" : "Middle",
			"big"  : "Big",
			"h1w2" : "1x heigh / 2x wide",
			"h1w4" : "1x heigh / 4x wide",
			"h2w2" : "2x heigh / 2x wide", 
			"h2w4" : "2x heigh / 4x wide",
			"h3w2" : "3x heigh / 2x wide",
			"h4w2" : "4x heigh / 2x wide"
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
	        		var label = "<data class='display-label'>"+display_data[i]+":</data>";
				var input = "<data class='display-detail' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>";
		        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
		        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
		        	}
	        	}
        	text  += this.tab_row("<hr/>",false);

      		text  += this.tab_row("<data class='display-label'>API:</data>", "<data class='display-detail' id='display_full_"+device+"_api'>no data</data>" );
      		text  += this.tab_row("<data class='display-label'>Status:</data>", "<data class='display-detail' id='display_full_"+device+"_api-status'>no data</data>" );
      		text  += this.tab_row("<data class='display-label'>Last&nbsp;Send:</data>", "<data class='display-detail' id='display_full_"+device+"_api-last-send'>no data</data>" );
      		text  += this.tab_row("<data class='display-label'>Last&nbsp;Query:</data>", "<data class='display-detail' id='display_full_"+device+"_api-last-query'>no data</data>" );
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
