//--------------------------------
// jc://remote/
//--------------------------------
// class for drop down menu
//--------------------------------


class RemoteMenu extends RemoteDefaultClass {
    constructor(name, menu) {
        super(name);

        this.menuItems      = menu;
        this.data           = {};
        this.edit_mode      = false;
        this.edit_mode_show = false;
        this.initial_load   = true;
    }

    // load data with devices (deviceConfig["devices"])
    init(data) {
        this.data = data

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
            rmMenu.menu_height();

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
    add_script(script, label, click_menu) {

        let menu = this.readMenu();
        menu += this.entry_script(script,label,click_menu);
        this.writeMenu(menu);
    }

    // add links to scenes to drop down menu
    add_scenes(data) {

        // return if no data
        if (data) {} else { return; }

        let menu = this.readMenu();
        let error = rmStatus.status_system("config_errors")["scenes"];

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
                        } else if (this.edit_mode_show) {
                            menu += this.entry_scene(scene, "<div class=#entry_error#>.(" + data[scene]["settings"]["label"] + ").</div>");
                        }
                    } else {
                        if (data[scene]["settings"]["visible"] !== "no") {
                            menu += this.entry_scene(scene, data[scene]["settings"]["label"]);
                        } else if (this.edit_mode_show) {
                            menu += this.entry_scene(scene, "<div class=#hidden_entry_edit#>.(" + data[scene]["settings"]["label"] + ").</div>");
                        }
                    }
                }
            }
        }
        else {
            menu += this.entry_script("rmSettings.create('edit_scenes');", lang("ADD_SCENE") + " ...")
        }
        this.writeMenu(menu + "<li><hr/></li>");
    }

    // add links to devices to drop down menu
    add_devices(data) {

        // return if no data
        if (!data) { return; }

        // set vars
        let error = rmStatus.status_system("config_errors")["devices"];
        let menu = this.readMenu();

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
                        } else if (this.edit_mode_show) {
                            menu += this.entry_device(device, "<div class=#entry_error#>.(" + data[device]["settings"]["label"] + ").</div>");
                        }
                    } else {
                        if (data[device]["settings"]["visible"] !== "no") {
                            menu += this.entry_device(device, data[device]["settings"]["label"]);
                        } else if (this.edit_mode_show) {
                            menu += this.entry_device(device, "<div class=#hidden_entry_edit#>.(" + data[device]["settings"]["label"] + ").</div>");
                        }
                    }
                }
            }
        }
        else {
            menu += this.entry_script("rmSettings.create('edit_devices');", lang("ADD_DEVICE") + " ...")
        }

        this.writeMenu(menu + "<li><hr/></li>");
    }

    // entry show / hide hidden remotes
    add_show_hidden() {
        if (this.edit_mode) {
            let message;
            if (this.edit_mode_show) { message = lang("MENU_SHOW_HIDDEN_OFF"); }
            else { message = lang("MENU_SHOW_HIDDEN_ON"); }
            this.add_script(this.name+".toggle_invisible();", "<div class=\"hidden_entry_edit\">" + message + "</div>", false);
        }
    }

    // hide menu when clicked
    click_menu() {
        if (document.getElementById("remote_nav").style.display !== "block") {
            document.getElementById("menuItems").style.visibility = "hidden";
        }
    }

    // create menu entry for a device
    entry_device(device, label) {

            return "<li><a onclick=\"rmRemote.create('device','" + device + "');rmSettings.hide();"+this.name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
            }

    // create menu entry for a scene
    entry_scene(scene, label) {

        return "<li><a onclick=\"rmRemote.create('scene','" + scene + "');rmSettings.hide();"+this.name+".click_menu();\" >" + label.replace(/#/g,"'") + "</a></li>";
    }

    // create menu entry with javascript
    entry_script(script, label, click_menu=true) {

        let click = "";
        if (click_menu === true) { click = this.name+".click_menu();"; }
        return "<li><a onClick=\"" + script + ";"+click+"\">"+label+"</a></li>";
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
            for (let i=0; i<this.menuItems.length; i++) {
                setTextById(this.menuItems[i],menu_text);
                }
            }
    }

    // show / hide hidden remotes as link
    toggle_invisible() {
        this.edit_mode_show = !this.edit_mode_show;
        remoteDropDown_load();
    }

}

