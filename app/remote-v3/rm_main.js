//--------------------------------
// jc://remote/
//--------------------------------

const rm3background = "remote-v3/img/remote_black.png";
const rm3background_light = "remote-v3/img/remote_silver.png";
const rm3scene_dir   = "/scenes/";
reload_times = {
	OK: 15,
	LONG: 30,
	TIMEOUT: 60
}

var reload_active = false;

let showImg = true;
let startActive = true;
let easyEdit = false;
let remoteHints = true;
let jsonHighlighting= false;

let rmMenu = undefined;
let rmStart = undefined;
let rmRemote = undefined;
let rmSettings = undefined;
let rmJson = undefined;

function startRemote() {

    rmMenu      = new RemoteMenu( "rmMenu", ["menuItems","menuItems2"] );
    rmStart     = new RemoteStart( "rmStart");
    rmRemote    = new RemoteMain( "rmRemote");
    rmSettings  = new RemoteSettings( "rmSettings");
    rmJson      = new RemoteJsonEditing( "rmJson");
	rmCookies    = new RemoteCookies("rmCookies");

    appMsg.info_message_init(appMsg);
    remoteInit(true);
    }

//----------------------------------
// initial settings and load menus
//----------------------------------

function remoteMainMenu (cookie_erase=true, load_remote=true) {

	rmSettings.hide();
	setNavTitle(appTitle);
	showRemoteInBackground(1);
	if (cookie_erase) {
	    rmCookies.erase();
	    }

	setTextById("menuItems","");
	setTextById("frame1","");
	setTextById("frame2","");
	setTextById("frame3","");
	setTextById("frame4","");
	setTextById("frame5","");

	if (load_remote) {
		remoteFirstLoad_load();
		rmRemote.active_name = "";
	}
}


function remoteInit (first_load=true) {
	if (first_load) {
		setTextById("frame4","<div style='width:100%;padding:15px;text-align:center;'>"+lang("LOADING_DATA")+"</div>");
		rmCookies.get_settings();
		showRemoteInBackground(1);
		remoteMainMenu(false, false);
		remoteFirstLoad_load();
	} else {
		remoteMainMenu(false);
	}
}
	

function remoteFirstLoad_load() {
	appFW.requestAPI("GET",["list"],"",remoteFirstLoad);
}

function remoteFirstLoad(data) {
    dataAll = data;
	remoteReload(data);		// initial load of data incl. remotes, settings
	remoteStartMenu(data);		// initial load start menu
	remoteDropDown(data);		// initial load drop down menu

	rmCookies.get_settings(); // get initial settings from cookie
	}


function remoteInitData(data) {

	if (data["CONFIG"]) {
	    dataAll = data;

		// init and reload data 
		rmRemote.init(  data );
		rmSettings.init( data );
		rmMenu.init(     data );
		rmStart.init(    data );

		if (rmSettings.active)                                          { rmSettings.create(); }
		else if (rmRemote.active_name !== "" && !rmRemote.edit_mode)  { rmRemote.create(); }
		}
	else {
		console.error("remoteInitData: no data loaded!");
		}
	}
	
	
//--------------------------------
// print after loading data (callback)
//--------------------------------

function remoteReload_load() {
	appFW.requestAPI("GET", ["list"], "", remoteReload);
}

function remoteReload(data) {

	if (!data["CONFIG"]) {
		console.error("remoteReload: data not loaded.");
		return;
		}

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
	rmMenu.init(        data );	// load data to class
	rmMenu.add_scenes(  data["CONFIG"]["scenes"] );
	rmMenu.add_devices( data["CONFIG"]["devices"] );
	rmMenu.add_show_hidden();
	rmMenu.add_script( "rmSettings.create('index');", lang("SETTINGS"));
	}


//--------------------------------

function remoteToggleEditMode(settings="") {
    console.info("remoteToggleEditMode('"+settings+"');");

    if (typeof settings === "boolean")  { rmRemote.edit_mode = settings; }
    else if (settings === "true")       { rmRemote.edit_mode = true; }
    else if (settings === "false")      { rmRemote.edit_mode = false; }
    else if (settings === "") 			{ rmRemote.edit_mode = !rmRemote.edit_mode; }

    rmSettings.edit_mode = rmRemote.edit_mode;
    rmStart.edit_mode    = rmRemote.edit_mode;
    rmMenu.edit_mode     = rmRemote.edit_mode;

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
	rmStart.init(        data);	// load data to class
	rmStart.set_edit_mode();
	rmStart.add_scenes(  data["CONFIG"]["scenes"],  "frame3" );
	rmStart.add_devices( data["CONFIG"]["devices"], "frame4" );
	
	// check status and change button color
	statusCheck(data);
	}

remote_scripts_loaded += 1;
