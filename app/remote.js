//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
//
// WebApp Remote Control for RM3
// from Broadlink (requires server app)
//--------------------------------
/* INDEX:
function remoteInit (first_load=true)
function remoteFirstLoad_load()
function remoteFirstLoad(data)
function remoteUpdate(data)
function remoteInitData_load()
function remoteInitData(data)
function remoteReload_load()
function remoteReload(data)
function remoteDropDown_load()
function remoteDropDown(data)
function remoteToggleEditMode()
function remoteStartMenu_load()
function remoteStartMenu(data)
function remoteLastFromCookie()
*/
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
rm3app.init( "data_log", "error_log", reloadInterval, remoteReload );

//--------------------------------
// additional apps to write menus, remotes, messages
//--------------------------------

var rm3menu     = new rmMenu(     "rm3menu", ["menuItems","menuItems2"] );
var rm3start    = new rmStart(    "rm3start" );
var rm3remotes  = new rmRemote(   "rm3remotes" );
var rm3settings = new rmSettings( "rm3settings" );
var rm3msg      = new jcMsg(      "rm3msg" );
var rm3cookie   = new jcCookie(   "rm3cookie");
var rm3slider   = new slider( name="rm3slider", container="audio_slider", callOnChange=setVolume );


//--------------------------------
// initialize
//--------------------------------

check_for_updates();
remoteInit(first_load=true);

//----------------------------------
// initiale settings and load menus
//----------------------------------

function remoteInit (first_load=true) {

	setNavTitle(rm3title);

	setTextById("rest_status",status_gray);
	setTextById("menuItems","");
	setTextById("remote1","");
	setTextById("remote2","");
	setTextById("remote3","");
	setTextById("remote_edit","");
	
	if (rm3update) {
		setTimeout(function(){ rm3msg.hide(); }, 2000);
		rm3update = false;
		}

	if (first_load) {
		showRemoteInBackground(1);		// show start screen
		setTextById("remote2","<center>Loading data ...</center>");

		remoteFirstLoad_load();			// init load of data
		rm3app.setAutoupdate( );		// set auto update interval to active
		}
	}
	
//----------------------------------

function remoteFirstLoad_load() {rm3app.requestAPI("GET",["list"],"",remoteFirstLoad); }
function remoteFirstLoad(data) {
	remoteReload(data);			// initial load of data incl. remotes, settings
	remoteStartMenu(data);			// initial load start menu
	remoteDropDown(data);			// initial load drop down menu
	remoteLastFromCookie();			// get data from cookie
	}

//----------------------------------

function remoteUpdate(data) {
        rm3remotes.data = data["DATA"]["devices"]; //["DeviceConfig"];
        rm3remotes.create();
        }
        
//----------------------------------

function remoteInitData_load() { rm3app.requestAPI("GET",["list"],"",remoteInitData); }
function remoteInitData(data) {

	if (data["DATA"]) {
		// init and reload data 
		rm3remotes.init(  data );
		rm3settings.init( data );
		rm3menu.init(     data );
		rm3start.init(    data );
		rm3slider.init(   data );
		rm3settings.create();
		}
	else {
		console.error("remoteInitData: no data loaded!");
		show_status("red", showButtonTime);
		}
	}
	
	
//--------------------------------
// print after loading data (callback)
//--------------------------------

function remoteReload_load() { rm3app.requestAPI("GET",["list"],"",remoteReload); }
function remoteReload(data) {

	if (!data["DATA"]) {
		console.error("remoteReload: data not loaded.");
		show_status("red", showButtonTime);
		return;
		}

	// check if still used in a fct. -> to be removed
	dataAll = data;		
	
	remoteInitData(data);	// init and reload data
        remoteDropDown(data);	// update drop down menu
        
	// check device & audio status
	check_status(data);	
	check_theme();

	// reset button info in header
	setTimeout(function(){setTextById("audio4", "");}, 1000);
	}
	
//--------------------------------

function remoteDropDown_load() { rm3app.requestAPI( "GET", ["list"], "", remoteDropDown ); }
function remoteDropDown(data) {

	if (!data["DATA"]) {
		console.error("remoteDropDown: data not loaded.");
		show_status("red", showButtonTime);
		return;
		}

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
	rm3menu.add_script( "remoteToggleEditMode();", "Edit Remote" + edit_on );
	rm3menu.add_script( "rm3settings.button_deact(true);remoteInit();", deact_link);        
        }
        

function remoteToggleEditMode() {
	rm3remotes.remoteToggleEditMode();
	rm3menu.remoteToggleEditMode();
	rm3start.remoteToggleEditMode();
	rm3settings.remoteToggleEditMode();
	rm3settings.create();
	remoteDropDown_load();
	}


//--------------------------------

function remoteStartMenu_load() { rm3app.requestAPI( "GET", ["list"], "", remoteStartMenu ); }
function remoteStartMenu(data) {

	if (!data["DATA"]) {
		console.error("remoteStartMenu: data not loaded.");
		show_status("red", showButtonTime);
		return;
		}

	// load buttons on start page
	rm3start.init(        data);	// load data to class
	rm3start.add_scenes(  data["DATA"]["scenes"],  "remote1" );
	rm3start.add_devices( data["DATA"]["devices"], "remote2" );
	
	// check status and change button color
	check_status(data);
	}


//--------------------------------

function remoteLastFromCookie() {

	// read cookie if exist
	var cookie   = rm3cookie.get("remote");

	// if cookie ...
	if (cookie) {
		var remote = cookie.split("::");
		console.log("Load Cookie:");
		console.log(remote);

		// start remote if cookie is set (reopen with last remote control)
		if (remote[0] == "scene") 	{
			rm3remotes.create('scene',remote[1]);
			rm3settings.hide();
			setNavTitle(remote[2]);
			//clickMenu();
			}
		else if (remote[0] == "device") {
			rm3remotes.create('device',remote[1]);
			rm3settings.hide();
			setNavTitle(remote[2]);
			//clickMenu();
			}
		else 	{}
		}
	}


//-----------------------------
// EOF
