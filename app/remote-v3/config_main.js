//--------------------------------
// config menu and main functions
//--------------------------------

var app_frame_count   = 5;
var app_frame_style   = "remote";
var app_setting_count = 4;
var app_setting_style = "setting_bg";
var app_last_load     = 0;
var app_title         = "jc://remote/";
var app_version       = "v2.5.3";
var app_api_dir       = "api/";
var app_api_status    = "list";

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
	}
	
//--------------------------------
// add code when checked the status
//--------------------------------

function app_check_status() {
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

//----------------------------------
// Theme detection and color settings
//----------------------------------
// color definitions: https://www.w3schools.com/cssref/css_colors.asp

var colors			= [ "red", "green", "darkgreen", "blue", "darkblue" ];
var colors_dev			= [];
var color_button_inactive 	= "#666666";
var colors_power		= { 
				"ON"		: "darkgreen",
				"OFF"		: "darkred",
				"OTHER"	: "purple",
				"ERROR"	: "orangered",
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
// check theme (if dark scheme)
//--------------------------------------

var theme = "default";

function check_theme() {
	old_theme	= theme;
	element	= document.getElementById("theme_check");
	style		= window.getComputedStyle(element)["background-color"];
	
	if (style == "rgb(255, 255, 255)")	{ theme = "default"; }
	else					{ theme = "dark"; }
	if (old_theme != theme)			{ console.log("Change theme to: "+theme); }
	
	if (theme == "dark") {
		color_button_inactive 	= "#111111";
		//colors_power["ERROR"]	= "lightpink";		
		}
	}

//--------------------------------------
//EOF
