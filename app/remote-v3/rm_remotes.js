//--------------------------------
// jc://remote/
//--------------------------------


/*
* class to create and edit remote controls (scene and device)
*/
class RemoteMain {

    constructor(name) {
        this.data = {};
        this.templates = {};
        this.app_name = name;
        this.active_name = "";
        this.active_type = "";
        this.active_buttons = [];
        this.active_channels = [];
        this.edit_mode = false;
        this.initial_load = true;
        this.input_width = "";

        this.frames_edit = ["frame1", "frame2"];
        this.frames_remote = ["frame3", "frame4", "frame5"];
        this.frames_notouch = false;

        this.basic = new RemoteBasicElements(name + ".basic");		// rm_remotes-elements.js
        this.button = new RemoteElementButtons(name + ".button");			// rm_remotes-elements.js
        this.display = new RemoteElementDisplay(name + ".display");		// rm_remotes-elements.js
        this.json = new RemoteJsonHandling(name + ".json");		// rm_remotes-elements.js

        this.tab = new RemoteElementTable(name + ".tab");		// rm_remotes-elements.js
        this.keyboard = new rmRemoteKeyboard(name + ".keyboard");	// rm_remotes-keyboard.js

        this.advanced = new RemoteAdvancedElements(name + ".element", this);

        this.logging = new jcLogging(this.app_name);
        this.tooltip = new jcTooltip(this.app_name + ".tooltip");	// rm_remotes-elements.js

        this.rm_scene = new RemoteJsonElements(this.app_name + ".rm_scene", "scene", this);
        this.rm_device = new RemoteJsonElements(this.app_name + ".rm_device", "device", this);
        this.dialog_scene = new RemoteEditDialogs(name + ".dialog_scene", "scene", this);
        this.dialog_device = new RemoteEditDialogs(name + ".dialog_device", "device", this);
    }

    /* load data with devices (deviceConfig["devices"]) */
    init(data) {

        if (data["CONFIG"]) {
            this.data = data;
            this.button.data = data;
            this.display.data = data;

            this.templates = data["CONFIG"]["templates"]["list"];
        } else {
            return;
        }

        if (this.initial_load) {
            this.tooltip_mode = "onmouseover";
            this.tooltip_width = "140px";
            this.tooltip_height = "140px";
            this.tooltip_distance = 47;

            this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
            this.logging.default("Initialized new class 'rmRemotes'.");
            this.initial_load = false;
        } else {
            this.logging.default("Reload data 'rmRemotes'.");
        }
    }

    /* create complete remote setup (for scenes and devices) */
    create(type = "", rm_id = "") {

        if (type === "") {
            type = this.active_type;
        }
        if (rm_id === "") {
            rm_id = this.active_name;
        }
        if (rm_id === "") {
            this.logging.warn("No Remote Id given ...");
            return;
        }

        if (!("CONFIG" in this.data)) {
            this.logging.warn("Data not loaded yet.");
            return;
        }
        if (rm_id !== "" && this.data["CONFIG"]["devices"][rm_id] === undefined && this.data["CONFIG"]["scenes"][rm_id] === undefined) {
            this.logging.warn("Remote ID " + rm_id + " not found.");
            appCookie.set("remote", ""); //device::"+device+"::"+remote_label);
            return;
        }

        // format frame1, frame2 for edit mode
        document.getElementById(this.frames_edit[0]).className = "setting_bg";
        document.getElementById(this.frames_edit[1]).className = "setting_bg";

        // disable touch-action on remotes
        if (this.frames_notouch) {
            document.getElementById("frame1").style.touchAction = "none";
            document.getElementById("frame2").style.touchAction = "none";
            document.getElementById("frame3").style.touchAction = "none";
            document.getElementById("frame4").style.touchAction = "none";
            document.getElementById("frame5").style.touchAction = "none";
        }

        // set active remote (type, id)
        this.active_name = rm_id;
        this.active_type = type;
        this.active_buttons = [];
        this.active_channels = [];


        this.keyboard.set_device(this.active_name);
        this.button.data = this.data;
        this.display.data = this.data;

        rm3start.active = "start";
        startActive = false;

        let edit_mode = "";
        if (this.edit_mode) {
            edit_mode = " / EDIT";
            elementVisible(this.frames_edit[0]);
            elementVisible(this.frames_edit[1]);
            elementHidden("setting_ext_top_frame");
            elementHidden("setting_ext_frames");
        } else {
            rm3settings.settings_ext_reset();
            elementHidden(this.frames_edit[0]);
            elementHidden(this.frames_edit[1]);
            document.getElementById(this.frames_edit[0]).style.display = "none";
        }

        if (type === "device") {

            setNavTitle(this.data["CONFIG"]["devices"][rm_id]["settings"]["label"] + edit_mode);

            // set vars
            this.logging.default("Write Device Remote Control: " + rm_id);

            // create remote for device
            this.device_remote(this.frames_remote[0], rm_id);
            this.device_description(this.frames_remote[1], rm_id);
            this.device_not_used(this.frames_remote[2], rm_id);

            // create edit panels
            this.device_edit(this.frames_edit[0], rm_id);
            this.device_edit_json(this.frames_edit[1], rm_id);

            // show
            this.show(rm_id);
            scrollTop();
        } else if (type === "scene") {

            setNavTitle(this.data["CONFIG"]["scenes"][rm_id]["settings"]["label"] + edit_mode);

            // set vars
            this.logging.default("Write Scene Remote Control: " + rm_id);

            // create remote for scene
            this.scene_remote(this.frames_remote[0], rm_id);
            this.scene_description(this.frames_remote[1], rm_id);
            this.scene_channels(this.frames_remote[2], rm_id);

            // create edit panels
            this.scene_edit(this.frames_edit[0], rm_id);
            this.scene_edit_json(this.frames_edit[1], rm_id);

            // show
            this.show();
            scrollTop();
        } else {
            startActive = true;
        }

        rm3menu.menu_height();
    }

    /* create from unsaved data for preview */
    preview(type, name) {

        if (type === "scene") {
            this.rm_scene.preview(name);
        } else {
            this.rm_device.preview(name);
        }
    }

    // DEVICE REMOTES - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /* create remote for a specific device */
    device_remote(id = "", device = "", preview_remote = "", preview_display = "", preview_display_size = "") {

        let preview = false;
        let remote = "<div id='remote_button' style='display:block'>";
        let device_config = this.data["CONFIG"]["devices"][device];

        let context_menu;
        let remote_label = "";
        let remote_buttons = [];
        let remote_display_size = "";
        let remote_definition = [];
        let remote_display = {};

        this.button.default_size();

        if (device_config && device_config["remote"]) {
            remote_display_size = device_config["remote"]["display-size"];
            remote_label = device_config["settings"]["label"];
            remote_buttons = device_config["buttons"];
            this.active_label = remote_label;
        } else {
            if (this.data["STATUS"]["config_errors"]["devices"][device]) {
                let errors = this.data["STATUS"]["config_errors"]["devices"][device];
                remote += "<b class='entry_error'>" + lang("REMOTE_CONFIG_ERROR", [device]) + "</b>";
                remote += "<hr/><ul>";
                for (let key in errors) {
                    remote += "<li><u>" + key + "</u>:<br/>" + errors[key] + "</li>";
                }
                remote += "</ul>";
            } else {
                remote += lang("REMOTE_CONFIG_ERROR_UNKNOWN", [device]);
            }
            remote += "</div>";
            setTextById(id, remote);
            appMsg.alert(lang("MISSING_DATA", [device, device_config["interface"]["remote"] + ".json",
                device_config["config"]["device"] + ".json"]));
            return;
        }

        // -------------------> ??? Update to new API definition


        // check data for preview
        if (preview_remote === "") {
            remote_definition = device_config["remote"]["remote"];
        } else {
            remote_definition = this.json.get_value(preview_remote, device_config["remote"]["remote"]);
            preview = true;
        }
        if (preview_display === "") {
            remote_display = device_config["remote"]["display"];
        } else {
            remote_display = this.json.get_value(preview_display, device_config["remote"]["display"]);
            preview = true;
        }
        if (preview_display_size === "") {
            remote_display_size = device_config["remote"]["display-size"];
        } else {
            remote_display_size = this.json.get_value(preview_display_size, device_config["remote"]["display-size"]);
            preview = true;
        }
        if (remote_display_size === undefined) {
            remote_display_size = "middle";
        }

        // create remote control
        appCookie.set("remote", "device::" + device + "::" + remote_label + "::" + this.edit_mode + "::" + easyEdit + "::" + remoteHints);
        console.info("Set cookie: " + "device::" + device + "::" + remote_label + "::" + this.edit_mode + "::" + easyEdit + "::" + remoteHints);

        // add preview hint or error message container
        if (preview) {
            remote += "<b>" + lang("PREVIEW") + ":</b><br/><hr/>";
        } else {
            remote += "<div id='remote-power-information-" + device + "' class='remote-power-information' onclick='statusCheck_bigMessage(\"remote-power-information-" + device + "\");'>POWER INFORMATION</div>";
        }

        // add edit button
        let edit_cmd = "remoteToggleEditMode(true);rm3remotes.create(\"device\",\"" + device + "\");";
        if (!this.edit_mode && easyEdit) {
            remote += "<div class='remote-edit-button' onclick='" + edit_cmd + "'><img src='icon/edit.png' alt='' style='height:20px;width:20px;'></div>";
        }

        // add remote buttons
        for (let i = 0; i < remote_definition.length; i++) {

            let next_button;
            let button = remote_definition[i];
            let cmd = device + "_" + button;
            let button_style = "";
            this.display.edit_mode = this.edit_mode;

            if (this.edit_mode) {
                context_menu = "[" + i + "] <b>" + cmd.split("||")[0] + "</b><br/><br/>";
                let link_preview = this.app_name + ".rm_device.preview('" + device + "');";
                let link_delete = this.app_name + ".rm_device.delete_button('" + device + "','" + i + "');";
                let link_move_left = this.app_name + ".rm_device.move_button('" + device + "'," + i + ",'left');";
                let link_move_right = this.app_name + ".rm_device.move_button('" + device + "'," + i + ",'right');";
                let link_button_left = this.app_name + ".rm_device.add_button('" + device + "','add_button_" + i + "','" + i + "');";
                let link_button_right = this.app_name + ".rm_device.add_button('" + device + "','add_button_" + i + "','" + (i + 1) + "');";
                this.button.width = "50px;"
                let input_add_button = "<br/>&nbsp;<br/><input id='add_button_" + i + "' style='width:100px'><br/>&nbsp;<br/>" +
                    this.button.edit(link_button_left + link_preview, "&lt; +") +
                    this.button.edit(link_button_right + link_preview, "+ &gt;");

                this.button.width = "30px;";
                if (i > 0) {
                    context_menu += this.button.edit(link_move_left + link_preview, "&lt;", "");
                }
                context_menu += this.button.edit(link_delete + link_preview, "x", "");
                if (i + 1 < remote_definition.length) {
                    context_menu += this.button.edit(link_move_right + link_preview, "&gt;", "");
                }
                context_menu += input_add_button;
                button_style = " edit";
            }

            if (button === "LINE") {
                next_button = this.basic.line("");
            } else if (button.indexOf("LINE||") === 0) {
                next_button = this.basic.line(button.split("||")[1]);
            } else if (button.indexOf("SLIDER") === 0) {
                next_button = this.advanced.slider(this.data, id, device, "devices", button.split("||"));
            } else if (button.indexOf("COLOR-PICKER") === 0) {
                next_button = this.advanced.colorPicker(this.data, id, device, "devices", button.split("||"));
            } else if (button.indexOf("TOGGLE") === 0) {
                next_button = this.advanced.toggle(this.data, id, device, "devices", button.split("||"));
            } else if (button === ".") {
                next_button = this.button.device(device + i, ".", device, "empty", "", "disabled")
            } else if (button === "DISPLAY") {
                next_button = this.display.default(id, device, "devices", remote_display_size, remote_display);
            } else if (button === "keyboard") {
                next_button = this.button.device_keyboard(cmd, button, device, "", cmd, "");
                this.active_buttons.push(cmd);
            } else if (remote_buttons.includes(button)) {
                next_button = this.button.device(cmd, button, device, button_style, cmd, "");
                this.active_buttons.push(cmd);
            } else if (this.edit_mode) {
                next_button = this.button.device_add(cmd, button, device, "notfound", cmd, "");
            } else {
                next_button = this.button.device(cmd, button, device, "notfound", cmd, "disabled");
            }

            if (this.edit_mode) {
                if (button.indexOf("LINE") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, 30);
                } else if (button.indexOf("DISPLAY") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
                } else if (button.indexOf("COLOR-PICKER") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
                } else {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
                }

                next_button = this.tooltip.create_inside(next_button, context_menu, i);
            }

            remote += next_button;
        }
        remote += "</div>";

        // --------------------------- test send text ----

        remote += this.keyboard.input();

        // --------------------------- test send text ----
        //remote += this.device_remote_json(id,device,remote_definition,remote_display);

