//--------------------------------
// config menu and main functions
//--------------------------------

var app_frame_count   = 5;
var app_frame_style   = "remote";
var app_setting_count = 6;
var app_setting_style = "setting_bg";
var app_last_load     = 0;
var app_title         = "jc://remote/";
var app_version       = "v2.9.7";
var app_api_dir       = "api/";
var app_api_status    = "list";

var app_loading_image   = "";
var app_status_commands = "";
var appAutoLoad         = false;

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
	if (data["CONFIG"]) {
        statusCheck(data);
        rm3remotes.init(  data );
        rm3settings.init( data );
        }
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

//--------------------------------

var app_connection_error = true;
function app_connection_lost(error=false) {
    if (app_connection_error != error) {
        if (error) {
            // code if lost connection
        }
        else {
            // code if got back connection
        }
    }
    app_connection_error = error;
}

//----------------------------------
// Theme detection and color settings
//----------------------------------
// color definitions: https://www.w3schools.com/cssref/css_colors.asp

var colors                  = [ "red", "green", "darkgreen", "blue", "darkblue" ];
var colors_dev              = [];
var color_api_connect       = "lightgreen";
var color_api_no_connect    = "";
var color_api_warning       = "yellow";
var color_api_error         = "#FF6666";
var color_button_inactive 	= "#666666";
var colors_power            = {
				"ON"        : "darkgreen",
				"OFF"       : "darkred",
				"OTHER"	    : "darkcyan",
				"ERROR"	    : "blueviolet",
				}
var function_colors         = {
                "ON"        : "#33FF33",
                "OFF"       : "FF3333",
                "ERROR"     : "FF3333",
                "VALUE"     : "#66FFFF"
                }

var sign_ok       = "&#10003;";       // &#9745;
var sign_error    = "&#10008;";       // &#9746;
var sign_off      = "&nbsp;<small>OFF</small>"; // "&#9744;";
var sign_disabled = "&nbsp;<small>DISABLED</small>"; // "&#9744;";
var sign_start    = "&#10138;";

// Standard-Definition für RemoteControl
//----------------------------------

var button_color = {};
var button_img = {};
var macro_def = {};
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
