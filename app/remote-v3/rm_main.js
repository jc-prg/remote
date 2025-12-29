//--------------------------------
// jc://remote/
//--------------------------------

var rm3background  = "remote-v3/img/remote2.png";
var rm3scene_dir   = "/scenes/";

var app_data = {};
var reload_active = false;
var showImg = true;
var startActive = true;
var easyEdit = false;
var remoteHints = true;
var jsonHighlighting= false;

var rm3menu        = undefined;
var rm3start       = undefined;
var rm3remotes     = undefined;
var rm3settings    = undefined;
var rm3json_edit   = undefined;

function startRemote() {

    rm3menu      = new rmMenu(     "rm3menu", ["menuItems","menuItems2"] );
    rm3start     = new RemoteStart(    "rm3start");
    rm3remotes   = new RemoteMain(   "rm3remotes");
    rm3settings  = new RemoteSettings( "rm3settings");
    rm3json_edit = new RemoteJsonEditing( "rm3json_edit");

    appMsg.info_message_init(appMsg);
    remoteInit(true);
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

	remoteMainMenu(false);
	if (first_load) {
		showRemoteInBackground(1);			// show start screen
		setTextById("frame4","<div style='width:100%;padding:15px;text-align:center;'>"+lang("LOADING_DATA")+"</div>");
		remoteFirstLoad_load();			// init load of data
		}
	}
	

function remoteFirstLoad_load() {appFW.requestAPI("GET",["list"],"",remoteFirstLoad); }
function remoteFirstLoad(data) {
    dataAll = data;
	remoteReload(data);		// initial load of data incl. remotes, settings
	remoteStartMenu(data);		// initial load start menu
	remoteDropDown(data);		// initial load drop down menu
	remoteLastFromCookie();		// get data from cookie
	}


function remoteInitData(data) {

	if (data["CONFIG"]) {
	    dataAll = data;

		// init and reload data 
		rm3remotes.init(  data );
		rm3settings.init( data );
		rm3menu.init(     data );
		rm3start.init(    data );

		if (rm3settings.active)                                          { rm3settings.create(); }
		else if (rm3remotes.active_name !== "" && !rm3remotes.edit_mode)  { rm3remotes.create(); }
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

	// check device & audio status
	statusCheck(data);	

	// reset button info in header
	//setTimeout(function(){setTextById("audio4", "");}, 1000);
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
    console.info("remoteToggleEditMode('"+settings+"');");

    if (typeof settings === "boolean")  { rm3remotes.edit_mode = settings; }
    else if (settings === "true")       { rm3remotes.edit_mode = true; }
    else if (settings === "false")      { rm3remotes.edit_mode = false; }
    else if (settings === "") 			{ rm3remotes.edit_mode = !rm3remotes.edit_mode; }

    rm3settings.edit_mode = rm3remotes.edit_mode;
    rm3start.edit_mode    = rm3remotes.edit_mode;
    rm3menu.edit_mode     = rm3remotes.edit_mode;

    remoteDropDown_load();
	}


function remoteToggleEasyEdit(settings="") {
    console.info("remoteToggleEasyEdit('"+settings+"');");

    if (typeof settings === "boolean")  { easyEdit = settings; }
    else if (settings === "true")       { easyEdit = true; }
    else if (settings === "false")      { easyEdit = false; }
    else if (settings === "") 			{ easyEdit = !easyEdit; }
    }


function remoteToggleJsonHighlighting(settings="") {
    console.info("remoteToggleJsonHighlighting('"+settings+"');");

    if (typeof settings === "boolean")  { jsonHighlighting = settings; }
    else if (settings === "true")       { jsonHighlighting = true; }
    else if (settings === "false")      { jsonHighlighting = false; }
    else if (settings === "") 			{ jsonHighlighting = !jsonHighlighting; }
    }


function remoteToggleRemoteHints(settings="") {
    console.info("remoteRemoteHints('"+settings+"');");

    if (typeof settings === "boolean")  { remoteHints = settings; }
    else if (settings === "true")       { remoteHints = true; }
    else if (settings === "false")      { remoteHints = false; }
    else if (settings === "") 			{ remoteHints = !remoteHints; }
    }

//--------------------------------

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
	rm3start.set_edit_mode();
	rm3start.add_scenes(  data["CONFIG"]["scenes"],  "frame3" );
	rm3start.add_devices( data["CONFIG"]["devices"], "frame4" );
	
	// check status and change button color
	statusCheck(data);
	}


//--------------------------------

function remoteLastFromCookie() {

	// read cookie if exist
	const cookie = appCookie.get("remote");

	// if cookie ...
	if (cookie && cookie !== "") {
		const remote = cookie.split("::");
		console.log("Load Cookie: " + cookie);
		console.log(remote);

        if (remote.length > 2) { remoteToggleEditMode(remote[3]); }
        if (remote.length > 3) { remoteToggleEasyEdit(remote[4]); }
        if (remote.length > 4) { remoteToggleRemoteHints(remote[5]); }

		// start remote if cookie is set (reopen with last remote control)
		if (remote[0] === "scene") 	{
			rm3remotes.create('scene',remote[1]);
			rm3settings.hide();
			setNavTitle(remote[2]);
			//clickMenu();
			}
		else if (remote[0] === "device") {
			rm3remotes.create('device',remote[1]);
			rm3settings.hide();
			setNavTitle(remote[2]);
			//clickMenu();
			}
		else {}
		}
	}


function remoteSetCookie() {
    appCookie.set("remote",rm3remotes.active_type+"::"+rm3remotes.active_name+"::"+rm3remotes.active_label+"::"+rm3remotes.edit_mode+"::"+easyEdit+"::"+remoteHints);
	console.info("Set cookie: "+rm3remotes.active_type+"::"+rm3remotes.active_name+"::"+rm3remotes.active_type_label+"::"+rm3remotes.edit_mode+"::"+easyEdit+"::"+remoteHints);
}
