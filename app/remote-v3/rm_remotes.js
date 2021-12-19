//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------
/* INDEX:
function rmRemote(name)
	this.init                 = function (data)
	this.create               = function (type="", rm_id="")
	this.device_remote        = function (id="", device="", preview_remote="", preview_display="", preview_display_size="")
	this.device_description   = function (id, device)
	this.device_notused       = function (id, device, preview_remote="")
	this.device_notused_showhide = function ()
	this.device_edit          = function (id, device)
	this.device_edit_json	  = function (id, device, remote="", display="", displaysize="")
	this.get_json_value	  = function (id, default_data)
	this.scene_remote         = function (id="", scene="", preview_remote="", preview_display="", preview_display_size="")
	this.scene_channels       = function (id, scene, preview_channel="")
		channels = channels.sort(function (a, b)
	this.scene_description   = function (id, scene)
	this.scene_edit           = function (id, scene)
	this.scene_edit_json	  = function (id,scene,remote="",channel="",display="", displaysize="")
	this.remote_add_display	  = function (type,id,scene,button,remote,position="")
	this.remote_add_line	  = function (type,id,scene,button,remote,position="")
	this.remote_add_slider	  = function (type,id,scene,button,remote,position="")
	this.remote_add_colorpicker  = function (type,id,scene,button,remote,position="")
	this.remote_add_button	  = function (type,id,scene,button,remote,position="")
	this.remote_delete_button = function (type,id,scene,button,remote)
	this.remote_move_button	  = function (type,id,scene,button,remote,left_right)
	this.remote_import_templates = function (type,id,scene,template,remote)
	this.remoteToggleEditMode = function ()
	this.command_select       = function (id,device="")
	this.command_select_record = function (id,device="")
	this.button_select		= function (id,device="")
	this.template_select      = function (id,title,data,onchange="")
	this.scene_button_select	= function (div_id,id,device)
	this.input                = function (id,value="")
	this.select               = function (id,title,data,onchange="",selected_value="")
	this.line		  = function (text="")
	this.colorPicker              = function (id, device, type="devices", data)
	this.slider_element      = function (id, device, type="devices", data)
	this.display              = function (id, device, type="devices", style="", display_data={})
	this.display_sizes       = function ()
	this.display_alert        = function (id, device, type="", style="" )
	this.display_mediainfo   = function (id, device, style="")
	this.display_json	  = function ( id, json, format="" )
        this.template_list	= function(type="")
	this.button               = function (id, label, style, script_apiCommandSend, disabled )
	this.button_edit          = function (onclick,label,disabled="")
	this.button_device        = function (id, label, device, style, cmd, disabled )
	this.button_device_keyboard   = function (id, label, device, style, cmd, disabled )
	this.button_device_add    = function (id, label, device, style, cmd, disabled )
	this.button_makro         = function (id, label, scene, style, makro, disabled )
	this.button_channel       = function (id, label, scene, makro, style, disabled="")
	this.button_image         = function (label,style)
	this.button_list          = function (device)
	this.empty               = function (id,comment="")
	this.show                = function (device="")
	this.tab_row             = function (td1,td2="")
	this.tab_line	  	  = function (text="")
function writeMakroButton ()
*/
//--------------------------------


