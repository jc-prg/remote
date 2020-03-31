//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------
/* INDEX:
function rmRemote(name)
	this.init                 = function (data)
	this.create               = function (type="",rm_id="")
	this.device_remote        = function (id="", device="")
	this.device_description   = function (id, device)
	this.device_notused       = function (id, device)
	this.device_edit          = function (id, device)
	this.scene_remote         = function (id="", scene="")
	this.scene_edit           = function (id, device)
	this.scene_channels       = function (id, scene)
		channels     = channels.sort(function (a, b)
	this.remoteToggleEditMode = function ()
        this.command_select       = function (id,device="")
        this.button_select        = function (id,device="")
        this.template_select      = function (id,title,data,onchange="")
        this.input                = function (id,value="")
        this.button_edit          = function (onclick,label,disabled="")
        this.select               = function (id,title,data,onchange="",selected_value="")
        this.display              = function (id, device, style="" )
        this.display_alert        = function (id, device, style="" )
	this.button               = function (id, label, style, script_apiCommandSend, disabled )
	this.button_device        = function (id, label, style, cmd, disabled )
	this.button_device_add    = function (id, label, style, cmd, disabled )
	this.button_makro         = function (id, label, style, makro, disabled )
	this.button_channel       = function (id, label, makro, style, disabled="")
	this.button_image         = function (label,style)
	this.statusCheck_buttons = function ()
	this.statusCheck_devices = function ()
	this.statusCheck_scenes  = function ()
	this.empty                = function (id,comment="")
	this.button_list          = function (device)
	this.log                  = function (msg)
	this.show                 = function (device="")
	this.tab_row              = function (td1,td2="")
function writeMakroButton ()
*/
//--------------------------------

