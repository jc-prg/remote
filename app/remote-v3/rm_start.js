//--------------------------------
// jc://remote/
//--------------------------------


/* class to create the start menu */
class RemoteStart {

    constructor(name) {
        this.data         = {}
        this.app_name     = name;
        this.edit_mode    = false;
        this.initial_load = true;
        this.logging      = new jcLogging(this.app_name);
    }

    /* load configuration data */
    init(data) {

        if (data["CONFIG"])  { this.data = data; }
        else                 { return; }

        if (this.initial_load) {
            this.logging.default("Initialized new class 'RemoteStart'.");
            this.initial_load = false;
        }
        else {
            this.logging.default("Reload data 'RemoteStart'.");
        }
    }

    /* add links to scenes to drop down menu */
    add_scenes(data, menuItems) {

            // set vars
            let menu = "";
            rm3remotes.active_type = "start";

            // no edit mode in start menu
            elementHidden("frame1");
            elementHidden("frame2");

            // create big buttons for scenes
            for (let key in data) { data[key]["position"] = data[key]["settings"]["position"]; }
            let order  = sortDict(data,"position");
            for (let key in order) {
                let scene  = order[key];
                let image, label, size = "";
                if (data[scene]["settings"]["image"]) { image  = data[scene]["settings"]["image"]; } else { image = ""; }
                if (data[scene]["settings"]["label"]) { label  = data[scene]["settings"]["label"]; } else { label = key; }
                if (data[scene]["settings"]["size"])  { size   = data[scene]["settings"]["size"]; }  else { size  = "big"; }

                if (data[scene]["settings"]["visible"] === "yes") {
                    let id = "scene_"+scene;
                    menu  += this.entry_scene( data, id, label, image, size );
                }
                else if (this.edit_mode && data[scene]["settings"]["visible"] === "no") {
                    let id = "scene_"+scene;
                    menu  += this.entry_scene( data, id, label, image, size+"_edit" );
                }
            }

            menu = "<div class='rm-button-grid scene-buttons'>" + menu + "</div>";

            // replace old menu
            setTextById(menuItems,menu);
        }

    /* add links to devices to drop down menu */
    add_devices(data, menuItems) {

            // set vars
            let menu = "";
            rm3remotes.active_type = "start";

            // no edit mode in start menu
            elementHidden("frame1");
            elementHidden("frame2");

            // create small buttons for devices
            for (let key in data) { data[key]["position"] = data[key]["settings"]["position"]; }
            let order  = sortDict(data,"position");
            if (Object.keys(order).length > 0) {
                for (let key in order) {
                    let device = order[key];
                    if (device !== "default") {
                        if (data[device]["settings"]["visible"] === "yes") {
                            let id = "device_" + device;
                            menu += this.entry_device(data, id, device, "small");
                        } else if (this.edit_mode && data[device]["settings"]["visible"] === "no") {
                            let id = "device_" + device;
                            menu += this.entry_device(data, id, device, "small_edit");
                        }
                    }
                }
                menu = "<div class='rm-button-grid device-buttons'>" + menu + "</div>";
            }
            else {
                menu = "<div style='width:100%;text-align:center;padding:15px;'>" + lang("DEVICES_NOT_DEFINED_YET") +
                    "<br/><div onclick='rm3settings.create('index');'><u>" + lang("DEVICES_ADD_SETTINGS") + "</u></div>" +
                    "</div>";
            }

            // replace old menu
            setTextById(menuItems,menu);
            setTextById("frame1","");
            setTextById("frame2","");
        }

    /* create small button for device */
    entry_device(data, id, label, style) {
        let label2;
        let button = id.split("_");

        if (data[button[1]]["settings"]["visibility"] === "none") { return; }
        if (data[button[1]]["settings"]["image"]) { label  = data[button[1]]["settings"]["image"]; }
        if (data[button[1]]["settings"]["label"]) { label2 = data[button[1]]["settings"]["label"]; }

        let d = this.button_image( label, style );
        return this.button( id, d[0], style, 'rm3remotes.create("device","' + button[1] + '");setNavTitle("' + label2 + '");', "" );
    }

    /* create big button for scene */
    entry_scene(data, id, label, image, style) {
        let d = this.button_image( label, style );
        let i = id.split("_");
        return this.button( id, d[0], style, 'rm3remotes.create("scene","' + i[1] + '");setNavTitle("' + label + '");', "", image );
    }

    /* switch from and to edit mode */
    set_edit_mode() {
            if (this.edit_mode)  {
                elementVisible("frame3");
                elementVisible("frame4");
            }
            rm3settings.settings_ext_reset();
        }

    /* create standard button */
    button(id, label, style, script_apiCommandSend, disabled, image="" ) {
        let background_image = "";
        if (image !== "") {
            let scene_images  = this.data["CONFIG"]["elements"]["scene_images"];
            if (scene_images[image]) {
                image = scene_images[image][0];
            }

            background_image = "style='background-image:url("+rm3scene_dir+image+");'"
            return "<button id='" + id + "' class='rm-button " + style + "' onclick='javascript:" + script_apiCommandSend + "' " + disabled + " " + background_image + "></button>";
        }
        else {
            return "<button id='" + id + "' class='rm-button " + style + "' onclick='javascript:" + script_apiCommandSend + "' " + disabled + " >" + label + "</button>";
        }
    }

    /* create image tag for icons */
    image(file) {

        return "<img src='icon/"+file+"' class='rm-button_image_start' alt='"+file+"' />";
    }

    /* get button image */
    button_image(label, style) {

        // set vars
        let button_color = this.data["CONFIG"]["elements"]["button_colors"];  // definition of button color
        let button_img2  = this.data["CONFIG"]["elements"]["button_images"];  // definition of images for buttons (without path and ".png")
        let button_img   = [];
        for (let key in button_img2) { button_img[key] = this.image(button_img2[key]); }

        // check label
        if (button_color && label in button_color)  { style = style + " bg" + label + " "; }
        if (label in button_img && showImg )        { label = button_img[label]; }
        return [label, style];
    }
}