        setTextById(id, remote);
    }

    /* write description for device remote */
    device_description(id, device) {
        let device_data = this.data["CONFIG"]["devices"][device]["settings"];
        let label = device_data["label"];
        let descr = device_data["description"];
        let url = device_data["url"];
        if (url) {
            descr = "<a href=\"" + url + "\" target='_blank'>" + descr + "</a>";
        }

        let str = "";
        str += "<div class='rm-info'>";
        str += "<media-info id='media_info'></media-info>";
        str += "<center>" + label + ": " + descr + "</center>";
        str += "</div>";

        setTextById(id, str);
    }

    /* create list of buttons not used in RM definition (for devices) */
    device_not_used(id, device, preview_remote = "") {

        let device_config = this.data["CONFIG"]["devices"][device];

        if (!device_config || !device_config["remote"] || !device_config["buttons"]) {
            setTextById(id, "");
            return;
        }

        let remote = "";
        let not_used = [];
        let sign = "";
        let remote_buttons = [];
        let next_button = "";
        let display = "";
        this.button.width = "120px";

        let link_preview = this.app_name + ".rm_device.preview('" + device + "');";
        let device_buttons = device_config["buttons"];

        if (preview_remote === "") {
            remote_buttons = device_config["remote"]["remote"];
        } else {
            remote_buttons = this.json.get_value(preview_remote, device_config["remote"]["remote"]);
        }

        // show not used buttons if edit mode
        if (this.edit_mode) {
            display = "block";
            sign = "−";
        } else {
            display = "none";
            sign = "+";
        }

        // identify difference of arrays
        for (let i = 0; i < device_buttons.length; i++) {
            if (remote_buttons.includes(device_buttons[i]) === false) {
                not_used.push(device_buttons[i]);
            }
        }

        // show / hide buttons that are not used
        if (not_used.length > 0) {
            let onclick = this.app_name + ".device_not_used_show_hide();";
            remote += "<div id='show_hide_not_used' onclick='" + onclick + "'>" + sign + "</div>";
        }

        remote += "<div id='buttons_not_used' style='display:" + display + ";position:relative;top:-7px;'>";
        remote += this.basic.line(lang("NOT_USED"));

        // create buttons not used
        for (let i = 0; i < not_used.length; i++) {
            let button = not_used[i];
            let cmd = device + "_" + button;
            next_button = this.button.device("not_used" + i, button, device, "", cmd, "");

            if (this.edit_mode) {
                let link_add = this.app_name + ".rm_device.add_button('" + device + "', 'not_used_" + i + "');";
                let input_add = "<input id='not_used_" + i + "' name='not_used_" + i + "' value='" + button + "' style='display:none;'>";
                let context_menu = input_add + "[" + i + "] " + cmd + "<br/><br/>" + this.button.edit(link_add + link_preview, lang("BUTTON_T_MOVE2REMOTE"), "");

                this.tooltip.settings(this.tooltip_mode, this.tooltip_width, "80px", this.tooltip_distance);
                next_button = this.tooltip.create_inside(next_button, context_menu, "not_used" + i);
            }

            remote += next_button;
        }

        remote += "</div>";

        // print
        setTextById(id, remote);
    }

    /* show / hide buttons that are not used */
    device_not_used_show_hide() {
        const element = document.getElementById("buttons_not_used");
        const button = document.getElementById("show_hide_not_used");
        if (element.style.display === "block") {
            element.style.display = "none";
            button.innerHTML = "+";
        } else {
            element.style.display = "block";
            button.innerHTML = "−";
        }
    }

    /*  panel per remote ... */
    device_edit(id, device) {

        if (this.edit_mode) {
            elementVisible(id);
        } else {
            elementHidden(id, "device_edit");
            return;
        }

        let device_config = this.data["CONFIG"]["devices"][device];

        if (this.data["STATUS"]["config_errors"]["devices"][device] || !device_config || !device_config["remote"]) {
            setTextById(id, "");
            return;
        }

        let remote_buttons = device_config["remote"];
        let remote_visible = device_config["settings"]["visible"];
        let remote_display = device_config["remote"]["display"];
        let device_commands = device_config["buttons"];
        let device_method = device_config["interface"]["method"];
        let device_status = this.data["STATUS"]["devices"][device];
        let device_buttons = [];

        for (let i = 0; i < device_config["remote"].length; i++) {
            let button = device_config["remote"][i];
            if (device_buttons.indexOf(button) < 0) {
                device_buttons.push(button);
            }
        }
        device_buttons.sort();

        this.basic.input_width = "180px";
        this.button.width = "90px";

        let remote = "";
        remote += "<center class='remote_edit_headline'><b>" + lang("EDIT_REMOTE") + " &quot;" + device_config["settings"]["label"] + "&quot;</b> [" + device + "]</center>";
        remote += this.basic.edit_line();

        // Main Settings
        let edit = "";
        let images = this.data["CONFIG"]["elements"]["button_images"];
        let icon = "<img src='icon/" + images[device_config["settings"]["image"]] + "' class='rm-button_image_start'>";
        icon = "<button class='button device_off small' style='height:40px;'><div id='device_edit_button_image'>" + icon + "</div></button>";
        edit += this.tab.start();
        edit += this.tab.row(lang("ID"), "<b>" + device + "</b>");
        edit += this.tab.row(lang("LABEL") + ":", this.basic.input("edit_label", device_config["settings"]["label"]));
        edit += this.tab.line();
        edit += this.tab.row(icon, this.button_image_select("edit_image", device_config["settings"]["image"]));
        edit += this.tab.row(lang("EXTERNAL_ID") + ":", this.basic.input("edit_device_id", device_config["settings"]["device_id"]));
        edit += this.tab.row(lang("DESCRIPTION") + ":&nbsp;", this.basic.input("edit_description", device_config["settings"]["description"]));

        edit += this.tab.line();
        edit += this.tab.row("<center>" +
            "<input id='remote_visibility' value='" + remote_visible + "' style='display:none;'>" +
            this.button.edit("apiRemoteChangeVisibility('device','" + device + "','remote_visibility');", lang("BUTTON_T_SHOW_HIDE")) + "&nbsp;" +
            this.button.edit("apiDeviceEdit('" + device + "','edit','description,label,interface,method,device_id,image');", lang("BUTTON_T_SAVE")) + "&nbsp;" +
            this.button.edit("apiDeviceDelete('" + device + "');", "delete") + "</center>",
            false
        );
        edit += this.tab.line();
        edit += this.tab.end();

        this.button.width = "120px";
        edit += this.tab.start();
        if (device !== this.data["CONFIG"]["main-audio"] && device_config["commands"]["definition"]["vol"] && device_config["commands"]["definition"]["vol"] !== undefined) {
            edit += this.tab.row(lang("AUDIO_SET_AS_MAIN", [this.data["CONFIG"]["main-audio"]]), this.button.edit("setMainAudio('" + device + "');", "set main device", ""));
        } else if (device === this.data["CONFIG"]["main-audio"]) {
            edit += this.tab.row(lang("AUDIO_IS_MAIN"), false);
        } else {
            edit += this.tab.row(lang("AUDIO_N/A_AS_MAIN"), false);
        }
        edit += this.tab.end();

        //remote  += this.basic.container("remote_main","Main settings",edit,true);
        remote += this.basic.container("remote_edit_main", lang("MAIN_SETTINGS"), "<div id='remote-edit-main'></div>", true);

        let edit_main = edit;
        let edit_test;

        // API Information
        let select = function (id, title, data, onchange = "", value = "", input_width="") {
            let item = "<select style=\"width:" + input_width + ";margin:1px;max-width:100%;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
            item += "<option value='' disabled='disabled' selected>Select " + title + "</option>";
            for (let key in data) {
                let selected = "";
                if (key === value) {
                    selected = "selected";
                }
                if (key !== "default") {
                    item += "<option value=\"" + key + "\" " + selected + ">" + data[key] + "</option>";
                }
            }
            item += "</select>";
            return item;
        }
        let on_change1 = "setTextById('edit_dev_api_field', this.value);";
        let on_change2 = "setTextById('edit_dev_config_field', this.value + '.json');";
        let on_change3 = "setTextById('edit_dev_rm_field', this.value + '.json');";
        let api_key = device_config["interface"]["api"].split("_")[0];
        let api_interface = select("edit_dev_api", "interface", this.data["CONFIG"]["apis"]["list_description"], on_change1, device_config["interface"]["api"], this.input_width);
        let dev_config = select("edit_dev_config", "device config", this.data["CONFIG"]["apis"]["list_api_configs"]["list"][api_key], on_change2, device_config["interface"]["device"], this.input_width);
        let rm_definition = select("edit_dev_rm", "remote definition", this.data["CONFIG"]["remotes"]["list"], on_change3, device_config["interface"]["remote"], this.input_width);

        edit = "<p><b>" + lang("API_INTERFACE") + ":</b><br/>" + api_interface;
        edit += "<br>&nbsp;<text id='edit_dev_api_field'>" + device_config["interface"]["api"] + "</text>";
        edit += "<p><b>" + lang("CONFIG_INTERFACE") + ":</b><br/>" + dev_config;
        edit += "<br/>&nbsp;<text id='edit_dev_config_field'>" + device_config["interface"]["device"] + ".json" + "</text>";
        edit += "<p><b>" + lang("CONFIG_REMOTE") + ":</b><br/>" + rm_definition;
        edit += "<br/>&nbsp;<text id='edit_dev_rm_field'>" + device_config["interface"]["remote"] + ".json" + "</text>";
        edit += "<p><b>" + lang("METHOD") + ":</b><br/>" + device_config["interface"]["method"]; //device_data["interface"]["remote"]+".json" );
        edit += "<hr/><center>" + this.button.edit("alert('not implemented yet');", lang("BUTTON_T_SAVE")) + "</center>";
        let edit_info = edit;

        //remote  += this.basic.container("remote_api01",lang("API_INFORMATION"),edit,false);

        // API details
        edit = "<i><b>" + lang("COMMANDS") + "</b> (" + lang("BUTTON_T") + ")</i>";
        edit += "<ul><li>" + JSON.stringify(device_config["buttons"]).replace(/,/g, ", ") + "</li></ul>";
        edit += "<i><b>" + lang("GET_DATA") + "</b> (" + lang("BUTTON_T_DISPLAY") + ")</i>";
        edit += "<ul><li>" + JSON.stringify(device_config["commands"]["get"]).replace(/,/g, ", ") + "</li></ul>";
        edit += "<i><b>" + lang("SEND_DATA") + "</b> (" + lang("SLIDER") + ", " + lang("BUTTON_T_KEYBOARD") + ", " + lang("BUTTON_T_COLOR_PICKER") + ")</i>";
        edit += "<ul><li>" + JSON.stringify(device_config["commands"]["set"]).replace(/,/g, ", ") + "</li></ul>";
        let edit_cmd = edit;
        //remote  += this.basic.container("remote_api02",lang("API_COMMANDS"),edit,false);

        if (device_method === "query") {
            // API Testing
            this.basic.input_width = "90%";
            this.button.height = "25px;";
            let activate_copy_button = "document.getElementById('copy_button').disabled=false;document.getElementById('copy_button').style.backgroundColor='';";
            edit = lang("TEST_DEVICE_COMMANDS", [device]);
            edit += "<div id='api_command_select'><select style='width:90%'><option>" + lang("LOADING") + " ...</option></select></div><br/>";
            edit += this.basic.input("api_command") + "<br/>";
            this.button.width = "80px;";
            edit += this.button.edit("apiSendToDeviceApi( '" + device + "', getValueById('api_command'));"+activate_copy_button, lang("TRY_OUT"), "") + "&nbsp;";
            this.button.width = "120px;";
            edit += this.button.edit("apiSendToDeviceApi( '" + device + "', 'jc.get_available_commands()');"+activate_copy_button, lang("GET_AVAILABLE_COMMANDS"), "") + "&nbsp;";
            this.button.width = "80px;";
            edit += this.button.edit("copyTextById('JSON_copy',appMsg,'"+lang("COPIED_TO_CLIPBOARD")+"');", lang("COPY"), "disabled", "copy_button");
            edit += "<br/>&nbsp;<br/>";
            edit += "<div class='remote-edit-cmd' id='api_response'></div>";
            edit += "<div id='api_description' style='margin-top:5px;'></div>";
            edit_test = edit;
            //remote  += this.basic.container("remote_api03",lang("API_COMMANDS_TEST"),edit,false);
        }

        remote += "<br/>";

        this.logging.default(device_config);
        setTextById(id, remote);

        // create sheet box

        const myBox = new RemoteElementSheetBox("remote-edit-main", "380px", true, false, false);
        myBox.addSheet(lang("REMOTE"), edit_main);
        myBox.addSheet(lang("API_SETTINGS"), edit_info);
        myBox.addSheet(lang("API_COMMANDS"), edit_cmd);
        if (device_method === "query") {
            myBox.addSheet(lang("API_TEST"), edit_test);
        }

        apiGetConfig_createDropDown(device, this.device_edit_api_commands);
    }

    /* create drop-down with API commands */
    device_edit_api_commands(data) {
        if (data["DATA"]["error"]) {
            return;
        }

        let id = "api_command_select";
        let device = data["DATA"]["device"];
        let commands = data["DATA"][device]["api_commands"];
        let api_url = data["DATA"][device]["interface_details"]["API-Info"];
        let api_name = data["DATA"][device]["interface"]["api_key"];
        let on_change = "setValueById('api_command', getValueById('api_cmd_select'));";

        const basic = new RemoteBasicElements("rm3remotes.basic");		// !!! should use this.app_name, but doesn't work
        basic.input_width = "90%";

        let select = basic.select("api_cmd_select", lang("API_SELECT_CMD"), commands, on_change, '', false, true);

        setTextById('api_command_select', select);

        if (api_url) {
            setTextById('api_description', "<a href='" + api_url + "' target='_blank' style='color:white'>API Documentation " + api_name + "</a>");
        }
    }

    /* create edit panel to edit JSON data */
    device_edit_json(id, device, preview_remote = "", preview_display = "", preview_display_size = "") {

        if (this.edit_mode) {
            elementVisible(id);
        } else {
            elementHidden(id, "remote_edit_json");
            return;
        }

        let device_config = this.data["CONFIG"]["devices"][device];
        let device_macros = this.data["CONFIG"]["macros"];
        if (this.data["STATUS"]["config_errors"]["devices"][device] || !device_config || !device_config["remote"]) {
            setTextById(id, "");
            return;
        }

        this.button.width = "100px";
        let display_sizes = this.display.sizes();
        let device_info = device_config["settings"];

        // check if color values exist
        let select_color_values = false;
        for (let i = 0; i < device_config["commands"]["set"].length; i++) {
            let key = device_config["commands"]["set"][i];
            if (key.indexOf("color") >= 0) {
                select_color_values = true;
            }
            if (key.indexOf("bright") >= 0) {
                select_color_values = true;
            }
        }

        // check data for preview
        let remote_definition;
        let remote_display_size;
        let remote_display;
        let preview;
        if (preview_remote === "") {

            remote_definition = device_config["remote"]["remote"];
        } else {
            remote_definition = this.json.get_value(preview_remote, device_config["remote"]["remote"]);
            preview = true;
        }
        if (preview_display === "") {
            remote_display = device_config["remote"]["display"];
        } else {
            remote_display = this.json.get_value(preview_display, device_config["remote"]["display"]);
            preview = true;
        }
        if (remote_display === undefined) {
            remote_display = {};
        }
        if (preview_display_size === "") {
            remote_display_size = device_config["remote"]["display-size"];
        } else {
            remote_display_size = this.json.get_value(preview_display_size, device_config["remote"]["display-size"]);
            preview = true;
        }
        if (remote_display_size === undefined) {
            remote_display_size = "middle";
        }

        // Start remote control edit section
        let remote = "";
        remote += "<center class='remote_edit_headline'><b>" + lang("EDIT_REMOTE") + " &quot;" + device_info["label"] + "&quot;</b> [" + device + "]</center>";
        remote += this.basic.edit_line();

        // Add GUI to add JSON elements
        remote += this.basic.container("remote_edit_add", lang("EDIT_ELEMENTS"), "<div id='remote-edit-add'></div>", false);

        // if record device, edit ... unclear if still required
        if (device_config["method"] === "record") {
            this.button.height = "45px";
            let edit = this.tab.start();
            edit += this.tab.row(
                this.command_select_record("rec_button", device),
                this.button.edit("apiCommandRecord('" + device + "','rec_button');", lang("RECORD_COMMAND"))
            );
            edit += this.tab.row("<small>" + lang("COMMAND_RECORD_INFO") + "</small>", false);
            edit += this.tab.line();
            edit += this.tab.row(
                this.command_select("del_command", device),
                this.button.edit("apiCommandDelete('" + device + "','del_command');", lang("DELETE_COMMAND"))
            );
            edit += this.tab.row("<small>" + lang("COMMAND_DELETE_INFO") + "</small>", false);
            edit += this.tab.end();
            this.button.height = "30px";
            remote += this.basic.container("remote_edit_rec-edit", lang("RECORD_DELETE_COMMANDS"), edit, false);
        }

        // JSON Edit
        remote += this.basic.container("remote_edit_json", lang("JSON_EDIT"), "<div id='remote-edit-json'></div>", false);

        let macro_on, macro_off = "";
        if (device in device_macros["device-on"]) {
            macro_on = JSON.stringify(device_macros["device-on"][device]);
        } else {
            macro_on = "[]";
        }
        if (device in device_macros["device-off"]) {
            macro_off = JSON.stringify(device_macros["device-off"][device]);
        } else {
            macro_off = "[]";
        }
        let macro_edit = lang("MACRO_DEVICE_EDIT");
        macro_edit += this.tab.start();
        macro_edit += this.tab.row(lang("MACRO") + " ON:<br/>", this.basic.input("remote_macro_on", macro_on));
        macro_edit += this.tab.row(lang("MACRO") + " OFF:<br/>", this.basic.input("remote_macro_off", macro_off));
        macro_edit += this.tab.end();

        // buttons to save, preview, stop editing ...
        this.button.width = "23%";
        remote += "<br/>";
        remote += this.basic.edit_line();
        remote += "<br/><center>" +
            this.button.edit(this.app_name + ".device_edit_json('" + id + "','" + device + "');" +
                this.app_name + ".device_remote('" + this.frames_remote[0] + "','" + device + "','remote_json_buttons','remote_json_channel');" +
                this.app_name + ".device_not_used('" + this.frames_remote[2] + "','" + device + "','remote_json_buttons');", lang("BUTTON_T_RESET")) + "&nbsp;" +
            this.button.edit("apiDeviceJsonEdit('" + device + "','remote_json_buttons','remote_json_display','remote_display_size');", lang("BUTTON_T_SAVE")) + "&nbsp;" +
            this.button.edit(this.app_name + ".rm_device.preview('" + device + "');", lang("BUTTON_T_PREVIEW")) + "&nbsp;" +
            this.button.edit("remoteToggleEditMode(false);" + this.app_name + ".create('" + this.active_type + "','" + device + "');", "stop edit") +
            "</center><br/>";


        // set framework to edit remote elements
        setTextById(id, remote);

        // add content in sheet boxes :: add elements
        this.button.width = "90px";
        this.button.height = "25px";

        this.rm_device.update(this.data);
        this.dialog_device.update(this.data, preview_remote, preview_display, preview_display_size);

        const myBoxJson = new RemoteElementSheetBox("remote-edit-json", height = "350px", scroll = true);
        myBoxJson.addSheet(lang("REMOTE"), "<h4>" + lang("JSON_REMOTE") + "</h4>" + "<div id='container_remote_json_buttons'></div><br/>" + lang("MANUAL_REMOTE"));
        myBoxJson.addSheet(lang("DISPLAY"), "<h4>" + lang("JSON_DISPLAY") + "</h4>" + "<div id='container_remote_json_display'></div><br/>" + lang("MANUAL_DISPLAY"));
        myBoxJson.addSheet(lang("MACROS"), "<h4>" + lang("JSON_REMOTE_MACROS") + "</h4>" + macro_edit);

        const myJson = new RemoteJsonEditing("remote-edit", "default", "width:100%;height:200px");
        myJson.create("container_remote_json_buttons", "remote_json_buttons", remote_definition, "rmc");
        myJson.create("container_remote_json_display", "remote_json_display", remote_display, "default");

        const myBox = new RemoteElementSheetBox("remote-edit-add", height = "280px", scroll = false);
        myBox.addSheet(lang("INFO"), lang("MANUAL_ADD_ELEMENTS") + lang("MANUAL_ADD_TEMPLATE") + this.dialog_device.edit_fields("template", id, device));
        myBox.addSheet(lang("BUTTONS"), this.dialog_device.edit_fields("button_line", id, device, preview_remote));
// !!!!!!!! ---------------
        myBox.addSheet(lang("DISPLAY")+"!", this.dialog_device.edit_fields("display", id, device));
        myBox.addSheet(lang("TOGGLE"), this.dialog_device.edit_fields("toggle", id, device));
        if (this.device_has_ranges(device))     myBox.addSheet(lang("SLIDER"), this.dialog_device.edit_fields("slider", id, device));
        if (select_color_values)                myBox.addSheet(lang("COLOR_PICKER"), this.dialog_device.edit_fields( "color_picker", id, device));
        myBox.addSheet(lang("DELETE"), this.dialog_device.edit_fields("delete", id, device));
    }

    // SCENE REMOTES - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /* create remote for a specific scene */
    scene_remote(id = "", scene = "", preview_remote = "", preview_display = "", preview_display_size = "") {

        let toggle_done;
        let preview = false;
        let remote = "";
        let remote_definition = [];
        let scene_definition = this.data["CONFIG"]["scenes"][scene];
        let scene_label = scene_definition["settings"]["label"];
        this.active_label = scene_label;
        this.display.edit_mode = this.edit_mode;

        appCookie.set("remote", "scene::" + scene + "::" + scene_label + "::" + this.edit_mode + "::" + easyEdit + "::" + remoteHints);
        console.info("Set cookie: " + "scene::" + scene + "::" + scene_label + "::" + this.edit_mode + "::" + easyEdit + "::" + remoteHints);

        if (this.data["CONFIG"]["scenes"][scene] && this.data["CONFIG"]["scenes"][scene]["remote"] && this.data["CONFIG"]["scenes"][scene]["remote"]["remote"]) {
        } else {
            if (this.data["STATUS"]["config_errors"]["scenes"][scene]) {
                let errors = this.data["STATUS"]["config_errors"]["scenes"][scene];
                remote += "<b class='entry_error'>" + lang("REMOTE_CONFIG_ERROR", [scene]) + "</b>";
                remote += "<hr/><ul>";
                for (let key in errors) {
                    remote += "<li><u>" + key + "</u>:<br/>" + errors[key] + "</li>";
                }
                remote += "</ul>";
            } else {
                remote += lang("REMOTE_CONFIG_ERROR_UNKNOWN", [scene]);
            }
            remote += "</div>";
            setTextById(id, remote);
            appMsg.alert(lang("MISSING_DATA_SCENE", [scene, this.data["CONFIG"]["scenes"][scene]["config"]["remote"] + ".json"]));
            console.warn(lang("MISSING_DATA_SCENE"));
            console.warn(this.data["CONFIG"]["scenes"][scene]);
            return;
        }

        // prepare macros
        let scene_macros = {}
        let groups = this.data["CONFIG"]["macros"]["groups"];
        let macros = this.data["CONFIG"]["macros"]["global"];
        let macros_deviceOn = this.data["CONFIG"]["macros"]["device-on"];
        let macros_deviceOff = this.data["CONFIG"]["macros"]["device-off"];

        for (let key in scene_definition["remote"]["macro-scene"]) {
            macros[key] = scene_definition["remote"]["macro-scene"][key];
        }
        if (scene_definition["remote"]["macro-scene"] !== undefined) {
            scene_macros["scene-on"] = scene_definition["remote"]["macro-scene-on"];
            scene_macros["scene-off"] = scene_definition["remote"]["macro-scene-off"];
        }

        if (scene_macros["scene-on"] === undefined || scene_macros["scene-on"] === []) {
            scene_macros["scene-on"] = {};
        }
        if (scene_macros["scene-off"] === undefined || scene_macros["scene-off"] === []) {
            scene_macros["scene-off"] = {};
        }

        // check if preview
        if (preview_remote === "") {
            remote_definition = scene_definition["remote"]["remote"];
        } else {
            remote_definition = this.json.get_value(preview_remote, scene_definition["remote"]["remote"]);
            preview = true;
        }

        let context_menu = "";
        let remote_display;
        let remote_display_size;

        if (preview_display === "") {
            remote_display = scene_definition["remote"]["display"];
        } else {
            remote_display = this.json.get_value(preview_display, scene_definition["remote"]["display"]);
            preview = true;
        }

        if (preview_display_size === "") {
            remote_display_size = scene_definition["remote"]["display-size"];
        } else {
            remote_display_size = this.json.get_value(preview_display_size, remote_display_size);
            preview = true;
        }

        if (remote_display_size === undefined) {
            remote_display_size = "middle";
        }

        // create remote
        remote += "<div id='scene_button' style='display:block;'>";
        if (preview) {
            remote += "<b>" + lang("PREVIEW") + ":</b><br/><hr/>";
        } else {
            remote += "<div id='scene-power-information-" + scene + "' class='remote-power-information' onclick='statusCheck_bigMessage(\"scene-power-information-" + scene + "\");'>POWER INFORMATION</div>";
        }

        // include edit button
        let edit_cmd = "remoteToggleEditMode(true);rm3remotes.create(\"scene\",\"" + scene + "\");";
        if (!this.edit_mode && easyEdit) {
            remote += "<div class='remote-edit-button' onclick='" + edit_cmd + "' style='top:17px;left:17px;'><img src='icon/edit.png' style='height:20px;width:20px;'></div>";
        }

        // add buttons
        for (let i = 0; i < remote_definition.length; i++) {

            let next_button = "";
            let button_def = remote_definition[i];
            let button = remote_definition[i].split("_");
            let cmd = button[0] + "_" + button[1];

            if (remote_definition[i] === "scene-on") {
                cmd = "scene-on_" + scene;
                button = ["scene-on", scene];
                button_def = cmd;
            }
            if (remote_definition[i] === "scene-off") {
                cmd = "scene-off_" + scene;
                button = ["scene-off", scene];
                button_def = cmd;
            }
            if (button[0] === "group") {
                cmd = button.join("_");
                button = ["group_" + button[1], button[2]];
            }

            //if (remote_definition[i].indexOf("COLOR-P") > 1) { button = [button[0], button_def.replace(button[0]+"_", "")]; }
            if (remote_definition[i].indexOf("COLOR-P") > 1) {
                cmd = button_def;
                let cp_device = remote_definition[i].split("_COLOR-PICKER")[0];
                let cp_data = "COLOR-PICKER" + remote_definition[i].split("_COLOR-PICKER")[1];
                button = [cp_device, cp_data];
            }

            // create tool tip
            if (this.edit_mode) {
                let button_name = cmd.split("||")[0];
                let button_name_test = button_name.split("_");
                if (button_name_test[1] === "undefined") {
                    button_name = button_name_test[0];
                }

                context_menu = "[" + i + "] <b>" + button_name + "</b><br/><br/>";
                let link_preview = this.app_name + ".rm_scene.preview('" + scene + "');";

                let link_delete = this.app_name + ".rm_scene.delete_button('" + scene + "','" + i + "');";
                let link_move_left = this.app_name + ".rm_scene.move_button('" + scene + "'," + i + ",'left');";
                let link_move_right = this.app_name + ".rm_scene.move_button('" + scene + "'," + i + ",'right');";

                let link_button_left = this.app_name + ".rm_scene.add_button('" + scene + "','add_button_" + i + "','" + i + "');";
                let link_button_right = this.app_name + ".rm_scene.add_button('" + scene + "','add_button_" + i + "','" + (i + 1) + "');";
                this.button.width = "50px;"
                let input_add_button = "<br/>&nbsp;<br/><input id='add_button_" + i + "' style='width:100px'><br/>&nbsp;<br/>" +
                    this.button.edit(link_button_left + link_preview, "&lt; +") +
                    this.button.edit(link_button_right + link_preview, "+ &gt;");

                this.button.width = "30px;";
                if (i > 0) {
                    context_menu += this.button.edit(link_move_left + link_preview, "&lt;", "");
                }
                context_menu += this.button.edit(link_delete + link_preview, "x", "");
                if (i + 1 < remote_definition.length) {
                    context_menu += this.button.edit(link_move_right + link_preview, "&gt;", "");
                }
                context_menu += input_add_button;
            }

            // create element per definition
            if (button[0] === "LINE") {
                next_button = this.basic.line("");
            } else if (button[0].indexOf("LINE||") === 0) {
                next_button = this.basic.line(button[0].split("||")[1]);
            } else if (button[0] === ".") {
                next_button = this.button.device(scene + i, ".", scene_label, "empty", "", "disabled");
            } else if (button[0] === "macro") {
                next_button = this.button.macro(cmd, button[1], scene_label, "", macros[button[1]], "");
                this.active_buttons.push(cmd);
            } else if (button[0] === "scene-on") {
                next_button = this.button.macro("scene_on_" + button[1], "on", scene_label, "", scene_macros["scene-on"], "");
                this.active_buttons.push("scene_on_" + button[1]);
            } else if (button[0] === "scene-off") {
                next_button = this.button.macro("scene_off_" + button[1], "off", scene_label, "", scene_macros["scene-off"], "");
                this.active_buttons.push("scene_off_" + button[1]);
            } else if (button[0] === "device-on") {
                next_button = this.button.macro(button[1] + "_on", "on", scene_label, "", macros_deviceOn[button[1]], "");
                this.active_buttons.push(button[1]) + "_on";
            } else if (button[0] === "device-off") {
                next_button = this.button.macro(button[1] + "_off", "off", scene_label, "", macros_deviceOff[button[1]], "");
                this.active_buttons.push(button[1] + "_off");
            } else if (button[1] === "keyboard") {
                this.keyboard.set_device(button[0]);
                next_button = this.button.device_keyboard(cmd, button[1], device, "", cmd, "");
                this.active_buttons.push(cmd);
            } else if (button[0].indexOf("HEADER-IMAGE") === 0) {
                let toggle_html = "";
                if (remote_definition[i + 1].indexOf("TOGGLE") === 0 && button_def.indexOf("toggle") > 0) {
                    let toggle = remote_definition[i + 1];
                    toggle_html = this.advanced.toggle(this.data, id, toggle, "devices", toggle.split("||"), true);
                    toggle_done = i + 1;
                }
                next_button = this.scene_header_image(id, scene, toggle_html);
            } else if (button[0] === "DISPLAY") {
                next_button = this.display.default(id, scene, "scenes", remote_display_size, remote_display);
            } else if (button.length > 1 && button[1].indexOf("COLOR-PICKER") >= 0) {
                next_button = this.advanced.colorPicker(this.data, id, button[0], "devices", button[1].split("||"));
            } else if (button.length > 1 && button[1].indexOf("SLIDER") === 0) {
                next_button = this.advanced.slider(this.data, id, button[0], "devices", button[1].split("||"));
            } else if (button_def.indexOf("TOGGLE") === 0) {
                if (i !== toggle_done) {
                    next_button = this.advanced.toggle(this.data, id, button_def, "devices", button_def.split("||"), false);
                }
            } else if (button_def.indexOf("COLOR-P") === 0) {
                next_button = this.button.device(scene + i, "color-picker scene N/A", scene - label, "", "", "disabled");
            } else if (button_def.indexOf("SLIDER") === 0) {
                next_button = this.button.device(scene + i, "slider scene N/A", scene - label, "", "", "disabled");
            } else {
                next_button = this.button.device(cmd, button[1], scene_label, "", cmd, "");
                this.active_buttons.push(cmd);
            }

            if (this.edit_mode) {
                if (button[0].indexOf("LINE") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, 30);
                } else if (button[0].indexOf("HEADER-IMAGE") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, 20);
                } else if (button[0].indexOf("SLIDER") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, 40);
                } else if (button[0].indexOf("TOGGLE") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, 20);
                } else if (button[0].indexOf("DISPLAY") === 0) {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
                } else {
                    this.tooltip.settings(this.tooltip_mode, this.tooltip_width, this.tooltip_height, this.tooltip_distance);
                }

                next_button = this.tooltip.create_inside(next_button, context_menu, i);

                // adapt tooltip placement for header image in edit mode
                if (button[0].indexOf("HEADER-IMAGE") === 0 || remote.indexOf("TOOL-TIPP-PLACEHOLDER") > 0) {

                    console.debug(next_button);

                    let splitter = "<span class='jc_tooltip";
                    let tooltip = splitter + next_button.split("<!--X-->" + splitter)[1];
                    tooltip = tooltip.replace("</button>", "");

                    next_button = next_button.replace(tooltip, "");
                    next_button = next_button.replace("<!--TOOL-TIPP-PLACEHOLDER-->", tooltip);
                }
            }

            remote += next_button;
        }

        remote += "</div>";
        remote += this.keyboard.input();

        setTextById(id, remote);
    }

    /* create list of channels (for scenes) */
    scene_channels(id, scene, preview_channel = "") {

        let remote = "";
        let scene_data = this.data["CONFIG"]["scenes"][scene];
        if (!scene_data || !scene_data["remote"] || !scene_data["remote"]["remote"]) {
            setTextById(id, "");
            return;
        }
        let scene_name = scene_data["settings"]["label"];

        let macros;
        let preview;

        if (preview_channel === "") {
            macros = scene_data["remote"]["macro-channel"];
        } else {
            macros = this.json.get_value(preview_channel, scene_data["remote"]["macro-channel"]);
            preview = true;
        }

        let channels = Object.keys(macros);
        channels = channels.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });

        this.tooltip.settings(this.tooltip_mode, this.tooltip_width, "80px", 35);

        // create list of channel buttons
        for (let i = 0; i < channels.length; i++) {
            let cmd = "channel_" + i; //channels[i];
            let next_button = this.button.channel(cmd, channels[i], scene_name, macros[channels[i]], "", "");
            let context_menu = "[" + i + "] <b>" + cmd + "</b><br/><br/><i>" + lang("CHANNEL_USE_JSON") + "</i>";
            this.active_channels.push(cmd);

            if (this.edit_mode) {
                next_button = this.tooltip.create_inside(next_button, context_menu, "channel_" + i);
            }
            remote += next_button;
        }

        // print
        setTextById(id, remote);
    }

    /* write description for device remote */
    scene_description(id, scene) {
        let scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
        let label = scene_info["label"];
        let descr = scene_info["description"];
        let url = scene_info["url"];
        if (url) {
            descr = "<a href=\"" + url + "\" target='_blank'>" + descr + "</a>";
        }
        let str = "<div class='rm-info'>";
        str += "<center>" + label + ": " + descr + "</center>";
        str += "</div>";
        setTextById(id, str);
    }

    /* edit scene */
    scene_edit(id, scene) {

        if (this.edit_mode) {
            elementVisible(id);
        } else {
            elementHidden(id, "scene_edit");
            return;
        }

        if (this.data["STATUS"]["config_errors"]["scenes"][scene] || !this.data["CONFIG"]["scenes"][scene]["settings"]) {
            setTextById(id, "");
            return;
        }

        this.button.width = "90px";
        this.basic.input_width = "180px";

        let scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
        let remote_info = this.data["CONFIG"]["devices"];
        let remote = "";

        this.dialog_edit_main = function () {
            // main settings for the scene
            let edit = "";
            edit += this.tab.start();
            edit += this.tab.row(lang("ID") + ":", scene);
            edit += this.tab.row(lang("LABEL") + ":", this.basic.input("edit_label", scene_info["label"]));
            edit += this.tab.row(lang("DESCRIPTION") + ":&nbsp;", this.basic.input("edit_description", scene_info["description"]));
            edit += this.tab.row(lang("SCENE_IMAGE") + ":&nbsp;", this.image_select("edit_image", scene_info["image"]));
            edit += this.tab.line();
            edit += this.tab.row("<div id='scene_edit_header_image' style='align:center;'></div>", false);
            edit += this.tab.line();
            edit += this.tab.row("<center>" +
                "<input id='scene_visibility' value='" + scene_info["visible"] + "' style='display:none;'>" +
                this.button.edit("apiRemoteChangeVisibility('scene','" + scene + "','scene_visibility');", lang("BUTTON_T_SHOW_HIDE")) + "&nbsp;" +
                this.button.edit("apiSceneEdit('" + scene + "','edit','description,label,image');", lang("BUTTON_T_SAVE"), "") + "&nbsp;" +
                this.button.edit("apiSceneDelete('" + scene + "');", lang("BUTTON_T_DELETE"), "") + "</center>",
                false
            );
            edit += this.tab.end();
            return edit;
        }
        this.dialog_edit_api = function () {
            // file information
            let edit = this.tab.start();
            edit += this.tab.row("Remote:&nbsp;&nbsp;", this.data["CONFIG"]["scenes"][scene]["config"]["remote"] + ".json");
            edit += this.tab.row("Devices:", JSON.stringify(this.data["CONFIG"]["scenes"][scene]["remote"]["devices"]).replace(/,/g, ", "));
            edit += this.tab.end();
            let edit_info = edit;
            return edit;
        }

        if (this.edit_mode) {
            elementVisible(id);
        } else {
            elementHidden(id, "device_edit");
            return;
        }

        // create frame
        remote += "<center class='remote_edit_headline'><b>" + lang("EDIT_SCENE") + " &quot;" + scene_info["label"] + "&quot;</b> [" + scene + "]</center>";
        remote += this.basic.edit_line();
        remote += this.basic.container("scene_main", lang("SETTINGS_SCENES"), "<div id='scene-edit-main'></div>", true);
        setTextById(id, remote);

        // create sheet box
        const myBox = new RemoteElementSheetBox("scene-edit-main", height = "500px", true, false, false);
        myBox.addSheet(lang("SCENE"), this.dialog_edit_main());
        myBox.addSheet(lang("API_SETTINGS"), this.dialog_edit_api());

        this.image_preview();
    }

    /* create edit panel to edit JSON data */
    scene_edit_json(id, scene, preview_remote = "", preview_channel = "", preview_display = "", preview_display_size = "") {

        if (this.edit_mode) {
            elementVisible(id);
        } else {
            elementHidden(id, "scene_edit_json");
            return;
        }

        if (this.data["STATUS"]["config_errors"]["scenes"][scene] || !this.data["CONFIG"]["scenes"][scene]["settings"]) {
            setTextById(id, "");
            return;
        }

        let preview = false;
        let scene_remote = this.data["CONFIG"]["scenes"][scene]["remote"];
        let scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
        let remote_info = this.data["CONFIG"]["devices"];

        // prepare field values
        let json_edit_fields = ["remote", "devices", "display", "display-size", "macro-channel", "macro-scene-on", "macro-scene-off", "macro-scene"];
        let json_edit_values = {};
        let json_preview_values = {
            "remote": preview_remote,
            "devices": "",
            "display": preview_display,
            "display-size": preview_display_size,
            "macro-channel": preview_channel,
            "macro-scene-on": [],
            "macro-scene-off": [],
            "macro-scene": {},
        };

        for (let i = 0; i < json_edit_fields.length; i++) {
            let field = json_edit_fields[i];
            if (json_preview_values[field] === "") {
                json_edit_values[field] = scene_remote[field];
            } else {
                json_edit_values[field] = this.json.get_value(json_preview_values[field], scene_remote[field]);
                preview = true;
            }
        }

        if (json_edit_values["display"] === undefined) {
            json_edit_values["display"] = {};
        }
        if (json_edit_values["display-size"] === undefined) {
            json_edit_values["display-size"] = "middle";
        }
        if (json_edit_values["macro-scene-on"] === undefined) {
            json_edit_values["macro-scene-on"] = [];
        }
        if (json_edit_values["macro-scene-off"] === undefined) {
            json_edit_values["macro-scene-off"] = [];
        }
        if (json_edit_values["macro-channel"] === undefined) {
            json_edit_values["macro-channel"] = {};
        }
        if (json_edit_values["macro-scene"] === undefined) {
            json_edit_values["macro-scene"] = {};
        }

        // frame
        let remote = "";
        remote += "<center class='remote_edit_headline'><b>" + lang("EDIT_SCENE") + " &quot;" + scene_info["label"] + "&quot;</b> [" + scene + "]</center>";
        remote += this.basic.edit_line();
        remote += this.basic.container("edit_elements", lang("EDIT_ELEMENTS"), "<div id='scene-edit-elements'></div>", false);
        remote += this.basic.container("edit_json_all", lang("EDIT_JSON"), "<div id='scene-edit-json'></div>", false);
        remote += this.basic.edit_line();
        this.button.width = "23%";
        remote += "<br/><center>" +
            this.button.edit(this.app_name + ".scene_edit_json('" + id + "','" + scene + "');" +
                this.app_name + ".scene_remote(  '" + this.frames_remote[0] + "','" + scene + "','json::remote','json::display');" +
                this.app_name + ".scene_channels('" + this.frames_remote[2] + "','" + scene + "','json::macro-channel');",
                lang("BUTTON_T_RESET")) + "&nbsp;" +
            this.button.edit("apiSceneJsonEdit('" + scene + "','json::remote,json::devices,json::display,json::macro-channel,json::macro-scene-on,json::macro-scene-off,json::macro-scene,json::display-size');",
                lang("BUTTON_T_SAVE"), "") + "&nbsp;" +
            this.button.edit(this.app_name + ".scene_remote(  '" + this.frames_remote[0] + "','" + scene + "','json::remote','json::display','json::display-size');" +
                this.app_name + ".scene_channels('" + this.frames_remote[2] + "','" + scene + "','json::macro-channel');",
                lang("BUTTON_T_PREVIEW")) + "&nbsp;" +
            this.button.edit("remoteToggleEditMode(false);" + this.app_name + ".create('" + this.active_type + "','" + scene + "');", lang("BUTTON_T_STOP_EDIT")) +
            "</center><br/>";

        setTextById(id, remote);

        // edit JSON file
        let edit_json_required = "<h4>" + lang("JSON_REQUIRED_DEVICES") + ":</h4><div id='scene-edit-required'></div><br/>" + lang("MANUAL_DEVICES");
        let edit_json_remote = "<h4>" + lang("JSON_EDIT_RMC_DEFINITION") + ":</h4><div id='scene-edit-remote'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
        let edit_json_display = "<h4>" + lang("JSON_EDIT_DISPLAY_DEFINITION") + ":</h4><div id='scene-edit-display'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
        let edit_json_channel = "<h4>" + lang("JSON_EDIT_CHANNEL_MACROS") + ":</h4><div id='scene-edit-macro-channel'></div><br/>" + "&nbsp;<br/>" + lang("MANUAL_DISPLAY");
        let edit_json_macros = "<h4>" + lang("JSON_EDIT_MACRO_SCENE") + " ON:</h4>" + "<div id='scene-edit-macro-scene-on'></div><br/>" +
            "<h4>" + lang("JSON_EDIT_MACRO_SCENE") + " OFF:</h4>" + "<div id='scene-edit-macro-scene-off'></div><br/>" +
            "<h4>" + lang("JSON_EDIT_MACRO_SCENE_OTHER") + ":</h4>" + "<div id='scene-edit-macro-scene-other'></div><br/>" +
            "</i>&nbsp;<br/>" + lang("MANUAL_MACROS_SCENE");

        // create sheet box JSON
        const myBox2 = new RemoteElementSheetBox("scene-edit-json", height = "400px", scroll = true);
        myBox2.addSheet(lang("DEVICES"), edit_json_required);
        myBox2.addSheet(lang("REMOTE"), edit_json_remote);
        myBox2.addSheet(lang("DISPLAY"), edit_json_display);
        myBox2.addSheet(lang("CHANNEL"), edit_json_channel);
        myBox2.addSheet(lang("MACROS"), edit_json_macros);

        // create JSON edit fields
        const myJson = new RemoteJsonEditing(id = "scene-edit-json", "default", "width:100%;height:150px;");
        myJson.create("scene-edit-macro-scene-on", "json::macro-scene-on", json_edit_values["macro-scene-on"]);
        myJson.create("scene-edit-macro-scene-off", "json::macro-scene-off", json_edit_values["macro-scene-off"]);
        myJson.create("scene-edit-macro-scene-other", "json::macro-scene", json_edit_values["macro-scene"]);
        myJson.create("scene-edit-display", "json::display", json_edit_values["display"]);
        myJson.create("scene-edit-macro-channel", "json::macro-channel", json_edit_values["macro-channel"], "compact", "width:100%;height:220px;");
        myJson.create("scene-edit-remote", "json::remote", json_edit_values["remote"], "rmc", "width:100%;height:220px;");
        myJson.create("scene-edit-required", "json::devices", scene_remote["devices"], "compact", "width:100%;height:47px;");

        this.rm_scene.update(this.data);
        this.dialog_scene.update(this.data, preview_remote, preview_display, preview_display_size, preview_channel);

        // create sheet box elements
        const myBox1 = new RemoteElementSheetBox("scene-edit-elements", height = "300px", scroll = true);
        myBox1.addSheet(lang("INFO"), lang("MANUAL_ADD_ELEMENTS") + lang("MANUAL_ADD_TEMPLATE") + this.dialog_scene.edit_fields("template", id, scene));
        myBox1.addSheet(lang("BUTTONS"), this.dialog_scene.edit_fields("default", id, scene));
        myBox1.addSheet(lang("HEADER"), this.dialog_scene.edit_fields("header", id, scene));
        myBox1.addSheet(lang("SLIDER"), this.dialog_scene.edit_fields("slider", id, scene));
        myBox1.addSheet(lang("TOGGLE"), this.dialog_scene.edit_fields("toggle", id, scene));
// !!!!
        myBox1.addSheet(lang("DISPLAY")+"!", this.dialog_scene.edit_fields("display", id, scene));
        myBox1.addSheet(lang("DELETE"), this.dialog_scene.edit_fields("delete", id, scene));
    }

    // SUPPORT FUNCTIONS - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /* return drop-down with scene images */
    button_image_select(id, selected = "") {
        let list = {};
        let images = this.data["CONFIG"]["elements"]["button_images"];

        for (let key in images) {
            list[key] = key;
        }

        return this.basic.select(id, "button-image", list, "rm3remotes.button_image_preview('" + id + "');", selected);
    }

    /* header-image preview */
    button_image_preview(id) {
        let images = this.data["CONFIG"]["elements"]["button_images"];
        let selected = getValueById("edit_image");
        if (images[selected]) {
            let image_html = "<img src='icon/" + images[selected] + "' class='rm-button_image_start'>";
            setTextById("device_edit_button_image", image_html);
        }
    }

    /* return list of buttons for a device */
    button_list(device) {
        if (this.data["CONFIG"]["devices"][device]) {
            return this.data["CONFIG"]["devices"]["buttons"];
        } else {
            return ["error:" + device];
        }
    }

    /* return drop-down with buttons */
    button_select(id, device = "", remote_definition = {}) {
        let list = {};
        let device_buttons = [];

        if (device !== "" && device in this.data["CONFIG"]["devices"]) {
            let a;
            let count1 = 0;
            let count2 = 0;
            let button_list = this.data["CONFIG"]["devices"][device]["buttons"];

            for (let i = 0; i < remote_definition.length; i++) {
                if (i < 10) {
                    a = "0";
                } else {
                    a = "";
                }
                list[i] = "[" + a + i + "]  " + remote_definition[i];
                count1 = i;
            }
        }

        if (device !== "" && device in this.data["CONFIG"]["scenes"]) {
            let a = "";
            let button_list = remote_definition;
            for (let i = 0; i < button_list.length; i++) {
                if (i < 10) {
                    a = "0";
                } else {
                    a = "";
                }
                list[i] = "[" + a + i + "]  " + button_list[i];
            }
        }
        return this.basic.select(id, "element", list);
    }

    /* return drop-down with available commands */
    command_select(id, device = "") {
        let list = {};
        let button_list;
        if (device !== "" && device in this.data["CONFIG"]["devices"]) {
            button_list = this.button_list(device);
            for (let i = 0; i < button_list.length; i++) {
                list[device + "_" + button_list[i]] = button_list[i];
            }
        }
        return this.basic.select(id, "command", list);
    }

    /* return drop-down with commands to be recorded */
    command_select_record(id, device = "") {
        let list = {};
        let device_buttons = [];
        if (device !== "" && device in this.data["CONFIG"]["devices"]) {
            let button_list = [];
            for (let i = 0; i < this.data["CONFIG"]["devices"][device]["remote"].length; i++) {
                button_list.push(this.data["CONFIG"]["devices"][device]["remote"][i]);
            }
            button_list.sort();

            for (let i = 0; i < button_list.length; i++) {
                if (button_list[i].includes("LINE") === false && button_list[i] !== "." && button_list[i].includes("DISPLAY") === false) {
                    list[button_list[i]] = button_list[i];
                }
            }
        }
        return this.basic.select(id, "button", list);
    }

    /* return drop-down with scene images */
    image_select(id, selected = "") {
        let list = {};
        let images = this.data["CONFIG"]["elements"]["scene_images"];

        for (let key in images) {
            list[key] = key;
        }

        return this.basic.select(id, "header-image", list, "rm3remotes.image_preview('" + id + "');", selected);
    }

    /* header-image preview */
    image_preview(id) {
        let images = this.data["CONFIG"]["elements"]["scene_images"];
        let selected = getValueById("edit_image");
        if (images[selected]) {
            //let image_html = this.scene_header_image(id, scene, selected);
            let image_html = "<img src='" + rm3scene_dir + images[selected][0] + "' style='width:100%;'>";
            image_html += "<br/><small><a href='" + images[selected][1] + "' target='_blank'>" + images[selected][1] + "</a></small><br/>&nbsp;";
            setTextById("scene_edit_header_image", image_html);
        }
    }

    /* return drop-down with display values */
    device_display_select(device, id) {

        let device_info = this.data["CONFIG"]["devices"][device]["commands"]["get"];
        if (this.data["CONFIG"]["devices"][device]["commands"]["definition"] && this.data["CONFIG"]["devices"][device]["commands"]["definition"]["power"]) {
            let power = this.data["CONFIG"]["devices"][device]["commands"]["definition"]["power"];
            if (power["auto_off"] && power["auto_off"] > 0) {
                if (device_info.indexOf("auto-power-off") === -1) {
                    device_info.push("auto-power-off");
                }
            }
        }
        device_info.sort();
        let device_display_values = this.basic.select_array(id, "display value", device_info, "");
        return device_display_values;
    }

    /* check if device has ranges - for slider option */
    device_has_ranges(device, commands = false) {
        let has_ranges = false;
        let range_cmd = [];
        let cmd_definition = this.data["CONFIG"]["devices"][device]["commands"]["definition"];
        let cmd_send = this.data["CONFIG"]["devices"][device]["commands"]["set"]
        Object.keys(cmd_definition).forEach(key => {
            let param = cmd_definition[key];
            let send = (cmd_send.indexOf(key) >= 0);
            if (send && param["values"] !== undefined && param["values"]["max"] !== undefined && param["values"]["min"] !== undefined) {
                has_ranges = true;
                range_cmd.push(key);
            }
        });

        if (!commands) {
            return has_ranges;
        } else {
            return range_cmd;
        }
    }

    /* create header image for scenes */
    scene_header_image(id, scene, toggle_html, selected = "") {

        let scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
        let scene_remote = this.data["CONFIG"]["scenes"][scene]["remote"]["remote"];
        let scene_images = this.data["CONFIG"]["elements"]["scene_images"];
        let label = scene_info["label"];
        let image = scene_info["image"];

        if (selected === "" && scene_images[image]) {
            image = scene_images[image][0];
        } else if (scene_images[selected]) {
            image = scene_images[selected][0];
        }

        if (image && image !== "") {
            let image_html = "<button class='rm-button header_image' style='background-image:url(" + rm3scene_dir + image + ")'>";
            let info = "";
            if (!scene_remote.includes("DISPLAY") && !this.edit_mode && scene_remote.includes("HEADER-IMAGE||toggle")) {
                info = "<br/><text id='header_image_text_info' class='header_image_text_info'></text>"
            }

            this.tooltip.settings("onmouseover", "100px", "50px", "50px");
            toggle_html = this.tooltip.create_inside(" " + toggle_html, test, 1);
            // ---------------------------------------------------------- TOOLTIP IN PROGRESS
            // - activate for a few seconds, if toggle is off (and hint is activated)
            // - place below the toggle
            // - ensure the triangle is visible

            image_html += " <div class='header_image_toggle_container' id='toggle_place_" + id + "'>" + toggle_html + "</div>";
            image_html += " <div id='header_tooltip' style='display:block;'><!--TOOL-TIPP-PLACEHOLDER--></div>";
            image_html += " <div class='header_image_fade'>";
            image_html += "  <div class='header_image_text'>&nbsp;<br/>&nbsp;<br/>" + label + info + "</div>";
            image_html += " </div>";
            image_html += "<!--X--></button>";
            return image_html;
        }
    }

    /* return drop-down with display values */
    scene_display_select(div_id, id, device) {

        device = check_if_element_or_value(device, false);

        let device_display_values = "";
        let device_info = this.data["CONFIG"]["devices"][device]["commands"]["get"];
        let on_change = "document.getElementById('" + id + "').value = this.value;";

        device_display_values = this.basic.select_array("scene_display_value", "value (" + device + ")", device_info, on_change);

        setTextById(div_id, device_display_values);
    }

    /* return drop-down with scene buttons */
    scene_button_select(div_id, id, device, scene) {

        device = check_if_element_or_value(device, false);

        let device_config = this.data["CONFIG"]["devices"];
        let device_macro = {};
        let device_macro_button = {};
        let macros_scene = dictCopy(this.data["CONFIG"]["scenes"][scene]["remote"]["macro-scene"]);
        let macros = {"scene": macros_scene};
        let groups = {};
        let group_devices = {};
        let available_buttons = [];
        let type = "";
        [type, device] = device.split("_");

        if (type === "macro") {
            let temp = Object.keys(this.data["CONFIG"]["macros"][device]);
            for (let i = 0; i < temp.length; i++) {
                available_buttons.push(device + "_" + temp[i]);
            }
        }
        if (type === "device") {
            let temp = this.data["CONFIG"]["devices"][device]["buttons"];
            for (let i = 0; i < temp.length; i++) {
                available_buttons.push(device + "_" + temp[i]);
            }
        }
        if (type === "group") {
            let temp = this.data["CONFIG"]["macros"]["groups"][device]["devices"];
            let temp_buttons = {};
            for (let i = 0; i < temp.length; i++) {
                let dev_i = temp[i];
                if (this.data["CONFIG"]["devices"][dev_i]) {
                    temp_buttons[dev_i] = this.data["CONFIG"]["devices"][dev_i]["buttons"];
                }
            }
            let arrays = Object.values(temp_buttons);
            let available_buttons_temp = arrays.reduce((acc, arr) => acc.filter(x => arr.includes(x)));
            for (let i = 0; i < available_buttons_temp.length; i++) {
                available_buttons.push("group_" + device + "_" + available_buttons_temp[i]);
            }
        }

        let on_change = "document.getElementById('" + id + "').value = this.value;";
        let device_macro_select = this.basic.select_array("add_button_device_" + device, "button (" + device + ")", available_buttons, on_change, '', true);

        setTextById(div_id, device_macro_select);
    }

    /* create drop-downs for scene toggle buttons */
    scene_toggle_select(div_id, id, device, scene) {

        device = check_if_element_or_value(device, false);
        let select = "<i>" + lang("SELECT_DEV_FIRST") + "</i>";
        let select_value = "";
        let select_on = "";
        let select_off = "";

        if (device !== "" && this.data["CONFIG"]["devices"][device]) {
            let device_config = this.data["CONFIG"]["devices"][device];
            let device_name = this.data["CONFIG"]["devices"][device]["settings"]["label"];

            select_value = this.basic.select_array("add_toggle_value", "value (boolean)", device_config["commands"]["get"], "", "power");
            select_on = this.basic.select_array("add_toggle_on", "button ON", device_config["buttons"], "", "on");
            select_off = this.basic.select_array("add_toggle_off", "button OFF", device_config["buttons"], "", "off");

            setValueById("add_toggle_descr", "Toggle " + device_name + " (" + device + ")")
        } else {
            select_value = select;
            select_on = select;
            select_off = select;
        }

        setTextById("toggle_device_value", select_value);
        setTextById("toggle_device_on", select_on);
        setTextById("toggle_device_off", select_off);
    }

    /* create drop-downs for scene slider buttons */
    scene_slider_select(div_id, id, device, scene) {

        device = check_if_element_or_value(device, false);
        let select = "<i>" + lang("SELECT_DEV_FIRST") + "</i>";
        let select_cmd, select_param, select_min_max = "";

        if (device !== "" && this.data["CONFIG"]["devices"][device]) {
            let device_config = this.data["CONFIG"]["devices"][device];
            let device_name = this.data["CONFIG"]["devices"][device]["settings"]["label"];
            let device_cmd = this.device_has_ranges(device, true);

            let onchange_slider_param = this.app_name + ".rm_scene.prepare_slider('" + device + "','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax');";

            select_cmd = this.basic.select_array("add_slider_cmd", lang("BUTTON_T_SEND"), device_cmd, "", "")
            select_param = this.basic.select_array("add_slider_param", lang("BUTTON_T_PARAMETER"), device_cmd, onchange_slider_param, "")
            select_min_max = this.basic.input("add_slider_minmax", lang("BUTTON_T_MINMAX"))

            setValueById("add_slider_descr", "Slider " + device_name + " (" + device + ")")
        } else {
            select_cmd = select;
            select_param = select;
            select_min_max = select;
        }

        setTextById("slider_device_cmd", select_cmd);
        setTextById("slider_device_param", select_param);
        setTextById("slider_device_min-max", select_min_max);
    }

    /* return list of templates */
    template_list(type = "") {
        let templates = {};
        for (let key in this.data["CONFIG"]["templates"]["definition"]) {
            if (type === "") {
                templates[key] = this.data["CONFIG"]["templates"]["definition"][key]["description"];
            } else if (this.data["CONFIG"]["templates"]["definition"][key]["type"] === type) {
                templates[key] = this.data["CONFIG"]["templates"]["definition"][key]["description"];
            }
        }
        return templates;
    }

    /* return drop-down with templates */
    template_select(id, title, data, onchange = "") {
        let item = "<select style=\"width:" + this.basic.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
        item += "<option value='' disabled='disabled' selected>" + lang("SELECT") + " " + title + "</option>";
        for (let key in data) {
            if (key !== "default") {
                item += "<option value=\"" + key + "\">" + data[key] + "</option>";
            }
        }
        item += "</select>";
        return item;
    }

    /* empty field */
    empty(id, comment = "") {

        setTextById(id, comment);
    }

    /* ensure, that all elements are visible and settings are hidden */
    show(device = "") {

        statusCheck_load();			// ... check if part of class ...
        setTextById("buttons_all", "");		// ... move to showRemote() ...
        showRemoteInBackground(0);			// ... check if part of this class ...
        rm3settings.hide();				// ... check if part of another class ...
    }

}


