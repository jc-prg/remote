//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------

function rmStart(name) {

	this.data        = {}
	this.app_name    = name;
	this.edit_mode   = false;
	this.initial_load = true;
	this.logging     = new jcLogging(this.app_name);

        // load data with devices (deviceConfig["devices"])
	this.init                 = function(data) {
        
        if (data["CONFIG"]) { this.data = data; }
        else                { return; }

        if (this.initial_load) {
            this.logging.default("Initialized new class 'rmStart'.");
            this.initial_load = false;
            }
        else {
            this.logging.default("Reload data 'rmStart'.");
            }
        }


	// add links to devices to drop down menu
	this.add_devices          = function(data,menuItems) {
	
		// set vars
        var menu    = "";
		rm3remotes.active_type = "start";

        // no edit mode in start menu
        elementHidden("frame1");
        elementHidden("frame2");

		// create small buttons for devices
        for (var key in data) { data[key]["position"] = data[key]["settings"]["position"]; }
		var order  = sortDict(data,"position");
		for (var key in order) {
			device = order[key];
			if (device != "default") {
				if (data[device]["settings"]["visible"] == "yes") {
					var id     = "device_"+device;
        				menu  += this.entry_device( data, id, device, "small" );
					}
			        else if (this.edit_mode && data[device]["settings"]["visible"] == "no") { 
					var id     = "device_"+device;
			        	menu  += this.entry_device( data, id, device, "small_edit" );
			        	}
			        }
		}

		// replace old menu
        setTextById(menuItems,menu);
        setTextById("frame1","");
        setTextById("frame2","");
		}


	// add links to scenes to drop down menu
	this.add_scenes           = function(data,menuItems) {

		// set vars
        var menu = "";
        rm3remotes.active_type = "start";

        // no edit mode in start menu
        elementHidden("frame1");
        elementHidden("frame2");

		// create big buttons for scenes
        for (var key in data) { data[key]["position"] = data[key]["settings"]["position"]; }
		var order  = sortDict(data,"position");		
        for (var key in order) {
			scene  = order[key];
			if (data[scene]["settings"]["image"]) { var image  = data[scene]["settings"]["image"]; } else { var image = ""; }
			if (data[scene]["settings"]["label"]) { var label  = data[scene]["settings"]["label"]; } else { var label = key; }
			if (data[scene]["settings"]["size"])  { var size   = data[scene]["settings"]["size"]; }  else { var size  = "big"; }
			
			if (data[scene]["settings"]["visible"] == "yes") {
	        	        var id = "scene_"+scene;
        	        	menu  += this.entry_scene( data, id, label, image, size );
        	        	}
        	        else if (this.edit_mode && data[scene]["settings"]["visible"] == "no") {
	        	        var id = "scene_"+scene;
        	        	menu  += this.entry_scene( data, id, label, image, size+"_edit" );
        	        	}
	                }
    		// replace old menu
    		setTextById(menuItems,menu);
		}

	// write small button for device
	this.entry_device         = function(data, id, label, style) {
		var disabled, label2;
		var button = id.split("_");
		
		if (data[button[1]]["settings"]["visibility"] == "none") { return; }
		if (data[button[1]]["settings"]["image"]) { label  = data[button[1]]["settings"]["image"]; } 
		if (data[button[1]]["settings"]["label"]) { label2 = data[button[1]]["settings"]["label"]; }

		var d = this.button_image( label, style );
 		return this.button( id, d[0], style, 'rm3remotes.create("device","' + button[1] + '");setNavTitle("' + label2 + '");', "" );
		}

	// write big button for scene
	this.entry_scene          = function(data, id, label, image, style) {
		var disabled;
		var d = this.button_image( label, style );
		var i = id.split("_");
		return this.button( id, d[0], style, 'rm3remotes.create("scene","' + i[1] + '");setNavTitle("' + label + '");', "", image );
		}

        // standard standard button
	this.button               = function(id, label, style, script_apiCommandSend, disabled, image="" ){
		bgimage = "";
		if (image != "") { 
		
			var scene_images  = this.data["CONFIG"]["elements"]["scene_images"];
			if (scene_images[image]) {
				image = scene_images[image][0];
				}
				
			bgimage = "style='background-image:url("+rm3scene_dir+image+");'"
			return "<button id='" + id + "' class='button " + style + "' onclick='javascript:" + script_apiCommandSend + "' " + disabled + " " + bgimage + "></button>";
			}
		else {
			return "<button id='" + id + "' class='button " + style + "' onclick='javascript:" + script_apiCommandSend + "' " + disabled + " >" + label + "</button>";
			}
                }

        // check if image exists for button
	this.button_image         = function(label,style) {

                // set vars
                var button_color = this.data["CONFIG"]["elements"]["button_colors"];  // definition of button color
                var button_img2  = this.data["CONFIG"]["elements"]["button_images"];  // definition of images for buttons (without path and ".png")
                var button_img   = [];
                for (var key in button_img2) { button_img[key] = this.image(button_img2[key]); }

                // check label
                if (button_color && label in button_color)	{ style = style + " bg" + label + " "; }
                if (label in button_img && showImg ) 	{ label = button_img[label]; }
                return [label, style];
                }
                
	// create image tag for icons
	this.image                = function(file) {
	        return "<img src='icon/"+file+"' style='height:15px;margin:0px;padding:0px;' alt='"+file+"' />";
	        }
	}


//-----------------------------
// EOF


