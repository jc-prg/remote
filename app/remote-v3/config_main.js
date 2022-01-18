//--------------------------------
// config menu and main functions
//--------------------------------

var app_frame_count   = 5;
var app_frame_style   = "remote";
var app_setting_count = 5;
var app_setting_style = "setting_bg";
var app_last_load     = 0;
var app_title         = "jc://remote/";
var app_version       = "v2.7.5";
var app_api_dir       = "api/";
var app_api_status    = "list";
var app_loading_image = "";

//--------------------------------	
// create menu entries
//--------------------------------

function app_menu_entries() {
	var app_menu = [];
	return app_menu;
	}

//--------------------------------
// function to request status, update menu etc. (including initial load)
//--------------------------------

function app_status(data) {
	if (reload) { 
		//birdhousePrint(data=data, active_page=appActivePage, camera=app_active_cam);
		reload = false;
		}
	statusCheck(data);
	
	rm3remotes.init(  data );
	rm3settings.init( data );
	}
	
//--------------------------------
// add code when checked the status
//--------------------------------

function app_check_status(data) {
	}
	
//--------------------------------
// add code when menu icon is clicked
//--------------------------------

function app_click_menu() {
	}
	
//--------------------------------
// add code when forced a reload
//--------------------------------

function app_force_reload(data) {
	remoteReload(data);
	}
	
//--------------------------------
// add code when app starts
//--------------------------------

function app_initialize(data) {
	}

//--------------------------------
// add code when theme changed
//--------------------------------

function app_theme_changed(theme) {
	if (theme == "dark") {
		color_button_inactive 	= "#111111";
		//colors_power["ERROR"]	= "lightpink";		
		}
	else {
		color_button_inactive 	= "#666666";
		}
	}
	
//----------------------------------
// Theme detection and color settings
//----------------------------------
// color definitions: https://www.w3schools.com/cssref/css_colors.asp

var colors			= [ "red", "green", "darkgreen", "blue", "darkblue" ];
var colors_dev			= [];
var color_api_connect		= "lightgreen";
var color_api_error		= "#FF6666";
var color_button_inactive 	= "#666666";
var colors_power		= { 
				"ON"		: "darkgreen",
				"OFF"		: "darkred",
				"OTHER"	: "darkcyan",
				"ERROR"	: "blueviolet",
				}

// Standard-Definition für RemoteControl
//----------------------------------

var button_color = {};
var button_img = {};
var makro_def = {};
var device_status = {};
var remote_def = {};
var remote_mix_def = {};
var remote_std = [
              ".", ".", ".", "on-off",
              "LINE",
              "1", "2", "3", "vol+",
              "4", "5", "6", "mute",
              "7", "8", "9", "vol-",
              ".", "0", ".", ".",
              ];

//--------------------------------------
// status vars
//--------------------------------------

var show_error     = ""; // onClick=\"javascript:showErrorLog();\""; // not implemented any more
var status_green   = "<div id='green' "+show_error+"></div>";
var status_yellow  = "<div id='yellow' "+show_error+"></div>";
var status_gray    = "<div id='gray' "+show_error+"></div>";
var status_red     = "<div id='red' "+show_error+"></div>";

var status_mute    = "rec_mute"; // -> show in <nav-info id="audio2"> 	// changed based on server settings
var status_vol     = "rec_vol";  // -> show in <nav-info id="audio1"> 	// changed based on server settings
var status_vol_max = 74;         // -> calculate in percent		// changed based on server settings

var connect2stage    = "Prod";	// default stage to connect to (changed if rm3_test == true)
var showButtonTime   = 0.2;     // time to show LED when button pressed
var showButton       = false;   // default: show pressed button in headline
var deactivateButton = false;   // default: deactivate buttons if device is not ON


//--------------------------------------
//EOF