/*
* class to create GUI dialogs to add, edit or delete elements of the remote definition, when edit mode is set true
*/
class RemoteEditDialogs {

    constructor (name, remote_type, remote) {
        this.data = {};
        this.app_name = name;
        this.remote = remote;
        this.remote_type = remote_type;
        this.templates = {};

        this.preview_remote = "";
        this.preview_display = "";
        this.preview_display_size = "";
        this.preview_channel = "";

        this.basic = new RemoteBasicElements(name + ".basic");
        this.button = new RemoteElementButtons(name + ".button");
        this.display = new RemoteElementDisplay(name + ".display");
        this.tab = new RemoteElementTable(name + ".tab");

        this.rm_scene = new RemoteJsonElements(this.app_name + ".rm_scene", "scene", this.remote);
        this.rm_device = new RemoteJsonElements(this.app_name + ".rm_device", "device", this.remote);

        this.logging = new jcLogging(this.app_name);
        this.logging.debug("Create RemoteJsonElements (" + name + "/" + remote_type + "/" + this.json_field_id + ")");
    }

    /* Update data from parent */
    update(data, preview_remote, preview_display, preview_display_size, preview_channel) {
        this.data = data;
        this.templates = this.data["CONFIG"]["templates"]["list"];
        this.preview_remote = preview_remote;
        this.preview_display = preview_display;
        this.preview_display_size = preview_display_size;
        this.preview_channel = preview_channel;

        this.rm_device.update(this.data);
        this.rm_scene.update(this.data);
    }

