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
function remoteSetSliderDevice(data)
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

var rm3app     = new jcApp( "rm3app", RESTurl, "list", "api/");	 // create app
rm3app.init( "data_log", "error_log", reloadInterval, remoteReload ); // set initial values
rm3app.setAutoupdate();						 // set auto update interval to active


//--------------------------------
// enforce reload on mobiles when scrolling down -100px
//--------------------------------

window.addEventListener('scroll', function() { remoteForceReload(); });

//--------------------------------
// additional apps to write menus, remotes, messages
//--------------------------------

var rm3menu     = new rmMenu(     "rm3menu", ["menuItems","menuItems2"] );
var rm3start    = new rmStart(    "rm3start" );
var rm3remotes  = new rmRemote(   "rm3remotes" );
var rm3settings = new rmSettings( "rm3settings" );
var rm3msg      = new jcMsg(      "rm3msg" );
var rm3cookie   = new jcCookie(   "rm3cookie");

var rm3slider  = new jcSlider( name="rm3sider", container="audio_slider");	// create slider
rm3slider.init(min=0,max=100,label="loading");					// set device information
rm3slider.setPosition(top="45px",bottom=false,left=false,right="10px");		// set position (if not default)
rm3slider.setOnChange(apiSetVolume);						// -> setVolume (api call to set volume -> this.callOnChange( this.value ))
rm3slider.setShowVolume(statusShowVolume);					// -> showVolume e.g. in header

//statusShowVolume_old( rm3slider.slider.value, rm3slider.audioMax, vol_color );
//setVolume( rm3slider.appMainAudio, rm3slider.slider.value );


//--------------------------------
// initialize
//--------------------------------

apiCheckUpdates();
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
	setTextById("remote_edit1","");
	setTextById("remote_edit2","");
		
	if (rm3update) {
		setTimeout(function(){ rm3msg.hide(); }, 2000);
		rm3update = false;
		}

	if (first_load) {
		showRemoteInBackground(1);		// show start screen
		setTextById("remote2","<center>Loading data ...</center>");
		remoteFirstLoad_load();			// init load of data
		}
	}
	
//----------------------------------

function remoteFirstLoad_load() {rm3app.requestAPI("GET",["list"],"",remoteFirstLoad); }
function remoteFirstLoad(data) {
	remoteReload(data);			// initial load of data incl. remotes, settings
	remoteStartMenu(data);			// initial load start menu
	remoteDropDown(data);			// initial load drop down menu
	remoteLastFromCookie();		// get data from cookie
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
		rm3settings.create();
		}
	else {
		console.error("remoteInitData: no data loaded!");
		statusShowApiStatus("red", showButtonTime);
		}
	}
	
	
//--------------------------------
// print after loading data (callback)
//--------------------------------

function remoteReload_load() { rm3app.requestAPI("GET",["list"],"",remoteReload); }
function remoteReload(data) {

	if (!data["DATA"]) {
		console.error("remoteReload: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	// check if still used in a fct. -> to be removed
	dataAll = data;

	remoteForceReload_checkIfReady(data);	// check if reloaded
	remoteInitData(data);			// init and reload data
	remoteDropDown(data);			// update drop down menu
	remoteSetSliderDevice(data);		// set device for volume slider
        
	// check device & audio status
	statusCheck(data);	
	check_theme();

	// reset button info in header
	setTimeout(function(){setTextById("audio4", "");}, 1000);
	}
	
//--------------------------------

function remoteForceReload(without_position=false) {
	position = window.pageYOffset;
	
	if (document.getElementById('scrollPosition')) { setTextById('scrollPosition',position+" px"); }
	if ((without_position || position <= -80) && reload_active == false) { 
		reload_active  = true;
		reload_waiting = 0;
		elementVisible('reload_info');
		setTextById('reload_msg','.');
		rm3app.requestAPI( "GET", ["reload"], "", remoteReload );
		rm3app.setAutoupdate("",1);
		}   	
	}

//--------------------------------


function remoteForceReload_checkIfReady(data) {
	// check reload status
	if (data["CONFIG"]["reload_status"] == false && reload_active) {
	   	reload_active = false;			 // activate reload again
		elementHidden('reload_info');			 // hide loading message
	   	rm3app.setAutoupdate("",reloadInterval);	 // set reload interval back to default
		}
	else if (reload_active) {
		reload_waiting += 1;
		if (reload_waiting < 8)		{ addTextById('reload_msg','.'); }
		else if (reload_waiting < 15)		{ setTextById('reload_msg',lang("RELOAD_TAKES_LONGER")); }
		else if (reload_waiting < 25)		{ setTextById('reload_msg',lang("RELOAD_TAKES_MUCH_LONGER")); }
		else { 
			setTextById('reload_msg','Connection timed out.');
		   	rm3app.setAutoupdate("",reloadInterval);		 // set reload interval back to default
			}
		}
	}

//--------------------------------

function remoteSetSliderDevice(data) {
	main_audio 	= data["CONFIG"]["main-audio"];
	min        	= data["DATA"]["devices"][main_audio]["values"]["vol"]["min"];
	max        	= data["DATA"]["devices"][main_audio]["values"]["vol"]["max"];		
	label      	= data["DATA"]["devices"][main_audio]["label"];
	
	rm3slider.init(min,max,label+" ("+main_audio+")");
	rm3slider.device = main_audio;
	}
	
//--------------------------------

function remoteDropDown_load() { rm3app.requestAPI( "GET", ["list"], "", remoteDropDown ); }
function remoteDropDown(data) {

	if (!data["DATA"]) {
		console.error("remoteDropDown: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	// data for links
	if (deactivateButton)	{ deact_link = lang("MODE_INTELLIGENT"); }
	else			{ deact_link = lang("MODE_MANUAL"); }
	
	// show edit mode is on
	var edit_on = "";
	if (rm3remotes.edit_mode) { edit_on = " [ON]"; }
	
	// load drop down menu
	rm3menu.init(        data );	// load data to class
	rm3menu.add_scenes(  data["DATA"]["scenes"] );
	rm3menu.add_devices( data["DATA"]["devices"] );	
	rm3menu.add_script( "rm3settings.onoff();rm3settings.mode='';", 	lang("SETTINGS") );
	rm3menu.add_script( "remoteToggleEditMode();", 			lang("MODE_EDIT") + edit_on );
	rm3menu.add_script( "rm3settings.button_deact(true);remoteInit();",	deact_link);        
	//rm3menu.add_script( "remoteForceReload(true);", "Force Reload");
        }        


//--------------------------------

function remoteToggleEditMode() {
	var settings = rm3settings.active;
	
	rm3remotes.remoteToggleEditMode();
	rm3menu.remoteToggleEditMode();
	rm3start.remoteToggleEditMode();
	rm3settings.remoteToggleEditMode();
	rm3settings.create();
	remoteDropDown_load();
	
	if (settings) {rm3settings.onoff();}  // when settings -> don't switch back to remotes (workaround)
	}


//--------------------------------

function remoteStartMenu_load() { rm3app.requestAPI( "GET", ["list"], "", remoteStartMenu ); }
function remoteStartMenu(data) {

	if (!data["DATA"]) {
		console.error("remoteStartMenu: data not loaded.");
		statusShowApiStatus("red", showButtonTime);
		return;
		}

	// load buttons on start page
	rm3start.init(        data);	// load data to class
	rm3start.add_scenes(  data["DATA"]["scenes"],  "remote1" );
	rm3start.add_devices( data["DATA"]["devices"], "remote2" );
	
	// check status and change button color
	statusCheck(data);
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