function rmRemote(name) {

	this.data 	    = {};
	this.templates      = {};
	this.app_name	    = name;
	this.active_name    = "";
	this.active_type    = "";
	this.active_buttons = [];
	this.edit_mode      = false;
	this.initial_load   = true;

	// load data with devices (deviceConfig["devices"])
	//--------------------

	this.init                 = function (data) {
	
		if (data["DATA"]) {
			this.data           = data;
        	        this.templates      = data["DATA"]["template_list"];
        	        }
        	else { return; }
                
                if (this.initial_load) { 
	                this.button_tooltip = new jcTooltip(this.app_name + ".button_tooltip");
	                this.button_tooltip.settings("onclick","120px","80px",50);
	                
                	this.log("Initialized new class 'rmRemotes'.");
                	this.inital_load = false;
                	}
                else {
                	this.log("Reload data 'rmRemotes'.");
                	}
		}


	// create complete remote setup (for scenes and devices)
	//--------------------
	this.create               = function (type="",rm_id="") {
	
		if ("DATA" in this.data == false) {
			console.warn("Data not loaded yet.");
			statusShowApiStatus("red", showButtonTime);
			return;
			}

	        if (type == "")   { type = this.active_type; }
	        if (rm_id == "")  { rm_id = this.active_name; }

		// set active remote (type, id)
		this.active_name    = rm_id;
		this.active_type    = type;
		this.active_buttons = [];

		rm3start.active     = "start";

		if (type == "device") {

			// set vars
			this.log("Write Device Remote Control: " + rm_id);

			// create remote for device
			this.device_remote("remote1",rm_id);
			this.device_description("remote2",rm_id);
			this.device_notused("remote3",rm_id);
      			this.device_edit("remote_edit",rm_id);

			// show
			this.show(rm_id);
			}
		else if (type == "scene") {

			// set vars
			this.log("Write Scene Remote Control: " + rm_id);

			// create remote for scene
			this.scene_remote("remote1",rm_id);
			this.scene_channels("remote2",rm_id);
			this.scene_edit("remote_edit",rm_id);
			this.empty("remote3");

			// show
			this.show();
			}
		}

	// remotes for devices
	//--------------------

	// create remote for a specific device
	this.device_remote        = function (id="", device="") {
	
		var remote             = "";
		var remote_displaysize = "middle";
		var remote_label       = this.data["DATA"]["devices"][device]["label"];
		var remote_definition  = this.data["DATA"]["devices"][device]["remote"];
		var remote_buttons     = this.data["DATA"]["devices"][device]["button_list"];
		
		if (this.data["DATA"]["devices"][device]["display-size"]) { remote_displaysize = this.data["DATA"]["devices"][device]["display-size"]; }
		
		rm3cookie.set("remote","device::"+device+"::"+remote_label);

		for (var i=0; i<remote_definition.length; i++) {

			var button = remote_definition[i];
			var cmd    = device + "_" + button;

			if (button == "LINE") 				{ remote += "<div class='remote-line'><hr/></div>"; }
			else if (button.indexOf("LINE||") == 0) {
				text = button.split("||")[1];
				remote += "<div class='remote-line'><hr/>";
				remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>";
				remote += "</div>";
				}
			else if (button == ".") 			{ remote += this.button_device( device+i, ".", "empty", "", "disabled" ) }
			else if (button == "DISPLAY")			{ remote += this.display(id,device,remote_displaysize); }
			else if (remote_buttons.includes(button)) 	{ remote += this.button_device( cmd, button, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (this.edit_mode)        		{ remote += this.button_device_add( cmd, button, "notfound", cmd, "" ); }
			else                            		{ remote += this.button_device( cmd, button, "notfound", cmd, "disabled" ); }
			}

		setTextById(id,remote);
		}


	// write description for device remote
	this.device_description   = function (id, device) {
		var label = this.data["DATA"]["devices"][device]["label"];
		var descr = this.data["DATA"]["devices"][device]["description"];
		var url   = this.data["DATA"]["devices"][device]["url"];
		if (url) { descr = "<a href=\""+url+"\">"+descr+"</a>"; }
		var str   = "<center>" + descr + "</center>";
		setTextById(id,str);
		}


	// create list of buttons not used in RM definition (for devices)
	this.device_notused       = function (id, device) {

		var remote            = "";
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var device_buttons    = this.data["DATA"]["devices"][device]["button_list"];
		var notused           = [];

		// difference of arrays
		for (var i=0;i<device_buttons.length;i++) {
			if (remote_buttons.includes(device_buttons[i]) == false) { notused.push(device_buttons[i]); }
			}

		// create buttons not used
		for (var i=0; i<notused.length; i++) {
			var button = notused[i];
			var cmd    = device + "_" + button;
			remote += this.button_device( cmd, button, "", cmd, "" );
			}

		// print
		setTextById(id,remote);
		}

	// edit panel per remote ...
	this.device_edit          = function (id, device) {

	        document.getElementById(id).style.display = "block";
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		var remote            = "";
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var device_commands   = this.data["DATA"]["devices"][device]["button_list"];
		var device_buttons    = [];
		
		for (var i=0;i<this.data["DATA"]["devices"][device]["remote"].length;i++) {
		        var button = this.data["DATA"]["devices"][device]["remote"][i];
			if (device_buttons.indexOf(button) < 0) { device_buttons.push(button); }
			}
			
		device_buttons.sort();

		this.input_width      = "180px";
		this.button_width     = "120px";

		remote  += "Edit &quot;<b>"+this.data["DATA"]["devices"][device]["label"]+" - "+this.data["DATA"]["devices"][device]["description"]+"</b>&quot; ("+device+"):<br/>&nbsp;<br/>";
		remote  += this.tab_row("start");

		remote  += this.tab_row( "Description:", 	this.input("edit_description",	this.data["DATA"]["devices"][device]["description"]) );
		remote  += this.tab_row( "Label:",       	this.input("edit_label",	this.data["DATA"]["devices"][device]["label"]) );
		//remote  += this.tab_row( "Interface:",   	this.input("edit_interface",	this.data["DATA"]["devices"][device]["interface"]) );
		remote  += this.tab_row( "Interface:",   	this.select("edit_interface", "interface", this.data["CONFIG"]["interfaces"], "", this.data["DATA"]["devices"][device]["interface"]) );
		remote  += this.tab_row( "Status request:",	this.select("edit_method",    "method",    this.data["CONFIG"]["methods"],    "", this.data["DATA"]["devices"][device]["method"]) );
		remote  += this.tab_row(
				this.button_edit("apiDeviceEdit('"+device+"','edit','description,label,interface,method');","change data")
				);

		remote  += this.tab_row("end");
		remote  += "<hr/>";
		remote  += this.tab_row("start");

		if (device != this.data["CONFIG"]["main-audio"] && this.data["DATA"]["devices"][device]["status"]["vol"] != undefined) {
			remote  += this.tab_row(
				"Set as main AUDIO device (change from &quot;"+this.data["CONFIG"]["main-audio"]+"&quot;)",
				this.button_edit("setMainAudio('"+device+"');","set main device","")
				);
			}
		else if (device == this.data["CONFIG"]["main-audio"]) {
			remote  += this.tab_row("This device is defined as main AUDIO device.",false);
			}
		else {	remote  += this.tab_row("This device can't be set as main AUDIO device, no audio volume control available.",false);
			}

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit("apiButtonAdd('"+device+"','add_button');","add button")
				);
		remote  += this.tab_row(
				this.button_select("del_button",device),
				this.button_edit("apiButtonDelete('"+device+"','del_button');","delete button")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(		
				this.command_select("rec_button",device),
				this.button_edit("alert('Not implemented yet.');","record command","disabled")
				);
		remote  += this.tab_row(
				this.command_select("del_command",device),
				this.button_edit("apiCommandDelete('"+device+"','del_command');","delete command")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.template_select("change_visibility","visibility",{"yes":"visible","no":"hidden"}),
				this.button_edit("apiDeviceChangeVisibility('"+device+"','change_visibility');","change visibility")
				);
		remote  += this.tab_row(
				this.template_select("add_template","template",this.templates),
				this.button_edit("apiTemplateAdd('"+device+"','add_template');","*clone template")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.input("del_device",device),
				this.button_edit("apiDeviceDelete('del_device');","delete device")
				);

		remote  += this.tab_row("end");
		
		remote  += "&nbsp;<br/>If a template is loaded, click a blue button to record an IR command for this button. Templates have to be edited / added in the JSON files at the moment."
		
/*
		tooltip = new jcTooltip("tooltip");
		tooltip.settings("onclick","auto","auto");
		remote  += tooltip.create("TEST ZUM<br/> TESTEN","Infotext","name");
*/
			
		setTextById(id,remote);
		}


	// remotes for scenes
	//--------------------

	// create remote for a specific scene
	this.scene_remote         = function (id="", scene="") {
	    
		var remote            	= "";
		var remote_definition 	= this.data["DATA"]["scenes"][scene]["remote"];
		var remote_label 	= this.data["DATA"]["scenes"][scene]["label"];
		var makros 		= this.data["DATA"]["makros"]["makro"];
		var makros_sceneOn	= this.data["DATA"]["makros"]["scene-on"];
		var makros_sceneOff	= this.data["DATA"]["makros"]["scene-off"];
		
		rm3cookie.set("remote","scene::"+scene+"::"+remote_label);

		for (var i=0; i<remote_definition.length; i++) {

			var button = remote_definition[i].split("_");
			var cmd    = button[0] + "_" + button[1];

			if (button[0] == "LINE") 				{ remote += "<div class='remote-line'><hr/></div>"; }
			else if (button[0].indexOf("||") > 0) {
				text = button[0].split("||")[1];
				remote += "<div class='remote-line'><hr/>";
				remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>";
				remote += "</div>";
				}
			//else if (button[0] == "makro")  { remote += sendButtonMakro( cmd, makros[button[1]], button[1], "", "" ); }
			else if (button[0] == ".") 		{ remote += this.button_device( scene+i, ".", "", "", "disabled" ); }
			else if (button[0] == "makro")		{ remote += this.button_makro(  cmd, button[1], "", makros[button[1]], "" ); 
								  this.active_buttons.push(cmd); 
								  }
			else if (button[0] == "scene-on")	{ remote += this.button_makro(  "scene_on_"+button[1],  "on",  "", makros_sceneOn[button[1]], "" );
								  this.active_buttons.push("scene_on_"+button[1]); }
			else if (button[0] == "scene-off")	{ remote += this.button_makro(  "scene_off_"+button[1], "off", "", makros_sceneOff[button[1]], "" );
								  this.active_buttons.push("scene_off_"+button[1]); }
			else 					{ remote += this.button_device( cmd, button[1], "", cmd, "" );
								  this.active_buttons.push(cmd); }
			}

		setTextById(id,remote);
		}


	this.scene_edit           = function (id, device) {
	
		remote = "Edit mode for scenes not implemented yet!";
	        document.getElementById(id).style.display = "block";
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		setTextById(id,remote);
		}

	// create lists
	//--------------------

	// create list of channels (for scenes)
	this.scene_channels       = function (id, scene) {
		// set vars
		var remote   = "";
		var makros   = this.data["DATA"]["scenes"][scene]["channel"];
		var channels = Object.keys(this.data["DATA"]["scenes"][scene]["channel"]);
		channels     = channels.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});

    		// create list of channel buttons
    		for (var i=0; i<channels.length; i++) {
        		var cmd   = channels[i];
			remote += this.button_channel(cmd, channels[i], makros[channels[i]],"","");
        		}

		// print
		setTextById(id,remote);
		}


	// show hide edit mode for remotes
	this.remoteToggleEditMode = function () {
	
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		
                this.create();
		}


	// specific selects ...
	//--------------------
	
        this.command_select       = function (id,device="") {
                var list = {};
                if (device != "" && device in this.data["DATA"]["devices"]) {
			button_list = this.button_list(device);
			for (var i=0;i<button_list.length;i++) {
                                list[device+"_"+button_list[i]] = button_list[i];
				}
			}
                return this.select(id,"command",list);
                }
        
        this.button_select        = function (id,device="") {

               	var list = {};
		var device_buttons    = [];		
                if (device != "" && device in this.data["DATA"]["devices"]) {
                
			button_list = this.data["DATA"]["devices"][device]["remote"];
			for (var i=0;i<button_list.length;i++) {
				if (i<10) { a = "0"; } else { a = ""; }
                                list[i] = "["+a+i+"]  "+button_list[i];
				}
			}
                return this.select(id,"button",list);
                }
                
        this.template_select      = function (id,title,data,onchange="") {
                var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
                item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
                for (var key in data) {
                        if (key != "default") {
                                item += "<option value=\"" + key + "\">" + data[key] + "</option>";
                        }       }
                item     += "</select>";
                return item;
                }
                
	// create basic buttons & inputs
	//--------------------

        this.input                = function (id,value="")   { return "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'>"; }

        this.button_edit          = function (onclick,label,disabled="") {
        	var style = "width:" + this.button_width + ";margin:1px;";
        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}
//--------------------------------
        this.select               = function (id,title,data,onchange="",selected_value="") {
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

        // show display with informations
        this.display              = function (id, device, style="" ) {

		var display_data = {}
		
		if (this.data["DATA"]["devices"][device]["display"])	{ display_data = this.data["DATA"]["devices"][device]["display"]; }
		else							{ display_data["Error"] = "No display defined"; } 

        	var text  = "";
        	text += "<button class=\"display "+style+"\" onclick=\"" + this.app_name + ".display_alert('"+id+"','"+device+"','"+style+"');\">";
        	for (var key in display_data) {
        		var label = "<data class='display-label'>"+key+":</data>";
			var input = "<data class='display-input' id='display_"+device+"_"+display_data[key]+"'>no data</data>";
	        	text += "<div class='display-element "+style+"'>"+label+input+"</div>";
	        	}
        	text += "</button>";
        	return text;
        	}
        	
        // display all information
        this.display_alert        = function (id, device, style="" ) {
        
		var display_data = [];
		if (this.data["DATA"]["devices"][device]["query_list"])	{ display_data = this.data["DATA"]["devices"][device]["query_list"]; }
		else							{ display_data = ["ERROR","No display defined"]; } 

        	var text = "Device Information: "+device +"<hr/>";
        	text  += "<div style='width:100%;height:200px;overflow-y:scroll;'>";
        	text  += this.tab_row("start","100%");

        	for (var i=0; i<display_data.length; i++) {
        		var label = "<data class='display-label'>"+display_data[i]+":</data>";
			var input = "<data class='display-input' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>";
	        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
	        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
	        	}
        	text  += this.tab_row("end");
        	text  += "</div>";
		rm3msg.confirm(text,"",300);
		statusCheck(this.data);
        	}
          
	// standard standard button with option to left and right click
	this.button               = function (id, label, style, script_apiCommandSend, disabled ){
	
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
		//console.debug(button);
		return button;
		}
		
	// create buttons & inputs
	//--------------------

	// create button for single command
	this.button_device        = function (id, label, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = 'apiCommandSend("'+cmd+'");';
			}
		return this.button( id, label2[0], label2[1], cmd, disabled );
		}
		
	// create button for single command -> if no command assigned yet to record command for button
	this.button_device_add    = function (id, label, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
	        device_button = cmd.split("_");
	        
	        var button = this.button( id, label2[0], label2[1], ['apiButtonAdd("'+device_button[0]+'","'+device_button[1]+'");', this.app_name + '.button_tooltip.toggleAll("' + cmd + '");'], disabled );
	        button     = this.button_tooltip.create( button, "not implemented yet: " +cmd, cmd );
	        
		// console.error(button);	        
		return button;
		
		}		

	// create button for multiple commands (makro)
	this.button_makro         = function (id, label, style, makro, disabled ) {	// ALT: ( id, makro, label, style, disabled ) {
	        if (makro) {
        	        var d = this.button_image( label, style );
                	var makro_string = "";

                	for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }
                	var b = this.button( id, d[0], d[1], 'apiMakroSend("'+makro_string+'");', disabled );
			this.log(b);
			return b;
                	}
        	else {
                	return this.button( id, label, style+" notfound", "", "disabled" );
                	}
		}

	// create button for channel (makro)
	this.button_channel       = function (id, label, makro, style, disabled="") {
    		var makro_string = "";
		for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }

		//console.log(label+" - "+makro_string);

		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:apiMakroSend('" + makro_string + "');\">" + label + "</button>";
		}

	// check if image exists for button
	this.button_image         = function (label,style) {

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


	// check status (channel button color or disable buttons)
	//--------------------
	this.statusCheck_buttons = function () {}
	this.statusCheck_devices = function () {}
	this.statusCheck_scenes  = function () {}


	// helping fcts.
	//--------------------

	// empty field
	this.empty                = function (id,comment="") {
		setTextById(id,comment);
		}

	// return list of buttons for a device
	this.button_list          = function (device) {
		if (this.data["DATA"]["devices"][device]) 	{ return this.data["DATA"]["devices"][device]["button_list"]; }
		else						{ return ["error:"+device]; }
		}

	// handle messages for console
	this.log                  = function (msg) {
		console.log(this.app_name + ": " + msg);
		}

	// ensure, that all elements are visible and settings are hidden
	this.show                 = function (device="") {

		statusCheck(this.data);		// ... check if part of class ...
		setTextById("buttons_all","");		// ... move to showRemote() ...
		showRemoteInBackground(0);		// ... check if part of this class ...
		rm3settings.hide();			// ... check if part of another class ...

		}

        // write table tags
	this.tab_row              = function (td1,td2="")  { 
		if (td1 == "start")	{ return "<table border=\"0\" width=\""+td2+"\">"; }
		else if (td1 == "end")	{ return "</table>"; }
		else if (td2 == false)	{ return "<tr><td valign=\"top\" colspan=\"2\">" + td1 + "</td></tr>"; }
		else			{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
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

    document.getElementById("remote1").innerHTML = buttons;
    }

//--------------------------------
// EOF