    /* add json elements */
    edit_fields(element, id, device) {

        // set vars
        let edit = "";
        let line = false;
        let scene = "";

        this.button.width = "90px";
        this.button.height = "25px";

        //let device_commands = [];

        let link_template = "";
        let display_sizes = undefined;
        let device_config = {};
        let device_display = {};
        let device_macro = {};
        let devices = {};
        let devices_groups = {};
        let devices_slider = {};
        let remote_info = this.data["CONFIG"]["devices"];
        let scene_remote = {};

        let toggle_onchange = "";
        let slider_onchange = "";
        let device_macro_onchange = "";
        let device_display_onchange = "";

        let json_preview_values = {};
        let json_edit_values = {};

        let remote_definition = {};
        let remote_display = [];
        let remote_display_size = "";

        if (this.remote_type === "device") {
            //let device_macros = this.data["CONFIG"]["macros"];
            //let device_info = device_config["settings"];
            //let link_preview = this.app_name + ".rm_device.preview('" + device + "');"
            device_config = this.data["CONFIG"]["devices"][device];
            display_sizes = this.display.sizes();
            link_template = this.app_name + ".rm_device.import_templates('" + device + "','add_template');";
            remote_definition = device_config["remote"]["remote"];
            remote_display = device_config["remote"]["display"];
            remote_display_size = device_config["remote"]["display-size"];

        }
        else if (this.remote_type === "scene") {
            //let scene_info = this.data["CONFIG"]["scenes"][scene]["settings"];
            //let link_preview = this.app_name + ".rm_scene.preview('" + scene + "');";
            scene = device;
            scene_remote = this.data["CONFIG"]["scenes"][scene]["remote"];
            display_sizes = this.display.sizes();

            for (let key in this.data["CONFIG"]["devices"]) {
                devices[key] = "Device: " + remote_info[key]["settings"]["label"];
                devices_groups[key] = "Device: " + remote_info[key]["settings"]["label"];
                device_macro["device_" + key] = "Device: " + remote_info[key]["settings"]["label"];
                device_display[key] = remote_info[key]["settings"]["label"];

                //device_commands = this.data["CONFIG"]["devices"][key]["commands"];
                //if (device_commands["set"].length > 0 || device_commands["get"] > 0) {
                if (this.remote.device_has_ranges(key)) {
                    devices_slider[key] = "Device: " + remote_info[key]["settings"]["label"];
                }
            }
            for (let key in this.data["CONFIG"]["macros"]["groups"]) {
                if (this.data["CONFIG"]["macros"]["groups"][key]["description"]) {
                    device_macro["group_" + key] = "Group: " + this.data["CONFIG"]["macros"]["groups"][key]["description"] + " (" + key + ")";
                    devices_groups["group_" + key] = "Group: " + this.data["CONFIG"]["macros"]["groups"][key]["description"] + " (" + key + ")";
                } else {
                    device_macro["group_" + key] = "Group: " + key;
                    devices_groups["group_" + key] = "Group: " + key;
                }
            }
            for (let key in this.data["CONFIG"]["macros"]) {
                if (key !== "groups") {
                    device_macro["macro_" + key] = "Macro: " + key;
                }
            }
            device_macro["scene"] = "Macro: " + scene;

            link_template = this.remote.app_name + ".rm_scene.import_templates('" + scene + "','add_template');";
            toggle_onchange = this.remote.app_name + ".scene_toggle_select('add_button_device_input','add_button_value','add_toggle_device','" + scene + "');";
            slider_onchange = this.remote.app_name + ".scene_slider_select('add_button_device_input','add_button_value','add_slider_device','" + scene + "');";
            device_macro_onchange = this.remote.app_name + ".scene_button_select('add_button_device_input','add_button_value','add_button_device','" + scene + "');";
            device_display_onchange = this.remote.app_name + ".scene_display_select('add_display_input','add_display_value','add_display_device');";

            // prepare field values
            json_preview_values = {
                "remote": this.preview_remote,
                "display": this.preview_display,
                "display-size": this.preview_display_size,
                "macro-channel": this.preview_channel,
            };
            json_edit_values = {
                "remote": JSON.parse(getValueById("json::remote")),
                "display": JSON.parse(getValueById("json::display")),
                "macro-channel": JSON.parse(getValueById("json::macro-channel")),
            }
            if (this.preview_display_size !== "") {
                json_edit_values["display-size"] = this.preview_display_size;
            } else if (scene_remote["display-size"]) {
                json_edit_values["display-size"] = scene_remote["display-size"];
            }

        }

        // create editing elements for devices
        if (this.remote_type === "device" && element === "toggle") {

            edit += this.tab.start();
            edit += this.tab.row(
                "Description:",
                this.basic.input("add_toggle_descr", "")
            );
            edit += this.tab.row(
                "Value:",
                this.basic.select_array("add_toggle_value", "value (boolean)", device_config["commands"]["get"], "", "power")
            );
            edit += this.tab.row(
                "Button ON:",
                this.basic.select_array("add_toggle_on", "button ON", device_config["buttons"], "", "on")
            );
            edit += this.tab.row(
                "Button OFF:",
                this.basic.select_array("add_toggle_off", "button OFF", device_config["buttons"], "", "off")
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.button.edit(this.app_name + ".rm_device.add_toggle('" + device + "', '" + device + "','add_toggle_descr','add_toggle_value','add_toggle_on','add_toggle_off');", lang("BUTTON_T_ADD"), "")
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "color_picker") {

            let select_color_values = [];
            for (let i = 0; i < device_config["commands"]["set"].length; i++) {
                let key = device_config["commands"]["set"][i];
                if (device_config["commands"]["definition"][key] !== undefined && device_config["commands"]["definition"][key]["values"] !== undefined &&
                    device_config["commands"]["definition"][key]["values"]["min"] !== undefined && device_config["commands"]["definition"][key]["values"]["max"] !== undefined) {
                    select_color_values.push(key);
                } else if (device_config["commands"]["definition"][key] !== undefined && device_config["commands"]["definition"][key]["type"] === "list") {
                    select_color_values.push(key);
                }
            }

            edit += this.tab.start();
            if (select_color_values.length > 0) {
                let color_models = ["Brightness", "Color RGB", "Color CIE_1931", "Color RGB (small)", "Color CIE_1931 (small)", "Color temperature"];

                edit += this.tab.row(
                    "Send command:",
                    this.basic.select_array("add_colorpicker_cmd", lang("BUTTON_T_SEND"), select_color_values, "", ""),
                );
                edit += this.tab.row(
                    "Color model:",
                    this.basic.select_array("add_colorpicker_model", lang("BUTTON_T_COLOR"), color_models),
                );
                edit += this.tab.line();
                edit += this.tab.row(
                    this.button.edit(this.app_name + ".rm_device.add_color_picker('" + device + "','add_colorpicker_cmd');", lang("BUTTON_T_ADD"), "")
                );
            } else {
                edit += this.tab.row(
                    lang("COLORPICKER_N/A"),
                    this.button.edit("N/A", "", "disabled")
                );
            }
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "slider") {


            let param = this.remote.device_has_ranges(device, true);
            edit += this.tab.start();
            if (this.remote.device_has_ranges(device)) {
                let onchange_slider_param = this.app_name + ".rm_device.prepare_slider('" + device + "','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax');";

                edit += this.tab.row(
                    "Send command:",
                    this.basic.select_array("add_slider_cmd", lang("BUTTON_T_SEND"), param, "", "")
                );
                edit += this.tab.row(
                    "Parameter:",
                    this.basic.select_array("add_slider_param", lang("BUTTON_T_PARAMETER"), param, onchange_slider_param, "")
                );
                edit += this.tab.row(
                    "Description:",
                    this.basic.input("add_slider_descr", lang("BUTTON_T_DESCRIPTION"))
                );
                edit += this.tab.row(
                    "Min and max values:",
                    this.basic.input("add_slider_minmax", lang("BUTTON_T_MINMAX"))
                );
                edit += this.tab.line();
                edit += this.tab.row(
                    this.button.edit(this.app_name + ".rm_device.add_slider('" + device + "','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax');", lang("BUTTON_T_ADD"), "")
                );
            } else {
                edit += this.tab.row(
                    lang("SLIDER_N/A"),
                    this.button.edit("N/A", "", "disabled")
                );
            }
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "button_line") {

            edit = this.tab.start();
            edit += this.tab.row(
                this.basic.select_array("add_button_select", "defined button", device_config["buttons"], "", ""),
                this.button.edit(this.app_name + ".rm_device.add_button('" + device + "','add_button_select');", lang("BUTTON_T"), "")
            );
            edit += this.tab.row(
                this.basic.input("add_button"),
                this.button.edit(this.app_name + ".rm_device.add_button('" + device + "','add_button');", lang("BUTTON_T_OTHER"), "")
            );
            edit += this.tab.line();
            edit += this.tab.row(
                lang("ADD_LINE"),
                this.button.edit(this.app_name + ".rm_device.add_button('" + device + "','LINE');", lang("BUTTON_T_LINE"), "")
            );
            edit += this.tab.row(
                this.basic.input("add_line_text"),
                this.button.edit(this.app_name + ".rm_device.add_line('" + device + "','add_line_text');", lang("BUTTON_T_LINE_TEXT"), "")
            );
            edit += this.tab.line();
            edit += this.tab.row(
                lang("ADD_EMPTY"),
                this.button.edit(this.app_name + ".rm_device.add_button('" + device + "','.');", lang("BUTTON_T_EMPTY"), "")
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "default") {

            this.button.width = "90px";
            edit = this.tab.start();
            edit += this.tab.row("<center>" +
                this.button.edit(this.app_name + ".rm_device.add_button( '" + device + "','.');", lang("BUTTON_T_EMPTY"), "") + "&nbsp; " +
                this.button.edit(this.app_name + ".rm_device.add_button( '" + device + "','LINE');", lang("BUTTON_T_LINE"), "") + "&nbsp; " +
                this.button.edit(this.app_name + ".rm_device.add_display('" + device + "');", lang("BUTTON_T_DISPLAY"), "") + "&nbsp; " +
                "</center>",
                false
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "display") {

            let check_display = JSON.stringify(remote_definition);
            let display_add_cmd = this.app_name + ".rm_device.add_display_value('" + device + "','add_display_device','remote_display_value','remote_display_label')";
            let display_del_cmd = this.app_name + ".rm_device.delete_display_value('" + device + "','remote_display_delete')";

            edit = this.tab.start();
            if (check_display.indexOf("DISPLAY") < 0) {
                edit += this.tab.row(
                    lang("DISPLAY_NOT_ADDED"),
                    this.button.edit(this.app_name + ".rm_device.add_display('" + device + "');", lang("BUTTON_T_DISPLAY"), "")
                );
            } else {
                edit += this.tab.row(
                    lang("DISPLAY_EXISTS"),
                    this.button.edit("", "", "disabled")
                );
            }
            edit += this.tab.row(
                this.basic.select("remote_display_size", "display size", display_sizes, "", remote_display_size),
                this.button.edit(this.app_name + ".rm_device.preview('" + device + "');", lang("BUTTON_T_PREVIEW"))
            );
            edit += this.tab.line();
            edit += this.tab.row(
                "<input id='add_display_device' style='display:none;' value='X'>" +
                this.remote.device_display_select(device, 'remote_display_value'),
                this.button.edit("N/A", "", "disabled")
            );
            edit += this.tab.row(
                this.basic.input("remote_display_label", lang("LABEL")),
                this.button.edit(display_add_cmd, lang("BUTTON_T_VALUE"))
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.basic.select_array("remote_display_delete", lang("BUTTON_T_DISPLAY_VALUE"), Object.keys(remote_display), "", ""),
                this.button.edit(display_del_cmd, lang("BUTTON_T_DEL_VALUE"))
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "template") {
            let templates = this.remote.template_list("device");
            edit = this.tab.start();
            edit += this.tab.row(
                this.remote.template_select("add_template", lang("BUTTON_T_TEMPLATE"), templates),
                this.button.edit(link_template, lang("BUTTON_T_CLONE"), "")
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "device" && element === "delete") {
            edit = "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row(
                this.remote.button_select("del_button", device, remote_definition),
                this.button.edit(this.app_name + ".rm_device.delete_button('" + device + "','del_button');", lang("BUTTON_T_DELETE"), "")
            );
            edit += this.tab.end();
        }

        // create editing elements for scenes - OK
        else if (this.remote_type === "scene" && element === "toggle") {

            edit += "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row(
                "Device:",
                //this.basic.select("add_toggle_device","device / group", devices_groups, toggle_onchange),
                this.basic.select("add_toggle_device", "device", devices, toggle_onchange),
            );
            edit += this.tab.row(
                "Description:",
                "<div id='toggle_device_descr'>" +
                this.basic.input("add_toggle_descr", "") +
                "</div>"
            );
            edit += this.tab.row(
                "Value:",
                "<div id='toggle_device_value'></div>"
            );
            edit += this.tab.row(
                "Button ON:",
                "<div id='toggle_device_on'></div>"
            );
            edit += this.tab.row(
                "Button OFF:",
                "<div id='toggle_device_off'></div>"
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.button.edit(this.app_name + ".rm_scene.add_toggle('" + scene + "','add_toggle_device','add_toggle_descr','add_toggle_value','add_toggle_on','add_toggle_off');", lang("BUTTON_T_ADD"), "")
            );
            edit += this.tab.end();

            setTimeout(function () {
                eval(toggle_onchange);
            }, 500);
        }
        else if (this.remote_type === "scene" && element === "slider") {
            edit += "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row(
                "Device:",
                //this.basic.select("add_toggle_device","device / group", devices_groups, toggle_onchange),
                this.basic.select("add_slider_device", "device", devices_slider, slider_onchange),
            );
            edit += this.tab.row(
                "Send command:",
                "<div id='slider_device_cmd'></div>"
            );
            edit += this.tab.row(
                "Parameter:",
                "<div id='slider_device_param'></div>"
            );
            edit += this.tab.row(
                "Min and max values:",
                "<div id='slider_device_min-max'></div>"
            );
            edit += this.tab.row(
                "Description:",
                "<div id='slider_device_descr'>" +
                this.basic.input("add_slider_descr", "") +
                "</div>"
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.button.edit(this.app_name + ".rm_scene.add_slider('" + scene + "','add_slider_cmd','add_slider_param','add_slider_descr','add_slider_minmax','add_slider_device');", lang("BUTTON_T_ADD"), "")
            );
            edit += this.tab.end();

            setTimeout(function () {
                eval(slider_onchange);
            }, 500);
        }
        else if (this.remote_type === "scene" && element === "default") {

            edit = "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row(
                this.basic.select("add_button_device", "device / macro", device_macro, device_macro_onchange),
                this.button.edit("N/A", "", "disabled")
            );
            edit += this.tab.row(
                "<input id='add_button_value' style='display:none;'/>" +
                "<div id='add_button_device_input'><i><small>-&gt; " + lang("SELECT_DEV_MACRO") + "</small></i></div>",
                this.button.edit(this.app_name + ".rm_scene.add_button('" + scene + "','add_button_value');", lang("BUTTON_T"), "")
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.basic.input("add_line_text"),
                this.button.edit(this.app_name + ".rm_scene.add_line('" + scene + "','add_line_text');", lang("BUTTON_T_LINE_TEXT"), "")
            );
            edit += this.tab.row(
                "Add simple line:",
                this.button.edit(this.app_name + ".rm_scene.add_button('" + scene + "','LINE');", lang("BUTTON_T_LINE"), "")
            );
            edit += this.tab.line();
            edit += this.tab.row(
                "Add empty field:",
                this.button.edit(this.app_name + ".rm_scene.add_button('" + scene + "','.');", lang("BUTTON_T_EMPTY"), "")
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "scene" && element === "display") {

            let check_display = JSON.stringify(json_edit_values["remote"]);
            //let check_display   = JSON.stringify(json_preview_values["remote"]);
            let display_add_cmd = this.app_name + ".rm_scene.add_display_value('" + scene + "','add_display_device','scene_display_value','scene_display_label')";
            let display_del_cmd = this.app_name + ".rm_scene.delete_display_value('" + scene + "','scene_display_delete')";

            edit = this.tab.start();
            if (check_display.indexOf("DISPLAY") < 0) {
                edit += this.tab.row(
                    lang("DISPLAY_NOT_ADDED"),
                    this.button.edit(this.app_name + ".rm_scene.add_display('" + scene + "');", lang("BUTTON_T_DISPLAY"), "")
                );
            } else {
                edit += this.tab.row(
                    lang("DISPLAY_EXISTS"),
                    this.button.edit("", "", "disabled")
                );
            }
            edit += this.tab.row(
                this.basic.select("json::display-size", "display size", display_sizes, "", json_edit_values["display-size"]),
                this.button.edit(this.remote.app_name + ".scene_remote(  '" + this.remote.frames_remote[0] + "','" + scene + "','json::remote','json::display','json::display-size');" +
                    this.remote.app_name + ".scene_channels('" + this.remote.frames_remote[2] + "','" + scene + "','json::macro-channel');",
                    lang("BUTTON_T_PREVIEW"))
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.basic.select("add_display_device", lang("BUTTON_T_DEVICE"), device_display, device_display_onchange),
                this.button.edit("N/A", "", "disabled")
            );
            edit += this.tab.row(
                "<input id='add_display_value' style='display:none;'/>" +
                "<div id='add_display_input'><i><small>-&gt; " + lang("SELECT_DEV_FIRST") + "</small></i></div>",
                this.button.edit("N/A", "", "disabled")
            );
            edit += this.tab.row(
                this.basic.input("scene_display_label", lang("LABEL")),
                this.button.edit(display_add_cmd, lang("BUTTON_T_VALUE"))
            );
            edit += this.tab.line();
            edit += this.tab.row(
                this.basic.select_array("scene_display_delete", "display value", Object.keys(json_edit_values["display"]), "", ""),
                //this.basic.select_array("scene_display_delete","display value", Object.keys(json_preview_values["display"]),"",""),
                this.button.edit(display_del_cmd, lang("BUTTON_T_DEL_VALUE"))
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "scene" && element === "template") {
            this.button.width = "100px";
            edit = this.tab.start();
            edit += this.tab.row(
                this.remote.template_select("add_template", lang("BUTTON_T_TEMPLATE"), this.templates),
                this.button.edit(link_template, lang("BUTTON_T_CLONE"), "")
            );
            edit += this.tab.end();
            let edit_template = edit;
        }
        else if (this.remote_type === "scene" && element === "delete") {
            edit = "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row(
                this.remote.button_select("del_button", scene, json_edit_values["remote"]),
                //this.button_select("del_button",scene,json_preview_values["remote"]),
                this.button.edit(this.app_name + ".rm_scene.delete_button('" + scene + "','del_button');", lang("BUTTON_T_DEL"), "")
            );
            edit += this.tab.end();
        }
        else if (this.remote_type === "scene" && element === "header") {

            let check_header = JSON.stringify(json_edit_values["remote"]);
            //let header_exists = (check_header.indexOf("HEADER-IMAGE") >= 0);
            //let header_with_toggle = (check_header.indexOf("HEADER-IMAGE||toggle") >= 0);
            let header_on_change = this.app_name + ".update_fields('" + scene + "');";

            let add_header_img = "<div id='header_button_img'></div>";
            let add_header_img_t = "<div id='header_button_img_t'></div>";
            let add_header_img_d = "<div id='header_button_img_d'></div>";

            edit = "&nbsp;";
            edit += this.tab.start();
            edit += this.tab.row("Add simple header image:", add_header_img);
            edit += this.tab.line();
            edit += this.tab.row("Power device:",
                this.basic.select("header_toggle_device", "device", devices, header_on_change));
            edit += this.tab.row("Power value:", "<div id='header_toggle_value'></div>");
            edit += this.tab.row("Power ON (or macro):", "<div id='header_toggle_on'></div>");
            edit += this.tab.row("Power OFF (or macro):", "<div id='header_toggle_off'></div>");

            edit += this.tab.line();
            edit += this.tab.row("Add header image with toggle:", add_header_img_t);
            edit += this.tab.line();
            edit += this.tab.row("Remove header image:", add_header_img_d);
            edit += this.tab.end();

            setTimeout(() => {
                this.update_fields(scene);
            }, 1000);
        }

        // element not found
        else {
            this.logging.error("Editing for type="+this.remote_type+" and element="+element+" not defined.");
        }

        if (line) {
            edit += this.tab.line();
        }
        return edit;
    }

    /* update header settings */
    update_fields(scene) {

        this.button.width = "90px";
        this.button.height = "25px";

        let check_header = getValueById("json::remote");
        let header_exists = (check_header.indexOf("HEADER-IMAGE") >= 0);
        let header_with_toggle = (check_header.indexOf("HEADER-IMAGE||toggle") >= 0);
        let header_toggle_device = getValueById("header_toggle_device");
        let header_on_change = this.app_name + ".update_fields('" + scene + "');";

        let add_header_img = this.button.edit(this.remote.app_name + ".rm_scene.add_header('" + scene + "','HEADER-IMAGE');" + header_on_change, lang("BUTTON_T_ADD"), "");
        let add_header_img_t = this.button.edit(this.remote.app_name + ".rm_scene.add_header('" + scene + "','HEADER-IMAGE||toggle');" + header_on_change, lang("BUTTON_T_ADD"), "");
        let add_header_img_d = this.button.edit(this.remote.app_name + ".rm_scene.delete_header('" + scene + "');" + header_on_change, lang("BUTTON_T_DELETE"), "");

        let header_toggle_value = "<i>" + lang("SELECT_DEV_FIRST") + "</id>";
        let header_toggle_on = "<i>" + lang("SELECT_DEV_FIRST") + "</id>";
        let header_toggle_off = "<i>" + lang("SELECT_DEV_FIRST") + "</id>";
        let header_toggle_description = getValueById("add_toggle_descr");

        if (header_with_toggle) {
            add_header_img_t = "<i>active</i>";
        } else if (header_exists) {
            add_header_img = "<i>active</i>";
        } else {
            add_header_img_d = "<i>no header image yet</i>";
        }

        if (header_toggle_device !== "") {
            let device_config = this.data["CONFIG"]["devices"][header_toggle_device];
            let device_name = this.data["CONFIG"]["devices"][header_toggle_device]["settings"]["description"];
            let global_macros = this.data["CONFIG"]["macros"]["global"];
            let device_on_off = {};
            let device_values = {};

            for (let i = 0; i < device_config["buttons"].length; i++) {
                device_on_off[header_toggle_device + "_" + device_config["buttons"][i]] = "Button: " + device_config["buttons"][i];
            }
            Object.keys(global_macros).forEach(key => {
                device_on_off["macro_" + key] = "Macro: " + key;
            });
            for (let i = 0; i < device_config["commands"]["get"].length; i++) {
                device_values[header_toggle_device + "_" + device_config["commands"]["get"][i]] = device_config["commands"]["get"][i];
            }

            let device_on = device_on_off;
            let device_off = device_on_off;
            header_toggle_value = this.basic.select("header_toggle_1value", "power value", device_values, "", "", true);
            header_toggle_on = this.basic.select("header_toggle_1on", "button/macro ON", device_on, "", "", true);
            header_toggle_off = this.basic.select("header_toggle_1off", "button/macro OFF", device_off, "", "", true);

            header_toggle_description = "Toggle " + device_name + " (" + header_toggle_device + ")";

            setTextById("header_toggle_descr", header_toggle_description);

        }

        setTextById("header_button_img", add_header_img);
        setTextById("header_button_img_t", add_header_img_t);
        setTextById("header_button_img_d", add_header_img_d);
        setValueById("add_toggle_descr", header_toggle_description);
        setTextById("header_toggle_value", header_toggle_value);
        setTextById("header_toggle_on", header_toggle_on);
        setTextById("header_toggle_off", header_toggle_off);
    }

}


/*
* class to add elements to the JSON remote definition
*/
class RemoteJsonElements {

    constructor(name, remote_type, remote) {

        this.data = {};
        this.app_name = name;
        this.remote = remote;
        this.remote_type = remote_type;

        this.json = new RemoteJsonHandling(name + ".json");		// rm_remotes-elements.js
        this.logging = new jcLogging(this.app_name);
        this.logging.debug("Create RemoteJsonElements (" + name + "/" + remote_type + "/" + this.json_field_id + ")");

        if (this.remote_type === "scene") {
            this.json_field_id = "json::remote";
            this.json_field_id_channel = "json::macro-channel";
            this.json_field_id_display = "json::display";
            this.json_field_id_display2 = "json::display-size";
        } else if (this.remote_type === "device") {
            this.json_field_id = "remote_json_buttons";
            this.json_field_id_channel = "";
            this.json_field_id_display = 'remote_json_display';
            this.json_field_id_display2 = 'remote_display_size';
        } else {

            this.logging.error("Remote type '" + this.remote_type + "' not supported.");
        }
    }

    /* create preview of changed remote control (former .scene_preview and .remote_preview) */
    preview(scene_device) {

        if (this.remote_type === "scene") {
            this.remote.scene_edit_json(this.remote.frames_edit[1], scene_device, this.json_field_id, this.json_field_id_channel, this.json_field_id_display, this.json_field_id_display2);
            this.remote.scene_remote(this.remote.frames_remote[0], scene_device, this.json_field_id, this.json_field_id_display, this.json_field_id_display2);
            this.remote.scene_channels(this.remote.frames_remote[2], scene_device, this.json_field_id_channel);
        } else if (this.remote_type === "device") {
            this.remote.device_edit_json(this.remote.frames_edit[1], scene_device, this.json_field_id, this.json_field_id_display, this.json_field_id_display2);
            this.remote.device_remote(this.remote.frames_remote[0], scene_device, this.json_field_id, this.json_field_id_display, this.json_field_id_display2);
            this.remote.device_not_used(this.remote.frames_remote[2], scene_device);
        }
    }

    /* update configuration data */
    update(data) {

        this.data = data;
    }

    /* add button to JSON (former this.remote_add_button) */
    add_button(scene, button, position = "", multiple = false) {

        if (document.getElementById(button)) {
            button = getValueById(button);
        }
        if (button === "" || button === undefined) {
            appMsg.alert(lang("BUTTON_INSERT_NAME"));
            return;
        }

        let value = this.json.get_value(this.json_field_id);
        let value_new = [];

        if (position === "FIRST") {
            value_new.push(button);
        }

        for (let i = 0; i < value.length; i++) {
            if (i === position && position !== "" && position !== "FIRST") {
                value_new.push(button);
            }
            value_new.push(value[i]);
        }

        if (position === "") {
            value_new.push(button);
        }

        this.json.textarea_replace(this.json_field_id, value_new);

        if (!multiple) {
            this.preview(scene);
        }
    }

    /* add color picker to JSON*/
    add_color_picker(scene, button_select, position = "") {

        if (this.remote_type === "scene") {
            this.logging.warn("Color Picker not implemented for scenes yet.");
        }

        let color_model = "";
        let button = getValueById(button_select);
        if (button === "" || button === undefined) {
            appMsg.alert(lang("COLORPICKER_SELECT_CMD"));
            return;
        }

        if (document.getElementById("add_colorpicker_model")) {
            color_model = "||" + document.getElementById("add_colorpicker_model").value;
        }
        if (document.getElementById(button_select)) {
            button = "COLOR-PICKER||send-" + button + color_model;
        }

        if (document.getElementById(this.json_field_id).innerHTML.indexOf(button) > -1) {
            appMsg.alert(lang("MSG_ONLY_ONE_COLOR_PICKER"));
        } else {
            this.add_button(scene, button, position);
            this.preview(scene);
        }
    }

    /* add display to JSON */
    add_display(scene, position = "") {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("DISPLAY") < 0) {
            this.add_button(scene, "DISPLAY", position);
            this.preview(scene);
        } else {
            appMsg.alert(lang("DISPLAY_EXISTS"));
        }
    }

    /* add display value from JSON */
    add_display_value(scene, device, value, label) {

        let device_new = getValueById(device);
        let value_new = getValueById(value);
        let label_new = getValueById(label);

        if (device_new === "" || value_new === undefined) {
            appMsg.alert(lang("DISPLAY_VALUE_SELECT"));
            return;
        }
        if (value_new === "" || value_new === undefined) {
            appMsg.alert(lang("DISPLAY_VALUE_SELECT"));
            return;
        }
        if (label_new === "" || label_new === undefined) {
            appMsg.alert(lang("DISPLAY_LABEL_ADD"));
            return;
        }

        let display_new = this.json.get_value(this.json_field_id_display);

        if (!display_new[label_new] && device_new !== "X") {
            display_new[label_new] = device_new + "_" + value_new;
        }
        if (!display_new[label_new]) {
            display_new[label_new] = value_new;
        } else {
            appMsg.alert(lang("DISPLAY_LABEL_EXISTS_ALREADY"));
        }

        this.json.textarea_replace(this.json_field_id_display, display_new);
        this.preview(scene);
    }

    /* remote header from JSON */
    add_header(scene, button, position = "") {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("HEADER-IMAGE") >= 0 || value.indexOf("HEADER-IMAGE||toggle") >= 0) {
            appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
        } else if (value.indexOf("HEADER-IMAGE||toggle") < 0 && button === "HEADER-IMAGE||toggle") {

            // CHECK IF VALUES FOR TOGGLE ARE SET ...
            let header_toggle_value = getValueById("header_toggle_1value");
            let header_toggle_on = getValueById("header_toggle_1on");
            let header_toggle_off = getValueById("header_toggle_1off");

            if (header_toggle_value === undefined) {
                appMsg.alert("Select the power device value first!");
                return;
            } else if (header_toggle_on === undefined || header_toggle_on === "") {
                appMsg.alert("Select the power device ON command first!");
                return;
            } else if (header_toggle_off === undefined || header_toggle_off === "") {
                appMsg.alert("Select the power device OFF command first!");
                return;
            }

            let toggle_button = "TOGGLE||" + header_toggle_value + "||Power Device||" + header_toggle_on + "||" + header_toggle_off;

            this.add_button(scene, toggle_button, "FIRST", true);
            this.add_button(scene, button, "FIRST");
        } else if (value.indexOf("HEADER-IMAGE") < 0 && button === "HEADER-IMAGE") {
            this.add_button(scene, button, "FIRST");
        }
    }

