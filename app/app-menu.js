//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------
/* INDEX:
function rmMenu(name, menu)
        this.init                 = function(data)
    		window.onresize = function(event)
	this.add_devices          = function(data)
	this.remoteToggleEditMode = function()
	this.add_scenes           = function(data)
	this.add_script           = function(script,label)
	this.add_link             = function(link,label)
	this.entry_link           = function(link,label)
	this.entry_script         = function(script,label)
	this.entry_device         = function(device,label)
	this.entry_scene          = function(scene,label)
        this.log                  = function(msg)
        this.writeMenu            = function(menutext)
        this.readMenu             = function()
function rmStart(name)
        this.init                 = function(data)
	this.add_devices          = function(data,menuItems)
	this.add_scenes           = function(data,menuItems)
	this.entry_device         = function(data, id, label, style)
	this.entry_scene          = function(data, id, label, style)
        this.button               = function(id, label, style, script_apiCommandSend, disabled )
        this.button_image         = function(label,style)
	this.remoteToggleEditMode = function()
        this.log                  = function(msg)
	this.image                = function(file)
*/
//--------------------------------

function rmMenu(name, menu) {

	this.menuItems   = menu;
        this.app_name    = name;
	this.data        = {};
	this.edit_mode   = false;
	this.inital_load = true;


        // load data with devices (deviceConfig["devices"])
        this.init                 = function(data) {

        	if (data["DATA"]) 	{ this.data = data; }
        	else			{ return; }

                if (this.initial_load) { 
                	this.log("Initialized new class 'rmMenu'.");
                	this.inital_load = false;
                	}
                else {	this.log("Reload data 'rmMenu'.");
                	}
                
    		this.writeMenu("");
    		menuApp = this;
    		
    		// define variable menu size (scroll bars defined in app-menu.css)
    		window.onresize = function(event) {
    			height = (window.innerHeight - 70);
    			document.getElementById("menuItems").style.maxHeight  = height + "px"; 
    			document.getElementById("menuItems2").style.maxHeight = height + "px"; 
    			rm3menu.menu_height();	
			}

		height = (window.innerHeight - 70);
		document.getElementById("menuItems").style.maxHeight  = height + "px"; 
		document.getElementById("menuItems2").style.maxHeight = height + "px";
		this.menu_height();	
                }
                
        this.menu_height	  = function() {
		document.getElementById("remote_nav").style.maxHeight = "100px";
	        var height = pageHeight();
	        height -= 50;
   		document.getElementById("remote_nav").style.maxHeight = height+ "px"; // window.innerHeight + "px"; // 
        	}


	// add links to devices to drop down menu
	this.add_devices          = function(data) {

		// return if no data
    		if (!data) { return; }

		// set vars
    		var menu   = this.readMenu();
		var order  = sortDict(data,"position");
    		var i      = 0;
		for (var j=0;j<order.length;j++) {
			device = order[j];
			if (device != "default") {
			        if (data[device]["visible"] != "no")  { menu  += this.entry_device( device, data[device]["label"] ); }
			        else if (this.edit_mode)              { menu  += this.entry_device( device, "<div class=#hidden_entry_edit#>.(" + data[device]["label"] + ").</div>" ); }
				}
        		}
    		this.writeMenu(menu + "<li><hr/></li>");
		}
		
	// show hide edit mode for remotes
	this.remoteToggleEditMode = function() {
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		}		


	// add links to scenes to drop down menu
	this.add_scenes           = function(data) {

		// return if no data
    		if (data) {} else { return; }
    		
    		var menu   = this.readMenu();
		var order  = sortDict(data,"position");
		for (var j=0;j<order.length;j++) {
			scene = order[j];
			if (data[scene]["label"]) {
//				menu  += this.entry_scene( scene, data[scene]["label"] );			
			        if (data[scene]["visible"] != "no")  { menu  += this.entry_scene( scene, data[scene]["label"] ); }
			        else if (this.edit_mode)             { menu  += this.entry_scene( scene, "<div class=#hidden_entry_edit#>.(" + data[scene]["label"] + ").</div>" ); }
				}
        		}
    		this.writeMenu(menu + "<li><hr/></li>");
		}


	// add links to scenes to drop down menu
	this.add_script           = function(script,label) {

    		var menu = this.readMenu();
		menu += this.entry_script(script,label);
    		this.writeMenu(menu);
		}


	// add links to scenes to drop down menu
	this.add_link             = function(link,label) {

    		var menu = this.readMenu();
		menu += menuEntry(link,label);
    		this.writeMenu(menu);
		}

	// menu entries
	this.entry_link           = function(link,label) {
   		return "<li><a href=\"" + link + "\" target=\"_blank\">" + label + "</a></li>";
		}

	this.entry_script         = function(script,label) {
  		return "<li><a onClick=\"javascript:" + script + ";clickMenu();setNavTitle('" + label + "');\">"+label+"</a></li>";
		}

	this.entry_device         = function(device,label) {
		return "<li><a onclick=\"rm3remotes.create('device','" + device + "');rm3settings.hide();clickMenu();setNavTitle('" + label + "');\" >" + label.replace(/#/g,"'") + "</a></li>";
		}

	this.entry_scene          = function(scene,label) {
		return "<li><a onclick=\"rm3remotes.create('scene','" + scene + "');rm3settings.hide();clickMenu();setNavTitle('" + label + "');\" >" + label.replace(/#/g,"'") + "</a></li>";
		}

        // handle messages for console
        this.log                  = function(msg) {
                console.log(this.app_name + ": " + msg);
                }
                
        this.writeMenu            = function(menutext) {
        	if (typeof this.menuItems == "string") {
        		setTextById(this.menuItems,menutext);
        		}
        	else if (typeof this.menuItems == "object") {
        		for (var i=0; i<this.menuItems.length; i++) {
	        		setTextById(this.menuItems[i],menutext);
        			}
        		}
        	}
        this.readMenu             = function() {
        	if (typeof this.menuItems == "string") {
        		return getTextById(this.menuItems);
        		}
        	else if (typeof this.menuItems == "object") {
        		return getTextById(this.menuItems[0]);
        		}
        	}
	}


function rmStart(name) {

	this.data        = {}
        this.app_name    = name;
        this.edit_mode   = false;
        this.inital_load = true;

        // load data with devices (deviceConfig["devices"])
        this.init                 = function(data) {
        
        	if (data["DATA"]) 	{ this.data = data; }
        	else			{ return; }
                
                if (this.initial_load) { 
                	this.log("Initialized new class 'rmStart'.");
                	this.inital_load = false;
                	}
                else {
                	this.log("Reload data 'rmStart'.");
                	}
                }


	// add links to devices to drop down menu
	this.add_devices          = function(data,menuItems) {
	
		elementHidden("remote_edit1"); // no edit mode in start menu
		elementHidden("remote_edit2"); // no edit mode in start menu

		// set vars
    		var menu    = "";
		rm3remotes.active_type = "start";


		// create small buttons for devices
		var order  = sortDict(data,"position");
		for (var key in order) {
			device = order[key];
			if (device != "default") {
				if (data[device]["visible"] == "yes") {
					var id     = "device_"+device;
        				menu  += this.entry_device( data, id, device, "small" );
					}
			        else if (this.edit_mode && data[device]["visible"] == "no") { 
					var id     = "device_"+device;
			        	menu  += this.entry_device( data, id, device, "small_edit" );
			        	}
			        }
		}

		// replace old menu
    		setTextById(menuItems,menu);
    		setTextById("remote_edit1","");
    		setTextById("remote_edit2","");
		}


	// add links to scenes to drop down menu
	this.add_scenes           = function(data,menuItems) {

		// set vars
    		var menu = "";
		rm3remotes.active_type = "start";

		// create big buttons for scenes
		var order  = sortDict(data,"position");
	        for (var key in order) {
			scene  = order[key];
			if (data[scene]["visible"] == "yes") {
	        	        var id = "scene_"+scene;
        	        	menu  += this.entry_scene( data, id, data[scene]["label"], "big" );
        	        	}
        	        else if (this.edit_mode && data[scene]["visible"] == "no") {
	        	        var id = "scene_"+scene;
        	        	menu  += this.entry_scene( data, id, data[scene]["label"], "big" );
        	        	}
	                }

		// replace old menu
    		setTextById(menuItems,menu);
		}

	// write small button for device
	this.entry_device         = function(data, id, label, style) {
		var disabled, label2;
		var button = id.split("_");
		
		if (data[button[1]]["visibility"] == "none") { return; }
		if (data[button[1]]["image"]) { label  = data[button[1]]["image"]; } 
		if (data[button[1]]["label"]) { label2 = data[button[1]]["label"]; }

		var d = this.button_image( label, style );
 		return this.button( id, d[0], style, 'rm3remotes.create("device","' + button[1] + '");setNavTitle("' + label2 + '");', "" );
		}

	// write big button for scene
	this.entry_scene          = function(data, id, label, style) {
		var disabled;
		var d = this.button_image( label, style );
		var i = id.split("_");
		return this.button( id, d[0], "big", 'rm3remotes.create("scene","' + i[1] + '");setNavTitle("' + label + '");', "" );
		}

        // standard standard button
        this.button               = function(id, label, style, script_apiCommandSend, disabled ){
                return "<button id='" + id + "' class='button " + style + "' onclick='javascript:" + script_apiCommandSend + "' " + disabled + ">" + label + "</button>";
                }

        // check if image exists for button
        this.button_image         = function(label,style) {

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
	this.remoteToggleEditMode = function() {
		if (this.edit_mode)  { this.edit_mode = false; }
		else                 { this.edit_mode = true; }
		}	

        // handle messages for console
        this.log                  = function(msg) {
                console.log(this.app_name + ": " + msg);
                }

	// create image tag for icons
	this.image                = function(file) {
	        return "<img src='icon/"+file+"' style='height:15px;margin:0px;padding:0px;' alt='"+file+"' />";
	        }
	}


//-----------------------------
// EOF


