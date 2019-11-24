//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// main configuration file, check rm_config_stage.js also
//--------------------------------


// REST API configuration

var RESTip         = location.host; var ip = RESTip.split(":");
var RESTurl_test   = "http://"+ip[0]+":5003/";
var RESTurl_prod   = "http://"+ip[0]+":5002/";
var RESTurl        = "http://"+ip[0]+":"+stage_port+"/";
var rm3version     = "v2.1.2";
var rm3title       = "jc://remote/";
var rm3update      = false;

// presets

var dataAll	= {};
var dataConfig	= {};

var showImg          = true;	// preset: show images if defined (otherwise text)
var eMsg             = false;
var reloadInterval   = 15;	// reload data every x seconds
var connect2stage    = "Prod";	// default stage to connect to (changed if rm3_test == true)

var showButtonTime   = 0.2;     // time to show LED when button pressed
var showButton       = false;   // default: show pressed button in headline
var deactivateButton = false;   // default: deactivate buttons if device is not ON

var showEditRemote   = false;   // show / hide edit panel

var colors         = [ "red", "green", "darkgreen", "blue", "darkblue" ];
var colors_dev     = [];

var show_error     = ""; // onClick=\"javascript:showErrorLog();\""; // not implemented any more
var status_green   = "<div id='green' "+show_error+"></div>";
var status_yellow  = "<div id='yellow' "+show_error+"></div>";
var status_gray    = "<div id='gray' "+show_error+"></div>";
var status_red     = "<div id='red' "+show_error+"></div>";

var status_mute    = "rec_mute"; // -> show in <nav-info id="audio2"> 	// changed based on server settings
var status_vol     = "rec_vol";  // -> show in <nav-info id="audio1"> 	// changed based on server settings
var status_vol_max = 74;         // -> calculate in percent		// changed based on server settings


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

// ------------------------------------------

function image(file) {
        return "<img src='icon/"+file+"' style='height:15px;margin:0px;padding:0px;' alt='"+file+"' />";
        }

// ------------------------------------------
// EOF