    /* add a line with description */
    add_line(scene, button, position = "", multiple = false) {

        if (document.getElementById(button)) {
            button = "LINE||" + getValueById(button);
        }

        this.add_button(scene, button, position, multiple = false);
    }

    /* add a slider with description */
    add_slider(scene, slider_cmd, slider_param, slider_descr, slider_minmax, slider_device = "", position = "") {

        let button;
        let s_cmd = getValueById(slider_cmd);
        let s_param = getValueById(slider_param);
        let s_descr = getValueById(slider_descr);
        let s_minmax = getValueById(slider_minmax);
        let s_device = getValueById(slider_device);

        if (s_cmd === "" || s_cmd === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_CMD"));
            return;
        }
        if (s_param === "" || s_param === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_PARAM"));
            return;
        }
        if (s_descr === "" || s_descr === undefined) {
            appMsg.alert(lang("SLIDER_INSERT_DESCR"));
            return;
        }
        if (s_minmax === "" || s_minmax === undefined) {
            appMsg.alert(lang("SLIDER_INSERT_MINMAX"));
            return;
        }

        if (this.remote_type === "scene") {
            button = s_device + "_SLIDER||send-" + s_cmd + "||" + s_descr + "||" + s_minmax + "||" + s_param;
        } else {
            button = "SLIDER||send-" + s_cmd + "||" + s_descr + "||" + s_minmax + "||" + s_param;
        }
        this.add_button(scene, button, position);
        this.preview(scene);
    }

