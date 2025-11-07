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
	this.active_channels= [];
	this.edit_mode      = false;
	this.initial_load   = true;
	this.loaded_remote  = [];

	this.frames_edit    = ["frame1","frame2"];
	this.frames_remote  = ["frame3","frame4","frame5"];
	this.frames_notouch = false;
	
	this.basic          = new rmRemoteBasic(name+".basic");		// rm_remotes-elements.js
	this.button         = new rmRemoteButtons(name);			// rm_remotes-elements.js
	this.display        = new rmRemoteDisplays(name+".display");		// rm_remotes-elements.js
	this.json           = new rmRemoteJSON(name+".json");		// rm_remotes-elements.js
	
	this.tab            = new rmRemoteTable(name+".tab");		// rm_remotes-elements.js
	this.keyboard       = new rmRemoteKeyboard(name+".keyboard");	// rm_remotes-keyboard.js
//	this.color_picker   = new rmColorPicker(name+".color_picker");	// rm_remotes-color-picker.js
//	this.slider         = new rmSlider(name+".slider");			// rm_remotes-slider.js

	this.element        = new rmRemoteAdvancedElements(name+".element", this);

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
        this.active_channels= [];


		this.keyboard.set_device(this.active_name);
		this.button.data    = this.data;
		this.display.data   = this.data;

		rm3start.active     = "start";
		startActive         = false;
		
		var edit_mode       = "";
		if (this.edit_mode) {
		    edit_mode = " / EDIT";
		    //rm3settings.create("index_small");
		    elementVisible(this.frames_edit[0]);
		    elementVisible(this.frames_edit[1]);
		    elementHidden("setting_ext_top_frame");
		    elementHidden("setting_ext_frames");
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
			this.active_label       = remote_label;
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
		appCookie.set("remote","device::"+device+"::"+remote_label+"::"+this.edit_mode+"::"+easyEdit+"::"+remoteHints);
		console.info("Set cookie: "+"device::"+device+"::"+remote_label+"::"+this.edit_mode+"::"+easyEdit+"::"+remoteHints);

        // add preview hint or error message container
		if (preview) { remote += "<b>"+lang("PREVIEW")+":</b><br/><hr/>"; }
		else         { remote += "<div id='remote-power-information-"+device+"' class='remote-power-information' onclick='statusCheck_bigMessage(\"remote-power-information-"+device+"\");'>POWER INFORMATION</div>"; }

        // add edit button
        var edit_cmd = "remoteToggleEditMode(true);rm3remotes.create(\"device\",\""+device+"\");";
        if (!this.edit_mode && easyEdit) { remote += "<div class='remote-edit-button' onclick='"+edit_cmd+"'><img src='icon/edit.png' style='height:20px;width:20px;'></div>"; }

        // add remote buttons
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
			else if (button.indexOf("SLIDER") == 0)       { next_button = this.element.slider(this.data, id, device, "devices", button.split("||")); }
			else if (button.indexOf("COLOR-PICKER") == 0) { next_button = this.element.colorPicker(this.data, id, device, "devices", button.split("||")); }
			else if (button.indexOf("TOGGLE") == 0)       { next_button = this.element.toggle(this.data, id, device, "devices", button.split("||")); }
			else if (button == ".")                       { next_button = this.button.device( device+i, ".", device, "empty", "", "disabled" ) }
			else if (button == "DISPLAY")                 { next_button = this.display.default(id, device, "devices", remote_display_size, remote_display); }
			//else if (button.indexOf("COLOR-PICKER") == 0) { next_button = this.colorPicker(id, device, "devices", button.split("||")); }
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
		str    += "<div class='rm-info'>";
		str    += "<media-info id='media_info'></media-info>";
		str    += "<center>" + label + ": " + descr + "</center>";
		str    += "</div>";

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
				this.button.edit("apiDeviceDelete('"+device+"');","delete") + "</center>"
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

		//remote  += this.basic.container("remote_main","Main settings",edit,true);
		remote  += this.basic.container("remote_edit_main", lang("MAIN_SETTINGS"), "<div id='remote-edit-main'></div>", true);

        var edit_main = edit;

		// API Information
        var select        = function (id, title, data, onchange="", value="") {
            var item  = "<select style=\"width:" + this.input_width + ";margin:1px;max-width:100%;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
            item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
            for (var key in data) {
                var selected = "";
                if (key == value) { selected = "selected"; }
                if (key != "default") {
                    item += "<option value=\"" + key + "\" " + selected+ ">" + data[key] + "</option>";
                    }
                }
            item     += "</select>";
            return item;
            }
		var on_change1    = "setTextById('edit_dev_api_field', this.value);";
		var on_change2    = "setTextById('edit_dev_config_field', this.value + '.json');";
		var on_change3    = "setTextById('edit_dev_rm_field', this.value + '.json');";
        var api_key       = device_config["interface"]["api"].split("_")[0];
    	var api_interface = select("edit_dev_api","interface", this.data["CONFIG"]["apis"]["list_description"], on_change1, device_config["interface"]["api"]);
        var dev_config    = select("edit_dev_config","device config", this.data["CONFIG"]["apis"]["list_api_configs"]["list"][api_key], on_change2, device_config["interface"]["device"]);
        var rm_definition = select("edit_dev_rm","remote definition", this.data["CONFIG"]["remotes"]["list"], on_change3, device_config["interface"]["remote"]);

		edit     = "<p><b>"+lang("API_INTERFACE")+":</b><br/>"+		    api_interface;
        edit    += "<br>&nbsp;<text id='edit_dev_api_field'>" +         device_config["interface"]["api"] + "</text>";
		edit    += "<p><b>"+lang("CONFIG_INTERFACE")+":</b><br/>"+ 		dev_config;
		edit    += "<br/>&nbsp;<text id='edit_dev_config_field'>" +     device_config["interface"]["device"]+".json" + "</text>";
		edit    += "<p><b>"+lang("CONFIG_REMOTE")+":</b><br/>"+ 		rm_definition;
        edit    += "<br/>&nbsp;<text id='edit_dev_rm_field'>"+          device_config["interface"]["remote"]+".json" + "</text>";
		edit    += "<p><b>"+lang("METHOD")+":</b><br/>"+		        device_config["interface"]["method"]; //device_data["interface"]["remote"]+".json" );
		edit    += "<hr/><center>" + this.button.edit("alert('not implemented yet');",lang("BUTTON_T_SAVE")) + "</center>";
		var edit_info = edit;

		//remote  += this.basic.container("remote_api01",lang("API_INFORMATION"),edit,false);

		// API details
		edit     = "<i><b>"+lang("COMMANDS")+"</b> ("+lang("BUTTON_T")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["buttons"]).replace(/,/g, ", ")+"</li></ul>";
		edit    += "<i><b>"+lang("GET_DATA")+"</b> ("+lang("BUTTON_T_DISPLAY")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["commands"]["get"]).replace(/,/g, ", ")+"</li></ul>";
		edit    += "<i><b>"+lang("SEND_DATA")+"</b> ("+lang("SLIDER")+", "+lang("BUTTON_T_KEYBOARD")+", "+lang("BUTTON_T_COLORPICKER")+")</i>";
		edit    += "<ul><li>"+JSON.stringify(device_config["commands"]["set"]).replace(/,/g, ", ")+"</li></ul>";
		var edit_cmd = edit;
		//remote  += this.basic.container("remote_api02",lang("API_COMMANDS"),edit,false);

        if (device_method == "query") {
            // API Testing
            this.basic.input_width  = "90%";
            this.button.height  = "25px;";
            edit    = lang("TEST_DEVICE_COMMANDS",[device]);
            edit    += "<div id='api_command_select'><select style='width:90%'><option>"+lang("LOADING")+" ...</option></select></div><br/>";
            edit    += this.basic.input("api_command") + "<br/>";
            edit    += this.button.edit("apiSendToDeviceApi( '" + device + "', getValueById('api_command') );", lang("TRY_OUT"),"") + "&nbsp;";
            edit    += this.button.edit("apiSendToDeviceApi( '" + device + "', 'jc.get_available_commands()' );", lang("GET_AVAILABLE_COMMANDS"),"");
            edit    += "<br/>&nbsp;<br/>";
            edit    += "<div class='remote-edit-cmd' id='api_response'></div>"
            edit    += "<div id='api_description' style='margin-top:5px;'></div>";
            edit    += "</center>";
            var edit_test = edit;
            //remote  += this.basic.container("remote_api03",lang("API_COMMANDS_TEST"),edit,false);
            }

		remote  += "<br/>";

		this.logging.default(device_config);
		setTextById(id,remote);

        // create sheet box

        const myBox = new rmSheetBox("remote-edit-main", height="380px", scroll=true, scroll_view=false, keep_open=false);
        myBox.addSheet(lang("REMOTE"),        edit_main);
        myBox.addSheet(lang("API_SETTINGS"),  edit_info);
        myBox.addSheet(lang("API_COMMANDS"),  edit_cmd);
        if (device_method == "query") {
            myBox.addSheet(lang("API_TEST"),      edit_test);
            }

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

        var select    = this.basic.select("api_cmd_select", lang("API_SELECT_CMD"), commands, on_change, '', sort=false, change_key_value=true);

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
        var device_macros = this.data["CONFIG"]["macros"];
        if (this.data["STATUS"]["config_errors"]["devices"][device] || !device_config || !device_config["remote"]) {
            setTextById(id,"");
            return;
            }

		this.button.width = "100px";
		var display_sizes = this.display.sizes();
		var device_info   = device_config["settings"];

        // check if color values exist
        var select_color_values = false;
        for (var i=0;i<device_config["commands"]["set"].length;i++) {
            var key = device_config["commands"]["set"][i];
            if (key.indexOf("color") >= 0) { select_color_values = true; }
            if (key.indexOf("bright") >= 0) { select_color_values = true; }
        }

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
		remote += "<center class='remote_edit_headline'><b>"+lang("EDIT_REMOTE")+" &quot;"+device_info["label"]+"&quot;</b> ["+device+"]</center>";
		remote += this.basic.edit_line();
			
        // Add GUI to add JSON elements
		remote += this.basic.container("remote_edit_add", lang("EDIT_ELEMENTS"), "<div id='remote-edit-add'></div>", false);

        // if record device, edit ... unclear if still required
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
			
		// JSON Edit
		remote += this.basic.container("remote_edit_json", lang("JSON_EDIT"), "<div id='remote-edit-json'></div>", false);

        var macro_on, macro_off = "";
        var device_macros = this.data["CONFIG"]["macros"];
        if (device in device_macros["device-on"])  { macro_on  = JSON.stringify(device_macros["device-on"][device]); }  else { macro_on = "[]"; }
        if (device in device_macros["device-off"]) { macro_off = JSON.stringify(device_macros["device-off"][device]); } else { macro_off = "[]"; }
        var macro_edit = lang("MACRO_DEVICE_EDIT");
        macro_edit    += this.tab.start();
        macro_edit    += this.tab.row(lang("MACRO") + " ON:<br/>", this.basic.input("remote_macro_on", macro_on));
        macro_edit    += this.tab.row(lang("MACRO") + " OFF:<br/>", this.basic.input("remote_macro_off",   macro_off));
        macro_edit    += this.tab.end();

        // buttons to save, preview, stop editing ...
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


		// set framework to edit remote elements
		setTextById(id,remote);

        // add content in sheet boxes :: add elements
        this.button.width  = "90px";
        this.button.height = "25px";

        const myBoxJson = new rmSheetBox("remote-edit-json", height="350px", scroll=true);
        myBoxJson.addSheet(lang("REMOTE"),       "<h4>"+lang("JSON_REMOTE")+"</h4>" +  "<div id='container_remote_json_buttons'></div><br/>" + lang("MANUAL_REMOTE") );
        myBoxJson.addSheet(lang("DISPLAY"),      "<h4>"+lang("JSON_DISPLAY")+"</h4>" + "<div id='container_remote_json_display'></div><br/>" + lang("MANUAL_DISPLAY") );
        myBoxJson.addSheet(lang("MACROS"),       "<h4>"+lang("JSON_REMOTE_MACROS")+"</h4>" + macro_edit );

        const myJson = new rmJsonEdit("remote-edit", format_style="default", style="width:100%;height:200px");
        myJson.create("container_remote_json_buttons", "remote_json_buttons", remote_definition, "rmc");
        myJson.create("container_remote_json_display", "remote_json_display", remote_display,    "default");

        const myBox = new rmSheetBox("remote-edit-add", height="280px", scroll=false);
        myBox.addSheet(lang("INFO"),          lang("MANUAL_ADD_ELEMENTS") + lang("MANUAL_ADD_TEMPLATE") +
                                              this.tab.start() + this.dialog_edit_elements("remote", "template", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end());
        myBox.addSheet(lang("BUTTONS"),       this.tab.start() + this.dialog_edit_elements("remote", "button_line", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end() );
        myBox.addSheet(lang("DISPLAY"),       this.tab.start() + this.dialog_edit_elements("remote", "display", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end() );
        myBox.addSheet(lang("TOGGLE"),        this.tab.start() + this.dialog_edit_elements("remote", "toggle", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end() );
        if (this.device_has_ranges(device)) {
            myBox.addSheet(lang("SLIDER"),        this.tab.start() + this.dialog_edit_elements("remote", "slider", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end() );
            }
        if (select_color_values) {
            myBox.addSheet(lang("COLOR_PICKER"),  this.tab.start() + this.dialog_edit_elements("remote", "color_picker", id, device, preview_remote, preview_display, preview_display_size) + this.tab.end() );
            }
        myBox.addSheet(lang("DELETE"),            this.dialog_edit_elements("remote", "delete", id, device, preview_remote, preview_display, preview_display_size));
		}

	// reread data from current definition and create preview
	this.scene_remote_preview       = function (scene) {
		this.scene_edit_json( id=this.frames_edit[1],   scene=scene, preview_remote='json::remote', preview_channel='json::macro-channel', preview_display='json::display', preview_display_size='json::display-size');
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
        this.active_label           = scene_label;
        this.display.edit_mode      = this.edit_mode;

		appCookie.set("remote","scene::"+scene+"::"+scene_label+"::"+this.edit_mode+"::"+easyEdit+"::"+remoteHints);
		console.info("Set cookie: "+"scene::"+scene+"::"+scene_label+"::"+this.edit_mode+"::"+easyEdit+"::"+remoteHints);

		if (this.data["CONFIG"]["scenes"][scene] && this.data["CONFIG"]["scenes"][scene]["remote"] && this.data["CONFIG"]["scenes"][scene]["remote"]["remote"]) {}
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
		var groups           = this.data["CONFIG"]["macros"]["groups"];
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
		else         { remote += "<div id='scene-power-information-"+scene+"' class='remote-power-information' onclick='statusCheck_bigMessage(\"scene-power-information-"+scene+"\");'>POWER INFORMATION</div>"; }

        // include edit button
        var edit_cmd = "remoteToggleEditMode(true);rm3remotes.create(\"scene\",\""+scene+"\");";
		if (!this.edit_mode && easyEdit) { remote += "<div class='remote-edit-button' onclick='"+edit_cmd+"' style='top:17px;left:17px;'><img src='icon/edit.png' style='height:20px;width:20px;'></div>"; }

        // add buttons
		for (var i=0; i<remote_definition.length; i++) {

			var next_button	= "";
			var button_def = remote_definition[i];
			var button     = remote_definition[i].split("_");
			var cmd    	   = button[0] + "_" + button[1];        // button.join("_"); // ??

			if (remote_definition[i] == "scene-on")  { cmd = "scene-on_"+scene;  button = ["scene-on", scene];  button_def = cmd; }
			if (remote_definition[i] == "scene-off") { cmd = "scene-off_"+scene; button = ["scene-off", scene]; button_def = cmd; }
			if (button[0] == "group")                { cmd = button.join("_");   button = ["group_" + button[1], button[2]]; }

            // create tool tip
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

            // create element per definition
			if (button[0] == "LINE")                     { next_button = this.basic.line(""); }
			else if (button[0].indexOf("LINE||") == 0)   { next_button = this.basic.line(button[0].split("||")[1]); }
			else if (button[0] == ".")                   { next_button = this.button.device( scene+i, ".", scene_label, "empty", "", "disabled" ); }
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
			                                                    toggle_html = this.element.toggle(this.data, id, toggle, "devices", toggle.split("||"), short=true);
			                                                    toggle_done = i+1;
			                                                    }
			                                               next_button = this.scene_header_image(id, scene, toggle_html);
			                                               }
			else if (button == "DISPLAY")                { next_button = this.display.default(id, scene, "scenes", remote_display_size, remote_display); }

			else if (button.length > 1 && button[1].indexOf("SLIDER") == 0)
			                                             { next_button = this.element.slider(this.data, id, button[0], "devices", button[1].split("||")); }

			else if (button_def.indexOf("TOGGLE") == 0)  { if (i != toggle_done) {
			                                                    next_button = this.element.toggle(this.data, id, button_def, "devices", button_def.split("||"), short=false);
			                                                    }
			                                             }
            else if (button_def.indexOf("COLOR-P") == 0) { next_button = this.button.device(scene+i,"color-picker scene N/A", scene-label, "", "", "disabled"); }
            else if (button_def.indexOf("SLIDER") == 0)  { next_button = this.button.device(scene+i,"slider scene N/A", scene-label, "", "", "disabled"); }
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

                // adapt tooltip placement for header image in edit mode
                if (button[0].indexOf("HEADER-IMAGE") == 0 || remote.indexOf("TOOL-TIPP-PLACEHOLDER") > 0)    {

                    console.debug(next_button);

                    var splitter = "<span class='jc_tooltip";
                    tooltip      = splitter + next_button.split("<!--X-->"+splitter)[1];
                    tooltip      = tooltip.replace("</button>","");

                    next_button  = next_button.replace(tooltip, "");
                    next_button  = next_button.replace("<!--TOOL-TIPP-PLACEHOLDER-->", tooltip);
                    }
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
            this.active_channels.push(cmd);

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
		var str = "<div class='rm-info'>";
		str     += "<center>" + label + ": " + descr + "</center>";
		str     += "</div>";
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

		this.dialog_edit_main = function () {
            // main settings for the scene
            var edit = "";
            edit   += this.tab.start();
            edit   += this.tab.row( lang("ID") + ":",                 scene );
            edit   += this.tab.row( lang("LABEL") + ":",              this.basic.input("edit_label",        scene_info["label"]) );
            edit   += this.tab.row( lang("DESCRIPTION") + ":&nbsp;",  this.basic.input("edit_description",  scene_info["description"]));
            edit   += this.tab.row( lang("SCENE_IMAGE") + ":&nbsp;",  this.image_select("edit_image",       scene_info["image"]) );
            edit   += this.tab.line();
            edit   += this.tab.row("<div id='scene_edit_header_image' style='align:center;'></div>","");
            edit   += this.tab.line();
            edit   += this.tab.row("<center>"+
                      "<input id='scene_visibility' value='"+scene_info["visible"]+"' style='display:none;'>"+
                      this.button.edit("apiRemoteChangeVisibility('scene','"+scene+"','scene_visibility');",lang("BUTTON_T_SHOW_HIDE")) + "&nbsp;" +
                      this.button.edit("apiSceneEdit('"+scene+"','edit','description,label,image');",lang("BUTTON_T_SAVE"),"") + "&nbsp;" +
                      this.button.edit("apiSceneDelete('"+scene+"');",lang("BUTTON_T_DELETE"),"") + "</center>"
                      );
            edit   += this.tab.end();
            return edit;
            }
        this.dialog_edit_api  = function () {
            // file information
            edit    = this.tab.start();
            edit   += this.tab.row("Remote:&nbsp;&nbsp;",  this.data["CONFIG"]["scenes"][scene]["config"]["remote"]+".json" );
            edit   += this.tab.row("Devices:",             JSON.stringify(this.data["CONFIG"]["scenes"][scene]["remote"]["devices"]).replace(/,/g, ", "));
            edit   += this.tab.end();
            var edit_info = edit;
            return edit;
            }

        if (this.edit_mode)     { elementVisible(id); }
        else                    { elementHidden(id,"device_edit"); return; }

        // create frame
		remote  += "<center class='remote_edit_headline'><b>"+lang("EDIT_SCENE")+" &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";
		remote  += this.basic.edit_line();
		remote += this.basic.container("scene_main",lang("SETTINGS_SCENES"),"<div id='scene-edit-main'></div>",true);
		setTextById(id,remote);

        // create sheet box
        const myBox = new rmSheetBox("scene-edit-main", height="500px", scroll_bar=true, scroll_view=false, keep_open=false);
        myBox.addSheet(lang("SCENE"),         this.dialog_edit_main());
        myBox.addSheet(lang("API_SETTINGS"),  this.dialog_edit_api());

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

		for (var i=0;i<json_edit_fields.length;i++) {
		    var field = json_edit_fields[i];
		    if (json_preview_values[field] == "") {
		        json_edit_values[field] = scene_remote[field];
		        }
		    else {
		        json_edit_values[field] = this.json.get_value(json_preview_values[field], scene_remote[field]);
		        preview = true;
		        }
		    }

		if (json_edit_values["display"] == undefined)         { json_edit_values["display"] = {}; }
		if (json_edit_values["display-size"] == undefined)    { json_edit_values["display-size"] = "middle"; }
		if (json_edit_values["macro-scene-on"] == undefined)  { json_edit_values["macro-scene-on"] = []; }
		if (json_edit_values["macro-scene-off"] == undefined) { json_edit_values["macro-scene-off"] = []; }
		if (json_edit_values["macro-channel"] == undefined)   { json_edit_values["macro-channel"] = {}; }
		if (json_edit_values["macro-scene"] == undefined)     { json_edit_values["macro-scene"] = {}; }

		// frame
		var remote = "";
		remote += "<center class='remote_edit_headline'><b>"+lang("EDIT_SCENE")+" &quot;"+scene_info["label"]+"&quot;</b> ["+scene+"]</center>";
		remote += this.basic.edit_line();
		remote += this.basic.container("edit_elements",lang("EDIT_ELEMENTS"),"<div id='scene-edit-elements'></div>",false);
		remote += this.basic.container("edit_json_all",lang("EDIT_JSON"),"<div id='scene-edit-json'></div>",false);
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
		          this.button.edit("remoteToggleEditMode(false);"+this.app_name+".create('"+this.active_type+"','"+scene+"');",lang("BUTTON_T_STOP_EDIT")) +
				  "</center><br/>";

		setTextById(id,remote);

		// edit JSON file
		var edit_json_required = "<h4>"+lang("JSON_REQUIRED_DEVICES")+":</h4><div id='scene-edit-required'></div><br/>" + lang("MANUAL_DEVICES");
        var edit_json_remote   = "<h4>"+lang("JSON_EDIT_RMC_DEFINITION")+":</h4><div id='scene-edit-remote'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
        var edit_json_display  = "<h4>"+lang("JSON_EDIT_DISPLAY_DEFINITION")+":</h4><div id='scene-edit-display'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
        var edit_json_channel  = "<h4>"+lang("JSON_EDIT_CHANNEL_MACROS")+":</h4><div id='scene-edit-macro-channel'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
		var edit_json_macros   = "<h4>"+lang("JSON_EDIT_MACRO_SCENE")+" ON:</h4>" + "<div id='scene-edit-macro-scene-on'></div><br/>" +
                                 "<h4>"+lang("JSON_EDIT_MACRO_SCENE")+" OFF:</h4>" + "<div id='scene-edit-macro-scene-off'></div><br/>" +
                                 "<h4>"+lang("JSON_EDIT_MACRO_SCENE_OTHER")+":</h4>" + "<div id='scene-edit-macro-scene-other'></div><br/>" +
                                 "</i>&nbsp;<br/>" + lang("MANUAL_MACROS_SCENE");

        // create sheet box JSON
        const myBox2 = new rmSheetBox("scene-edit-json", height="400px", scroll=true);
        myBox2.addSheet(lang("DEVICES"),   edit_json_required);
        myBox2.addSheet(lang("REMOTE"),    edit_json_remote);
        myBox2.addSheet(lang("DISPLAY"),   edit_json_display);
        myBox2.addSheet(lang("CHANNEL"),  edit_json_channel);
        myBox2.addSheet(lang("MACROS"),    edit_json_macros);

        // create JSON edit fields
        const myJson = new rmJsonEdit(id="scene-edit-json", format_style="default", style="width:100%;height:150px;");
        myJson.create("scene-edit-macro-scene-on",   "json::macro-scene-on",    json_edit_values["macro-scene-on"]);
        myJson.create("scene-edit-macro-scene-off",  "json::macro-scene-off",   json_edit_values["macro-scene-off"]);
        myJson.create("scene-edit-macro-scene-other","json::macro-scene",       json_edit_values["macro-scene"]);
        myJson.create("scene-edit-display",          "json::display",           json_edit_values["display"]);
        myJson.create("scene-edit-macro-channel",    "json::macro-channel",     json_edit_values["macro-channel"], format_style="compact", style="width:100%;height:220px;");
        myJson.create("scene-edit-remote",           "json::remote",            json_edit_values["remote"],        format_style="rmc",     style="width:100%;height:220px;");
        myJson.create("scene-edit-required",         "json::devices",           scene_remote["devices"],           format_style="compact", style="width:100%;height:47px;");

        // create sheet box elements
        const myBox1 = new rmSheetBox("scene-edit-elements", height="300px", scroll=true);
        myBox1.addSheet(lang("INFO"),       lang("MANUAL_ADD_ELEMENTS") + lang("MANUAL_ADD_TEMPLATE") +
                                            this.dialog_edit_elements("scene", "template", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("BUTTONS"),    this.dialog_edit_elements("scene", "default", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("HEADER"),     this.dialog_edit_elements("scene", "header", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("SLIDER"),     this.dialog_edit_elements("scene", "slider", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("TOGGLE"),     this.dialog_edit_elements("scene", "toggle", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("DISPLAY"),    this.dialog_edit_elements("scene", "display", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
        myBox1.addSheet(lang("DELETE"),     this.dialog_edit_elements("scene", "delete", id, scene, preview_remote, preview_display, preview_display_size, preview_channel));
		}

    // add json elements
    this.dialog_edit_elements          = function (type, element, id, device, preview_remote="", preview_display="", preview_display_size="", preview_channel="") {

        // set vars
        var edit = "";
        var line = false;
        this.button.width  = "90px";
        this.button.height = "25px";

        if (type == "remote") {
            var device_config   = this.data["CONFIG"]["devices"][device];
            var device_macros   = this.data["CONFIG"]["macros"];
            var device_info     = device_config["settings"];
            var display_sizes   = this.display.sizes();
            var link_template   = this.app_name+".remote_import_templates('device','"+device+"','add_template','remote_json_buttons');";
            var link_preview    = this.app_name+".device_remote_preview('"+device+"');"
            }
        else if (type == "scene") {
            var scene           = device;
            var scene_remote  	= this.data["CONFIG"]["scenes"][scene]["remote"];
            var scene_info    	= this.data["CONFIG"]["scenes"][scene]["settings"];
            var remote_info   	= this.data["CONFIG"]["devices"];
            var display_sizes 	= this.display.sizes();
            var link_template 	= this.app_name+".remote_import_templates('scene','"+scene+"','add_template','json::remote');";
            var link_preview  	= this.app_name+".scene_remote_preview('"+scene+"');";
            var device_display	= {};
            var device_macro	= {};
            var devices         = {};
            var devices_groups  = {};
            var devices_slider  = {};

            for (key in this.data["CONFIG"]["devices"]) {
                devices[key]        = "Device: "+remote_info[key]["settings"]["label"];
                devices_groups[key] = "Device: "+remote_info[key]["settings"]["label"];
                device_macro["device_"+key]   = "Device: "+remote_info[key]["settings"]["label"];
                device_display[key] = remote_info[key]["settings"]["label"];

                device_commands = this.data["CONFIG"]["devices"][key]["commands"];
                //if (device_commands["set"].length > 0 || device_commands["get"] > 0) {
                if (this.device_has_ranges(key)) {
                    devices_slider[key] = "Device: "+remote_info[key]["settings"]["label"];
                    }
                }
            for (key in this.data["CONFIG"]["macros"]["groups"])  {
                if (this.data["CONFIG"]["macros"]["groups"][key]["description"]) {
                    device_macro["group_"+key] = "Group: "+this.data["CONFIG"]["macros"]["groups"][key]["description"]+" ("+key+")";
                    devices_groups["group_"+key] = "Group: "+this.data["CONFIG"]["macros"]["groups"][key]["description"]+" ("+key+")";
                    }
                else {
                    device_macro["group_"+key] = "Group: "+key;
                    devices_groups["group_"+key] = "Group: "+key;
                    }
                }
            for (key in this.data["CONFIG"]["macros"])  {
                if (key != "groups") { device_macro["macro_"+key] = "Macro: "+key; }
                }
            device_macro["scene"] = "Macro: " + scene;

            var toggle_onchange         = this.app_name +".scene_toggle_select(div_id='add_button_device_input','add_button_value','add_toggle_device','"+scene+"');";
            var slider_onchange         = this.app_name +".scene_slider_select(div_id='add_button_device_input','add_button_value','add_slider_device','"+scene+"');";
            var device_macro_onchange   = this.app_name +".scene_button_select(div_id='add_button_device_input','add_button_value','add_button_device','"+scene+"');";
            var device_display_onchange = this.app_name +".scene_display_select(div_id='add_display_input','add_display_value','add_display_device');";

            // prepare field values
            var json_preview_values     = {
                "remote": preview_remote,
                "display": preview_display,
                "display-size": preview_display_size,
                "macro-channel": preview_channel,
                };
            var json_edit_values = {
                "remote": JSON.parse(getValueById("json::remote")),
                "display": JSON.parse(getValueById("json::display")),
                "macro-channel": JSON.parse(getValueById("json::macro-channel")),
                }
            //if (document.getElementById("json::display-size")) { json_edit_values["display-size"] = JSON.parse(getValueById("json::display-size")); }
            //else
            if (preview_display_size != "")               { json_edit_values["display-size"] = preview_display_size; }
            else if (scene_remote["display-size"])        { json_edit_values["display-size"] = scene_remote["display-size"]; }

            }

        // create elements editing
        if (type == "remote" && element == "toggle") {

            edit   += this.tab.start();
            edit   += this.tab.row(
                       "Description:",
                       this.basic.input("add_toggle_descr", "")
                       );
            edit   += this.tab.row(
                       "Value:",
                       this.basic.select_array("add_toggle_value", "value (boolean)", device_config["commands"]["get"], "", "power")
                       );
            edit   += this.tab.row(
                       "Button ON:",
                       this.basic.select_array("add_toggle_on","button ON", device_config["buttons"], "", "on")
                       );
            edit   += this.tab.row(
                       "Button OFF:",
                       this.basic.select_array("add_toggle_off","button OFF", device_config["buttons"], "", "off")
                       );
            edit   += this.tab.line();
            edit   += this.tab.row(
                      this.button.edit(this.app_name+".remote_add_toggle('device','"+device+"','"+device+"','add_toggle_descr','add_toggle_value','add_toggle_on','add_toggle_off','remote_json_buttons');",  lang("BUTTON_T_ADD"),"")
                       );
            edit  += this.tab.end();
            }
        else if (type == "scene" && element == "toggle") {

            edit   += "&nbsp;";
            edit   += this.tab.start();
            edit   += this.tab.row(
                      "Device:",
                      //this.basic.select("add_toggle_device","device / group", devices_groups, toggle_onchange),
                      this.basic.select("add_toggle_device","device", devices, toggle_onchange),
                      );
            edit   += this.tab.row(
                       "Description:",
                       "<div id='toggle_device_descr'>" +
                       this.basic.input("add_toggle_descr", "") +
                       "</div>"
                       );
            edit   += this.tab.row(
                       "Value:",
                       "<div id='toggle_device_value'></div>"
                       );
            edit   += this.tab.row(
                       "Button ON:",
                       "<div id='toggle_device_on'></div>"
                       );
            edit   += this.tab.row(
                       "Button OFF:",
                       "<div id='toggle_device_off'></div>"
                       );
            edit   += this.tab.line();
            edit   += this.tab.row(
                      this.button.edit(this.app_name+".remote_add_toggle('scene','"+scene+"','add_toggle_device','add_toggle_descr','add_toggle_value','add_toggle_on','add_toggle_off','json::remote');",  lang("BUTTON_T_ADD"),"")
                       );
            edit  += this.tab.end();

            setTimeout(function() {
                eval(toggle_onchange);
                },500);
            }
        else if (type == "remote" && element == "color_picker") {

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

            edit   += this.tab.start();
            if (select_color_values.length > 0) {
                var color_models = ["Brightness", "Color RGB", "Color CIE_1931", "Color RGB (small)",  "Color CIE_1931 (small)", "Color temperature"];

                edit    += this.tab.row(
                        "Send command:",
                        this.basic.select_array("add_colorpicker_cmd",lang("BUTTON_T_SEND"), select_color_values, "", ""),
                        );
                edit    += this.tab.row(
                        "Color model:",
                        this.basic.select_array("add_colorpicker_model", lang("BUTTON_T_COLOR"), color_models),
                        );
                edit    += this.tab.line();
                edit    += this.tab.row(
                        this.button.edit(this.app_name+".remote_add_colorpicker('device','"+device+"','add_colorpicker_cmd','remote_json_buttons');",  lang("BUTTON_T_ADD"),"")
                        );
                }
            else {
                edit    += this.tab.row(
                        lang("COLORPICKER_N/A"),
                        this.button.edit("N/A","","disabled")
                        );
                }
            edit   += this.tab.end();
            }
        else if (type == "remote" && element == "slider") {

            var param = this.device_has_ranges(device, true);
            edit   += this.tab.start();
            if (this.device_has_ranges(device)) {
                var onchange_slider_param = this.app_name+".remote_prepare_slider('device','"+device+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','remote_json_buttons');";

                edit    += this.tab.row(
                        "Send command:",
                        this.basic.select_array("add_slider_cmd",lang("BUTTON_T_SEND"), param, "", "")
                        );
                edit    += this.tab.row(
                        "Parameter:",
                        this.basic.select_array("add_slider_param",lang("BUTTON_T_PARAMETER"), param, onchange_slider_param, "")
                        );
                edit    += this.tab.row(
                        "Description:",
                        this.basic.input("add_slider_descr", lang("BUTTON_T_DESCRIPTION"))
                        );
                edit    += this.tab.row(
                        "Min and max values:",
                        this.basic.input("add_slider_minmax",lang("BUTTON_T_MINMAX"))
                        );
                edit    += this.tab.line();
                edit    += this.tab.row(
                        this.button.edit(this.app_name+".remote_add_slider('device','"+device+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','remote_json_buttons');", lang("BUTTON_T_ADD"),"")
                        );
                }
            else {
                edit    += this.tab.row(
                        lang("SLIDER_N/A"),
                        this.button.edit("N/A","","disabled")
                        );
                }
            edit   += this.tab.end();
            }
        else if (type == "scene"  && element == "slider") {
            edit   += "&nbsp;";
            edit   += this.tab.start();
            edit   += this.tab.row(
                      "Device:",
                      //this.basic.select("add_toggle_device","device / group", devices_groups, toggle_onchange),
                      this.basic.select("add_slider_device","device", devices_slider, slider_onchange),
                      );
            edit   += this.tab.row(
                       "Send command:",
                       "<div id='slider_device_cmd'></div>"
                       );
            edit   += this.tab.row(
                       "Parameter:",
                       "<div id='slider_device_param'></div>"
                       );
            edit   += this.tab.row(
                       "Min and max values:",
                       "<div id='slider_device_min-max'></div>"
                       );
            edit   += this.tab.row(
                       "Description:",
                       "<div id='slider_device_descr'>" +
                       this.basic.input("add_slider_descr", "") +
                       "</div>"
                       );
            edit   += this.tab.line();
            edit   += this.tab.row(
                       this.button.edit(this.app_name+".remote_add_slider('scene','"+scene+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','json::remote','','add_slider_device');", lang("BUTTON_T_ADD"),"")
                       );
            edit  += this.tab.end();

            setTimeout(function() {
                eval(slider_onchange);
                },500);
            }
        else if (type == "remote" && element == "button_line") {

            edit    = this.tab.start();
            edit    += this.tab.row(
                    this.basic.select_array("add_button_select","defined button", device_config["buttons"], "", ""),
                    this.button.edit(this.app_name+".remote_add_button('device','"+device+"','add_button_select','remote_json_buttons');", lang("BUTTON_T"),"")
                    );
            edit    += this.tab.row(
                    this.basic.input("add_button"),
                    this.button.edit(this.app_name+".remote_add_button('device','"+device+"','add_button',        'remote_json_buttons');", lang("BUTTON_T_OTHER"),"")
                    );
            edit    += this.tab.line();
            edit    += this.tab.row(
                    lang("ADD_LINE"),
                    this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','LINE',   'remote_json_buttons');", lang("BUTTON_T_LINE"),"")
                    );
            edit    += this.tab.row(
                    this.basic.input("add_line_text"),
                    this.button.edit(this.app_name+".remote_add_line('device',  '"+device+"','add_line_text',     'remote_json_buttons');", lang("BUTTON_T_LINE_TEXT"),"")
                    );
            edit    += this.tab.line();
            edit    += this.tab.row(
                    lang("ADD_EMPTY"),
                    this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','.',      'remote_json_buttons');", lang("BUTTON_T_EMPTY"),"")
                    );
            edit   += this.tab.end();
            }
        else if (type == "remote" && element == "default") {

            this.button.width = "90px";
            edit    = this.tab.start();
            edit    += this.tab.row("<center>"+
                    this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','.',      'remote_json_buttons');", lang("BUTTON_T_EMPTY"),"") + "&nbsp; " +
                    this.button.edit(this.app_name+".remote_add_button( 'device','"+device+"','LINE',   'remote_json_buttons');", lang("BUTTON_T_LINE"),"") + "&nbsp; " +
                    this.button.edit(this.app_name+".remote_add_display('device','"+device+"','DISPLAY','remote_json_buttons');", lang("BUTTON_T_DISPLAY"),"") + "&nbsp; "+
                    "</center>",
                    false
                    );
            edit   += this.tab.end();
            }
        else if (type == "scene"  && element == "default") {

            edit    = "&nbsp;";
            edit   += this.tab.start();
            edit   += this.tab.row(
                      this.basic.select("add_button_device","device / macro", device_macro, device_macro_onchange),
                      this.button.edit("N/A","","disabled")
                      );
            edit   += this.tab.row(
                      "<input id='add_button_value' style='display:none;'/>" +
                      "<div id='add_button_device_input'><i><small>-&gt; "+lang("SELECT_DEV_MACRO")+"</small></i></div>",
                      this.button.edit(this.app_name+".remote_add_button('scene','"+scene+"','add_button_value','json::remote');", lang("BUTTON_T"),"")
                      );
            edit   += this.tab.line();
            edit   += this.tab.row(
                      this.basic.input("add_line_text"),
                      this.button.edit(this.app_name+".remote_add_line(  'scene','"+scene+"','add_line_text', 'json::remote');", lang("BUTTON_T_LINE_TEXT"),"")
                      );
            edit    += this.tab.row(
                      "Add simple line:",
                      this.button.edit(this.app_name+".remote_add_button('scene','"+scene+"','LINE', 'json::remote');", lang("BUTTON_T_LINE"),"")
                      );
            edit   += this.tab.line();
            edit   += this.tab.row(
                      "Add empty field:",
                      this.button.edit(this.app_name+".remote_add_button('scene','"+scene+"','.', 'json::remote');", lang("BUTTON_T_EMPTY"),"")
                      );
            edit   += this.tab.end();
            }
        else if (type == "remote" && element == "display") {

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
            }
        else if (type == "scene"  && element == "display") {

            var check_display   = JSON.stringify(json_edit_values["remote"]);
            //var check_display   = JSON.stringify(json_preview_values["remote"]);
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
                      this.basic.select("json::display-size","display size", display_sizes, "", json_edit_values["display-size"]),
                      this.button.edit(this.app_name+".scene_remote(  '"+this.frames_remote[0]+"','"+scene+"','json::remote','json::display','json::display-size');"+
				                   this.app_name+".scene_channels('"+this.frames_remote[2]+"','"+scene+"','json::macro-channel');",
				                   lang("BUTTON_T_PREVIEW"))
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
                      //this.basic.select_array("scene_display_delete","display value", Object.keys(json_preview_values["display"]),"",""),
                      this.button.edit(display_del_cmd,lang("BUTTON_T_DEL_VALUE"))
                      );
            edit   += this.tab.end();
            }
        else if (type == "remote" && element == "template") {
            var templates = this.template_list("device");
            edit     = this.tab.start();
            edit    += this.tab.row(
                        this.template_select("add_template",lang("BUTTON_T_TEMPLATE"),templates),
                        this.button.edit(link_template,lang("BUTTON_T_CLONE"),"")
                        );
            edit    += this.tab.end();
            }
        else if (type == "scene"  && element == "template") {
            this.button.width = "100px";
            edit    = this.tab.start();
            edit   += this.tab.row(
                      this.template_select("add_template",lang("BUTTON_T_TEMPLATE"),this.templates),
                      this.button.edit(link_template,lang("BUTTON_T_CLONE"),"")
                      );
            edit   += this.tab.end();
            var edit_template = edit;
            }
        else if (type == "remote" && element == "delete") {
            edit     = "&nbsp;";
            edit    += this.tab.start();
            edit    += this.tab.row(
                    this.button_select("del_button",device,remote_definition),
                    this.button.edit(this.app_name+".remote_delete_button('device','"+device+"','del_button','remote_json_buttons');", lang("BUTTON_T_DELETE"),"")
                    );
            edit    += this.tab.end();
            }
        else if (type == "scene"  && element == "delete") {
            edit     = "&nbsp;";
            edit    += this.tab.start();
            edit   += this.tab.row(
                      this.button_select("del_button",scene,json_edit_values["remote"]),
                      //this.button_select("del_button",scene,json_preview_values["remote"]),
                      this.button.edit(this.app_name+".remote_delete_button('scene','"+scene+"','del_button','json::remote');", lang("BUTTON_T_DEL"),"")
                      );
            edit   += this.tab.end();
            }
        else if (type == "scene"  && element == "header") {

            var check_header       = JSON.stringify(json_edit_values["remote"]);
            //var check_header       = JSON.stringify(json_preview_values["remote"]);
            var header_exists      = (check_header.indexOf("HEADER-IMAGE") >= 0);
            var header_with_toggle = (check_header.indexOf("HEADER-IMAGE||toggle") >= 0);
            var header_on_change   = this.app_name + ".dialog_edit_elements_update('"+scene+"');";

            var add_header_img     = "<div id='header_button_img'></div>";
            var add_header_img_t   = "<div id='header_button_img_t'></div>";
            var add_header_img_d   = "<div id='header_button_img_d'></div>";

            edit  = "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row("Add simple header image:", add_header_img);
            edit += this.tab.line();
            edit += this.tab.row("Power device:",
                                 this.basic.select("header_toggle_device","device", devices, header_on_change));
            edit += this.tab.row("Power value:",            "<div id='header_toggle_value'></div>");
            edit += this.tab.row("Power ON (or macro):",    "<div id='header_toggle_on'></div>");
            edit += this.tab.row("Power OFF (or macro):",   "<div id='header_toggle_off'></div>");

            edit += this.tab.line();
            edit += this.tab.row("Add header image with toggle:", add_header_img_t);
            edit += this.tab.line();
            edit += this.tab.row("Remove header image:", add_header_img_d);
            edit += this.tab.end();

            setTimeout(function() {
                rm3remotes.dialog_edit_elements_update(scene);
                }, 1000);
            }

        if (line) { edit += this.tab.line(); }
        return edit;
        }

    // update header settings
    this.dialog_edit_elements_update = function (scene) {

        this.button.width  = "90px";
        this.button.height = "25px";

        var check_header            = getValueById("json::remote");
        var header_exists           = (check_header.indexOf("HEADER-IMAGE") >= 0);
        var header_with_toggle      = (check_header.indexOf("HEADER-IMAGE||toggle") >= 0);
        var header_toggle_device    = getValueById("header_toggle_device");
        var header_on_change        = this.app_name + ".dialog_edit_elements_update('"+scene+"');";

        var add_header_img          = this.button.edit(this.app_name+".remote_add_header('scene','"+scene+"','HEADER-IMAGE', 'json::remote');"+header_on_change, lang("BUTTON_T_ADD"),"");
        var add_header_img_t        = this.button.edit(this.app_name+".remote_add_header('scene','"+scene+"','HEADER-IMAGE||toggle', 'json::remote');"+header_on_change, lang("BUTTON_T_ADD"),"");
        var add_header_img_d        = this.button.edit(this.app_name+".remote_remove_header('scene','"+scene+"','HEADER-IMAGE||toggle', 'json::remote');"+header_on_change, lang("BUTTON_T_DELETE"),"");

        var header_toggle_value     = "<i>"+lang("SELECT_DEV_FIRST")+"</id>";
        var header_toggle_on        = "<i>"+lang("SELECT_DEV_FIRST")+"</id>";
        var header_toggle_off       = "<i>"+lang("SELECT_DEV_FIRST")+"</id>";
        var header_toggle_descr     = getValueById("add_toggle_descr");

        if (header_with_toggle)  { add_header_img_t = "<i>active</i>"; }
        else if (header_exists)  { add_header_img = "<i>active</i>"; }
        else                     { add_header_img_d = "<i>no header image yet</i>"; }

        if (header_toggle_device != "") {
            var device_config       = this.data["CONFIG"]["devices"][header_toggle_device];
            var device_name         = this.data["CONFIG"]["devices"][header_toggle_device]["settings"]["description"];
            var global_macros       = this.data["CONFIG"]["macros"]["global"];
            var device_on_off       = {};
            var device_values       = {};

            for (var i=0;i<device_config["buttons"].length;i++) {
                device_on_off[header_toggle_device+"_"+device_config["buttons"][i]] = "Button: " + device_config["buttons"][i];
                }
            Object.keys(global_macros).forEach( key => {
                device_on_off["macro_"+key] = "Macro: " + key;
                });
            for (var i=0;i<device_config["commands"]["get"].length;i++) {
                device_values[header_toggle_device+"_"+device_config["commands"]["get"][i]] = device_config["commands"]["get"][i];
                }

            var device_on           = device_on_off;
            var device_off          = device_on_off;
            header_toggle_value     = this.basic.select("header_toggle_1value", "power value", device_values, "", "", true);
            header_toggle_on        = this.basic.select("header_toggle_1on",    "button/macro ON", device_on, "", "", true);
            header_toggle_off       = this.basic.select("header_toggle_1off",   "button/macro OFF", device_off, "", "", true);

            header_toggle_descr     = "Toggle " + device_name + " (" + header_toggle_device + ")";

            setTextById("header_toggle_descr", header_toggle_descr);

            }

        setTextById("header_button_img",   add_header_img);
        setTextById("header_button_img_t", add_header_img_t);
        setTextById("header_button_img_d", add_header_img_d);
        setValueById("add_toggle_descr",   header_toggle_descr);
        setTextById("header_toggle_value", header_toggle_value);
        setTextById("header_toggle_on",    header_toggle_on);
        setTextById("header_toggle_off",   header_toggle_off);
        }

    // create header image for scenes
	this.scene_header_image         = function (id, scene, toggle_html, selected="") {
	
		var scene_info    = this.data["CONFIG"]["scenes"][scene]["settings"];
		var scene_remote  = this.data["CONFIG"]["scenes"][scene]["remote"]["remote"];
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
			var info = "";
			if (!scene_remote.includes("DISPLAY") && !this.edit_mode && scene_remote.includes("HEADER-IMAGE||toggle")) {
                info = "<br/><text id='header_image_text_info' class='header_image_text_info'></text>"
			    }

            this.tooltip.settings("onmouseover","100px","50px","50px");
			toggle_html = this.tooltip.create_inside(" "+toggle_html, test, 1);
			// ---------------------------------------------------------- TOOLTIP IN PROGRESS
			// - activate for a few seconds, if toggle is off (and hint is activated)
			// - place below the toggle
			// - ensure the triangle is visible

            image_html    += " <div class='header_image_toggle_container' id='toggle_place_"+id+"'>"+toggle_html+"</div>";
            image_html    += " <div id='header_tooltip' style='display:block;'><!--TOOL-TIPP-PLACEHOLDER--></div>";
			image_html    += " <div class='header_image_fade'>";
			image_html    += "  <div class='header_image_text'>&nbsp;<br/>&nbsp;<br/>"+label+info+"</div>";
			image_html    += " </div>";
			image_html    += "<!--X--></button>";
			return image_html;
			}
		}

	// add header to JSON
	this.remote_add_header          = function (type,scene,button,remote,position="") {
		var value     = this.json.get_value(remote);

		if (value.indexOf("HEADER-IMAGE") >= 0 || value.indexOf("HEADER-IMAGE||toggle") >= 0) {
			appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
			}
		else if (value.indexOf("HEADER-IMAGE||toggle") < 0 && button == "HEADER-IMAGE||toggle") {

		    // CHECK IF VALUES FOR TOGGLE ARE SET ...
		    var header_toggle_value = getValueById("header_toggle_1value");
		    var header_toggle_on    = getValueById("header_toggle_1on");
		    var header_toggle_off   = getValueById("header_toggle_1off");

		    if (header_toggle_value == undefined)      { appMsg.alert("Select the power device value first!"); return; }
		    else if (header_toggle_on == undefined || header_toggle_on == "")     { appMsg.alert("Select the power device ON command first!"); return; }
		    else if (header_toggle_off == undefined || header_toggle_off == "")   { appMsg.alert("Select the power device OFF command first!"); return; }

		    var toggle_button = "TOGGLE||"+header_toggle_value+"||Power Device||"+header_toggle_on+"||"+header_toggle_off;

			this.remote_add_button(type,scene,toggle_button,remote,"FIRST",true);
			this.remote_add_button(type,scene,button,remote,"FIRST");
			}
		else if (value.indexOf("HEADER-IMAGE")  < 0 && button == "HEADER-IMAGE") {
			this.remote_add_button(type,scene,button,remote,"FIRST");
			this.remote_preview( type, scene );
			}
		}

	// add header to JSON
	this.remote_remove_header          = function (type,scene,button,remote,position="") {
		var value     = this.json.get_value(remote);
		if (value.indexOf("HEADER-IMAGE||toggle") >= 0) {
		    this.remote_delete_button('scene','tv2',"0",'json::remote')
		    this.remote_delete_button('scene','tv2',"0",'json::remote')
			this.remote_preview( type, scene );
			}
		else if (value.indexOf("HEADER-IMAGE") >= 0) {
		    this.remote_delete_button('scene','tv2',"0",'json::remote')
			this.remote_preview( type, scene );
			}
		else {
			appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
			}
		}

	// create from unsaved data for preview
	this.remote_preview             = function (type, name, timeout=false) {

//	    var timeout_duration = 0;
//	    if (timeout) { timeout_duration = 2000; alert(timeout_duration); }

//	    setTimeout(() => {
            if (type == "scene") { this.scene_remote_preview( name ); }
            else                 { this.device_remote_preview( name ); }
//            }, timeout_duration);
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
	this.remote_add_slider          = function (type,scene,slider_cmd,slider_param,slider_descr,slider_minmax,remote,position="",slider_device="") {
	
		var s_cmd    = getValueById(slider_cmd);
		var s_param  = getValueById(slider_param);
		var s_descr  = getValueById(slider_descr);
		var s_minmax = getValueById(slider_minmax);
		var s_device = getValueById(slider_device);

		if (s_cmd == ""    || s_cmd == undefined)   { appMsg.alert(lang("SLIDER_SELECT_CMD")); return; }
		if (s_param == ""  || s_param == undefined) { appMsg.alert(lang("SLIDER_SELECT_PARAM")); return; }
		if (s_descr == ""  || s_descr == undefined) { appMsg.alert(lang("SLIDER_INSERT_DESCR")); return; }
		if (s_minmax == "" || s_minmax == undefined){ appMsg.alert(lang("SLIDER_INSERT_MINMAX")); return; }

        if (type == "scene") {
            var button = s_device+"_SLIDER||send-"+s_cmd+"||"+s_descr+"||"+s_minmax+"||"+s_param;
            }
        else {
            var button = "SLIDER||send-"+s_cmd+"||"+s_descr+"||"+s_minmax+"||"+s_param;
		    }
		console.error(button);
		this.remote_add_button(type,scene,button,remote,position);
		this.remote_preview( type, scene, true );
		}

    // add a toggle with description
    this.remote_add_toggle          = function (type,scene,t_device,t_descr,t_value,t_on,t_off,remote,position="") {

		var t_device = getValueById(t_device);
		var t_value  = getValueById(t_value);
		var t_descr  = getValueById(t_descr);
		var t_on     = getValueById(t_on);
		var t_off    = getValueById(t_off);

		if (t_device == ""  || t_device == undefined)   { appMsg.alert(lang("TOGGLE_SELECT_DEVICE")); return; }
		if (t_value == ""   || t_value == undefined)    { appMsg.alert(lang("TOGGLE_SELECT_VALUE")); return; }
		if (t_descr == ""   || t_descr == undefined)    { appMsg.alert(lang("TOGGLE_SELECT_DESCR")); return; }
		if (t_on == ""      || t_on == undefined)       { appMsg.alert(lang("TOGGLE_SELECT_ON")); return; }
		if (t_off == ""     || t_off == undefined)      { appMsg.alert(lang("TOGGLE_SELECT_OFF")); return; }

        if (type == "scene") {
            var button = "TOGGLE||"+t_device+"_"+t_value+"||"+t_descr+"||"+t_device+"_"+t_on+"||"+t_device+"_"+t_off;
            }
        else {
            var button = "TOGGLE||"+t_value+"||"+t_descr+"||"+t_on+"||"+t_off;
            }

		this.remote_add_button(type,scene,button,remote,position);
		this.remote_preview( type, scene, true );
        }

	// prepare slider
	this.remote_prepare_slider      = function (type,device,slider_cmd,slider_param,slider_descr,slider_minmax,remote,position="") {

		var s_param  = getValueById(slider_param);
		var s_descr  = "description";
		var s_device = this.data["CONFIG"]["devices"][device]["settings"]["label"];
		if (s_param == ""  || s_param == undefined)	{ appMsg.alert(lang("SLIDER_SELECT_PARAM")); return; }

        if (type == "scene") {
            s_descr = s_device + ": " + s_param.charAt(0).toUpperCase() + s_param.slice(1);
            }
        else {
            s_descr = s_param.charAt(0).toUpperCase() + s_param.slice(1);
		    }
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
	this.remote_add_button          = function (type,scene,button,remote,position="",multiple=false) {
	
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
		if (!multiple) {
		    this.remote_preview( type, scene );
		    }
		}
	
	// delete button from JSON
	this.remote_delete_button       = function (type,scene,button,remote) {

        if (Number.isInteger(Number(button)))       { }
		else if (document.getElementById(button))   { button = getValueById(button); }
		if (button == "")  { appMsg.alert(lang("BUTTON_SELECT")); return; }
		
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
		console.error("this.remote_preview( "+type+", "+scene+" );");
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
        item     += "<option value='' disabled='disabled' selected>"+lang("SELECT")+" " + title + "</option>";
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

	// check if device has ranges - for slider option
	this.device_has_ranges          = function (device, commands=false) {
	    var has_ranges = false;
	    var range_cmd  = [];
        var cmd_definition = this.data["CONFIG"]["devices"][device]["commands"]["definition"];
        var cmd_send       = this.data["CONFIG"]["devices"][device]["commands"]["set"]
        Object.keys(cmd_definition).forEach( key => {
            var param = cmd_definition[key];
            var send  = (cmd_send.indexOf(key) >= 0);
            if (send && param["values"] != undefined && param["values"]["max"] != undefined && param["values"]["min"] != undefined) {
                has_ranges = true;
                range_cmd.push(key);
                }
            });

        if (!commands) { return has_ranges; }
        else           { return range_cmd; }
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
		var groups              = {};
		var group_devices       = {};
		var available_buttons   = [];
        var type                = "";
        [type, device]          = device.split("_");

        if (type == "macro") {
            var temp = Object.keys(this.data["CONFIG"]["macros"][device]);
            for (var i=0;i<temp.length;i++) {
                available_buttons.push(device+"_"+temp[i]);
                }
            }
        if (type == "device") {
            var temp =  this.data["CONFIG"]["devices"][device]["buttons"];
            for (var i=0;i<temp.length;i++) {
                available_buttons.push(device+"_"+temp[i]);
                }
            }
        if (type == "group") {
            var temp = this.data["CONFIG"]["macros"]["groups"][device]["devices"];
            var temp_buttons = {};
            for (var i=0;i<temp.length;i++) {
                var dev_i = temp[i];
                if (this.data["CONFIG"]["devices"][dev_i]) {
                    temp_buttons[dev_i] = this.data["CONFIG"]["devices"][dev_i]["buttons"];
                    }
                }
            var arrays = Object.values(temp_buttons);
            var available_buttons_temp = arrays.reduce((acc, arr) => acc.filter(x => arr.includes(x)) );
            for (var i=0;i<available_buttons_temp.length;i++) {
                    available_buttons.push("group_"+device+"_"+available_buttons_temp[i]);
                    }
            }

		var on_change = "document.getElementById('"+id+"').value = this.value;";
        device_macro_select = this.basic.select_array("add_button_device_"+device,"button ("+device+")",available_buttons,on_change,'',true);

		setTextById(div_id,device_macro_select);
		}

    // create drop-downs for scene toggle buttons
    this.scene_toggle_select        = function (div_id,id,device,scene) {

        var device = check_if_element_or_value(device,false);
        var select = "<i>"+lang("SELECT_DEV_FIRST")+"</i>";

        if (device != "" && this.data["CONFIG"]["devices"][device]) {
            var device_config   = this.data["CONFIG"]["devices"][device];
            var device_name     = this.data["CONFIG"]["devices"][device]["settings"]["label"];

            select_value = this.basic.select_array("add_toggle_value", "value (boolean)", device_config["commands"]["get"], "", "power");
            select_on    = this.basic.select_array("add_toggle_on","button ON", device_config["buttons"], "", "on");
            select_off   = this.basic.select_array("add_toggle_off","button OFF", device_config["buttons"], "", "off");

            setValueById("add_toggle_descr",   "Toggle " + device_name + " (" + device + ")")
            }
        else {
            select_value = select;
            select_on    = select;
            select_off   = select;
            }

        setTextById("toggle_device_value", select_value);
        setTextById("toggle_device_on",    select_on);
        setTextById("toggle_device_off",   select_off);
        }

    // create drop-downs for scene slider buttons
    this.scene_slider_select        = function (div_id,id,device,scene) {

        var device = check_if_element_or_value(device,false);
        var select = "<i>"+lang("SELECT_DEV_FIRST")+"</i>";
        var select_cmd, select_param, select_min_max = "";

        if (device != "" && this.data["CONFIG"]["devices"][device]) {
            var device_config   = this.data["CONFIG"]["devices"][device];
            var device_name     = this.data["CONFIG"]["devices"][device]["settings"]["label"];
            var device_cmd      = this.device_has_ranges(device, true);
            var onchange_slider_param = this.app_name+".remote_prepare_slider('scene','"+device+"','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','remote_json_buttons');";

            select_cmd     = this.basic.select_array("add_slider_cmd", lang("BUTTON_T_SEND"), device_cmd, "", "")
            select_param   = this.basic.select_array("add_slider_param", lang("BUTTON_T_PARAMETER"), device_cmd, onchange_slider_param, "")
            select_min_max = this.basic.input("add_slider_minmax", lang("BUTTON_T_MINMAX"))

            setValueById("add_slider_descr",   "Slider " + device_name + " (" + device + ")")
            }
        else {
            select_cmd     = select;
            select_param   = select;
            select_min_max = select;
            }

        setTextById("slider_device_cmd",     select_cmd);
        setTextById("slider_device_param",   select_param);
        setTextById("slider_device_min-max", select_min_max);
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


function rmRemoteAdvancedElements(name, remote) {

    // set main data
	this.data             = {};
	this.app_name         = name;
	this.remote           = remote;
	this.active_name      = remote.active_name;
	this.logging           = new jcLogging(this.app_name);

    // connect pure elements
	this.e_color_picker   = new rmColorPicker(name+".e_color_picker");	// rm_remotes-color-picker.js
	this.e_slider         = new rmSlider(name+".e_slider");			// rm_remotes-slider.js

    // update API data
    this.update = function(api_data) {

        this.data           = api_data;
    	this.active_name    = remote.active_name;
    	//this.e_slider.set_device(this.active_name);
        }

	// create color picker
	this.colorPicker = function (api_data, id, device, type="devices", data) {

		this.logging.debug(this.app_name+".colorPicker: "+id+"/"+device+"/"+type+"/"+data);
        this.update(api_data);

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

        var display_start  = "<button id=\"colorpicker_"+sub_id+"_button\" class=\"color-picker\">";
        display_start     += "<center><canvas id=\"colorpicker_"+sub_id+"\">";

        var display_end    = "</canvas>";
        display_end       += "<canvas id=\"colorpicker_demo_"+sub_id+"\" style=\"border-radius:5px;border:1px white solid;\"></canvas></center>";
        display_end       += "</button>";

        var text = display_start;
        //text += this.color_picker.colorPickerHTML(send_command);
        text += display_end;

        setTimeout(() => { this.e_color_picker.colorPickerHTMLv2("colorpicker_"+sub_id, sub_id, send_command, color_model); }, 100);
        return text;
		}

	// create slider
	this.slider = function (api_data, id, device, type="devices", data) {

		this.logging.debug(this.app_name+".slider: "+id+"/"+device+"/"+type+"/"+data);
        this.update(api_data);

		var init;
		var disabled = false;

		if (device.indexOf("group_") >= 0) {
		    var group_name          = device.split("_")[1];
            var group_devices       = this.data["CONFIG"]["macros"]["groups"][group_name];
            if (!group_devices || !group_devices["devices"] || group_devices["devices"].length == 0) {
                this.logging.error(this.app_name+".slider_element: Group "+group_name+" not defined correctly.");
                return "";
                }
            var check_device        = group_devices["devices"][0];
            var status_data         = this.data["STATUS"]["devices"][check_device];
            var device_api          = this.data["STATUS"]["devices"][check_device]["api"];
            var device_api_status   = this.data["STATUS"]["interfaces"]["connect"][device_api];
		    }
		else if (!this.data["CONFIG"][type][device]) {
		    this.logging.error(this.app_name+".slider_element: Could not create slider element: " + type + " '" + device + "' does not exist.");
		    return "";
		    }
        else {
            var status_data         = this.data["STATUS"]["devices"][device];
            var device_api          = this.data["STATUS"]["devices"][device]["api"];
            var device_api_status   = this.data["STATUS"]["interfaces"]["connect"][device_api];
            }

        if (!device_api_status) { this.logging.error("API Device not defined correctly for " + device + ": " + device_api + " doesn't exist.")}
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
        text += this.e_slider.sliderHTML(name=data[1], label=data[2], device=device, command=data[1], min, max, init, disabled);
        text += display_end;
        return text;
		}

	// create toggle element (ON | OFF) - "TOGGLE||<status-field>||<description/label>||<TOGGLE_CMD_ON>||<TOGGLE_CMD_OFF>"
	this.toggle = function (api_data, id, device, type="device", data, short=false) {

		this.logging.debug(this.app_name+".toggle: "+id+"/"+device+"/"+type+"/"+data);
        this.update(api_data);

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
       	text += this.e_slider.toggleHTML(name=data[1], label=data[2], device=device, command_on=data[3], command_off=data[4], init, disabled);
       	text += toggle_end;
       	return text;
	}

}


//--------------------------------
// EOF
