//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// settings page & functions
//--------------------------------
/* INDEX:
function rmSettings (name)
	this.init               = function (data)
	this.create             = function ()
	this.create_setting     = function ()
	this.create_edit        = function ()
	this.create_edit_FileNames 	= function ()
	this.write              = function (nr,label="",text="")
	this.is_filled		= function (nr)
	this.show               = function ()
	this.hide               = function ()
	this.onoff              = function ()
	this.display_json	  = function ( id, json, format="" )
	this.device_list        = function (id,onchange="")
	this.interface_list     = function ()
	this.interface_list_update = function ()
	this.exec_time_list     = function ()
	this.exec_time_list_update = function ()
	this.button_list        = function (id,filter="")
	this.button_list_change = function (id_filter, id_list, id_list_container)
	this.device_list_status = function (id_filter, id_list_container)
	this.button_show        = function ()
	this.button_deact       = function (menu_entry=false)
	this.button_stage       = function ()
	this.input              = function (id,onclick="",oninput="")
	this.select             = function (id,title,data,onchange="")
	this.remoteToggleEditMode = function ()
*/
//--------------------------------


function rmSettings (name) {	// IN PROGRESS

	// preset vars
	this.data         = {};
	this.active       = false;
	this.app_name     = name;
	this.e_settings   = ["setting1","setting2","setting3","setting4","setting5"]; 
	this.e_remotes    = ["frame3","frame4","frame5","frame1","frame2"];
	this.input_width  = "110px";
	this.initial_load = true;
	this.edit_mode    = false;
	this.mode         = "";
	
	this.logging      = new jcLogging(this.app_name);
	this.btn          = new rmRemoteButtons(name);			// rm_remotes-elements.js
	this.basic        = new rmRemoteBasic(name+".basic");		// rm_remotes-elements.js
	this.tab          = new rmRemoteTable(name+".tab");			// rm_remotes-elements.js
	
	// init settings / set vars
	this.init               = function (data) {
		// set data
		this.data = data;
		
		// status
		if (data)	{this.app_stat = data["STATUS"]["system"]["message"]; this.app_last = data["REQUEST"]["Button"];}
		else		{this.app_stat = "ERROR: no connection to server!";}

                if (this.initial_load) { 
			// check if test
			if (test) 	{this.test_info = "Test Stage";}
			else 		{this.test_info = "Prod Stage";}
			
                	this.inital_load = false;
                	this.logging.default("Initialized new class 'rmSettings'.");
                	}
                else {
                	this.logging.default("Reload data 'rmSettings'.");
                	}
		}

	//------------------------------

	// write settings page
	this.create             = function () {
	
		if (this.edit_mode && this.mode != "edit") 		{ this.create_edit();    this.mode = "edit"; }
		else if (!this.edit_mode && this.mode != "setting")	{ this.create_setting(); this.mode = "setting"; }
		else if (this.mode == "setting")			{ this.interface_list_update(); this.exec_time_list_update(); }
		}


	this.create_setting     = function () {
		// Set Vars
		var setting    = "";
		var set_temp   = "";

		// Show Server Infos
		var main_audio  = this.data["CONFIG"]["main-audio"];  // get main audio device from file
		var main_device = this.data["DATA"]["devices"][main_audio];
		var audio_max  = "";
		if (main_device["interface"]["values"] && main_device["interface"]["values"]["vol"]) {
			audio_max  = main_device["interface"]["values"]["vol"]["max"];
			}
		else {
			audio_max  = 100;
			this.logging.error("Max values not defined, set 100!");
			}
		var audio1     = "Power: "  + main_device["status"]["power"] + " / "
		               + "Volume: " + main_device["status"]["vol"] + " (" + audio_max + ")";
		var audio2     = main_device["settings"]["label"];
		var cookie     = appCookie.get("remote");

		setting  = this.tab.start();
		setting += this.tab.row( 	"Status:", 		this.app_stat );
		setting += this.tab.row( 	"Versions:",
						"App: " 		+ appVersion + " / " + this.test_info + " (" + rollout + ")<br/>" +
						"API: " 		+ this.data["API"]["version"] + " / " + this.data["API"]["rollout"] + "<br/>" +
						"Modules: jcMsg " 	+ appMsg.appVersion +  
						" / jcApp "		+ appFW.appVersion +
						" / jcAppFW "		+ appFwVersion +
						" / jcCookies "	+ appCookie.appVersion +  
						" / jcSlider "		+ rm3slider.appVersion );
		setting += this.tab.row( 	"Sources:", 		"<a href='https://github.com/jc-prg/remote/' style='color:white' target='_blank'>https://github.com/jc-prg/remote/</a>");
		setting += this.tab.row( 	"Cookie:", 		cookie );
		setting += this.tab.row( 	"Button:", 		this.app_last );
		setting += this.tab.row( 	"Audio:",		 audio2 + "<br/>" + audio1 );
		
		var d_width  = screen.width;
		var d_height = screen.height;
		setting += this.tab.row( 	"Device:", 		d_width + "x" + d_height );
		setting += this.tab.row( 	"Window:", 		document.body.clientWidth + "x" + document.body.clientHeight );
		setting += this.tab.row( 	"Screen:", 		
						"<div class='screen_default'>default screen</div>" + 
						"<div class='screen_big'>big screen</div>" + 
						"<div class='screen_iphone'>iPhone screen (portrait)</div>" + 
						"<div class='screen_iphone_landscape'>iPhone screen (landscape)</div>" + 
						"<div class='screen_ipad'>iPad screen (portrait)</div>" + 
						"<div class='screen_ipad_landscape'>iPad screen (landscape)</div>" + 
						"");	

		setting += this.tab.row(	"Position:",		"<div id='scrollPosition'>0 px</div>" );
		setting += this.tab.row( 	"Theme:", 		appTheme );
		setting += this.tab.row(	"Interfaces:",		this.interface_list() );
		setting += this.tab.row(	"Exec time:",          this.exec_time_list() );
		setting += this.tab.row( 	"Status:",
						this.device_list("select_dev_status", this.app_name+".device_list_status('select_dev_status','dev_status');") +
						"<span id='dev_status'>default</span>"
						);		
		setting += this.tab.end();
		
		this.write(0,lang("VERSION_AND_STATUS"),setting);


		// Edit Server Settings
		var q1   = lang("RESET_SWITCH_OFF");
		var q2   = lang("RESET_VOLUME_TO_ZERO");

		if (showButton)       { b_show  = "show code"; } else { b_show  = "hide code"; }
		if (deactivateButton) { b_deact = "allways enabled"; }  else { b_deact = "enabled if ON"; }

		this.btn.height = "30px";
		this.btn.width  = "120px";

		// Relaod & Updates
		setting   = "";
		set_temp  = this.tab.start();
		set_temp += this.tab.row(	"<center>" +
						this.btn.sized("set01","reload (scroll)","","appForceReload(true);") + "&nbsp;" +
						this.btn.sized("set02","check updates","","appFW.requestAPI(#GET#,[#version#,#" + appVersion +"#], ##, appMsg.alertReturn,#wait#);") +
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

		// button behavior
		set_temp  = this.tab.start();
		set_temp += this.tab.row(	"<center>" +
						this.btn.sized("set31",b_show, "",this.app_name+".button_show();") + "&nbsp;" +
						this.btn.sized("set32",b_deact,"",this.app_name+".button_deact();") + "&nbsp;" +
						"</center>"
					);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_buttons","Button behavior",set_temp,false);

		// button color codes
		var buttons = "";
		for (var key in colors_power) {
			buttons += "<button class='button' style='background-color:"+colors_power[key]+";width:100px;'>"+key+"</button>";
			}

		set_temp  = this.tab.start();
		set_temp += this.tab.row( buttons );
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_colorcodes","Button color codes",set_temp,false);

		this.write(1,"Server &amp; Client Settings",setting);
		this.write(2);
		this.write(3);
		}

	//------------------------------

	this.create_edit        = function () {
	
		var onchange  = this.app_name + ".create_edit_FileNames()";
		var onchange2 = this.app_name + ".create_edit_FileNames";
		
		// Change Order of Scenes or Devices			
		var setting  = "";
		var set_temp = this.tab.start(); 	

		var devices  = this.data["DATA"]["devices"];
		var scenes   = this.data["DATA"]["scenes"];
		
		this.logging.default(scenes);

		this.btn.width  = "30px";
		this.btn.height = "30px";		

		for (var key in scenes) { scenes[key]["position"] = scenes[key]["settings"]["position"]; this.logging.default(key);}		 
		var order  = sortDict(scenes,"position");
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";			
			var visible = scenes[key]["settings"]["visible"];

			if (i > 0)			{ button += this.btn.sized(id="mv_sce_"+i,label="<b>&uarr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#scene#,#"+key+"#,#-1#);",disabled=""); }
			else				{ button += this.btn.sized(id="mv_sce_"+i,label="",             style="updown",script_apiCommandSend="",disabled="disabled"); }
			if (i < order.length-1)	{ button += this.btn.sized(id="mv_sce_"+i,label="<b>&darr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#scene#,#"+key+"#,#1#);",disabled=""); }
			
			if (visible == "no")    	{ set_temp += this.tab.row("<i>" + scenes[key]["position"] + ". " + scenes[key]["settings"]["label"] + "</i>",button); }
			else                    	{ set_temp += this.tab.row("<b>" + scenes[key]["position"] + ". " + scenes[key]["settings"]["label"] + "</b>",button); }
			}

		set_temp   += this.tab.end();
		setting    += this.basic.container("setting_scene_order",lang("CHANGE_ORDER_SCENES"),set_temp,false); 
		set_temp    = this.tab.start(); 	
	
		this.logging.default(devices);
		for (var key in devices) { devices[key]["position"] = devices[key]["settings"]["position"]; this.logging.default(key); }
		var order  = sortDict(devices,"position");
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";			
			var visible = this.data["DATA"]["devices"][key]["settings"]["visible"];
						
			if (i > 0)			{ button += this.btn.sized(id="mv_dev_"+i,label="<b>&uarr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#device#,#"+key+"#,#-1#);",disabled=""); }
			else				{ button += this.btn.sized(id="mv_dev_"+i,label="",             style="updown",script_apiCommandSend="",disabled="disabled"); }
			if (i < order.length-1)	{ button += this.btn.sized(id="mv_dev_"+i,label="<b>&darr;</b>",style="updown",script_apiCommandSend="apiDeviceMovePosition_exe(#device#,#"+key+"#,#1#);",disabled=""); }
			
			if (visible == "no")		{ set_temp += this.tab.row("<i>" + this.data["DATA"]["devices"][key]["position"] + ". " + this.data["DATA"]["devices"][key]["settings"]["label"] + "</i>",button); }
			else				{ set_temp += this.tab.row("<b>" + this.data["DATA"]["devices"][key]["position"] + ". " + this.data["DATA"]["devices"][key]["settings"]["label"] + "</b>",button); }		
			}
		
		set_temp   += this.tab.end();
		setting    += this.basic.container("setting_device_order",lang("CHANGE_ORDER_DEVICES"),set_temp,false); 

		this.write(1,lang("CHANGE_ORDER"),setting);

		// Edit Remote Settings
		setting   = "";
		this.btn.width  = "120px";		
		this.btn.height = "30px";		

		set_temp  = this.tab.start();
		set_temp += this.tab.row( "ID:",  		this.input("add_device_id") );
		set_temp += this.tab.row( "Label:", 		this.input("add_device_descr") );
		set_temp += this.tab.row( "Interface:",  	this.select("add_device_api","Select interface",this.data["CONFIG"]["interfaces"]) );
		set_temp += this.tab.row( "Device Name:",	this.input("add_device",onchange,onchange) );
		set_temp += this.tab.line();
		set_temp += this.tab.row( "Device-Config:",	this.input("add_device_device")+".json" );
		set_temp += this.tab.row( "Remote-Config:",	this.input("add_device_remote")+".json" );
		set_temp += this.tab.row( "<center>" +
					   this.btn.sized(id="add_dev",label="Add Device",style="","apiDeviceAdd([#add_device_id#,#add_device_descr#,#add_device_api#,#add_device#,#add_device_device#,#add_device_remote#],"+onchange2+");") +
					   "</center>", false);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_add_device","Add device",set_temp,false); 

		set_temp  = this.tab.start();
		set_temp += this.tab.row( "ID:",  	this.input("add_scene_id") );
		set_temp += this.tab.row( "Label:", 	this.input("add_scene_label") );
		set_temp += this.tab.row( "Description:", this.input("add_scene_descr") );
		set_temp += this.tab.row( "<center>" +
					   this.btn.sized(id="add_scene",label="Add Scene",style="","apiSceneAdd([#add_scene_id#,#add_scene_descr#,#add_scene_label#]);") +
					   "</center>", false);
		set_temp += this.tab.end();
		setting  += this.basic.container("setting_add_scene","Add scene",set_temp,false); 

		this.write(0,lang("REMOTE_ADD"),setting);					


		// Edit Makros 01		
		setting   = "";
		setting  += this.basic.container("setting_makros1","JSON makros [general]",		this.display_json("makro", this.data["DATA"]["makros"]["makro"], "makros"),false); 
		setting  += this.basic.container("setting_makros2","JSON makros [device ON]",	this.display_json("dev-on", this.data["DATA"]["makros"]["dev-on"], "makros"),false); 
		setting  += this.basic.container("setting_makros3","JSON makros [device OFF]",	this.display_json("dev-off", this.data["DATA"]["makros"]["dev-off"], "makros"),false); 
		setting  += this.basic.container("setting_makros4","JSON makros [scene ON]",		this.display_json("scene-on", this.data["DATA"]["makros"]["scene-on"], "makros"),false); 
		setting  += this.basic.container("setting_makros5","JSON makros [scene OFF]",	this.display_json("scene-off", this.data["DATA"]["makros"]["scene-off"], "makros"),false); 

		setting  += this.basic.container("setting_makros_manual","JSON makros - manual",lang("MANUAL_MAKROS"),false); 

		setting  += "<center><br/><br/>";
		setting  += this.btn.sized("apiMakroChange(['makro','scene-on','scene-off','dev-on','dev-off']);","Save","");
		setting  += "</center>";

		this.write(2,"Change Makros",setting);
		}


	this.create_edit_FileNames 	= function () {
	
		replace_minus   = [" ","/","\\",":","&","#","?"];
		
		label		= document.getElementById("add_device_descr").value;
		api		= document.getElementById("add_device_api").value;
		device		= document.getElementById("add_device").value;

		device_file	 = label.toLowerCase();
		device_file     += "_" + device.toLowerCase();	
		
		for (var i=0;i<replace_minus.length;i++) { for (var j=0;j<5;j++) { device_file = device_file.replace(replace_minus[i], "-" ); } }

		remote_file      = device_file + "_" + api.toLowerCase();				
		
		document.getElementById("add_device_device").value = device_file;
		document.getElementById("add_device_remote").value = remote_file;
		}

	//------------------------------

	// write settings category
	this.write              = function (nr,label="",text="") {

		var element 	= this.e_settings[nr];
		if (label != "") {
			var content 	= "<center><b>" + label + "</b></center>"
					+ this.basic.edit_line()
					+ text
					+ "<br/>";
			}
		else { var content = ""; }

		setTextById(element,content);
		}
		
	this.is_filled		= function (nr) {
		var element 	= this.e_settings[nr];
		if (element.innerHTML != "")	{ return true; }
		else				{ return false; }
		}

	//------------------------------
	this.show               = function () { if (this.active == false) { this.onoff(); showRemoteInBackground(0); } }
	this.hide               = function () { if (this.active == true ) { this.onoff(); } }

	this.onoff              = function () {

		if (this.active)	{ 
			show_settings = false;
			show_remotes  = true;
			this.active   = false;
			if (rm3remotes.active_type == "start") { showRemoteInBackground(1); }
			}
		else			{ 
			show_settings = true;
			show_remotes  = false;
			this.active   = true;  
			this.mode = ""; 
			this.create(); 
			showRemoteInBackground(0); 
			}

		for (var i=0; i<this.e_remotes.length; i++)  { changeVisibility(this.e_remotes[i],show_remotes);  }
		for (var i=0; i<this.e_settings.length; i++) { changeVisibility(this.e_settings[i],show_settings); }
		
		if (this.edit_mode == true && show_remotes)   	{ elementVisible("frame1"); elementVisible("frame2"); } //elementVisible("frame3"); }
		else if (this.edit_mode == false && show_remotes)	{ elementHidden("frame1");  elementHidden("frame2");  } //elementHidden("frame3"); }
		else if (show_settings)				{ elementHidden("frame1");  elementHidden("frame2"); elementHidden("frame3"); }
		}

	//------------------------------
        // show json for buttons in text field
	this.display_json	  = function ( id, json, format="" ) {
        
        	var text = "";
        	text += "<center><textarea id=\""+id+"\" name=\""+id+"\" style=\"width:320px;height:160px;\">";
		if (format == "makros") {
        		json = JSON.stringify(json);
        		json = json.replace( /],/g, "],\n\n" );
        		json = json.replace( /:/g, ":\n   " );
        		json = json.replace( /,/g, ", " );
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

	this.device_list        = function (id,onchange="") {
		var list = {};
		for (var key in this.data["DATA"]["devices"]){
			list[key] = this.data["DATA"]["devices"][key]["settings"]["label"];
			}
		return this.select(id,"device",list,onchange);
		}

	this.interface_list     = function () {
		var text = "<div id='setting_interface_list'>";
		for (var key in this.data["STATUS"]["interfaces"]) {
			text += key + ":<br><div id='api_status_"+key+"'>";
			if (this.data["STATUS"]["interfaces"][key] == "Connected")	{ text += "<font color='"+color_api_connect+"'>"; }
			else								{ text += "<font color='"+color_api_error+"'>"; }
			text += this.data["STATUS"]["interfaces"][key] + "</font></div>";
			}
		text += "</div>";
		return text;
		}
		
	this.interface_list_update = function () {
		document.getElementById('setting_interface_list').innerHTML = this.interface_list();
		}

	this.exec_time_list     = function () {
		var text = "<div id='setting_exec_time_list'>";
		for (var key in this.data["STATUS"]["request_time"]) {
			text += key + ": " + (Math.round(this.data["STATUS"]["request_time"][key]*1000)/1000) + "s<br/>";
			}
		text += "</div>";
		return text;
		}
		
	this.exec_time_list_update = function () {
		document.getElementById('setting_exec_time_list').innerHTML = this.exec_time_list();
		}

	this.button_list        = function (id,filter="") {
		var list = {};
		if (filter != "" && filter in this.data["DATA"]["devices"]) {
			for (var key in this.data["DATA"]["devices"][filter]["buttons"]){
				list[filter+"_"+key] = key;
				}
			}
		return this.select(id,"button",list);
		}

	this.button_list_change = function (id_filter, id_list, id_list_container) {
	        var filter_list = document.getElementById(id_filter);
	        var filter      = filter_list.options[filter_list.selectedIndex].value;
	        var list        = this.button_list( id_list, filter );
	        setTextById( id_list_container, list );
        	}

	this.device_list_status = function (id_filter, id_list_container) {
		var status = "<br/>";
	        var filter_list = document.getElementById(id_filter);
	        var filter      = filter_list.options[filter_list.selectedIndex].value;
		for (var key in this.data["DATA"]["devices"][filter]["status"]) {
			if (key == "power") {
				command_on    = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','ON'], '', '', '' );rm3settings.onoff();remoteInit();";
				command_off   = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','OFF'], '', '', '' );rm3settings.onoff();remoteInit();";
				status_value  = this.data["DATA"]["devices"][filter]["status"][key];
				if (status_value == "ON")	{ command_link = "<div onclick=\""+command_off+"\" style=\"cursor:pointer\">"+key+": <u>ON</u></div>"; }
				else if (status_value == "OFF")	{ command_link = "<div onclick=\""+command_on +"\" style=\"cursor:pointer\">"+key+": <u>OFF</u></div>"; }
				else				{ command_link = key + ": " + status_value + "</br>"; }
				status += command_link;
				}
			else if (key != "presets") {
				status += key + ": " + this.data["DATA"]["devices"][filter]["status"][key] + "<br/>";
				}
			}
	        setTextById( id_list_container, status );
		}


	//------------------------------

	// show button code in header if pressed button

	this.button_show        = function () {
		if (showButton)	{ showButton = false; }
		else			{ showButton = true; }
		this.create();
		this.show();
		}

	// deactivate buttons if device / scene is switched off
	this.button_deact       = function (menu_entry=false) {
		if (deactivateButton) 	{ deactivateButton = false; }
		else			{ deactivateButton = true; }
		if (menu_entry == false) {
			this.create();
			this.show();
			}
		else {
			remoteInit(false);	// reload data
			}
		}

	// switch server connection between test and prod stage
	this.button_stage       = function () {
		if (connect2stage == "Test")	{ connect2stage = "Prod"; appFW.appUrl = RESTurl_prod; }
		else				{ connect2stage = "Test"; appFW.appUrl = RESTurl_test; }

		remoteInit(false);	// reload data
		this.create();
		this.show();		// recreate settings page
		}

	//------------------------------	
	this.input              = function (id,onclick="",oninput="") { 
		
		text = "<input id=\"" + id + "\" oninput=\""+oninput+"\" style='width:" + this.input_width + ";margin:1px;'>"; 
		if (onclick != "") {
			text += "&nbsp;<button onclick=\""+onclick+"\">&gt;&gt;</button>";
			}
			
		return text;
		}
		

	this.select             = function (id,title,data,onchange="") {
		var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
		item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
		for (var key in data) {
			if (key != "default") {
				item += "<option value=\"" + key + "\">" + data[key] + "</option>";
			}	}
		item     += "</select>";
		return item;
		}

	// show hide edit mode for remotes
	this.remoteToggleEditMode = function () {
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		
		this.create();
		}	
	}

//--------------------------------
// EOF
