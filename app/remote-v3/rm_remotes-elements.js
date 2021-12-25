//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------
/* INDEX:
function rmRemoteBasic(name)
	this.input	= function (id,value="")
	this.select	= function (id,title,data,onchange="",selected_value="")
	this.line	= function (text="")
function rmRemoteTable(name)
	this.start	= function (width="100%")
	this.row	= function (td1,td2="")
	this.line	= function (text="")
	this.end	= function ()
function rmRemoteButtons(name)
	this.default		= function (id, label, style, script_apiCommandSend, disabled )
	this.edit		= function (onclick,label,disabled="")
	this.device		= function (id, label, device, style, cmd, disabled )
	this.device_keyboard	= function (id, label, device, style, cmd, disabled )
	this.device_add	= function (id, label, device, style, cmd, disabled )
	this.makro		= function (id, label, scene, style, makro, disabled )
	this.channel		= function (id, label, scene, makro, style, disabled="")
	this.image		= function (label,style)
function rmRemoteDisplays(name)
	this.default		= function (id, device, type="devices", style="", display_data={})
	this.sizes		= function ()
	this.alert		= function (id, device, type="", style="" )
	this.mediainfo		= function (id, device, style="")
	this.json		= function ( id, json, format="" )
	this.tab_row		= function (td1,td2="")
	this.tab_line		= function (text="")
function writeMakroButton ()
*/
//--------------------------------


