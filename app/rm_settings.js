//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// settings page & functions
//--------------------------------


function rmSettings (name) {	// IN PROGRESS

	// preset vars
	this.data       = {};
	this.active     = false;
	this.app_name   = name;
	this.e_settings = ["setting1","setting2","setting3","setting4"];
	this.e_remotes  = ["remote1","remote2","remote3","remote_edit"];
	this.input_width= "110px";

	// init settings / set vars
	this.init = function(data) {
		// set data
		this.data = data;

		// check if test
		if (rm3_test) 	{this.test_info = "Test Stage";}
		else 		{this.test_info = "Prod Stage";}

		// status
		if (data)	{this.app_stat = data["STATUS"]["system"]["message"]; this.app_last = data["REQUEST"]["Button"];}
		else		{this.app_stat = "ERROR: no connection to server!";}
		}

	//------------------------------

	// write settings page
	this.create = function() {

		// Set Vars
		var setting;

		// Show Server Infos
		var main_audio = dataAll["CONFIG"]["main-audio"];  // get main audio device from file
		var audio_max  = "";
		if (dataAll["DATA"]["devices"][main_audio]["values"]) {
			audio_max  = dataAll["DATA"]["devices"][main_audio]["values"]["vol"]["max"];
			}
		var audio1     = "Power: "  + dataAll["DATA"]["devices"][main_audio]["status"]["power"] + " / "
		               + "Volume: " + dataAll["DATA"]["devices"][main_audio]["status"]["vol"] + " (" + audio_max + ")";
		var audio2     = dataAll["DATA"]["devices"][main_audio]["label"];
		var cookie     = rm3cookie.get("remote");

		setting  = this.tab_row( 	"Status:", 		this.app_stat );
		setting += this.tab_row( 	"Versions:",
						"App: " 		+ rm3version + " / " + this.test_info + " (" + rm3_rollout + ")<br/>" +
						"API: " 		+ this.data["API"]["version"] + " / " + this.data["API"]["stage"] + "<br/>" +
						"Modules: jcMsg " 	+ rm3msg.appVersion + " / jcApp " + rm3app.appVersion + "<br/>" +
						"Cookie: " 		+ cookie
						);
		setting += this.tab_row( 	"Button:", 		this.app_last );
		setting += this.tab_row( 	"Audio:",		 audio2 + "<br/>" + audio1 );
		setting += this.tab_row( 	"Window:", 		document.body.clientWidth + "x" + document.body.clientHeight );
		setting += this.tab_row(	"Interfaces:",		this.interface_list() );
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
						this.button("initRemote(false);" + this.app_name + ".show();", "reload") +
						this.button("window.open('" + RESTurl + "api/list/','_blank');", "REST API") +
						this.button("window.open('" + RESTurl + "api/ui/','_blank');",   "Swagger/UI") +
						this.button("rm3app.requestAPI('GET',['version','" + rm3version +"'], '', rm3msg.alertReturn,'wait');", "Check Updates")
					);
		setting += this.tab_row( 	"Reset:",
						this.button("rm3msg.confirm('" + q1 + "', 'loadRemote( [#reset#] );' );" , "Dev ON/OFF") +
						this.button("rm3msg.confirm('" + q1 + "', 'loadRemote( [#reset-audio#] );' );" , "Audio Level")
					);
		setting += this.tab_row( 	"Buttons:",
						this.button(this.app_name+".button_show();",  b_show ) +
						this.button(this.app_name+".button_deact();", b_deact )
					);
		setting += this.tab_row( 	"Test:",
						this.button("show_status('red',1);","LED red") +
						this.button("show_status('yellow',1);","LED yellow")
					);

		this.write(1,"Change Settings",setting);

		// Edit Remote Settings
		setting = "";
		setting += this.tab_row( 	"Device: &nbsp; &nbsp; &nbsp; " + this.input("add_device")     + "<br/>" +
		                                "Interface: &nbsp; "            + this.select("add_device_api","Select interface",this.data["CONFIG"]["interfaces"]) + "<br/>" +
						"Descript.: &nbsp; "            + this.input("add_device_descr"),
						this.button("addDevice('add_device','add_device_api','add_device_descr');","Add Device")
					);

		this.write(2,"Add Remote Control",setting);
		}

	// write settings category
	this.write = function(nr,label,text) {

		var element 	= this.e_settings[nr];
		var content 	= "<center><table width=\"100%\">"
				+ "<center><b>" + label + "</b></center><hr/>"
				+ text
				+ "</table></center>";

		setTextById(element,content);
		}

	//------------------------------

	this.show  = function() { if (this.active == false) { this.onoff(); showRemote(0); } }
	this.hide  = function() { if (this.active == true ) { this.onoff(); } }

	this.onoff = function() {

		if (this.active)	{ this.active = false; if (rm3remotes.active_type == "start") { showRemote(1); } }
		else			{ this.active = true;  this.create(); showRemote(0); }

		for (var i=0; i<this.e_remotes.length; i++)  { changeVisibility(this.e_remotes[i]);  }
		for (var i=0; i<this.e_settings.length; i++) { changeVisibility(this.e_settings[i]); }
		}

	//------------------------------

	this.device_list  = function (id,onchange="") {
		var list = {};
		for (var key in this.data["DATA"]["devices"]){
			list[key] = this.data["DATA"]["devices"][key]["label"];
			}
		return this.select(id,"device",list,onchange);
		}
		
	this.interface_list  = function () {
		var text = "";
		for (var key in this.data["STATUS"]["interfaces"]) {
			text += key + ": " + this.data["STATUS"]["interfaces"][key] + "<br/>";
			}
		return text;
		}

	this.button_list  = function (id,filter="") {
		var list = {};
		if (filter != "" && filter in this.data["DATA"]["devices"]) {
			for (var key in this.data["DATA"]["devices"][filter]["buttons"]){
				list[filter+"_"+key] = key;
				}
			}
		return this.select(id,"button",list);
		}

	this.button_list_change = function( id_filter, id_list, id_list_container) {
	        var filter_list = document.getElementById(id_filter);
	        var filter      = filter_list.options[filter_list.selectedIndex].value;
	        var list        = this.button_list( id_list, filter );
	        setTextById( id_list_container, list );
        	}

	this.device_list_status = function( id_filter, id_list_container) {
		var status = "<br/>";
	        var filter_list = document.getElementById(id_filter);
	        var filter      = filter_list.options[filter_list.selectedIndex].value;
		for (var key in this.data["DATA"]["devices"][filter]["status"]) {
			if (key != "presets") {
				status += key + ": " + this.data["DATA"]["devices"][filter]["status"][key] + "<br/>";
				}
			}
	        setTextById( id_list_container, status );
		}


	//------------------------------

	// show button code in header if pressed button
	this.button_show  = function () {
		if (showButton) { showButton = false; }
		else		{ showButton = true; }
		this.create();
		this.show();
		}

	// deactivate buttons if device / scene is switched off
	this.button_deact = function (menu_entry=false) {
		if (deactivateButton) 	{ deactivateButton = false; }
		else			{ deactivateButton = true; }
		if (menu_entry == false) {
			this.create();
			this.show();
			}
		else {
			initRemote(false);	// reload data
			}
		}

	// switch server connection between test and prod stage
	this.button_stage = function () {
		if (connect2stage == "Test")	{ connect2stage = "Prod"; rm3app.appUrl = RESTurl_prod; }
		else				{ connect2stage = "Test"; rm3app.appUrl = RESTurl_test; }

		initRemote(false);	// reload data
		this.create();
		this.show();		// recreate settings page
		}

	//------------------------------

	this.button  = function (onclick,label) { return "<button style=\"width:" + this.input_width + ";margin:1px;\" onClick=\"javascript:"+onclick+"\">"+label+"</button>"; }
	this.tab_row = function (td1,td2) 	{ return "<tr><td valign=\"top\">" + td1 + "</td><td>" + td2 + "</td></tr>"; }
	this.input   = function (id) 		{ return "<input id=\"" + id + "\" style='width:" + this.input_width + ";margin:1px;'>"; }

	this.select  = function (id,title,data,onchange="") {
		var item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
		item     += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
		for (var key in data) {
			if (key != "default") {
				item += "<option value=\"" + key + "\">" + data[key] + "</option>";
			}	}
		item     += "</select>";
		return item;
		}

	}


//--------------------------------
// EOF
