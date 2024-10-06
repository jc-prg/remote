//--------------------------------
// jc://remote/
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

	this.frames_edit    = ["frame1","frame2"];
	this.frames_remote  = ["frame3","frame4","frame5"];
	this.frames_notouch = true;
	
	this.basic          = new rmRemoteBasic(name+".basic");		// rm_remotes-elements.js
	this.button         = new rmRemoteButtons(name);			// rm_remotes-elements.js
	this.display        = new rmRemoteDisplays(name+".display");		// rm_remotes-elements.js
	this.json           = new rmRemoteJSON(name+".json");		// rm_remotes-elements.js
	
	this.tab            = new rmRemoteTable(name+".tab");		// rm_remotes-elements.js
	this.keyboard       = new rmRemoteKeyboard(name+".keyboard");	// rm_remotes-keyboard.js
	this.color_picker   = new rmColorPicker(name+".color_picker");	// rm_remotes-color-picker.js
	this.slider         = new rmSlider(name+".slider");			// rm_remotes-slider.js

	this.logging        = new jcLogging(this.app_name);
	this.tooltip        = new jcTooltip(this.app_name + ".tooltip");	// rm_remotes-elements.js


	// load data with devices (deviceConfig["devices"])
	this.init                       = function (data) {

		if (data["CONFIG"]) {
			this.data           = data;
			this.button.data    = data;
			this.display.data   = data;

			this.templates      = data["CONFIG"]["templates"]["list"];
            }
        else { return; }
                
        if (this.initial_load) {
			this.tooltip_mode     = "onmouseover";
			this.tooltip_width    = "140px";
			this.tooltip_height   = "140px";
			this.tooltip_distance = 47;

			this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance);
            this.logging.default("Initialized new class 'rmRemotes'.");
            this.initial_load = false;
            }
        else {
            this.logging.default("Reload data 'rmRemotes'.");
            }
		}

	// create complete remote setup (for scenes and devices)
	this.create                     = function (type="", rm_id="") {

        if (type == "")   { type  = this.active_type; }
        if (rm_id == "")  { rm_id = this.active_name; }
        if (rm_id == "")  {
			this.logging.warn("No Remote Id given ...");
            return;
            }
	        
		if ("CONFIG" in this.data == false) {
			this.logging.warn("Data not loaded yet.");
			return;
			}
		if (rm_id != "" && this.data["CONFIG"]["devices"][rm_id] == undefined && this.data["CONFIG"]["scenes"][rm_id] == undefined) {
			this.logging.warn("Remote ID "+rm_id+" not found.");
			appCookie.set("remote",""); //device::"+device+"::"+remote_label);
			return;
			}
			
		// format frame1, frame2 for edit mode
		document.getElementById(this.frames_edit[0]).className = "setting_bg";
		document.getElementById(this.frames_edit[1]).className = "setting_bg";

        // disable touch-action on remotes
        if (this.frames_notouch) {
            document.getElementById("frame1").style.touchAction = "none";
            document.getElementById("frame2").style.touchAction = "none";
            document.getElementById("frame3").style.touchAction = "none";
            document.getElementById("frame4").style.touchAction = "none";
            document.getElementById("frame5").style.touchAction = "none";
            }

		// set active remote (type, id)
		this.active_name    = rm_id;
		this.active_type    = type;
		this.active_buttons = [];

		this.keyboard.set_device(this.active_name);
		this.color_picker.set_device(this.active_name);
		this.button.data    = this.data;
		this.display.data   = this.data;

		rm3start.active     = "start";
		startActive         = false;
		
		var edit_mode       = "";
		if (this.edit_mode) {
		    edit_mode = " / EDIT";
		    rm3settings.create("index_small");
		    elementVisible(this.frames_edit[0]);
		    elementVisible(this.frames_edit[1]);
		    }
		else {
		    rm3settings.settings_ext_reset();
		    elementHidden(this.frames_edit[0]);
		    elementHidden(this.frames_edit[1]);
		    document.getElementById(this.frames_edit[0]).style.display = "none";
		    }

		if (type == "device") {
		
            setNavTitle(this.data["CONFIG"]["devices"][rm_id]["settings"]["label"] + edit_mode);

			// set vars
            this.logging.default("Write Device Remote Control: " + rm_id);

			// create remote for device
            this.device_remote(     this.frames_remote[0], rm_id);
            this.device_description(this.frames_remote[1], rm_id);
            this.device_notused(    this.frames_remote[2], rm_id);
			
			// create edit panels
            this.device_edit(       this.frames_edit[0],   rm_id);
            this.device_edit_json(  this.frames_edit[1],   rm_id);

			// show
            this.show(rm_id);
            scrollTop();
            }
		else if (type == "scene") {

            setNavTitle(this.data["CONFIG"]["scenes"][rm_id]["settings"]["label"] + edit_mode);

            // set vars
            this.logging.default("Write Scene Remote Control: " + rm_id);

            // create remote for scene
            this.scene_remote(     this.frames_remote[0], rm_id);
            this.scene_description(this.frames_remote[1], rm_id);
            this.scene_channels(   this.frames_remote[2],rm_id);

            // create edit panels
            this.scene_edit(       this.frames_edit[0], rm_id);
            this.scene_edit_json(  this.frames_edit[1], rm_id);

            // show
            this.show();
            scrollTop();
            }
        else {
            startActive = true;
            }
			
		this.loaded_remote  = [type,rm_id];
		rm3menu.menu_height();
		}

	// reread data from current definition and create preview
	this.device_remote_preview      = function (device) {
		this.device_edit_json(id=this.frames_edit[1],   device=device, preview_remote='remote_json_buttons', preview_display='remote_json_display', preview_display_size='remote_display_size');
		this.device_remote(   id=this.frames_remote[0], device=device, preview_remote='remote_json_buttons', preview_display='remote_json_display', preview_display_size='remote_display_size');
		this.device_notused(  id=this.frames_remote[2], device=device);
		}
	
	// create remote for a specific device
	this.device_remote              = function (id="", device="", preview_remote="", preview_display="", preview_display_size="") {

		var preview	        = false;
		var remote	        = "<div id='remote_button' display='block'>";
		var device_config   = this.data["CONFIG"]["devices"][device];
		this.button.default_size();			
		
		if (device_config && device_config["remote"]) {
			var remote_display_size = device_config["remote"]["display-size"];
			var remote_label        = device_config["settings"]["label"];
			var remote_buttons      = device_config["buttons"];
			}		
		else {
			if (this.data["STATUS"]["config_errors"]["devices"][device]) {
				var errors = this.data["STATUS"]["config_errors"]["devices"][device];
				remote += "<b class='entry_error'>"+lang("REMOTE_CONFIG_ERROR",[device])+"</b>";
				remote += "<hr/><ul>";
				for (key in errors) {
					remote += "<li><u>"+key+"</u>:<br/>"+errors[key]+"</li>";
					}
				remote += "</ul>";
				}
			else {
				remote += lang("REMOTE_CONFIG_ERROR_UNKNOWN",[device]);
				}
			remote += "</div>";
			setTextById(id,remote);
			appMsg.alert(lang("MISSING_DATA",[device, device_config["interface"]["remote"]+".json",
			                                          device_config["config"]["device"]+".json"]));
			return;
			}
			
		// -------------------> ??? Update to new API definition
		
		var remote_definition  = [];
		var remote_display     = {};
		
		// check data for preview
		if (preview_remote == "")       { remote_definition   = device_config["remote"]["remote"]; }
		else                            { remote_definition   = this.json.get_value(preview_remote,       device_config["remote"]["remote"]);       preview = true; }
		if (preview_display == "")      { remote_display      = device_config["remote"]["display"]; }
		else                            { remote_display      = this.json.get_value(preview_display,      device_config["remote"]["display"]);      preview = true; }
		if (preview_display_size == "") { remote_display_size = device_config["remote"]["display-size"]; }
		else					        { remote_display_size = this.json.get_value(preview_display_size, device_config["remote"]["display-size"]); preview = true; }
		if (remote_display_size == undefined) { remote_display_size = "middle"; }
		
		// create remote control
		appCookie.set("remote","device::"+device+"::"+remote_label);
		if (preview) { remote += "<b>"+lang("PREVIEW")+":</b><br/><hr/>"; }

		for (var i=0; i<remote_definition.length; i++) {

			var next_button;
			var button             = remote_definition[i];
			var cmd     	       = device + "_" + button;
			var button_style       = "";
			this.display.edit_mode = this.edit_mode;

			if (this.edit_mode) {			
				var context_menu     = "["+i+"] <b>" + cmd.split("||")[0] + "</b><br/><br/>";
				var link_preview     = this.app_name+".device_remote_preview('"+device+"');";
				var link_delete      = this.app_name+".remote_delete_button('device','"+device+"','"+i+"','remote_json_buttons');";
				var link_move_left   = this.app_name+".remote_move_button(  'device','"+device+"',"+i+",'remote_json_buttons','left');";
				var link_move_right  = this.app_name+".remote_move_button(  'device','"+device+"',"+i+",'remote_json_buttons','right');";
				var link_button_left = this.app_name+".remote_add_button(   'device','"+device+"','add_button_"+i+"','remote_json_buttons','"+i+"');";
				var link_button_right= this.app_name+".remote_add_button(   'device','"+device+"','add_button_"+i+"','remote_json_buttons','"+(i+1)+"');";
				this.button.width    = "50px;"	
				var input_add_button = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>&nbsp;<br/>" +
				                       this.button.edit( link_button_left  + link_preview, "&lt; +") +
				                       this.button.edit( link_button_right + link_preview, "+ &gt;");

				this.button.width    = "30px;";
				if (i > 0) { context_menu += this.button.edit( link_move_left  + link_preview, "&lt;",""); }
                             context_menu += this.button.edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length)	{ context_menu += this.button.edit( link_move_right + link_preview, "&gt;",""); }
				context_menu += input_add_button;
				button_style = " edit";
				}
						
			if (button == "LINE")                         { next_button = this.basic.line(""); }
			else if (button.indexOf("LINE||") == 0)       { next_button = this.basic.line(button.split("||")[1]); }
			else if (button.indexOf("SLIDER") == 0)       { next_button = this.slider_element(id, device, "devices", button.split("||")); }
			else if (button.indexOf("TOGGLE") == 0)       { next_button = this.slider_element_toggle(id, device, "devices", button.split("||")); }
			else if (button == ".")                       { next_button = this.button.device( device+i, ".", device, "empty", "", "disabled" ) }
			else if (button == "DISPLAY")                 { next_button = this.display.default(id, device, "devices", remote_display_size, remote_display); }
			else if (button.indexOf("COLOR-PICKER") == 0) { next_button = this.colorPicker(id, device, "devices", button.split("||")); }
			else if (button == "keyboard")                { next_button = this.button.device_keyboard( cmd, button, device, "", cmd, "" ); this.active_buttons.push(cmd); }
			else if (remote_buttons.includes(button))     { next_button = this.button.device( cmd, button, device, button_style, cmd, "" ); this.active_buttons.push(cmd); }
			else if (this.edit_mode)                      { next_button = this.button.device_add( cmd, button, device, "notfound", cmd, "" ); }
			else                                          { next_button = this.button.device( cmd, button, device, "notfound", cmd, "disabled" ); }

			if (this.edit_mode) {
				if (button.indexOf("LINE") == 0)               { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,30); }
				else if (button.indexOf("DISPLAY") == 0)       { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				else if (button.indexOf("COLOR-PICKER") == 0)  { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				else                                           { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }

				next_button = this.tooltip.create_inside( next_button, context_menu, i );
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
	this.device_description         = function (id, device) {
	    var device_data = this.data["CONFIG"]["devices"][device]["settings"];
		var label       = device_data["label"];
		var descr       = device_data["description"];
		var url         = device_data["url"];
		if (url) { descr = "<a href=\""+url+"\" target='_blank'>"+descr+"</a>"; }
		
		var str = "";
		str    += "<media-info id='media_info'></media-info>";
		str    += "<center>" + label + ": " + descr + "</center>";
		
		setTextById(id,str);
		}

	// create list of buttons not used in RM definition (for devices)
	this.device_notused             = function (id, device, preview_remote="") {

        var device_config = this.data["CONFIG"]["devices"][device];

		if (!device_config || !device_config["remote"] || !device_config["buttons"]) {
			setTextById(id,"");
			return;
			}

		var remote            = "";
		var notused           = [];
		this.button.width     = "120px";

		var link_preview      = this.app_name+".device_remote_preview('"+device+"');";
		var device_buttons    = device_config["buttons"];

		if (preview_remote == "")   { remote_buttons = device_config["remote"]["remote"]; }
		else                        { remote_buttons = this.json.get_value(preview_remote, device_config["remote"]["remote"]); preview = true; }

		// show not used buttons if edit mode
		if (this.edit_mode)         { display = "block"; sign    = "−"; }
		else                        { display = "none";  sign = "+"; }

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
		remote += this.basic.line(lang("NOT_USED"));

		// create buttons not used
		for (var i=0; i<notused.length; i++) {
			var button  = notused[i];
			var cmd     = device + "_" + button;
			next_button = this.button.device( "not_used"+i, button, device, "", cmd, "" );
			
			if (this.edit_mode) {
				var link_add     = this.app_name+".remote_add_button('device', '"+device+"', 'not_used_"+i+"', 'remote_json_buttons');";
				var input_add    = "<input id='not_used_"+i+"' name='not_used_"+i+"' value='"+button+"' style='display:none;'>";
				var context_menu = input_add + "["+i+"] "+ cmd + "<br/><br/>" + this.button.edit( link_add + link_preview, lang("BUTTON_T_MOVE2REMOTE"),"");;
				
				this.tooltip.settings(this.tooltip_mode,this.tooltip_width,"80px",this.tooltip_distance);
				next_button = this.tooltip.create_inside( next_button, context_menu, "not_used"+i );
				}

			remote     += next_button;
			}

		remote += "</div>";

		// print
		setTextById(id,remote);
		}
	
	// show / hide buttons that are not used
	this.device_notused_showhide    = function () {
		element = document.getElementById("buttons_not_used");
		button  = document.getElementById("show_hide_not_used");
		if (element.style.display == "block")   { element.style.display = "none";  button.innerHTML = "+"; }
		else                                    { element.style.display = "block"; button.innerHTML = "−"; }
		}

	//  panel per remote ...
	this.device_edit                = function (id, device) {

        if (this.edit_mode)     { elementVisible(id); }
        else                    { elementHidden(id,"device_edit"); return; }

		var device_config     = this.data["CONFIG"]["devices"][device];

        if (this.data["STATUS"]["config_errors"]["devices"][device] || !device_config || !device_config["remote"]) {
            setTextById(id,"");
            return;
            }

		var remote_buttons    = device_config["remote"];
		var remote_visible    = device_config["settings"]["visible"];
		var remote_display    = device_config["remote"]["display"];
		var device_commands   = device_config["buttons"];
		var device_method     = device_config["interface"]["method"];
		var device_status     = this.data["STATUS"]["devices"][device];
		var device_buttons    = [];
		
		for (var i=0;i<device_config["remote"].length;i++) {
            var button = device_config["remote"][i];
			if (device_buttons.indexOf(button) < 0) { device_buttons.push(button); }
			}
		device_buttons.sort();

		this.basic.input_width  = "180px";
		this.button.width       = "90px";

		var remote = "";
		remote  += "<center class='remote_edit_headline'><b>"+lang("EDIT_REMOTE")+" &quot;"+device_config["settings"]["label"]+"&quot;</b> ["+device+"]</center>";
		remote += this.basic.edit_line();

		// Main Settings
		var edit   = "";
		var images = this.data["CONFIG"]["elements"]["button_images"];
        var icon   = "<img src='icon/"+images[device_config["settings"]["image"]]+"' class='rm-button_image_start'>";
		icon       = "<button class='button device_off small' style='height:40px;'><div id='device_edit_button_image'>"+icon+"</div></button>";
		edit    += this.tab.start();
		edit    += this.tab.row( lang("ID"),                      "<b>" + device + "</b>" );
		edit    += this.tab.row( lang("LABEL")+":",               this.basic.input("edit_label", device_config["settings"]["label"]) );
		edit    += this.tab.line();
		edit    += this.tab.row( icon,                            this.button_image_select("edit_image", device_config["settings"]["image"]) );
		edit    += this.tab.row( lang("EXTERNAL_ID")+":",         this.basic.input("edit_device_id", device_config["settings"]["device_id"]) );
		edit    += this.tab.row( lang("DESCRIPTION")+":&nbsp;",   this.basic.input("edit_description", device_config["settings"]["description"]) );

		edit    += this.tab.line();
		edit    += this.tab.row("<center>"+
				"<input id='remote_visibility' value='"+remote_visible+"' style='display:none;'>"+
				this.button.edit("apiRemoteChangeVisibility('device','"+device+"','remote_visibility');",lang("BUTTON_T_SHOW_HIDE")) + "&nbsp;" +
				this.button.edit("apiDeviceEdit('"+device+"','edit','description,label,interface,method,device_id,image');",lang("BUTTON_T_SAVE")) + "&nbsp;" +
				this.button.edit("apiDeviceDelete_exe('"+device+"');","delete") + "</center>"
				);		
		edit    += this.tab.line();
		edit    += this.tab.end();

		this.button.width = "120px";
		edit    += this.tab.start();
		if (device != this.data["CONFIG"]["main-audio"] && device_config["commands"]["definition"]["vol"] && device_config["commands"]["definition"]["vol"] != undefined) {
		    edit  += this.tab.row(lang("AUDIO_SET_AS_MAIN",[this.data["CONFIG"]["main-audio"]]),this.button.edit("setMainAudio('"+device+"');","set main device",""));
		    }
		else if (device == this.data["CONFIG"]["main-audio"])   { edit  += this.tab.row(lang("AUDIO_IS_MAIN"),false); }
		else                                                    { edit  += this.tab.row(lang("AUDIO_N/A_AS_MAIN"),false); }
		edit    += this.tab.end();

		remote  += this.basic.container("remote_main","Main settings",edit,true);

		// API Information
		edit     = "<p><b>"+lang("API_INTERFACE")+":</b><br/>"+		    device_config["interface"]["api"].replace("_", " / ");
		//edit    += "<p><b>"+lang("CONFIG_INTERFACE")+":</b><br/>"+   	JSON.stringify(device_config["interface"]["files"]).replace( /,/g, ", ");
		edit    += "<p><b>"+lang("CONFIG_INTERFACE")+":</b><br/>"+ 		device_config["interface"]["device"]+".json";
		edit    += "<p><b>"+lang("CONFIG_REMOTE")+":</b><br/>"+ 		device_config["interface"]["remote"]+".json";
		edit    += "<p><b>"+lang("METHOD")+":</b><br/>"+		        device_config["interface"]["method"]; //device_data["interface"]["remote"]+".json" );
		remote  += this.basic.container("remote_api01",lang("API_INFORMATION"),edit,false);

		// API details
		edit     = "<i><b>"+lang("COMMANDS")+"</b> ("+lang("BUTTON_T")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["buttons"]).replace(/,/g, ", ")+"</li></ul>";
		edit    += "<i><b>"+lang("GET_DATA")+"</b> ("+lang("BUTTON_T_DISPLAY")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["commands"]["get"]).replace(/,/g, ", ")+"</li></ul>";
		edit    += "<i><b>"+lang("SEND_DATA")+"</b> ("+lang("SLIDER")+", "+lang("BUTTON_T_KEYBOARD")+", "+lang("BUTTON_T_COLORPICKER")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["commands"]["set"]).replace(/,/g, ", ")+"</li></ul>";
		remote  += this.basic.container("remote_api02",lang("API_COMMANDS"),edit,false);

        if (device_method == "query") {
            // API Testing
            this.basic.input_width  = "90%";
            this.button.height  = "40px;";
            edit    = "Test here your commands vor device '" + device + "':<br/>&nbsp;<br/><center>";
            edit    += "<div id='api_command_select'><select style='width:90%'><option>Loading ...</option></select></div><br/>";
            edit    += this.basic.input("api_command") + "<br/>&nbsp;<br/>";
            edit    += this.button.edit("apiSendToDeviceApi( '" + device + "', getValueById('api_command') );", lang("TRY_OUT"),"") + "&nbsp;";
            edit    += this.button.edit("apiSendToDeviceApi( '" + device + "', 'jc.get_available_commands()' );", lang("GET_AVAILABLE_COMMANDS"),"");
            edit    += "<br/>&nbsp;<br/>";
            edit    += "<div class='remote-edit-cmd' id='api_response'></div><br/>"
            edit    += "<div id='api_description'></div><br/>";
            edit    += "</center>";
            remote  += this.basic.container("remote_api03",lang("API_COMMANDS_TEST"),edit,false);
            }

		remote  += "<br/>";

		this.logging.default(device_config);
		setTextById(id,remote);

        apiGetConfig_createDropDown( device, this.device_edit_api_commands );
		}

	// create drop-down with API commands
	this.device_edit_api_commands   = function (data) {
	    if (data["DATA"]["error"]) { return; }

	    var id        = "api_command_select";
	    var device    = data["DATA"]["device"];
	    var commands  = data["DATA"][device]["api_commands"];
	    var api_url   = data["DATA"][device]["interface_details"]["API-Info"];
	    var api_name  = data["DATA"][device]["interface"]["api_key"];
	    var on_change = "setValueById('api_command', getValueById('api_cmd_select'));";

    	this.basic              = new rmRemoteBasic(name+".basic");		// rm_remotes-elements.js
		this.basic.input_width  = "90%";

        var select    = this.basic.select("api_cmd_select",lang("API_SELECT_CMD"),commands,on_change,'',sort=false, change_key_value=true);

	    setTextById('api_command_select', select);

	    if (api_url) {
	        setTextById('api_description', "<a href='"+api_url+"' target='_blank' style='color:white'>API Documentation " + api_name + "</a>");
	        }
	    }

	// create edit panel to edit JSON data
	this.device_edit_json           = function (id, device, preview_remote="", preview_display="", preview_display_size="") {
	
        if (this.edit_mode) { elementVisible(id); }
        else                { elementHidden(id,"remote_edit_json"); return; }

        var device_config = this.data["CONFIG"]["devices"][device];
        if (this.data["STATUS"]["config_errors"]["devices"][device] || !device_config || !device_config["remote"]) {
            setTextById(id,"");
            return;
            }

		this.button.width = "100px";
		var display_sizes = this.display.sizes();
		var device_info   = device_config["settings"];

	        // check data for preview 
		if (preview_remote == "")             { remote_definition  = device_config["remote"]["remote"]; }
		else                                  { remote_definition  = this.json.get_value(preview_remote,device_config["remote"]["remote"]); preview = true; }
		if (preview_display == "")            { remote_display     = device_config["remote"]["display"]; }
		else                                  { remote_display     = this.json.get_value(preview_display,device_config["remote"]["display"]); preview = true; }
		if (remote_display == undefined)      { remote_display     = {}; }
		if (preview_display_size == "")       { remote_display_size = device_config["remote"]["display-size"]; }
		else                                  { remote_display_size = this.json.get_value(preview_display_size,device_config["remote"]["display-size"]); preview = true; }
		if (remote_display_size == undefined) { remote_display_size = "middle"; }
		
		// Start remote control edit section
		var remote = "";
		remote += "<center class='remote_edit_headline'><b>Edit remote &quot;"+device_info["label"]+"&quot;</b> ["+device+"]</center>";
		remote += this.basic.edit_line();
			
		// Add elements
		var link_template = this.app_name+".remote_import_templates('device','"+device+"','add_template','remote_json_buttons');";
		var link_preview  = this.app_name+".device_remote_preview('"+device+"');"
		
		var edit = "";
		edit    += this.tab.start();
		edit    += this.tab.row(
				this.basic.select_array("add_button_select","defined button", device_config["buttons"], "", ""),
				this.button.edit(this.app_name+".remote_add_button('device','"+device+"','add_button_select','remote_json_buttons');", lang("BUTTON_T"),"")
				);
		edit    += this.tab.row(
				this.basic.input("add_button"),
				this.button.edit(this.app_name+".remote_add_button('device','"+device+"','add_button',        'remote_json_buttons');", lang("BUTTON_T_OTHER"),"")
				);
		edit    += this.tab.row(
				this.basic.input("add_line_text"),
				this.button.edit(this.app_name+".remote_add_line('device',  '"+device+"','add_line_text',     'remote_json_buttons');", lang("BUTTON_T_LINE_TEXT"),"")
				);
		edit    += this.tab.line();
		if (device_config["commands"]["set"].length > 0 || device_config["commands"]["get"] > 0) {
			var onchange_slider_param = this.app_name+".remote_prepare_slider('device','"+device+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','remote_json_buttons');";

			edit    += this.tab.row(
			        this.basic.select_array("add_slider_cmd",lang("BUTTON_T_SEND"), device_config["commands"]["set"], "", ""),
				    this.button.edit("","","disabled")
				    );
			edit    += this.tab.row( 
				    this.basic.select_array("add_slider_param",lang("BUTTON_T_PARAMETER"), device_config["commands"]["get"], onchange_slider_param, ""),
				    this.button.edit("","","disabled")
                    );
			edit    += this.tab.row( 
                    this.basic.input("add_slider_descr", lang("BUTTON_T_DESCRIPTION")),
                    this.button.edit("","","disabled")
                    );
			edit    += this.tab.row( 
                    this.basic.input("add_slider_minmax",lang("BUTTON_T_MINMAX")),
                    this.button.edit(this.app_name+".remote_add_slider('device','"+device+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','remote_json_buttons');", "slider","")
                    );
			edit    += this.tab.line();
			}
		else {
			edit    += this.tab.row( 
                    lang("SLIDER_N/A"),
                    this.button.edit("N/A","","disabled")
                    );
			}

        var select_color_values = [];
        for (var i=0;i<device_config["commands"]["set"].length;i++) {
            var key = device_config["commands"]["set"][i];
            if (device_config["commands"]["definition"][key] != undefined && device_config["commands"]["definition"][key]["values"] != undefined &&
                device_config["commands"]["definition"][key]["values"]["min"] != undefined && device_config["commands"]["definition"][key]["values"]["max"] != undefined) {
                select_color_values.push(key);
            }
            else if (device_config["commands"]["definition"][key] != undefined && device_config["commands"]["definition"][key]["type"] == "list") {
                select_color_values.push(key);
            }
        }

		if (select_color_values.length > 0) {
		    var color_models = ["Brightness", "Color RGB", "Color CIE_1931", "Color RGB (small)",  "Color CIE_1931 (small)", "Color temperature"];

			edit    += this.tab.row(
                    this.basic.select_array("add_colorpicker_cmd",lang("BUTTON_T_SEND"), select_color_values, "", ""),
                    this.button.edit("","","disabled")
                    );
			edit    += this.tab.row(
                    this.basic.select_array("add_colorpicker_model", lang("BUTTON_T_COLOR"), color_models),
                    this.button.edit(this.app_name+".remote_add_colorpicker('device','"+device+"','add_colorpicker_cmd','remote_json_buttons');", lang("BUTTON_T_COLORPICKER"),"")
                    );
			}
		else {
			edit    += this.tab.row( 
                    lang("COLORPICKER_N/A"),
                    this.button.edit("N/A","","disabled")
                    );
			}

		this.button.width = "90px";

		edit    += this.tab.line();
		edit    += this.tab.row("<center>"+
				this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','.',      'remote_json_buttons');", lang("BUTTON_T_EMPTY"),"") + "&nbsp; " +
				this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','LINE',   'remote_json_buttons');", lang("BUTTON_T_LINE"),"") + "&nbsp; " +
				this.button.edit(this.app_name+".remote_add_display('device','"+device+"','DISPLAY','remote_json_buttons');", lang("BUTTON_T_DISPLAY"),"") + "&nbsp; "+
				"</center>",
				false
				);
		edit    += this.tab.end();

		remote += this.basic.container("remote_edit_add","Add elements",edit,false);

		// Edit display
		var check_display   = JSON.stringify(remote_definition);
		var display_add_cmd = this.app_name+".display_add_value('device','"+device+"','add_display_device','remote_display_value','remote_display_label','remote_json_display','remote_display_size')";
		var display_del_cmd = this.app_name+".display_delete_value('device','"+device+"','remote_json_display','remote_display_delete')";
		
		edit    = this.tab.start();
		if (check_display.indexOf("DISPLAY") < 0) { 
			edit   += this.tab.row(
                    lang("DISPLAY_NOT_ADDED"),
                    this.button.edit(this.app_name+".remote_add_display('device','"+device+"','DISPLAY',        'remote_json_buttons');", lang("BUTTON_T_DISPLAY"),"")
                    );
			}
		else {
			edit   += this.tab.row(
                    lang("DISPLAY_EXISTS"),
                    this.button.edit("","","disabled")
                    );
			}
		edit   += this.tab.row(
				this.basic.select("remote_display_size","display size", display_sizes, "", remote_display_size),
				this.button.edit(this.app_name+".device_remote_preview('"+device+"');",lang("BUTTON_T_PREVIEW"))
				);
		edit   += this.tab.line();
		edit   += this.tab.row(
				"<input id='add_display_device' style='display:none;' value='X'>"+
				this.device_display_select(device,'remote_display_value'),
				this.button.edit("N/A","","disabled") 
				);
		edit   += this.tab.row(
				this.basic.input("remote_display_label",lang("LABEL")),
				this.button.edit(display_add_cmd,lang("BUTTON_T_VALUE")) 
				);
		edit   += this.tab.line();
		edit   += this.tab.row(
				this.basic.select_array("remote_display_delete",lang("BUTTON_T_DISPLAY_VALUE"), Object.keys(remote_display),"",""),
				this.button.edit(display_del_cmd,lang("BUTTON_T_DEL_VALUE"))
				);
		edit   += this.tab.end();
		remote += this.basic.container("display_size",lang("EDIT_DISPLAY"),edit,false);
				
		// load template
		edit     = this.tab.start();
		var templates = this.template_list("device");
		edit    += this.tab.row(
				this.template_select("add_template",lang("BUTTON_T_TEMPLATE"),templates),
				this.button.edit(link_template,lang("BUTTON_T_CLONE"),"")
				);
		edit    += this.tab.end();
		remote += this.basic.container("remote_edit_template",lang("LOAD_TEMPLATE"),edit,false);
		
		// Delete elements		
		edit     = this.tab.start();
		edit    += this.tab.row(
				this.button_select("del_button",device,remote_definition),
				this.button.edit(this.app_name+".remote_delete_button('device','"+device+"','del_button','remote_json_buttons');", lang("BUTTON_T_DELETE"),"")
				);
		edit    += this.tab.end();
		remote += this.basic.container("remote_edit_delete",lang("DELETE_ELEMENTS"),edit,false);

		if (device_config["method"] == "record") {
			this.button.height = "45px";
			edit   = this.tab.start();
			edit  += this.tab.row(		
                     this.command_select_record("rec_button",device),
                     this.button.edit("apiCommandRecord('"+device+"','rec_button');",lang("RECORD_COMMAND"))
                     );
			edit  += this.tab.row( "<small>"+lang("COMMAND_RECORD_INFO")+"</small>", false);
			edit  += this.tab.line();
			edit  += this.tab.row(
                     this.command_select("del_command",device),
                     this.button.edit("apiCommandDelete('"+device+"','del_command');",lang("DELETE_COMMAND"))
                     );
			edit  += this.tab.row( "<small>"+lang("COMMAND_DELETE_INFO")+"</small>", false);
			edit  += this.tab.end();
			this.button.height = "30px";
			remote += this.basic.container("remote_edit_rec-edit",lang("RECORD_DELETE_COMMANDS"),edit,false);
			}
			
		remote += this.basic.edit_line();


		// JSON Edit		
		remote += this.basic.container("remote_json",   lang("JSON_REMOTE"),    this.json.textarea( "remote_json_buttons", remote_definition, "buttons" ) +
		                                                                        "<br/>" + lang("MANUAL_REMOTE"),false);
		remote += this.basic.container("display_json",  lang("JSON_DISPLAY"),   this.json.textarea( "remote_json_display", remote_display ) +
		                                                                        "<br/>" + lang("MANUAL_DISPLAY"),false);
		
        this.button.width = "23%";
        remote += "<br/>";
		remote += this.basic.edit_line();
		remote += "<br/><center>" +
		          this.button.edit(this.app_name+".device_edit_json('"+id+"','"+device+"');"+
		          this.app_name+".device_remote('"+this.frames_remote[0]+"','"+device+"','remote_json_buttons','remote_json_channel');"+
		          this.app_name+".device_notused('"+this.frames_remote[2]+"','"+device+"','remote_json_buttons');",lang("BUTTON_T_RESET")) + "&nbsp;" +
		          this.button.edit("apiDeviceJsonEdit('"+device+"','remote_json_buttons','remote_json_display','remote_display_size');",lang("BUTTON_T_SAVE")) + "&nbsp;" +
		          this.button.edit(this.app_name+".device_remote_preview('"+device+"');",lang("BUTTON_T_PREVIEW")) + "&nbsp;" +
		          this.button.edit("remoteToggleEditMode(false);"+this.app_name+".create('"+this.active_type+"','"+device+"');","stop edit") +
		          "</center><br/>";
		
		setTextById(id,remote);
		//return remote;
		}

	// reread data from current definition and create preview
	this.scene_remote_preview       = function (scene) {
		this.scene_edit_json( id=this.frames_edit[0], scene=scene, preview_remote='json::remote', preview_channel='json::macro-channel', preview_display='json::display', preview_display_size='json::display-size');
		this.scene_remote(    id=this.frames_remote[0], scene=scene, preview_remote='json::remote', preview_display='json::display', preview_display_size='json::display-size');
		this.scene_channels(  id=this.frames_remote[2], scene=scene, preview_channel='json::macro-channel');
		}
	
	// create remote for a specific scene
	this.scene_remote               = function (id="", scene="", preview_remote="", preview_display="", preview_display_size="") {
	    
		var toggle_done;
        var preview                 = false;
		var remote                  = "";
		var remote_definition       = [];
		var remote_channel          = [];
    	var scene_definition        = this.data["CONFIG"]["scenes"][scene];
		var scene_label             = scene_definition["settings"]["label"];
        this.display.edit_mode      = this.edit_mode;


		appCookie.set("remote","scene::"+scene+"::"+scene_label);

		if (this.data["CONFIG"]["scenes"][scene] && this.data["CONFIG"]["scenes"][scene]["remote"] && this.data["CONFIG"]["scenes"][scene]["remote"]["remote"]) {
			}		
		else {
			if (this.data["STATUS"]["config_errors"]["scenes"][scene]) {
				var errors = this.data["STATUS"]["config_errors"]["scenes"][scene];
				remote += "<b class='entry_error'>"+lang("REMOTE_CONFIG_ERROR",[scene])+"</b>";
				remote += "<hr/><ul>";
				for (key in errors) {
					remote += "<li><u>"+key+"</u>:<br/>"+errors[key]+"</li>";
					}
				remote += "</ul>";
				}
			else {
				remote += lang("REMOTE_CONFIG_ERROR_UNKNOWN",[scene]);
				}
			remote += "</div>";
			setTextById(id,remote);
			appMsg.alert(lang("MISSING_DATA_SCENE",[scene,this.data["CONFIG"]["scenes"][scene]["config"]["remote"]+".json"]));
			console.warn(lang("MISSING_DATA_SCENE"));
			console.warn(this.data["CONFIG"]["scenes"][scene]);
			return;
			}

        // prepare macros
        var scene_macros     = {}
		var macros           = this.data["CONFIG"]["macros"]["global"];
		var macros_deviceOn  = this.data["CONFIG"]["macros"]["device-on"];
		var macros_deviceOff = this.data["CONFIG"]["macros"]["device-off"];

		for (var key in scene_definition["remote"]["macro-scene"]) {
		    macros[key] = scene_definition["remote"]["macro-scene"][key];
		    }
		if (scene_definition["remote"]["macro-scene"] != undefined) {
            scene_macros["scene-on"]    = scene_definition["remote"]["macro-scene-on"];
            scene_macros["scene-off"]   = scene_definition["remote"]["macro-scene-off"];
        }

		if (scene_macros["scene-on"] == undefined || scene_macros["scene-on"] == [])   { scene_macros["scene-on"] = {}; }
		if (scene_macros["scene-off"] == undefined || scene_macros["scene-off"] == []) { scene_macros["scene-off"] = {}; }

		// check if preview
		if (preview_remote == "")            { remote_definition  = scene_definition["remote"]["remote"]; }
		else                                 { remote_definition  = this.json.get_value(preview_remote, scene_definition["remote"]["remote"]); preview = true; }
		
		if (preview_display == "")           { remote_display     = scene_definition["remote"]["display"]; }
		else                                 { remote_display     = this.json.get_value(preview_display,scene_definition["remote"]["display"]); preview = true; }
		
		if (preview_display_size == "")      { remote_display_size = scene_definition["remote"]["display-size"]; }
		else                                 { remote_display_size = this.json.get_value(json=preview_display_size, default_data=remote_display_size); preview = true; }

		if (remote_display_size == undefined) { remote_display_size = "middle"; }

		// create remote
		remote += "<div id='scene_button' style='display:block;'>";
		if (preview) { remote += "<b>"+lang("PREVIEW")+":</b><br/><hr/>"; }
		
		for (var i=0; i<remote_definition.length; i++) {

			var next_button	= "";
			var button_def = remote_definition[i];
			var button     = remote_definition[i].split("_");
			var cmd    	   = button[0] + "_" + button[1];

			if (remote_definition[i] == "scene-on")  { cmd = "scene-on_"+scene;  button = ["scene-on", scene];  button_def = cmd; }
			if (remote_definition[i] == "scene-off") { cmd = "scene-off_"+scene; button = ["scene-off", scene]; button_def = cmd; }

			if (this.edit_mode) {
				var button_name      = cmd.split("||")[0];
				var button_name_test = button_name.split("_");
				if (button_name_test[1] == "undefined") { button_name = button_name_test[0]; }
				 
				var context_menu      = "["+i+"] <b>" + button_name + "</b><br/><br/>";
				var link_preview      = this.app_name+".scene_remote_preview('"+scene+"');";
				
				var link_delete       = this.app_name+".remote_delete_button('scene','"+scene+"','"+i+"','json::remote');";
				var link_move_left    = this.app_name+".remote_move_button(  'scene','"+scene+"',"+i+",'json::remote','left');";
				var link_move_right   = this.app_name+".remote_move_button(  'scene','"+scene+"',"+i+",'json::remote','right');";
				
				var link_button_left  = this.app_name+".remote_add_button(   'scene','"+scene+"','add_button_"+i+"','json::remote','"+i+"');";
				var link_button_right = this.app_name+".remote_add_button(   'scene','"+scene+"','add_button_"+i+"','json::remote','"+(i+1)+"');";
				this.button.width     = "50px;"
				var input_add_button  = "<br/>&nbsp;<br/><input id='add_button_"+i+"' style='width:100px'><br/>&nbsp;<br/>" +
							            this.button.edit( link_button_left + link_preview, "&lt; +") +
							            this.button.edit( link_button_right + link_preview, "+ &gt;");

				this.button.width    = "30px;";
				if (i > 0) { context_menu += this.button.edit( link_move_left  + link_preview, "&lt;",""); }
							 context_menu += this.button.edit( link_delete     + link_preview, "x","");
				if (i+1 < remote_definition.length) {
				             context_menu += this.button.edit( link_move_right + link_preview, "&gt;",""); }
				context_menu += input_add_button;
				}
																		
			if (button[0] == "LINE")                     { next_button = this.basic.line(""); }
			else if (button[0].indexOf("LINE||") == 0)   { next_button = this.basic.line(button[0].split("||")[1]); }
			else if (button[0] == ".")                   { next_button = this.button.device( scene+i, ".", scene_label, "", "", "disabled" ); }
			else if (button[0] == "macro")               { next_button = this.button.macro(  cmd, button[1], scene_label, "", macros[button[1]], "" );
									                       this.active_buttons.push(cmd); }
			else if (button[0] == "scene-on")            { next_button = this.button.macro( "scene_on_"+button[1], "on", scene_label,"", scene_macros["scene-on"], "" );
                                                           this.active_buttons.push(        "scene_on_"+button[1]); }
			else if (button[0] == "scene-off")           { next_button = this.button.macro( "scene_off_"+button[1], "off", scene_label, "", scene_macros["scene-off"], "" );
                                                           this.active_buttons.push(        "scene_off_"+button[1]); }
			else if (button[0] == "device-on")           { next_button = this.button.macro( button[1]+"_on", "on", scene_label,"", macros_deviceOn[button[1]], "" );
                                                           this.active_buttons.push(        button[1])+"_on"; }
			else if (button[0] == "device-off")          { next_button = this.button.macro( button[1]+"_off", "off", scene_label, "", macros_deviceOff[button[1]], "" );
                                                           this.active_buttons.push(        button[1]+"_off"); }
			else if (button[1] == "keyboard")            { this.keyboard.set_device(button[0]);
                                                           next_button = this.button.device_keyboard( cmd, button[1], device, "", cmd, "" );
                                                           this.active_buttons.push(cmd); }
			else if (button[0].indexOf("HEADER-IMAGE") == 0) {
			                                               var toggle_html = "";
			                                               if (remote_definition[i+1].indexOf("TOGGLE") == 0 && button_def.indexOf("toggle") > 0) {
			                                                    var toggle = remote_definition[i+1];
			                                                    toggle_html = this.slider_element_toggle(id, toggle, "devices", toggle.split("||"), short=true);
			                                                    toggle_done = i+1;
			                                                    }
			                                               next_button = this.scene_header_image(id, scene, toggle_html);
			                                               }
			else if (button == "DISPLAY")                { next_button = this.display.default(id, scene, "scenes", remote_display_size, remote_display); }

			else if (button.length > 1 && button[1].indexOf("SLIDER") == 0)
			                                             { next_button = this.slider_element(id, button[0], "devices", button[1].split("||")); }
			else if (button_def.indexOf("TOGGLE") == 0)  { if (i != toggle_done) {
			                                                    next_button = this.slider_element_toggle(id, button_def, "devices", button_def.split("||"), short=false);
			                                                    }
			                                             }
			else 						                 { next_button = this.button.device( cmd, button[1], scene_label, "", cmd, "" );
			                                               this.active_buttons.push(cmd); }
									  
			if (this.edit_mode) {
				if (button[0].indexOf("LINE") == 0)                 { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,30); }
				else if (button[0].indexOf("HEADER-IMAGE") == 0)    { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,20); }
				else if (button[0].indexOf("SLIDER") == 0)          { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,40); }
				else if (button[0].indexOf("TOGGLE") == 0)          { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,20); }
				else if (button[0].indexOf("DISPLAY") == 0)         { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }
				else                                                { this.tooltip.settings(this.tooltip_mode,this.tooltip_width,this.tooltip_height,this.tooltip_distance); }

				next_button = this.tooltip.create_inside( next_button, context_menu, i );
				}

			remote += next_button;
			}

		remote += "</div>";
		remote += this.keyboard.input();
		
		setTextById(id,remote);
		}

	// create list of channels (for scenes)
	this.scene_channels             = function (id, scene, preview_channel="") {

		var remote     = "";
		var scene_data = this.data["CONFIG"]["scenes"][scene];
		if (!scene_data || !scene_data["remote"] || !scene_data["remote"]["remote"]) { setTextById(id,""); return; }
		var scene_name = scene_data["settings"]["label"];

		if (preview_channel == "") { macros = scene_data["remote"]["macro-channel"]; }
		else                       { macros = this.json.get_value(preview_channel, scene_data["remote"]["macro-channel"]); preview = true; }

		channels = Object.keys(macros);
		channels = channels.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });

		this.tooltip.settings(this.tooltip_mode,this.tooltip_width,"80px",35);

    		// create list of channel buttons
    		for (var i=0; i<channels.length; i++) {
                var cmd   	= "channel_"+i; //channels[i];
                var next_button	= this.button.channel(cmd, channels[i], scene_name, macros[channels[i]],"","");
                var context_menu = "["+i+"] <b>" + cmd +  "</b><br/><br/><i>" + lang("CHANNEL_USE_JSON") +"</i>";
			
                if (this.edit_mode) {
                    next_button = this.tooltip.create_inside( next_button, context_menu, "channel_"+i );
                    }
                remote += next_button;
        		}

		// print
		setTextById(id,remote);
		}

	// write description for device remote
	this.scene_description          = function (id, scene) {
		var scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
		var label      = scene_info["label"];
		var descr      = scene_info["description"];
		var url        = scene_info["url"];
		if (url) { descr = "<a href=\""+url+"\" target='_blank'>"+descr+"</a>"; }
		var str   = "<center>" + label + ": " + descr + "</center>";
		setTextById(id,str);
		}

	// edit scene
	this.scene_edit                 = function (id, scene) {

		if (this.edit_mode)     { elementVisible(id); }
		else                    { elementHidden(id,"scene_edit"); return; }
	        
        if (this.data["STATUS"]["config_errors"]["scenes"][scene] || !this.data["CONFIG"]["scenes"][scene]["settings"]) {
	        	setTextById(id,"");
	        	return;
	        	}

		this.button.width       = "90px";
		this.basic.input_width  = "180px";
		
		var scene_info    = this.data["CONFIG"]["scenes"][scene]["settings"];
		var remote_info   = this.data["CONFIG"]["devices"];
		var remote        = "";

		remote  += "<center class='remote_edit_headline'><b>Edit scene &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";
		remote  += this.basic.edit_line();

		// main settings for the scene
		var edit = "";
		edit   += this.tab.start();
		edit   += this.tab.row( "ID:",                 scene );
		edit   += this.tab.row( "Label:",              this.basic.input("edit_label",        scene_info["label"]) );
		edit   += this.tab.row( "Description:&nbsp;",  this.basic.input("edit_description",  scene_info["description"]));
		edit   += this.tab.row( "Scene Image:&nbsp;",  this.image_select("edit_image",       scene_info["image"]) );
		edit   += this.tab.line();
		edit   += this.tab.row("<div id='scene_edit_header_image' style='align:center;'></div>","");
		edit   += this.tab.line();
		edit   += this.tab.row("<center>"+
		          "<input id='scene_visibility' value='"+scene_info["visible"]+"' style='display:none;'>"+
		          this.button.edit("apiRemoteChangeVisibility('scene','"+scene+"','scene_visibility');",lang("BUTTON_T_SHOW_HIDE")) + "&nbsp;" +
		          this.button.edit("apiSceneEdit('"+scene+"','edit','description,label,image');","save","") + "&nbsp;" +
		          this.button.edit("apiSceneDelete('"+scene+"');","delete","") + "</center>"
		          );
		edit   += this.tab.end();
		remote += this.basic.container("scene_main","Scene settings",edit,true);

		// file information
		edit    = this.tab.start();
		edit   += this.tab.row("Remote:&nbsp;&nbsp;",  this.data["CONFIG"]["scenes"][scene]["config"]["remote"]+".json" );
		edit   += this.tab.row("Devices:",             JSON.stringify(this.data["CONFIG"]["scenes"][scene]["remote"]["devices"]).replace(/,/g, ", "));
		edit   += this.tab.end();
		remote += this.basic.container("scene_info","Scene information",edit,false);
		remote  += "<br/>";
		
        if (this.edit_mode)     { elementVisible(id); }
        else                    { elementHidden(id,"device_edit"); return; }

		setTextById(id,remote);
		this.image_preview();
		}

	// create edit panel to edit JSON data
	this.scene_edit_json            = function (id, scene, preview_remote="", preview_channel="", preview_display="", preview_display_size="") {

        if (this.edit_mode) { elementVisible(id); }
        else                { elementHidden(id,"scene_edit_json"); return; }

        if (this.data["STATUS"]["config_errors"]["scenes"][scene] || !this.data["CONFIG"]["scenes"][scene]["settings"]) {
            setTextById(id,"");
            return;
            }

		var scene_remote  	= this.data["CONFIG"]["scenes"][scene]["remote"];
		var scene_info    	= this.data["CONFIG"]["scenes"][scene]["settings"];
		var remote_info   	= this.data["CONFIG"]["devices"];
		var display_sizes 	= this.display.sizes();
	        
		var link_template 	= this.app_name+".remote_import_templates('scene','"+scene+"','add_template','json::remote');";
		var link_preview  	= this.app_name+".scene_remote_preview('"+scene+"');";
	        
        var device_display	= {};
        var device_macro	= {};
	        
		for (key in this.data["CONFIG"]["devices"]) {
			device_macro[key]   = "Device: "+remote_info[key]["settings"]["label"];
			device_display[key] = remote_info[key]["settings"]["label"];
			}
		for (key in this.data["CONFIG"]["macros"])  {
			if (key != "description") { device_macro[key] = "Macro: "+key; }
			}
		device_macro["scene"] = "Macro: " + scene;
			
		var device_macro_onchange   = this.app_name +".scene_button_select(div_id='add_button_device_input','add_button_value','add_button_device','"+scene+"');";
		var device_display_onchange = this.app_name +".scene_display_select(div_id='add_display_input','add_display_value','add_display_device');";

        // prepare field values
		var json_edit_fields        = ["remote", "devices", "display", "display-size", "macro-channel", "macro-scene-on", "macro-scene-off", "macro-scene"];
		var json_edit_values        = {};
		var json_preview_values     = {
		        "remote": preview_remote,
		        "devices": "",
		        "display": preview_display,
		        "display-size": preview_display_size,
		        "macro-channel": preview_channel,
		        "macro-scene-on": [],
		        "macro-scene-off": [],
		        "macro-scene": {},
		        };
				
		// check if preview
		for (var i=0;i<json_edit_fields.length;i++) {
		    var field = json_edit_fields[i];
		    if (json_preview_values[field] == "") {
		        json_edit_values[field] = scene_remote[field];
		        }
		    else {
		        json_edit_values[field] = this.json.get_value(json_preview_values[field], scene_remote[field]);
		        // Error detected .... !
		        preview = true;
		        }
		    }

		if (json_edit_values["display"] == undefined)         { json_edit_values["display"] = {}; }
		if (json_edit_values["display-size"] == undefined)    { json_edit_values["display-size"] = "middle"; }
		if (json_edit_values["macro-scene-on"] == undefined)  { json_edit_values["macro-scene-on"] = []; }
		if (json_edit_values["macro-scene-off"] == undefined) { json_edit_values["macro-scene-off"] = []; }
		if (json_edit_values["macro-scene"] == undefined)     { json_edit_values["macro-scene"] = {}; }
		if (json_edit_values["macro-scene"] == "")            { json_edit_values["macro-scene"] = {}; }
		if (json_edit_values["macro-channel"] == undefined)   { json_edit_values["macro-channel"] = {}; }

		// header
		this.button.width = "100px";
		var remote = "";
		remote    += "<center class='remote_edit_headline'><b>Edit scene &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";
		remote    += this.basic.edit_line();
		
		// add elements
		edit    = this.tab.start();
		edit   += this.tab.row(
		          this.basic.select("add_button_device","device / macro", device_macro, device_macro_onchange),
		          this.button.edit("N/A","","disabled")
		          );
		edit   += this.tab.row(
		          "<input id='add_button_value' style='display:none;'/>" +
		          "<div id='add_button_device_input'><i><small>-&gt; "+lang("SELECT_DEV_MACRO")+"</small></i></div>",
		          this.button.edit(this.app_name+".remote_add_button('scene','"+scene+"','add_button_value','json::remote');", lang("BUTTON_T"),"")
		          );

		edit   += this.tab.row(
		          this.basic.input("add_line_text"),
		          this.button.edit(this.app_name+".remote_add_line(  'scene','"+scene+"','add_line_text',   'json::remote');", lang("BUTTON_T_LINE_TEXT"),"")
		          );
		edit   += this.tab.line();
		this.button.width = "90px";
		edit   += this.tab.row("<center>" +
		          this.button.edit(this.app_name+".remote_add_header('scene','"+scene+"','HEADER-IMAGE',    'json::remote');", lang("BUTTON_T_HEADER"),"") + "&nbsp;" +
		          this.button.edit(this.app_name+".remote_add_button('scene','"+scene+"','.',               'json::remote');", lang("BUTTON_T_EMPTY"),"") + "&nbsp;" +
		          "</center>", false
		          );
		edit   += this.tab.end();
		remote += this.basic.container("scene_add",lang("ADD_ELEMENTS"),edit,false);

		// Edit display
		var check_display   = JSON.stringify(json_edit_values["remote"]);
		var display_add_cmd = this.app_name+".display_add_value('scene','"+scene+"',   'add_display_device','scene_display_value','scene_display_label','json::display','json::display-size')";
		var display_del_cmd = this.app_name+".display_delete_value('scene','"+scene+"','json::display','scene_display_delete')";
		
		edit    = this.tab.start();
		if (check_display.indexOf("DISPLAY") < 0) { 
			edit   += this.tab.row(
				lang("DISPLAY_NOT_ADDED"),
				this.button.edit(this.app_name+".remote_add_display('scene','"+scene+"','DISPLAY','json::remote');", lang("BUTTON_T_DISPLAY"),"")
				);
			}
		else {
			edit   += this.tab.row(
			          lang("DISPLAY_EXISTS"),
			          this.button.edit("","","disabled")
			          );
			}

		edit   += this.tab.row(
		          //!this.basic.select("scene_display_size","display size", display_sizes, "", remote_display_size),
		          this.basic.select("json::display-size","display size", display_sizes, "", json_edit_values["display-size"]),
		          this.button.edit(this.app_name+".scene_remote_preview('"+scene+"');",lang("BUTTON_T_PREVEW"))
		          );
		edit   += this.tab.line();
		edit   += this.tab.row(
		          this.basic.select("add_display_device",lang("BUTTON_T_DEVICE"),device_display,device_display_onchange),
		          this.button.edit("N/A","","disabled")
		          );
		edit   += this.tab.row(
		          "<input id='add_display_value' style='display:none;'/>" +
		          "<div id='add_display_input'><i><small>-&gt; "+lang("SELECT_DEV_FIRST")+"</small></i></div>",
		          this.button.edit("N/A","","disabled")
		          );
		edit   += this.tab.row(
		          this.basic.input("scene_display_label",lang("LABEL")),
		          this.button.edit(display_add_cmd,lang("BUTTON_T_VALUE"))
		          );
		edit   += this.tab.line();
		edit   += this.tab.row(
		          this.basic.select_array("scene_display_delete","display value", Object.keys(json_edit_values["display"]),"",""),
		          this.button.edit(display_del_cmd,lang("BUTTON_T_DEL_VALUE"))
		          );

		edit   += this.tab.end();
		remote += this.basic.container("display_size",lang("EDIT_DISPLAY"),edit,false);


		// load template
		this.button.width = "100px";
		edit    = this.tab.start();
		edit   += this.tab.row(
		          this.template_select("add_template",lang("BUTTON_T_TEMPLATE"),this.templates),
		          this.button.edit(link_template,lang("BUTTON_T_CLONE"),"")
		          );
		edit   += this.tab.end();
		remote += this.basic.container("scene_template",lang("LOAD_TEMPLATE"),edit,false);

		// delete elements
		edit    = this.tab.start();
		edit   += this.tab.row(
		          this.button_select("del_button",scene,json_edit_values["remote"]),
		          this.button.edit(this.app_name+".remote_delete_button('scene','"+scene+"','del_button','json::remote');", lang("BUTTON_T_DEL"),"")
		          );
		edit   += this.tab.end();

		remote += this.basic.container("scene_delete",lang("DELETE_ELEMENTS"),edit,false);
		remote += this.basic.edit_line();

		// edit JSON file
		remote += this.basic.container("devices_definition",lang("JSON_DEVICE"), "Required Devices: &nbsp;"+this.basic.input("json::devices", JSON.stringify(scene_remote["devices"])) +
		                                                    "<br/>&nbsp;<br/>" + lang("MANUAL_DEVICES"),false);
		remote += this.basic.container("scene_json",        lang("JSON_REMOTE"), this.json.textarea( "json::remote", json_edit_values["remote"], "buttons" ) +
		                                                    "&nbsp;<br/>" + lang("MANUAL_SCENE"),false);
		remote += this.basic.container("display_definition",lang("JSON_DISPLAY"), this.json.textarea( "json::display", json_edit_values["display"] ) +
		                                                    "&nbsp;<br/>" + lang("MANUAL_DISPLAY"),false);
		remote += this.basic.container("channel_json",      lang("JSON_CHANNEL"), this.json.textarea( "json::macro-channel", json_edit_values["macro-channel"], "channels"  ) +
		                                                    "&nbsp;<br/>" + lang("MANUAL_CHANNEL"),false);
		remote += this.basic.container("macros_json",       lang("JSON_SCENE_MACROS"), "<i>" +
		                                                    "Macro SCENE ON: &nbsp;"  +
		                                                    this.json.textarea("json::macro-scene-on", json_edit_values["macro-scene-on"]) + "<br/>" +
		                                                    "Macro SCENE OFF: &nbsp;" +
		                                                    this.json.textarea("json::macro-scene-off", json_edit_values["macro-scene-off"]) + "<br/>" +
		                                                    "Other SCENE macros: &nbsp;" +
		                                                    this.json.textarea( "json::macro-scene", json_edit_values["macro-scene"] ) +
		                                                    "</i>&nbsp;<br/>" + lang("MANUAL_MACROS_SCENE"),false);
		remote += this.basic.edit_line();

        this.button.width = "23%";
		remote += "<br/><center>" +
		          this.button.edit(this.app_name+".scene_edit_json('"+id+"','"+scene+"');"+
				                   this.app_name+".scene_remote(  '"+this.frames_remote[0]+"','"+scene+"','json::remote','json::display');"+
				                   this.app_name+".scene_channels('"+this.frames_remote[2]+"','"+scene+"','json::macro-channel');",
				                   lang("BUTTON_T_RESET")) + "&nbsp;" +
                  this.button.edit("apiSceneJsonEdit('"+scene+"','json::remote,json::devices,json::display,json::macro-channel,json::macro-scene-on,json::macro-scene-off,json::macro-scene,json::display-size');",
				                   lang("BUTTON_T_SAVE"),"") + "&nbsp;" +
                  this.button.edit(this.app_name+".scene_remote(  '"+this.frames_remote[0]+"','"+scene+"','json::remote','json::display','json::display-size');"+
				                   this.app_name+".scene_channels('"+this.frames_remote[2]+"','"+scene+"','json::macro-channel');",
				                   lang("BUTTON_T_PREVIEW")) + "&nbsp;" +
		          this.button.edit("remoteToggleEditMode(false);"+this.app_name+".create('"+this.active_type+"','"+scene+"');","stop edit") +
				  "</center><br/>";

		setTextById(id,remote);
		}

    // create header image for scenes
	this.scene_header_image         = function (id, scene, toggle_html, selected="") {
	
		var scene_info    = this.data["CONFIG"]["scenes"][scene]["settings"];
		var scene_images  = this.data["CONFIG"]["elements"]["scene_images"];
		var label         = scene_info["label"];
		var image         = scene_info["image"];
		
		if (selected == "" && scene_images[image]) {
			image = scene_images[image][0];
			}
		else if (scene_images[selected]) {
			image = scene_images[selected][0];
			}

		if (image && image != "") {
			var image_html = "<button class='rm-button header_image' style='background-image:url("+rm3scene_dir+image+")'>";
			image_html    += " <div class='header_image_toggle_container' id='toggle_place_"+id+"'>"+toggle_html+"</div>";
			image_html    += " <div class='header_image_fade'>";
			image_html    += "  <div class='header_image_text'>&nbsp;<br/>&nbsp;<br/>"+label+"</div>";
			image_html    += " </div>";
			image_html    += "</button>";
			return image_html;
			}
		}

	// create from unsaved data for preview
	this.remote_preview             = function (type, name) {
		if (type == "scene") { this.scene_remote_preview( name ); }
		else                 { this.device_remote_preview( name ); }
		}

	// add header to JSON
	this.remote_add_header          = function (type,scene,button,remote,position="") {
		var value     = this.json.get_value(remote);
		if (value.indexOf("HEADER-IMAGE") < 0) {
			this.remote_add_button(type,scene,button,remote,"FIRST");
			this.remote_preview( type, scene );
			}
		else {
			appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
			}
		}

	// add display to JSON
	this.remote_add_display         = function (type,scene,button,remote,position="") {
		var value     = this.json.get_value(remote);
		if (value.indexOf("DISPLAY") < 0) {
			this.remote_add_button(type,scene,button,remote,position);
			this.remote_preview( type, scene );
			}
		else {
			appMsg.alert(lang("DISPLAY_EXISTS"));
			}
		}

	// add a line with description
	this.remote_add_line            = function (type,scene,button,remote,position="") {
		if (document.getElementById(button)) { button = "LINE||"+getValueById(button); }
		this.remote_add_button(type,scene,button,remote,position);
		this.remote_preview( type, scene );
		}

	// add a slider with description
	this.remote_add_slider          = function (type,scene,slider_cmd,slider_param,slider_descr,slider_minmax,remote,position="") {
	
		var s_cmd    = getValueById(slider_cmd);
		var s_param  = getValueById(slider_param);
		var s_descr  = getValueById(slider_descr);
		var s_minmax = getValueById(slider_minmax);
	
		if (s_cmd == ""    || s_cmd == undefined)   { appMsg.alert(lang("SLIDER_SELECT_CMD")); return; }
		if (s_param == ""  || s_param == undefined) { appMsg.alert(lang("SLIDER_SELECT_PARAM")); return; }
		if (s_descr == ""  || s_descr == undefined) { appMsg.alert(lang("SLIDER_INSERT_DESCR")); return; }
		if (s_minmax == "" || s_minmax == undefined){ appMsg.alert(lang("SLIDER_INSERT_MINMAX")); return; }

		var button = "SLIDER||send-"+s_cmd+"||"+s_descr+"||"+s_minmax+"||"+s_param;
		this.remote_add_button(type,scene,button,remote,position);
		this.remote_preview( type, scene );
		}

	// prepare slider
	this.remote_prepare_slider      = function (type,device,slider_cmd,slider_param,slider_descr,slider_minmax,remote,position="") {

		var s_param  = getValueById(slider_param);
		var s_descr  = "description";
		if (s_param == ""  || s_param == undefined)	{ appMsg.alert(lang("SLIDER_SELECT_PARAM")); return; }

		s_descr = s_param.charAt(0).toUpperCase() + s_param.slice(1);
		setValueById(slider_descr, s_descr);
		
		var cmd_definition = this.data["CONFIG"]["devices"][device]["commands"]["definition"];

		console.info(JSON.stringify(cmd_definition[s_param]));
		if (cmd_definition && cmd_definition[s_param]) {
			var min = "min";
			var max = "max";
			var exist = false;
			if (cmd_definition[s_param]["values"]) {
				if (cmd_definition[s_param]["values"]["min"] != undefined)	{ min = cmd_definition[s_param]["values"]["min"]; exist = true; }
				if (cmd_definition[s_param]["values"]["max"] != undefined)	{ max = cmd_definition[s_param]["values"]["max"]; exist = true; }
				}				
			if (exist) { setValueById(slider_minmax, min+"-"+max); }
			}		
		}

	// add a line with description
	this.remote_add_colorpicker     = function (type,scene,button_select,remote,position="") {

        var color_model = "";
		var button = getValueById(button_select);
		if (button == "" || button == undefined)	{ appMsg.alert(lang("COLORPICKER_SELECT_CMD")); return; }

        if (document.getElementById("add_colorpicker_model"))   { color_model = "||" + document.getElementById("add_colorpicker_model").value; }
		if (document.getElementById(button_select))             { button = "COLOR-PICKER||send-" + button + color_model; }

        if (document.getElementById("remote_json_buttons").innerHTML.indexOf(button) > -1) {
            appMsg.alert(lang("MSG_ONLY_ONE_COLOR_PICKER"));
            }
        else {
		    this.remote_add_button(type,scene,button,remote,position);
		    this.remote_preview( type, scene );
		    }
		}

	// add button to JSON	
	this.remote_add_button          = function (type,scene,button,remote,position="") {
	
		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "" || button == undefined) { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
		
		var value     = this.json.get_value(remote);
		var value_new = [];
		if (position == "FIRST") { value_new.push(button); }
		
		for (var i=0;i<value.length;i++) {
			if (i == position && position != "" && position != "FIRST") { value_new.push(button); }
			value_new.push(value[i]);
			}
		if (position == "") { value_new.push(button); }

		this.json.textarea_replace(remote,value_new);
		this.remote_preview( type, scene );
		}
	
	// delete button from JSON
	this.remote_delete_button       = function (type,scene,button,remote) {

		if (document.getElementById(button)) { button = getValueById(button); }
		if (button == "") { appMsg.alert(lang("BUTTON_SELECT")); return; }
		
		value     = this.json.get_value(remote);
		value_new = [];
		for (var i=0;i<value.length;i++) {
			if (i != button) { value_new.push(value[i]); }
			}

		this.json.textarea_replace(remote,value_new);
		this.remote_preview( type, scene );
		}
	
	// move button in JSON (left or right)
	this.remote_move_button         = function (type,scene,button,remote,left_right) {
		var value = this.json.get_value(remote);
		var temp  = value[button];

		if (left_right == "left")  { if (button > 0)			{ var target = button - 1; value[button] = value[target]; value[target] = temp; } }
		if (left_right == "right") { if (button < value.length)	{ var target = button + 1; value[button] = value[target]; value[target] = temp; } }

		this.json.textarea_replace(remote,value);
		this.remote_preview( type, scene );
		}

	// import remote definition from template to JSON
	this.remote_import_templates    = function (type,scene,template,remote) {
		var value = getValueById(template);
		if (value == "") { appMsg.alert(lang("DEVICE_SELECT_TEMPLATE")); return; }

		var template    = this.data["CONFIG"]["templates"]["definition"][value];
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

		this.json.textarea_replace(remote,value_new);
		this.remote_preview( type, scene );
		}

	// add value to JSON
	this.display_add_value          = function (type,scene,device,value,label,display_json,display_size) {

		var device_new  = getValueById(device);
		var value_new   = getValueById(value);
		var label_new   = getValueById(label);

		if (device_new == "" || value_new == undefined) { appMsg.alert(lang("DISPLAY_VALUE_SELECT")); return; }
		if (value_new == ""  || value_new == undefined) { appMsg.alert(lang("DISPLAY_VALUE_SELECT")); return; }
		if (label_new == ""  || label_new == undefined) { appMsg.alert(lang("DISPLAY_LABEL_ADD")); return; }

		var display_new = this.json.get_value(display_json);
		
		if (! display_new[label_new] && device_new != "X")	{ display_new[label_new] = device_new + "_" + value_new; }
		if (! display_new[label_new])				{ display_new[label_new] = value_new; }
		else							{ appMsg.alert(lang("DISPLAY_LABEL_EXISTS_ALREADY")); }

		this.json.textarea_replace(display_json,display_new);
		this.remote_preview( type, scene );
		}

	// add value from JSON
	this.display_delete_value       = function (type,scene,display_json,remove_label) {

		var label_new   = getValueById(remove_label);
		var display_new = this.json.get_value(display_json);

		if (label_new == "" || label_new == undefined)  { appMsg.alert(lang("DISPLAY_LABEL_SELECT")); return; }
		if (! display_new[label_new])                   { appMsg.alert(lang("DISPLAY_LABEL_DONT_EXIST")); return; }
		else                                            { delete display_new[label_new]; }

		this.json.textarea_replace(display_json,display_new);
		this.remote_preview( type, scene );
		}

	// return drop-down with available commands
	this.command_select             = function (id,device="") {
        var list = {};
        if (device != "" && device in this.data["CONFIG"]["devices"]) {
            button_list = this.button_list(device);
            for (var i=0;i<button_list.length;i++) {
                list[device+"_"+button_list[i]] = button_list[i];
            }
        }
        return this.basic.select(id,"command",list);
        }
        
    // return drop-down with commands to be recorded
	this.command_select_record      = function (id,device="") {
        var list = {};
		var device_buttons    = [];		
		if (device != "" && device in this.data["CONFIG"]["devices"]) {
            var button_list = [];
            for (var i=0;i<this.data["CONFIG"]["devices"][device]["remote"].length;i++) {
                button_list.push(this.data["CONFIG"]["devices"][device]["remote"][i]);
                }
            button_list.sort();

            for (var i=0;i<button_list.length;i++) {
                if (button_list[i].includes("LINE") == false && button_list[i] != "." && button_list[i].includes("DISPLAY") == false) {
                    list[button_list[i]] = button_list[i];
                    }
                }
            }
        return this.basic.select(id,"button",list);
        }

	// return drop-down with scene images
	this.image_select               = function (id,selected="") {
		var list     = {};
		var images   = this.data["CONFIG"]["elements"]["scene_images"];
		
		for (var key in images) {
			list[key] = key;
			}

		return this.basic.select(id,"header-image",list,"rm3remotes.image_preview('"+id+"');",selected);
		}

	// header-image preview
	this.image_preview              = function (id) {
	    var images     = this.data["CONFIG"]["elements"]["scene_images"];
        var selected   = getValueById("edit_image");
        if (images[selected]) {
            var image_html = this.scene_header_image(id, scene, selected);
            var image_html = "<img src='"+rm3scene_dir+images[selected][0]+"' style='width:100%;'>";
            image_html += "<br/><small><a href='" + images[selected][1]+"' target='_blank'>"+ images[selected][1]+"</a></small><br/>&nbsp;";
            setTextById("scene_edit_header_image", image_html);
            }
        }

	// return drop-down with scene images
	this.button_image_select        = function (id,selected="") {
		var list     = {};
		var images   = this.data["CONFIG"]["elements"]["button_images"];

		for (var key in images) {
			list[key] = key;
			}

		return this.basic.select(id,"button-image",list,"rm3remotes.button_image_preview('"+id+"');",selected);
		}

	// header-image preview
	this.button_image_preview       = function (id) {
	    var images     = this.data["CONFIG"]["elements"]["button_images"];
        var selected   = getValueById("edit_image");
        if (images[selected]) {
            var image_html = "<img src='icon/"+images[selected]+"' class='rm-button_image_start'>";
            setTextById("device_edit_button_image", image_html);
            }
        }

	// return list of buttons for a device
	this.button_list                = function (device) {
		if (this.data["CONFIG"]["devices"][device]) 	{ return this.data["CONFIG"]["devices"]["buttons"]; }
		else						{ return ["error:"+device]; }
		}

	// return list of templates                
	this.template_list              = function (type="") {
        	var templates = {};
        	for (key in this.data["CONFIG"]["templates"]["definition"]) {
        		if (type == "")                                                 {
        		    templates[key] = this.data["CONFIG"]["templates"]["definition"][key]["description"];
        		    }
        		else if (this.data["CONFIG"]["templates"]["definition"][key]["type"] == type) {
        		    templates[key] = this.data["CONFIG"]["templates"]["definition"][key]["description"];
        		    }
        		}
        	return templates;
        	}

    // return drop-down with templates
	this.template_select            = function (id,title,data,onchange="") {
        var item  = "<select style=\"width:" + this.basic.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
        item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
        for (var key in data) {
                if (key != "default") {
                        item += "<option value=\"" + key + "\">" + data[key] + "</option>";
                }       }
        item     += "</select>";
        return item;
        }
        
	// return drop-down with buttons
	this.button_select              = function (id,device="",remote_definition={}) {
		var list 		= {};
		var device_buttons	= [];
		
		if (device != "" && device in this.data["CONFIG"]["devices"]) {
            var count1 = 0;
            var count2 = 0;
			var button_list       = this.data["CONFIG"]["devices"][device]["buttons"];
			
			for (var i=0;i<remote_definition.length;i++) {
				if (i<10) { a = "0"; } else { a = ""; }
				list[i] = "["+a+i+"]  "+remote_definition[i];
				count1 = i;
				}
			}

            if (device != "" && device in this.data["CONFIG"]["scenes"]) {
                
			button_list = remote_definition;
			for (var i=0;i<button_list.length;i++) {
				if (i<10) { a = "0"; } else { a = ""; }
                                list[i] = "["+a+i+"]  "+button_list[i];
				}
			}
        return this.basic.select(id,"element",list);
        }

	// return drop-down with display values
	this.device_display_select      = function (device,id) {

		var device_info = this.data["CONFIG"]["devices"][device]["commands"]["get"];
		if (this.data["CONFIG"]["devices"][device]["commands"]["definition"] && this.data["CONFIG"]["devices"][device]["commands"]["definition"]["power"]) {
		    var power = this.data["CONFIG"]["devices"][device]["commands"]["definition"]["power"];
		    if (power["auto_off"] && power["auto_off"] > 0) {
		        if (device_info.indexOf("auto-power-off") == -1) { device_info.push("auto-power-off"); }
		    }
		}
		device_info.sort();
		var device_display_values = this.basic.select_array(id,"display value",device_info,"");
		return device_display_values;
		}	
		
    // return drop-down with display values
	this.scene_display_select       = function (div_id,id,device) {

		device = check_if_element_or_value(device,false);

		var device_display_values = "";
		var device_info           = this.data["CONFIG"]["devices"][device]["commands"]["get"];		
		var on_change             = "document.getElementById('"+id+"').value = this.value;";

		device_display_values = this.basic.select_array("scene_display_value","value ("+device+")",device_info,on_change);

		setTextById(div_id,device_display_values);
		}

    // return drop-down with scene buttons
	this.scene_button_select        = function (div_id,id,device,scene) {
	
		device = check_if_element_or_value(device,false);

		var device_config       = this.data["CONFIG"]["devices"];
		var device_macro        = {};
		var device_macro_button = {};
		var macros_scene        = dictCopy(this.data["CONFIG"]["scenes"][scene]["remote"]["macro-scene"]);
		var macros              = {"scene": macros_scene};

		for (var key in this.data["CONFIG"]["macros"])  { macros[key] = dictCopy(this.data["CONFIG"]["macros"][key]); }


		for (key in this.data["CONFIG"]["devices"]) {
			device_macro[key] = "Device: "+device_config[key]["settings"]["label"];
			if (device_config[key]) {
				device_macro_button[key] = {};
				for (var i=0;i<device_config[key]["buttons"].length;i++) {
					var key2 = device_config[key]["buttons"][i];
					device_macro_button[key][key+"_"+key2] = key+"_"+key2;
			}	}	}
		for (key in macros)  {
			if (key != "description") { 
				device_macro[key] = "Macro: "+key;
				device_macro_button[key] = {};
				for (key2 in macros[key]) {
					device_macro_button[key][key+"_"+key2] = key+"_"+key2;
			}	}	}

		if (device == "scene-on")  { device_macro_button["scene-on"]["scene-on"]   = "scene-on"; }
		if (device == "scene-off") { device_macro_button["scene-off"]["scene-off"] = "scene-off"; }

		var device_macro_selects_all = "";
		var device_macro_select      = "";
		var on_change = "document.getElementById('"+id+"').value = this.value;";

		for (key in device_macro_button) {
			//device_macro_selects_all += this.basic.select("add_button_device_"+key,"button ("+key+")",device_macro_button[key],on_change,'',true);
			if (key == device) {
				device_macro_select += this.basic.select("add_button_device_"+key,"button ("+key+")",device_macro_button[key],on_change,'',true);
				}
			}
		setTextById(div_id,device_macro_select);
		}
                
	// create color picker
	this.colorPicker                = function (id, device, type="devices", data) {
	
		if (type != "devices") {
			this.logging.error(this.app_name+".colorPicker() - type not supported ("+type+")");
			return;
			}

        var color_model  = "RGB";
        var send_command = data[1];
        var sub_id       = device + "_" + send_command;
        if (data.length > 2) { color_model  = data[2]; }

		var remote_data  = this.data["CONFIG"][type][device]["remote"];
		var status_data  = this.data["STATUS"]["devices"][device];
		
        var display_start = "<button id=\"colorpicker_"+sub_id+"_button\" class=\"color-picker\">";
        display_start    += "<center><canvas id=\"colorpicker_"+sub_id+"\">";
        var display_end   = "</canvas>";
        display_end       += "<canvas id=\"colorpicker_demo_"+sub_id+"\" style=\"border-radius:5px;border:1px white solid;\"></canvas></center>";
        display_end       += "</button>";

        var text = display_start;
        //text += this.color_picker.colorPickerHTML(send_command);
        text += display_end;

        setTimeout(function() { rm3remotes.color_picker.colorPickerHTMLv2("colorpicker_"+sub_id, sub_id, send_command, color_model); }, 100);
        return text;
		}
	
	// create color picker
	this.colorPicker_v1              = function (id, device, type="devices", data) {

		if (type != "devices") {
			this.logging.error(this.app_name+".colorPicker() - type not supported ("+type+")");
			return;
			}

        var send_command = data[1];
		var remote_data  = this.data["CONFIG"][type][device]["remote"];
		var status_data  = this.data["STATUS"]["devices"][device];

        var display_start = "<button id=\"colorpicker_"+device+"\" class=\"color-picker\">";
        var display_end    = "</button>";

        var text = display_start;
        text += this.color_picker.colorPickerHTML(send_command);
        text += display_end;
        return text;
		}

	// create slider
	this.slider_element             = function (id, device, type="devices", data) {
		console.debug("slider_element: "+id+"/"+device+"/"+type+"/"+data);
	
		var init;
		var disabled = false;
		var remote_data         = this.data["CONFIG"][type][device]["remote"];
		var status_data         = this.data["STATUS"]["devices"][device];
        var device_api          = this.data["STATUS"]["devices"][device]["api"];
        var device_api_status   = this.data["STATUS"]["interfaces"]["connect"][device_api];

        if (!device_api_status) { console.error("API Device not defined correctly for " + device + ": " + device_api + " doesn't exist.")}
        else if (device_api_status.toLowerCase() != "connected") { disabled = true; }

		if (!this.data["CONFIG"][type]) {
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
        	text += this.slider.sliderHTML(name=data[1], label=data[2], device=device, command=data[1], min, max, init, disabled);
        	text += display_end;
        	return text;
		}

	// create toggle element (ON | OFF) - "TOGGLE||<status-field>||<description/label>||<TOGGLE_CMD_ON>||<TOGGLE_CMD_OFF>"
	this.slider_element_toggle      = function (id, device, type="device", data, short=false) {
		console.debug("slider_element_toggle: "+id+"/"+device+"/"+type+"/"+data);

		var init, key, status_data;
		var reset_value = "";
		var key;
		var min = 0;
		var max = 1;
		var device_id = device.split("_");
		device_id = device_id[0].split("||");

        if (this.data["CONFIG"]["devices"][device_id[1]] && this.data["CONFIG"]["devices"][device_id[1]]["interface"]["method"] != "query") {
            reset_value   = "<font style='color:gray'>[<status onclick=\"appFW.requestAPI('GET',['set','"+device_id[1]+"','power','OFF'], '', '', '' );\" style='cursor:pointer;'>OFF</status> | ";
            reset_value      += "<status onclick=\"appFW.requestAPI('GET',['set','"+device_id[1]+"','power','ON'], '', '', '' );\" style='cursor:pointer;'>ON</status>]</font>";
            }
       	var toggle_start  = "";
       	var toggle_end    = "";
       	if (!short) {
       	    toggle_start   += "<button id=\"slider_"+device+"_"+data[1]+"\" class=\"rm-toggle-label long\">"+data[2]+" &nbsp; &nbsp;  "+reset_value+"</button>";
       	    toggle_start   += "<button id=\"slider_"+device+"_"+data[1]+"\" class=\"rm-toggle-button\">";
            toggle_end     += "</button>";
       	    }
       	else {
       	    toggle_start   += "<div class='header_image_toggle'>"
       	    toggle_end     += "</div>"
       	    }

        var disabled      = false;
       	var device_key    = data[1].split("_");
        if (device_key.length > 1) { device = device_key[0]; key = device_key[1]}
        else                       { key = data[1]; }

        if (this.data["STATUS"]["devices"][device]) {
            status_data             = this.data["STATUS"]["devices"][device];
    	    var device_api          = this.data["STATUS"]["devices"][device]["api"];
	        var device_api_status   = this.data["STATUS"]["interfaces"][device_api];
            }
        if (status_data[key] && device_api_status == "Connected") {
            if (status_data[key].toUpperCase() == "TRUE")         { init = "1"; }
            else if (status_data[key].toUpperCase() == "FALSE")   { init = "0"; }
            else if (status_data[key].toUpperCase() == "ON")      { init = "1"; }
            else if (status_data[key].toUpperCase() == "OFF")     { init = "0"; }
            else                                                  { init = ""; }
        }
        else { init = ""; disabled = true; }

       	var text = toggle_start;
       	text += this.slider.toggleHTML(name=data[1], label=data[2], device=device, command_on=data[3], command_off=data[4], init, disabled);
       	text += toggle_end;
       	return text;
	}
	
	// empty field
	this.empty                      = function (id, comment="" ) {

		setTextById(id,comment);
		}

	// ensure, that all elements are visible and settings are hidden
	this.show                       = function (device="" ) {

		statusCheck_load();			// ... check if part of class ...
		setTextById("buttons_all","");		// ... move to showRemote() ...
		showRemoteInBackground(0);			// ... check if part of this class ...
		rm3settings.hide();				// ... check if part of another class ...
		}

	}


//--------------------------------
// EOF
