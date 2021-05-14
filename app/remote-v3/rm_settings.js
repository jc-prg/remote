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
	this.write              = function (nr,label,text)
	this.is_filled		= function (nr)
	this.show               = function ()
	this.hide               = function ()
	this.onoff              = function ()
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
	this.button             = function (onclick,label,disabled="")
	this.button_small       = function (onclick,label,disabled="")
	this.tab_row            = function (td1,td2)
	this.input              = function (id,onclick="")
	this.select             = function (id,title,data,onchange="")
	this.remoteToggleEditMode = function ()
*/
//--------------------------------


function rmSettings (name) {	// IN PROGRESS

	// preset vars
	this.data         = {};
	this.active       = false;
	this.app_name     = name;
	this.e_settings   = ["setting1","setting2","setting3","setting4"]; 
	this.e_remotes    = ["frame3","frame4","frame5","frame1","frame2"];
	this.input_width  = "110px";
	this.initial_load = true;
	this.edit_mode    = false;
	this.mode         = "";

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
                	console.log("Initialized new class 'rmSettings'.");
                	}
                else {
                	console.log("Reload data 'rmSettings'.");
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

		// Show Server Infos
		var main_audio = this.data["CONFIG"]["main-audio"];  // get main audio device from file
		var audio_max  = "";
		if (this.data["DATA"]["devices"][main_audio]["values"]) {
			audio_max  = this.data["DATA"]["devices"][main_audio]["values"]["vol"]["max"];
			}
		var audio1     = "Power: "  + this.data["DATA"]["devices"][main_audio]["status"]["power"] + " / "
		               + "Volume: " + this.data["DATA"]["devices"][main_audio]["status"]["vol"] + " (" + audio_max + ")";
		var audio2     = this.data["DATA"]["devices"][main_audio]["label"];
		var cookie     = appCookie.get("remote");

		setting  = this.tab_row( 	"Status:", 		this.app_stat );
		setting += this.tab_row( 	"Versions:",
						"App: " 		+ appVersion + " / " + this.test_info + " (" + rollout + ")<br/>" +
						"API: " 		+ this.data["API"]["version"] + " / " + this.data["API"]["rollout"] + "<br/>" +
						"Modules: jcMsg " 	+ appMsg.appVersion +  
						" / jcApp "		+ appFW.appVersion +
						" / jcSlider "		+ rm3slider.appVersion );
		setting += this.tab_row( 	"Cookie:", 		cookie );
		setting += this.tab_row( 	"Button:", 		this.app_last );
		setting += this.tab_row( 	"Audio:",		 audio2 + "<br/>" + audio1 );
		setting += this.tab_row( 	"Window:", 		document.body.clientWidth + "x" + document.body.clientHeight );
		setting += this.tab_row(	"Position:",		"<div id='scrollPosition'>0 px</div>" );
		setting += this.tab_row( 	"Theme:", 		theme );
		setting += this.tab_row(	"Interfaces:",		this.interface_list() );
		setting += this.tab_row(	"Exec time:",          this.exec_time_list() );
		setting += this.tab_row( 	"Status:",
						this.device_list("select_dev_status", this.app_name+".device_list_status('select_dev_status','dev_status');") +
						"<span id='dev_status'></span>"
						);

		this.write(0,"Version and Status Information",setting);

		// Edit Server Settings
		var q1   = "Reset Devices:<br/>vorher alle Geräte ausschalten.";
		var q2   = "Reset Audio Settings:<br/>vorher alle Receiver mit Audio auf Mininum (0) einstellen.";

		if (showButton)       { b_show  = "show code"; } else { b_show  = "hide code"; }
		if (deactivateButton) { b_deact = "allways enabled"; }  else { b_deact = "enabled if ON"; }

		setting  = this.tab_row( 	"Server:",
						//this.button("remoteInit(false);" + this.app_name + ".show();", "reload") +
						this.button("window.open('" + RESTurl + "api/reload/','_blank');", "reload (API)") +
						this.button("appForceReload(true);", "reload (Scroll)") +
						this.button("window.open('" + RESTurl + "api/list/','_blank');", "REST API") +
						this.button("window.open('" + RESTurl + "api/ui/','_blank');",   "Swagger/UI") +
						this.button("appFW.requestAPI('GET',['version','" + appVersion +"'], '', appMsg.alertReturn,'wait');", "Check Updates")
					);
		setting += this.tab_row( 	"Reset:",
						this.button("appMsg.confirm('" + q1 + "', 'appFW.requestAPI(#GET#,[#reset#],##,apiAlertReturn );' );" , "Dev ON/OFF") +
						this.button("appMsg.confirm('" + q2 + "', 'appFW.requestAPI(#GET#,[#reset-audio#],##,apiAlertReturn );' );" , "Audio Level")
					);
		setting += this.tab_row( 	"Buttons:",
						this.button(this.app_name+".button_show();",  b_show ) +
						this.button(this.app_name+".button_deact();", b_deact )
					);

		this.write(1,"Change Settings",setting);
		}

	//------------------------------

	this.create_edit        = function () {
	
		var onchange  = this.app_name + ".create_edit_FileNames()";
		var onchange2 = this.app_name + ".create_edit_FileNames";
		
		// Edit Remote Settings
		setting = "";
		setting += this.tab_row( 	"ID:",  	this.input("add_device_id") );
		setting += this.tab_row( 	"Label:", 	this.input("add_device_descr") );
		setting += this.tab_row( 	"Interface:",   this.select("add_device_api","Select interface",this.data["CONFIG"]["interfaces"]) );
		setting += this.tab_row( 	"Device Name:",	this.input("add_device",onchange) );
		setting += "<tr><td colspan='2'><hr/></td></tr>";
		setting += this.tab_row( 	"Device-Config:",	this.input("add_device_device")+".json" );
		setting += this.tab_row( 	"Remote-Config:",	this.input("add_device_remote")+".json" );
		setting += this.tab_row(	this.button("apiDeviceAdd(['add_device_id','add_device_descr','add_device_api','add_device','add_device_device','add_device_remote'],"+onchange2+");","Add Device"), "" );
//		setting += this.tab_row(	this.button("apiDeviceAdd(['add_device_id','add_device_descr','add_device_api','add_device','add_device_device','add_device_remote']);","Add Device"), "" );

		setting += "<tr><td colspan='2'><center><hr/><b>"+lang("REMOTE_ADD")+" (Scene)</b><hr/></center></td></tr>";
	
		setting += this.tab_row( 	"ID:",  	this.input("add_scene_id") );
		setting += this.tab_row( 	"Label:", 	this.input("add_scene_label") );
		setting += this.tab_row( 	"Description:", this.input("add_scene_descr") );
		setting += this.tab_row(	this.button("apiSceneAdd(['add_scene_id','add_scene_label','add_scene_descr']);","Add Scene",""), "" );

		this.write(0,lang("REMOTE_ADD")+" (Device)",setting);					
			
		setting = "";	
		var order  = sortDict(this.data["DATA"]["devices"],"position");
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";			
			var visible = this.data["DATA"]["devices"][key]["visible"];
			
			if (i > 0)  		{ button += this.button_small("apiDeviceMovePosition_exe(#device#,#"+key+"#,#-1#);","up"); }
			if (i < order.length-1)	{ button += this.button_small("apiDeviceMovePosition_exe(#device#,#"+key+"#,#1#);","down"); }
			
			if (visible == "no")    { setting += this.tab_row("<i>" + this.data["DATA"]["devices"][key]["position"] + ". " + this.data["DATA"]["devices"][key]["label"] + "</i>",button); }
			else                    { setting += this.tab_row("<b>" + this.data["DATA"]["devices"][key]["position"] + ". " + this.data["DATA"]["devices"][key]["label"] + "</b>",button); }		
			}
			
		setting += "</table>"
			 + "<hr><center><b>Change Order of Scenes</b></center><hr/>"
			 + "<table width=\"100%\">";
			 
		order  = sortDict(this.data["DATA"]["scenes"],"position");
		for (var i=0;i<order.length;i++) {
			var key     = order[i];
			var button  = "";			
			var visible = this.data["DATA"]["scenes"][key]["visible"];

			if (i > 0)  		{ button += this.button_small("apiDeviceMovePosition_exe(#scene#,#"+key+"#,#-1#);"+this.app_name+".mode = '';","up"); }
			if (i < order.length-1)	{ button += this.button_small("apiDeviceMovePosition_exe(#scene#,#"+key+"#,#1#);"+this.app_name+".mode = '';","down"); }
			
			if (visible == "no")    { setting += this.tab_row("<i>" + this.data["DATA"]["scenes"][key]["position"] + ". " + this.data["DATA"]["scenes"][key]["label"] + "</i>",button); }
			else                    { setting += this.tab_row("<b>" + this.data["DATA"]["scenes"][key]["position"] + ". " + this.data["DATA"]["scenes"][key]["label"] + "</b>",button); }
			}

		this.write(1,"Change Order of Devices",setting);
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
	this.write              = function (nr,label,text) {

		var element 	= this.e_settings[nr];
		var content 	= "<center><table width=\"100%\">"
				+ "<center><b>" + label + "</b></center><hr/>"
				+ text
				+ "</table></center>";
		if (label == "" && text == "") { content = ""; }

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
		
		if (this.edit_mode == true && show_remotes)   	{ elementVisible("frame1"); elementVisible("frame2"); }
		else if (this.edit_mode == false && show_remotes)	{ elementHidden("frame1");  elementHidden("frame2"); }
		else if (show_settings)				{ elementHidden("frame1");  elementHidden("frame2"); }
		}

	//------------------------------
	this.device_list        = function (id,onchange="") {
		var list = {};
		for (var key in this.data["DATA"]["devices"]){
			list[key] = this.data["DATA"]["devices"][key]["label"];
			}
		return this.select(id,"device",list,onchange);
		}

	this.interface_list     = function () {
		var text = "<div id='setting_interface_list'>";
		for (var key in this.data["STATUS"]["interfaces"]) {
			text += key + ": " + this.data["STATUS"]["interfaces"][key] + "<br/>";
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
		if (showButton) { showButton = false; }
		else		{ showButton = true; }
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
	this.button             = function (onclick,label,disabled="")	{ 
		onclick = onclick.replace(/#/g,"'"); 
        	if (disabled == "disabled") { style = "background-color:gray;"; } else { style = ""; }
		return "<button style=\"" + style + "width:"+ this.input_width + ";margin:1px;\" onClick=\"javascript:"+onclick+"\" "+disabled+">"+label+"</button>"; 
		}
		
	this.button_small       = function (onclick,label,disabled="")	{ 
		onclick = onclick.replace(/#/g,"'"); 
        	if (disabled == "disabled") { style = "background-color:gray;"; } else { style = ""; }
        	return "<button style=\"" + style + "width:"+ this.input_width + ";margin:1px;width:60px;\" onClick=\"javascript:"+onclick+"\"  "+disabled+">"+label+"</button>";
		}
	
	this.tab_row            = function (td1,td2) 	{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
	this.input              = function (id,onclick="") { 

		text = "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;'>"; 
		
		if (onclick != "") {
			text += "&nbsp;<button onclick=\""+onclick+"\">&gt;&gt;</button>";


			//const inputChange = document.querySelector(id);
			//const new_input   = document.getElementById("add_device_device");
			//inputChange.addEventListener(id,input2);
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
		}	
	}

//--------------------------------
// EOF
