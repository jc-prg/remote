//--------------------------------
// jc://remote/settings/
//--------------------------------

class RemoteSettings extends RemoteDefaultClass {
    constructor(name) {	// IN PROGRESS
        super(name);

        // preset vars
        this.data          = {};
        this.active        = false;
        this.e_settings    = ["setting1","setting2","setting3","setting4","setting5","setting6"];
        this.e_remotes     = ["frame3","frame4","frame5","frame1","frame2"];
        this.input_width   = "140px";
        this.initial_load  = true;
        this.edit_mode     = false;
        this.manual_mode   = false;
        this.mode          = "";
        this.index_buttons = undefined;
        this.line          = "<div style=\"border:1px solid;height:1px;margin: 10px 5px 5px;padding:0;\"></div>";

        this.json = new RemoteJsonHandling(this.name+".json");
        this.button = new RemoteControlBasic(this.name+".button");
        this.basic = new RemoteElementsEdit(this.name+".basic");
        this.tab = new RemoteElementTable(this.name+".tab");
        this.toggle = new RemoteElementSlider(this.name+".toggle");
        this.elements = new RemoteSettingsElements(this.name+".elements", this);

        this.module_timer = new RemoteSettingsTimer(this.name+".module_timer", this);
        this.module_macros = new RemoteSettingsMacro(this.name+".module_macros", this);
        this.module_info = new RemoteSettingsInfo(this.name+".module_info", this);
        this.module_general = new RemoteSettingsGeneral(this.name+".module_general", this);
        this.module_api = new RemoteSettingsApi(this.name+".module_api", this);
        this.module_remotes = new RemoteSettingsRemotes(this.name+".module_remotes", this);
        this.module_record = new RemoteSettingsRecording(this.name+".module_record", this);
    }

    // initialize settings
    init(data) {
            this.data = data;

            if (data)	{this.app_stat = rmStatus.status_system("system")["message"]; this.app_last = data["REQUEST"]["Button"];}
            else		{this.app_stat = "ERROR: no connection to server!";}

            if (this.initial_load) {
                // check if test
                if (test) 	{this.test_info = "Test Stage";}
                else 		{this.test_info = "Prod Stage";}

                this.initial_load = false;
                this.logging.default("Initialized new class 'RemoteSettings'.");
                }
            else {
                this.logging.default("Reload data 'RemoteSettings'.");
                }
            }

