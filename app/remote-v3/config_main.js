//--------------------------------
// config menu and main functions
//--------------------------------

var app_frame_count             = 5;
var app_frame_style             = "remote";
var app_setting_count           = 6;
var app_setting_style           = "setting_bg";
var app_setting_style_header    = "setting_bg header";

var app_title                   = "jc://remote/";
var app_version                 = "v3.0.25";
var app_api_dir                 = "api/";
var app_api_status              = "list";

var app_loading_image           = "";
var app_status_commands         = "";
var appAutoLoad                 = false;


//--------------------------------	
// create menu entries
//--------------------------------

function app_menu_entries() {
	let app_menu = [];
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
        rmRemote.init(  data );
        rmSettings.init( data );
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

function app_force_reload(data) {}
	
//--------------------------------
// add code when app starts
//--------------------------------

function app_initialize(data) {}

//--------------------------------
// add code when theme changed
//--------------------------------

function app_theme_changed(theme) {
	if (theme === "dark") {
		color_button_inactive 	= "#111111";
		}
	else {
		color_button_inactive 	= "#666666";
		}
	}

//--------------------------------

var app_connection_error = true;

function app_connection_lost(error=false) {
    if (app_connection_error !== error) {
        if (error) {
            // code if lost connection
            statusCheck_offline(dataAll);
        }
        else {
            // code if got back connection
        }
    }
    app_connection_error = error;
}

//--------------------------------
// function to configure setting entries
//--------------------------------

function app_setting_entries() {
    // add your setting entries here
    // appSettings.add_entry(id, title, icon, call_function, show_header=true);
    // leave 'icon' empty to work just with text
    // leave 'call_function' empty to create an information tile that's not clickable

	/*
	 not in use for jc://remote/ -> rm_settings.js > RemoteSettings > index()
	 */
    }


//----------------------------------
// Theme detection and color settings
//----------------------------------
// color definitions: https://www.w3schools.com/cssref/css_colors.asp

var colors                  = [ "red", "green", "darkgreen", "blue", "darkblue" ];
var color_button_inactive 	= "#666666";
var colors_power            = {
				"ON"        : "var(--rm-color-signal-power-on)",
				"OFF"       : "var(--rm-color-signal-power-off)",
				"OTHER"	    : "var(--rm-color-signal-power-other)",
				"PARTLY"    : "var(--rm-color-signal-power-other)",
				"ERROR"	    : "var(--rm-color-signal-power-error)",
				}


// Standard-Definition für RemoteControl
//----------------------------------

var button_color = {};
var button_img = {};

//--------------------------------------
// status vars
//--------------------------------------

var show_error     = ""; // onClick=\"showErrorLog();\""; // not implemented any more

var connect2stage    = "Prod";	// default stage to connect to (changed if rm3_test == true)
var showButton       = false;   // default: show pressed button in headline
var deactivateButton = false;   // default: deactivate buttons if device is not ON


//--------------------------------------
//EOF

remote_scripts_loaded += 1;
