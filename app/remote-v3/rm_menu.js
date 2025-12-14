//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------

let rmMenu_visibleWidth = 875;

class rmMenu {
    constructor(name, menu) {

        this.menuItems     = menu;
        this.app_name      = name;
        this.data          = {};
        this.edit_mode     = false;
        this.initial_load  = true;
        this.logging       = new jcLogging(this.app_name);
        this.hide_settings = "rm3settings.hide_settings();";

    }

    // load data with devices (deviceConfig["devices"])
    init(data) {

        if (data["CONFIG"]) { this.data = data; }
        else                { return; }

        if (this.initial_load) {
            this.logging.default("Initialized new class 'rmMenu'.");
            this.initial_load = false;
            }
        else {
            this.logging.default("Reload data 'rmMenu'.");
            }

        this.writeMenu("");

        // define variable menu size (scroll bars defined in app-menu.css)
        window.onresize = function(event) {
            let height = (window.innerHeight - 70);
            let width  = window.innerWidth;
            document.getElementById("menuItems").style.maxHeight  = height + "px";
            document.getElementById("menuItems2").style.maxHeight = height + "px";
            rm3menu.menu_height();

            if (document.getElementById("remote_nav").style.display !== "block") {
                document.getElementById("menuItems").style.visibility = "hidden";
                }
        }

        let height = (window.innerHeight - 70);
        document.getElementById("menuItems").style.maxHeight  = height + "px";
        document.getElementById("menuItems2").style.maxHeight = height + "px";
        this.menu_height();
    }

    // add links to scenes to drop down menu
    add_link(link, label) {
        let menu = this.readMenu();
        menu += menuEntry(link,label);
        this.writeMenu(menu);
    }

    // add links to scenes to drop down menu
    add_script(script, label) {

        let menu = this.readMenu();
        menu += this.entry_script(script,label);
        this.writeMenu(menu);
    }

    // add links to scenes to drop down menu
    add_scenes(data) {

        // return if no data
        if (data) {} else { return; }

        let menu = this.readMenu();
        let error;
        if (this.data["STATUS"])    { error = this.data["STATUS"]["config_errors"]["scenes"]; }
        else                        { error = {}; }

        for (let key in data) { data[key]["position"] = data[key]["settings"]["position"]; }
        let order  = sortDict(data,"position");

        if (order.length > 0) {
            for (let j = 0; j < order.length; j++) {
                let scene = order[j];
                if (data[scene]["settings"]["label"]) {
                    if (scene in error) {
                        if (data[scene]["settings"]["visible"] !== "no") {
                            menu += this.entry_scene(scene, "<div class=#entry_error#>! " + data[scene]["settings"]["label"] + "</div>");
                            console.warn("addScenes: " + scene);
                            console.warn(error[scene]);
                        } else if (this.edit_mode) {
                            menu += this.entry_scene(scene, "<div class=#entry_error#>.(" + data[scene]["settings"]["label"] + ").</div>");
                        }
                    } else {
                        if (data[scene]["settings"]["visible"] !== "no") {
                            menu += this.entry_scene(scene, data[scene]["settings"]["label"]);
                        } else if (this.edit_mode) {
                            menu += this.entry_scene(scene, "<div class=#hidden_entry_edit#>.(" + data[scene]["settings"]["label"] + ").</div>");
                        }
                    }
                }
            }
        }
        else {
            menu += this.entry_script("rm3settings.create('edit_scenes');", lang("ADD_SCENE") + " ...")
        }
        this.writeMenu(menu + "<li><hr/></li>");
    }

    // add links to devices to drop down menu
    add_devices(data) {

        // return if no data
        if (!data) { return; }

        // set vars
        let error  = {};
        let menu   = this.readMenu();
        if (this.data["STATUS"] && this.data["STATUS"]["config_errors"] && this.data["STATUS"]["config_errors"]["devices"])   {
            error  = this.data["STATUS"]["config_errors"]["devices"];
        }

        for (let key in data) {
            if (data[key]["settings"]["position"]) {
                data[key]["position"] = data[key]["settings"]["position"];
            }
        }

        let order  = sortDict(data,"position");
        let i      = 0;
        if (order.length > 0) {
            for (let j = 0; j < order.length; j++) {
                let device = order[j];
                if (device !== "default") {

                    if (device in error) {
                        if (data[device]["settings"]["visible"] !== "no") {
                            menu += this.entry_device(device, "<div class=#entry_error#>! " + data[device]["settings"]["label"] + "</div>");
                        } else if (this.edit_mode) {
                            menu += this.entry_device(device, "<div class=#entry_error#>.(" + data[device]["settings"]["label"] + ").</div>");
                        }
                    } else {
                        if (data[device]["settings"]["visible"] !== "no") {
                            menu += this.entry_device(device, data[device]["settings"]["label"]);
                        } else if (this.edit_mode) {
                            menu += this.entry_device(device, "<div class=#hidden_entry_edit#>.(" + data[device]["settings"]["label"] + ").</div>");
                        }
                    }
                }
            }
        }
        else {
            menu += this.entry_script("rm3settings.create('edit_devices');", lang("ADD_DEVICE") + " ...")
        }

        this.writeMenu(menu + "<li><hr/></li>");
    }

    // hide menu when clicked
    click_menu() {
        if (document.getElementById("remote_nav").style.display !== "block") {
            document.getElementById("menuItems").style.visibility = "hidden";
        }
    }

    // create menu entry for a device
    entry_device(device, label) {

            return "<li><a onclick=\"rm3remotes.create('device','" + device + "');rm3settings.hide();"+this.app_name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
            }

    // create menu entry for a scene
    entry_scene(scene, label) {

        return "<li><a onclick=\"rm3remotes.create('scene','" + scene + "');rm3settings.hide();"+this.app_name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
    }

    // create menu entry with javascript
    entry_script(script, label) {

        return "<li><a onClick=\"" + script + ";"+this.app_name+".click_menu();\">"+label+"</a></li>";
    }

    // create menu entry with link
    entry_link(link, label) {

        return "<li><a href=\"" + link + "\" target=\"_blank\">" + label + "</a></li>";
    }

    // get existing menu items
    readMenu() {
        if (typeof this.menuItems == "string") {
            return getTextById(this.menuItems);
        }
        else if (typeof this.menuItems == "object") {
            return getTextById(this.menuItems[0]);
        }
    }

    // set menu height to page height
    menu_height() {
        document.getElementById("remote_nav").style.maxHeight = "100px";
            let height = pageHeight();
            height -= 50;
            document.getElementById("remote_nav").style.maxHeight = height+ "px"; // window.innerHeight + "px"; //
        }

    // write menu
    writeMenu(menu_text) {
        if (typeof this.menuItems == "string") {
            setTextById(this.menuItems,menu_text);
            }
        else if (typeof this.menuItems == "object") {
            for (var i=0; i<this.menuItems.length; i++) {
                setTextById(this.menuItems[i],menu_text);
                }
            }
    }

}

