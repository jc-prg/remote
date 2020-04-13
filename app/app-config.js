//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// main configuration file, check rm_config_stage.js also
//--------------------------------
/* INDEX:
function check_theme()
*/
//--------------------------------

// REST API configuration

var RESTip         = location.host; var ip = RESTip.split(":");
var RESTurl_test   = "http://"+ip[0]+":5003/";
var RESTurl_prod   = "http://"+ip[0]+":5002/";
var RESTurl        = "http://"+ip[0]+":"+stage_port+"/";
var rm3version     = "v2.4.2";
var rm3title       = "jc://remote/";
var rm3update      = false;
var rm3background  = "img/remote2.png";

// presets

var dataAll	= {};
var dataConfig	= {};

var showImg          = true;	// preset: show images if defined (otherwise text)
var eMsg             = false;
var reloadInterval   = 10;	// reload data every x seconds
var connect2stage    = "Prod";	// default stage to connect to (changed if rm3_test == true)

var showButtonTime   = 0.2;     // time to show LED when button pressed
var showButton       = false;   // default: show pressed button in headline
var deactivateButton = false;   // default: deactivate buttons if device is not ON

var showEditRemote   = false;   // show / hide edit panel



var show_error     = ""; // onClick=\"javascript:showErrorLog();\""; // not implemented any more
var status_green   = "<div id='green' "+show_error+"></div>";
var status_yellow  = "<div id='yellow' "+show_error+"></div>";
var status_gray    = "<div id='gray' "+show_error+"></div>";
var status_red     = "<div id='red' "+show_error+"></div>";

// Theme detection and color setting
//----------------------------------

// color definitions: https://www.w3schools.com/cssref/css_colors.asp			

var colors			= [ "red", "green", "darkgreen", "blue", "darkblue" ];
var colors_dev			= [];
var color_button_inactive 	= "#666666";
var colors_power		= { 
				"ON"	: "darkgreen",
				"OFF"	: "darkred",
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
	element		= document.getElementById("theme_check");
	style		= window.getComputedStyle(element)["background-color"];
	
	if (style == "rgb(255, 255, 255)")	{ theme = "default"; }
	else					{ theme = "dark"; }
	if (old_theme != theme)			{ console.log("Change theme to: "+theme); }
	
	if (theme == "dark") {
		color_button_inactive 	= "#111111";
		colors_power["ERROR"]	= "lightpink";		
		}
	}

// ------------------------------------------
// EOF