    /* add a toggle with description */
    add_toggle(scene, t_device, t_descr, t_value, t_on, t_off, position = "") {

        t_device = getValueById(t_device);
        t_value = getValueById(t_value);
        t_descr = getValueById(t_descr);
        t_on = getValueById(t_on);
        t_off = getValueById(t_off);
        let button;

        if (t_value === "" || t_value === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_VALUE"));
            return;
        }
        if (t_descr === "" || t_descr === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_DESCR"));
            return;
        }
        if (t_on === "" || t_on === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_ON"));
            return;
        }
        if (t_off === "" || t_off === undefined) {
            appMsg.alert(lang("TOGGLE_SELECT_OFF"));
            return;
        }

        if (this.remote_type === "scene") {
            if (t_device === "" || t_device === undefined) {
                appMsg.alert(lang("TOGGLE_SELECT_DEVICE"));
                return;
            }
            button = "TOGGLE||" + t_device + "_" + t_value + "||" + t_descr + "||" + t_device + "_" + t_on + "||" + t_device + "_" + t_off;
        } else {
            button = "TOGGLE||" + t_value + "||" + t_descr + "||" + t_on + "||" + t_off;
        }

        this.add_button(scene, button, position);
        this.preview(scene);
    }

    /* delete button from JSON */
    delete_button(scene, button) {

        if (Number.isInteger(Number(button))) {}
        else if (document.getElementById(button)) {
            button = getValueById(button);
        }
        if (button === "") {
            appMsg.alert(lang("BUTTON_SELECT"));
            return;
        }

        let value_org = this.json.get_value(this.json_field_id);
        let value_new = [];
        for (let i = 0; i < value_org.length; i++) {
            if (i !== Number(button)) {
                value_new.push(value_org[i]);
            }
        }

        this.json.textarea_replace(this.json_field_id, value_new);
        this.preview(scene);
    }

