//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------

function rmMenu(name, menu) {

	this.menuItems = menu;
        this.app_name  = name;
	this.data      = {};
	this.edit_mode = false;


        // load data with devices (deviceConfig["devices"])
        this.init = function(data) {
                this.data = data;
                this.log("Initialized new class 'rmMenu'.");
                setTextById(this.menuItems,"");
                }


	// add links to devices to drop down menu
	this.add_devices = function(data) {

		// return if no data
    		if (data) {} else { return; }

		// set vars
    		var menu = getTextById(this.menuItems);
    		var i    = 0;

		// create link for each device
		for (var key in data) {
			if (key != "default") {
			        if (data[key]["visibility"] != "none")  { menu  += this.entry_device( key, data[key]["label"] ); }
			        else if (this.edit_mode)                { menu  += this.entry_device( key, "<div class=#hidden_entry_edit#>.(" + data[key]["label"] + ").</div>" ); }
				}
        		}

		// replace old menu
    		setTextById(this.menuItems,menu + "<li><hr/></li>");
		}
		
	// show hide edit mode for remotes
	this.toggleEditMode = function() {
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		}		


	// add links to scenes to drop down menu
	this.add_scenes = function(data) {

		// return if no data
    		if (data) {} else { return; }

		// set vars
    		var menu = getTextById(this.menuItems);
    		var i    = 0;

		// create link for each device
		for (var key in data) {
			menu  += this.entry_scene( key, data[key]["label"] );
        		}

		// replace old menu
    		setTextById(this.menuItems,menu + "<li><hr/></li>");
		}


	// add links to scenes to drop down menu
	this.add_script = function(script,label) {

		// set vars
    		var menu = getTextById(this.menuItems);

		// create link for javascript
		menu += this.entry_script(script,label);

		// replace old menu
    		setTextById(this.menuItems,menu);
		}


	// add links to scenes to drop down menu
	this.add_link = function(link,label) {

		// set vars
    		var menu = getTextById(this.menuItems);

		// create link for javascript
		menu += menuEntry(link,label);

		// replace old menu
    		setTextById(this.menuItems,menu);
		}

	// menu entries
	this.entry_link   = function (link,label) {
   		return "<li><a href=\"" + link + "\" target=\"_blank\">" + label + "</a></li>";
		}

	this.entry_script = function (script,label) {
  		return "<li><a onClick=\"javascript:" + script + ";clickMenu();setNavTitle('" + label + "');\">"+label+"</a></li>";
		}

	this.entry_device = function (device,label) {
		//return "<li><a onclick=\"javascript:writeRemote(dataDevices,'" + device + "');clickMenu();setNavTitle('" + label + "');\" >" + label + "</a></li>";
		return "<li><a onclick=\"rm3remotes.create('device','" + device + "');rm3settings.hide();clickMenu();setNavTitle('" + label + "');\" >" + label.replace(/#/g,"'") + "</a></li>";
		}

	this.entry_scene  = function (scene,label) {
		//return "<li><a onclick=\"javascript:writeMixRemote(dataConfig,'" + remote + "');clickMenu();setNavTitle('" + remote + "');\" >" + remote + "</a></li>";
		return "<li><a onclick=\"rm3remotes.create('scene','" + scene + "');rm3settings.hide();clickMenu();setNavTitle('" + label + "');\" >" + label.replace(/#/g,"'") + "</a></li>";
		}

        // handle messages for console
        this.log = function(msg) {
                console.log(this.app_name + ": " + msg);
                }
	}


function rmStart(name) {

	this.data        = {}
        this.app_name    = name;
        this.edit_mode   = false;

        // load data with devices (deviceConfig["devices"])
        this.init = function(data) {
                this.data = data;
                this.log("Initialized new class 'rmStart'.");
                }


	// add links to devices to drop down menu
	this.add_devices = function(data,menuItems) {
	
		elementHidden("remote_edit"); // no edit mode in start menu

		// set vars
    		var menu    = "";
		rm3remotes.active_type = "start";

		// create small buttons for devices
	    	for ( var key in data ) {
			if (key != "default" && data[key]["visibility"] != "none") {
				var id     = "device_"+key;
        			menu  += this.entry_device( data, id, key, "small" );
				}
		}

		// replace old menu
    		setTextById(menuItems,menu);
    		setTextById("remote_edit","");
		}


	// add links to scenes to drop down menu
	this.add_scenes = function(data,menuItems) {

		// set vars
    		var menu = "";
		rm3remotes.active_type = "start";

		// create big buttons for scenes
	        for ( var key in data ) {
        	        var id = "scene_"+key;
                	menu  += this.entry_scene( data, id, data[key]["label"], "big" );
	                }

		// replace old menu
    		setTextById(menuItems,menu);
		}

	// write small button for device
	this.entry_device = function(data, id, label, style) {
		var disabled, label2;
		var button = id.split("_");
		
		if (data[button[1]]["visibility"] == "none") { return; }
		if (data[button[1]]["image"]) { label  = data[button[1]]["image"]; } 
		if (data[button[1]]["label"]) { label2 = data[button[1]]["label"]; }

		var d = this.button_image( label, style );
 		return this.button( id, d[0], "small", 'rm3remotes.create("device","' + button[1] + '");setNavTitle("' + label2 + '");', "" );
		}

	// write big button for scene
	this.entry_scene = function(data, id, label, style) {
		var disabled;
		var d = this.button_image( label, style );
		var i = id.split("_");
		return this.button( id, d[0], "big", 'rm3remotes.create("scene","' + i[1] + '");setNavTitle("' + label + '");', "" );
		}

        // standard standard button
        this.button = function( id, label, style, script_sendCmd, disabled ){
                return "<button id='" + id + "' class='button " + style + "' onclick='javascript:" + script_sendCmd + "' " + disabled + ">" + label + "</button>";
                }

        // check if image exists for button
        this.button_image = function(label,style) {

                // set vars
                var button_color = this.data["CONFIG"]["button_colors"];  // definition of button color
                var button_img2  = this.data["CONFIG"]["button_images"];  // definition of images for buttons (without path and ".png")
                var button_img   = [];
                for (var key in button_img2) { button_img[key] = this.image(button_img2[key]); }

                // check label
                if (button_color && label in button_color)      { style = style + " bg" + label + " "; }
                if (label in button_img && showImg ) 		{ label = button_img[label]; }
                return [label, style];
                }
                
	// show hide edit mode for remotes
	this.toggleEditMode = function() {
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		}	

        // handle messages for console
        this.log = function(msg) {
                console.log(this.app_name + ": " + msg);
                }

	// create image tag for icons
	this.image = function(file) {
	        return "<img src='icon/"+file+"' style='height:15px;margin:0px;padding:0px;' alt='"+file+"' />";
	        }
	}


//-----------------------------
// EOF

