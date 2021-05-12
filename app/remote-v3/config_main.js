//--------------------------------
// config menu and main functions
//--------------------------------

var app_frame_count   = 4;
var app_setting_count = 4;
var app_last_load     = 0;
var app_title         = "jc://remote/";
var app_version       = "v2.4.6";
var app_api_dir       = "api/";
var app_api_status    = "list";

//--------------------------------	
// create menu entries
//--------------------------------

function app_menu_entries() {
	var app_menu = [
		[lang("INDEX"),        "link", "/index_v3.html"],
		["App v2",             "link", "/index.html"],
		/*
		add your menu entries here
		*/
		["LINE"],
		[lang("SETTINGS"),      "script", "appMsg.alert('"+lang('NOT_IMPLEMENTED')+"');" ],
		];
/*
	// add additional menu elements if a condition is fulfilled
	if (app_admin_allowed) {
		app_menu = app_menu.concat([
		["LINE"],
		[lang("CAMERAS"),       "script", "birdhousePrint_load('CAMERAS','"+app_active_cam+"');"],
		[lang("TODAY_COMPLETE"),"script", "birdhousePrint_load('TODAY_COMPLETE','"+app_active_cam+"');"],
		["LINE"],
		[lang("SETTINGS"),      "script", "appMsg.alert('"+lang('NOT_IMPLEMENTED')+"');" ],
		]);
		}
*/
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