    /* delete value from display */
    delete_display_value(scene, remove_label) {

        let label_new = getValueById(remove_label);
        let display_new = this.json.get_value(this.json_field_id_display);

        if (label_new === "" || label_new === undefined) {
            appMsg.alert(lang("DISPLAY_LABEL_SELECT"));
            return;
        }
        if (!display_new[label_new]) {
            appMsg.alert(lang("DISPLAY_LABEL_DONT_EXIST"));
            return;
        } else {
            delete display_new[label_new];
        }

        this.json.textarea_replace(this.json_field_id_display, display_new);
        this.preview(scene);
    }

    /* delete header from JSON */
    delete_header(scene) {

        let value = this.json.get_value(this.json_field_id);

        if (value.indexOf("HEADER-IMAGE||toggle") >= 0) {
            this.delete_button(scene, "0");
            this.delete_button(scene, "0");
            this.preview(scene);
        } else if (value.indexOf("HEADER-IMAGE") >= 0) {
            this.delete_button(scene, "0");
            this.preview(scene);
        } else {
            appMsg.alert(lang("HEADER_IMAGE_EXISTS"));
        }
    }

    /* import remote definition from template to JSON */
    import_templates(scene, template) {

        let value = getValueById(template);
        if (value === "") {
            appMsg.alert(lang("DEVICE_SELECT_TEMPLATE"));
            return;
        }

        template = this.data["CONFIG"]["templates"]["definition"][value];
        let value_new = template["remote"];
        if (template["display"]) {
            let display_new = template["display"];
        } else {
            let display_new = {};
        }
        if (template["display-size"]) {
            let displaysize_new = template["display"];
        } else {
            let displaysize_new = "";
        }

        if (this.remote_type === "scene") {
            for (let i = 0; i < value_new.length; i++) {
                if (value_new[i] !== "." && value_new[i].indexOf("DISPLAY") < 0 && value_new[i].indexOf("LINE") < 0 && value_new[i].indexOf("_") < 0) {
                    value_new[i] = "XXXX_" + value_new[i];
                }
            }
        }

        this.json.textarea_replace(this.json_field_id, value_new);
        this.preview(scene);
    }

