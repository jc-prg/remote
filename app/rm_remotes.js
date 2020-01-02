//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------

function rmRemote(name) {

	this.data 	    = {};
	this.templates      = {};
	this.app_name	    = name;
	this.active_name    = "";
	this.active_type    = "";
	this.active_buttons = [];
	this.edit_mode      = false;

	// load data with devices (deviceConfig["devices"])
	//--------------------

	this.init = function(data,templates) {
		this.data           = data;
                this.templates      = templates;
                
                this.button_tooltip = new jcTooltip(this.app_name + ".button_tooltip");
                this.button_tooltip.settings("onclick","120px","80px",50);
                
		this.log("Initialized new class 'rmRemotes'."); // ... to add number of devices and scenes ...
		}


	// create complete remote setup (for scenes and devices)
	//--------------------

	this.create = function(type="",rm_id="") {
	
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
			this.empty("remote_edit");              elementHidden("remote_edit","scene"); // not implemented yet
			this.empty("remote3");

			// show
			this.show();
			}
		}



	// create remotes
	//--------------------

	// create remote for a specific device
	this.device_remote = function(id="", device="") {
	
	//console.error("device_remote");
	
		var remote            = "";
		var remote_label      = this.data["DATA"]["devices"][device]["label"];
		var remote_definition = this.data["DATA"]["devices"][device]["remote"];
		var remote_buttons    = this.data["DATA"]["devices"][device]["buttons"];

		rm3cookie.set("remote","device::"+device+"::"+remote_label);

		for (var i=0; i<remote_definition.length; i++) {

			var button = remote_definition[i];
			var cmd    = device + "_" + button;

			if (button == "LINE") 			{ remote += "<div style='width:100%;float:left;'><hr/></div>"; }
			else if (button == ".") 		{ remote += this.button_device( device+i, ".", "empty", "", "disabled" ) }
			else if (button == "DISPLAY")		{ remote += this.display(id,device,"middle"); }
			else if (button in remote_buttons) 	{ remote += this.button_device( cmd, button, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (this.edit_mode)        	{ remote += this.button_device_add( cmd, button, "notfound", cmd, "" ); }
			else                            	{ remote += this.button_device( cmd, button, "notfound", cmd, "disabled" ); }

									//NEU: function( id, label, style, cmd, disabled ) {
									//ALT: function( id, cmd, label, style, disabled ) {
			}

		setTextById(id,remote);
		}


	// create remote for a specific scene
	this.scene_remote  = function(id="", scene="") {
     
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

			if (button[0] == "LINE") 		{ remote += "<div style='width:100%;float:left;'><hr/></div>"; }
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


	// set description
	//--------------------

	// write description for device remote
	this.device_description = function(id, device) {
		var label = this.data["DATA"]["devices"][device]["label"];
		var descr = this.data["DATA"]["devices"][device]["description"];
		var str   = "<center>" + label + ": " + descr + "</center>";
		setTextById(id,str);
		}


	// create lists
	//--------------------

	// create list of channels (for scenes)
	this.scene_channels = function(id, scene) {

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


	// create list of buttons not used in RM definition (for devices)
	this.device_notused = function(id, device) {

		var remote            = "";
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var device_buttons    = Object.keys(this.data["DATA"]["devices"][device]["buttons"]);
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
	this.device_edit = function(id, device) {
	
//	console.error("device_edit");
//	console.error(this.edit_mode);
	
	        document.getElementById(id).style.display = "block";
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		var remote            = "";
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var device_buttons    = Object.keys(this.data["DATA"]["devices"][device]["buttons"]);

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
				this.button_edit("alert('Not implemented yet.');","change data","disabled")
				);

		remote  += this.tab_row("end");
		remote  += "<hr/>";
		remote  += this.tab_row("start");

		remote  += this.tab_row(
				"Set main AUDIO device",
				this.button_edit("alert('Not implemented yet.');","set main device","disabled")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit("addButton('"+device+"','add_button');","add button")
				);
		remote  += this.tab_row(
		
// ERROR -> buttons / button_list not filled ::: for test 1 (new devices?)

				this.button_select("rec_button",device),
				this.button_edit("alert('Not implemented yet.');","record command","disabled")
				);
		remote  += this.tab_row(
				this.button_select("del_button",device),
				this.button_edit("deleteButton('"+device+"','del_button');","*delete button")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.template_select("change_visibility","visibility",{"yes":{"description":"visible"},"no":{"description":"hidden"}}),
				this.button_edit("changeVisibilityDevice('"+device+"','change_visibility');","change visibility")
				);
		remote  += this.tab_row(
				this.template_select("add_template","template",this.templates),
				this.button_edit("addTemplate('"+device+"','add_template');","*clone template")
				);

		remote  += "<tr><td colspan='2'><hr/></td></tr>";

		remote  += this.tab_row(
				this.input("del_device",device),
				this.button_edit("deleteDevice('del_device');","delete device")
				);

		remote  += this.tab_row("end");
		
		remote  += "&nbsp;<br/>If a template is loaded, click a blue button to record an IR command for this button. Templates have to be edited / added in the JSON files at the moment."
		
/*
		tooltip = new jcTooltip("tooltip");
		tooltip.settings("onclick","auto","auto");
		remote  += tooltip.create("TEST ZUM<br/> TESTEN","Infotext","name");
*/
			
		setTextById(id,remote);
		
//	console.error("device_edit_ende");
		}


	// show hide edit mode for remotes
	this.toggleEditMode = function() {
	
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		
                this.create();
		}


	// specific selects ...
	//--------------------
	
        this.button_select = function (id,filter="") {
                var list = {};
                if (filter != "" && filter in this.data["DATA"]["devices"]) {
                
console.error(this.data["DATA"]["devices"][filter]);  

                        for (var key in this.data["DATA"]["devices"][filter]["buttons"]){
                                list[filter+"_"+key] = key;
                                }
                        }
                return this.select(id,"button",list);
                }
                
        this.template_select = function (id,title,data,onchange="") {
                var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
                item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
                for (var key in data) {
                        if (key != "default") {
                                item += "<option value=\"" + key + "\">" + data[key]["description"] + "</option>";
                        }       }
                item     += "</select>";
                return item;
                }
                
	// create basic buttons & inputs
	//--------------------

        this.input         = function (id,value="")   { return "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'>"; }

        this.button_edit   = function (onclick,label,disabled="") {
        	var style = "width:" + this.button_width + ";margin:1px;";
        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

        this.select  = function (id,title,data,onchange="",selected_value="") {
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
        this.display = function( id, device, style="" ) {

		var display_data = {}
		
		if (this.data["DATA"]["devices"][device]["display"])	{ display_data = this.data["DATA"]["devices"][device]["display"]; }
		else							{ display_data["Error"] = "No display defined"; } 

        	var text  = "";
        	text += "<button class='display "+style+"'>"
        	for (var key in display_data) {
        		var label = "<data class='display-label'>"+key+":</data>";
			var input = "<data class='display-input' id='display_"+device+"_"+display_data[key]+"'>no data</data>";
	        	text += "<div class='display-element "+style+"'>"+label+input+"</div>";
	        	}
        	text += "</button>";
        	return text;
        	}
          

	// standard standard button with option to left and right click
	this.button = function( id, label, style, script_sendCmd, disabled ){
	
	        var onContext  = "";
	        var onClick    = "";
	        if (script_sendCmd != "") { onClick    = "onclick='" + script_sendCmd + "'"; }
	        
	        if (Array.isArray(script_sendCmd)) {
	                var test   = "onmousedown_left_right(event,'alert(#left#);','alert(#right#);');"
	                onClick    = "onmousedown_left_right(event,\"" + script_sendCmd[0].replace(/\"/g,"#") + "\",\"" + script_sendCmd[1].replace(/\"/g,"#") + "\");";
	                onClick    = "onmousedown='"+onClick+"'";
	                onContext  = "oncontextmenu=\"return false;\"";
	                }
	
		var button = "<button id='" + id.toLowerCase() + "' class='button " + style + "' " + onClick + " " + onContext + " " + disabled + " style='float:left;'>" + label + "</button>";
		//console.debug(button);
		return button;
		}
		
	// create buttons & inputs
	//--------------------
	
	// create button for single command
	this.button_device = function( id, label, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = 'sendCmd("'+cmd+'");';
			}
		return this.button( id, label2[0], label2[1], cmd, disabled );
		}
		
	// create button for single command -> if no command assigned yet to record command for button
	this.button_device_add = function( id, label, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
	        device_button = cmd.split("_");
	        
	        var button = this.button( id, label2[0], label2[1], ['addButton("'+device_button[0]+'","'+device_button[1]+'");', this.app_name + '.button_tooltip.toggleAll("' + cmd + '");'], disabled );
	        button     = this.button_tooltip.create( button, "not implemented yet: " +cmd, cmd );
	        
		// console.error(button);	        
		return button;
		
		}		

	// create button for multiple commands (makro)
	this.button_makro = function( id, label, style, makro, disabled ) {	// ALT: ( id, makro, label, style, disabled ) {
	        if (makro) {
        	        var d = this.button_image( label, style );
                	var makro_string = "";

                	for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }
                	var b = this.button( id, d[0], d[1], 'sendMakro("'+makro_string+'");', disabled );
			this.log(b);
			return b;
                	}
        	else {
                	return this.button( id, label, style+" notfound", "", "disabled" );
                	}
		}

	// create button for channel (makro)
	this.button_channel = function(id, label, makro, style, disabled="") {
    		var makro_string = "";
		for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }

		//console.log(label+" - "+makro_string);

		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:sendMakro('" + makro_string + "');\">" + label + "</button>";
		}

	// check if image exists for button
	this.button_image = function(label,style) {

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

	this.check_status_buttons = function() {}
	this.check_status_devices = function() {}
	this.check_status_scenes  = function() {}


	// helping functions
	//--------------------

	// empty field
	this.empty = function(id,comment="") {
		setTextById(id,comment);
		}

	// return list of buttons for a device
	this.button_list = function(device) {
		return Object.keys(this.data["DATA"]["devices"][device]["buttons"]);
		}

	// handle messages for console
	this.log = function(msg) {
		console.log(this.app_name + ": " + msg);
		}

	// ensure, that all elements are visible and settings are hidden
	this.show = function (device="") {

		check_status();				// ... check if part of class ...
		check_status_inactive(device);		// ... check if part of class ...

		setTextById("buttons_all","");		// ... move to showRemote() ...
		showRemote(0);				// ... check if part of this class ...
		rm3settings.hide();			// ... check if part of another class ...

		}

        // write table tags
	this.tab_row = function (td1,td2="")  { 
		if (td1 == "start")	{ return "<table border=\"0\">"; }
		else if (td1 == "end")	{ return "</table>"; }
		else			{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
		}
	}


//----------------------------------
// Handling of Makros
//----------------------------------


// Makroseiten schreiben

function writeMakroButton() {
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
