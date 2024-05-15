//--------------------------------
// jc://remote/
//--------------------------------

var rm3background  = "remote-v3/img/remote2.png";
var rm3scene_dir   = "/scenes/";

var app_data       = {};
var reload_active  = false;
var showImg        = true;
var startActive    = true;

var rm3slider      = undefined;
var rm3menu        = undefined;
var rm3start       = undefined;
var rm3remotes     = undefined;
var rm3settings    = undefined;

function startRemote() {
    rm3slider  = new jcSlider(name="rm3slider", container="audio_slider");              // create slider
    rm3slider.init(min=0,max=100,label="loading");                                      // set device information
    rm3slider.setPosition(top="45px",bottom=false,left=false,right="10px");             // set position (if not default)
    rm3slider.setOnChange(apiSetVolume);                                                // -> setVolume (api call to set volume -> this.callOnChange( this.value ))
    rm3slider.setShowVolume(statusShow_volume);                                         // -> showVolume e.g. in header

    rm3menu     = new rmMenu(     "rm3menu", ["menuItems","menuItems2"] );
    rm3start    = new rmStart(    "rm3start" );
    rm3remotes  = new rmRemote(   "rm3remotes" );
    rm3settings = new rmSettings( "rm3settings" );

    appMsg.info_message_init(appMsg);
    remoteInit(first_load=true);
    }

//----------------------------------
// initial settings and load menus
//----------------------------------

function remoteMainMenu (cookie_erase=true) {

	rm3settings.hide();
	setNavTitle(appTitle);
	showRemoteInBackground(1);
	if (cookie_erase) {
	    appCookie.erase('remote');
	    console.log("Erase cookie: " + appCookie.get('remote'));
	    }

	setTextById("menuItems","");
	setTextById("frame1","");
	setTextById("frame2","");
	setTextById("frame3","");
	setTextById("frame4","");
	setTextById("frame5","");

	rm3remotes.active_name = "";
	remoteFirstLoad_load();
	}


function remoteInit (first_load=true) {

	remoteMainMenu(cookie_erase=false);
	if (first_load) {
		showRemoteInBackground(1);			// show start screen
		setTextById("frame4","<center>Loading data ...</center>");
		remoteFirstLoad_load();			// init load of data
		}
	}
	

function remoteFirstLoad_load() {appFW.requestAPI("GET",["list"],"",remoteFirstLoad); }
function remoteFirstLoad(data) {
    dataAll = data;
	//remoteReload(data);		// initial load of data incl. remotes, settings
	remoteStartMenu(data);		// initial load start menu
	remoteDropDown(data);		// initial load drop down menu
	remoteLastFromCookie();		// get data from cookie
	}


function remoteInitData_load() { appFW.requestAPI("GET",["list"],"",remoteInitData); }
function remoteInitData(data) {

	if (data["CONFIG"]) {
	    dataAll = data;

		// init and reload data 
		rm3remotes.init(  data );
		rm3settings.init( data );
		rm3menu.init(     data );
		rm3start.init(    data );

		if (rm3settings.active)                                          { rm3settings.create(); }
		else if (rm3remotes.active_name != "" && !rm3remotes.edit_mode)  { rm3remotes.create(); }
		}
	else {
		console.error("remoteInitData: no data loaded!");
		}
	}
	
	
//--------------------------------
// print after loading data (callback)
//--------------------------------

function remoteReload_load() { appFW.requestAPI("GET",["list"],"",remoteReload); }
function remoteReload(data) {

	if (!data["CONFIG"]) {
		console.error("remoteReload: data not loaded.");
		return;
		}

    app_data = data;

    // remoteForceReload_checkIfReady(data); // check if reloaded
	remoteInitData(data);               // init and reload data
	remoteDropDown(data);               // update drop down menu
	remoteSetSliderDevice(data);        // set device for volume slider
        
	// check device & audio status
	statusCheck(data);	

	// reset button info in header
	//setTimeout(function(){setTextById("audio4", "");}, 1000);
	}
	
//--------------------------------

function remoteSetSliderDevice(data) {

	main_audio = data["CONFIG"]["main-audio"];
	var values = data["CONFIG"]["devices"][main_audio]["commands"]["definition"]["vol"]["values"];
	var min    = 0;
	var max    = 100;
	         
	if (values["min"] >= 0 && values["max"] > 0) {
		min     = values["min"];
		max     = values["max"];
		}
	else {
		min    = 0;
		max    = 100;
		console.error("Min and max values not defined, set to 0..100!");
		}
	label      	= data["CONFIG"]["devices"][main_audio]["settings"]["label"];
	
	rm3slider.init(min,max,label+" ("+main_audio+")");
	rm3slider.device = main_audio;
	}
	
//--------------------------------

function remoteDropDown_load() { appFW.requestAPI( "GET", ["list"], "", remoteDropDown ); }
function remoteDropDown(data) {

	if (!data["CONFIG"]) {
		console.error("remoteDropDown: data not loaded.");
		return;
		}

	// load drop down menu
	rm3menu.init(        data );	// load data to class
	rm3menu.add_scenes(  data["CONFIG"]["scenes"] );
	rm3menu.add_devices( data["CONFIG"]["devices"] );
	rm3menu.add_script( "rm3settings.create('index');", lang("SETTINGS"));
    }


//--------------------------------

function remoteToggleEditMode(settings="") {

    if (settings == "") {
        if (rm3remotes.edit_mode)   { rm3remotes.edit_mode = false; }
        else                        { rm3remotes.edit_mode = true; }
        }
    else                            { rm3remotes.edit_mode = settings; }

    rm3settings.edit_mode = rm3remotes.edit_mode;
    rm3start.edit_mode    = rm3remotes.edit_mode;
    rm3menu.edit_mode     = rm3remotes.edit_mode;

    //remoteStartMenu_load();
    remoteDropDown_load();
	}

//--------------------------------

function remoteStartMenu_load() { appFW.requestAPI( "GET", ["list"], "", remoteStartMenu ); }
function remoteStartMenu(data) {

	if (!data["CONFIG"]) {
		console.error("remoteStartMenu: data not loaded.");
		return;
		}
		
	startActive = true;

    // no edit mode in start menu
    elementHidden("frame1");
    elementHidden("frame2");

	// load buttons on start page
	rm3start.init(        data);	// load data to class
	rm3start.add_scenes(  data["CONFIG"]["scenes"],  "frame3" );
	rm3start.add_devices( data["CONFIG"]["devices"], "frame4" );
	
	// check status and change button color
	statusCheck(data);
	}


//--------------------------------

function remoteLastFromCookie() {

	// read cookie if exist
	var cookie   = appCookie.get("remote");

	// if cookie ...
	if (cookie && cookie != "") {
		var remote = cookie.split("::");
		console.log("Load Cookie: " + cookie);
		console.log(remote);

		// start remote if cookie is set (reopen with last remote control)
		if (remote[0] == "scene") 	{
			rm3remotes.create('scene',remote[1]);           console.remote("!!! CREATE - last from cookie");
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