function rmRemote(name) {

	this.data           = {};
	this.templates      = {};
	this.app_name       = name;
	this.active_name    = "";
	this.active_type    = "";
	this.active_buttons = [];
	this.edit_mode      = false;
	this.initial_load   = true;
	this.loaded_remote  = [];
	
	this.keyboard       = new rmRemoteKeyboard(name+".keyboard");
	this.color_picker   = new rmColorPicker(name+".color_picker");
	this.slider         = new rmSlider(name+".slider");
	this.logging        = new jcLogging(this.app_name);
	this.button_tooltip = new jcTooltip(this.app_name + ".button_tooltip");

	// load data with devices (deviceConfig["devices"])
	//--------------------

	this.init                 = function (data) {
	
		if (data["DATA"]) {
			this.data           = data;
        	        this.templates      = data["DATA"]["template_list"];
        	        }
        	else { return; }
                
                if (this.initial_load) { 
			this.tooltip_mode     = "onmouseover";
			this.tooltip_width    = "140px";
			this.tooltip_height   = "140px";
			this.tooltip_distance = 47;

			this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance);
	                
                	this.logging.default("Initialized new class 'rmRemotes'.");
                	this.inital_load = false;
                	}
                else {	this.logging.default("Reload data 'rmRemotes'.");
                	}
		}


	// create complete remote setup (for scenes and devices)
	//--------------------
	this.create               = function (type="", rm_id="") {
	
	        if (type == "")   { type  = this.active_type; }
	        if (rm_id == "")  { rm_id = this.active_name; }
	        
		if ("DATA" in this.data == false) {
			this.logging.warn("Data not loaded yet.");
			return;
			}
		if (rm_id != "" && this.data["DATA"]["devices"][rm_id] == undefined && this.data["DATA"]["scenes"][rm_id] == undefined) {
			this.logging.warn("Remote ID "+rm_id+" not found.");
			appCookie.set("remote",""); //device::"+device+"::"+remote_label);
			return;
			}
			

		// set active remote (type, id)
		this.active_name    = rm_id;
		this.active_type    = type;
		this.active_buttons = [];
		this.keyboard.set_device(this.active_name);
		this.color_picker.set_device(this.active_name);

		rm3start.active     = "start";
		startActive         = false;
		
		// format frame1, frame2 for edit mode
		document.getElementById("frame1").className = "setting_bg";
		document.getElementById("frame2").className = "setting_bg";
		
		if (type == "device") {

			// set vars
			this.logging.default("Write Device Remote Control: " + rm_id);

			// create remote for device
			this.device_remote("frame3",rm_id);
			this.device_description("frame4",rm_id);
			this.device_notused("frame5",rm_id);
			
			// create edit panels
      			this.device_edit("frame1",rm_id);
      			this.device_edit_json("frame2",rm_id);

			// show
			this.show(rm_id);
			}
		else if (type == "scene") {

			// set vars
			this.logging.default("Write Scene Remote Control: " + rm_id);

			// create remote for scene
			this.scene_remote("frame3",rm_id);
			this.scene_description("frame4",rm_id);
			this.scene_channels("frame5",rm_id);

			// create edit panels
			this.scene_edit("frame1",rm_id);
			this.scene_edit_json("frame2",rm_id);

			// show
			this.show();
			}
		else {
			startActive = true;
			}
			
		this.loaded_remote  = [type,rm_id];
		rm3menu.menu_height();	
		}

	// remotes for devices
	//--------------------

	// create remote for a specific device
	this.device_remote        = function (id="", device="", preview_remote="", preview_display="", preview_display_size="") {

		var preview	       = false;	
		var remote             = "<div id='remote_button' display='block'>";
		
		if (!this.data["DATA"]["devices"][device]["remote"]) {
			appMsg.alert(lang("MISSING_DATA",[device,this.data["DATA"]["devices"][device]["config"]["remote"]+".json",this.data["DATA"]["devices"][device]["config"]["device"]+".json"]));
			}

		var remote_displaysize = this.data["DATA"]["devices"][device]["remote"]["display-size"];
		var remote_label       = this.data["DATA"]["devices"][device]["settings"]["label"];
		var remote_buttons     = this.data["DATA"]["devices"][device]["interface"]["button_list"];
		var remote_definition  = [];
		var remote_display     = {};
		
		if (preview_remote == "") 	 { remote_definition = this.data["DATA"]["devices"][device]["remote"]["remote"]; }
		else				 { remote_definition = this.get_json_value(preview_remote,this.data["DATA"]["devices"][device]["remote"]["remote"]); preview = true; }
		if (preview_display == "") 	 { remote_display    = this.data["DATA"]["devices"][device]["remote"]["display"]; }
		else				 { remote_display    = this.get_json_value(preview_display,this.data["DATA"]["devices"][device]["remote"]["display"]); preview = true; }
		if (this.data["DATA"]["devices"][device]["remote"]["display-size"] == undefined) {  remote_displaysize = "middle"; }
		if (preview_display_size != "") { remote_displaysize = check_if_element_or_value(preview_display_size); }
		
		appCookie.set("remote","device::"+device+"::"+remote_label);
		if (preview) { remote += "<b>Preview:</b><br/><hr/>"; }

		for (var i=0; i<remote_definition.length; i++) {

			var next_button;
			var button  	= remote_definition[i];
			var cmd     	= device + "_" + button;

			if (this.edit_mode) {			
				var contextmenu	     = "["+i+"] " + cmd.split("||")[0] + "<br/><br/>";		
				var link_preview     = this.app_name+".device_remote('frame3','"+device+"','remote_json_buttons','remote_json_display');";
				link_preview        += this.app_name+".device_notused('frame5','"+device+"');";
				
				var link_delete      = this.app_name+".remote_delete_button('device','frame2','"+device+"','"+i+"','remote_json_buttons');";
				var link_move_left   = this.app_name+".remote_move_button('device','frame2','"+device+"',"+i+",'remote_json_buttons','left');";
				var link_move_right  = this.app_name+".remote_move_button('device','frame2','"+device+"',"+i+",'remote_json_buttons','right');";
				var link_button_left = this.app_name+".remote_add_button('device','frame2','"+device+"','add_button_"+i+"','remote_json_buttons','"+i+"');";
				var link_button_right= this.app_name+".remote_add_button('device','frame2','"+device+"','add_button_"+i+"','remote_json_buttons','"+(i+1)+"');";
				this.button_width    = "50px;"	
				var input_add_button = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>" +
							this.button_edit( link_button_left + link_preview, "&lt; +") +
							this.button_edit( link_button_right + link_preview, "+ &gt;");

				this.button_width    = "30px;";
				if (i > 0) 			    	{ contextmenu += this.button_edit( link_move_left  + link_preview, "&lt;",""); }
									  contextmenu += this.button_edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length)	{ contextmenu += this.button_edit( link_move_right + link_preview, "&gt;",""); }
				contextmenu += input_add_button;
				}
						
			if (button == "LINE")	 			{ next_button = this.line(""); }
			else if (button.indexOf("LINE||") == 0) 	{ next_button = this.line(button.split("||")[1]); }
			else if (button.indexOf("SLIDER") == 0) 	{ next_button = this.slider_element(id, device, "devices", button.split("||")); }
			else if (button == ".") 			{ next_button = this.button_device( device+i, ".", device, "empty", "", "disabled" ) }
			else if (button == "DISPLAY")			{ next_button = this.display(id, device, "devices", remote_displaysize, remote_display); }
			else if (button.indexOf("COLOR-PICKER") == 0)	{ next_button = this.colorPicker(id, device, "devices", remote_displaysize, remote_display); }
			else if (button == "keyboard")		{ next_button = this.button_device_keyboard( cmd, button, device, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (remote_buttons.includes(button)) 	{ next_button = this.button_device( cmd, button, device, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (this.edit_mode)         		{ next_button = this.button_device_add( cmd, button, device, "notfound", cmd, "" ); }
			else                            		{ next_button = this.button_device( cmd, button, device, "notfound", cmd, "disabled" ); }

			if (this.edit_mode) {
				if (button.indexOf("LINE") == 0)		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,20); }
				else if (button.indexOf("DISPLAY") == 0)	{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,90); }
				else if (button.indexOf("COLOR-PICKER") == 0)	{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,90); }
				else				    		{ this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				next_button = this.button_tooltip.create( next_button, contextmenu, i );
				}

			remote += next_button;
			}
		remote += "</div>";

		// --------------------------- test send text ----
		
		remote += this.keyboard.input();
		
		// --------------------------- test send text ----
		//remote += this.device_remote_json(id,device,remote_definition,remote_display);
		
		setTextById(id,remote);
		}

	// write description for device remote
	this.device_description   = function (id, device) {
		var label = this.data["DATA"]["devices"][device]["settings"]["label"];
		var descr = this.data["DATA"]["devices"][device]["settings"]["description"];
		var url   = this.data["DATA"]["devices"][device]["settings"]["url"];
		if (url) { descr = "<a href=\""+url+"\" target='_blank'>"+descr+"</a>"; }
		
		var str = "";
		//str    += "<marquee scrollamount='5' scrolldelay='5'>Dieser Text wird ziemlich schnell bewegt...</marquee>";
		str    += "<media-info id='media_info'></media-info>";
		str    += "<center>" + label + ": " + descr + "</center>";
		
		setTextById(id,str);
		}


	// create list of buttons not used in RM definition (for devices)
	this.device_notused       = function (id, device, preview_remote="") {

		var remote            = "";
		var notused           = [];
		this.button_width     = "120px";

		var link_preview      = this.app_name+".device_remote('frame3','"+device+"','remote_json_buttons','remote_json_display');";
		link_preview         += this.app_name+".device_notused('"+id+"','"+device+"');";
		var device_buttons    = this.data["DATA"]["devices"][device]["interface"]["button_list"];
		if (preview_remote == "") 	{ remote_buttons = this.data["DATA"]["devices"][device]["remote"]["remote"]; }
		else				{ remote_buttons = this.get_json_value(preview_remote, this.data["DATA"]["devices"][device]["remote"]["remote"]); preview = true; }
		
		
		// show not used buttons if edit mode
		if (this.edit_mode)	{ display = "block"; sign    = "−"; }
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
			next_button = this.button_device( "not_used"+i, button, device, "", cmd, "" );
			
			if (this.edit_mode) {
				var link_add    = this.app_name+".remote_add_button('device', 'frame2', '"+device+"', 'not_used_"+i+"', 'remote_json_buttons');";
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
		if (element.style.display == "block")	{ element.style.display = "none";  button.innerHTML = "+"; }
		else					{ element.style.display = "block"; button.innerHTML = "−"; }
		}

	// edit panel per remote ...
	this.device_edit          = function (id, device) {

	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		var link_template = this.app_name+".remote_import_templates('device','frame2','"+device+"','add_template','remote_json_buttons');";
		var link_preview  = this.app_name+".device_remote('frame3','"+device+"','remote_json_buttons','remote_json_display');"
		link_preview     += this.app_name+".device_notused('frame5','"+device+"');";
		var remote        = "";
		
		var device_data       = this.data["DATA"]["devices"][device];
		var remote_buttons    = device_data["remote"];
		var remote_visible    = device_data["settings"]["visible"];
		var remote_display    = device_data["remote"]["display"];
		var device_commands   = device_data["interface"]["button_list"];
		var device_buttons    = [];
		
		for (var i=0;i<device_data["remote"].length;i++) {
		        var button = device_data["remote"][i];
			if (device_buttons.indexOf(button) < 0) { device_buttons.push(button); }
			}
		device_buttons.sort();

		this.input_width      = "180px";
		this.button_width     = "120px";

		remote  += "<center><b>Edit &quot;"+device_data["settings"]["label"]+"&quot;</b> ["+device+"]</center>";

		remote  += this.tab_row("start","100%");
		remote  += this.tab_line();
		remote  += this.tab_row( "Description:&nbsp;", 	this.input("edit_description", device_data["settings"]["description"]) );
		remote  += this.tab_row( "Label:",       		this.input("edit_label",	device_data["settings"]["label"]) );
		remote  += this.tab_row( "&nbsp;",			this.button_edit("apiDeviceEdit('"+device+"','edit','description,label,interface,method');","save changes") );
		remote  += this.tab_line();	
		remote  += this.tab_row("end");
		remote  += this.tab_row("start","100%");
		remote  += this.tab_row(
				"<input id='remote_visibility' value='"+remote_visible+"' style='display:none;'>"+
				this.button_edit("apiRemoteChangeVisibility('remote','"+device+"','remote_visibility');","show / hide") + "&nbsp;" +
				this.button_edit("apiDeviceDelete('"+device+"');","delete device")
				);		
		remote  += this.tab_line();

		if (device != this.data["CONFIG"]["main-audio"] && device_data["status"]["vol"] != undefined) 
										{ remote  += this.tab_row(lang("AUDIO_SET_AS_MAIN",[this.data["CONFIG"]["main-audio"]]),this.button_edit("setMainAudio('"+device+"');","set main device","")); }
		else if (device == this.data["CONFIG"]["main-audio"]) 	{ remote  += this.tab_row(lang("AUDIO_IS_MAIN"),false); }
		else 								{ remote  += this.tab_row(lang("AUDIO_N/A_AS_MAIN"),false); }

		remote  += this.tab_line();
		remote  += this.tab_row(
				this.input("add_button"),
				this.button_edit(this.app_name+".remote_add_button('device','frame2','"+device+"','add_button','remote_json_buttons');" + link_preview, "add button","")
				);
		remote  += this.tab_row(
				this.input("add_line_text"),
				this.button_edit(this.app_name+".remote_add_line('device','frame2','"+device+"','add_line_text','remote_json_buttons');" + link_preview,"add line with text","")
				);
		remote  += this.tab_row(
				this.input("add_slider_text","send-command||description||min-max||parameter"),
				this.button_edit(this.app_name+".remote_add_slider('device','frame2','"+device+"','add_slider_text','remote_json_buttons');" + link_preview,"add slider","")
				);
		remote  += this.tab_row(
				this.input("add_colorpicker_text","send-command"),
				this.button_edit(this.app_name+".remote_add_colorpicker('device','frame2','"+device+"','add_colorpicker_text','remote_json_buttons');" + link_preview,"add color picker","")
				);
		remote  += this.tab_row(
				this.button_edit(this.app_name+".remote_add_display('device','frame2','"+device+"','DISPLAY','remote_json_buttons');" + link_preview,"add display",""),
				this.button_edit(this.app_name+".remote_add_button('device','frame2','"+device+"','.','remote_json_buttons');" + link_preview,"add empty field","")
				);
		remote  += this.tab_line();
		remote  += this.tab_row(
				this.button_select("del_button",device),
				this.button_edit(this.app_name+".remote_delete_button('device','frame2','"+device+"','del_button','remote_json_buttons');" + link_preview, "delete button","")
				);
		var templates = this.template_list("device");
		remote  += this.tab_row(
				this.template_select("add_template","template",templates),
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
		if (this.data["DATA"]["devices"][device]["method"] == "record") {
			remote  += this.tab_row(		
				this.command_select_record("rec_button",device),
				this.button_edit("apiCommandRecord('"+device+"','rec_button');","record command")
				);
			remote  += this.tab_row( "<small>Undefined buttons are colored blue. Click to record an IR command for those buttons.</small>", false);
			}
		remote  += this.tab_row(
				this.command_select("del_command",device),
				this.button_edit("apiCommandDelete('"+device+"','del_command');","delete command")
				);
		remote  += this.tab_line();
		remote  += this.tab_row("end");
		remote  += this.tab_row("start","100%");
		remote  += this.tab_row( "Interface 1:&nbsp;",	device_data["config"]["interface_api"] + " (" + device_data["interface"]["method"] + ")" );
		remote  += this.tab_row( "Interface 2:&nbsp;",	device_data["config"]["interface_dev"] );
		remote  += this.tab_row( "Device:",   	device_data["config"]["device"]+".json" );
		remote  += this.tab_row( "Remote:",   	device_data["config"]["remote"]+".json" );
		remote  += this.tab_row("end");
		
		this.logging.default(device_data);
			
		setTextById(id,remote);
		}

	// create edit panel to edit JSON data
	this.device_edit_json	  = function (id, device, remote="", display="", displaysize="") {
	
	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"remote_edit_json"); return; }
	        
	        if (remote == "") 	{ var remote_definition  = this.data["DATA"]["devices"][device]["remote"]["remote"]; }
	        else			{ var remote_definition  = remote; }
	        
	        if (display != "")		{ var remote_display	 = display; }
	        else if (this.data["DATA"]["devices"][device] && this.data["DATA"]["devices"][device]["remote"]["display"])
	        				{ var remote_display    = this.data["DATA"]["devices"][device]["remote"]["display"] }			
	        else 				{ var remote_display	 = {}; }

	        if (displaysize != "")	{ var remote_displaysize = displaysize; }
	        else if (this.data["DATA"]["devices"][device] && this.data["DATA"]["devices"][device]["remote"]["display-size"])
	        				{ var remote_displaysize = this.data["DATA"]["devices"][device]["remote"]["display-size"]; }			
	        else 				{ var remote_displaysize = ""; }

		this.button_width = "100px";
		var display_sizes = this.display_sizes();
		var device_info   = this.data["DATA"]["devices"][device]["settings"];

		var remote = "";
		remote  += "<center><b>Edit &quot;"+device_info["label"]+"&quot;</b> ["+device+"]</center>";

		remote  += this.tab_row("start","100%");
		remote  += this.tab_line();
		remote  += this.tab_row("end");

		remote += "<div id='remote_json'>"; //  style='display:none;'
		remote += "<b>Button Definition:</b><br/><hr/>";
		remote += this.display_json( "remote_json_buttons", remote_definition, "buttons" );
		remote += "<br/><b>Display Definition:</b><br/><hr/>";
		remote += this.display_json( "remote_json_display", remote_display );
		remote += "<br/><b>Display size:</b><br/><br/>";
		remote += this.select("remote_display_size","display size", display_sizes, "", remote_displaysize);
		remote += "<br/><br/>";
		remote += "<center>" + 
				this.button_edit(this.app_name+".device_edit_json('"+id+"','"+device+"');"+
				this.app_name+".device_remote('frame3','"+device+"','remote_json_buttons','remote_json_channel');"+this.app_name+".device_notused('frame5','"+device+"','remote_json_buttons');","reset") + "&nbsp;" + 
				this.button_edit("apiDeviceJsonEdit('"+device+"','remote_json_buttons','remote_json_display','remote_display_size');","save") +  "&nbsp;" + 
				this.button_edit(this.app_name+".device_remote('frame3','"+device+"','remote_json_buttons','remote_json_display','remote_display_size');"+this.app_name+".device_notused('frame5','"+device+"','remote_json_buttons');","preview") +
				"</center>";
		remote += "</div><br/>";
		remote += "<hr style='border:1px solid white;'/><br/>";
		remote += lang("MANUAL_REMOTE");
		remote += lang("MANUAL_DISPLAY");
		
		setTextById(id,remote);
		//return remote;
		}


	// remotes for scenes
	//--------------------
	
	this.get_json_value	  = function (id, default_data) {
		element = document.getElementById(id);
		this.logging.debug("get_json_value: "+id);
		
		if (!element)	{ return default_data; }
		try 		{ var object = JSON.parse(element.value); } 
		catch(e) 	{ alert(lang("FORMAT_INCORRECT")+": "+e); return default_data; }
		this.logging.debug(object);
		return object;
		}



	// create remote for a specific scene
	this.scene_remote         = function (id="", scene="", preview_remote="", preview_display="", preview_display_size="") {
	    
    		var preview		= false;
    		var scene_definition   = this.data["DATA"]["scenes"][scene];
		var remote            	= "";
		var remote_definition 	= [];
		var remote_channel 	= [];
		var remote_label 	= scene_definition["settings"]["label"];
		var remote_displaysize = scene_definition["remote"]["display-size"];

		if (preview_remote == "")	{ remote_definition = scene_definition["remote"]["remote"]; }
		else				{ remote_definition = this.get_json_value(preview_remote, scene_definition["remote"]["channel"]); preview = true; }
		if (preview_display == "")	{ remote_display    = scene_definition["remote"]["display"]; }
		else				{ remote_display    = this.get_json_value(preview_display,scene_definition["remote"]["display"]); preview = true; }
		if (scene_definition["remote"]["display-size"] == undefined) {  remote_displaysize = "middle"; }
		if (preview_display_size != "") { remote_displaysize = check_if_element_or_value(preview_display_size); }
		
		var makros 		= this.data["DATA"]["makros"]["makro"];
		var makros_sceneOn	= this.data["DATA"]["makros"]["scene-on"];
		var makros_sceneOff	= this.data["DATA"]["makros"]["scene-off"];
		
		appCookie.set("remote","scene::"+scene+"::"+remote_label);

		remote += "<div id='scene_button' style='display:block;'>";
		if (preview) { remote += "<b>Preview:</b><br/><hr/>"; }
		
		for (var i=0; i<remote_definition.length; i++) {

			var next_button	= "";
			var button 	= remote_definition[i].split("_");
			var cmd    	= button[0] + "_" + button[1];

			if (this.edit_mode) {			
				var contextmenu	     = "["+i+"] " + cmd.split("||")[0] + "<br/><br/>";		
				var link_preview    = this.app_name+".scene_remote('frame3','"+scene+"','scene_json_buttons','scene_json_channels');";
				
				var link_delete     = this.app_name+".remote_delete_button('scene','frame2','"+scene+"','"+i+"','scene_json_buttons');";
				var link_move_left  = this.app_name+".remote_move_button('scene','frame2','"+scene+"',"+i+",'scene_json_buttons','left');";
				var link_move_right = this.app_name+".remote_move_button('scene','frame2','"+scene+"',"+i+",'scene_json_buttons','right');";
				
				var link_button_left = this.app_name+".remote_add_button('scene','frame2','"+scene+"','add_button_"+i+"','scene_json_buttons','"+i+"');";
				var link_button_right= this.app_name+".remote_add_button('scene','frame2','"+scene+"','add_button_"+i+"','scene_json_buttons','"+(i+1)+"');";
				this.button_width    = "50px;"	
				var input_add_button = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>" +
							this.button_edit( link_button_left + link_preview, "&lt; +") +
							this.button_edit( link_button_right + link_preview, "+ &gt;");

				this.button_width    = "30px;";
				if (i > 0) 			     { contextmenu += this.button_edit( link_move_left  + link_preview, "&lt;",""); }
								       contextmenu += this.button_edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length) { contextmenu += this.button_edit( link_move_right + link_preview, "&gt;",""); }
				contextmenu += input_add_button;
				}
																		
			if (button[0] == "LINE") 			{ next_button = this.line(""); }
			else if (button[0].indexOf("LINE||") == 0)	{ next_button = this.line(button[0].split("||")[1]); }
			else if (button[0] == ".") 			{ next_button = this.button_device( scene+i, ".", remote_label, "", "", "disabled" ); }
			else if (button[0] == "makro")		{ next_button = this.button_makro(  cmd, button[1], remote_label, "", makros[button[1]], "" ); 
									  this.active_buttons.push(cmd); }
			else if (button[0] == "scene-on")		{ next_button = this.button_makro(  "scene_on_"+button[1], "on", remote_label,"", makros_sceneOn[button[1]], "" );
									  this.active_buttons.push("scene_on_"+button[1]); }
			else if (button[0] == "scene-off")		{ next_button = this.button_makro(  "scene_off_"+button[1], "off", remote_label, "", makros_sceneOff[button[1]], "" );
									  this.active_buttons.push("scene_off_"+button[1]); }
			else if (button[1] == "keyboard")		{ this.keyboard.set_device(button[0]);
									  next_button = this.button_device_keyboard( cmd, button[1], device, "", cmd, "" ); 
									  this.active_buttons.push(cmd); }
			else if (button == "HEADER-IMAGE")		{ next_button = this.scene_header_image(id,scene); }
			else if (button == "DISPLAY")			{ next_button = this.display(id, scene, "scenes", remote_displaysize, remote_display); 
									  }

			else if (button.length > 1 && button[1].indexOf("SLIDER") == 0) { 
									  next_button = this.slider_element(id, button[0], "devices", button[1].split("||")); }

			else 						{ next_button = this.button_device( cmd, button[1], remote_label, "", cmd, "" );
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
		remote += this.keyboard.input();
		
		setTextById(id,remote);
		}


	// create list of channels (for scenes)
	this.scene_channels       = function (id, scene, preview_channel="") {
		// set vars
		var remote     = "";
		var scene_data = this.data["DATA"]["scenes"][scene];
		var scene_name = scene_data["settings"]["label"];

		if (preview_channel == "") 	{ makros = scene_data["remote"]["channel"]; }
		else				{ makros = this.get_json_value(preview_channel, scene_data["remote"]["channel"]); preview = true; }

		channels = Object.keys(makros);
		channels = channels.sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});

		this.button_tooltip.settings(this.tooltip_mode,this.tooltip_width,"80px",35);

    		// create list of channel buttons
    		for (var i=0; i<channels.length; i++) {
        		var cmd   	= "channel_"+i; //channels[i];
			var next_button	= this.button_channel(cmd, channels[i], scene_name, makros[channels[i]],"","");
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
		var scene_info = this.data["DATA"]["scenes"][scene]["settings"];
		var label      = scene_info["label"];
		var descr      = scene_info["description"];
		var url        = scene_info["url"];
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
		
		var scene_info    = this.data["DATA"]["scenes"][scene]["settings"];
		var remote_info   = this.data["DATA"]["devices"];

		var link_template = this.app_name+".remote_import_templates('scene','frame2','"+scene+"','add_template','scene_json_buttons');";
		var link_preview  = this.app_name+".scene_remote('frame3','"+scene+"','scene_json_buttons','scene_json_channel');";
		var remote        = "";
		
		var device_makro        = {};
		for (key in this.data["DATA"]["devices"]) { device_makro[key] = "Device: "+remote_info[key]["settings"]["label"]; }
		for (key in this.data["DATA"]["makros"])  { if (key != "description") { device_makro[key] = "Makro: "+key; } }
		var device_makro_onchange = this.app_name +".scene_button_select(div_id='add_button_device_input','add_button','add_button_device');";			
				
		remote  += "<center><b>Edit &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";

		remote  += this.tab_row("start","100%");
		remote  += this.tab_line();
		remote  += this.tab_row( "Label:",       		this.input("edit_label",	scene_info["label"]) );
		remote  += this.tab_row( "Description:&nbsp;", 	this.input("edit_description", scene_info["description"]) );
		remote  += this.tab_row( "Scene Image:&nbsp;", 	this.input("edit_image",       scene_info["image"]) );
		remote  += this.tab_row( "&nbsp;",			this.button_edit("apiSceneEdit('"+scene+"','edit','description,label,image');","save changes","") );
		remote  += this.tab_line();
		remote  += this.tab_row("end");
		remote  += this.tab_row("start","100%");
		remote  += this.tab_row(
				"<input id='scene_visibility' value='"+scene_info["visible"]+"' style='display:none;'>"+
				this.button_edit("apiRemoteChangeVisibility('scene','"+scene+"','scene_visibility');","show / hide") + "&nbsp;" +
				this.button_edit("apiSceneDelete('"+scene+"');","delete scene","")
				);
		remote  += this.tab_line();		
		remote  += this.tab_row(
				this.select("add_button_device","device / type of makro",device_makro,device_makro_onchange) +
				"<div id='add_button_device_input'><i><small>-&gt; select device or makro</small></i></div>",
				this.button_edit(this.app_name+".remote_add_button('scene','frame2','"+scene+"','add_button','scene_json_buttons');" + link_preview,"add button","")
				);
		remote  += this.tab_row(
				this.input("add_line_text"),
				this.button_edit(this.app_name+".remote_add_line('scene','frame2','"+scene+"','add_line_text','scene_json_buttons');" + link_preview,"add line with text","")
				);
/*
		remote  += this.tab_row(
				this.input("add_slider_text"),
				this.button_edit(this.app_name+".remote_add_slider('scene','frame2','"+scene+"','add_slider_text','scene_json_buttons');" + link_preview,"add slider","")
				);
		remote  += this.tab_row(
				this.input("add_colorpicker_text"),
				this.button_edit(this.app_name+".remote_add_colorpicker('scene','frame2','"+scene+"','add_colorpicker_text','scene_json_buttons');" + link_preview,"add color picker","")
				);
*/
		remote  += this.tab_row(
				"",
				this.button_edit(this.app_name+".remote_add_header('scene','frame2','"+scene+"','HEADER-IMAGE','scene_json_buttons');" + link_preview,"add header-image","") +
				this.button_edit(this.app_name+".remote_add_button('scene','frame2','"+scene+"','.','scene_json_buttons');" + link_preview,"add empty field","") +
				this.button_edit(this.app_name+".remote_add_display('scene','frame2','"+scene+"','DISPLAY','scene_json_buttons');" + link_preview,"add display","")
				);
		remote  += this.tab_line();
		remote  += this.tab_row(
				this.button_select("del_button",scene),
				this.button_edit(this.app_name+".remote_delete_button('scene','frame2','"+scene+"','del_button','scene_json_buttons');" + link_preview, "delete button","")
				);
		remote  += this.tab_row(
				this.template_select("add_template","template",this.templates),
				this.button_edit(link_template + link_preview,"clone template","")
				);
		remote  += this.tab_line();
		remote  += this.tab_row("Remote:&nbsp;&nbsp;", 	this.data["DATA"]["scenes"][scene]["config"]["remote"]+".json" );
		remote  += this.tab_row("end");

	        if (this.edit_mode)     { elementVisible(id); }
	        else                    { elementHidden(id,"device_edit"); return; }

		setTextById(id,remote);
		}


	// create edit panel to edit JSON data
	this.scene_edit_json	  = function (id,scene,remote="",channel="",display="", displaysize="") {
	
	        var scene_remote  = this.data["DATA"]["scenes"][scene]["remote"];
	        var scene_info    = this.data["DATA"]["scenes"][scene]["settings"];
	        var display_sizes = this.display_sizes();
	        
	        if (this.edit_mode)		{ elementVisible(id); }
	        else				{ elementHidden(id,"scene_edit_json"); return; }
	        
	        if (remote == "") 		{ var scene_definition = scene_remote["remote"]; }
	        else				{ var scene_definition = remote; }
	        
	        if (channel == "")		{ var scene_channel 	= scene_remote["channel"]; }
	        else				{ var scene_channel	= channel; }

		if (display != "")		{ var remote_display	= display; }
		else if (this.data["DATA"]["scenes"][scene] && this.data["DATA"]["scenes"][scene]["remote"]["display"])
						{ var remote_display	= this.data["DATA"]["scenes"][scene]["remote"]["display"] }			
		else				{ var remote_display	= {}; }

		if (displaysize != "")	{ var remote_displaysize = displaysize; }
		else if (this.data["DATA"]["scenes"][scene] && this.data["DATA"]["scenes"][scene]["remote"]["display-size"])
						{ var remote_displaysize = this.data["DATA"]["scenes"][scene]["remote"]["display-size"] }
		else 				{ var remote_displaysize = {}; }

		this.button_width = "100px";
		var remote = "";

		remote  += "<center><b>Edit &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";

		remote  += this.tab_row("start","100%");
		remote  += this.tab_line();
		remote  += this.tab_row("end");

		remote += "<div id='scene_json'>"; //  style='display:none;'
		remote += "<b>Button Definition:</b><br/><br/>";
		remote += this.display_json( "scene_json_buttons", scene_definition, "buttons" );
		remote += "<br/><b>Channel Definition:</b><br/><br/>";
		remote += this.display_json( "scene_json_channel", scene_channel, "channels"  );
		remote += "<br/><b>Required Devices:</b><br/><hr/>";
		remote += "Devices:&nbsp;&nbsp;" + this.input("scene_json_devices", JSON.stringify(scene_remote["devices"]))+"<br/><br/>";
		remote += "<br/><b>Display Definition:</b><br/><br/>";
		remote += this.display_json( "scene_json_display", remote_display );
		remote += "<br/><b>Display size:</b><br/><br/>";
		remote += this.select("scene_display_size","display size", display_sizes, "", remote_displaysize);
		remote += "<br/><br/>";
		remote += "<br/><center>" + 
				this.button_edit(this.app_name+".scene_edit_json('"+id+"','"+scene+"');"+
				this.app_name+".scene_remote('frame3','"+scene+"','scene_json_buttons','scene_json_channel');"+this.app_name+".scene_channels('frame5','"+scene+"','scene_json_channel');","reset") + "&nbsp;" + 
				this.button_edit("apiSceneJsonEdit('"+scene+"','scene_json_buttons','scene_json_channel','scene_json_devices','scene_json_display','scene_display_size');","save","") + "&nbsp;" +
				this.button_edit(this.app_name+".scene_remote('frame3','"+scene+"','scene_json_buttons','scene_json_display','scene_display_size');"+this.app_name+".scene_channels('frame5','"+scene+"','scene_json_channel');","preview") +
				"</center>";
		remote += "<br/><hr style='border:1px solid white;'/><br/>";
		remote += lang("MANUAL_SCENE");
		remote += lang("MANUAL_CHANNEL");
		remote += lang("MANUAL_DEVICES");
		remote += lang("MANUAL_DISPLAY");
		
		remote += "</div>";			

		setTextById(id,remote);
		}


	this.scene_header_image   = function (id, scene) {
		var scene_info = this.data["DATA"]["scenes"][scene]["settings"];
		var label      = scene_info["label"];
		var image      = scene_info["image"];
		
		if (image && image != "") {
			return "<button class='button header_image' style='background-image:url("+rm3scene_dir+image+")'><div class='header_image_fade'><div class='header_image_text'>&nbsp;<br/>"+label+"</div></div></button>";
			}
		}


	// edit remote in browser (JSON)
	//--------------------------------
	
	// add header to JSON
	this.remote_add_header	  = function (type,id,scene,button,remote,position="") {
		var value     = this.get_json_value(remote);
		if (value.indexOf("HEADER-IMAGE") < 0) {
			this.remote_add_button(type,id,scene,button,remote,0);
			}
		else {
			appMsg.alert("There is already a HEADER-IMAGE in this remote control.");
			}
		}

	// add display to JSON
	this.remote_add_display	  = function (type,id,scene,button,remote,position="") {
		var value     = this.get_json_value(remote);
		if (value.indexOf("DISPLAY") < 0) {
			this.remote_add_button(type,id,scene,button,remote,position);
			}
		else {
			appMsg.alert("There is already a DISPLAY element in this remote control.");
			}
		}

	// add a line with description
	this.remote_add_line	  = function (type,id,scene,button,remote,position="") {
		if (document.getElementById(button)) { button = "LINE||"+getValueById(button); }
		this.remote_add_button(type,id,scene,button,remote,position);
		}

	// add a line with description
	this.remote_add_slider	  = function (type,id,scene,button,remote,position="") {
		if (document.getElementById(button)) { button = "SLIDER||"+getValueById(button); }
		this.remote_add_button(type,id,scene,button,remote,position);
		}

	// add a line with description
	this.remote_add_colorpicker  = function (type,id,scene,button,remote,position="") {
		if (document.getElementById(button)) { button = "COLOR-PICKER||"+getValueById(button); }
		this.remote_add_button(type,id,scene,button,remote,position);
		}

	// add button to JSON	
	this.remote_add_button	  = function (type,id,scene,button,remote,position="") {
	
		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
		
		var value     = this.get_json_value(remote);
		var value_new = [];
		if (position == 0) { value_new.push(button); }
		
		for (var i=0;i<value.length;i++) {
			if (i == position && position != "" && position != 0) { value_new.push(button); }
			value_new.push(value[i]);
			}
		if (position == "") { value_new.push(button); }

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new); }
		}
	
	// delete button from JSON
	this.remote_delete_button = function (type,id,scene,button,remote) {

		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "") { appMsg.alert(lang("BUTTON_SELECT")); return; }
		
		value     = this.get_json_value(remote);
		value_new = [];
		for (var i=0;i<value.length;i++) {
			if (i != button) { value_new.push(value[i]); }
			}

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new); }
		}
	
	// move button in JSON (left or right)
	this.remote_move_button	  = function (type,id,scene,button,remote,left_right) {

		value     = this.get_json_value(remote);
		
		var temp = value[button];
		if (left_right == "left")  { if (button > 0)		{ var target = button - 1; value[button] = value[target]; value[target] = temp; } }
		if (left_right == "right") { if (button < value.length) { var target = button + 1; value[button] = value[target]; value[target] = temp; } }
		
		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value); }
		}
	
	// import remote definition from template to JSON
	this.remote_import_templates = function (type,id,scene,template,remote) {
		value      = getValueById(template);
		if (value == "") { appMsg.alert(lang("DEVICE_SELECT_TEMPLATE")); return; }
		var template    = this.data["DATA"]["templates"][value];
		var value_new   = template["remote"];
		if (template["display"])	{ var display_new = template["display"]; }     else { var display_new = {}; }
		if (template["display-size"])	{ var displaysize_new = template["display"]; } else { var displaysize_new = ""; }
		
		if (type == "scene") {
			for (var i=0;i<value_new.length;i++) {
				if (value_new[i] != "." && value_new[i].indexOf("DISPLAY") < 0 && value_new[i].indexOf("LINE") < 0 && value_new[i].indexOf("_") < 0) {
					value_new[i] = "XXXX_"+value_new[i];
					}
				}
			}

		if (type == "scene")		{ this.scene_edit_json(id,scene,remote=value_new,channel="",display=display_new,displaysize=displaysize_new); }
		else if (type == "device")	{ this.device_edit_json(id,scene,remote=value_new,display=display_new,displaysize=displaysize_new); }
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
	                                list[button_list[i]] = button_list[i];
	                                }
				}
			}
                return this.select(id,"button",list);
                }

	//--------------------------
                        
	this.button_select		= function (id,device="") {
		var list 		= {};
		var device_buttons	= [];		
		if (device != "" && device in this.data["DATA"]["devices"]) {
                
                	var count1 = 0;
                	var count2 = 0;
			var remote_definition = this.data["DATA"]["devices"][device]["remote"]["remote"];
			var button_list       = this.data["DATA"]["devices"][device]["interface"]["button_list"];
			
			for (var i=0;i<remote_definition.length;i++) {
				if (i<10) { a = "0"; } else { a = ""; }
				list[i] = "["+a+i+"]  "+remote_definition[i];
				count1 = i;
				}
			}
			
                if (device != "" && device in this.data["DATA"]["scenes"]) {
                
			button_list = this.data["DATA"]["scenes"][device]["remote"]["remote"];
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
                
	this.scene_button_select	= function (div_id,id,device) {
	
		device = check_if_element_or_value(device,false);
		
		var remote_info   = this.data["DATA"]["devices"];		
		var device_makro        = {};
		var device_makro_button = {};
		for (key in this.data["DATA"]["devices"]) { 
			device_makro[key] = "Device: "+remote_info[key]["settings"]["label"];
			if (remote_info[key]["interface"]) {
				device_makro_button[key] = {};
				for (var i=0;i<remote_info[key]["interface"]["button_list"].length;i++) {
					var key2 = remote_info[key]["interface"]["button_list"][i];
					device_makro_button[key][key+"_"+key2] = key+"_"+key2;
			}	}	}
		for (key in this.data["DATA"]["makros"])  { 
			if (key != "description") { 
				device_makro[key] = "Makro: "+key; 
				device_makro_button[key] = {};
				for (key2 in this.data["DATA"]["makros"][key]) {
					device_makro_button[key][key+"_"+key2] = key+"_"+key2;
			}	}	}
		var device_makro_selects = "";
		for (key in device_makro_button) {
			device_makro_selects += this.select("add_button_device_"+key,"button ("+key+")",device_makro_button[key]);
			}
			
		setTextById(div_id, this.select(id, "button ("+device+")", device_makro_button[device]));
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

	// create color picker
	//--------------------------------
	this.colorPicker              = function (id, device, type="devices", data) {
		var remote_data  = this.data["DATA"][type][device]["remote"];
		var status_data  = this.data["DATA"][type][device]["status"];
		
		if (!this.data["DATA"][type]) {
			this.logging.error(this.app_name+".colorPicker() - type not supported ("+type+")");
			return;
			}

        	var display_start = "<button id=\"colorpicker_"+device+"\" class=\"color-picker\">";
        	var display_end   = "</button>";
        	
        	var text = display_start;
        	text += this.color_picker.colorPickerHTML();
        	text += display_end;
        	return text;

		}
	
	// create slider
	//--------------------------------
	this.slider_element      = function (id, device, type="devices", data) {
	
		console.debug("slider_element: "+id+"/"+device+"/"+type+"/"+data);
	
		var init;
		var remote_data  = this.data["DATA"][type][device]["remote"];
		var status_data  = this.data["DATA"][type][device]["status"];
		
		if (!this.data["DATA"][type]) {
			this.logging.error(this.app_name+".slider() - type not supported ("+type+")");
			return;
			}

		if (data[4] && status_data[data[4]]) { init = status_data[data[4]]; }

        	var display_start = "<button id=\"slider_"+device+"_"+data[1]+"\" class=\"rm-slider-button\">";
        	var display_end   = "</button>";
        	
        	if (data.length > 3) {
        		var min_max = data[3].split("-");
        		var min     = min_max[0];
        		var max     = min_max[1];
        		}
        	else {
        		var min     = 0;
        		var max     = 100;
        		}
        	
        	var text = display_start;
        	text += this.slider.sliderHTML(name=data[1], label=data[2], device=device, command=data[1], min, max, init);
        	text += display_end;
        	return text;

		}
	
	// create display
	//--------------------------------
	// show display with information
	this.display              = function (id, device, type="devices", style="", display_data={}) {
		var remote_data  = this.data["DATA"][type][device]["remote"];
		var status_data  = this.data["DATA"][type][device]["status"];
		
		if (!this.data["DATA"][type]) {
			this.logging.error(this.app_name+".display() - type not supported ("+type+")");
			return;
			}
			
		if (status_data["api-status"])	{ var connected = status_data["api-status"].toLowerCase(); }
		else					{ var connected = "unknown"; }
		
		if (display_data != {}) 		{}
		else if (remote_data["display"])	{ display_data = remote_data["display"]; }
		else					{ display_data["Error"] = "No display defined"; } 

        	var text    = "";
	        var status  = "";
        	
        	var display_start = "<button id=\"display_"+device+"_##STATUS##\" class=\"display ##STYLE##\" style=\"display:##DISPLAY##\" onclick=\"" + this.app_name + ".display_alert('"+id+"','"+device+"','"+type+"','##STYLE##');\">";
        	var display_end   = "</button>";
        	
		if (this.edit_mode) 											{ status = "EDIT_MODE"; }		
		else if (type == "scenes")										{ status = "ON"; }
		else if (connected != "connected")									{ status = "ERROR"; }
		else if (status_data["power"] == "ON" || status_data["power"] == "on")				{ status = "ON"; }
		else if (status_data["power"].indexOf("OFF") >= 0 || status_data["power"].indexOf("off") >= 0)	{ status = "OFF" }

		// display if ERROR
		text += display_start;
		text  = text.replace( /##STATUS##/g, "ERROR" );
		text  = text.replace( /##STYLE##/g, style + " display_error" );
		if (status == "ERROR" && !this.edit_mode)	{ text  = text.replace( /##DISPLAY##/g, "block" ); }
		else						{ text  = text.replace( /##DISPLAY##/g, "none" ); }
		text += "<center><b>device not connected</b>:</center><br/>";
		text += "<center><i>"+status_data["api-status"]+"</i></center>";
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
        	
	this.display_sizes       = function () {
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
	this.display_alert        = function (id, device, type="", style="" ) {
        
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
      			if (display_data[i] != "power") {
	        		var label = "<data class='display-label'>"+display_data[i]+":</data>";
				var input = "<data class='display-detail' id='display_full_"+device+"_"+display_data[i]+"'>no data</data>";
		        	//text += "<div class='display-element alert'>"+label+input+"</div><br/>";
		        	text += this.tab_row("<div style='width:100px;'>"+label+"</div>",input);
		        	}
	        	}
        	text  += this.tab_row("end");
        	text  += "</div>";
		appMsg.confirm(text,"",300);
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
        			if (Number.isInteger((x)/4))   				{ text += "\n\n"; x = 0; }
        			if (json.length > i+1 && json[i+1].includes("LINE") && x > 0) { text += "\n\n"; x = 0; }
        			if (json[i].includes("LINE"))					{ text += "\n\n"; x = 0; }
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
        	
        this.template_list	= function(type="") {
        	var templates = {};
        	for (key in this.data["DATA"]["templates"]) {
        		if (type == "")							{ templates[key] = this.data["DATA"]["templates"][key]["description"]; }
        		else if (!this.data["DATA"]["templates"][key]["type"])		{ templates[key] = this.data["DATA"]["templates"][key]["description"]; }
        		else if (this.data["DATA"]["templates"][key]["type"] == type)	{ templates[key] = this.data["DATA"]["templates"][key]["description"]; }
        		}
        	return templates;
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
		return button;
		}

	// button edit mode		
	this.button_edit          = function (onclick,label,disabled="") {
        	var style = "width:" + this.button_width + ";margin:1px;";
        	if (disabled == "disabled") { style += "background-color:gray;"; }
        	return "<button style=\""+style+"\" onClick=\""+onclick+"\" "+disabled+">"+label+"</button>";
        	}

	// create button for single command
	this.button_device        = function (id, label, device, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = 'apiCommandSend("'+cmd+'","","","'+device+'");';
			}
		return this.button( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command
	this.button_device_keyboard   = function (id, label, device, style, cmd, disabled ) {

		var label2 	= this.button_image( label, style );
		if (label == ".") {
			disabled = "disabled";
			label2[0] = "&nbsp;";
			}
		if (cmd != "") {
			cmd = this.keyboard.toggle_cmd();
			}
		return this.button( id, label2[0], label2[1], cmd, disabled );
		}
				
	// create button for single command -> if no command assigned yet to record command for button
	this.button_device_add    = function (id, label, device, style, cmd, disabled ) {

	        var device_button	= cmd.split("_");
		var label2		= this.button_image( label, style );
		if (label == ".")	{ disabled = "disabled"; label2[0] = "&nbsp;"; }
	        
	        var button = this.button( id, label2[0], label2[1], 'apiCommandRecord("'+device_button[0]+'","'+device_button[1]+'");', disabled );
		return button;		
		}		

	// create button for multiple commands (makro)
	this.button_makro         = function (id, label, scene, style, makro, disabled ) {	// ALT: ( id, makro, label, style, disabled ) {
	        if (makro) {
        	        var d = this.button_image( label, style );
                	var makro_string = "";

                	for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }
                	var b = this.button( id, d[0], d[1], 'apiMakroSend("'+makro_string+'","'+scene+'");', disabled );
			this.logging.debug("button_makro - "+b);
			return b;
                	}
        	else {	return this.button( id, label, style+" notfound", "", "disabled" );
                	}
		}
		
	// create button for channel (makro)
	this.button_channel       = function (id, label, scene, makro, style, disabled="") {
    		var makro_string = "";
		for (var i=0; i<makro.length; i++) { makro_string = makro_string + makro[i] + "::"; }

		this.logging.debug(label+" - "+makro_string);
		return "<button id='" + id + "' class='channel-entry " + style + "' " + disabled + " onclick=\"javascript:apiMakroSend('" + makro_string + "','"+scene+"','"+label+"');\">" + label + "</button>";
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
		if (this.data["DATA"]["devices"][device]) 	{ return this.data["DATA"]["devices"][device]["interface"]["button_list"]; }
		else						{ return ["error:"+device]; }
		}


	// helping fcts.
	//--------------------

	// empty field
	this.empty               = function (id,comment="") {
		setTextById(id,comment);
		}

	// ensure, that all elements are visible and settings are hidden
	this.show                = function (device="") {

		statusCheck(this.data);			// ... check if part of class ...
		setTextById("buttons_all","");		// ... move to showRemote() ...
		showRemoteInBackground(0);			// ... check if part of this class ...
		rm3settings.hide();				// ... check if part of another class ...

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
