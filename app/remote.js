//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
//
// WebApp Remote Control for RM3
// from Broadlink (requires server app)
//--------------------------------

if (rm3_test) 	{
	//RESTurl 	= RESTurl_test;
	rm3title 	+= "test";
	connect2stage	= "Test";
	document.getElementById("navTitle").style.color="red";
	}
else {
	//RESTurl 	= RESTurl_prod;
	connect2stage	= "Prod";
	}


//--------------------------------
// app to load info and send cmd to IR device
//--------------------------------

var rm3app     = new jcApp( "rm3app", RESTurl, "list", "api/");     // cmd: <device>/<cmd>
rm3app.init( "data_log", "error_log", reloadInterval, printRmStatus );
rm3app.load( );
rm3app.setAutoupdate( );


//--------------------------------
// additional apps to write menus, remotes, messages
//--------------------------------

var rm3menu     = new rmMenu(     "rm3menu", "menuItems" );
var rm3start    = new rmStart(    "rm3start" );
var rm3remotes  = new rmRemote(   "rm3remotes" );
var rm3settings = new rmSettings( "rm3settings" );
var rm3msg      = new jcMsg(      "rm3msg" );
var rm3cookie   = new jcCookie(   "rm3cookie");

check_for_updates();

//--------------------------------
// print after loading data (callback)
//--------------------------------

function printRmStatus(data) {

	// set vars
	dataAll			  = data;
	dataConfig                = data["DeviceConfig"];
	
	if ("DATA" in data) {
		dataDevices               = data["DATA"]["devices"];
		dataTemplates             = data["DATA"]["templates"];
		dataScenes                = data["DATA"]["scenes"];
		}
	if ("STATUS" in data) {
		dataStatus		  = data["STATUS"];
		}

	// init / reload data 
	rm3remotes.init( dataAll, dataTemplates);	        // load data to class
	rm3start.init(   dataAll);	                        // load data to class
	rm3settings.init(dataAll);
	
	// update drop down menu
        rmDropDownMenu(data);
        
	// check device & audio status
	check_status();

	// reset button info in header
	setTimeout(function(){setTextById("audio4", "");}, 1000);

	}
	
//--------------------------------

function rmDropDownMenu_update() { rm3app.requestAPI( "GET", ["list"], "", rmDropDownMenu ); }
function rmDropDownMenu(data) {

	// data for links
	var deact_link         = "Intelligent Mode";
	if (!deactivateButton) { deact_link = "Manual Mode"; }
	
	// show edit mode is on
	var edit_on = "";
	if (rm3remotes.edit_mode) { edit_on = " [ON]"; }
	
	// load drop down menu
	rm3menu.init(        data );	// load data to class
	rm3menu.add_scenes(  data["DATA"]["scenes"] );
	rm3menu.add_devices( data["DATA"]["devices"] );
	rm3menu.add_script( "rm3settings.onoff();", "Settings" );
	rm3menu.add_script( "rm3remotes.toggleEditMode();rm3menu.toggleEditMode();rm3start.toggleEditMode();rmDropDownMenu_update();", "Edit Remote" + edit_on );
	rm3menu.add_script( "rm3settings.button_deact(true);", deact_link);        
        }


//--------------------------------

function printRmMenu(data) {

	// set vars
	dataAll		= data;
	dataConfig 	= data["DeviceConfig"];
	dataDevices	= data["DATA"]["devices"];
	dataScenes	= data["DATA"]["scenes"];

        // create drop down menu
        rmDropDownMenu(data);

	// load buttons on start page
	rm3start.init(        data);	// load data to class
	rm3start.add_scenes(  data["DATA"]["scenes"],  "remote1" );
	rm3start.add_devices( data["DATA"]["devices"], "remote2" );

	// check main audio device
	for (var key in dataDevices) {
		if ("audio" in dataDevices[key] && dataDevices[key]["audio"] == "main") {
			status_mute    = key+"_mute"; // -> show in <nav-info id="audio2">
			status_vol     = key+"_vol";  // -> show in <nav-info id="audio1">
			status_vol_max = dataDevices[key]["status"]["vol"]["max"];
			}
		}

	// check device & audio status
	check_status();

	//initial check, if loaded
	setTimeout(function(){
		if (!rm3update) {
			rm3msg.hide();
			lastRemoteCookie();
			}
		}, 2000);
		
        rm3app.requestAPI( "GET", ["list"], "", printRmStatus );
	}

//--------------------------------
// initialize
//--------------------------------

initRemote(true);

//----------------------------------
// initiale settings and load menus
//----------------------------------

function initRemote (first_load=true) {

	if (first_load) {
		showRemote(1);		// show start screen
		}

	setNavTitle(rm3title);

	setTextById("rest_status",status_gray);
	setTextById("menuItems","");
	setTextById("remote1","");
	setTextById("remote2","");
	setTextById("remote3","");
	setTextById("remote_edit","");

	rm3app.requestAPI( "GET", ["list"], "", printRmMenu );
	}

//--------------------------------

function lastRemoteCookie() {

	// read cookie if exist
	var test   = rm3cookie.get("remote");

	// if cookie ...
	if (test) {
		var remote = test.split("::");

		// start remote if cookie is set (reopen with last remote control)
		if (remote[0] == "scene") 	{
			rm3remotes.create('scene',remote[1]);
			rm3settings.hide();
			clickMenu();
			setNavTitle(remote[2]);
			}
		else if (remote[0] == "device") {
			rm3remotes.create('device',remote[1]);
			rm3settings.hide();
			clickMenu();
			setNavTitle(remote[2]);
			}
		else 				{}
		}
	}


//-----------------------------
// EOF
