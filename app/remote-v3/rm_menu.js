//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------
/* INDEX:
function rmMenu(name, menu)
        this.init                 = function(data)
    		window.onresize = function(event)
        this.click_menu          = function()
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
        this.writeMenu            = function(menutext)
        this.readMenu             = function()
*/
//--------------------------------

var rmMenu_visibleWidth = 875;

function rmMenu(name, menu) {

	this.menuItems   = menu;
	this.app_name    = name;
	this.data        = {};
	this.edit_mode   = false;
	this.inital_load = true;
	this.logging     = new jcLogging(this.app_name);

        // load data with devices (deviceConfig["devices"])
        this.init                 = function(data) {

        	if (data["DATA"]) 	{ this.data = data; }
        	else			{ return; }

                if (this.initial_load) { 
                	this.logging.default("Initialized new class 'rmMenu'.");
                	this.inital_load = false;
                	}
                else {	this.logging.default("Reload data 'rmMenu'.");
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
    			
    			if (width > rmMenu_visibleWidth) {
	    			document.getElementById("menuItems").style.visibility = "hidden"; 
	    			}
			}

		height = (window.innerHeight - 70);
		document.getElementById("menuItems").style.maxHeight  = height + "px"; 
		document.getElementById("menuItems2").style.maxHeight = height + "px";
		this.menu_height();	
                }
                
        this.click_menu          = function() {
    			height       = (window.innerHeight - 70);
    			width        = window.innerWidth;
    			menuDropDown = document.getElementById("menuItems");

			if (width < rmMenu_visibleWidth) {
				if (menuDropDown.style.visibility == "hidden")   { menuDropDown.style.visibility = "visible"; }
				else                                             { menuDropDown.style.visibility = "hidden"; }
     				}
			else                                                     { menuDropDown.style.visibility = "hidden"; }
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
    		for (var key in data) { if (data[key]["settings"]["position"]) { data[key]["position"] = data[key]["settings"]["position"]; }}
		var order  = sortDict(data,"position");
    		var i      = 0;
		for (var j=0;j<order.length;j++) {
			device = order[j];
			if (device != "default") {
			        if (data[device]["settings"]["visible"] != "no")	{ menu  += this.entry_device( device, data[device]["settings"]["label"] ); }
			        else if (this.edit_mode)				{ menu  += this.entry_device( device, "<div class=#hidden_entry_edit#>.(" + data[device]["settings"]["label"] + ").</div>" ); }
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
    		
    		for (var key in data) { data[key]["position"] = data[key]["settings"]["position"]; }    		
		var order  = sortDict(data,"position");
		
		for (var j=0;j<order.length;j++) {
			scene = order[j];
			if (data[scene]["settings"]["label"]) {
			        if (data[scene]["settings"]["visible"] != "no")	{ menu  += this.entry_scene( scene, data[scene]["settings"]["label"] ); }
			        else if (this.edit_mode)				{ menu  += this.entry_scene( scene, "<div class=#hidden_entry_edit#>.(" + data[scene]["settings"]["label"] + ").</div>" ); }
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
  		return "<li><a onClick=\"javascript:" + script + ";"+this.app_name+".click_menu();\">"+label+"</a></li>";
		}

	this.entry_device         = function(device,label) {
		return "<li><a onclick=\"rm3remotes.create('device','" + device + "');rm3settings.hide();"+this.app_name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
		}

	this.entry_scene          = function(scene,label) {
		return "<li><a onclick=\"rm3remotes.create('scene','" + scene + "');rm3settings.hide();"+this.app_name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
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


