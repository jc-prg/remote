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
reload_active = false;
rm3update = false;

let showImg = true;
let startActive = true;
let easyEdit = false;
let remoteHints = true;
let jsonHighlighting= false;

let rmApi = undefined;
let rmMain = undefined;
let rmMenu = undefined;
let rmStart = undefined;
let rmRemote = undefined;
let rmSettings = undefined;
let rmJson = undefined;


/* start remote control app when all modules are loaded - used once at the end of index.html */
function startRemote() {

	appMsg.info_message_init(appMsg);

	rmApi       = new RemoteApiControl("rmApi");
	rmMain		= new RemoteMain("rmMain");
    rmMenu      = new RemoteMenu( "rmMenu", ["menuItems","menuItems2"] );
    rmStart     = new RemoteStart( "rmStart");
    rmRemote    = new RemoteControl( "rmRemote");
    rmSettings  = new RemoteSettings( "rmSettings");
    rmJson      = new RemoteJsonEditing( "rmJson");
	rmCookies   = new RemoteCookies("rmCookies");

    rmMain.start(true);
    }


/* class to coordinate the main functionality of the app */
class RemoteMain extends RemoteDefaultClass {
	constructor(name) {
		super(name);

		this.load_app = this.load_app.bind(this);
		this.create_app = this.create_app.bind(this);
		this.load_remote = this.load_remote.bind(this);
		this.create_remote = this.create_remote.bind(this);
		this.load_drop_down = this.load_drop_down.bind(this);
		this.create_drop_down = this.create_drop_down.bind(this);
		this.create_start_menu = this.create_start_menu.bind(this);
	}

	/* initial load of the app */
	start(first_load = true){
		if (first_load) {
			setTextById("frame4","<div style='width:100%;padding:15px;text-align:center;'>"+lang("LOADING_DATA")+"</div>");
			rmCookies.get_settings();
			this.set_background(1);
			this.load_main(false, false);
			this.load_app();
		} else {
			this.load_main(false);
		}
	}

	/* init and reload data */
	init(data) {
		if (data["CONFIG"]) {
			dataAll = data;
			rmRemote.init( data );
			rmSettings.init( data );
			rmMenu.init( data );
			rmStart.init( data );
		} else {
			this.logging.error("init: no data loaded!");
		}
	}

	/* load main setting */
	load_main (cookie_erase=true, load_remote=true) {

		rmSettings.hide();
		this.set_title(appTitle);
		this.set_background(1);

		if (cookie_erase) { rmCookies.erase(); }

		setTextById("menuItems","");
		setTextById("frame1","");
		setTextById("frame2","");
		setTextById("frame3","");
		setTextById("frame4","");
		setTextById("frame5","");

		if (load_remote) {
			this.load_app();
			rmRemote.active_name = "";
		}
	}

	/* load complete setting with start menu, remote control, setting, drop down menu */
	load_app() {
		appFW.requestAPI("GET",["list"], "", this.create_app);
	}

	/* load drop down menu */
	load_drop_down() {
		appFW.requestAPI( "GET", ["list"], "", this.create_drop_down );
	}

	/* load or reload remote control */
	load_remote() {
		appFW.requestAPI("GET", ["list"], "", this.create_remote);
	}

	/* initially create app with start menu, remote control, setting, drop down menu */
	create_app(data) {

		dataAll = data;
		this.create_remote(data);	// initial load of data incl. remotes, settings
		this.create_start_menu(data);		// initial load start menu
		this.create_drop_down(data);		// initial load drop down menu

		rmCookies.get_settings(); // get initial settings from cookie
	}

	/* create drop down menu out of remotes and scenes */
	create_drop_down(data) {

		if (!data["CONFIG"]) {
			this.logging.error("create_drop_down: data not loaded.");
			return;
		}

		// load drop down menu
		rmMenu.init(        data );	// load data to class
		rmMenu.add_scenes(  data["CONFIG"]["scenes"] );
		rmMenu.add_devices( data["CONFIG"]["devices"] );
		rmMenu.add_show_hidden();
		rmMenu.add_script( "rmSettings.create('index');", lang("SETTINGS"));

	}