function rmRemoteBasic(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	this.input_width    = "100px";

	this.logging        = new jcLogging(this.app_name);


	// input for text
	this.input	= function (id,value="")   { return "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'>"; }

	// select for different data 
	this.select	= function (id,title,data,onchange="",selected_value="") {
                var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
                item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
                for (var key in data) {
                        var selected = "";
                        if (selected_value == key) { selected = "selected"; }
                        if (key != "default") {
                                item += "<option value=\"" + key + "\" "+selected+">" + data[key] + "</option>";
                        }       }
                item     += "</select>";
                return item;
                }

        // write line with text ... 
	this.line	= function (text="") {
          	var remote = "";
		remote += "<div class='remote-line'><hr/>";
		if (text != "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}

	}
	

//--------------------------------

function rmRemoteTable(name) {

	this.app_name       = name;

	this.start	= function (width="100%") {
		return "<table border=\"0\" width=\""+width+"\">";
		}
		
	this.row	= function (td1,td2="")  { 
		if (td1 == "start")	{ return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 == "end")	{ return "</table>"; }
		else if (td2 == false)	{ return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else			{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}

	this.line	= function (text="") {
		return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
		}

	this.end	= function () {
		return "</table>";
		}
	}
	
//--------------------------------

	
function rmRemoteButtons(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;
	this.width          = "50px";

	this.logging        = new jcLogging(this.app_name);
	this.tooltip        = new jcTooltip(this.app_name + ".tooltip");


	// standard button with option to left and right click
	this.default		= function (id, label, style, script_apiCommandSend, disabled ){
	
	        var onContext  = "";
	        var onClick    = "";
	        if (script_apiCommandSend != "") { onClick    = "onclick='" + script_apiCommandSend + "'"; }
	        
	        if (Array.isArray(script_apiCommandSend)) {
	                var test   = "onmousedown_left_right(event,'alert(#left#);','alert(#right#);');"
	                onClick    = "onmousedown_left_right(event,\"" + script_apiCommandSend[0].replace(/\"/g,"#") + "\",\"" + script_apiCommandSend[1].replace(/\"/g,"#") + "\");";
	                onClick    = "onmousedown='"+onClick+"'";
	                onContext  = "oncontextmenu=\"return false;\"";
	                }
	
		if (style != "") { style = " " + style; }
		var button = "<button id='" + id.toLowerCase() + "' class='button" + style + "' " + onClick + " " + onContext + " " + disabled + " >" + label + "</button>"; // style='float:left;'
		return button;
		}

	// button edit mode		
	this.edit		= function (onclick,label,disabled="") {
        	var style = "width:" + this.width + ";margin:1px;";
        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

	// create button for single command
	this.device		= function (id, label, device, style, cmd, disabled ) {

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
	this.device_keyboard	= function (id, label, device, style, cmd, disabled ) {

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
	this.device_add	= function (id, label, device, style, cmd, disabled ) {

	        var device_button	= cmd.split("_");
		var label2		= this.image( label, style );
		if (label == ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }
	        
	        var button = this.default( id, label2[0], label2[1], 'apiCommandRecord("'+device_button[0]+'","'+device_button[1]+'");', disabled );
		return button;		
		}		

	// create button for multiple commands (makro)
	this.makro		= function (id, label, scene, style, makro, disabled ) {	// ALT: ( id, makro, label, style, disabled ) {
	        if (makro) {
        	        var d = this.image( label, style );
                	var makro_string = "";

                	for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }
                	var b = this.default( id, d[0], d[1], 'apiMakroSend("'+makro_string+'","'+scene+'");', disabled );
			this.logging.debug("button_makro - "+b);
			return b;
                	}
        	else {	return this.default( id, label, style+" notfound", "", "disabled" );
                	}
		}
		
	// create button for channel (makro)
	this.channel		= function (id, label, scene, makro, style, disabled="") {
    		var makro_string = "";
		for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }

		this.logging.debug(label+" - "+makro_string);
		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:apiMakroSend('" + makro_string + "','"+scene+"','"+label+"');\">" + label + "</button>";
		}

	// check if image exists for button
	this.image		= function (label,style) {

		// set vars
        	var button_color = this.data["CONFIG"]["button_colors"];  // definition of button color
		var button_img2  = this.data["CONFIG"]["button_images"];  // definition of images for buttons (without path and ".png")

		// if image available set image
		var button_img   = [];
		for (var key in button_img2) { button_img[key] = image(button_img2[key]); }

		// check label
        	if (label in button_color)    { style = style + " bg" + label + " "; }
        	if (label in button_img && showImg ) { label = button_img[label]; }

        	return [label, style];
		}

	}


// ------------------------------------------------------------------------------------
	

function rmRemoteDisplays(name) {

	this.app_name       = name;
	this.data           = {};
	this.edit_mode      = false;

	this.logging        = new jcLogging(this.app_name);

	// create display
	//--------------------------------
	// show display with information
	this.default		= function (id, device, type="devices", style="", display_data={}) {
		var remote_data	= this.data["DATA"][type][device]["remote"];
		var status_data	= this.data["DATA"][type][device]["status"];
		
		if (type == "devices") {
			var status_data_new	= this.data["STATUS"]["devices"][device];
			var device_api		= status_data_new["api"];
			var connected		= this.data["STATUS"]["interfaces"][device_api];
			}
		else {
			// check included devices ?
			var connected = "unknown";
			}
		
		if (!this.data["DATA"][type]) {
			this.logging.error(this.app_name+".display() - type not supported ("+type+")");
			return;
			}
		
		if (display_data != {}) 		{}
		else if (remote_data["display"])	{ display_data = remote_data["display"]; }
		else					{ display_data["Error"] = "No display defined"; } 

        	var text    = "";
	        var status  = "";
        	
        	var display_start = "<button id=\"display_"+device+"_##STATUS##\" class=\"display ##STYLE##\" style=\"display:##DISPLAY##\" onclick=\"" + this.app_name + ".alert('"+id+"','"+device+"','"+type+"','##STYLE##');\">";
        	var display_end   = "</button>";
        	
		if (this.edit_mode) 											{ status = "EDIT_MODE"; }		
		else if (type == "scenes")										{ status = "ON"; }
		else if (connected != "connected")									{ status = "ERROR"; }
		else if (status_data["power"] == "ON" || status_data["power"] == "on")				{ status = "ON"; }
		else if (status_data["power"].indexOf("OFF") >= 0 || status_data["power"].indexOf("off") >= 0)	{ status = "OFF" }
		else													{ status = "ERROR"; }

		// display if ERROR
		text += display_start;
		text  = text.replace( /##STATUS##/g, "ERROR" );
		text  = text.replace( /##STYLE##/g, style + " display_error" );
		if (status == "ERROR" && !this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
		else						{ text  = text.replace( /##DISPLAY##/g, "none" ); }
		text += "<center><b>Connection Error</b>:</center>"; //<br/>";
		text += "<center><i>"+connected+" :: Power-Status: "+status_data["power"].toUpperCase()+"</i></center>";
		text += display_end;
		
		// display if ON
		text += display_start;
		text  = text.replace( /##STATUS##/g, "ON" );
		text  = text.replace( /##STYLE##/g, style + " display_on" );
		if (status == "ON" && !this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
		else						{ text  = text.replace( /##DISPLAY##/g, "none" ); }
        	for (var key in display_data) {
        		var input_id = "";
        		if (display_data[key].indexOf("_") >= 0) 	{ input_id = 'display_' + display_data[key]; }
        		else						{ input_id = 'display_' + device + '_' + display_data[key]; }
      			var label    = "<data class='display-label'>"+key+":</data>";
			var input    = "<data class='display-input' id='"+input_id+"'>no data</data>";
	        	text += "<div class='display-element "+style+"'>"+label+input+"</div>";
	        	}
		text += display_end;

		// display if EDIT_MODE
		text += display_start;
		text  = text.replace( /##STATUS##/g, "EDIT_MODE" );
		text  = text.replace( /##STYLE##/g, style + " display_on" );
		if (this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
		else			{ text  = text.replace( /##DISPLAY##/g, "none" ); }
        	for (var key in display_data) {
      			var label = "<data class='display-label'>"+key+":</data>";
			var input = "<data class='display-input' id='display_"+device+"_"+display_data[key]+"_edit'>edit mode</data>";
	        	text += "<div class='display-element "+style+"'>"+label+input+"</div>";
	        	}
		text += display_end;

		// display if OFF
		text += display_start;
		text  = text.replace( /##STATUS##/g, "OFF" );
		text  = text.replace( /##STYLE##/g, style + " display_off" );
		if (status == "OFF"  && !this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
		else						{ text  = text.replace( /##DISPLAY##/g, "none" ); }
		text += "<center>power off</center>";
		text += display_end;

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
      		text  += "<div style='width:100%;height:200px;overflow-y:scroll;'>";
		
		if (type != "devices") { 

			if (!this.data["DATA"][type][device]["remote"]["display-detail"]) {
			
				this.logging.warn(this.app_name+".display_alert() not implemented for this type and device ("+type+"/"+device+")");
				this.logging.warn(this.data["DATA"][type][device]);
				return;
				}
			else {
				display_data = Object.keys(this.data["DATA"][type][device]["remote"]["display-detail"]);
				this.logging.warn(display_data);
				}
			}
			
		else {
			var power = this.data["DATA"][type][device]["status"];
			if (this.data["DATA"]["devices"][device]["interface"]["query_list"])	{ display_data = this.data["DATA"]["devices"][device]["interface"]["query_list"]; }
			else									{ display_data = ["ERROR","No display defined"]; } 

        		this.logging.debug(device,"debug");
        		this.logging.debug(this.data["DATA"]["devices"][device]["status"],"debug");
        		this.logging.debug(this.data["DATA"]["devices"][device]["interface"]["query_list"],"debug");
        		this.logging.debug(display_data,"debug");

			text  += "<center id='display_full_"+device+"_power'>"+power+"</center><hr/>";        		
			}

      		text  += this.tab_row("start","100%");
        				
        	for (var i=0; i<display_data.length; i++) {
      			if (display_data[i] != "power" && display_data[i] != "api" && display_data[i] != "api-status" && display_data[i] != "api-last-query") {
	        		var label = "<data class='display-label'>"+display_data[i]+":</data>";
				var input = "<data class='display-detail' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>";
		        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
		        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
		        	}
	        	}
        	text  += this.tab_row("<hr/>",false);

      		text  += this.tab_row("<data class='display-label'>API:</data>", "<data class='display-detail' id='display_full_"+device+"_api'>no data</data>" );
      		text  += this.tab_row("<data class='display-label'>API Status:</data>", "<data class='display-detail' id='display_full_"+device+"_api-status'>no data</data>" );
      		text  += this.tab_row("<data class='display-label'>API Last Query:</data>", "<data class='display-detail' id='display_full_"+device+"_api-last-query'>no data</data>" );
        	text  += this.tab_row("end");

        	text  += "</div>";
		appMsg.confirm(text,"",300);
		statusCheck(this.data);
        	}
        	
        // idea ... display for media information: mute (icon), volume (bar), info (title/artist/album/episode/...)
        // see: https://www.wbrnet.info/vbhtm/9261_Laufschriften_I.html

	this.mediainfo		= function (id, device, style="") {
                	
        	var display      = "";
		var status_data  = this.data["DATA"]["devices"][device]["status"];
        	
        	return display;
        	}
        	
        // show json for buttons in text field
	this.json		= function ( id, json, format="" ) {
        
        	var text = "";
        	text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:320px;height:160px;\">";
        	if (format == "buttons") {
	        	var x=0;
	        	text += "[\n";
        		for (var i=0;i<json.length;i++) {
        			x++;
        			text += "\""+json[i]+"\"";
        			if (i+1 < json.length)						{ text += ", "; }
        			if (Number.isInteger((x)/4))   				{ text += "\n\n"; x = 0; }
        			if (json.length > i+1 && json[i+1].includes("LINE") && x > 0) { text += "\n\n"; x = 0; }
        			if (json[i].includes("LINE"))					{ text += "\n\n"; x = 0; }
        			if (json[i].includes("HEADER-IMAGE"))				{ text += "\n\n"; x = 0; }
        			if (json[i].includes("SLIDER"))				{ text += "\n\n"; x = 0; }
        			if (json[i].includes("COLOR-PICKER"))				{ text += "\n\n"; x = 0; }
        			}
	        	text += "\n]";
        		}
        	else if (format == "channels") {
        		json = JSON.stringify(json);
        		json = json.replace( /],/g, "],\n\n" );
        		json = json.replace( /:/g, ":\n   " );
        		json = json.replace( /{/g, "{\n" );
        		json = json.replace( /}/g, "\n}" );
        		text += json;
        		}
        	else {
        		json = JSON.stringify(json);
        		json = json.replace( /,/g, ",\n" );
        		json = json.replace( /{/g, "{\n" );
        		json = json.replace( /}/g, "\n}" );
        		text += json;
        		}
		text += "</textarea></center>";
        	return text;
        	}
        	
        // write table tags
	this.tab_row             = function (td1,td2="")  { 
		if (td1 == "start")	{ return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 == "end")	{ return "</table>"; }
		else if (td2 == false)	{ return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else			{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}

	this.tab_line	  	  = function (text="") {
		return "<tr><td colspan='2'><hr style='border:1px solid white;'/></td></tr>";
		}

	}


//----------------------------------
// Handling of Makros
//----------------------------------
// Makroseiten schreiben

function writeMakroButton () {
    var buttons = "";
    var makro   = makro_def["Main"];

    for (var key in makro) {
        id      = makro[key];
        buttons = buttons + sendButtonMakro( id, makro[key], key, "yellow", "" );
        }

    document.getElementById("frame2").innerHTML = buttons;
    }

//--------------------------------
// EOF