    // compose settings page
    create(selected_mode="", direct_cmd="", direct_data="") {

        this.index_buttons = "";
        this.header_title = getTextById("header_title");
        let archived = rmData.elements.data("keys_archive");
        elementVisible("setting_ext_top_frame");
        elementVisible("setting_ext_frames");

        if (selected_mode !== "")   { this.mode = selected_mode; }
        else if (this.mode !== "")  { selected_mode = this.mode; }

        if (selected_mode === "index") {

            rmMain.set_title(lang('SETTINGS'));
            this.settings_ext_reset();
            this.settings_ext_append(1, lang("SETTINGS"), this.index(), "", false, true);
            //this.settings_ext_append(2, lang("QUICK_ACCESS"), "&nbsp;<br/>" + this.index_quick(true, true));
            this.create_show_ext();

            rmStatusShow.visualize_element_button('button_edit_mode', getTextById('button_edit_mode'));
            rmStatusShow.visualize_element_button('button_manual_mode', getTextById('button_manual_mode'));
        }
        else if (selected_mode === "index_small") {
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, ""), "", true);
            this.create_show_ext();
        }
        else if (selected_mode === "general") {
            rmMain.set_title(lang('SETTINGS_GENERAL'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            //this.settings_ext_append(1,lang("SETTINGS_GENERAL"), this.module_general_settings());
            this.settings_ext_append(1,lang("SETTINGS_GENERAL"), this.module_general.create());
            this.index_buttons_html = this.index(true, "SETTINGS_GENERAL");
            this.create_show_ext();
            //this.module_general_settings_load();
            this.module_general.load();
        }
        else if (selected_mode === "edit_devices") {
            rmMain.set_title(lang('SETTINGS_DEVICES'));

            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(2,lang("ADD_DEVICE"), this.module_remotes.add_device(direct_cmd, direct_data));
            this.settings_ext_append(3,lang('EDIT_DEVICES'), this.module_remotes.list_devices());
            if (archived["devices"].length > 0) {
                this.settings_ext_append(4, lang('EDIT_ARCHIVED_DEVICES'), "<div id='list_archived_remotes'></div>");
                this.module_remotes.load_archived_devices();
            }
            this.index_buttons_html = this.index(true, "SETTINGS_DEVICES");
            this.create_show_ext();

            rmStatusShow.visualize_element_button('button_edit_mode', getTextById('button_edit_mode'));
            rmStatusShow.visualize_element_button('button_manual_mode', getTextById('button_manual_mode'));
            rmStatusShow.visualize_element_button('button_show_code', getTextById('button_show_code'));

            startDragAndDrop("sort_devices", movePosition);
        }
        else if (selected_mode === "edit_scenes") {
            rmMain.set_title(lang('SETTINGS_SCENES'));

            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(2,lang("ADD_SCENE"), this.module_remotes.add_scene(direct_cmd, direct_data));
            this.settings_ext_append(3,lang('EDIT_SCENES'), this.module_remotes.list_scenes());
            if (archived["scenes"].length > 0) {
                this.settings_ext_append(4, lang('EDIT_ARCHIVED_SCENES'), "<div id='list_archived_remotes'></div>");
                this.module_remotes.load_archived_scenes();
            }
            this.index_buttons_html = this.index(true, "SETTINGS_SCENES");
            this.create_show_ext();

            startDragAndDrop("sort_scenes", movePosition);
        }
        else if (selected_mode === "edit_interfaces") {
            rmMain.set_title(lang('SETTINGS_API'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.module_api.create_container_overview();
            this.module_api.create_container_apis();
            //this.settings_ext_append(1, "", this.module_api.show_device_details());
            //this.settings_ext_append(2, "", this.module_api.show_logs());
            this.create_show_ext();
            this.index_buttons_html = this.index(true, "SETTINGS_API");
            this.module_api.edit_api_config_load();
            this.module_api.edit_api_overview();
            rmStatusShow.visualize_element_button('button_edit_mode', getTextById('button_edit_mode'));
        }
        else if (selected_mode === "edit_timer") {
            rmMain.set_title(lang('SETTINGS_TIMER'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("SETTINGS_TIMER"), this.module_timer.create());
            this.index_buttons_html = this.index(true, "SETTINGS_TIMER");
            this.create_show_ext();
        }
        else if (selected_mode === "edit_macros") {
            rmMain.set_title(lang('SETTINGS_MACROS'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("EDIT_MACROS"), this.module_macros.create());
            this.index_buttons_html = this.index(true, "SETTINGS_MACROS");
            this.create_show_ext();
            this.module_macros.load();
        }
        else if (selected_mode === "edit_record") {
            rmMain.set_title(lang('SETTINGS_RECORDINGS'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("EDIT_RECORDINGS"), this.module_record.create());
            this.index_buttons_html = this.index(true, "SETTINGS_RECORDINGS");
            this.create_show_ext();
        }
        else {
            rmMain.set_title(lang('INFORMATION'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("VERSION_AND_STATUS"), this.module_info.create());
            this.settings_ext_append(2,lang("BUTTON_INFOS"), this.module_info.buttons());
            this.index_buttons_html = this.index(true, "INFORMATION");
            this.create_show_ext();
            this.create_show_log();
            this.module_info.load();
        }

        if (document.getElementById("setting_index_wrapper")) {
            this.index_buttons = new RemoteElementScrollBox("setting_index_wrapper", this.index_buttons_html);
            this.index_buttons.update();
        }
        else {
            this.index_buttons = undefined;
        }

        //scrollBoxRegister("indexScrollBox");
        rmStatusShow.show_status_app_modes();
        scrollTop();
    }

    // show and hide the relevant frames
    create_show() {

        elementVisible("setting_frames");
        elementHidden("setting_ext_frames");

        let show_settings = true;
        let show_remotes = false;
        this.active = true;
        rmMain.set_background(0);

        for (let i=0; i<this.e_remotes.length; i++)  { elementHidden(this.e_remotes[i],show_remotes);  }
        for (let i=0; i<this.e_settings.length; i++) { elementVisible(this.e_settings[i],show_settings); }
    }

    // show extended setting frames, hide default setting frames
    create_show_ext() {

            this.create_show();
            elementHidden("setting_frames");
            elementVisible("setting_ext_frames");
            }

    // create and show container for API communication logging information
    create_show_log() {

            elementVisible("setting_frames");
            for (var i=0; i<this.e_settings.length; i++) { elementHidden(this.e_settings[i]); }
            elementVisible(this.e_settings[this.e_settings.length-1]);

            // change display to contents that log is displayed below other setting frames, requires adjustment of parent elements width
            var element = document.getElementById(this.e_settings[this.e_settings.length-1]);
            element.className = "setting_bg main";
            document.getElementById("setting_ext_frames").style.display = "contents";
            document.getElementById("setting_frames").style.display = "contents";
            if (document.documentElement.clientWidth < 705) { document.getElementById("frame_block_content").style.width = "calc(100% + 16px)"; }
            else                                            { document.getElementById("frame_block_content").style.width = "calc(100% - 172px)"; }
            }

    // create index page and small index on the top
    index(small=false, selected="") {
        let html  = "";
        if (!small) { html += "&nbsp;<br/>"; }

        let button_img  = rmData.elements.data("button_images");
        let setting_modules_back = {
            "SETTINGS":         ["link_back",   "rmSettings.create('index');"],
        }
        let setting_modules = {
            "INFORMATION":         ["info2",       "rmSettings.create('info');"],
            "SETTINGS_DEVICES":    ["remote",      "rmSettings.create('edit_devices');"],
            "SETTINGS_SCENES":     ["cinema",      "rmSettings.create('edit_scenes');"],
            "SETTINGS_TIMER":      ["timer",       "rmSettings.create('edit_timer');"],
            "SETTINGS_MACROS":     ["macros",      "rmSettings.create('edit_macros');"],
            "SETTINGS_RECORDINGS": ["statistics",  "rmSettings.create('edit_record');"],
            "SETTINGS_API":        ["plug2",       "rmSettings.create('edit_interfaces');"],
            "SETTINGS_GENERAL":    ["settings2",   "rmSettings.create('general');"],
        }
        if (small) {
            let img_small = rm_image(button_img[setting_modules_back["SETTINGS"][0]], false);
            html += "<button class='rm-button_setting_index_small' onclick=\""+setting_modules_back["SETTINGS"][1]+"\">" + img_small + "</button>";
        }
        for (let key in setting_modules) {
            let css_class = "";
            if (key === selected) { css_class = " selected"; }
            let img_big   = rm_image(button_img[setting_modules[key][0]], true);
            let img_small = rm_image(button_img[setting_modules[key][0]], false);
            let text  = lang(key);
            if (small) { html += "<button class='rm-button_setting_index_small"+css_class+"' onclick=\""+setting_modules[key][1]+"\">" + img_small + "</button>"; }
            else       { html += "<button class='rm-button_setting_index' onclick=\""+setting_modules[key][1]+"\">" + img_big + "<br/>&nbsp;<br/>" + text + "</button>"; }
        }

        if (!small)                      { html += "<div style='rm-button_setting_wrapper'></div>"; }
        else if (selected === "WRAPPER") { html  = "<div id='setting_index_wrapper'></div>"; }

        return html;
    }

    // append an extended frame to the settings
    settings_ext_append(nr, label="", text="", style="", top=false, index=false) {
        let frame_content = getTextById("setting_ext_frames");

        if (label !== "") {
            text = "<span class='remote_edit_headline' style='text-align: center'><b>" + label + "</b></span>"  + this.basic.edit_line() + text + "<br/>";
        }

        if (top) {
            let device_frame = "";
            device_frame += "<div id='device_frame" + nr + "' class='setting_bg wide' style='display:block;"+style+"'>";
            device_frame += text;
            device_frame += "</div>";
            setTextById("setting_ext_top_frame", frame_content + device_frame);
        }
        else {
            let frame_empty = "<div id='device_frame0' class='setting_bg header empty' style='display:block;z-index:1;'></div>";
            let device_frame = "";
            if (frame_content === "" && index === false) {
                device_frame += frame_empty;
                }
            device_frame += "<div id='device_frame" + nr + "' class='setting_bg main' style='display:block;"+style+"'>";
            device_frame += text;
            device_frame += "</div>";
            setTextById("setting_ext_frames", frame_content + device_frame);
            }
    }

    // empty extended settings frames, e.g., used for the interface settings to list all APIs
    settings_ext_reset() {

        setTextById("setting_ext_top_frame", "");
        setTextById("setting_ext_frames", "");
    }

    // show all settings frames and hide others
    show() {
        this.active = true;
        for (let i=0; i<this.e_remotes.length; i++)  { elementHidden(this.e_remotes[i]);  }
        for (let i=0; i<this.e_settings.length; i++) { elementVisible(this.e_settings[i]); }

        //elementVisible("frame1");
        //elementVisible("frame2");
        rmMain.set_background(0);
        }

    // hide all settings frames and show frames for remotes
    hide() {
        this.active = false;
        this.mode   = "";

        for (let i=0; i<this.e_remotes.length; i++)  { elementVisible(this.e_remotes[i]);  }
        for (let i=0; i<this.e_settings.length; i++) { elementHidden(this.e_settings[i]); }

        if (this.edit_mode)          { elementVisible("frame1"); elementVisible("frame2"); } //elementVisible("frame3"); }
        else                         { elementHidden("frame1");  elementHidden("frame2");  } //elementHidden("frame3"); }

        elementVisible("setting_frames");
        elementHidden("setting_ext_frames");
    }

    // write settings category
    write(nr, label="", text="") {

        let element = this.e_settings[nr];
        let content;

        if (label !== "") {
            content 	= "<span class='remote_edit_headline' style='text-align: center'><b>" + label + "</b></span>"
                            + this.basic.edit_line()
                            + text
                            + "<br/>";
            }
        else if (text !== "") { content = text; }
        else { content = ""; }

        setTextById(element,content);
        }
}


/* module to add, sort and jump to remote controls (devices and scenes) in edit mode */
class RemoteSettingsRemotes extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.data = this.settings.data;
        this.basic = this.settings.basic;
        this.button = this.settings.button;
        this.elements = this.settings.elements;
        this.tab = this.settings.tab;

        this.remote_edit = this.remote_edit.bind(this);
        this.list_devices = this.list_devices.bind(this);
        this.list_scenes = this.list_scenes.bind(this);
    }

    // create dialogs to add scenes
    add_scene(direct_cmd="") {
        this.update_data();

        let setting = "";
        let set_temp;
        this.button.width  = "120px";
        this.button.height = "30px";

        let open_add_scene = false;
        if (direct_cmd === "add_scene") { open_add_scene = true; }
        if (rmData.scenes.not_available()) { open_add_scene = true; }

        set_temp  = this.tab.start();
        set_temp += this.tab.row( "ID:",            this.elements.input("add_scene_id", "", "rmStatusShow.visualize_id_exists('scene', this)") );
        set_temp += this.tab.row( "Label:",         this.elements.input("add_scene_label") );
        set_temp += this.tab.row( "Description:",   this.elements.input("add_scene_descr") );
        set_temp += this.tab.row( "<span class='center'>" +
            this.button.sized("add_scene",lang("ADD_SCENE"),"settings","rmApi.call(#SceneAdd#, [#add_scene_id#,#add_scene_label#,#add_scene_descr#]);") +
            "</span>", false);
        set_temp += this.tab.end();
        setting  += this.basic.container("setting_add_scene",lang("ADD_SCENE"),set_temp,open_add_scene);

        return setting;
    }

    // create drag & droppable list of scenes
    list_scenes(data=undefined) {

        let devices, html, order, scenes;
        let direct = true;

        if (data !== undefined) {
            html   = "&nbsp;<br/><ul id='sort_scenes_archived' class='slist'>";
            scenes = data["DATA"]["archive"];
            order = Object.keys(scenes);
            direct = false;
        } else {
            this.update_data();
            html   = "&nbsp;<br/><ul id='sort_scenes' class='slist'>";
            scenes = rmData.scenes.config_scenes;
            for (let key in scenes) {
                scenes[key]["position"] = rmData.scenes.remote_position(key);
            }
            order  = sortDict(scenes, "position");
        }

        if (order.length > 0) {
            for (let key in order) {
                let scene = order[key];
                let style = "";
                let edit, edit_style;
                if (scenes[scene]["settings"]["visible"] === "no") {
                    style = " hidden";
                }
                if (direct) { edit = this.remote_edit("scene", scene, scenes[scene]["settings"]["visible"]); edit_style = ""; }
                else        { edit = this.remote_archive("scene", scene, scenes[scene]["settings"]["visible"]); edit_style = " archive"; }

                html += "<li id='" + scene + "'>";
                html += "<div class='slist_li_content" + style + "'>" + scenes[scene]["settings"]["label"] + "<br/>";
                html += "<span style='color:#999999;font-style:normal;font-weight:normal;font-size:9px;'><rm-id>" + scene + "</rm-id></span></div>";
                html += "<div class='slist_li_edit"+edit_style+"'>" + edit + "</div>";
                html += "</li>";
            }
            html += "</ul>";
        }
        else {
            html += "<div style='width:100%;padding:15px;'>" + lang("SCENES_NOT_DEFINED_YET") + "</div>";
        }

        if (direct) { return html; }
        else { setTextById('list_archived_remotes', html); }
    }

    // create dialogs to add devices
    add_device(direct_cmd="", direct_data="") {
        this.update_data();

        let set_temp;
        let setting = "";
        this.button.width  = "120px";
        this.button.height = "30px";

        let open_add_device = false;
        if (direct_cmd === "add_device" && direct_data !== "") { set_temp = this.add_remote_dialog(direct_data); open_add_device = true; }
        else                                                   { set_temp = this.add_remote_dialog(); }
        if (rmData.devices.not_available()) { open_add_device = true; }


        setting += this.basic.container("setting_add_device",lang("ADD_DEVICE"),set_temp,open_add_device);
        return setting;
    }

    // create drag & droppable list of devices
    list_devices(data=undefined) {

        let devices, html, order;
        let direct = true;

        if (data !== undefined) {
            html   = "&nbsp;<br/><ul id='sort_devices_archived' class='slist'>";
            devices = data["DATA"]["archive"];
            order = Object.keys(devices);
            direct = false;
        } else {
            this.update_data();
            html   = "&nbsp;<br/><ul id='sort_devices' class='slist'>";
            devices = rmData.devices.config_devices;
            for (let key in devices) {
                devices[key]["position"] = rmData.devices.remote_position(key);
            }
            order  = sortDict(devices, "position");
        }

        if (order.length > 0) {
            for (let key in order) {
                let device = order[key];
                let api, edit, edit_style;
                if (devices[device]["interface"]) {
                    api = devices[device]["interface"]["api"].replace("_", "/");
                } else {
                    api = devices[device]["config"]["api_key"] + "/" + devices[device]["config"]["api_device"];
                }
                api = api.replace("/default", "");
                let style = "";
                if (devices[device]["settings"]["visible"] === "no") {
                    style = " hidden";
                }
                if (direct) { edit = this.remote_edit("device", device, devices[device]["settings"]["visible"]); edit_style = ""; }
                else        { edit = this.remote_archive("device", device, devices[device]["settings"]["visible"]); edit_style = " archive"; }

                html += "<li id='" + device + "'>";
                html += "<div class='slist_li_content" + style + "'>" + devices[device]["settings"]["label"] + "<br/>";
                html += "<div style='color:#999999;font-style:normal;font-weight:normal;font-size:9px;'><rm-id>" + device + "</rm-id> (" + api + ")</div></div>";
                html += "<div class='slist_li_edit"+edit_style+"'>" + edit + "</div>";
                html += "</li>";
            }
            html += "</ul>";
        }
        else {
            html += "<div style='width:100%;padding:15px;'>" + lang("DEVICES_NOT_DEFINED_YET") + "</div>";
        }

        if (direct) { return html; }
        else { setTextById('list_archived_remotes', html); }
    }

    // load archived devices
    load_archived_devices() {
        appFW.requestAPI("GET", ["archive", "device"], "", eval(this.name+".list_devices"));
    }

    // load archived devices
    load_archived_scenes() {
        appFW.requestAPI("GET", ["archive", "scene"], "", eval(this.name+".list_scenes"));
    }

    // create links for drag & drop items to edit the remotes (for scenes and devices)
    remote_edit(type, id, visible) {

        let delete_cmd;
        let images = rmData.elements.data("button_images");
        let img_visible = rm_image(images["hidden"]);
        let img_edit = rm_image(images["edit"]);
        let img_delete = rm_image(images["trash"]);
        let img_archive = rm_image(images["archive1"]);

        let onclick_reload = "setTimeout(function() { "+this.settings.name+".create(\"edit_"+type+"s\"); }, 2000);";
        let onclick_archive = "apiMoveToArchive(\""+type+"\", \""+id+"\");" + onclick_reload;

        if (visible === "no")  { img_visible = rm_image(images["visible"]); }
        if (type === "device") { delete_cmd  = "apiDeviceDelete"; }
        else                   { delete_cmd  = "apiSceneDelete"; }

        let edit_commands = "";
        edit_commands += "<span onclick='apiRemoteChangeVisibility(\""+type+"\",\""+id+"\",\"rm_visibility_"+id+"\");"+onclick_reload+"' style='cursor:pointer;'>" + img_visible + "</span>&nbsp;&nbsp;&nbsp;";
        edit_commands += "<span onclick='rmMain.set_main_var(\"edit_mode\",true);rmRemote.create(\""+type+"\",\""+id+"\");' style='cursor:pointer;'>" + img_edit + "</span>&nbsp;&nbsp;";
        edit_commands += "<input id=\"rm_visibility_"+id+"\" style=\"display:none;\" value=\""+visible+"\">";
        edit_commands += "<span onclick='"+onclick_archive+"' style='cursor:pointer;'>" + img_archive + "</span>&nbsp;&nbsp;";
        edit_commands += "<span onclick='"+delete_cmd+"(\""+id+"\");' style='cursor:pointer;'>" + img_delete + "</span>";
        return edit_commands;
    }

    // create links for drag & drop items to edit the remotes (for scenes and devices)
    remote_archive(type, id) {

        let delete_cmd;
        let images = rmData.elements.data("button_images");
        let img_delete = rm_image(images["trash"]);
        let img_archive = rm_image(images["archive2"]);

        let onclick_reload = "setTimeout(function() { "+this.settings.name+".create(\"edit_"+type+"s\"); }, 2000);";
        let onclick_archive = "apiRestoreFromArchive(\""+type+"\", \""+id+"\");" + onclick_reload;

        if (type === "device") { delete_cmd  = "apiDeviceDelete"; }
        else                   { delete_cmd  = "apiSceneDelete"; }

        let edit_commands = "";
        edit_commands += "<span onclick='"+onclick_archive+"' style='cursor:pointer;'>" + img_archive + "</span>";
        //edit_commands += "&nbsp;&nbsp;";
        //edit_commands += "<span onclick='"+delete_cmd+"(\""+id+"\");' style='cursor:pointer;'>" + img_delete + "</span>";
        return edit_commands;
    }

    // create dialogs to add remotes (???)
    add_remote_dialog(device_data_start={}) {
        this.update_data();

        let set_temp = "";
        let onchange2 = this.name + ".edit_filenames";
        let onchange = this.name + ".on_change_api(this.value);";
        let onchange3 = this.name + ".on_change_dev_type(this.value);";
        let add_command = "apiDeviceAdd([#add_device_id#,#add_device_descr#,#add_device_label#,#add_device_api#,#add_device#,#add_device_device#,#add_device_remote#,#add_device_id_external#,#edit_image#],"+onchange2+");";
        add_command += "rmMain.set_main_var(\"edit_mode\",true);";
        let width = this.input_width;
        let icon_container = "<button class='button device_off' style='width:50px;height:40px;'><div id='device_edit_button_image'></div></button>";
        let device_types = rmData.elements.data("device_types");

        this.on_change_api = function(value) {

            let  api = value.split("_")[0];
            let  api_config = rmData.apis.data("list_api_configs")["list"];
            let  remote_config = this.data["CONFIG"]["remotes"]["list"];

            if (value === "") {
                let  dev_config     = lang("SELECT_API_FIRST");
                let  rm_definition  = lang("SELECT_API_FIRST");
                setTextById("txt_add_device_device", dev_config);
                setTextById("txt_add_device_remote", rm_definition);
                elementHidden("txt_add_device_device_2");
                elementHidden("txt_add_device_remote_2");
            }
            else {
                let  on_change_1 = "if (this.value == 'other') { " + this.name + ".edit_filenames(1); } ";
                on_change_1 += "else { setValueById('add_device_device', this.value); }";
                let  on_change_2 = "if (this.value == 'other') { " + this.name + ".edit_filenames(2); } ";
                on_change_2 += "else { setValueById('add_device_remote', this.value); }";

                api_config[api]["other"] = "__new file__";
                remote_config["other"]   = "__new file__";
                //var dev_config     = this.select("edit_dev_config","config file", api_config[api], on_change_1, "");
                //var rm_definition  = this.select("edit_dev_rm","config file", remote_config, on_change_2, "");
                let dev_config     = this.elements.select("edit_dev_config","config file", api_config[api], on_change_1, "");
                let rm_definition  = this.elements.select("edit_dev_rm","config file", remote_config, on_change_2, "");
                setTextById("txt_add_device_device", dev_config);
                setTextById("txt_add_device_remote", rm_definition);
                elementVisible("txt_add_device_device_2");
                elementVisible("txt_add_device_remote_2");
            }
        }
        this.on_change_dev_type = function(device_type) {

            // Check if "devices" and device_type exist in this.data
            const devices = this.data?.CONFIG?.devices || {};

            // If device_type is not a key in devices, return it as-is
            if (!(device_type in devices)) {
                setValueById("add_device_id", device_type);
                setTextById("text_add_device_id", device_type);
                return;
            }

            // Find the next available ID like device_type1, device_type2, ...
            let counter = 2;
            let newId = `${device_type}${counter}`;

            while (newId in devices) {
                counter++;
                newId = `${device_type}${counter}`;
            }
            setValueById("add_device_id", newId);
            setTextById("text_add_device_id", newId);
        }

        if (device_data_start !== {}) {
            setTimeout( () => { this.on_change_api(document.getElementById("add_device_api").value); }, 1000 );
        }

        let device_data = {
            "id": "",
            "api_device": "",
            "external_id": "",
            "label": "",
            "interface": "",
            "device_name": ""
        }
        for (let key in device_data_start) { device_data[key] = device_data_start[key]; }

        const asterix = "<sup>*</sup>";
        this.input_width   = "180px";
        this.elements.input_width   = "180px";
        rmRemote.basic.input_width = "180px";
        set_temp  = this.tab.start();
        set_temp += this.tab.row( "Device type:"+asterix, this.elements.select("add_device", "device type", device_types, onchange3, "") );
        this.input_width = "180px";
        set_temp += this.tab.row( "Interface:"+asterix, this.elements.select("add_device_api","interface", rmData.apis.data("list_description"), onchange, device_data["api_device"]) );
        set_temp += this.tab.row( "ID:"+asterix, "<span id='text_add_device_id'>" + lang("SELECT_DEV_TYPE_FIRST") + "</span>" +
            "<span style='display:none;'>" + this.elements.input("add_device_id", onchange, onchange + "rmStatusShow.visualize_id_exists('device', this);", device_data["id"]) +"</span>");
        set_temp += this.tab.line();
        set_temp += this.tab.row( "Device name:"+asterix, this.elements.input("add_device_descr", "", onchange, device_data["description"]) );
        set_temp += this.tab.row( "Label in menu:"+asterix, this.elements.input("add_device_label", "", onchange, device_data["label"]) );
        set_temp += this.tab.row( "External ID:", this.elements.input("add_device_id_external", "", "", device_data["external_id"]) );
        set_temp += this.tab.row( icon_container, rmRemote.edit.button_image_select("edit_image", 'device_edit_button_image') );
        set_temp += this.tab.line();
        set_temp += this.tab.row( "Device config:"+asterix, "<span id='txt_add_device_device'>"+lang("SELECT_API_FIRST")+"</span> " +
            "<span id='txt_add_device_device_2' style='display:none;'>" + this.elements.input("add_device_device")+".json</span>" );
        set_temp += this.tab.row( "Remote config (copy):"+asterix, "<span id='txt_add_device_remote'>"+lang("SELECT_API_FIRST")+"</span>" +
            "<span id='txt_add_device_remote_2' style='display:none;'>" + this.elements.input("add_device_remote")+".json</span>" );
        set_temp += this.tab.end();

        this.input_width = width;

        set_temp += "<span class='center'>";
        set_temp += this.button.sized("add_dev","Add Device","settings",add_command);
        set_temp += "</span>";
        return set_temp;
    }

    // create filenames for edit dialogs
    edit_filenames(field) {

        let replace_minus = [" ","/","\\",":","&","#","?"];

        let id = document.getElementById("add_device_id").value;
        let label = document.getElementById("add_device_descr").value;
        let device = document.getElementById("add_device").value;

        let device_file	 = device.toLowerCase() + "-" + label.toLowerCase();
        device_file  = device_file.replaceAll("_","-");
        device_file  = device_file.replaceAll(" ","-");

        for (let i=0;i<replace_minus.length;i++) { for (let j=0;j<5;j++) { device_file = device_file.replace(replace_minus[i], "-" ); } }

        let remote_file  = device_file + "_" + id.toLowerCase();
        remote_file  = remote_file.replaceAll("_","-");
        remote_file  = remote_file.replaceAll(" ","-");

        if (field === 0 || field === 1) { document.getElementById("add_device_device").value = "cfg-" + device_file; }
        if (field === 0 || field === 2) { document.getElementById("add_device_remote").value = "rmc-" + remote_file; }
    }

    // get updated config data from parent class
    update_data() {
        this.data = this.settings.data;
    }

}


/* module to edit API-Device settings */
class RemoteSettingsApi extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.basic = this.settings.basic;
        this.button = this.settings.button;
        this.data = this.settings.data;
        this.tab = this.settings.tab;
        this.toggle = this.settings.toggle;
        this.elements = this.settings.elements;
        this.json_edit = new RemoteJsonEditing(name+".json", "compact", "width:100%;height:210px;");

        this.edit_api_config = this.edit_api_config.bind(this);
    }

    // create container and load data for API settings
    show_device_details() {
        let setting = "";
        /*
        setting += "<b>&nbsp;API details for devices</b><text style='font-size:25px;'>&nbsp;</text>";
        setting += "<hr style='border:1px lightgray solid;' />";
        */

        let set_temp  = this.tab.start();
        set_temp += this.tab.row("API-Speed:&nbsp;&nbsp;", this.exec_time_list() );
        set_temp += this.tab.row("");
        set_temp += this.tab.row("API-Details:&nbsp;&nbsp;", this.device_list("select_dev_status", this.name+".device_list_status('select_dev_status','dev_status');"));
        set_temp += this.tab.row("<span id='dev_status'>&nbsp;</span>", false);
        set_temp += this.tab.end();

        setting += "<div style='padding:5px;padding-bottom:6px;'>";
        setting  += set_temp;
        setting  += "</div>";

        return setting;
    }

    // show API logging information -> write
    show_logs_write(data) {
        let log_data = data["DATA"];
        if (!log_data) {
            console.error("apiLoggingWrite: got no logging data!");
            return;
        }
        let title = "<b>API Send</b><hr/>";
        setTextById("logging_api_send",     title + log_data["log_api"]["send"].join("<br/>"));
        title    = "<b>QUEUE Send</b><hr/>";
        setTextById("logging_queue_send",   title + log_data["log_send"].join("<br/>"));

        title    = "<b>API Query</b><hr/>";
        setTextById("logging_api_query",     title + log_data["log_api"]["query"].join("<br/>"));
        title    = "<b>QUEUE Query</b><hr/>";
        setTextById("logging_queue_query",   title + log_data["log_query"].join("<br/>"));
    }

    // show API logging information
    show_logs(log_type="all") {
        let setting = "";
        let set_temp = "";

        if (log_type === "all") {
            let show = this.name+".show_logs_write";
            setting += "<b>&nbsp;API logging</b><text style='font-size:25px;'>&nbsp;</text>";
            setting += " [<text onclick='rmApi.call(\"LoggingLoad\", [], undefined, "+show+")' style='cursor:pointer;'>reload</text>]";
            setting += this.line;
        }

        setting += "<div style='padding: 3px;'>";

        if (log_type === "all" || log_type === "send") {
            set_temp += "<div class='server_logging queue' id='logging_queue_send'></div>";
            set_temp += "<div class='server_logging' id='logging_api_send'></div>";
        }
        if (log_type === "all" || log_type === "query") {
            set_temp += "<div class='server_logging queue' id='logging_queue_query'></div>";
            set_temp += "<div class='server_logging' id='logging_api_query'></div>";
        }

        setting  += set_temp;
        setting  += "</div>";

        rmApi.call("LoggingLoad", [], undefined, eval(this.name+".show_logs_write"));
        return setting;
    }

    // show an overview on APIs and connected devices plus buttons, to reconnect / discover API devices
    show_overview() {
        let text = "<br/>";

        const all_apis = Object.entries(rmData.apis.data("list")).length;
        const all_apis_active = Object.values(rmStatus.status_system("interfaces")["active"]).filter(value => value === true).length;
        const all_api_devices = Object.keys(rmData.apis.data("list_description")).length;
        const all_api_devices_active = Object.values(rmStatus.status_system("structure")).reduce((count, api) => { if (api.active === true) { return count + Object.values(api["api_devices"]).filter(device => device.active === true).length; } return count; }, 0);
        const all_devices = rmData.devices.list_all().length;
        const all_devices_active = Object.values(rmData.devices.config_devices).filter(device => device["settings"]?.visible === "yes").length;

        text += this.tab.start("100%", "140px:*");
        text += this.tab.row("Active APIs:",        `<b>${String(all_apis_active).padStart(2,'0')}</b> / ${String(all_apis).padStart(2,'0')}`);
        text += this.tab.row("Active API-devices:", `<b>${String(all_api_devices_active).padStart(2,'0')}</b> / ${String(all_api_devices).padStart(2,'0')}`);
        text += this.tab.row("Active devices:",     `<b>${String(all_devices_active).padStart(2,'0')}</b> / ${String(all_devices).padStart(2,'0')}`);
        text += this.tab.line()
        text += this.tab.row("Last (re)connect:", `${rmStatus.status_system("interfaces")["status"]["last_reconnect"]} (${rmStatus.status_system("interfaces")["status"]["last_reconnect_device"]})`);
        text += this.tab.row("Last discovery:",   `${rmStatus.status_system("interfaces")["status"]["last_discovery"]}`);
        text += this.tab.end();
        text += "<br/>&nbsp;<br/>";

        this.button.width = "120px";
        text += this.button.edit("apiReconnectInterface('all');", "Reconnect APIs", "", "api_reconnect_all") + "&nbsp;&nbsp;";
        text += this.button.edit("rmApi.call('DiscoverDevices');", "Device discovery", "", "api_discover_all");
        return text;
    }

    // create a container header
    create_container_header(left_text, right_text="") {
        let text = "";
        text += "<div style='width:100%;float:left;max-height:30px;'>";
        text += "   <div style='width:60px;float:right;'>" + right_text + "</div>";
        text += "   <div style='padding:5px;float:left;font-weight:bold;'>" + left_text + "</div>";
        text += "</div>";
        return text;
    }

    // create container content
    create_container_content(container_content_id, visible=true, content="") {
        return "<div id='"+container_content_id+"' style='width:100%;min-height:50px;float:left;"+visible+"'>"+content+"</div>";
    }

    // create a container with overarching settings for all APIs
    create_container_overview() {
        let count = 1;
        let text = "";
        let settings = "<hr style='border:1px lightgray solid;' />";
        settings += "<div id='api_settings_sheetbox'></div>";

        text += this.create_container_header(lang("API_SETTINGS_OVERVIEW").toUpperCase());
        text += this.create_container_content("api_settings_overview", true, settings);

        this.settings.settings_ext_append(count, "", text);
    }

    // create a container for each existing API with some basic infos and the toggle to (de)activate */
    create_container_apis() {

        this.update_data();

        let count = 1;
        let devices_per_interface = rmData.apis.data("structure");
        let interface_status = rmStatus.status_system("structure");
        let interfaces = [];

        for (let key in devices_per_interface) {
            if (key !== "") {
                count += 1;
                let text = "";
                let key2 = key.replaceAll("-", "");
                let initial_visible = "display:none;";
                if (!interface_status[key]["active"]) { initial_visible = "display:none"; }

                let command_on = 'javascript:rmApi.call(\'InterfaceOnOff\', [\''+key+'\', \'True\']); document.getElementById(\'interface_edit_'+key+'\').style.display=\'block\';';
                let command_off = 'javascript:rmApi.call(\'InterfaceOnOff\', [\''+key+'\', \'False\']);';
                let command_show_hide = "let el_"+key2+" = document.getElementById(\"interface_edit_"+key+"\"); ";
                command_show_hide += "if (el_"+key2+".style.display == \"block\") { el_"+key2+".style.display = \"none\"; } else { el_"+key2+".style.display = \"block\"; el_"+key2+".scrollIntoView({ behavior: \"smooth\", block: \"nearest\" }); }";

                let init = "";
                let toggle = this.toggle.toggleHTML("active_"+key, "", "", command_on, command_off, init);
                let headline = "<span onclick='"+command_show_hide+"' style='cursor:pointer;'>API: "+key+" </span>&nbsp;<text id='api_status_icon_"+key+"' style='font-size:18px;'></text>";
                text += this.create_container_header(headline, toggle);
                text += this.create_container_content("interface_edit_"+key, initial_visible);

                this.settings.settings_ext_append(count, "", text);
                interfaces.push("interface_edit_"+key);
            }
        }
    }

    // create dialogs to edit overarching settings
    edit_api_overview() {
        let sheet_box = new RemoteElementSheetBox("api_settings_sheetbox", "350px", true, false, false);
        sheet_box.addSheet("Overview", this.show_overview());
        sheet_box.addSheet("Device details", this.show_device_details());
        sheet_box.addSheet("Logging QUERY", this.show_logs("query"), false);
        sheet_box.addSheet("Logging SEND", this.show_logs("send"), false);
        sheet_box.addSheet("API Summary", rmStatus.status_summary(), false);
    }

    // load edit_ap_config()
    edit_api_config_load() {
        rmApi.call("ConfigInterfaceShow", [], undefined, this.edit_api_config);
    }

    // create dialogs to edit api settings */
    edit_api_config(data) {

        this.logging.debug(data);
        this.update_data();

        let interfaces  = data["DATA"]["interfaces"];
        let interfaces_available = dataAll["CONFIG"]["apis"]["list"];
        let sheet_boxes = {};

        this.button_add_device = function(api, api_device, external_id) {

            if (!rmData.apis.data("list_detect")[api+"_"+api_device]) {
                this.logging.warn("No detected devices found for "+api+"_"+api_device+".");
                return "";
            }
            const devices_detect = rmData.apis.data("list_detect")[api+"_"+api_device];
            let html = "";

            if (api === "ZIGBEE2MQTT") {
                if (external_id !== "Coordinator") {
                    let new_device = devices_detect[external_id];
                    let button_cmd = "";
                    if (new_device["disabled"] || !new_device["available"]) {
                        this.logging.info("Detected devices '" + external_id + "' (API " + api + "_" + api_device + ") is disabled or not available at the moment.");
                        html += "<span style='color:gray'>device disabled or not available</span>";
                    }
                    else {
                        let data = {
                            external_id: external_id,
                            description: new_device["description"],
                            api_device: api+"_" +api_device,
                            label: new_device["name"],
                            name: new_device["name"],
                        }
                        button_cmd  = "rmSettings.create(\"edit_devices\", \"add_device\", "+JSON.stringify(data)+");";
                        html += "<button onclick='"+button_cmd+"'>"+lang("BUTTON_T_ADD")+"</button>";
                    }

                }
            }
            else {
                this.logging.info("Easy adding of detected devices is for "+api+"-APIs not implemented yet.")
            }
            return html;
        }
        this.api_device_connected_devices = function (api, device, data) {
            let text  = "";
            let count = 0;
            let devices_per_api = rmData.apis.data("structure");
            let detected_devices = rmData.apis.data("list_detect");
            let connected_vs_detected = {};
            let details = "<div style='width:100%;height:9px;'></div>";

            for (let api_device in devices_per_api[api]) {
                let connect  = rmStatus.status_system("interfaces")["connect"][api + "_" + api_device];
                if (device === "" || api_device !== device) { continue; }
                if (device === "") { details += "<i>API Device: " + api_device + "</i>&nbsp;&nbsp;"; }
                else { details += "<i>"+lang("CONNECTED_RMC")+":</i><hr/>&nbsp;&nbsp;"; }

                details += this.tab.start("");
                for (let i=0;i<devices_per_api[api][api_device].length;i++) {
                    count += 1;
                    let connected_device = devices_per_api[api][api_device][i];
                    let device_settings = rmData.devices.data(connected_device);
                    let method = rmData.devices.api_method(connected_device);
                    let power_status = rmStatus.status_device_raw(connected_device)["power"];
                    let label = rmData.devices.label(connected_device);
                    let visibility = device_settings["settings"]["visible"];
                    let hidden = "";
                    let idle = "<small id=\"device_auto_off_"+connected_device+"\"></small>";
                    let command_on = "appFW.requestAPI('GET',['set','"+connected_device+"','power','ON'], '', '', '' ); setTextById('CHANGE_STATUS_"+connected_device+"','ON');";
                    let command_off = "appFW.requestAPI('GET',['set','"+connected_device+"','power','OFF'], '', '', '' );setTextById('CHANGE_STATUS_"+connected_device+"','OFF');";
                    let external_id = "";

                    if (visibility !== "yes") {
                        hidden = "*";
                    }
                    if (method === "record" && power_status === "ON")  {
                        power_status = "<u id=\"CHANGE_STATUS_"+connected_device+"\"><status onclick=\""+command_off+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                    }
                    else if (method === "record" && power_status === "OFF") {
                        power_status = "<u id=\"CHANGE_STATUS_"+connected_device+"\"><status onclick=\""+command_on+"\" style=\"cursor:pointer;\">"+power_status+"</status></u>";
                    }
                    if (device_settings["settings"]["device_id"] && device_settings["settings"]["device_id"] !== "") {
                        let external_id_connected = "";
                        let device_id= device_settings["settings"]["device_id"];
                        if (!detected_devices[api+"_"+api_device] || !detected_devices[api+"_"+api_device][device_id]) {
                            external_id_connected = " (N/A at the moment)";
                        }
                        external_id = "<br/><span style='color:gray;'>connected to: " + device_settings["settings"]["device_id"] + external_id_connected + "</span>";
                        if (!connected_vs_detected[device_settings["settings"]["device_id"]]) { connected_vs_detected[device_settings["settings"]["device_id"]] = "[" + connected_device + "]"; }
                        else { connected_vs_detected[device_settings["settings"]["device_id"]] += ", " + "[" + connected_device + "]"; }
                    }


                    details += this.tab.row("<b>["+connected_device+"]&nbsp;&nbsp;</b>", "<i>" + label + hidden + ":</i> " + power_status  + external_id + "<br/>" + idle);
                }
                if (devices_per_api[api][api_device].length === 0) {
                    details += this.tab.row("&nbsp;&nbsp;&nbsp;"+lang("NO_REMOTE_CONNECTED"));
                }
                details += this.tab.end();

                if (api+"_"+api_device in detected_devices) {
                    details += "<br/><i>"+lang("DETECTED_DEVICES")+":</i><hr/>&nbsp;&nbsp;";
                    details += this.tab.start("");
                    Object.keys(detected_devices[api+"_"+api_device]).forEach(key => {
                        let description = detected_devices[api+"_"+api_device][key]["description"];
                        let connected_remotes;

                        if (key in connected_vs_detected)   { connected_remotes = "<br/><span style='color:gray;'>used by: " + connected_vs_detected[key] + "</span>"; }
                        else                                { connected_remotes = "<br/>" + this.button_add_device(api, api_device, key); }
                        if (description === "") { description = key; }
                        details += this.tab.row("<b>"+key+"&nbsp;&nbsp;</b>", description + connected_remotes);
                    });
                    details += this.tab.end();
                }
            }

            details += "<br/>";
            return [count, details];
        }
        this.api_device_overview = function (api_name, device, show_buttons=undefined) {

            let temp = "";
            let information = "<div id='api_status_data_"+api_name+"_"+device+"'></div>";
            let devices_per_interface = rmData.apis.data("structure");
            let connected_devices = devices_per_interface[api_name][device].length;

            let api_dev = api_name.toLowerCase() + "_" + device.toLowerCase();
            let link_reconnect = "rmApi.call(\"ReconnectInterface\", [\""+api_name+"_"+device+"\"]);"
            let link_delete = "rmApi.call(\"ApiDeviceDelete\", [\""+api_name+"\",\""+device+"\"]);";

            // create edit dialog
            let command_on = `rmApi.call('ApiDeviceOnOff', ['${api_name}', '${device}', 'True']);`;
            let command_off = `rmApi.call('ApiDeviceOnOff', ['${api_name}', '${device}', 'False']);`;
            let init = rmStatus.status_system("structure")[api_name]["api_devices"][device]["active"];

            let power_device = interfaces[api_name]["API-Devices"][device]["PowerDevice"] || "N/A";
            let toggle = this.toggle.toggleHTML("active_"+api_name+"-"+device, "", "", command_on, command_off, init);
            toggle = `<div class='mode_setting_toggle' style='float:left;margin-left:-3px;margin-bottom:6px;'>${toggle}</div>`;

            temp    += this.tab.start("100%", "110px:*");
            temp    += this.tab.row("ID: ", `<div style="padding-bottom:6px;font-weight:bold">${api_name}_${device}</div>`);
            temp    += this.tab.row("Active:", toggle);
            temp    += this.tab.row("Status:", "<div id='api_status_"+api_name+"_"+device+"' class='api-status-info' style='margin: 3px 3px 3px 0;'></div>");
            temp    += this.tab.line();
            temp    += this.tab.row("Description: ", interfaces[api_name]["API-Devices"][device]["Description"]);
            temp    += this.tab.row("PowerDevice: ", power_device + "<text id='power_status_"+api_name+"_"+device+"'></text>");
            temp    += this.tab.row("Connected:", connected_devices + " devices");
            temp    += this.tab.line();
            if (interfaces[api_name]["API-Info"]) {
                let link = interfaces[api_name]["API-Info"];
                let link2 = "";
                if (link.indexOf("github.com") > -1) {
                    let parts = link.split("/");
                    link2 = "http://github.com/" + parts[3] + "/" + parts[4]  + "/../" + parts[parts.length-2] + "/" + parts[parts.length-1];
                }
                let cmd_url = `<a href=\"${link}\" target=\"_blank\">${link2}</a>`;
                temp    += this.tab.row("API information:", cmd_url);
            }
            if (interfaces[api_name]["API-Devices"][device]["AdminURL"]) {
                let link = interfaces[api_name]["API-Devices"][device]["AdminURL"];
                let cmd_url = `<a href=\"${link}\" target=\"_blank\">${link}</a>`;
                temp    += this.tab.row("API admin tool:", cmd_url);
            }
            temp    += this.tab.end();
            temp    += "<br/>&nbsp;<br/>";

            this.button.height = "30px";
            this.button.width = "90px";
            temp += this.button.sized("reconnect_"+api_dev,  lang("RECONNECT"),"settings",  link_reconnect);
            temp += this.button.sized("delete_"+api_dev,     lang("DELETE"),   "settings",  link_delete);

            return temp;
        }
        this.api_device_edit_configuration = function (api_name, device, show_buttons=undefined) {

            let temp = "";
            let information = "<div id='api_status_data_"+api_name+"_"+device+"'></div>";
            let devices_per_interface = rmData.apis.data("structure");
            let connected_devices = devices_per_interface[api_name][device].length;

            let api_dev = api_name.toLowerCase() + "_" + device.toLowerCase();
            let link_save = "rmApi.call(\"ConfigInterface\", [\""+api_name+"_"+device+"\", \"api_status_edit_"+api_name+"_"+device+"\"]);" + "rmJson.disable(\"api_status_edit_"+api_name+"_"+device+"\");";
            let link_edit = "rmJson.disable(\"api_status_edit_"+api_name+"_"+device+"\",false);" +
                "this.className=\"rm-button hidden\";" + "document.getElementById(\"save_"+api_dev+"\").className=\"rm-button settings\";";

            let buttons = "";
            let buttons_plus = "";
            let buttons_admin = "";

            this.logging.log("module_interface_edit_list: " + api_name + "_" + device)
            let connect_status_api = rmStatus.status_system("interfaces")["active"][api_name];
            let connect_status     = rmStatus.status_system("interfaces")["connect"][api_name+"_"+device];

            if (!connect_status) { connect_status = "NO DEVICE connected yet."; }

            let on_off_status;
            if (connect_status_api === false || connected_devices === 0)  { on_off_status = "N/A"; }
            else if (connect_status.indexOf("OFF") > -1)                  { on_off_status = "OFF"; }
            else if (connect_status.indexOf("ERROR") > -1)                { on_off_status = "ERROR"; }
            else                                                          { on_off_status = "ON"; }

            this.button.width = "90px";
            this.button.height = "30px";
            buttons      += this.button.sized("edit_"+api_dev,       lang("EDIT"),     "settings",  link_edit)
            buttons      += this.button.sized("save_"+api_dev,       lang("SAVE"),     "hidden",    link_save);

            if (rmData.apis.data("list_api_commands")[api_name+"_"+device] && rmData.apis.data("list_api_commands")[api_name+"_"+device].length > 0) {
                if (show_buttons === undefined) { buttons_plus += "<hr style='width:100%;float:left;'/>"; }
                for (let i=0;i<rmData.apis.data("list_api_commands")[api_name+"_"+device].length > 0;i++) {
                    let command = rmData.apis.data("list_api_commands")[api_name+"_"+device][i];
                    let command_link = "rmApi.call(\"SendToApi\", \"" + api_name + "_" + device + "::" +command + "\");appMsg.info(\"Command send: " + api_name + "_" + device + "::" + command + "\");";
                    buttons_plus += this.button.sized("api_cmd_"+api_name+"_"+device, command, "settings", command_link);
                }
            }

            this.logging.debug(interfaces[api_name]["API-Devices"][device]);
            if (interfaces[api_name]["API-Devices"][device]["AdminURL"]) {
                let cmd_url  = "window.open(\""+interfaces[api_name]["API-Devices"][device]["AdminURL"]+"\", \"_blank\", \"noopener,noreferrer\");";
                buttons_admin += this.button.sized("api_cmd_"+api_name+"_"+device+"_admin", "open", "settings", cmd_url);
            }

            if (show_buttons === undefined) {
                buttons += buttons_plus;
                buttons += buttons_admin;
            }

            if (!show_buttons) {
                // create edit dialog
                temp    += this.tab.start();
                temp    += this.tab.row("ID: ",    api_name+"_"+device);
                temp    += this.tab.row("<div style='height:5px;width:100%'></div>");
                temp    += this.tab.row(information, false);
                temp    += this.tab.row("<div style='width:100%;text-align:center;'>" + buttons + "</div>", false);
                temp    += this.tab.end();
            } 
            else if (buttons_plus !== "") {
                temp    += this.tab.start();
                if (buttons_plus !== "")  { temp += this.tab.row("Admin actions:", buttons_plus ); }
                if (buttons_admin !== "") { temp += this.tab.row("Admin tool:", buttons_admin ); }
                temp    += this.tab.end();
            }
            
            return temp;
        }
        this.api_device_create_device_configuration = function (api_name, device) {
            if (!interfaces[api_name]["API-Config"]["commands"]["device-configuration"]) { return ""; }

            let temp = "";
            let select = "";
            let detect_devices = (api_name + "_" + device in dataAll["CONFIG"]["apis"]["list_detect"]);
            let activate_copy_button = "document.getElementById('copy_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('copy_button_"+api_name+"_"+device+"').style.backgroundColor='';";
            let activate_create_button = "document.getElementById('create_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('create_button_"+api_name+"_"+device+"').style.backgroundColor='';";

            if (detect_devices) {
                const detected = rmData.apis.data("list_detect")[api_name + "_" + device];
                let detected_select = {}
                Object.keys(detected).forEach(key => {
                    let api_string = api_name + "_" + device + "||";
                    detected_select[api_string + key] = detected[key]["description"];
                    if (!detected[key]["description"] || detected_select[api_string + key] === "") { detected_select[api_string + key] = key; }
                });
                select = this.basic.select("api_device-"+api_name+"_"+device, "detected device", detected_select, activate_create_button, "");
            }

            this.button.width = "80px;";
            temp += lang("API_CREATE_DEV_CONFIG_INFO", [api_name]);
            temp += "<br/>&nbsp;";
            temp += this.tab.start();
            temp += this.tab.row("Detected:","<div id='api_device-"+api_name+"_"+device+"_container'>"+select+"</div>");
            temp += this.tab.row("API Call:<br/>","<div id='api_command-"+api_name+"_"+device+"'>get=device-configuration</div><br/>");
            temp += this.tab.row("<div class='remote-edit-cmd' id='api_response_"+api_name+"_"+device+"'></div><br/>",false);
            temp += this.tab.end();
            temp += this.button.edit("apiSendToDeviceApi(getValueById('api_device-"+api_name+"_"+device+"')+'||"+api_name+"_"+device+"', getTextById('api_command-"+api_name+"_"+device+"'), true);"+activate_copy_button, lang("CREATE"), "disabled", "create_button_"+api_name+"_"+device) + "&nbsp;";
            temp += this.button.edit("copyTextById('JSON_copy',appMsg,'"+lang("COPIED_TO_CLIPBOARD")+"');"+activate_copy_button, lang("COPY"), "disabled", "copy_button_"+api_name+"_"+device);

            return temp;
        }
        this.create_api_configuration = function (api_name, device="default") {

            if (!interfaces[api_name]["API-Config"]["commands"]["api-discovery"]) { return ""; }

            let activate_copy_button = "document.getElementById('copy_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('copy_button_"+api_name+"_"+device+"').style.backgroundColor='';";
            let activate_create_button = "document.getElementById('create_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('create_button_"+api_name+"_"+device+"').style.backgroundColor='';";

            this.button.width = "80px;";
            let temp = "";
            temp += this.tab.start();
            temp += this.tab.row(lang("API_CREATE_CONFIG_INFO", [api_name])+"<br/>&nbsp;<br/>", false);
            temp += this.tab.row("API Call:<br/>","<div id='api_command-"+api_name+"_"+device+"'>api-discovery</div><br/>");
            temp += this.tab.row("<div class='remote-edit-cmd' id='api_response_"+api_name+"_"+device+"'></div><br/>", false);
            temp += this.tab.end();
            temp += this.button.edit("apiSendToDeviceApi( '"+api_name+"_"+device+"||xx||"+api_name+"_"+device+"', getTextById('api_command-"+api_name+"_"+device+"'), true);"+activate_copy_button, lang("CREATE"), "", "create_button_"+api_name+"_"+device) + "&nbsp;";
            temp += this.button.edit("copyTextById('JSON_copy',appMsg,'"+lang("COPIED_TO_CLIPBOARD")+"');"+activate_copy_button, lang("COPY"), "disabled", "copy_button_"+api_name+"_"+device);

            return temp;
        }
        this.create_api_device = function (api_name, data) {

            //return this.elements.select(id,"device",list,onchange);
            let onchange = "setValueById('add_api_ip_"+api_name+"', this.value);";
            onchange += "let description = ''; ";
            onchange += "if (this.options[this.selectedIndex].text === 'OTHER') { } ";
            onchange += "else { description = this.options[this.selectedIndex].text.split('| ')[1]; description = description.replace('API: ',''); } ";
            onchange += "setValueById('add_api_description_"+api_name+"', description);";
            let list = {};
            let available_devices = data["DATA"]["available"]["OTHER"];
            if (data["DATA"]["available"][api_name] && data["DATA"]["available"][api_name].length >= 1) {
                available_devices = data["DATA"]["available"][api_name];
            }

            for (let device in available_devices) {
                let device_info = available_devices[device];
                let identified = "";
                if (device_info["description"]) { device_info["hostname"] = device_info["description"]; }
                if (device_info["identified"]) { identified = "API: "; }
                list[device_info["ip"]] = device_info["ip"] + " | " + identified + device_info["hostname"];
            }
            if (available_devices === data["DATA"]["available"]["OTHER"]) {
                list["127.0.0.1"] = "127.0.0.1 | local service (e.g. WEATHER)";
            }
            list["aaa.bbb.ccc.ddd"] = "OTHER";

            let temp = "<div style='padding:3px;'>";
            this.elements.input_width = "150px";
            temp += this.tab.start("");
            temp += this.tab.row(lang("MANUAL_ADD_API-DEVICE")+"<br/>&nbsp;", false);
            temp += this.tab.row("API:", api_name);
            temp += this.tab.row("API-Device:", this.elements.select("add_api_device_"+api_name,"API device",list,onchange));
            temp += this.tab.row("IP-Address:", this.elements.input("add_api_ip_"+api_name));
            temp += this.tab.row("Description:&nbsp;", this.elements.input("add_api_description_"+api_name));
            temp += this.tab.end();
            temp += "<br/>";

            temp += this.button.edit("rmApi.call('ApiDeviceAdd', '"+api_name+"');", lang("ADD"));
            temp += "</div>";

            return temp;
        }

        this.button.width = "72px";

        for (let i in interfaces_available) {
            let key = interfaces_available[i];
            let api_device_config = (dataAll["CONFIG"]["apis"]["list_api_configs"]["list"][key] !== undefined);

            let id = "interface_edit_"+key;
            let api_config = interfaces[key];
            let setting = "";
            setting += "<hr style='border:solid lightgray 1px;'/>";

            if (api_config && api_device_config) {
                for (let dev in api_config["API-Devices"]) {
                    let temp_edit_device_config = "<div id='api-setting-" + key + "_" + dev + "'></div>";
                    let container_title = "</b>API-Device: " + dev + "&nbsp;&nbsp;<text id='api_status_icon_" + key + "_" + dev + "' style='font-size:16px;'></text>";
                    setting += this.basic.container("details_" + key + "_" + dev, container_title, temp_edit_device_config, false);
                }
            }
            else {
                setting += "<div class='setting-interface-error-message'>";
                setting += lang("API_DEVICE_CONFIG_NA");
                setting += "</div>";
                setTextById(id, setting + "<br/>");
                continue;
            }

            let temp_add = "<div id='api-settings-add-"+key+"'></div>"
            setting += this.basic.container("add_api_"+key, lang("ADD"), temp_add, false);
            setTextById(id, setting + "<br/>");

            // create sheet boxes for all devices of this interface
            for (let dev in api_config["API-Devices"]) {
                let buttons = this.api_device_edit_configuration(key, dev, true);
                let config_device = this.api_device_create_device_configuration(key, dev);
                let sheet_box_height = "380px";
                if (config_device !== "") { sheet_box_height = "420px"; }

                sheet_boxes[key+"_"+dev] = new RemoteElementSheetBox("api-setting-"+key+"_"+dev, sheet_box_height, true, false, false);
                sheet_boxes[key+"_"+dev].addSheet(lang("API_INFORMATION"), this.api_device_overview(key, dev, false));
                sheet_boxes[key+"_"+dev].addSheet(lang("API_DEFINITION"), this.api_device_edit_configuration(key, dev, false), false);
                if (buttons !== "" && rmStatus.status_discovery())       { sheet_boxes[key+"_"+dev].addSheet(lang("API_ADMIN"), buttons); }
                if (config_device !== "" && rmStatus.status_discovery()) { sheet_boxes[key+"_"+dev].addSheet(lang("API_CREATE_DEV_CONFIG"), config_device); }
                sheet_boxes[key+"_"+dev].addSheet(lang("CONNECTED"), this.api_device_connected_devices(key, dev, data)[1]);
            }

            // add device sheet box
            let config_api = this.create_api_configuration(key);
            sheet_boxes[key+"_add-api-device"] = new RemoteElementSheetBox("api-settings-add-"+key, "380px", true, false, false);
            sheet_boxes[key+"_add-api-device"].addSheet("Add API-Device", this.create_api_device(key, data));
            if (config_api !== "" && rmStatus.status_discovery()) { sheet_boxes[key+"_add-api-device"].addSheet("Create API config", config_api); }

            // fill JSON edit field
            for (let dev in api_config["API-Devices"]) {
                this.json_edit.create("api_status_data_"+key+"_"+dev,"api_status_edit_"+key+"_"+dev, api_config["API-Devices"][dev]);
                this.json_edit.disable("api_status_edit_"+key+"_"+dev);
            }
        }
    }

    // create and initially fill container for execution time overview
    exec_time_list () {
        this.update_data();

        let text = "<div id='setting_exec_time_list'>";
        if (rmStatus.status_system("request_time")) {
            for (let key in rmStatus.status_system("request_time")) {
                text += key + ": " + use_color((Math.round(rmStatus.status_system("request_time")[key] * 1000) / 1000) + "s<br/>", "VALUE", true);
            }
        }
        text += "</div>";
        return text;
    }

    // update data for execution time overview
    exec_time_list_update () {

        setTextById('setting_exec_time_list', this.exec_time_list());
    }

    // create drop down with list of devices from config data (key => label)
    device_list(id,onchange="") {
        let list = rmData.devices.select();
        return this.elements.select(id,"device",list,onchange);
    }

    // show api infos for selected device plus all existing status values
    device_list_status(id_filter, id_list_container) {
        let status = "<br/>";
        let filter_list = document.getElementById(id_filter);
        let filter = filter_list.options[filter_list.selectedIndex].value;
        let device_status = rmStatus.status_device_raw(filter);
        let device_values = rmData.devices.list_commands(filter, "get");
        let dont_use = ["api", "api-last-query", "api-last-query-tc", "api-last-send", "api-last-send-tc", "api-status","presets"];
        let color = "VALUE";
        if (device_status["api-status"].indexOf("ERROR") > -1)          { color = "ERROR"; }
        else if (device_status["api-status"].indexOf("Connected") > -1) { color = "ON"; }
        else if (device_status["api-status"].indexOf("DISABLED") > -1)  { color = "OFF"; }
        else if (device_status["api-status"].indexOf("OFF") > -1)       { color = "OFF"; }

        status += this.tab.start();
        status += this.tab.line();
        status += this.tab.row("API:",             use_color(device_status["api"], "VALUE", true));
        status += this.tab.row("",                 use_color(device_status["api-status"],color, true));
        status += this.tab.row("Last&nbsp;send:",  use_color(device_status["api-last-send"],"VALUE", true));
        status += this.tab.row("Last&nbsp;query:", use_color(device_status["api-last-query"],"VALUE", true));
        status += this.tab.line();

        for (let key in device_status) {
            if (key === "power") {
                let command_on = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','ON'], '', '', '' );rmMain.start();";
                let command_off = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','OFF'], '', '', '' );rmMain.start();";
                let status_value = device_status[key];
                let command_link;

                if (status_value === "ON"){
                    command_link = "<div onclick=\""+command_off+"\" style=\"cursor:pointer\"><u>" + use_color("ON", "ON", true) + "</u></div>";
                }
                else if (status_value.indexOf("OFF") >= 0)	{
                    command_link = "<div onclick=\""+command_on +"\" style=\"cursor:pointer\"><u>" + use_color("OFF", "OFF", true) + "</u></div>";
                }
                else {
                    command_link = use_color(status_value, "VALUE", true);
                }
                status += this.tab.row(key + ":", command_link);
            }
            else if (dont_use.indexOf(key) === -1 && (!device_values || device_values.indexOf(key) > -1)) {
                status += this.tab.row(key + ": ", use_color(device_status[key], "VALUE", true));
            }
        }
        status += this.tab.end();
        setTextById( id_list_container, status + "<br/>" );
    }

    // get updated config data from parent class
    update_data() {
        this.data = this.settings.data;
    }

}


/* module to change and show some general app and server settings: edit modes, edit icons, show API calls, server side settings */
class RemoteSettingsGeneral extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.data = this.settings.data;
        this.tab = this.settings.tab;
        this.button = this.settings.button;
        this.toggle = this.settings.toggle;

        this.load = this.load.bind(this);
    }

    // create container for general settings
    create() {

        return "<span class='center'>&nbsp;<br/><div id='module_general_settings'></div></span>";
    }

    // load data for general settings
    load() {
        // Edit Server Settings
        let q3 = lang("RELOAD_ALL_SCRIPTS");

        this.button.height = "30px";
        this.button.width  = "120px";
        this.update_data();

        // Reload & Updates
        let set_temp= "<br/><i>"+this.edit_modes(true, true, true, true, true, true)+"</i>";
        let settings_index = set_temp;

        set_temp  = this.tab.start();
        set_temp += this.tab.row("<i>Server:</i>",
            this.button.sized("set01","reload (scroll)","settings","appForceReload(true);") + "&nbsp;" +
            this.button.sized("set02","check updates","settings","appFW.requestAPI(\"GET\",[\"version\",\"" + appVersion +"\"], \"\", appMsg.alertReturn, \"wait\");")
        );
        set_temp += this.tab.row("",
            this.button.sized("set03","restart server","settings","rmApi.call(#ShutdownRestart#);")
        );
        set_temp += this.tab.row("<i>Devices:</i>",
            this.button.sized("set21","Dev ON/OFF", "settings","rmApi.call(#Reset#);") + "&nbsp;" +
            this.button.sized("set22","Audio Level","settings", "rmApi.call(#ResetAudio#);")
        );
        set_temp += this.tab.row("<i>Reload CSS and JavaScript files:</i>",
            this.button.sized("set23","Reload", "settings","appMsg.confirm(#" + q3 + "#, #reloadScriptsAndCss();#);") + "&nbsp;"
        );
        set_temp += this.tab.end();
        let settings_reload = set_temp;

        // API Calls and information
        set_temp  = this.tab.start();
        set_temp += this.tab.row( "<i>Basic API calls:</i>",
            this.button.sized("set11","REST API : list",  "settings","window.open(#" + RESTurl + "api/list/#,#_blank#);") + "&nbsp;" +
            this.button.sized("set12","REST API : status","settings","window.open(#" + RESTurl + "api/status/#,#_blank#);") + "&nbsp;");
        set_temp += this.tab.row( "<i>API Definition:</i>",
            this.button.sized("set13","Swagger/UI",       "settings","window.open(#" + RESTurl + "api/ui/#,#_blank#);") + "&nbsp;"
        );
        set_temp += this.tab.end();
        let settings_api = set_temp;

        // draw icon images
        this.icon_img = function (url, printUrl=true, onclick=false, selected=false, icon_type="favicon") {
            let icon;
            let onclick_img = "";
            let onclick_style = "";
            let on_select = "";

            if (url) {
                if (onclick)  { onclick_img = this.name+".set_favicon(\""+url+"\",\""+icon_type+"\");"; onclick_style = "cursor:pointer;"; }
                if (selected) { on_select   = " selected"; }

                icon = "<img src='"+url+"' alt='"+url+"' class='favicon"+on_select+"' onclick='"+onclick_img+"' style='"+onclick_style+"'>";
                if (printUrl) { icon += "<br/>" + url; }
            }
            else {
                icon = lang("NOT_FOUND");
            }
            return icon;
        }

        // Grab <link> elements from the document head
        let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon-precomposed"]');
        let favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');

        // Extract their hrefs (if present)
        let appleTouchIconUrl = appleTouchIcon ? appleTouchIcon.href : null;
        let faviconUrl = favicon ? favicon.href : null;

        appleTouchIcon  = "";
        favicon         = "";

        for (let icon in rmData.elements.data("icons")) {
            let currentUrl = "remote-v3/icon/" + rmData.elements.data("icons")[icon];
            if (appleTouchIconUrl.indexOf(currentUrl) >= 0) { appleTouchIcon += this.icon_img(currentUrl, false, false, true, "appleicon"); }
            else                                            { appleTouchIcon += this.icon_img(currentUrl, false, true, false, "appleicon"); }
            if (faviconUrl.indexOf(currentUrl) >= 0)        { favicon += this.icon_img(currentUrl, false, false, true, "favicon"); }
            else                                            { favicon += this.icon_img(currentUrl, false, true, false, "favicon"); }
        }

        set_temp  = "<br/>" + lang("FAVICON_INFO") + "<br/>&nbsp;";
        set_temp += this.tab.start();
        set_temp += this.tab.row("<b>Favicon:</b>",favicon);
        set_temp += this.tab.row("<b>Apple Icon:</b>",appleTouchIcon);
        set_temp += this.tab.end();
        let settings_icon = set_temp;

        const myBox = new RemoteElementSheetBox("module_general_settings", "350px", true);
        myBox.addSheet("Modes",  "&nbsp;" + settings_index);
        myBox.addSheet("Health", "&nbsp;" + this.system_health());
        myBox.addSheet("Icons",  "&nbsp;" + settings_icon);
        myBox.addSheet("Server", "&nbsp;" + settings_reload);
        myBox.addSheet("API",    "&nbsp;" + settings_api);
    }

    /* prepare sheet to display server health information */
    system_health() {

        let system_health = rmStatus.status_system("health");
        let set_temp;

        let modules = [];
        for (const [key, value] of Object.entries(system_health)) {
            if (value === "registered")      { modules.push(key); }
        }
        setTimeout(() => { rmStatusShow.show_status_system_health(); }, 500 );

        set_temp  = this.tab.start();
        set_temp += this.tab.row( 	"Threads:&nbsp;", "<div id='system_health'></div>" );
        set_temp += this.tab.row( 	"APIs:&nbsp;", modules.join(", ") );
        set_temp += this.tab.row( 	"&nbsp;");
        set_temp += this.tab.row( 	"StatusCheck&nbsp(Load):&nbsp;",  "<div id='average_status_duration_load'>"+lang("PLEASE_WAIT")+"</div>");
        set_temp += this.tab.row( 	"StatusCheck&nbsp(Write):&nbsp;",  "<div id='average_status_duration'>"+lang("PLEASE_WAIT")+"</div>");
        set_temp += this.tab.end();
        return set_temp;
    }

    // edit different modes: edit mode, easy edit mode, show hints, intelligent mode, show button modes
    edit_modes(edit=true, intelligent=false, button_code=false, easy_edit=false, remote_hints=false, json_highlight=false) {

        this.create_toggle = function(id, label, command_on, command_off, init=0){

            if (init === true)       { init = 1; }
            else if (init === false) { init = 0; }

            command_on  += "rmCookies.set_status_quo();";
            command_off += "rmCookies.set_status_quo();";

            let html = "<div class='mode_setting_container'>";
            html += "   <div class='mode_setting_label'>"+label+":</div>";
            html += "   <div class='mode_setting_toggle'>"
            html +=     this.toggle.toggleHTML(id, "", "", command_on, command_off, init);
            html += "   </div>";
            html += "</div>";
            return html;
        }

        let html = "";
        if (edit) {
            html += this.create_toggle("mode_edit", lang("MODE_EDIT"), "rmMain.set_main_var('edit_mode',true);", "rmMain.set_main_var('edit_mode',false);", rmRemote.edit_mode);
        }
        if (easy_edit) {
            html += this.create_toggle("mode_easy", lang("MODE_EASY_EDIT"), "rmMain.set_main_var('easy_edit',true);", "rmMain.set_main_var('easy_edit',false);", easyEdit);
        }
        if (json_highlight) {
            html += this.create_toggle("mode_json", lang("MODE_JSON_HIGHLIGHT"), "rmMain.set_main_var('json_highlighting',true);", "rmMain.set_main_var('json_highlighting',false);", jsonHighlighting);
        }
        if (remote_hints) {
            html += this.create_toggle("mode_hint", lang("MODE_HINT"), "rmMain.set_main_var('remote_hints',true);", "rmMain.set_main_var('remote_hints',false);", remoteHints);
        }
        if (intelligent) {
            html += this.create_toggle("mode_intelligent", lang("MODE_INTELLIGENT"), "rmMain.set_main_var('manual_mode',true);", "rmMain.set_main_var('manual_mode',false);", this.manual_mode);
        }
        if (button_code) {
            html += this.create_toggle("mode_button_show", lang("MODE_SHOW_BUTTON"), "rmMain.set_main_var('button_code',true);", "rmMain.set_main_var('button_code',false);", showButton);
        }
        return html;
    }

    // create view to change favicon and app icon on apple (temporarily)
    set_favicon(url, icon_type) {
        if (icon_type === "favicon") {
            let favicon = document.querySelector('link[rel="icon"]');
            favicon.href = url;
        }
        else {
            let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon-precomposed"]');
            appleTouchIcon.href = url;
            let appleTouchIcon2 = document.querySelector('link[rel="apple-touch-icon"]');
            appleTouchIcon2.href = url;
        }
        this.load();
    }

    // get updated config data from parent class
    update_data() {
        this.data = this.settings.data;
    }

}