    /* move button in JSON (left or right) */
    move_button(scene, button, left_right) {

        let value = this.json.get_value(this.json_field_id);
        let temp = value[button];

        if (left_right === "left") {
            if (button > 0) {
                let target = button - 1;
                value[button] = value[target];
                value[target] = temp;
            }
        }
        if (left_right === "right") {
            if (button < value.length) {
                let target = button + 1;
                value[button] = value[target];
                value[target] = temp;
            }
        }

        this.json.textarea_replace(this.json_field_id, value);
        this.preview(scene);
    }

    /* get slider configuration */
    prepare_slider(device, slider_cmd, slider_param, slider_description, slider_minmax, position = "") {

        let s_param = getValueById(slider_param);
        let s_description = "description";
        let s_device = this.data["CONFIG"]["devices"][device]["settings"]["label"];
        if (s_param === "" || s_param === undefined) {
            appMsg.alert(lang("SLIDER_SELECT_PARAM"));
            return;
        }

        if (this.remote_type === "scene") {
            s_description = s_device + ": " + s_param.charAt(0).toUpperCase() + s_param.slice(1);
        } else {
            s_description = s_param.charAt(0).toUpperCase() + s_param.slice(1);
        }
        setValueById(slider_description, s_description);

        let cmd_definition = this.data["CONFIG"]["devices"][device]["commands"]["definition"];

        this.logging.info(JSON.stringify(cmd_definition[s_param]));

        if (cmd_definition && cmd_definition[s_param]) {
            let min = "min";
            let max = "max";
            let exist = false;
            if (cmd_definition[s_param]["values"]) {
                if (cmd_definition[s_param]["values"]["min"] !== undefined) {
                    min = cmd_definition[s_param]["values"]["min"];
                    exist = true;
                }
                if (cmd_definition[s_param]["values"]["max"] !== undefined) {
                    max = cmd_definition[s_param]["values"]["max"];
                    exist = true;
                }
            }
            if (exist) {
                setValueById(slider_minmax, min + "-" + max);
            }
        }
    }

}


/*
* class to create advanced elements such as color picker, slider, and toggle for the remote control
*/
class RemoteAdvancedElements {

    constructor(name, remote) {

        // set main data
        this.data = {};
        this.app_name = name;
        this.remote = remote;
        this.active_name = this.remote.active_name;
        this.active_type = this.remote.active_type;
        this.logging = new jcLogging(this.app_name);
        this.logging.debug("Create RemoteAdvancedElements (" + this.app_name + "/" + this.active_name + "/" + this.active_type + ")");

        // connect pure elements
        this.e_color_picker = new RemoteElementColorPicker(this.app_name + ".e_color_picker");
        this.e_slider = new rmSlider(this.app_name + ".e_slider");
    }

    /* update API data */
    update(api_data) {

        this.data = api_data;
        this.active_name = this.remote.active_name;
    }

    /* create color picker */
    colorPicker(api_data, id, device, type = "devices", data) {

        this.logging.debug(this.app_name + ".colorPicker: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        if (device.indexOf("group") >= 0) {
            this.logging.warn("Groups are not yet available for color pickers.");
            return "";
        }

        let color_model = "RGB";
        let send_command = data[1];
        let sub_id = device + "_" + send_command;
        let label = "";
        if (data.length > 2) {
            color_model = data[2];
        }
        if (data.length > 3) {
            label = data[3];
        }

        let remote_data = this.data["CONFIG"][type][device]["remote"];
        let status_data = this.data["STATUS"]["devices"][device];

        let display_start = "<button id=\"colorpicker_" + sub_id + "_button\" class=\"color-picker\"><center>";
        display_start += "<canvas id=\"colorpicker_" + sub_id + "\">";

        let display_end = "</canvas>";
        display_end += "<canvas id=\"colorpicker_demo_" + sub_id + "\" class=\"color-picker-demo\">" + label + "</canvas></center>";
        display_end += "</center></button>";

        let text = display_start;
        //text += this.color_picker.colorPickerHTML_v1(send_command);
        text += display_end;

        setTimeout(() => {
            this.e_color_picker.colorPickerHTML("colorpicker_" + sub_id, sub_id, send_command, color_model);
        }, 100);
        return text;
    }

    /* create slider */
    slider(api_data, id, device, type = "devices", data) {

        this.logging.debug(this.app_name + ".slider: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        let init;
        let disabled = false;
        let status_data = {};
        let device_api = "";
        let device_api_status = "";

        if (device.indexOf("group_") >= 0) {
            let group_name = device.split("_")[1];
            let group_devices = this.data["CONFIG"]["macros"]["groups"][group_name];
            if (!group_devices || !group_devices["devices"] || group_devices["devices"].length === 0) {
                this.logging.error(this.app_name + ".slider_element: Group " + group_name + " not defined correctly.");
                return "";
            }
            let check_device = group_devices["devices"][0];
            status_data = this.data["STATUS"]["devices"][check_device];
            device_api = this.data["STATUS"]["devices"][check_device]["api"];
            device_api_status = this.data["STATUS"]["interfaces"]["connect"][device_api];
        } else if (!this.data["CONFIG"][type][device]) {
            this.logging.error(this.app_name + ".slider_element: Could not create slider element: " + type + " '" + device + "' does not exist.");
            return "";
        } else {
            status_data = this.data["STATUS"]["devices"][device];
            device_api = this.data["STATUS"]["devices"][device]["api"];
            device_api_status = this.data["STATUS"]["interfaces"]["connect"][device_api];
        }

        if (!device_api_status) {
            this.logging.error("API Device not defined correctly for " + device + ": " + device_api + " doesn't exist.")
        } else if (device_api_status.toLowerCase() !== "connected") {
            disabled = true;
        }

        if (!this.data["CONFIG"][type]) {
            this.logging.error(this.app_name + ".slider() - type not supported (" + type + ")");
            return;
        }

        if (data[4] && status_data[data[4]]) {
            init = status_data[data[4]];
        }

        let min = 0;
        let max = 100;
        let display_start = "<button id=\"slider_" + device + "_" + data[1] + "\" class=\"rm-slider-button\">";
        let display_end = "</button>";

        if (data.length > 3) {
            let min_max = data[3].split("-");
            min = min_max[0];
            max = min_max[1];
        }

        let text = display_start;
        text += this.e_slider.sliderHTML(data[1], data[2], device, data[1], min, max, init, disabled);
        text += display_end;
        return text;
    }

    /* create toggle element (ON | OFF) - "TOGGLE||<status-field>||<description/label>||<TOGGLE_CMD_ON>||<TOGGLE_CMD_OFF>" */
    toggle(api_data, id, device, type = "device", data, short = false) {

        this.logging.debug(this.app_name + ".toggle: " + id + "/" + device + "/" + type + "/" + data);
        this.update(api_data);

        let init, key, status_data;
        let reset_value = "";
        let min = 0;
        let max = 1;
        let device_id = device.split("_");
        device_id = device_id[0].split("||");

        if (this.data["CONFIG"]["devices"][device_id[1]] && this.data["CONFIG"]["devices"][device_id[1]]["interface"]["method"] !== "query") {
            reset_value = "<font style='color:gray'>[<status onclick=\"appFW.requestAPI('GET',['set','" + device_id[1] + "','power','OFF'], '', '', '' );\" style='cursor:pointer;'>OFF</status> | ";
            reset_value += "<status onclick=\"appFW.requestAPI('GET',['set','" + device_id[1] + "','power','ON'], '', '', '' );\" style='cursor:pointer;'>ON</status>]</font>";
        }
        let toggle_start = "";
        let toggle_end = "";
        if (!short) {
            toggle_start += "<button id=\"slider_" + device + "_" + data[1] + "\" class=\"rm-toggle-label long\">" + data[2] + " &nbsp; &nbsp;  " + reset_value + "</button>";
            toggle_start += "<button id=\"slider_" + device + "_" + data[1] + "\" class=\"rm-toggle-button\">";
            toggle_end += "</button>";
        } else {
            toggle_start += "<div class='header_image_toggle'>"
            toggle_end += "</div>"
        }

        let disabled = false;
        let device_key = data[1].split("_");
        if (device_key.length > 1) {
            device = device_key[0];
            key = device_key[1]
        } else {
            key = data[1];
        }

        let device_api = "";
        let device_api_status = "";

        if (this.data["STATUS"]["devices"][device]) {
            status_data = this.data["STATUS"]["devices"][device];
            device_api = this.data["STATUS"]["devices"][device]["api"];
            device_api_status = this.data["STATUS"]["interfaces"][device_api];
        }
        if (status_data[key] && device_api_status === "Connected") {
            if (status_data[key].toUpperCase() === "TRUE") {
                init = "1";
            } else if (status_data[key].toUpperCase() === "FALSE") {
                init = "0";
            } else if (status_data[key].toUpperCase() === "ON") {
                init = "1";
            } else if (status_data[key].toUpperCase() === "OFF") {
                init = "0";
            } else {
                init = "";
            }
        } else {
            init = "";
            disabled = true;
        }

        if (data[3].indexOf("_") < 0)   { data[3] = device + "_" + data[3]; }
        if (data[4].indexOf("_") < 0)   { data[4] = device + "_" + data[4]; }

        let text = toggle_start;
        text += this.e_slider.toggleHTML(data[1], data[2], device, data[3], data[4], init, disabled);
        text += toggle_end;
        return text;
    }
}
