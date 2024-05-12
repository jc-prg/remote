//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// settings page & functions
//--------------------------------


function rmSettings (name) {	// IN PROGRESS

	// preset vars
	this.data         = {};
	this.active       = false;
	this.app_name     = name;
	this.e_settings   = ["setting1","setting2","setting3","setting4","setting5","setting6"];
	this.e_remotes    = ["frame3","frame4","frame5","frame1","frame2"];
	this.input_width  = "110px";
	this.initial_load = true;
	this.edit_mode    = false;
	this.manual_mode  = false;
	this.mode         = "";
	this.line         = "<div style=\"border:1px solid;height:1px;margin:5px;margin-top:10px;padding:0px;\"></div>";

	this.logging      = new jcLogging(this.app_name);
	this.btn          = new rmRemoteButtons(name);          // rm_remotes-elements.js
	this.basic        = new rmRemoteBasic(name+".basic");   // rm_remotes-elements.js
	this.tab          = new rmRemoteTable(name+".tab");     // rm_remotes-elements.js
	this.json         = new rmRemoteJSON(name+".json");     // rm_remotes-elements.js
	this.toggle       = new rmSlider(name+".toggle");       // rm_remotes-slider.js
	
	// init settings / set vars
	this.init			        = function (data) {
        // set data
        this.data = data;

        // status
        if (data)	{this.app_stat = data["STATUS"]["system"]["message"]; this.app_last = data["REQUEST"]["Button"];}
        else		{this.app_stat = "ERROR: no connection to server!";}

        if (this.initial_load) {
            // check if test
            if (test) 	{this.test_info = "Test Stage";}
            else 		{this.test_info = "Prod Stage";}
			
            this.initial_load = false;
            this.logging.default("Initialized new class 'rmSettings'.");
            }
        else {
            this.logging.default("Reload data 'rmSettings'.");
            }
		}

	// write settings page
    this.create			        = function (selected_mode="", direct_cmd="", direct_data="") {

        this.header_title = getTextById("header_title");

        if (selected_mode != "")   { this.mode = selected_mode; }
        else if (this.mode != "")  { selected_mode = this.mode; }

        if (selected_mode == "index") {
            setNavTitle(lang('SETTINGS'));
            this.settings_ext_reset();
            this.settings_ext_append(1, lang("SETTINGS"), this.module_index());
            this.settings_ext_append(2, lang("QUICK_ACCESS"), "&nbsp;<br/>" + this.module_index_quick(true, true));
            this.create_show_ext();

            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
            statusShow_powerButton('button_manual_mode', getTextById('button_manual_mode'));
            }
        else if (selected_mode == "general") {
            setNavTitle(lang('SETTINGS_GENERAL'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.module_index(true, "SETTINGS_GENERAL"), "");
            this.settings_ext_append(1,lang("SETTINGS_GENERAL"), this.module_general_settings());
            this.create_show_ext();
            }
        else if (selected_mode == "edit_remotes") {
            setNavTitle(lang('SETTINGS_REMOTE'));

            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.module_index(true, "SETTINGS_REMOTE"));
            this.settings_ext_append(1,"", this.module_index_quick(true, false));
	    	this.settings_ext_append(2,lang("EDIT_REMOTES"), this.module_add_remotes(direct_cmd, direct_data) + this.module_title() + this.module_order_remotes());
    		this.settings_ext_append(2,lang("EDIT_MACROS"), this.module_macros_edit());
            this.create_show_ext();

            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
            statusShow_powerButton('button_manual_mode', getTextById('button_manual_mode'));
            statusShow_powerButton('button_show_code', getTextById('button_show_code'));
            //apiGetConfig_showInterfaceData(this.module_interface_edit_info);
            }
        else if (selected_mode == "edit_interfaces") {
            setNavTitle(lang('SETTINGS_API'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.module_index(true, "SETTINGS_API"));
            this.module_interface_edit();
            this.settings_ext_append(1, "", this.module_interface_info());
            this.create_show_ext();
            apiGetConfig_showInterfaceData(this.module_interface_edit_info);
            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
            }
        else if (selected_mode == "edit_timer") {
            setNavTitle(lang('SETTINGS_TIMER'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.module_index(true, "SETTINGS_TIMER"));
            this.settings_ext_append(1,lang("SETTINGS_TIMER"), this.module_timer());
            this.create_show_ext();
            }
        else {
            setNavTitle(lang('INFORMATION'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.module_index(true, "INFORMATION"));
            this.settings_ext_append(1,lang("VERSION_AND_STATUS"), this.module_system_info());
            this.settings_ext_append(2,lang("BUTTON_INFOS"), this.module_system_info_buttons());
            this.create_show_ext();
            this.create_show_log();
            }
        statusCheck_modes();
        scrollTop();
        }

    this.create_show            = function () {

        elementVisible("setting_frames");
        elementHidden("setting_ext_frames");

        show_settings = true;
        show_remotes  = false;
        this.active   = true;
        showRemoteInBackground(0);

        for (var i=0; i<this.e_remotes.length; i++)  { elementHidden(this.e_remotes[i],show_remotes);  }
        for (var i=0; i<this.e_settings.length; i++) { elementVisible(this.e_settings[i],show_settings); }
        }

    this.create_show_ext        = function () {

        this.create_show();
        elementHidden("setting_frames");
        elementVisible("setting_ext_frames");
        }

    this.create_show_log        = function () {

        elementVisible("setting_frames");
        for (var i=0; i<this.e_settings.length; i++) { elementHidden(this.e_settings[i]); }
        elementVisible(this.e_settings[this.e_settings.length-1]);
        }

    this.module_index           = function (small=false, selected="") {
	    var html  = "";
	    if (!small) { html += "&nbsp;<br/>"; }
	    var button_img  = this.data["CONFIG"]["elements"]["button_images"];
	    var setting_modules_back = {
	        "SETTINGS":         ["link_back",   "rm3settings.create('index');"],
	    }
	    var setting_modules = {
	        "INFORMATION":      ["info",        "rm3settings.create('info');"],
	        "SETTINGS_GENERAL": ["settings2",   "rm3settings.create('general');"],
	        "SETTINGS_REMOTE":  ["remote",      "rm3settings.create('edit_remotes');"],
	        "SETTINGS_API":     ["plug",        "rm3settings.create('edit_interfaces');"],
	        "SETTINGS_TIMER":   ["timer",        "rm3settings.create('edit_timer');"]
	        }
	    if (small) {
	        var img_small = rm_image(button_img[setting_modules_back["SETTINGS"][0]], big=false);
	        html += "<button class='rm-button_setting_index_small' onclick=\""+setting_modules_back["SETTINGS"][1]+"\">" + img_small + "</button>";
	    }
	    for(var key in setting_modules) {
	        var css_class = "";
            if (key == selected) { css_class = " selected"; }
	        var img_big   = rm_image(button_img[setting_modules[key][0]], big=true);
	        var img_small = rm_image(button_img[setting_modules[key][0]], big=false);
	        var text  = lang(key);
	        if (small) { html += "<button class='rm-button_setting_index_small"+css_class+"' onclick=\""+setting_modules[key][1]+"\">" + img_small + "</button>"; }
	        else       { html += "<button class='rm-button_setting_index' onclick=\""+setting_modules[key][1]+"\">" + img_big + "<br/>&nbsp;<br/>" + text + "</button>"; }
	        }

	    if (!small) { html += "<div style='width:100%;height:18px;float:left;'></div>"; }
		return html;
	    }

	this.module_index_quick     = function (edit=true, intelligent=false, button_code=false) {

	    var html        = "";
		html   += this.tab.start();
		if (edit) {
		    var command_on  = "remoteToggleEditMode(true);";
		    var command_off = "remoteToggleEditMode(false);";
		    var init        = 0;
		    if (rm3remotes.edit_mode) { init = 1; }

            html += "<div style='width:95%;float:left;max-height:30px;padding:5px;padding-left:10px;'>";
            html += "   <div style='padding:5px;float:left;'>Edit mode:</div>";
            html += "   <div style='width:60px;float:right;'>"
		    html +=     this.toggle.toggleHTML("mode_edit", "", "", command_on, command_off, init);
            html += "   </div>";
            html += "</div>";
		    }
		if (intelligent) {
		    var command_on  = this.app_name+".button_deact(true)";
		    var command_off = this.app_name+".button_deact(false)";
		    var init        = 1;
		    if (this.manual_mode) { init = 0; }

            html += "<div style='width:95%;float:left;max-height:30px;padding:5px;padding-left:10px;'>";
            html += "   <div style='padding:5px;float:left;'>Intelligent mode:</div>";
            html += "   <div style='width:60px;float:right;'>";
		    html +=     this.toggle.toggleHTML("mode_intelligent", "", "", command_on, command_off, init);
            html += "   </div>";
            html += "</div>";
		    }
		if (button_code) {
		    var command_on  = this.app_name+".button_show(true)";
		    var command_off = this.app_name+".button_show(false)";
		    var init        = 0;
		    if (showButton) { init = 1; }

            html += "<div style='width:95%;float:left;max-height:30px;padding:5px;padding-left:10px;'>";
            html += "   <div style='padding:5px;float:left;'>Show button code:</div>";
            html += "   <div style='width:60px;float:right;'>";
		    html +=     this.toggle.toggleHTML("mode_buttonshow", "", "", command_on, command_off, init);
            html += "   </div>";
            html += "</div>";
		    }
		html   += this.tab.end();

		return html;
	    }

	this.module_title           = function (title="") {
	    var setting = "<br/>";
	    if (title != "") {
            setting += this.line;
            setting += "<center><b>" + title + "</b></center>";
            }
	    setting += this.line;
	    return setting;
	    }

    this.module_error_log       = function () {
        var setting = "";
        setting    += "<div id='error_log'></div>";
        setting    += "<div id='data_log' style='display:none'></div>";
        return setting;
    }

	this.module_system_info     = function () {

		var setting            = "";
		var cookie             = appCookie.get("remote");
        var main_audio         = this.data["CONFIG"]["main-audio"];  // get main audio device from file
		var main_device_config = this.data["CONFIG"]["devices"][main_audio];
		var main_device        = this.data["STATUS"]["devices"][main_audio];
		var system_health      = this.data["STATUS"]["system_health"];
		var audio_max		   = 100;

        if (main_device && main_device_config) {
            if (main_device_config["commands"]["definition"]
                && main_device_config["commands"]["definition"]["vol"]
                && main_device_config["commands"]["definition"]["vol"]["values"]
                && main_device_config["commands"]["definition"]["vol"]["values"]["max"]
                ) {
                audio_max  = main_device_config["commands"]["definition"]["vol"]["values"]["max"];
                }
            else {
                audio_max  = 100;
                this.logging.error("Max values not defined, set 100!");
                }
            var audio1     = "Power: "  + main_device["power"] + " / "
                           + "Volume: " + main_device["vol"] + " (" + audio_max + ")";
            var audio2     = main_device_config["settings"]["label"];
            }


		// version information
		set_temp  = this.tab.start();
		set_temp += this.tab.row( "Client:",	 appVersion + " / " + this.test_info + " (" + rollout + ")" );
		set_temp += this.tab.row( "Server:",	 this.data["API"]["version"] + " / " + this.data["API"]["rollout"] );
		set_temp += this.tab.row( "Modules:",
                                    "jcMsg "        + appMsg.appVersion +
                                    " / jcApp "     + appFW.appVersion +
                                    " / jcAppFW "   + appFwVersion +
                                    " / jcCookies " + appCookie.appVersion +
                                    " / jcSlider "  + rm3slider.appVersion );
		set_temp += this.tab.row( "Sources:",  "<a href='https://github.com/jc-prg/remote/' style='color:white' target='_blank'>https://github.com/jc-prg/remote/</a>");
		set_temp += this.tab.row( "REST API:", "<a href='"+ RESTurl + "api/list/' style='color:white' target='_blank'>" + RESTurl + "api/list/</a>");
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_version","Versions",set_temp,true);

        // server health
        var modules = [];
        for (const [key, value] of Object.entries(system_health)) {
            if (value == "registered")      { modules.push(key); }
        }
        setTimeout(function(){ statusCheck_health(this.data); }, 500 );

		set_temp  = this.tab.start();
		set_temp += this.tab.row( 	"Threads:&nbsp;", "<div id='system_health'></div>" );
		set_temp += this.tab.row( 	"Modules:&nbsp;", modules.join(", ") );
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_health","Server Health",set_temp,true);

		// sceen & display
		set_temp  = this.tab.start();
		var d_width  = screen.width;
		var d_height = screen.height;
		set_temp += this.tab.row( 	"Screen:",
						"<div class='screen_default'>default screen</div>" +
						"<div class='screen_big'>big screen</div>" +
						"<div class='screen_iphone'>iPhone screen (portrait)</div>" +
						"<div class='screen_iphone_landscape'>iPhone screen (landscape)</div>" +
						"<div class='screen_ipad'>iPad screen (portrait)</div>" +
						"<div class='screen_ipad_landscape'>iPad screen (landscape)</div>" +
						"");
		set_temp += this.tab.row( 	"Device:", 		d_width + "x" + d_height );
		set_temp += this.tab.row( 	"Window:", 		document.body.clientWidth + "x" + document.body.clientHeight );
		set_temp += this.tab.row(	"Position:",		"<div id='scrollPosition'>0 px</div>" );
		set_temp += this.tab.row( 	"Theme:", 		appTheme );
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_display","Screen &amp; Display",set_temp,false);

		// status
		set_temp  = this.tab.start();
		set_temp += this.tab.row( 	"Server:", 	this.app_stat );
		set_temp += this.tab.row( 	"Cookie:",	cookie );
		set_temp += this.tab.row( 	"Button:",	this.app_last );
        if (main_device && main_device_config) {
    		set_temp += this.tab.row( 	"Audio:",	audio2 + "<br/>" + audio1 );
    		}
    	else {
    		set_temp += this.tab.row( 	"Audio:",	"<i>No main audio device defined yet.</i>" );
    	    }
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_other","Other",set_temp,false);

	    return setting;
		}

	this.module_system_info_buttons = function () {

		var setting            = "";
		var cookie             = appCookie.get("remote");
        var main_audio         = this.data["CONFIG"]["main-audio"];  // get main audio device from file
		var main_device_config = this.data["CONFIG"]["devices"][main_audio];
		var main_device        = this.data["STATUS"]["devices"][main_audio];
		var system_health      = this.data["STATUS"]["system_health"];
		var audio_max		   = 100;

		// button color codes
		var buttons = "";
		for (var key in colors_power) {
			buttons += "<button class='rm-button' style='background-color:"+colors_power[key]+";width:22%;'>"+key+"</button>";
			}
		button_style = "width:30%;max-width:none;height:40px;";
		buttons += "<button class='rm-button notfound' style='"+button_style+"' disabled>command not found</button>";
        buttons += "<button class='rm-button notfound' style='"+button_style+"'>edit mode: cmd not found</button>";
		buttons += "<button class='rm-button small_edit' style='"+button_style+"'>edit mode: invisible</button>";

		set_temp  = this.tab.start();
		set_temp += this.tab.row( "<center>" + buttons + "</center>" );
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_color_codes","Button color codes",set_temp,false);

        // button images
        set_temp  = "";
        images    = dataAll["CONFIG"]["elements"]["button_images"];
        for (var key in images) {
            set_temp += "<button class='image_list key' style='width:50px;'>";
            set_temp += key;
            set_temp += "</button>";
            set_temp += "<button class='image_list'>";
            set_temp += rm_image(images[key], false);
            set_temp += "</button>";
            }
		setting  += this.basic.container("setting_button_images","Images buttons",set_temp,false);


        set_temp  = "";
        colors    = dataAll["CONFIG"]["elements"]["button_colors"];
        for (var key in colors) {
            set_temp += "<button class='image_list key'>";
            set_temp += key;
            set_temp += "</button>";
            set_temp += "<button class='rm-button bg"+key+"' style='width:50px;'>";
            set_temp += "";
            set_temp += "</button>";
            }
		setting  += this.basic.container("setting_button_colors","Color buttons",set_temp,false);

	    return setting;
		}

	this.module_timer           = function () {
	    var html = "";
	    html += "<div id='module_timer_info' style='width:100%;min-height:100px;'></div>";
	    setTimeout(function(){ appFW.requestAPI("GET", ["timer"], "", rm3settings.module_timer_info); }, 100);
	    return html;
	    }

	this.module_timer_info      = function (data) {

	    this.module_timer_dialog = function(key, entry) {

            var data_fields = "timer_name_"+key+",timer_description_"+key+",timer_regular_"+key+",timer_once_"+key+",timer_commands_"+key;
            var link_save   = "val=document.getElementById(\"timer_name_"+key+"\").value; if(val!=\"\") { apiTimerEdit(\""+key+"\",\""+data_fields+"\"); } else { appMsg.alert(\"Add a title!\"); }";
            var link_reset  = "rm3settings.module_timer();";
            var link_delete = "apiTimerDelete(\""+key+"\");";

	        var buttons     = "";
            if (key != "NEW_TIMER_ID") {
                buttons   += btn.sized("timer_save_"+key,    lang("BUTTON_T_SAVE"),   "",  link_save);
                buttons   += btn.sized("timer_reset_"+key,   lang("BUTTON_T_RESET"),  "",  link_reset);
                buttons   += btn.sized("timer_delete_"+key,  lang("BUTTON_T_DELETE"), "",  link_delete);
                }
            else {
                buttons   += btn.sized("timer_add_"+key,     lang("BUTTON_T_CREATE"),   "",  link_save);
                }

	        var entry_html = "";
            entry_html += tab.start();
            if (key != "NEW_TIMER_ID") {
                entry_html += tab.row("ID:",            key);
                }
            entry_html += tab.row("Title:",         input("timer_name_"+key, "", "",  entry["name"]));
            entry_html += tab.row("Description:",   input("timer_description_"+key, "", "", entry["description"]));
            entry_html += tab.line();
            entry_html += tab.row("Repeating timer:");
            entry_html += tab.row("<textarea id='timer_regular_"+key+"' style='width:95%;height:80px;display:none;'>" + JSON.stringify(entry["timer_regular"]) + "</textarea>");
            entry_html += tab.row(rm3settings.module_timer_element("regular", key, entry["timer_regular"]));
            entry_html += tab.row("&nbsp;");
            //entry_html += tab.row("One-time timer:");
            entry_html += tab.row("<textarea id='timer_once_"+key+"'    style='width:95%;height:80px;display:none;'>" + JSON.stringify(entry["timer_once"]) + "</textarea>");
            //entry_html += tab.row("&nbsp;");
            entry_html += tab.row("Commands:");
            entry_html += tab.row("<input id='timer_commands_"+key+"'   style='width:95%' value='" + JSON.stringify(entry["commands"]) + "'>");
            entry_html += tab.row("&nbsp;");
            entry_html += tab.line();
            entry_html += tab.row(buttons);

            entry_html += tab.end();

            return entry_html;
	        }

	    var html = "";
        var tab         = rm3settings.tab;
        var input       = rm3settings.input;
        var btn         = rm3settings.btn;
        var basic       = rm3settings.basic;
        btn.width       = "70px;"

	    for (var key in data["DATA"]["timer"]) {
	        var entry       = data["DATA"]["timer"][key];
            var entry_html  = this.module_timer_dialog(key, entry);
            var entry_title = entry["name"] + "</b>";
            if (entry["timer_regular"]["active"]) { entry_title += ""; }
            else                                  { entry_title += " <i>(inactive)</i>"; }

    		html  += rm3settings.basic.container("timer_edit_"+key, entry_title, entry_html, false);
	        }

	    var entry_html  = this.module_timer_dialog("NEW_TIMER_ID", {"name":"","description":"","commands":[],
	                                                          "timer_regular":{"active":false,"month":-1,"day_of_month":-1,
	                                                          "hour":-1,"minute":-1,"day_of_week":-1}, "timer_once": []});
        var entry_title = "<i>Create new timer ...</i>";
        html  += rm3settings.basic.container("timer_edit_add_new", entry_title, entry_html, false);


	    setTextById('module_timer_info', html);
	    }

	this.module_timer_element   = function (type, key, data) {

	    this.module_timer_input = function (input_type, timer_type, key, value) {
	        var onchange = "rm3settings.module_timer_change(\"" + timer_type + "\", \""+key+"\");";
	        var html = "<select id='timer_select_" + input_type + "_" + key +"' style='width:40px;' onchange='"+onchange+"'>";

	        if (input_type == "month")             { var options = {"**": -1}; for (var i=1;i<=12;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
	        else if (input_type == "day_of_month") { var options = {"**": -1}; for (var i=1;i<=31;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
	        else if (input_type == "hour")         { var options = {"**": -1}; for (var i=0;i<=24;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
	        else if (input_type == "minute")       { var options = {"**": -1}; for (var i=0;i<=60;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
	        else if (input_type == "day_of_week")  { var options = {"*": -1}; for (var i=0;i<=6;i++)  { options[i.toString().padStart(1, '0')] = i.toString().padStart(1, '0'); } }
	        else                                   { var options = {}; console.error("input type unknown: " + input_type); }

            option_keys = Object.keys(options).sort();
            for (var i=0;i<option_keys.length;i++) {
                var key = option_keys[i];
                var selected = "";
                if (options[key] == value) { selected = "selected"; }
                html += "<option value='"+options[key]+"' "+selected+">" + key + "</option>";
            }
	        html += "</select>";
	        return html;
	        }

	    var html = "";
	    if (type == "regular") {
	        var checked = "";
            var onchange = "rm3settings.module_timer_change(\"" + type + "\", \""+key+"\");";
	        if (data["active"]) { checked = "checked"; }
	        html += "<input id='timer_"+type+"_active_"+key+"' type='checkbox' value='active' "+checked+" onchange='"+onchange+"'>:&nbsp;";
	        html += "<input id='timer_"+type+"_YY_"+key+"' type='input' style='width:30px;' value='****' disabled>-";
	        html += this.module_timer_input("month",        type, key, data["month"]) + "-";
	        html += this.module_timer_input("day_of_month", type, key, data["day_of_month"]) + " / ";
	        html += this.module_timer_input("hour",         type, key, data["hour"]) + "-";
	        html += this.module_timer_input("minute",       type, key, data["minute"]) + " / ";
	        html += this.module_timer_input("day_of_week",  type, key, data["day_of_week"]);
	        }
	    return html;
	}

	this.module_timer_change    = function (timer_type, key) {

	    var timer_data = JSON.parse(getTextById("timer_" + timer_type + "_" + key));
	    var active     = document.getElementById("timer_" + timer_type + "_active_" + key);
        for (var data_key in timer_data) {
            if (data_key != "active") {
                value = getValueById("timer_select_" + data_key + "_" + key);
                timer_data[data_key] = value;
                }
            }

        if (active.checked) { timer_data["active"] = true; } else { timer_data["active"] = false; }
        setTextById("timer_regular_"+key,JSON.stringify(timer_data));
	    }

	this.module_interface_info  = function () {
		var setting = "<b>&nbsp;API details for devices</b><text style='font-size:25px;'>&nbsp;</text>";
		setting    += "<hr style='border:1px lightgray solid;' />";
		setting    += "<div style='padding:5px;padding-bottom:6px;'>";

		set_temp  = this.tab.start();
		set_temp += this.tab.row("Speed:&nbsp;&nbsp;", this.exec_time_list() );
		set_temp += this.tab.end();
		set_temp += "</div><div style='padding:5px;'>";
		set_temp += this.tab.start();
		set_temp += this.tab.row("Details:&nbsp;&nbsp;",
                    this.device_list("select_dev_status", this.app_name+".device_list_status('select_dev_status','dev_status');"));
        set_temp += this.tab.row("<span id='dev_status'>&nbsp;</span>");
		set_temp += this.tab.end();
		setting  += set_temp;
		setting  += "</div>";

		return setting;
    	}

    this.module_interface_edit  = function () {

		var count = 1;
        var devices_per_interface = this.data["CONFIG"]["apis"]["structure"];
        var interface_status      = this.data["STATUS"]["connections"];

        for (var key in devices_per_interface) {
            if (key != "") {
                count += 1;
                var text = "";
                var key2 = key.replaceAll("-", "");
                var initial_visible = "display:none;";
                if (!interface_status[key]["active"]) { initial_visible = "display:none"; }
                var command_on  = 'javascript:apiInterfaceOnOff(\''+key+'\', \'True\'); document.getElementById(\'interface_edit_'+key+'\').style.display=\'block\';';
                var command_off = 'javascript:apiInterfaceOnOff(\''+key+'\', \'False\');';
                var command_show_hide = "var el_"+key2+" = document.getElementById(\"interface_edit_"+key+"\"); ";
                command_show_hide    += "if (el_"+key2+".style.display == \"block\") { el_"+key2+".style.display = \"none\"; } else { el_"+key2+".style.display = \"block\"; }";
                var init = "";
                text += "<div style='width:100%;float:left;max-height:30px;'>";
                text += "   <div style='width:60px;float:right;'>"
                text +=     this.toggle.toggleHTML("active_"+key, "", "", command_on, command_off, init);
                text += "   </div>";
                text += "   <div style='padding:5px;float:left;'><b onclick='"+command_show_hide+"' style='cursor:pointer;'>API: "+key+" </b>&nbsp;<text id='api_status_icon_"+key+"' style='font-size:18px;'></text></div>";
                text += "</div>";
                text += "<div id='interface_edit_"+key+"' style='width:100%;min-height:50px;float:left;"+initial_visible+"'></div>";

                this.settings_ext_append(count, "", text);
            }   }
        }

    this.module_interface_edit_list = function (interface, data) {
        var text = "";
        var devices_per_interface = data["CONFIG"]["apis"]["structure"];
        var devices_detect = data["CONFIG"]["apis"]["list_detect"];

        var details = "<div style='width:100%;height:9px;'></div>";
        var external_ids = {};

        for (var api_device in devices_per_interface[interface]) {
            details += "<i>API Device: " + api_device + "</i>&nbsp;&nbsp;";
            var connect  = data["STATUS"]["interfaces"]["connect"][interface + "_" + api_device];
            if (!connect) { connect = "N/A"; }
            details += "<ul>";
            for (var i=0;i<devices_per_interface[interface][api_device].length;i++) {
                var device          = devices_per_interface[interface][api_device][i];
                var device_settings = data["CONFIG"]["devices"][device];
                var power_status    = data["STATUS"]["devices"][device]["power"];
                var online_status   = data["STATUS"]["devices"][device]["availability"];
                var method          = device_settings["interface"]["method"];
                var label           = device_settings["settings"]["label"];
                var visibility      = device_settings["settings"]["visible"];
                var hidden          = "";
                var idle            = "<small id=\"device_auto_off_"+device+"\"></small>";
                var command_on    = "appFW.requestAPI('GET',['set','"+device+"','power','ON'], '', '', '' ); setTextById('CHANGE_STATUS_"+device+"','ON');"; //rm3settings.onoff();remoteInit();";
                var command_off   = "appFW.requestAPI('GET',['set','"+device+"','power','OFF'], '', '', '' );setTextById('CHANGE_STATUS_"+device+"','OFF');"; //rm3settings.onoff();remoteInit();";

                external_id       = device_settings["settings"]["device_id"];
                if (external_id != undefined && external_id != "") { external_ids[external_id] = true; }

                if (online_status && online_status == "offline") { power_status = "N/A (offline)"; }
                if (visibility != "yes") { hidden = "*"; }
                if (method == "record" && power_status == "ON")  {
                    power_status = "<u id=\"CHANGE_STATUS_"+device+"\"><status onclick=\""+command_off+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                    }
                else if (method == "record" && power_status == "OFF") {
                    power_status = "<u id=\"CHANGE_STATUS_"+device+"\"><status onclick=\""+command_on+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                    }

                details += "<li><b>["+device+"]</b> <i>"+label+":</i> " + power_status + hidden + "</li>" + idle;
                }
            details += "</ul>";
            }
        details += "<br/>";

        var details_new = "";
        var new_exist   = false;
        for (var api_device in devices_detect) {
            if (api_device.indexOf(interface) == -1) { continue; }
            details_new += "<i>API Device: not yet connected ("+interface+") </i>&nbsp;&nbsp;";
            details_new += "<ul>";
            for (var device in devices_detect[api_device]) {

                if (devices_detect[api_device][device]["type"] == "Coordinator")    { continue; }
                if (external_ids[devices_detect[api_device][device]["id"]] == true) { continue; } else { new_exist = true; }

                var name = "";
                var disabled = "";
                var info = "";
                var button_add = "";
                if (devices_detect[api_device][device]["id"] != devices_detect[api_device][device]["name"]) { name = devices_detect[api_device][device]["name"]; }
                if (devices_detect[api_device][device]["description"])         { info = devices_detect[api_device][device]["description"];}
                if (devices_detect[api_device][device]["disabled"])            { disabled = "&nbsp;&nbsp;<small>(DISABLED)</small>"; }
                if (devices_detect[api_device][device]["available"] == false)  { disabled = "&nbsp;&nbsp;<small>(N/A)</small>"; }

                if (disabled == "") {
                    var button_cmd  = "rm3settings.create(\"edit_remotes\", \"add_device\", {";
                    button_cmd     += "\"external_id\": \"" + devices_detect[api_device][device]["id"] + "\", ";
                    button_cmd     += "\"description\": \"" + info + "\", ";
                    button_cmd     += "\"api_device\": \"" + api_device + "\", ";
                    button_cmd     += "\"label\": \"" + name + "\", ";
                    button_cmd     += "\"device_name\": \"" + name + "\"";
                    button_cmd     += "});";
                    button_add     = "<button onclick='"+button_cmd+"'> add </button>";
                    }

                if (info != "") {  info = ": " + info; }
                details_new += "<li>" + button_add + "<b>[" + devices_detect[api_device][device]["id"] + "]</b><br/>" + name + info + disabled + "</li>";
                }

            if (interface == "ZIGBEE2MQTT") {
                details_new += "<li>Permit new devices to join: <button onclick='apiCommandSend(\"plug10_bridge-permit\");'>permit</button></li>";
                }
            details_new += "</ul>";
            }
        if (new_exist) { details += details_new; }

        return details;
        }

    this.module_interface_edit_info = function (data) {

        var interfaces = data["DATA"]["interfaces"];
    	this.tab       = new rmRemoteTable(name+".tab");
    	this.btn       = new rmRemoteButtons(name);			// rm_remotes-elements.js
        this.basic     = new rmRemoteBasic(name+".basic");		// rm_remotes-elements.js

    	this.list      = function (interface, data) {
            var text = "";
            var devices_per_interface = dataAll["CONFIG"]["apis"]["structure"];

            //for (var interface in devices_per_interface) {
            var details = "<div style='width:100%;height:9px;'></div>";

            for (var api_device in devices_per_interface[interface]) {
                details += "<i>API Device: " + api_device + "</i>&nbsp;&nbsp;";
                var connect  = dataAll["STATUS"]["interfaces"]["connect"][interface + "_" + api_device];

                //details += "<text id='api_status_short_"+interface+"_"+api_device+"'></text>";
                details += "<ul>";
                for (var i=0;i<devices_per_interface[interface][api_device].length;i++) {
                    count += 1;
                    var device          = devices_per_interface[interface][api_device][i];
                    var device_settings = dataAll["CONFIG"]["devices"][device];
                    var method          = dataAll["CONFIG"]["devices"][device]["interface"]["method"];
                    var power_status    = dataAll["STATUS"]["devices"][device]["power"];
                    var label           = device_settings["settings"]["label"];
                    var visibility      = device_settings["settings"]["visible"];
                    var hidden          = "";
                    var idle            = "<small id=\"device_auto_off_"+device+"\"></small>";
                    var command_on    = "appFW.requestAPI('GET',['set','"+device+"','power','ON'], '', '', '' ); setTextById('CHANGE_STATUS_"+device+"','ON');"; //rm3settings.onoff();remoteInit();";
                    var command_off   = "appFW.requestAPI('GET',['set','"+device+"','power','OFF'], '', '', '' );setTextById('CHANGE_STATUS_"+device+"','OFF');"; //rm3settings.onoff();remoteInit();";

                    if (visibility != "yes") { hidden = "*"; }
                    if (method == "record" && power_status == "ON")  {
                        power_status = "<u id=\"CHANGE_STATUS_"+device+"\"><status onclick=\""+command_off+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                        }
                    else if (method == "record" && power_status == "OFF") {
                        power_status = "<u id=\"CHANGE_STATUS_"+device+"\"><status onclick=\""+command_on+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                        }

                    details += "<li><b>["+device+"]</b> <i>"+label+":</i> " + power_status + hidden + "</li>" + idle;
                    }
                details += "</ul>";
                }
            details += "<br/>";
                //text += this.basic.container("details_"+interface,"Interface: "+interface+" </b><text id='api_status_"+interface+"'> &nbsp;...</text>",details,false);
                //}
            return [count, details];
            }
    	this.btn.width = "72px";

        for (var key in interfaces) {
            var id        = "interface_edit_"+key;
            var interface = interfaces[key];
            var setting   = "";
            setting += "<hr style='border:solid lightgray 1px;'/>";

            var [count, overview] = this.list(key, data);
            var container_title = "</b>Connected devices";
            if (count == 0) { container_title += " (empty)"; }
            setting += this.basic.container("details_"+key+"_overview", container_title, overview, false);

            for (var dev in interface["API-Devices"]) {

                var edit_json  = JSON.stringify(interface["API-Devices"][dev]);
                edit_json      = edit_json.replaceAll("{", "{\n");
                edit_json      = edit_json.replaceAll("}", "\n}\n");
                edit_json      = edit_json.replaceAll(",", ",\n");

                var information = "";
                information += "<div id='api_status_data_"+key+"_"+dev+"' style='display:block'>";
                information += "<textarea id=\"api_status_edit_"+key+"_"+dev+"\" style=\"width:95%;height:150px;\" disabled>" + edit_json + "</textarea>";
                information += "</div>";

                var api_dev        = key.toLowerCase() + "_" + dev.toLowerCase();
                var link_save      = "apiSetConfig_InterfaceData( \""+key+"_"+dev+"\", \"api_status_edit_"+key+"_"+dev+"\" );"
                var link_reconnect = "apiReconnectInterface( \""+key+"_"+dev+"\");"
                var link_edit      = "document.getElementById(\"api_status_edit_"+key+"_"+dev+"\").removeAttribute(\"disabled\");";
                link_edit         += "this.className=\"button hidden\";";
                link_edit         += "document.getElementById(\"save_"+api_dev+"\").className=\"button\";";
                var link_api_info  = "window.open(\""+interface["API-Info"]+"\")";
                var link_on_off    = "apiApiDeviceOnOff_button(\""+key+"\", \""+dev+"\", this);";

                var buttons   = "";
                console.log("module_interface_edit_list: " + key + "_" + dev)
                var connect_status_api = dataAll["STATUS"]["interfaces"]["active"][key];
                var connect_status     = dataAll["STATUS"]["interfaces"]["connect"][key+"_"+dev];

                if (!connect_status) { connect_status = "NO DEVICE connected yet."; }

                var on_off_status = "";
                if (connect_status_api == false)                { on_off_status = "N/A"; }
                else if (connect_status.indexOf("OFF") > -1)    { on_off_status = "OFF"; }
                else if (connect_status.indexOf("ERROR") > -1)  { on_off_status = "ERROR"; }
                else                                            { on_off_status = "ON"; }

                buttons      += this.btn.sized("onoff_"+api_dev,      on_off_status,    "",  link_on_off);
                buttons      += this.btn.sized("edit_"+api_dev,       lang("EDIT"),     "",  link_edit)
                buttons      += this.btn.sized("save_"+api_dev,       lang("SAVE"),     "hidden",  link_save);
                buttons      += this.btn.sized("reconnect_"+api_dev,  lang("RECONNECT"),"",  link_reconnect);
                buttons      += this.btn.sized("info_"+api_dev,       lang("API_INFO"), "",  link_api_info);

                if (dataAll["CONFIG"]["apis"]["list_api_commands"][key+"_"+dev] && dataAll["CONFIG"]["apis"]["list_api_commands"][key+"_"+dev].length > 0) {
                    buttons += "<hr style='width:100%;float:left;'/>";
                    for (var i=0;i<dataAll["CONFIG"]["apis"]["list_api_commands"][key+"_"+dev].length > 0;i++) {
                        var command = dataAll["CONFIG"]["apis"]["list_api_commands"][key+"_"+dev][i];
                        var command_link = "apiSendToApi(\"" + key+"_"+dev + "::" +command + "\");";
                        buttons += this.btn.sized("api_cmd_"+key+"_"+dev, command, "", command_link);
                        }
                    }

                var temp = this.tab.start();
                temp    += this.tab.row("ID: ",    use_color(key+"_"+dev, "VALUE"));
                if (interface["API-Devices"][dev]["PowerDevice"] && interface["API-Devices"][dev]["PowerDevice"] != "") {
                    temp    += this.tab.row("Power: ", use_color(interface["API-Devices"][dev]["PowerDevice"] +
                                                       "<text id='power_status_"+key+"_"+dev+"'></text>", "VALUE"));
                    }
                temp    += this.tab.row("Status:", "<text id='api_status_"+key+"_"+dev+"'></text>");
                temp    += this.tab.row(information);
                temp    += this.tab.row("<div style='width:100%;text-align:center;'>" + buttons + "</div>");
                temp    += this.tab.end();

                var container_title = "</b>API-Device: "+dev+"&nbsp;&nbsp;<text id='api_status_icon_"+key+"_"+dev+"' style='font-size:16px;'></text>";

                setting += this.basic.container("details_"+key+"_"+dev, container_title, temp, false);
            }
            setting += "<br/>";
            setTextById(id, setting);

            var slider = document.getElementById("toggle__"+key+"_input");
            if (dataAll["STATUS"]["connections"][key]["active"] == true) {
                elementVisible("interface_edit_"+key);
                slider.value = 1;
                slider.className = "rm-slider device_active";
                slider.disabled = false;
                }
            else if (dataAll["STATUS"]["connections"][key]["active"] == false) {
                slider.value = 0;
                slider.className = "rm-slider device_disabled";
                slider.disabled = false;
                }
            else {
                slider.value = 0;
                slider.className = "rm-slider device_undef";
                slider.disabled = true;
                }
            }
        }

	this.module_general_settings   = function () {
		// Edit Server Settings
		var q1   = lang("RESET_SWITCH_OFF");
		var q2   = lang("RESET_VOLUME_TO_ZERO");

		this.btn.height = "30px";
		this.btn.width  = "120px";

		// Reload & Updates
		var set_temp  = "";
		var setting   = "";

		var button_value_edit_mode = "OFF";
		var button_value_manual_mode = "ON";
		var button_show_code = "OFF";

        set_temp = this.module_index_quick(true, true, true);
		setting  += this.basic.container("setting_version",lang("CHANGE_MODES"),set_temp,true);

		set_temp  = this.tab.start();
		set_temp += this.tab.row(	"<center>" +
                    this.btn.sized("set01","reload (scroll)","","appForceReload(true);") + "&nbsp;" +
                    this.btn.sized("set02","check updates","","appFW.requestAPI(\"GET\",[\"version\",\"" + appVersion +"\"], \"\", appMsg.alertReturn, \"wait\");") +
                    "</center>"
					);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_reload","Reload &amp; updates",set_temp,true);

		// API Calls and information
		set_temp  = this.tab.start();
		set_temp += this.tab.row(	"<center>" +
                    this.btn.sized("set11","REST API : list",  "","window.open(#" + RESTurl + "api/list/#,#_blank#);") + "&nbsp;" +
                    this.btn.sized("set12","REST API : status","","window.open(#" + RESTurl + "api/status/#,#_blank#);") + "&nbsp;" +
                    this.btn.sized("set13","Swagger/UI",       "","window.open(#" + RESTurl + "api/ui/#,#_blank#);") + "&nbsp;" +
                    "</center>"
                    );
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_api","API calls &amp; swagger interface",set_temp,false);

		// reset device values
		set_temp  = this.tab.start();
		set_temp += this.tab.row(	"<center>" +
                    this.btn.sized("set21","Dev ON/OFF", "","appMsg.confirm(#" + q1 + "#, #appFW.requestAPI(##GET##,[##reset##],####,apiAlertReturn );#);") + "&nbsp;" +
                    this.btn.sized("set22","Audio Level","", "appMsg.confirm(#" + q2 + "#, #appFW.requestAPI(##GET##,[##reset-audio##],####,apiAlertReturn );# );") + "&nbsp;" +
                    "</center>"
					);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_reset","Reset device values",set_temp,false);

		return setting;
	}

	this.module_macros_edit     = function () {
	    this.btn.width = "100px";

		setting   = "";
		setting  += this.basic.container("setting_macros1","JSON macros [global]",		this.json.textarea("macro",   this.data["CONFIG"]["macros"]["global"], "macros"),false);
		setting  += this.basic.container("setting_macros2","JSON macros [device ON]",	this.json.textarea("dev-on",  this.data["CONFIG"]["macros"]["device-on"], "macros"),false);
		setting  += this.basic.container("setting_macros3","JSON macros [device OFF]",	this.json.textarea("dev-off", this.data["CONFIG"]["macros"]["device-off"], "macros"),false);
		setting  += this.basic.container("setting_macros_manual","JSON macros - manual",lang("MANUAL_MACROS"),false);

		setting  += "<div style='width:100%;align:center;'><center><br/>";
//		setting  += this.btn.sized("apiMacroChange(['macro','scene-on','scene-off','dev-on','dev-off']);",lang("BUTTON_T_SAVE"),"");
		setting  += this.btn.sized(id="add_scene",label=lang("BUTTON_T_SAVE"),style="","apiMacroChange([#macro#,#scene-on#,#scene-off#,#dev-on#,#dev-off#]);","");
		setting  += "<br/></center></div>";
		return setting;
	    }

	this.module_order_remotes   = function () {

        var setting = "";
		var devices  = this.data["CONFIG"]["devices"];
		var scenes   = this.data["CONFIG"]["scenes"];

		this.btn.width  = "30px";
		this.btn.height = "30px";

        // order scenes
		this.logging.default(scenes);
		for (var key in scenes) { scenes[key]["position"] = scenes[key]["settings"]["position"]; this.logging.default(key);}
		var order  = sortDict(scenes,"position");
		set_temp = this.tab.start();
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";
			var visible = scenes[key]["settings"]["visible"];

			if (i > 0)              { button += this.btn.sized(id="mv_sce_"+i,label="<b>&uarr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#scene#,#"+key+"#,#-1#);",disabled=""); }
			else                    { button += this.btn.sized(id="mv_sce_"+i,label="",             style="updown",script_apiCommandSend="",disabled="disabled"); }
			if (i < order.length-1)	{ button += this.btn.sized(id="mv_sce_"+i,label="<b>&darr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#scene#,#"+key+"#,#1#);",disabled=""); }

			if (visible == "no")    { set_temp += this.tab.row("<i>" + scenes[key]["position"] + ". " + scenes[key]["settings"]["label"] + "</i>",button); }
			else                    { set_temp += this.tab.row("<b>" + scenes[key]["position"] + ". " + scenes[key]["settings"]["label"] + "</b>",button); }
			}

		set_temp   += this.tab.end();
        setting     = "";
		setting    += this.basic.container("setting_scene_order",lang("CHANGE_ORDER_SCENES"),set_temp,false);
		set_temp    = this.tab.start();

        // order devices
		this.logging.default(devices);
		for (var key in devices) { devices[key]["position"] = devices[key]["settings"]["position"]; this.logging.default(key); }
		var order  = sortDict(devices,"position");
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";
			var visible = this.data["CONFIG"]["devices"][key]["settings"]["visible"];

			if (i > 0)              { button += this.btn.sized(id="mv_dev_"+i,label="<b>&uarr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#device#,#"+key+"#,#-1#);",disabled=""); }
			else                    { button += this.btn.sized(id="mv_dev_"+i,label="",             style="updown",script_apiCommandSend="",disabled="disabled"); }
			if (i < order.length-1) { button += this.btn.sized(id="mv_dev_"+i,label="<b>&darr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#device#,#"+key+"#,#1#);",disabled=""); }

			if (visible == "no")    { set_temp += this.tab.row("<i>" + devices[key]["settings"]["position"] + ". " + devices[key]["settings"]["label"] + "</i>",button); }
			else                    { set_temp += this.tab.row("<b>" + devices[key]["settings"]["position"] + ". " + devices[key]["settings"]["label"] + "</b>",button); }
			}

		set_temp   += this.tab.end();
		setting    += this.basic.container("setting_device_order",lang("CHANGE_ORDER_DEVICES"),set_temp,false);

        return setting;
    	}

    this.module_add_remotes     = function (direct_cmd="", direct_data="") {

		var setting   = "";
		var set_temp  = "";
		this.btn.width  = "120px";
		this.btn.height = "30px";

        // add scene
        var open_add_scene = false;
        if (direct_cmd == "add_scene") { open_add_scene = true; }

		set_temp  = this.tab.start();
		set_temp += this.tab.row( "ID:",            this.input("add_scene_id", "", "apiSceneAddCheckID(this);") );
		set_temp += this.tab.row( "Label:",         this.input("add_scene_label") );
		set_temp += this.tab.row( "Description:",   this.input("add_scene_descr") );
		set_temp += this.tab.row( "<center>" +
                    this.btn.sized(id="add_scene",label="Add Scene",style="","apiSceneAdd([#add_scene_id#,#add_scene_descr#,#add_scene_label#]);") +
                    "</center>", false);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_add_scene","Add scene",set_temp,open_add_scene);

        // add device
        var open_add_device = false;
        if (direct_cmd == "add_device" && direct_data != "") { set_temp = this.modules_add_remote_dialog(direct_data); open_add_device = true; }
        else                                                 { set_temp = this.modules_add_remote_dialog(); }

		setting  += this.basic.container("setting_add_device","Add device",set_temp,open_add_device);

		return setting;
        }

    this.modules_add_remote_dialog = function(device_data_start={}) {
		var setting        = "";
		var set_temp       = "";
		var onchange       = this.app_name + ".edit_filenames();";
		var onchange2      = this.app_name + ".edit_filenames";
		var add_command    = "apiDeviceAdd([#add_device_id#,#add_device_descr#,#add_device_label#,#add_device_api#,#add_device#,#add_device_device#,#add_device_remote#,#add_device_id_external#,#edit_image#],"+onchange2+");";
		add_command       += "remoteToggleEditMode(true);";
		var width          = this.input_width;
		var icon_container = "<button class='rm-button device_off small'><div id='device_edit_button_image'></div></button>";

		var device_data = {
		    "id": "",
		    "api_device": "",
		    "external_id": "",
		    "label": "",
		    "interface": "",
		    "device_name": ""
		}
		for (var key in device_data_start) { device_data[key] = device_data_start[key]; }

        var asterix = "<sup>*</sup>";
		this.input_width   = "150px";
        set_temp  = this.tab.start();
		set_temp += this.tab.row( "ID*:",                       this.input("add_device_id", onchange, onchange + "apiDeviceAddCheckID(this);", device_data["id"]) );
		set_temp += this.tab.row( "Device-Type:"+asterix,       this.input("add_device", onchange, onchange, device_data["device_name"]) );
        this.input_width = "180px";
		set_temp += this.tab.row( "Interface:"+asterix,         this.select("add_device_api","Select interface", this.data["CONFIG"]["apis"]["list_description"], onchange, device_data["api_device"]) );
		set_temp += this.tab.line();
		set_temp += this.tab.row( icon_container,               rm3remotes.button_image_select("edit_image") );
		set_temp += this.tab.row( "Label:"+asterix,             this.input("add_device_label", "", onchange, device_data["label"]) );
		set_temp += this.tab.row( "Description:",               this.input("add_device_descr", "", onchange, device_data["description"]) );
		set_temp += this.tab.row( "External ID:",               this.input("add_device_id_external", "", "", device_data["external_id"]) );
		set_temp += this.tab.line();
        this.input_width = "100px";
		set_temp += this.tab.row( "Device-Config:"+asterix,	    this.input("add_device_device")+".json" );
		set_temp += this.tab.row( "Remote-Config:"+asterix,	    this.input("add_device_remote")+".json" );
		set_temp += this.tab.end();

        this.input_width = width;

        set_temp += "<center>";
        set_temp += this.btn.sized(id="add_dev",label="Add Device",style="",add_command);
        set_temp += "</center>";
        return set_temp;

		appMsg.confirm(set_temp, add_command, 450);
		this.edit_filenames();
		}

	// write settings category
	this.write			        = function (nr,label="",text="") {

		var element 	= this.e_settings[nr];
		if (label != "") {
			var content 	= "<font class='remote_edit_headline'><center><b>" + label + "</b></center></font>"
                            + this.basic.edit_line()
                            + text
                            + "<br/>";
			}
		else if (text != "") { var content = text; }
		else { var content = ""; }

		setTextById(element,content);
		}

    this.settings_ext_reset     = function ()  {

        setTextById("setting_ext_frames", "");
        }

	this.settings_ext_append    = function (nr, label="", text="", style="") {
	    var frame_content = getTextById("setting_ext_frames");

		if (label != "") {
			text 	= "<font class='remote_edit_headline'><center><b>" + label + "</b></center></font>"
                    + this.basic.edit_line()
                    + text
                    + "<br/>";
			}

	    var device_frame = "<div id='device_frame" + nr + "' class='setting_bg' style='display:block;"+style+"'>";
        device_frame += text;
	    device_frame += "</div>";
	    setTextById("setting_ext_frames", frame_content + device_frame);
    	}
		
	this.is_filled			    = function (nr) {
		var element 	= this.e_settings[nr];
		if (element.innerHTML != "") { return true; }
		else                         { return false; }
		}

	this.show			        = function () {
	    this.active = true;
		for (var i=0; i<this.e_remotes.length; i++)  { elementHidden(this.e_remotes[i]);  }
		for (var i=0; i<this.e_settings.length; i++) { elementVisible(this.e_settings[i]); }

	    //elementVisible("frame1");
	    //elementVisible("frame2");
	    showRemoteInBackground(0);
	    }

	this.hide			        = function () {
	    this.active = false;
	    this.mode   = "";

		for (var i=0; i<this.e_remotes.length; i++)  { elementVisible(this.e_remotes[i]);  }
		for (var i=0; i<this.e_settings.length; i++) { elementHidden(this.e_settings[i]); }

		if (this.edit_mode)          { elementVisible("frame1"); elementVisible("frame2"); } //elementVisible("frame3"); }
		else                         { elementHidden("frame1");  elementHidden("frame2");  } //elementHidden("frame3"); }

        elementVisible("setting_frames");
        elementHidden("setting_ext_frames");
	    }

	this.onoff			        = function () {

        /*
		if (this.active) {
			//setNavTitle(this.header_title);
			
			show_settings = false;
			show_remotes  = true;
			this.active   = false;
			if (rm3remotes.active_type == "start") { showRemoteInBackground(1); }
			}
		else {
			this.header_title = getTextById("header_title");
			setNavTitle("Settings");
			
			show_settings = true;
			show_remotes  = false;
			this.active   = true;  
			//this.mode = "";
			this.create(); 
			showRemoteInBackground(0); 
			}

		for (var i=0; i<this.e_remotes.length; i++)  { changeVisibility(this.e_remotes[i],show_remotes);  }
		for (var i=0; i<this.e_settings.length; i++) { changeVisibility(this.e_settings[i],show_settings); }
        */

		/*
		if (this.edit_mode == true && show_remotes)         { elementVisible("frame1"); elementVisible("frame2"); } //elementVisible("frame3"); }
		else if (this.edit_mode == false && show_remotes)   { elementHidden("frame1");  elementHidden("frame2");  } //elementHidden("frame3"); }
		else if (show_settings)                             { elementHidden("frame1");  elementHidden("frame2"); elementHidden("frame3"); }
		*/
		}

    // show devices in containers
	this.edit_filenames	        = function () {

		replace_minus   = [" ","/","\\",":","&","#","?"];

		id      = document.getElementById("add_device_id").value;
		label   = document.getElementById("add_device_descr").value;
		api     = document.getElementById("add_device_api").value;
		device  = document.getElementById("add_device").value;

		device_file	 = device.toLowerCase();
		device_file  = device_file.replaceAll("_","-");
		//device_file += "_" + device.toLowerCase();

		for (var i=0;i<replace_minus.length;i++) { for (var j=0;j<5;j++) { device_file = device_file.replace(replace_minus[i], "-" ); } }

		remote_file  = device_file + "_" + id.toLowerCase();
		remote_file  = remote_file.replaceAll("_","-");

		document.getElementById("add_device_device").value = device_file;
		document.getElementById("add_device_remote").value = remote_file;
		}

	this.device_list		    = function (id,onchange="") {
		var list = {};
		for (var key in this.data["CONFIG"]["devices"]){
			list[key] = this.data["CONFIG"]["devices"][key]["settings"]["label"];
			}
		return this.select(id,"device",list,onchange);
		}

	this.interface_list		    = function () {
		var text = "<div id='setting_interface_list'>";
		for (var key in this.data["STATUS"]["interfaces"]["connect"]) {
			text += key + ":<br><div id='api_status_"+key+"'>";
			if (this.data["STATUS"]["interfaces"]["connect"][key] == "Connected")	{ text += "<font color='"+color_api_connect+"'>"; }
			else                                                                    { text += "<font color='"+color_api_error+"'>"; }
			text += this.data["STATUS"]["interfaces"]["connect"][key] + "</font></div>";
			}
		text += "</div>";
		return text;
		}
		
	this.interface_list_update	= function () {

		setTextById('setting_interface_list', this.interface_list());
		}

	this.exec_time_list		    = function () {
		var text = "<div id='setting_exec_time_list'>";
		for (var key in this.data["STATUS"]["request_time"]) {
			text += key + ": " + use_color((Math.round(dataAll["STATUS"]["request_time"][key]*1000)/1000) + "s<br/>", "VALUE");
			}
		text += "</div>";
		return text;
		}
		
	this.exec_time_list_update	= function () {

		setTextById('setting_exec_time_list', this.exec_time_list());
		}

	this.button_list		    = function (id,filter="") {
		var list = {};
		if (filter != "" && filter in this.data["CONFIG"]["devices"]) {
			for (var key in this.data["CONFIG"]["devices"][filter]["buttons"]){
				list[filter+"_"+key] = key;
				}
			}
		return this.select(id,"button",list);
		}

	this.button_list_change	    = function (id_filter, id_list, id_list_container) {
	        var filter_list = document.getElementById(id_filter);
	        var filter      = filter_list.options[filter_list.selectedIndex].value;
	        var list        = this.button_list( id_list, filter );
	        setTextById( id_list_container, list );
        	}

	this.device_list_status	    = function (id_filter, id_list_container) {
		var status      = "<br/>";
        var filter_list = document.getElementById(id_filter);
        var filter      = filter_list.options[filter_list.selectedIndex].value;
		for (var key in this.data["STATUS"]["devices"][filter]) {
			if (key == "power") {
				command_on    = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','ON'], '', '', '' );rm3settings.onoff();remoteInit();";
				command_off   = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','OFF'], '', '', '' );rm3settings.onoff();remoteInit();";
				status_value  = this.data["CONFIG"]["devices"][filter]["status"][key];
				if (status_value == "ON"){
				    command_link = "<div onclick=\""+command_off+"\" style=\"cursor:pointer\">" + key + ": <u>" + use_color("ON", "ON") + "</u></div>";
				    }
				else if (status_value == "OFF")	{
				    command_link = "<div onclick=\""+command_on +"\" style=\"cursor:pointer\">" + key + ": <u>" + use_color("OFF", "OFF") + "</u></div>";
				    }
				else {
				    command_link = key + ": " + use_color(status_value, "VALUE") + "</br>";
				    }
				status += command_link;
				}
			else if (key != "presets") {
				status += key + ": " + use_color(this.data["STATUS"]["devices"][filter][key], "VALUE") + "<br/>";
				}
			}
	        setTextById( id_list_container, status + "<br/>" );
		}

	// show button code in header if pressed button
	this.button_show		    = function (show="") {
	    if (show == "") {
            if (showButton)	{ showButton = false; }
            else			{ showButton = true; }
            }
        else {
            showButton = show;
            }
		}

	// deactivate buttons if device / scene is switched off
	this.button_deact		    = function (menu_entry=false) {
		if (deactivateButton) 	{ 
			deactivateButton = false;
			this.manual_mode = false;
			}
		else			{ 
			deactivateButton = true;
			this.manual_mode = true;
			}
		return;
		}

	// switch server connection between test and prod stage
	this.button_stage		    = function () {
		if (connect2stage == "Test")	{ connect2stage = "Prod"; appFW.appUrl = RESTurl_prod; }
		else				{ connect2stage = "Test"; appFW.appUrl = RESTurl_test; }

		remoteInit(false);	// reload data
		this.create();
		this.show();		// recreate settings page
		}

	this.input			        = function (id, onclick="", oninput="", value="") {
		
		text = "<input id=\"" + id + "\" oninput=\""+oninput+"\" style='width:" + this.input_width + ";margin:1px;' value='" + value + "'>";
		if (onclick != "") {
			text += "<button onclick=\""+onclick+"\" class='rm-button calculate_values'>&gt;&gt;</button>";
			}
			
		return text;
		}

	this.select			        = function (id, title, data, onchange="", value="") {
		var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
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
	}

//--------------------------------
// EOF