/* module to show different app and server settings */
class RemoteSettingsInfo extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.data = this.settings.data;
        this.basic = this.settings.basic;
        this.tab = this.settings.tab;

        this.buttons = this.buttons.bind(this);
        this.load = this.load.bind(this);
    }

    // create container for system information
    create() {

        return "<br/><div id='module_system_info'></div>";
    }

    // load data with system information
    load() {
        this.update_data();

        let cookie = rmCookies.info();
        let main_audio = rmStatusAudio.audio_device;  // get main audio device from file
        let main_device_config = rmData.devices.data(main_audio);
        let main_device_commands = rmData.devices.list_commands(main_audio, "definition");
        let main_device = rmStatus.status_device_raw(main_audio);
        //let system_health = rmStatus.status_system("health");
        let audio_max = 100;
        let audio1, audio2;

        if (main_device && main_device_config) {
            if (main_device_commands && main_device_commands["vol"] && main_device_commands["vol"]["values"] && main_device_commands["vol"]["values"]["max"]) {
                audio_max  = main_device_commands["vol"]["values"]["max"];
            }
            else {
                audio_max  = 100;
                this.logging.error("Max values not defined, set 100!");
            }
            audio1 = "Power: "  + main_device["power"] + " / " + "Volume: " + main_device["vol"] + " (" + audio_max + ")";
            audio2 = rmData.devices.label(main_audio) + " (" + main_audio + ")";
        }

        // version information
        let set_temp  = this.tab.start();
        set_temp += this.tab.row( "Client:",	 appVersion + " / " + this.settings.test_info + " (" + rollout + ")" );
        set_temp += this.tab.row( "Server:",	 this.data["API"]["version"] + " / " + this.data["API"]["rollout"] );
        set_temp += this.tab.row( "Modules:",
            "jcMsg "        + appMsg.appVersion +
            " / jcApp "     + appFW.appVersion +
            " / jcAppFW "   + appFwVersion +
            " / jcModules " + modules_version +
            " / jcCookies " + appCookie.appVersion +
            " / jcFunction "+ jc_functions_version +
            " / jcSlider "  + rmStatusAudio.slider.appVersion );
        set_temp += this.tab.row( "Sources:",  "<a href='https://github.com/jc-prg/remote/tree/"+git_branch+"/' target='_blank'>https://github.com/jc-prg/remote/tree/"+git_branch+"/</a>");
        set_temp += this.tab.row( "REST API:", "<a href='"+ RESTurl + "api/list/' target='_blank'>" + RESTurl + "api/list/</a>");
        set_temp += this.tab.end();
        let setting_info = set_temp;

        // server health
        /*
        let modules = [];
        for (const [key, value] of Object.entries(system_health)) {
            if (value === "registered")      { modules.push(key); }
        }
        setTimeout(() => { rmStatusShow.show_status_system_health(); }, 500 );

        set_temp  = this.tab.start();
        set_temp += this.tab.row( 	"Threads:&nbsp;", "<div id='system_health'></div>" );
        set_temp += this.tab.row( 	"APIs:&nbsp;", modules.join(", ") );
        set_temp += this.tab.row( 	"&nbsp;");
        set_temp += this.tab.row( 	"StatusCheck&nbsp(Load):&nbsp;",  "<div id='average_status_duration_load'>"+lang("PLEASE_WAIT")+"</div>");
        set_temp += this.tab.row( 	"StatusCheck&nbsp(Write):&nbsp;",  "<div id='average_status_duration'>"+lang("PLEASE_WAIT")+"</div>");
        set_temp += this.tab.end();
        let setting_health = set_temp;

         */

        // sceen & display
        set_temp  = this.tab.start();
        set_temp += this.tab.row( 	"Screen:",      print_display_definition());
        set_temp += this.tab.row( 	"Device:", 		"<div id='screenWidth'>"+screen.width+"x"+screen.height+"</div>" );
        set_temp += this.tab.row( 	"Window:", 		"<div id='windowWidth'>"+window.innerWidth+"x"+window.innerHeight+"</div>" );
        set_temp += this.tab.row(	"Position:",    "<div id='scrollPosition'>0 px</div>" );
        set_temp += this.tab.row( 	"Theme:", 		appTheme );
        set_temp += this.tab.end();
        let setting_display = set_temp;

        // status
        set_temp  = this.tab.start();
        set_temp += this.tab.row( 	"Server:", 	this.settings.app_stat );
        set_temp += this.tab.row( 	"Cookie:",	cookie );
        set_temp += this.tab.row( 	"Button:",	this.settings.app_last );
        if (main_device && main_device_config) {
            set_temp += this.tab.row( 	"Audio:",	audio2 + "<br/>" + audio1 );
        }
        else {
            set_temp += this.tab.row( 	"Audio:",	"<i>No main audio device defined yet.</i>" );
        }
        set_temp += this.tab.end();
        let setting_other = set_temp;

        const myBox = new RemoteElementSheetBox("module_system_info", "220px", true);
        myBox.addSheet("Info",   "&nbsp;" + setting_info);
        myBox.addSheet("Screen", "&nbsp;" + setting_display);
        myBox.addSheet("Other",  "&nbsp;" + setting_other);
    }

    // create view with buttons and its explanations
    buttons() {

        this.update_data();
        let setting = "";

        // button color codes
        let buttons = "";
        for (let key in colors_power) {
            buttons += "<button class='rm-button sample' style='background-color:"+colors_power[key]+";width:22%;'>"+key+"</button>";
        }
        let button_style = "width:22%;max-width:none;";
        buttons += "<button class='rm-button sample notfound' style='"+button_style+"' disabled>command not found</button>";
        buttons += "<button class='rm-button sample notfound' style='"+button_style+"'>edit mode: cmd not found</button>";
        buttons += "<button class='rm-button sample small_edit' style='"+button_style+"'>edit mode: invisible</button>";

        let set_temp  = this.tab.start();
        set_temp += this.tab.row( "<span class='center'>" + buttons + "</span>" );
        set_temp += this.tab.end();
        setting  += this.basic.container("setting_color_codes","Button color codes",set_temp,false);

        // button images
        set_temp = "";
        let images = rmData.elements.data("button_images");
        for (let key in images) {
            let onclick = "appMsg.info(\"Copied button key ["+key+"] to clipboard.\");";
            onclick    += "navigator.clipboard.writeText(\""+key+"\");";
            set_temp += "<button class='image_list key' style='width:50px;'>";
            set_temp += key;
            set_temp += "</button>";
            set_temp += "<button class='image_list' onclick='"+onclick+"'>";
            set_temp += rm_image(images[key], false);
            set_temp += "</button>";
        }
        setting  += this.basic.container("setting_button_images","Images buttons",set_temp,false);

        set_temp  = "";
        let colors    = rmData.elements.data("button_colors");
        for (let key in colors) {
            let onclick = "appMsg.info(\"Copied button key ["+key+"] to clipboard.\");";
            onclick    += "navigator.clipboard.writeText(\""+key+"\");";
            set_temp += "<button class='rm-button sample empty' style='width:22%;float:left'>";
            set_temp += key;
            set_temp += "</button>";
            set_temp += "<button class='rm-button sample bg"+key+"' style='width:22%;' onclick='"+onclick+"'>";
            set_temp += "";
            set_temp += "</button>";
        }
        setting  += this.basic.container("setting_button_colors","Color buttons",set_temp,false);

        return setting;
    }

    // get updated config data from parent class
    update_data() {
        this.data = this.settings.data;
    }

}


