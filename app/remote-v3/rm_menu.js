//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------
/* INDEX:
function rmMenu(name, menu)
        this.init                 = function(data)
    		window.onresize = function(event)
        this.menu_height	  = function()
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
    			width  = window.innerWidth;
    			document.getElementById("menuItems").style.maxHeight  = height + "px"; 
    			document.getElementById("menuItems2").style.maxHeight = height + "px"; 
    			rm3menu.menu_height();	
    			
    			if (width > 875) {
	    			document.getElementById("menuItems").style.visibility = "hidden"; 
	    			}
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

//-----------------------------
// EOF

