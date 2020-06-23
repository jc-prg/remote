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
	this.device_remote        = function (id="", device="", preview_remote="", preview_display="")
	this.device_description   = function (id, device)
	this.device_notused       = function (id, device)
	this.device_notused_showhide = function ()
	this.device_edit          = function (id, device)
	this.device_edit_json	  = function (id, device, remote="", display={})
	this.get_json_value	  = function(id,default_data)
	this.scene_remote         = function (id="", scene="", preview_remote="", preview_channel="")
	this.scene_edit           = function (id, scene)
	this.scene_edit_json	  = function (id,scene,remote="",channel="")
	this.remote_add_button	  = function (type,id,scene,button,remote,position="")
	this.remote_delete_button = function (type,id,scene,button,remote)
	this.remote_move_button	  = function (type,id,scene,button,remote,left_right)
	this.scene_channels       = function (id, scene)
		channels     = channels.sort(function (a, b)
	this.remoteToggleEditMode = function ()
        this.command_select       = function (id,device="")
        this.command_select_record = function (id,device="")
        this.button_select        = function (id,device="")
        this.template_select      = function (id,title,data,onchange="")
        this.input                = function (id,value="")
        this.select               = function (id,title,data,onchange="",selected_value="")
	this.line		  = function (text="")
        this.display              = function (id, device, style="" )
        this.display_alert        = function (id, device, style="" )
        this.display_json	  = function ( id, json, format="" )
	this.button               = function (id, label, style, script_apiCommandSend, disabled )
        this.button_edit          = function (onclick,label,disabled="")
	this.button_device        = function (id, label, style, cmd, disabled )
	this.button_device_add    = function (id, label, style, cmd, disabled )
	this.button_makro         = function (id, label, style, makro, disabled )
	this.button_channel       = function (id, label, makro, style, disabled="")
	this.button_image         = function (label,style)
	this.button_list          = function (device)
	this.statusCheck_buttons = function ()
	this.statusCheck_devices = function ()
	this.statusCheck_scenes  = function ()
	this.empty                = function (id,comment="")
	this.log                  = function (msg)
	this.show                 = function (device="")
	this.tab_row              = function (td1,td2="")
	this.tab_line	  	  = function(text="")
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
	this.loaded_remote  = [];

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

	                this.tooltip_mode     = "onmouseover";
	                this.tooltip_width    = "140px";
	                this.tooltip_height   = "140px";
	                this.tooltip_distance = 47;

	                this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance);
	                
                	this.log("Initialized new class 'rmRemotes'.");
                	this.inital_load = false;
                	}
                else {	this.log("Reload data 'rmRemotes'.");
                	}
		}


	// create complete remote setup (for scenes and devices)
	//--------------------
	this.create               = function (type="", rm_id="") {
	
		if ("DATA" in this.data == false) {
			console.warn("Data not loaded yet.");
			statusShowApiStatus("red", showButtonTime);
			return;
			}
		if (rm_id != "" && this.data["DATA"]["devices"][rm_id] == undefined && this.data["DATA"]["scenes"][rm_id] == undefined) {
			console.warn("Remote ID "+rm_id+" not found.");
			rm3cookie.set("remote",""); //device::"+device+"::"+remote_label);
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
      			this.device_edit("remote_edit1",rm_id);
      			this.device_edit_json("remote_edit2",rm_id);
			this.device_notused("remote3",rm_id);

			// show
			this.show(rm_id);
			}
		else if (type == "scene") {

			// set vars
			this.log("Write Scene Remote Control: " + rm_id);

			// create remote for scene
			this.scene_remote("remote1",rm_id);
			this.scene_description("remote2",rm_id);
			this.scene_channels("remote3",rm_id);
			this.scene_edit("remote_edit1",rm_id);
			this.scene_edit_json("remote_edit2",rm_id);

			// show
			this.show();
			}
			
		this.loaded_remote  = [type,rm_id];
		rm3menu.menu_height();	
		}

	// remotes for devices
	//--------------------

	// create remote for a specific device
	this.device_remote        = function (id="", device="", preview_remote="", preview_display="") {

		var preview	       = false;	
		var remote             = "<div id='remote_button' display='block'>";

		var remote_displaysize = "middle";
		var remote_label       = this.data["DATA"]["devices"][device]["label"];
		var remote_buttons     = this.data["DATA"]["devices"][device]["button_list"];
		var remote_definition  = [];
		var remote_display     = {};
		
		if (preview_remote == "") 	{ remote_definition = this.data["DATA"]["devices"][device]["remote"]; }
		else				{ remote_definition = this.get_json_value(preview_remote,this.data["DATA"]["devices"][device]["remote"]); preview = true; }
		if (preview_display == "") 	{ remote_display    = this.data["DATA"]["devices"][device]["display"]; }
		else				{ remote_display    = this.get_json_value(preview_display,this.data["DATA"]["devices"][device]["display"]); preview = true; }
		
		if (this.data["DATA"]["devices"][device]["display-size"]) { remote_displaysize = this.data["DATA"]["devices"][device]["display-size"]; }
		
		rm3cookie.set("remote","device::"+device+"::"+remote_label);
		if (preview) { remote += "<b>Preview:</b><br/><hr/>"; }

		for (var i=0; i<remote_definition.length; i++) {

			var next_button;
			var button  	= remote_definition[i];
			var cmd     	= device + "_" + button;

			if (this.edit_mode) {			
				var contextmenu	     = "["+i+"] " + cmd.split("||")[0] + "<br/><br/>";		
				var link_preview     = this.app_name+".device_remote('remote1','"+device+"','remote_json_buttons','remote_json_display');";
				link_preview        += this.app_name+".device_notused('remote3','"+device+"');";
				var link_delete      = this.app_name+".remote_delete_button('device','remote_edit2','"+device+"','"+i+"','remote_json_buttons');";
				var link_move_left   = this.app_name+".remote_move_button('device','remote_edit2','"+device+"',"+i+",'remote_json_buttons','left');";
				var link_move_right  = this.app_name+".remote_move_button('device','remote_edit2','"+device+"',"+i+",'remote_json_buttons','right');";
				var link_button_left = this.app_name+".remote_add_button('device','remote_edit2','"+device+"','add_button_"+i+"','remote_json_buttons','"+i+"');";
				var link_button_right= this.app_name+".remote_add_button('device','remote_edit2','"+device+"','add_button_"+i+"','remote_json_buttons','"+(i+1)+"');";
				this.button_width    = "50px;"	
				var input_add_button = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>" +
							this.button_edit( link_button_left + link_preview, "&lt; +") +
							this.button_edit( link_button_right + link_preview, "+ &gt;");

				this.button_width    = "30px;";
				if (i > 0) 			    { contextmenu += this.button_edit( link_move_left  + link_preview, "&lt;",""); }
								      contextmenu += this.button_edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length) { contextmenu += this.button_edit( link_move_right + link_preview, "&gt;",""); }
				contextmenu += input_add_button;
				}
						
			if (button == "LINE")	 			{ next_button = this.line(""); }
			else if (button.indexOf("LINE||") == 0) 	{ next_button = this.line(button.split("||")[1]); }
			else if (button == ".") 			{ next_button = this.button_device( device+i, ".", "empty", "", "disabled" ) }
			else if (button == "DISPLAY")			{ next_button = this.display(id,device,remote_displaysize); }
			else if (remote_buttons.includes(button)) 	{ next_button = this.button_device( cmd, button, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (this.edit_mode)         		{ next_button = this.button_device_add( cmd, button, "notfound", cmd, "" ); }
			else                            		{ next_button = this.button_device( cmd, button, "notfound", cmd, "disabled" ); }

			if (this.edit_mode) {
				if (button.indexOf("LINE") == 0)		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,20); }
				else if (button.indexOf("DISPLAY") == 0)	{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,90); }
				else				    		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				next_button = this.button_tooltip.create( next_button, contextmenu, i );
				}

			remote += next_button;
			}
			
		remote += "</div>";			
		//remote += this.device_remote_json(id,device,remote_definition,remote_display);

		setTextById(id,remote);
		}

	// write description for device remote
	this.device_description   = function (id, device) {
		var label = this.data["DATA"]["devices"][device]["label"];
		var descr = this.data["DATA"]["devices"][device]["description"];
		var url   = this.data["DATA"]["devices"][device]["url"];
		if (url) { descr = "<a href=\""+url+"\" target='_blank'>"+descr+"</a>"; }
		
		var str = "";
		//str    += "<marquee scrollamount='5' scrolldelay='5'>Dieser Text wird ziemlich schnell bewegt...</marquee>";
		str    += "<media-info id='media_info'></media-info>";
		str    += "<center>" + label + ": " + descr + "</center>";
		
		setTextById(id,str);
		}


	// create list of buttons not used in RM definition (for devices)
	this.device_notused       = function (id, device) {

		var remote            = "";
		var link_preview      = this.app_name+".device_remote('remote1','"+device+"','remote_json_buttons','remote_json_display');";
		link_preview         += this.app_name+".device_notused('"+id+"','"+device+"');";
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var device_buttons    = this.data["DATA"]["devices"][device]["button_list"];
		var notused           = [];
		
		this.button_width     = "120px";
		
		// show not used buttons if edit mode
		if (this.edit_mode)	{ display = "block"; sign = "−"; def = getValueById('remote_json_buttons'); remote_buttons  = JSON.parse(def); }
		else			{ display = "none";  sign = "+"; }		

		// identify difference of arrays
		for (var i=0;i<device_buttons.length;i++) {
			if (remote_buttons.includes(device_buttons[i]) == false) { notused.push(device_buttons[i]); }
			}

		// show / hide buttons that are not used
		if (notused.length > 0) {
			var onclick = this.app_name + ".device_notused_showhide();";
			remote += "<div id='show_hide_not_used' onclick='" + onclick + "'>"+sign+"</div>";
			}
		
		remote += "<div id='buttons_not_used' style='display:"+display+";position:relative;top:-7px;'>";
		remote += this.line("not used in remote control");

		// create buttons not used
		for (var i=0; i<notused.length; i++) {
			var button  = notused[i];
			var cmd     = device + "_" + button;
			next_button = this.button_device( "not_used"+i, button, "", cmd, "" );
			
			if (this.edit_mode) {
				var link_add    = this.app_name+".remote_add_button('device', 'remote_edit2', '"+device+"', 'not_used_"+i+"', 'remote_json_buttons');";
				var input_add   = "<input id='not_used_"+i+"' name='not_used_"+i+"' value='"+button+"' style='display:none;'>";
				var contextmenu = input_add + "["+i+"] "+ cmd + "<br/><br/>" + this.button_edit( link_add + link_preview, "move to remote","");;
				
				this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,"80px",this.tooltip_distance);
				next_button = this.button_tooltip.create( next_button, contextmenu, "not_used"+i );
				}

			remote     += next_button;
			}

		remote += "</div>";

		// print
		setTextById(id,remote);
		}
	
	// show / hide buttons that are not used
	this.device_notused_showhide = function () {
		element = document.getElementById("buttons_not_used");
		button  = document.getElementById("show_hide_not_used");
		if (element.style.display == "block") 	{ element.style.display = "none";  button.innerHTML = "+"; }
		else					{ element.style.display = "block"; button.innerHTML = "−"; }
		}

	// edit panel per remote ...
	this.device_edit          = function (id, device) {

	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		var link_template = this.app_name+".remote_import_templates('device','remote_edit2','"+device+"','add_template','remote_json_buttons');";
		var link_preview  = this.app_name+".device_remote('remote1','"+device+"','remote_json_buttons','remote_json_display');"
		link_preview     += this.app_name+".device_notused('remote3','"+device+"');";
		var remote        = "";
		
		var remote_buttons    = this.data["DATA"]["devices"][device]["remote"];
		var remote_visible    = this.data["DATA"]["devices"][device]["visible"];
		var remote_display    = this.data["DATA"]["devices"][device]["display"];
		var device_commands   = this.data["DATA"]["devices"][device]["button_list"];
		var device_buttons    = [];
		
		for (var i=0;i<this.data["DATA"]["devices"][device]["remote"].length;i++) {
		        var button = this.data["DATA"]["devices"][device]["remote"][i];
			if (device_buttons.indexOf(button) < 0) { device_buttons.push(button); }
			}
		device_buttons.sort();

		this.input_width      = "180px";
		this.button_width     = "120px";

		remote  += "<center><b>Edit &quot;"+this.data["DATA"]["devices"][device]["label"]+"&quot;</b> ["+device+"]</center>";
		remote  += "<hr/>";

		remote  += this.tab_row("start");
		remote  += this.tab_row( "Description:&nbsp;", 	this.input("edit_description",	this.data["DATA"]["devices"][device]["description"]) );
		remote  += this.tab_row( "Label:",       	this.input("edit_label",	this.data["DATA"]["devices"][device]["label"]) );
		remote  += this.tab_row( "&nbsp;",		this.button_edit("apiDeviceEdit('"+device+"','edit','description,label,interface,method');","save changes") );
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");	
		remote  += this.tab_row(
				"<input id='remote_visibility' value='"+remote_visible+"' style='display:none;'>"+
				this.button_edit("apiRemoteChangeVisibility('remote','"+device+"','remote_visibility');","show / hide") + "&nbsp;" +
				this.button_edit("apiDeviceDelete('"+device+"');","delete device")
				);		
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");

		if (device != this.data["CONFIG"]["main-audio"] && this.data["DATA"]["devices"][device]["status"]["vol"] != undefined) 
									{ remote  += this.tab_row(lang("AUDIO_SET_AS_MAIN",[this.data["CONFIG"]["main-audio"]]),this.button_edit("setMainAudio('"+device+"');","set main device","")); }
		else if (device == this.data["CONFIG"]["main-audio"]) 	{ remote  += this.tab_row(lang("AUDIO_IS_MAIN"),false); }
		else 							{ remote  += this.tab_row(lang("AUDIO_N/A_AS_MAIN"),false); }

		remote  += this.tab_line();
		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit(this.app_name+".remote_add_button('device','remote_edit2','"+device+"','add_button','remote_json_buttons');" + link_preview, "add button","")
				);
		remote  += this.tab_row(
				this.button_select("del_button",device),
				this.button_edit(this.app_name+".remote_delete_button('device','remote_edit2','"+device+"','del_button','remote_json_buttons');" + link_preview, "delete button","")
				);
		remote  += this.tab_row(
				this.template_select("add_template","template",this.templates),
				this.button_edit(link_template + link_preview,"clone template","")
				//this.button_edit("apiTemplateAdd('"+device+"','add_template');","clone template")
				);