/* module to edit groups and macros */
class RemoteSettingsMacro extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.button = this.settings.button;
    }

    // create container for macro settings
    create() {
        this.button.width = "100px";
        this.button.height = "30px";
        let setting   = "";
        setting  += "<br/><span class='center'><div id='macros-edit-json'></div></span>";
        setting  += "<span class='center'><div style='width:100%;text-align:center;'><br/>";
        setting  += this.button.sized("add_scene",lang("BUTTON_T_SAVE"),"settings","rmApi.call(#MacroChange#, [#groups#,#macro#,#dev-on#,#dev-off#]);","") + "&nbsp;";
        setting  += this.button.sized("reset_scene",lang("BUTTON_T_RESET"),"settings",this.settings.name+".create(\"edit_macros\");","");
        setting  += "<br/></div></span>";
        return setting;
    }

    // load data for macro settings
    load() {
        let macro_json_edit = `
            <h4>Edit JSON for global macros:</h4>
            <div id='json-edit-macro'></div>
            <h4>Edit JSON for device ON macros:</h4>
            <div id='json-edit-dev-on'></div>
            <h4>Edit JSON for device OFF macros:</h4>
            <div id='json-edit-dev-off'></div>
        `;
        const myBox2 = new RemoteElementSheetBox("macros-edit-json", "500px", true);
        myBox2.addSheet("Macros",    "<h4>Edit JSON for global macros:</h4>" + "<div id='json-edit-macro-1'></div>", true, this.name +".load_macro_edit('json-edit-macro-1','global','macro');");
        myBox2.addSheet("Device ON", "<h4>Edit JSON for global macros:</h4>" + "<div id='json-edit-macro-2'></div>", true, this.name +".load_macro_edit('json-edit-macro-2','device-on','dev-on');");
        myBox2.addSheet("Device OFF","<h4>Edit JSON for global macros:</h4>" + "<div id='json-edit-macro-3'></div>", true, this.name +".load_macro_edit('json-edit-macro-3','device-off','dev-off');");
        myBox2.addSheet("Raw Groups","<h4>Edit JSON for device groups:</h4>" + "<div id='json-edit-groups'></div>", false);
        myBox2.addSheet("Raw Macros",   macro_json_edit, false);
        myBox2.addSheet("Raw Help",         lang("MANUAL_MACROS"));

        const jsonEdit = new RemoteJsonEditing("edit-macros", "compact", "width:100%;height:270px;");
        jsonEdit.create("json-edit-groups", "groups",  rmData.device_groups.config_groups);
        jsonEdit.create("json-edit-macro",  "macro",   rmData.macros.config_macros["global"]);
        jsonEdit.create("json-edit-dev-on", "dev-on",  rmData.macros.config_macros["device-on"]);
        jsonEdit.create("json-edit-dev-off","dev-off", rmData.macros.config_macros["device-off"]);
    }

    load_macro_edit(container_id, macro_type, output_id=undefined ) {

        let source_data;
        if (macro_type === "global") {
            source_data = rmData.macros.prepare_edit_sources(true, true, false, true, true);
        }
        else if (macro_type.indexOf("device-") === 0) {
            source_data = rmData.macros.prepare_edit_sources(true, true, false, false, false);
        }

        const macroEdit = new RemoteMacroEditor(container_id, {
            categories: source_data,
            devices: rmData.macros.list_all(macro_type),
            devices_edit: true,
            initial: rmData.macros.data(macro_type),
            title: `Select ${macro_type.toUpperCase()} macro`,
        }, "editor-"+macro_type,  output_id);
    }
}