	/* create remote creation, trigger status check */
	create_remote(data) {

		if (!data["CONFIG"]) {
			this.logging.error("create_remote: data not loaded.");
			return;
		}

		this.init(data);               // init and reload data

		if (rmSettings.active) { rmSettings.create(); }
		else if (rmRemote.active_name !== "" && !rmRemote.edit_mode) { rmRemote.create(); }

		this.create_drop_down(data);               // update drop down menu
		statusCheck(data); 					// check device & audio status
	}

	/* create start menu with buttons for scenes and devices */
	create_start_menu(data) {

		if (!data["CONFIG"]) {
			this.logging.error("create_start_menu: data not loaded.");
			return;
		}

		startActive = true;

		// no edit mode in start menu
		elementHidden("frame1");
		elementHidden("frame2");

		// load buttons on start page
		rmStart.init( data );	// load data to class
		rmStart.set_edit_mode();
		rmStart.add_scenes( data["CONFIG"]["scenes"],  "frame3" );
		rmStart.add_devices( data["CONFIG"]["devices"], "frame4" );

		// check status and change button color
		statusCheck( data );
	}

	/* show or hide background image for the start screen */
	set_background(show=undefined) {
		const body = document.getElementById("app_background");
		const width = window.innerWidth;

		if (show === 1 || show === true) {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				body.style.backgroundImage = "url(" + rm3background + ")";
			} else {
				body.style.backgroundImage = "url(" + rm3background_light + ")";
			}

			body.style.backgroundRepeat     = "no-repeat";
			body.style.backgroundPosition   = "bottom center";
			body.style.backgroundAttachment = "fixed";
			if (width < 350)	{ body.style.backgroundSize     = "100%"; }
			else 			    { body.style.backgroundSize     = "350px"; }
		}
		else {
			body.style.backgroundImage    = "";
		}
	}

	/* set title in the header */
	set_title (title) {

		setTextById("navTitle", "<div onClick=\"rmMain.load_main();\" id='header_title'>"+title.replace(/#/g,"\"")+"</div>");
	}

	/* set a main variable - toggles in the settings */
	set_main_var(main_var, settings="") {
		this.logging.info("set_main_vair('"+main_var+"','"+settings+"');");

		if (main_var === "edit_mode") {

			if (typeof settings === "boolean")  { rmRemote.edit_mode = settings; }
			else if (settings === "true")       { rmRemote.edit_mode = true; }
			else if (settings === "false")      { rmRemote.edit_mode = false; }
			else if (settings === "") 			{ rmRemote.edit_mode = !rmRemote.edit_mode; }

			rmSettings.edit_mode = rmRemote.edit_mode;
			rmStart.edit_mode    = rmRemote.edit_mode;
			rmMenu.edit_mode     = rmRemote.edit_mode;

			rmMain.load_drop_down();
		}
		else if (main_var === "easy_edit") {

			if (typeof settings === "boolean")  { easyEdit = settings; }
			else if (settings === "true")       { easyEdit = true; }
			else if (settings === "false")      { easyEdit = false; }
			else if (settings === "") 			{ easyEdit = !easyEdit; }
		}
		else if (main_var === "json_highlighting") {

			if (typeof settings === "boolean")  { jsonHighlighting = settings; }
			else if (settings === "true")       { jsonHighlighting = true; }
			else if (settings === "false")      { jsonHighlighting = false; }
			else if (settings === "") 			{ jsonHighlighting = !jsonHighlighting; }
		}
		else if (main_var === "remote_hints") {

			if (typeof settings === "boolean")  { remoteHints = settings; }
			else if (settings === "true")       { remoteHints = true; }
			else if (settings === "false")      { remoteHints = false; }
			else if (settings === "") 			{ remoteHints = !remoteHints; }
		}
		else if (main_var === "manual_mode") {

			if (typeof settings === "boolean")  { deactivateButton = settings; }
			else if (settings === "true")       { deactivateButton = true; }
			else if (settings === "false")      { deactivateButton = false; }
			else if (settings === "") 			{ deactivateButton = !deactivateButton; }

			rmSettings.manual_mode = deactivateButton;
		}
		else if (main_var === "button_code") {

			if (typeof settings === "boolean")  { showButton = settings; }
			else if (settings === "true")       { showButton = true; }
			else if (settings === "false")      { showButton = false; }
			else if (settings === "") 			{ showButton = !showButton; }
		}
	}
}


remote_scripts_loaded += 1;