/*
		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit("apiButtonAdd('"+device+"','add_button');","add button")
				);
		remote  += this.tab_row(
				this.button_select("del_button",device),
				this.button_edit("apiButtonDelete('"+device+"','del_button');","delete button")
				);
*/
		remote  += this.tab_line();
		if (this.data["DATA"]["devices"][device]["method"] == "record") {
			remote  += this.tab_row(		
				this.command_select_record("rec_button",device),
				this.button_edit("apiButtonAdd('"+device+"','rec_button');","record command","disabled")
				);
			remote  += this.tab_row( "<small>Undefined buttons are colored blue. Click to record an IR command for those buttons.</small>", "&nbsp;");
			}
		remote  += this.tab_row(
				this.command_select("del_command",device),
				this.button_edit("apiCommandDelete('"+device+"','del_command');","delete command")
				);
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");
		remote  += this.tab_row( "Interface:&nbsp;",   	this.data["DATA"]["devices"][device]["interface"] + " (" + this.data["DATA"]["devices"][device]["method"] + ")" );
		remote  += this.tab_row( "Device:",   		this.data["DATA"]["devices"][device]["config_device"]+".json" );
		remote  += this.tab_row( "Remote:",   		this.data["DATA"]["devices"][device]["config_remote"]+".json" );
		remote  += this.tab_row("end");
			
		setTextById(id,remote);
		}

	// create edit panel to edit JSON data
	this.device_edit_json	  = function (id, device, remote="", display={}) {
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"remote_edit_json"); return; }
	        
	        if (remote == "") 	{ var remote_definition  = this.data["DATA"]["devices"][device]["remote"]; }
	        else			{ var remote_definition  = remote; }
	        
	        if (this.data["DATA"]["devices"][device] && this.data["DATA"]["devices"][device]["display"])
	        			{ var remote_display     = this.data["DATA"]["devices"][device]["display"] }			
	        else if (display == "")	{ var remote_display	 = {}; }
	        else			{ var remote_display	 = display; }

		this.button_width = "100px";

		var remote = "";
		remote += "<div id='remote_json'>"; //  style='display:none;'
		remote += "<b>JSON Button Definition:</b><br/><hr/>";
		remote += this.display_json( "remote_json_buttons", remote_definition, "buttons" );
		remote += "<br/><b>JSON Display Definition:</b><br/><hr/>";
		remote += this.display_json( "remote_json_display", remote_display );
		remote += "<hr/><center>" + 
				this.button_edit(this.app_name+".device_edit_json('"+id+"','"+device+"');"+
					this.app_name+".device_remote('remote1','"+device+"','remote_json_buttons','remote_json_channel');","reset") + "&nbsp;" + 
				this.button_edit("apiDeviceJsonEdit('"+device+"','remote_json_buttons','remote_json_display');","save") +  "&nbsp;" + 
				this.button_edit(this.app_name+".device_remote('remote1','"+device+"','remote_json_buttons','remote_json_display');","preview") +
				"</center>";
		remote += "</div><hr/>";
		remote += lang("MANUAL_REMOTE");
		remote += lang("MANUAL_DISPLAY");
		
		setTextById(id,remote);
		//return remote;
		}


	// remotes for scenes
	//--------------------
	
	this.get_json_value	  = function(id,default_data) {
		element = document.getElementById(id);
		if (!element)   { return default_data; }
		try 		{ var object = JSON.parse(element.value); } 
		catch(e) 	{ alert(lang("FORMAT_INCORRECT")+": "+e); return default_data; }
		return object;
		}

	// create remote for a specific scene
	this.scene_remote         = function (id="", scene="", preview_remote="", preview_channel="") {
	    
    		var preview		= false;
		var remote            	= "";
		var remote_definition 	= [];
		var remote_channel 	= [];
		var remote_label 	= this.data["DATA"]["scenes"][scene]["label"];

		if (preview_remote == "") 	{ remote_definition = this.data["DATA"]["scenes"][scene]["remote"]; }
		else				{ remote_definition = this.get_json_value(preview_remote,this.data["DATA"]["scenes"][scene]["channel"]); preview = true; }
		if (preview_channel == "") 	{ remote_channel    = this.data["DATA"]["scenes"][scene]["channel"]; }
		else				{ remote_channel    = this.get_json_value(preview_channel,this.data["DATA"]["scenes"][scene]["channel"]); preview = true; }
		
		var makros 		= this.data["DATA"]["makros"]["makro"];
		var makros_sceneOn	= this.data["DATA"]["makros"]["scene-on"];
		var makros_sceneOff	= this.data["DATA"]["makros"]["scene-off"];
		
		rm3cookie.set("remote","scene::"+scene+"::"+remote_label);

		remote += "<div id='scene_button' style='display:block;'>";
		if (preview) { remote += "<b>Preview:</b><br/><hr/>"; }
		
		for (var i=0; i<remote_definition.length; i++) {

			var next_button	= "";
			var button 	= remote_definition[i].split("_");
			var cmd    	= button[0] + "_" + button[1];

			if (this.edit_mode) {			
				var contextmenu	     = "["+i+"] " + cmd.split("||")[0] + "<br/><br/>";		
				var link_preview    = this.app_name+".scene_remote('remote1','"+scene+"','scene_json_buttons','scene_json_channels');";
				var link_delete     = this.app_name+".remote_delete_button('scene','remote_edit2','"+scene+"','"+i+"','scene_json_buttons');";
				var link_move_left  = this.app_name+".remote_move_button('scene','remote_edit2','"+scene+"',"+i+",'scene_json_buttons','left');";
				var link_move_right = this.app_name+".remote_move_button('scene','remote_edit2','"+scene+"',"+i+",'scene_json_buttons','right');";
				
				var link_button_left = this.app_name+".remote_add_button('scene','remote_edit2','"+scene+"','add_button_"+i+"','scene_json_buttons','"+i+"');";
				var link_button_right= this.app_name+".remote_add_button('scene','remote_edit2','"+scene+"','add_button_"+i+"','scene_json_buttons','"+(i+1)+"');";
				this.button_width    = "50px;"	
				var input_add_button = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>" +
							this.button_edit( link_button_left + link_preview, "&lt; +") +
							this.button_edit( link_button_right + link_preview, "+ &gt;");

				this.button_width    = "30px;";
				if (i > 0) 			    { contextmenu += this.button_edit( link_move_left  + link_preview, "&lt;",""); }
								      contextmenu += this.button_edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length) { contextmenu += this.button_edit( link_move_right + link_preview, "&gt;",""); }
				contextmenu += input_add_button;
				}
																		
			if (button[0] == "LINE") 			{ next_button = this.line(""); }
			else if (button[0].indexOf("LINE||") == 0)	{ next_button = this.line(button[0].split("||")[1]); }
			else if (button[0] == ".") 			{ next_button = this.button_device( scene+i, ".", "", "", "disabled" ); }
			else if (button[0] == "makro")			{ next_button = this.button_makro(  cmd, button[1], "", makros[button[1]], "" ); 
									  this.active_buttons.push(cmd); }
			else if (button[0] == "scene-on")		{ next_button = this.button_makro(  "scene_on_"+button[1], "on", "", makros_sceneOn[button[1]], "" );
									  this.active_buttons.push("scene_on_"+button[1]); }
			else if (button[0] == "scene-off")		{ next_button = this.button_makro(  "scene_off_"+button[1], "off", "", makros_sceneOff[button[1]], "" );
									  this.active_buttons.push("scene_off_"+button[1]); }
			else 						{ next_button = this.button_device( cmd, button[1], "", cmd, "" );
									  this.active_buttons.push(cmd); }
									  
			if (this.edit_mode) {
				if (button[0].indexOf("LINE") == 0)		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,20); }
				else if (button[0].indexOf("DISPLAY") == 0)	{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,90); }
				else				    		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				next_button = this.button_tooltip.create( next_button, contextmenu, i );
				}

			remote += next_button;
			}

		remote += "</div>";

		setTextById(id,remote);
		}


	// create list of channels (for scenes)
	this.scene_channels       = function (id, scene) {
		// set vars
		var remote   = "";
		var makros   = this.data["DATA"]["scenes"][scene]["channel"];
		var channels = Object.keys(this.data["DATA"]["scenes"][scene]["channel"]);
		channels     = channels.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});

		this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,"80px",35);

    		// create list of channel buttons
    		for (var i=0; i<channels.length; i++) {
        		var cmd   	= "channel_"+i; //channels[i];
			var next_button	= this.button_channel(cmd, channels[i], makros[channels[i]],"","");
			var contextmenu = "["+i+"] " + cmd +  "<br/><br/><i>" + lang("CHANNEL_USE_JSON") +"</i>";
			
			if (this.edit_mode) {
				next_button = this.button_tooltip.create( next_button, contextmenu, "channel_"+i );
				}
			
			remote         += next_button;
        		}

		// print
		setTextById(id,remote);
		}

	// write description for device remote
	this.scene_description   = function (id, scene) {
		var label = this.data["DATA"]["scenes"][scene]["label"];
		var descr = this.data["DATA"]["scenes"][scene]["description"];
		var url   = this.data["DATA"]["scenes"][scene]["url"];
		if (url) { descr = "<a href=\""+url+"\" target='_blank'>"+descr+"</a>"; }
		var str   = "<center>" + label + ": " + descr + "</center>";
		setTextById(id,str);
		}


	// edit scene
	this.scene_edit           = function (id, scene) {
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"scene_edit"); return; }
	        
	        this.button_width = "120px";
		this.input_width  = "180px";

		var link_template = this.app_name+".remote_import_templates('scene','remote_edit2','"+scene+"','add_template','scene_json_buttons');";
		var link_preview  = this.app_name+".scene_remote('remote1','"+scene+"','scene_json_buttons','scene_json_channel');";
		var remote        = "";
		
		remote  += "<center><b>Edit &quot;"+this.data["DATA"]["scenes"][scene]["label"]+"&quot;</b> ["+scene+"]</center>";
		remote  += "<hr/>";

		remote  += this.tab_row("start");
		remote  += this.tab_row( "Label:",       	this.input("edit_label",	this.data["DATA"]["scenes"][scene]["label"]) );
		remote  += this.tab_row( "Description:&nbsp;", 	this.input("edit_description",	this.data["DATA"]["scenes"][scene]["description"]) );
		remote  += this.tab_row( "&nbsp;",		this.button_edit("apiSceneEdit('"+scene+"','edit','description,label');","save changes","") );
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");
		remote  += this.tab_row(
				"<input id='scene_visibility' value='"+this.data["DATA"]["scenes"][scene]["visible"]+"' style='display:none;'>"+
				this.button_edit("apiRemoteChangeVisibility('scene','"+scene+"','scene_visibility');","show / hide") + "&nbsp;" +
				this.button_edit("apiSceneDelete('"+scene+"');","delete scene","")
				);
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");
		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit(this.app_name+".remote_add_button('scene','remote_edit2','"+scene+"','add_button','scene_json_buttons');" + link_preview,"add button","")
				);
		remote  += this.tab_row(
				this.button_select("del_button",scene),
				this.button_edit(this.app_name+".remote_delete_button('scene','remote_edit2','"+scene+"','del_button','scene_json_buttons');" + link_preview, "delete button","")
				);
		remote  += this.tab_row(
				this.template_select("add_template","template",this.templates),
				this.button_edit(link_template + link_preview,"clone template","")
				);
		remote  += this.tab_row("end") + "<hr/>" + this.tab_row("start");
		remote  += this.tab_row("Devices:&nbsp;&nbsp;", 	JSON.stringify(this.data["DATA"]["scenes"][scene]["devices"]));
		remote  += this.tab_row("Remote:&nbsp;&nbsp;", 		this.data["DATA"]["scenes"][scene]["config_scene"]+".json" );
		remote  += this.tab_row("end");

	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		setTextById(id,remote);
		}


	// create edit panel to edit JSON data
	this.scene_edit_json	  = function (id,scene,remote="",channel="") {
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"scene_edit_json"); return; }
	        
	        if (remote == "") 	{ var scene_definition 	= this.data["DATA"]["scenes"][scene]["remote"]; }
	        else			{ var scene_definition 	= remote; }
	        if (channel == "")	{ var scene_channel 	= this.data["DATA"]["scenes"][scene]["channel"]; }
	        else			{ var scene_channel	= channel; }

		this.button_width = "100px";

		var remote = "";
		remote += "<div id='scene_json'>"; //  style='display:none;'
		remote += "<b>JSON Button Definition:</b><br/><hr/>";
		remote += this.display_json( "scene_json_buttons", scene_definition, "buttons" );
		remote += "<br/><b>JSON Channel Definition:</b><br/><hr/>";
		remote += this.display_json( "scene_json_channel", scene_channel, "channels"  );
		remote += "<br/><b>JSON Required Devices:</b><br/><hr/>";
		remote += "Devices:&nbsp;&nbsp;" + this.input("scene_json_devices", JSON.stringify(this.data["DATA"]["scenes"][scene]["devices"]))+"<br/><br/>";
		remote += "<hr/><center>" + 
				this.button_edit(this.app_name+".scene_edit_json('"+id+"','"+scene+"');"+
					this.app_name+".scene_remote('remote1','"+scene+"','scene_json_buttons','scene_json_channel');","reset") + "&nbsp;" + 
				this.button_edit("apiSceneJsonEdit('"+scene+"','scene_json_buttons','scene_json_channel','scene_json_devices');","save","") + "&nbsp;" +
				this.button_edit(this.app_name+".scene_remote('remote1','"+scene+"','scene_json_buttons','scene_json_channel');","preview") +
				"</center>";
		remote += "<hr/>";
		remote += lang("MANUAL_SCENE");
		remote += lang("MANUAL_CHANNEL");
		remote += lang("MANUAL_DEVICES");
		
		remote += "</div>";			

		setTextById(id,remote);
		}


	// edit remote in browser (JSON)
	//--------------------------------

	// add button to JSON	
	this.remote_add_button	  = function (type,id,scene,button,remote,position="") {
	
		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "") { rm3msg.alert(lang("BUTTON_INSERT_NAME")); return; }
		
		var value     = this.get_json_value(remote);
		var value_new = [];
		
		for (var i=0;i<value.length;i++) {
			if (i == position && position != "") { value_new.push(button); }
			value_new.push(value[i]);
			}
		if (position == "") { value_new.push(button); }

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new,channel=""); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new,display=""); }
		}
	
	// delete button from JSON
	this.remote_delete_button = function (type,id,scene,button,remote) {

		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "") { rm3msg.alert(lang("BUTTON_SELECT")); return; }
		
		value     = this.get_json_value(remote);
		value_new = [];
		for (var i=0;i<value.length;i++) {
			if (i != button) { value_new.push(value[i]); }
			}

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new,channel=""); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new,display=""); }
		}
	
	// move button in JSON (left or right)
	this.remote_move_button	  = function (type,id,scene,button,remote,left_right) {

		value     = this.get_json_value(remote);
		
		var temp = value[button];
		if (left_right == "left")  { if (button > 0)		{ var target = button - 1; value[button] = value[target]; value[target] = temp; } }
		if (left_right == "right") { if (button < value.length) { var target = button + 1; value[button] = value[target]; value[target] = temp; } }
		
		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value,channel=""); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value,display=""); }
		}
	
	// import remote definition from template to JSON
	this.remote_import_templates = function (type,id,scene,template,remote) {
		value      = getValueById(template);
		if (value == "") { rm3msg.alert(lang("DEVICE_SELECT_TEMPLATE")); return; }
		value_new  = this.data["DATA"]["templates"][value]["remote"];
		
		if (type == "scene") {
			for (var i=0;i<value_new.length;i++) {
				if (value_new[i] != "." && value_new[i].indexOf("DISPLAY") < 0 && value_new[i].indexOf("LINE") < 0 && value_new[i].indexOf("_") < 0) {
					value_new[i] = "XXXX_"+value_new[i];
					}
				}
			}

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new,channel=""); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new,display=""); }
		}


	// show hide edit mode for remotes
	//--------------------

	this.remoteToggleEditMode = function () {
	
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		
                this.create();
		}


	// specific drop downs
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
        
        this.command_select_record = function (id,device="") {
               	var list = {};
		var device_buttons    = [];		
                if (device != "" && device in this.data["DATA"]["devices"]) {
                
                	var button_list = [];
                	for (var i=0;i<this.data["DATA"]["devices"][device]["remote"].length;i++) {
				button_list.push(this.data["DATA"]["devices"][device]["remote"][i]);
				}
			button_list.sort();
			
			for (var i=0;i<button_list.length;i++) {
				if (button_list[i].includes("LINE") == false && button_list[i] != "." && button_list[i].includes("DISPLAY") == false) {
	                                list[i] = button_list[i];
	                                }
				}
			}
                return this.select(id,"button",list);
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
			
                if (device != "" && device in this.data["DATA"]["scenes"]) {
                
			button_list = this.data["DATA"]["scenes"][device]["remote"];
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
                
	// create basic inputs
	//--------------------------------

	// input for text
        this.input                = function (id,value="")   { return "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;' value='"+value+"'>"; }

	// select for different data 
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

        // write line with text ... 
	this.line		  = function (text="") {
          	var remote = "";
		remote += "<div class='remote-line'><hr/>";
		if (text != "") { remote += "<div class='remote-line-text'>&nbsp;"+text+"&nbsp;</div>"; }
		remote += "</div>";
		return remote;
		}

	// create display
	//--------------------------------
        // show display with informations
        this.display              = function (id, device, style="" ) {
        
		var display_data = {}		
		var status_data  = this.data["DATA"]["devices"][device]["status"];
		var connected    = this.data["DATA"]["devices"][device]["connected"].toLowerCase();
		
		if (this.data["DATA"]["devices"][device]["display"])	{ display_data = this.data["DATA"]["devices"][device]["display"]; }
		else							{ display_data["Error"] = "No display defined"; } 

        	var text    = "";
        	var display = "";
        	
		if (connected != "connected") {
			text += "<center><b>device not connected</b>:</center><br/>";
			text += "<center><i>"+status_data["api-status"]+"</i></center>";
			style += " display_error";
			}
        	else if (status_data["power"] == "ON" || status_data["power"] == "on") {
	        	for (var key in display_data) {
        			var label = "<data class='display-label'>"+key+":</data>";
				var input = "<data class='display-input' id='display_"+device+"_"+display_data[key]+"'>no data</data>";
		        	text += "<div class='display-element "+style+"'>"+label+input+"</div>";
		        	}
		        }
		else if (status_data["power"].indexOf("OFF") >= 0 || status_data["power"].indexOf("off") >= 0) {
			text  += "<center>power off</center>";
			style += " display_off";
			}
        	display += "<button class=\"display "+style+"\" onclick=\"" + this.app_name + ".display_alert('"+id+"','"+device+"','"+style+"');\">";
        	display += text;
        	display += "</button>";
        	return display;
        	}
        	
        // display all information
        this.display_alert        = function (id, device, style="" ) {
        
		var display_data = [];
		if (this.data["DATA"]["devices"][device]["query_list"])	{ display_data = this.data["DATA"]["devices"][device]["query_list"]; }
		else								{ display_data = ["ERROR","No display defined"]; } 

		var power = this.data["DATA"]["devices"][device]["status"];
        	var text  = "Device Information: "+device +"<hr/>";
        	text  += "<div style='width:100%;height:200px;overflow-y:scroll;'>";
		text  += "<center id='display_full_"+device+"_power'>"+power+"</center><hr/>";        		
        	text  += this.tab_row("start","100%");
        	
        	console.log(device);
        	console.log(this.data["DATA"]["devices"][device]["status"]);
        	console.log(this.data["DATA"]["devices"][device]["query_list"]);
        	console.log(display_data);

        	for (var i=0; i<display_data.length; i++) {
        		if (display_data[i] != "power") {
	        		var label = "<data class='display-label'>"+display_data[i]+":</data>";
				var input = "<data class='display-input' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>";
		        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
		        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
		        	}
	        	}
        	text  += this.tab_row("end");
        	text  += "</div>";
		rm3msg.confirm(text,"",300);
		statusCheck(this.data);
        	}
        	
        // idea ... display for media information: mute (icon), volume (bar), info (title/artist/album/episode/...)
        // see: https://www.wbrnet.info/vbhtm/9261_Laufschriften_I.html

        this.display_mediainfo   = function (id, device, style="") {
                	
        	var display      = "";
		var status_data  = this.data["DATA"]["devices"][device]["status"];
        	
        	return display;
        	}
        	
        // show json for buttons in text field
        this.display_json	  = function ( id, json, format="" ) {
        
        	var text = "";
        	text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:320px;height:160px;\">";
        	if (format == "buttons") {
	        	var x=0;
	        	text += "[\n";
        		for (var i=0;i<json.length;i++) {
        			x++;
        			text += "\""+json[i]+"\"";
        			if (i+1 < json.length)						{ text += ", "; }
        			if (Number.isInteger((x)/4))   					{ text += "\n"; x = 0; }
        			if (json.length > i+1 && json[i+1].includes("LINE") && x > 0)	{ text += "\n"; x = 0; }
        			if (json[i].includes("LINE"))					{ text += "\n"; x = 0; }
        			}
	        	text += "\n]";
        		}
        	else if (format == "channels") {
        		json = JSON.stringify(json);
        		json = json.replace( /],/g, "],\n" );
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
          
          
	// create buttons & inputs
	//--------------------

	// standard button with option to left and right click
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

	// button edit mode		
        this.button_edit          = function (onclick,label,disabled="") {
        	var style = "width:" + this.button_width + ";margin:1px;";
        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

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

	        var device_button	= cmd.split("_");
		var label2		= this.button_image( label, style );
		if (label == ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }
	        
	        var button = this.button( id, label2[0], label2[1], 'apiButtonAdd("'+device_button[0]+'","'+device_button[1]+'");', disabled );
	        //var button = this.button( id, label2[0], label2[1], ['apiButtonAdd("'+device_button[0]+'","'+device_button[1]+'");', this.app_name + '.button_tooltip.toggleAll("' + cmd + '");'], disabled );
	        //button     = this.button_tooltip.create( button, "not implemented yet: " +cmd, cmd );
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
        	else {	return this.button( id, label, style+" notfound", "", "disabled" );
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

	// return list of buttons for a device
	this.button_list          = function (device) {
		if (this.data["DATA"]["devices"][device]) 	{ return this.data["DATA"]["devices"][device]["button_list"]; }
		else						{ return ["error:"+device]; }
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

	// handle messages for console
	this.log                  = function (msg) {
		console.log(this.app_name + ": " + msg);
		}

	// ensure, that all elements are visible and settings are hidden
	this.show                 = function (device="") {

		statusCheck(this.data);			// ... check if part of class ...
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

	this.tab_line	  	  = function(text="") {
		return "<tr><td colspan='2'><hr/></td></tr>";
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