/* module to edit the timer settings */
class RemoteSettingsTimer extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.create = this.create.bind(this);
        this.info = this.info.bind(this);
    }

    // create container and load data for settings view of the timer editing
    create () {
        let html = "";
        html += "<div id='module_timer_info' style='width:100%;min-height:100px;'></div>";
        setTimeout(() =>{ appFW.requestAPI("GET", ["timer"], "", this.info); }, 100);
        return html;
    }

    select (key, target, selected) {
        let data;
        let value = getValueById(selected);

        if (value.indexOf("macro_group") > -1)   {
            value = value.split("_")[2];
            data = rmData.device_groups.list_buttons(value);
        }
        else if (value.indexOf("macro_") > -1)   {
            value = value.split("_")[1];
            data = rmData.macros.list_all(value);
        }
        else {
            data = rmData.devices.list_buttons(value);
        }
        this.settings.basic.input_width = "200px;";
        let onchange = "document.getElementById('add_button_"+key+"').removeAttribute('disabled');";
        let select_title = value;
        if (getValueById(selected).indexOf("group") >= 0) {
            select_title = "group " + getValueById(selected).split("_")[2]; }
        else if (getValueById(selected).indexOf("macro") >= 0) { select_title = "macro " + select_title; }
        let select = this.settings.basic.select_array("add_button_command2_"+key, " button from "+select_title+" ...", data, onchange);
        setTextById(target, select);
    }

    info (data) {

        let html = "";
        let tab = this.settings.tab;
        let input = this.settings.input;
        let basic = this.settings.basic;
        this.settings.button.width = "70px;";


        this.dialog = function (key, entry) {

            let data_fields = "timer_name_"+key+",timer_description_"+key+",timer_regular_"+key+",timer_once_"+key+",timer_commands_"+key;
            let link_save   = "val=document.getElementById(\"timer_name_"+key+"\").value; if(val!=\"\") { rmApi.call(\"TimerEdit\",[\""+key+"\",\""+data_fields+"\"]); } else { appMsg.alert(\"Add a title!\"); }";
            let link_reset  = "rmSettings.module_timer.create();";
            let link_delete = "rmApi.call(#TimerDelete#, #"+key+"#);";
            let link_try    = "rmApi.call(#TimerTry#, #"+key+"#);";

            const now = new Date();
            const hours = now.getHours();
            const server_time = data["REQUEST"]["server-time-local"];
            const server_hours = Number(server_time.split(" | ")[1].split(":")[0]);
            const difference = hours - server_hours;

            let tab = this.settings.tab;

            let buttons = "";
            if (key !== "NEW_TIMER_ID") {
                buttons += this.settings.button.sized("timer_save_"+key,    lang("BUTTON_T_SAVE"),   "settings",  link_save);
                buttons += this.settings.button.sized("timer_reset_"+key,   lang("BUTTON_T_RESET"),  "settings",  link_reset);
                buttons += this.settings.button.sized("timer_delete_"+key,  lang("BUTTON_T_DELETE"), "settings",  link_delete);
                buttons += this.settings.button.sized("timer_try_"+key,     lang("BUTTON_T_TRY"),    "settings",  link_try);
            }
            else {
                buttons += this.settings.button.sized("timer_add_"+key,     lang("BUTTON_T_CREATE"), "settings",  link_save);
            }

            let entry_html = "";
            entry_html += tab.start("");
            if (key !== "NEW_TIMER_ID") {
                entry_html += tab.row("ID:",        key);
            }
            entry_html += tab.row("Title:", this.settings.elements.input("timer_name_"+key, "", "",  entry["name"]));
            entry_html += tab.row("Description:", this.settings.elements.input("timer_description_"+key, "", "", entry["description"]));
            entry_html += tab.end();
            entry_html += tab.start();
            entry_html += tab.line();
            entry_html += tab.row("Repeating timer:");
            entry_html += tab.row("<textarea id='timer_regular_"+key+"' style='width:95%;height:80px;display:none;'>" + JSON.stringify(entry["timer_regular"]) + "</textarea>");
            entry_html += tab.row(this.element("regular", key, entry["timer_regular"]));
            if (difference !== 0) {
                entry_html += tab.row("<i>Note:</i> server time differs "+difference+" hour(s).");
            }
            entry_html += tab.row("&nbsp;");
            entry_html += tab.row("<textarea id='timer_once_"+key+"'    style='width:95%;height:80px;display:none;'>" + JSON.stringify(entry["timer_once"]) + "</textarea>");
            entry_html += tab.row("Commands:");
            entry_html += tab.row("<input id='timer_commands_"+key+"'   style='width:95%' value='" + JSON.stringify(entry["commands"]) + "'>");
            entry_html += tab.row("&nbsp;");

            this.settings.basic.input_width = "125px;";
            let onchange = "rmSettings.module_timer.select('"+key+"', 'add_button_command_"+key+"','add_button_device_"+key+"');";
            let onclick = "let command = getValueById(\"add_button_device_"+key+"\") + \"_\" + getValueById(\"add_button_command2_"+key+"\");";
            onclick += "let value = JSON.parse(getValueById(\"timer_commands_"+key+"\")); value.push(command); ";
            onclick += "setValueById(\"timer_commands_"+key+"\", JSON.stringify(value));";

            let device_macro = {};
            for (let key2 in rmData.devices.config_devices) { device_macro[key2] = "Device: " + rmData.devices.label(key2); }
            for (let key2 in rmData.macros.config_macros)  { if (key2 !== "description" && key2 !== "groups") { device_macro["macro_"+key2] = "Macro: " + key2; } }
            for (let key2 in rmData.device_groups.config_groups)  { device_macro["macro_groups_"+key2] = "Group: " + key2; }

            entry_html += tab.row("Add Command:");
            entry_html += tab.row(
                "<div style='float:left;'>" + this.settings.basic.select("add_button_device_"+key,"...", device_macro, onchange) + "&nbsp; </div>" +
                "<div style='float:left;' id='add_button_command_"+key+"'><select style='width:"+this.settings.basic.input_width+";margin:1px;' disabled><option>...</option></select></div>" +
                "<div style='float:left;'>&nbsp;<button id='add_button_"+key+"' style='height:25px;margin:1px;' onclick='"+onclick+"' disabled>&nbsp;add&nbsp;</button>"
            );
            entry_html += tab.row("&nbsp;");
            entry_html += tab.line();
            entry_html += tab.row(buttons);
            entry_html += tab.end();

            return entry_html;
        }

        for (let key in data["DATA"]["timer"]) {
            let entry = data["DATA"]["timer"][key];
            let entry_html = this.dialog(key, entry);
            let entry_title = entry["name"] + "</b>";
            if (entry["timer_regular"]["active"]) {
                entry_title += "";
            }
            else {
                entry_title += " <i>(inactive)</i>";
            }

            html  += this.settings.basic.container("timer_edit_"+key, entry_title, entry_html, false);
        }

        let entry_html  = this.dialog("NEW_TIMER_ID", {"name":"","description":"","commands":[],
            "timer_regular":{"active":false,"month":-1,"day_of_month":-1,
                "hour":-1,"minute":-1,"day_of_week":-1}, "timer_once": []});
        let entry_title = "<i>Create new timer ...</i>";

        html += this.settings.basic.container("timer_edit_add_new", entry_title, entry_html, false);
        html += "<span class='center'>&nbsp;<hr style='border:1px solid;height:1px;margin: 10px 5px 5px;padding:0;'/><small><i>Server time: <text id='current_server_time'></text></i></small></span>";
        setTextById('module_timer_info', html);
    }

    element (type, key, data) {

        this.input = function (input_type, timer_type, key, value) {
            let options;
            let onchange = this.name+".change(\"" + timer_type + "\", \""+key+"\");";
            let html = "<select id='timer_select_" + input_type + "_" + key +"' style='width:40px;' onchange='"+onchange+"' class='timer_select'>";

            if (input_type === "month")             { options = {"**": -1}; for (let i=1;i<=12;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "day_of_month") { options = {"**": -1}; for (let i=1;i<=31;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "hour")         { options = {"**": -1}; for (let i=0;i<24;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "minute")       { options = {"**": -1}; for (let i=0;i<60;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "day_of_week")  { options = {"*": -1}; for (let i=0;i<=6;i++)  { options[i.toString().padStart(1, '0')] = i.toString().padStart(1, '0'); } }
            else                                    { options = {}; this.logging.error("input type unknown: " + input_type); }

            let option_keys = Object.keys(options).sort();
            for (let i=0;i<option_keys.length;i++) {
                let key = option_keys[i];
                let selected = "";
                if (options[key] === value) { selected = "selected"; }
                html += "<option value='"+options[key]+"' "+selected+">" + key + "</option>";
            }
            html += "</select>";
            return html;
        }

        let html = "";
        if (type === "regular") {
            let checked = "";
            let onchange = this.name+".change(\"" + type + "\", \""+key+"\");";
            if (data["active"]) { checked = "checked"; }
            html += "<input id='timer_"+type+"_active_"+key+"' type='checkbox' value='active' "+checked+" onchange='"+onchange+"'>:&nbsp;";
            html += "<input id='timer_"+type+"_YY_"+key+"' type='input' style='width:30px;' value='****' disabled class='timer_select'>-";
            html += this.input("month",        type, key, data["month"]) + "-";
            html += this.input("day_of_month", type, key, data["day_of_month"]) + " | ";
            html += this.input("hour",         type, key, data["hour"]) + ":";
            html += this.input("minute",       type, key, data["minute"]) + " | ";
            html += this.input("day_of_week",  type, key, data["day_of_week"]);
        }
        return html;
    }

    change (timer_type, key) {

        let timer_data = JSON.parse(getTextById("timer_" + timer_type + "_" + key));
        let active = document.getElementById("timer_" + timer_type + "_active_" + key);
        for (let data_key in timer_data) {
            if (data_key !== "active") {
                timer_data[data_key] = getValueById("timer_select_" + data_key + "_" + key);
            }
        }

        timer_data["active"] = active.checked;
        setTextById("timer_regular_"+key, JSON.stringify(timer_data));
    }
}


/* module to edit recording settings */
class RemoteSettingsRecording extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);
        this.settings = parent;

        this.data = this.settings.data;
        this.basic = this.settings.basic;
        this.button = this.settings.button;
        this.tab = this.settings.tab;
        this.elements = new RemoteElementsEdit(this.name + ".elements");
        this.json = new RemoteJsonEditing(this.name + ".json");

        this.record_intervals = {"60":"1'", "120":"2'", "300":"5'", "600":"10'", "1200":"20'", "1800":"30'", "3600":"1h" };
        this.recording_timing = ["N/A","0:00","1:00","2:00","3:00","4:00","5:00","6:00","7:00","8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00","23:00"];
    }

    /* create initial view to edit recording settings */
    create() {
        let html = "";
        let setting = "";

        this.button.height = "30px";
        this.button.width = "80px";

        let record_settings = rmData.record.configuration();
        let device_list = rmData.devices.select();
        let device_onchange = this.name+".update_select('add');";
        let delete_onchange = this.name+".update_select('delete');";
        let delete_data = {};

        let configuration = "<textarea id='record_config_json' class='setting_recording_textarea' disabled>" + this.json.customJSONStringify(record_settings["record"]) + "</textarea>";
        configuration += "<textarea id='record_config_json_reset' style='display:none'>" + this.json.customJSONStringify(record_settings["record"]) + "</textarea>";

        if (record_settings["record_timing"]["start"] === -1) { record_settings["record_timing"]["start"] = "N/A"; }
        if (record_settings["record_timing"]["end"] === -1)   { record_settings["record_timing"]["end"] = "N/A"; }
        for (let key in record_settings["record"]) { delete_data[key] = record_settings["record"][key]["label"] + " (" + key + ")"; }

        this.elements.input_width = "50px";
        let config_start = this.elements.select_array("record_config_start", "start", this.recording_timing, "", record_settings["record_timing"]["start"]);
        let config_end = this.elements.select_array("record_config_end", "end", this.recording_timing, "", record_settings["record_timing"]["end"]);
        this.elements.input_width = "120px";
        let config_devices = this.elements.select("record_config_device", "device", device_list, device_onchange);
        let config_delete = this.elements.select("record_config_delete", "element", delete_data, delete_onchange);

        html += this.tab.start("80%");
        html += this.tab.row("Recording interval:&nbsp;",  this.elements.select("record_config_interval", "interval", this.record_intervals, "", String(record_settings["record_interval"]) ) );
        html += this.tab.row("Recording time:&nbsp;", "from " + config_start + " to " + config_end);
        html += this.tab.end();

        setting  += this.basic.container("record_general_settings",lang("EDIT_RECORDING_SETTINGS"),html,true);

        html = this.tab.start();
        html += this.tab.row("Add:", config_devices + "<span id='record_config_add'></span>" + "<br/>" + this.button.sized("add_value",lang("BUTTON_T_ADD"),"settings",this.name + ".add_value();", "disabled"));
        html += this.tab.row("Delete:", config_delete + "<br/>" + this.button.sized("delete_value",lang("BUTTON_T_DELETE"),"settings",this.name + ".delete_value();", "disabled"));
        html += this.tab.row("Configuration:", false);
        html += this.tab.row(configuration, false);
        html += this.tab.end();

        setting  += this.basic.container("record_value_configuration",lang("EDIT_RECORDED_FIELDS"),html,true);

        setting += "<br/>";
        setting += this.button.sized("reset_config",lang("BUTTON_T_RESET"),"settings",this.name + ".reset();") + "&nbsp;";
        setting += this.button.sized("save_config",lang("BUTTON_T_SAVE"),"settings",this.name + ".save();");
        setting += "<br/>&nbsp;";

        return setting;
    }

    /* update fields when options are selected */
    update_select(select="add", details=false) {
        this.capitalizeFirstLetter = function (str) {
            if (!str) return str; // handles empty or null strings
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        let commands, commands_definition, config_commands;
        let value_device = getValueById("record_config_device");
        let value_delete = getValueById("record_config_delete");
        let value_onchange = this.name+".update_select('"+select+"',true);";

        if (select === "add") {
            if (rmData.devices.exists(value_device)) {
                commands = rmData.devices.list_commands(value_device, "get");
                commands_definition = rmData.devices.list_commands(value_device, "definition");
                config_commands = this.elements.select_array("record_config_value", "value", commands, value_onchange);
            }
            if (!details) {
                setTextById("record_config_add", "&nbsp;" + config_commands + "<span id='record_config_add_details'></span>");
            } else {
                //let selected = getValueById("record_config_value");
                let select_value = document.getElementById("record_config_value");
                let selected = select_value.options[select_value.selectedIndex].value;

                let unit = "";
                if (commands_definition[selected]["unit"]) { unit = commands_definition[selected]["unit"]; }

                let config_label = "<br/>" + this.elements.input("record_config_add_label", this.capitalizeFirstLetter(selected)) + "&nbsp;";
                config_label += this.elements.input("record_config_add_unit", unit);
                document.getElementById("add_value").disabled = "";
                setTextById("record_config_add_details", "&nbsp;" + config_label);
            }
        }

        if (select === "delete" && value_delete) {
            document.getElementById("delete_value").disabled = "";
        }
    }

    /* add a value to the configuration */
    add_value() {
        let configuration = JSON.parse(document.getElementById("record_config_json").innerHTML);
        let key = getValueById("record_config_device") + "_" + getValueById("record_config_value");
        configuration[key] = {
            "label": getValueById("record_config_add_label"),
            "unit": getValueById("record_config_add_unit"),
        }
        document.getElementById("record_config_json").innerHTML = this.json.customJSONStringify(configuration);
    }

    /* delete a value from the configruation */
    delete_value() {
        let configuration = JSON.parse(document.getElementById("record_config_json").innerHTML);
        let delete_value = getValueById("record_config_delete");
        console.log(delete_value);
        delete configuration[delete_value];
        document.getElementById("record_config_json").innerHTML = this.json.customJSONStringify(configuration);
    }

    /* reset configuration changes */
    reset() {
        let configuration = JSON.parse(document.getElementById("record_config_json_reset").innerHTML);
        document.getElementById("record_config_json").innerHTML = this.json.customJSONStringify(configuration);
    }

    /* save changes */
    save() {
        let start = getValueById("record_config_start");
        let end = getValueById("record_config_end");
        if (start === "N/A") { start = -1; }
        if (end === "N/A") { end = -1; }

        let configuration = {
            "record": JSON.parse(document.getElementById("record_config_json").innerHTML),
            "record_interval": Number(getValueById("record_config_interval")),
            "record_timing": {
                "start": start,
                "end": end
            }
        }
        this.logging.debug("Save recording configuration ...");
        this.logging.debug(configuration);
        rmApi.call("RecordingEdit", [], configuration);

        setTimeout(()=>{
            this.create();
        }, 2000);
    }
}


/* class to create simple select and input element for setting dialogs */
class RemoteSettingsElements extends RemoteDefaultClass {
    constructor(name, parent) {
        super(name);

        this.settings = parent;
        this.input = this.input.bind(this);
        this.select = this.select.bind(this);
    }

    /* create a select element for the settings section - a more enhanced version is RemoteElementsEdit.select() */
    select (id, title, data, onchange="", value="") {

        let item  = "<select style=\"width:" + this.input_width + ";margin:1px;\" id=\"" + id + "\" onChange=\"" + onchange + "\">";
        item     += "<option value='' disabled='disabled' selected>"+lang("SELECT")+" " + title + "</option>";

        if (Array.isArray(data)) {
            for (let i=0;i<data.length;i++) {
                let selected = "";
                let key = data[i];
                if (key === value) { selected = "selected"; }
                if (key !== "default") {
                    item += "<option value=\"" + key + "\" " + selected+ ">" + key + "</option>";
                }
            }
        }
        else {
            for (let key in data) {
                let selected = "";
                if (key === value) { selected = "selected"; }
                if (key !== "default") {
                    item += "<option value=\"" + key + "\" " + selected+ ">" + data[key] + "</option>";
                }
            }
        }
        item     += "</select>";
        return item;
    }

    /* create an input element for the setting section */
    input (id, onclick="", oninput="", value="") {

        let text = "<input id=\"" + id + "\" oninput=\""+oninput+"\" style='width:" + this.settings.input_width + ";margin:1px;' value='" + value + "'>";
        if (onclick !== "") {
            text += "<button onclick=\""+onclick+"\" class='rm-button calculate_values'>&gt;&gt;</button>";
        }
        return text;
    }

}


remote_scripts_loaded += 1;
