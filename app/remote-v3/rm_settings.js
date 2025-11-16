//--------------------------------
// jc://remote/settings/
//--------------------------------

class RemoteSettings {
    constructor(name) {	// IN PROGRESS

        // preset vars
        this.data          = {};
        this.active        = false;
        this.app_name      = name;
        this.e_settings    = ["setting1","setting2","setting3","setting4","setting5","setting6"];
        this.e_remotes     = ["frame3","frame4","frame5","frame1","frame2"];
        this.input_width   = "140px";
        this.initial_load  = true;
        this.edit_mode     = false;
        this.manual_mode   = false;
        this.mode          = "";
        this.index_buttons = undefined;
        this.line          = "<div style=\"border:1px solid;height:1px;margin: 10px 5px 5px;padding:0;\"></div>";

        this.logging = new jcLogging(this.app_name+".logging");

        this.json = new RemoteJsonHandling(this.app_name+".json");
        this.button = new RemoteControlBasic(this.app_name+".button");
        this.basic = new RemoteElementsEdit(this.app_name+".basic");
        this.tab = new RemoteElementTable(this.app_name+".tab");
        this.toggle = new RemoteElementSlider(this.app_name+".toggle");
        this.elements = new RemoteSettingsElements(this.app_name+".elements", this);

        this.module_timer = new RemoteSettingsTimer(this.app_name+".module_timer", this);
        this.module_macros = new RemoteSettingsMacro(this.app_name+".module_macro", this);
        this.module_info = new RemoteSettingsInfo(this.app_name+".module_info", this);
        this.module_general = new RemoteSettingsGeneral(this.app_name+".module_general", this);
        this.module_api = new RemoteSettingsApi(this.app_name+".module_api", this);
        this.module_remotes = new RemoteSettingsRemotes(this.app_name+".module_remotes", this);

    }

    // initialize settings
    init(data) {
            // set data
            this.data = data;

            // status
            if (data)	{this.app_stat = data["STATUS"]["system"]["message"]; this.app_last = data["REQUEST"]["Button"];}
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
        elementVisible("setting_ext_top_frame");
        elementVisible("setting_ext_frames");

        if (selected_mode !== "")   { this.mode = selected_mode; }
        else if (this.mode !== "")  { selected_mode = this.mode; }

        if (selected_mode === "index") {

            setNavTitle(lang('SETTINGS'));
            this.settings_ext_reset();
            this.settings_ext_append(1, lang("SETTINGS"), this.index(), "", false, true);
            //this.settings_ext_append(2, lang("QUICK_ACCESS"), "&nbsp;<br/>" + this.index_quick(true, true));
            this.create_show_ext();

            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
            statusShow_powerButton('button_manual_mode', getTextById('button_manual_mode'));
        }
        else if (selected_mode === "index_small") {
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, ""), "", true);
            this.create_show_ext();
        }
        else if (selected_mode === "general") {
            setNavTitle(lang('SETTINGS_GENERAL'));
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
            setNavTitle(lang('SETTINGS_DEVICES'));

            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(2,lang("ADD_DEVICE"), this.module_remotes.add_device(direct_cmd, direct_data));
            this.settings_ext_append(4,lang('EDIT_DEVICES'), this.module_remotes.list_devices());
            this.index_buttons_html = this.index(true, "SETTINGS_DEVICES");
            this.create_show_ext();

            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
            statusShow_powerButton('button_manual_mode', getTextById('button_manual_mode'));
            statusShow_powerButton('button_show_code', getTextById('button_show_code'));

            startDragAndDrop("sort_devices", apiMovePosition);
        }
        else if (selected_mode === "edit_scenes") {
            setNavTitle(lang('SETTINGS_SCENES'));

            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(2,lang("ADD_SCENE"), this.module_remotes.add_scene(direct_cmd, direct_data));
            this.settings_ext_append(1,lang('EDIT_SCENES'), this.module_remotes.list_scenes());
            this.index_buttons_html = this.index(true, "SETTINGS_SCENES");
            this.create_show_ext();

            startDragAndDrop("sort_scenes", apiMovePosition);
        }
        else if (selected_mode === "edit_interfaces") {
            setNavTitle(lang('SETTINGS_API'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.module_api.edit();
            this.settings_ext_append(1, "", this.module_api.create());
            this.settings_ext_append(2, "", this.module_api.show_logs());
            this.create_show_ext();
            this.index_buttons_html = this.index(true, "SETTINGS_API");
            apiGetConfig_showInterfaceData(this.module_api.edit_info);
            statusShow_powerButton('button_edit_mode', getTextById('button_edit_mode'));
        }
        else if (selected_mode === "edit_timer") {
            setNavTitle(lang('SETTINGS_TIMER'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("SETTINGS_TIMER"), this.module_timer.create());
            this.index_buttons_html = this.index(true, "SETTINGS_TIMER");
            this.create_show_ext();
        }
        else if (selected_mode === "edit_macros") {
            setNavTitle(lang('SETTINGS_MACROS'));
            this.settings_ext_reset();
            this.settings_ext_append(0,"", this.index(true, "WRAPPER"), "", true);
            this.settings_ext_append(1,lang("EDIT_MACROS"), this.module_macros.create());
            this.index_buttons_html = this.index(true, "SETTINGS_MACROS");
            this.create_show_ext();
            this.module_macros.load();
        }
        else {
            setNavTitle(lang('INFORMATION'));
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
        statusCheck_modes();
        scrollTop();
    }

    // show and hide the relevant frames
    create_show() {

        elementVisible("setting_frames");
        elementHidden("setting_ext_frames");

        let show_settings = true;
        let show_remotes = false;
        this.active = true;
        showRemoteInBackground(0);

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

        let button_img  = this.data["CONFIG"]["elements"]["button_images"];
        let setting_modules_back = {
            "SETTINGS":         ["link_back",   "rm3settings.create('index');"],
        }
        let setting_modules = {
            "SETTINGS_DEVICES": ["remote",      "rm3settings.create('edit_devices');"],
            "SETTINGS_SCENES":  ["cinema",      "rm3settings.create('edit_scenes');"],
            "SETTINGS_TIMER":   ["timer",       "rm3settings.create('edit_timer');"],
            "SETTINGS_MACROS":  ["macros",       "rm3settings.create('edit_macros');"],
            "INFORMATION":      ["info2",       "rm3settings.create('info');"],
            "SETTINGS_API":     ["plug2",       "rm3settings.create('edit_interfaces');"],
            "SETTINGS_GENERAL": ["settings2",   "rm3settings.create('general');"],
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
            text = "<font class='remote_edit_headline'><center><b>" + label + "</b></center></font>"  + this.basic.edit_line() + text + "<br/>";
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
        showRemoteInBackground(0);
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
            content 	= "<font class='remote_edit_headline'><center><b>" + label + "</b></center></font>"
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
class RemoteSettingsRemotes {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;

        this.data = this.settings.data;
        this.basic = this.settings.basic;
        this.button = this.settings.button;
        this.elements = this.settings.elements;
        this.tab = this.settings.tab;
    }

    // create dialogs to add scenes
    add_scene(direct_cmd="") {
        let setting = "";
        let set_temp = "";
        this.button.width  = "120px";
        this.button.height = "30px";

        let open_add_scene = false;
        if (direct_cmd === "add_scene") { open_add_scene = true; }

        set_temp  = this.tab.start();
        set_temp += this.tab.row( "ID:",            this.elements.input("add_scene_id", "", "apiSceneAddCheckID(this);") );
        set_temp += this.tab.row( "Label:",         this.elements.input("add_scene_label") );
        set_temp += this.tab.row( "Description:",   this.elements.input("add_scene_descr") );
        set_temp += this.tab.row( "<center>" +
            this.button.sized("add_scene",lang("ADD_SCENE"),"settings","apiSceneAdd([#add_scene_id#,#add_scene_descr#,#add_scene_label#]);") +
            "</center>", false);
        set_temp += this.tab.end();
        setting  += this.basic.container("setting_add_scene",lang("ADD_SCENE"),set_temp,open_add_scene);

        return setting;
    }

    // create drag & droppable list of scenes
    list_scenes() {
        this.update_data();

        let scenes = this.data["CONFIG"]["scenes"];
        let html = "&nbsp;<br/><ul id='sort_scenes'>";

        for (let key in scenes) { scenes[key]["position"] = scenes[key]["settings"]["position"]; }
        let order  = sortDict(scenes, "position");
        for (let key in order) {
            let scene = order[key];
            let visible = "";
            let style = "";
            if (scenes[scene]["settings"]["visible"] === "no") { style = " hidden"; }

            html += "<li id='"+scene+"'>";
            html += "<div class='slist_li_content"+style+"'>" + scenes[scene]["settings"]["label"] + "<br/>";
            html += "<font style='color:#999999;font-style:normal;font-weight:normal;font-size:9px;'><rm-id>"+scene+"</rm-id></font></div>";
            html += "<div class='slist_li_edit'>" + this.remote_edit("scene", scene, scenes[scene]["settings"]["visible"]) + "</div>";
            html += "</li>";
        }

        html += "</ul>";
        return html;
    }

    // create dialogs to add devices
    add_device(direct_cmd="", direct_data="") {
        let set_temp;
        let setting = "";
        this.button.width  = "120px";
        this.button.height = "30px";

        let open_add_device = false;
        if (direct_cmd === "add_device" && direct_data !== "") { set_temp = this.add_remote_dialog(direct_data); open_add_device = true; }
        else                                                   { set_temp = this.add_remote_dialog(); }

        setting += this.basic.container("setting_add_device",lang("ADD_DEVICE"),set_temp,open_add_device);
        return setting;
    }

    // create drag & droppable list of devices
    list_devices() {
        this.update_data();

        let devices = this.data["CONFIG"]["devices"];
        let html   = "&nbsp;<br/><ul id='sort_devices'>";

        for (let key in devices) {
            devices[key]["position"] = devices[key]["settings"]["position"];
        }
        let order  = sortDict(devices, "position");
        for (let key in order) {
            let device          = order[key];
            let api             = devices[device]["interface"]["api"].replace("_","/");
            api                 = api.replace("/default","");
            let visible         = "";
            let style           = "";
            if (devices[device]["settings"]["visible"] === "no") { style = " hidden"; }

            html += "<li id='"+device+"'>";
            html += "<div class='slist_li_content"+style+"'>" + devices[device]["settings"]["label"] + "<br/>";
            html += "<div style='color:#999999;font-style:normal;font-weight:normal;font-size:9px;'><rm-id>"+ device + "</rm-id> (" + api + ")</div></div>";
            html += "<div class='slist_li_edit'>" + this.remote_edit("device", device, devices[device]["settings"]["visible"]) + "</div>";
            html += "</li>";
        }

        return html;
    }

    // create links for drag & drop items to edit the remotes (for scenes and devices)
    remote_edit(type, id, visible) {

        let delete_cmd;
        let images = this.data["CONFIG"]["elements"]["button_images"];
        let img_visible = rm_image(images["hidden"]);
        let img_edit = rm_image(images["edit"]);
        let img_delete = rm_image(images["trash"]);

        let onclick_reload = "setTimeout(function() { "+this.settings.app_name+".create(\"edit_"+type+"s\"); }, 2000);";

        if (visible === "no")  { img_visible = rm_image(images["visible"]); }
        if (type === "device") { delete_cmd  = "apiDeviceDelete"; }
        else                   { delete_cmd  = "apiSceneDelete"; }

        let edit_commands = "";
        edit_commands += "<span onclick='apiRemoteChangeVisibility(\""+type+"\",\""+id+"\",\"rm_visibility_"+id+"\");"+onclick_reload+"' style='cursor:pointer;'>" + img_visible + "</span>&nbsp;&nbsp;&nbsp;";
        edit_commands += "<span onclick='remoteToggleEditMode(true);rm3remotes.create(\""+type+"\",\""+id+"\");' style='cursor:pointer;'>" + img_edit + "</span>&nbsp;&nbsp;";
        edit_commands += "<input id=\"rm_visibility_"+id+"\" style=\"display:none;\" value=\""+visible+"\">";
        edit_commands += "<span onclick='"+delete_cmd+"(\""+id+"\");' style='cursor:pointer;'>" + img_delete + "</span>";
        return edit_commands;
    }

    // create dialogs to add remotes (???)
    add_remote_dialog(device_data_start={}) {
        this.update_data();

        let set_temp = "";
        let onchange2 = this.app_name + ".edit_filenames";
        let onchange = this.app_name + ".on_change_api(this.value);";
        let onchange3 = this.app_name + ".on_change_dev_type(this.value);";
        let add_command = "apiDeviceAdd([#add_device_id#,#add_device_descr#,#add_device_label#,#add_device_api#,#add_device#,#add_device_device#,#add_device_remote#,#add_device_id_external#,#edit_image#],"+onchange2+");";
        add_command += "remoteToggleEditMode(true);";
        let width = this.input_width;
        let icon_container = "<button class='button device_off' style='width:50px;height:40px;'><div id='device_edit_button_image'></div></button>";
        let device_types = this.data["CONFIG"]["device_types"];

        this.on_change_api = function(value) {

            let  api = value.split("_")[0];
            let  api_config = this.data["CONFIG"]["apis"]["list_api_configs"]["list"];
            let  remote_config = this.data["CONFIG"]["remotes"]["list"];

            if (value === "") {
                let  dev_config     = lang("SELECT_API_FIRST");
                let  rm_definition  = lang("SELECT_API_FIRST");
                elementHidden("txt_add_device_device_2");
                elementHidden("txt_add_device_remote_2");
            }
            else {
                let  on_change_1    = "if (this.value == 'other') { " + this.app_name + ".edit_filenames(1); } ";
                on_change_1       += "else                       { setValueById('add_device_device', this.value); }"
                let  on_change_2    = "if (this.value == 'other') { " + this.app_name + ".edit_filenames(2); } ";
                on_change_2       += "else                       { setValueById('add_device_remote', this.value); }"

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
        rm3remotes.basic.input_width = "180px";
        set_temp  = this.tab.start();
        set_temp += this.tab.row( "Device type:"+asterix, this.elements.select("add_device", "device type", device_types, onchange3, "") );
        this.input_width = "180px";
        set_temp += this.tab.row( "Interface:"+asterix, this.elements.select("add_device_api","interface", this.data["CONFIG"]["apis"]["list_description"], onchange, device_data["api_device"]) );
        set_temp += this.tab.row( "ID:"+asterix, "<span id='text_add_device_id'>" + lang("SELECT_DEV_TYPE_FIRST") + "</span>" +
            "<span style='display:none;'>" + this.elements.input("add_device_id", onchange, onchange + "apiDeviceAddCheckID(this);", device_data["id"]) +"</span>");
        set_temp += this.tab.line();
        set_temp += this.tab.row( "Device name:"+asterix, this.elements.input("add_device_descr", "", onchange, device_data["description"]) );
        set_temp += this.tab.row( "Label in menu:"+asterix, this.elements.input("add_device_label", "", onchange, device_data["label"]) );
        set_temp += this.tab.row( "External ID:", this.elements.input("add_device_id_external", "", "", device_data["external_id"]) );
        set_temp += this.tab.row( icon_container, rm3remotes.button_image_select("edit_image", 'device_edit_button_image') );
        set_temp += this.tab.line();
        set_temp += this.tab.row( "Device config:"+asterix, "<span id='txt_add_device_device'>"+lang("SELECT_API_FIRST")+"</span> " +
            "<span id='txt_add_device_device_2' style='display:none;'>" + this.elements.input("add_device_device")+".json</span>" );
        set_temp += this.tab.row( "Remote config:"+asterix, "<span id='txt_add_device_remote'>"+lang("SELECT_API_FIRST")+"</span>" +
            "<span id='txt_add_device_remote_2' style='display:none;'>" + this.elements.input("add_device_remote")+".json</span>" );
        set_temp += this.tab.end();

        this.input_width = width;

        set_temp += "<center>";
        set_temp += this.button.sized("add_dev","Add Device","settings",add_command);
        set_temp += "</center>";
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
class RemoteSettingsApi {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;
        this.logging = new jcLogging(this.app_name);

        this.basic = this.settings.basic;
        this.button = this.settings.button;
        this.data = this.settings.data;
        this.tab = this.settings.tab;
        this.toggle = this.settings.toggle;
        this.elements = this.settings.elements;
        this.json_edit = new RemoteJsonEditing(name+".json", "compact", "width:100%;height:210px;");

        this.edit_info = this.edit_info.bind(this);
    }

    // create container and load data for API settings
    create() {
        let setting = "<b>&nbsp;API details for devices</b><text style='font-size:25px;'>&nbsp;</text>";
        setting    += "<hr style='border:1px lightgray solid;' />";
        setting    += "<div style='padding:5px;padding-bottom:6px;'>";

        let set_temp  = this.tab.start();
        set_temp += this.tab.row("Speed:&nbsp;&nbsp;", this.exec_time_list() );
        set_temp += this.tab.end();
        set_temp += "</div><div style='padding:5px;'>";
        set_temp += this.tab.start();
        set_temp += this.tab.row("Details:&nbsp;&nbsp;", this.device_list("select_dev_status", this.app_name+".device_list_status('select_dev_status','dev_status');"));
        set_temp += this.tab.row("<span id='dev_status'>&nbsp;</span>");
        set_temp += this.tab.end();
        setting  += set_temp;
        setting  += "</div>";

        return setting;
    }

    // create container to show API logging information, to be filled by apiLoggingLoad();
    show_logs() {
        let setting = "<b>&nbsp;API logging</b><text style='font-size:25px;'>&nbsp;</text>";
        setting += " [<text onclick='apiLoggingLoad();' style='cursor:pointer;'>reload</text>]";
        setting += "<hr style='border:1px lightgray solid;' />";
        setting += "<div style='padding:5px;padding-bottom:6px;'>";

        let set_temp = "";
        set_temp += "<div class='server_logging queue' id='logging_queue_send'></div>";
        set_temp += "<div class='server_logging' id='logging_api_send'></div>";
        set_temp += "<div class='server_logging queue' id='logging_queue_query'></div>";
        set_temp += "<div class='server_logging' id='logging_api_query'></div>";

        setting  += set_temp;
        setting  += "</div>";

        apiLoggingLoad();
        return setting;
    }

    // create a container for each existing API with some basic infos and the toggle to (de)activate */
    edit() {

        this.update_data();

        let count = 1;
        let devices_per_interface = this.data["CONFIG"]["apis"]["structure"];
        let interface_status = dataAll["STATUS"]["connections"];

        for (let key in devices_per_interface) {
            if (key !== "") {
                count += 1;
                let text = "";
                let key2 = key.replaceAll("-", "");
                let initial_visible = "display:none;";
                if (!interface_status[key]["active"]) { initial_visible = "display:none"; }

                let command_on = 'javascript:apiInterfaceOnOff(\''+key+'\', \'True\'); document.getElementById(\'interface_edit_'+key+'\').style.display=\'block\';';
                let command_off = 'javascript:apiInterfaceOnOff(\''+key+'\', \'False\');';
                let command_show_hide = "let el_"+key2+" = document.getElementById(\"interface_edit_"+key+"\"); ";
                command_show_hide += "if (el_"+key2+".style.display == \"block\") { el_"+key2+".style.display = \"none\"; } else { el_"+key2+".style.display = \"block\"; }";

                let init = "";
                text += "<div style='width:100%;float:left;max-height:30px;'>";
                text += "   <div style='width:60px;float:right;'>"
                text +=     this.toggle.toggleHTML("active_"+key, "", "", command_on, command_off, init);
                text += "   </div>";
                text += "   <div style='padding:5px;float:left;'><b onclick='"+command_show_hide+"' style='cursor:pointer;'>API: "+key+" </b>&nbsp;<text id='api_status_icon_"+key+"' style='font-size:18px;'></text></div>";
                text += "</div>";
                text += "<div id='interface_edit_"+key+"' style='width:100%;min-height:50px;float:left;"+initial_visible+"'></div>";

                this.settings.settings_ext_append(count, "", text);
            }   }
    }

    // create dialogs to edit api settings */
    edit_info(data) {

        this.logging.debug(data);
        this.update_data();

        let interfaces  = data["DATA"]["interfaces"];
        let sheet_boxes = {};

        this.button_add_device = function(api, api_device, external_id) {

            if (!this.data["CONFIG"]["apis"]["list_detect"][api+"_"+api_device]) {
                this.logging.warn("No detected devices found for "+api+"_"+api_device+".");
                return "";
            }
            const devices_detect = this.data["CONFIG"]["apis"]["list_detect"][api+"_"+api_device];
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
                        button_cmd  = "rm3settings.create(\"edit_devices\", \"add_device\", "+JSON.stringify(data)+");";
                        html += "<button onclick='"+button_cmd+"'>"+lang("BUTTON_T_ADD")+"</button>";
                    }

                }
            }
            else {
                this.logging.info("Easy adding of detected devices is for "+api+"-APIs not implemented yet.")
            }
            return html;
        }
        this.list_connected_devices = function (api, device, data) {
            let text  = "";
            let count = 0;
            let devices_per_api = this.data["CONFIG"]["apis"]["structure"];
            let detected_devices = this.data["CONFIG"]["apis"]["list_detect"];
            let connected_vs_detected = {};
            let details = "<div style='width:100%;height:9px;'></div>";

            for (let api_device in devices_per_api[api]) {
                let connect  = dataAll["STATUS"]["interfaces"]["connect"][api + "_" + api_device];
                if (device === "" || api_device !== device) { continue; }
                if (device === "") { details += "<i>API Device: " + api_device + "</i>&nbsp;&nbsp;"; }
                else { details += "<i>"+lang("CONNECTED_RMC")+":</i><hr/>&nbsp;&nbsp;"; }

                details += this.tab.start("");
                for (let i=0;i<devices_per_api[api][api_device].length;i++) {
                    count += 1;
                    let connected_device = devices_per_api[api][api_device][i];
                    let device_settings = this.data["CONFIG"]["devices"][connected_device];
                    let method = this.data["CONFIG"]["devices"][connected_device]["interface"]["method"];
                    let power_status = dataAll["STATUS"]["devices"][connected_device]["power"];
                    let label = device_settings["settings"]["label"];
                    let visibility = device_settings["settings"]["visible"];
                    let hidden = "";
                    let idle = "<small id=\"device_auto_off_"+connected_device+"\"></small>";
                    let command_on = "appFW.requestAPI('GET',['set','"+connected_device+"','power','ON'], '', '', '' ); setTextById('CHANGE_STATUS_"+connected_device+"','ON');"; //rm3settings.on_off();remoteInit();";
                    let command_off = "appFW.requestAPI('GET',['set','"+connected_device+"','power','OFF'], '', '', '' );setTextById('CHANGE_STATUS_"+connected_device+"','OFF');"; //rm3settings.on_off();remoteInit();";
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
                        if (!detected_devices[api+"_"+api_device][device_id]) {
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
        this.list_api_device_settings = function (api_name, device, show_buttons=undefined) {

            let temp = "";
            let information = "<div id='api_status_data_"+api_name+"_"+device+"'></div>";
            let devices_per_interface = this.data["CONFIG"]["apis"]["structure"];
            let connected_devices = devices_per_interface[api_name][device].length;

            let api_dev = api_name.toLowerCase() + "_" + device.toLowerCase();
            let link_save = "apiSetConfig_InterfaceData( \""+api_name+"_"+device+"\", \"api_status_edit_"+api_name+"_"+device+"\" );" + "rm3json_edit.disable(\"api_status_edit_"+api_name+"_"+device+"\");";
            let link_reconnect = "apiReconnectInterface( \""+api_name+"_"+device+"\");"
            let link_edit = "rm3json_edit.disable(\"api_status_edit_"+api_name+"_"+device+"\",false);" +
                "this.className=\"rm-button hidden\";" +
                "document.getElementById(\"save_"+api_dev+"\").className=\"rm-button settings\";";
            let link_api_info = "window.open(\""+interfaces[api_name]["API-Info"]+"\")";
            let link_on_off = "apiApiDeviceOnOff_button(\""+api_name+"\", \""+device+"\", this);";

            let buttons = "";
            let buttons_plus = "";
            let buttons_admin = "";

            this.logging.log("module_interface_edit_list: " + api_name + "_" + device)
            let connect_status_api = dataAll["STATUS"]["interfaces"]["active"][api_name];
            let connect_status     = dataAll["STATUS"]["interfaces"]["connect"][api_name+"_"+device];

            if (!connect_status) { connect_status = "NO DEVICE connected yet."; }

            let on_off_status;
            if (connect_status_api === false || connected_devices === 0)  { on_off_status = "N/A"; }
            else if (connect_status.indexOf("OFF") > -1)                  { on_off_status = "OFF"; }
            else if (connect_status.indexOf("ERROR") > -1)                { on_off_status = "ERROR"; }
            else                                                          { on_off_status = "ON"; }

            buttons      += this.button.sized("onoff_"+api_dev,      on_off_status,    "settings",  link_on_off);
            buttons      += this.button.sized("reconnect_"+api_dev,  lang("RECONNECT"),"settings",  link_reconnect);
            buttons      += this.button.sized("edit_"+api_dev,       lang("EDIT"),     "settings",  link_edit)
            buttons      += this.button.sized("save_"+api_dev,       lang("SAVE"),     "hidden",    link_save);
            buttons      += this.button.sized("info_"+api_dev,       lang("API_INFO"), "settings",  link_api_info);

            if (this.data["CONFIG"]["apis"]["list_api_commands"][api_name+"_"+device] && dataAll["CONFIG"]["apis"]["list_api_commands"][api_name+"_"+device].length > 0) {
                if (show_buttons === undefined) { buttons_plus += "<hr style='width:100%;float:left;'/>"; }
                for (let i=0;i<this.data["CONFIG"]["apis"]["list_api_commands"][api_name+"_"+device].length > 0;i++) {
                    let command = this.data["CONFIG"]["apis"]["list_api_commands"][api_name+"_"+device][i];
                    let command_link = "apiSendToApi(\"" + api_name + "_" + device + "::" +command + "\");appMsg.info(\"Command send: " + api_name + "_" + device + "::" + command + "\");";
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
                if (interfaces[api_name]["API-Devices"][device]["PowerDevice"] && interfaces[api_name]["API-Devices"][device]["PowerDevice"] !== "") {
                    temp    += this.tab.row("Power: ", interfaces[api_name]["API-Devices"][device]["PowerDevice"] + "<text id='power_status_"+api_name+"_"+device+"'></text>");
                }
                temp    += this.tab.row("Devices:", connected_devices);
                temp    += this.tab.row("Status:", "<div id='api_status_"+api_name+"_"+device+"' class='api-status-info'></div>");
                temp    += this.tab.row("<div style='height:5px;width:100%'></div>");
                temp    += this.tab.row(information, false);
                temp    += this.tab.row("<div style='width:100%;text-align:center;'>" + buttons + "</div>", false);
                temp    += this.tab.end();
            } else if (buttons_plus !== "") {
                temp    += this.tab.start();
                if (buttons_plus !== "")  { temp += this.tab.row("Admin actions:", buttons_plus ); }
                if (buttons_admin !== "") { temp += this.tab.row("Admin tool:", buttons_admin ); }
                temp    += this.tab.end();
            }
            return temp;
        }
        this.create_device_configuration = function (api_name, device) {
            let temp = "";
            let select = "";
            let key2 = "";

            let config_create = ("device-configuration" in interfaces[api_name]["API-Config"]["commands"]);
            let detect_devices = (api_name + "_" + device in dataAll["CONFIG"]["apis"]["list_detect"]);
            let activate_copy_button = "document.getElementById('copy_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('copy_button_"+api_name+"_"+device+"').style.backgroundColor='';";
            let activate_create_button = "document.getElementById('create_button_"+api_name+"_"+device+"').disabled=false;document.getElementById('create_button_"+api_name+"_"+device+"').style.backgroundColor='';";

            if (detect_devices) {
                const detected = this.data["CONFIG"]["apis"]["list_detect"][api_name + "_" + device];
                let detected_select = {}
                Object.keys(detected).forEach(key => {
                    let api_string = api_name + "_" + device + "||";
                    detected_select[api_string + key] = detected[key]["description"];
                    if (!detected[key]["description"] || detected_select[api_string + key] === "") { detected_select[api_string + key] = key; }
                });
                select = this.basic.select("api_device-"+api_name+"_"+device, "detected device", detected_select, activate_create_button, "");
            }

            if (config_create) {
                this.button.width = "80px;";
                temp += lang("API_CREATE_CONFIG_INFO", [api_name]);
                temp += "<br/>&nbsp;";
                //temp += "<div id='api_device-"+interface+"_"+device+"'>light</div><br/>";
                temp += this.tab.start();
                temp += this.tab.row("Detected:","<div id='api_device-"+api_name+"_"+device+"_container'>"+select+"</div>");
                temp += this.tab.row("API Call:<br/>","<div id='api_command-"+api_name+"_"+device+"'>get=device-configuration</div><br/>");
                temp += this.tab.row("<div class='remote-edit-cmd' id='api_response'></div><br/>",false);
                temp += this.tab.end();
                temp += this.button.edit("apiSendToDeviceApi( getValueById('api_device-"+api_name+"_"+device+"'), getTextById('api_command-"+api_name+"_"+device+"'), true);"+activate_copy_button, lang("CREATE"), "disabled", "create_button_"+api_name+"_"+device) + "&nbsp;";
                temp += this.button.edit("copyTextById('JSON_copy',appMsg,'"+lang("COPIED_TO_CLIPBOARD")+"');"+activate_copy_button, lang("COPY"), "disabled", "copy_button_"+api_name+"_"+device);
            }
            return temp;
        }

        this.button.width = "72px";

        for (let key in interfaces) {
            let id = "interface_edit_"+key;
            let api_config = interfaces[key];
            let setting = "";
            setting += "<hr style='border:solid lightgray 1px;'/>";

            for (let dev in api_config["API-Devices"]) {
                let temp_edit_device_config = "<div id='api-setting-"+key+"_"+dev+"'></div>";
                let container_title = "</b>API-Device: "+dev+"&nbsp;&nbsp;<text id='api_status_icon_"+key+"_"+dev+"' style='font-size:16px;'></text>";
                setting += this.basic.container("details_"+key+"_"+dev, container_title, temp_edit_device_config, false);
            }
            setTextById(id, setting + "<br/>");

            // create sheet boxes for all devices of this interface
            for (let dev in api_config["API-Devices"]) {
                let buttons = this.list_api_device_settings(key, dev, true);
                let config_create = this.create_device_configuration(key, dev);

                sheet_boxes[key+"_"+dev] = new RemoteElementSheetBox("api-setting-"+key+"_"+dev, "410px", true, false, false);
                sheet_boxes[key+"_"+dev].addSheet(lang("API_DEFINITION"), this.list_api_device_settings(key, dev, false));
                if (buttons !== "")         { sheet_boxes[key+"_"+dev].addSheet(lang("API_ADMIN"), buttons); }
                if (config_create !== "")   { sheet_boxes[key+"_"+dev].addSheet(lang("API_CREATE_CONFIG"), config_create); }
                sheet_boxes[key+"_"+dev].addSheet(lang("CONNECTED"), this.list_connected_devices(key, dev, data)[1]);
            }

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
        if (dataAll["STATUS"] && dataAll["STATUS"]["request_time"]) {
            for (let key in dataAll["STATUS"]["request_time"]) {
                text += key + ": " + use_color((Math.round(dataAll["STATUS"]["request_time"][key] * 1000) / 1000) + "s<br/>", "VALUE");
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
        let list = {};
        for (let key in this.data["CONFIG"]["devices"]){
            list[key] = this.data["CONFIG"]["devices"][key]["settings"]["label"];
        }
        return this.elements.select(id,"device",list,onchange);
    }

    // show api infos for selected device plus all existing status values
    device_list_status(id_filter, id_list_container) {
        let status = "<br/>";
        let filter_list = document.getElementById(id_filter);
        let filter = filter_list.options[filter_list.selectedIndex].value;
        let device_status = dataAll["STATUS"]["devices"][filter];
        let device_values = this.data["CONFIG"]["devices"][filter]["commands"]["get"];
        let dont_use = ["api", "api-last-query", "api-last-query-tc", "api-last-send", "api-last-send-tc", "api-status","presets"];
        let color = "VALUE";
        if (device_status["api-status"].indexOf("ERROR") > -1)          { color = "ERROR"; }
        else if (device_status["api-status"].indexOf("Connected") > -1) { color = "ON"; }
        else if (device_status["api-status"].indexOf("DISABLED") > -1)  { color = "OFF"; }

        status += this.tab.start();
        status += this.tab.line();
        status += this.tab.row("API:",             use_color(device_status["api"], "VALUE"));
        status += this.tab.row("",                 use_color(device_status["api-status"],color));
        status += this.tab.row("Last&nbsp;send:",  use_color(device_status["api-last-send"]),"VALUE");
        status += this.tab.row("Last&nbsp;query:", use_color(device_status["api-last-query"],"VALUE"));
        status += this.tab.line();

        for (let key in device_status) {
            if (key === "power") {
                let command_on = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','ON'], '', '', '' );remoteInit();";
                let command_off = "appFW.requestAPI('GET',['set','"+filter+"','"+key+"','OFF'], '', '', '' );remoteInit();";
                let status_value = device_status[key];
                let command_link;

                if (status_value === "ON"){
                    command_link = "<div onclick=\""+command_off+"\" style=\"cursor:pointer\"><u>" + use_color("ON", "ON") + "</u></div>";
                }
                else if (status_value === "OFF")	{
                    command_link = "<div onclick=\""+command_on +"\" style=\"cursor:pointer\"><u>" + use_color("OFF", "OFF") + "</u></div>";
                }
                else {
                    command_link = use_color(status_value, "VALUE");
                }
                status += this.tab.row(key + ":", command_link);
            }
            else if (dont_use.indexOf(key) === -1 && (!device_values || device_values.indexOf(key) > -1)) {
                status += this.tab.row(key + ": ", use_color(device_status[key], "VALUE"));
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
class RemoteSettingsGeneral {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;

        this.data = this.settings.data;
        this.tab = this.settings.tab;
        this.button = this.settings.button;
        this.toggle = this.settings.toggle;

        this.load = this.load.bind(this);
    }

    // create container for general settings
    create() {

        return "<center>&nbsp;<br/><div id='module_general_settings'></div></center>";
    }

    // load data for general settings
    load() {
        // Edit Server Settings
        let q1 = lang("RESET_SWITCH_OFF");
        let q2 = lang("RESET_VOLUME_TO_ZERO");

        this.button.height = "30px";
        this.button.width  = "120px";
        this.update_data();

        // Reload & Updates
        let set_temp= "<br/><i>"+this.edit_modes(true, true, true, true, true)+"</i>";
        let settings_index = set_temp;

        set_temp  = this.tab.start();
        set_temp += this.tab.row("<i>Server:</i>",
            this.button.sized("set01","reload (scroll)","settings","appForceReload(true);") + "&nbsp;" +
            this.button.sized("set02","check updates","settings","appFW.requestAPI(\"GET\",[\"version\",\"" + appVersion +"\"], \"\", appMsg.alertReturn, \"wait\");")
        );
        set_temp += this.tab.row("<i>Devices</i>",
            this.button.sized("set21","Dev ON/OFF", "settings","appMsg.confirm(#" + q1 + "#, #appFW.requestAPI(##GET##,[##reset##],####,apiAlertReturn );#);") + "&nbsp;" +
            this.button.sized("set22","Audio Level","settings", "appMsg.confirm(#" + q2 + "#, #appFW.requestAPI(##GET##,[##reset-audio##],####,apiAlertReturn );# );")
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
                if (onclick)  { onclick_img = this.app_name+".set_favicon(\""+url+"\",\""+icon_type+"\");"; onclick_style = "cursor:pointer;"; }
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

        for (let icon in this.data["CONFIG"]["icons"]) {
            let currentUrl = "remote-v3/icon/"+this.data["CONFIG"]["icons"][icon];
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
        myBox.addSheet("Icons",  "&nbsp;" + settings_icon);
        myBox.addSheet("Server", "&nbsp;" + settings_reload);
        myBox.addSheet("API",    "&nbsp;" + settings_api);
    }

    // edit different modes: edit mode, easy edit mode, show hints, intelligent mode, show button modes
    edit_modes(edit=true, intelligent=false, button_code=false, easy_edit=false, remote_hints=false) {

        this.create_toggle = function(id, label, command_on, command_off, init=0){

            if (init === true)       { init = 1; }
            else if (init === false) { init = 0; }

            command_on  += "remoteSetCookie();"
            command_off += "remoteSetCookie();"

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
            html += this.create_toggle("mode_edit", lang("MODE_EDIT"), "remoteToggleEditMode(true);", "remoteToggleEditMode(false);", rm3remotes.edit_mode);
        }
        if (easy_edit) {
            html += this.create_toggle("mode_easy", lang("MODE_EASY_EDIT"), "remoteToggleEasyEdit(true);", "remoteToggleEasyEdit(false);", easyEdit);
        }
        if (remote_hints) {
            html += this.create_toggle("mode_hint", lang("MODE_HINT"), "remoteToggleRemoteHints(true);", "remoteToggleRemoteHints(false);", remoteHints);
        }
        if (intelligent) {
            html += this.create_toggle("mode_intelligent", lang("MODE_INTELLIGENT"), this.app_name+".button_manual_mode(true);", this.app_name+".button_manual_mode(false);", this.manual_mode);
        }
        if (button_code) {
            html += this.create_toggle("mode_button_show", lang("MODE_SHOW_BUTTON"), this.app_name+".button_show(true);", this.app_name+this.app_name+".button_show(false);", showButton);
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

    // show button code in header if pressed button
    button_show(show="") {
        if (show === "") {
            showButton = !showButton;
        } else {
            showButton = show;
        }
    }

    // toggles between manual mode and intelligent mode for buttons (default is intelligent)
    button_manual_mode(menu_entry=false) {
        if (deactivateButton) 	{
            deactivateButton = false;
            this.manual_mode = false;
        } else {
            deactivateButton = true;
            this.manual_mode = true;
        }
    }

    // get updated config data from parent class
    update_data() {
        this.data = this.settings.data;
    }

}


/* module to show different app and server settings */
class RemoteSettingsInfo {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;

        this.data = this.settings.data;
        this.basic = this.settings.basic;
        this.tab = this.settings.tab;
        this.logging = new jcLogging(this.app_name);

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

        let cookie = appCookie.get("remote");
        if (typeof(cookie) === "string" && cookie.indexOf("::") >= 0) {
            cookie = cookie.split("::");
            cookie = cookie[0] + "=<b>" + cookie[1] + "</b>, label=<b>" + cookie[2] + "</b>, edit_mode=<b>" + cookie[3] + "</b>, easyEdit=<b>" + cookie[4] + "</b>, remoteHints=<b>" + cookie[5] + "</b>";
        } else {
            cookie = "N/A";
        }
        let main_audio = this.data["CONFIG"]["main-audio"];  // get main audio device from file
        let main_device_config = this.data["CONFIG"]["devices"][main_audio];
        let main_device = dataAll["STATUS"]["devices"][main_audio];
        let system_health = dataAll["STATUS"]["system_health"];
        let audio_max = 100;
        let audio1, audio2;

        if (main_device && main_device_config) {
            if (main_device_config["commands"]["definition"]
                && main_device_config["commands"]["definition"]["vol"]
                && main_device_config["commands"]["definition"]["vol"]["values"]
                && main_device_config["commands"]["definition"]["vol"]["values"]["max"]
            ) {
                audio_max  = main_device_config["commands"]["definition"]["vol"]["values"]["max"];
            }
            else {
                audio_max  = 100;
                this.logging.error("Max values not defined, set 100!");
            }
            audio1 = "Power: "  + main_device["power"] + " / " + "Volume: " + main_device["vol"] + " (" + audio_max + ")";
            audio2 = main_device_config["settings"]["label"] + " (" + main_audio + ")";
        }

        // version information
        let set_temp  = this.tab.start();
        set_temp += this.tab.row( "Client:",	 appVersion + " / " + this.settings.test_info + " (" + rollout + ")" );
        set_temp += this.tab.row( "Server:",	 this.data["API"]["version"] + " / " + this.data["API"]["rollout"] );
        set_temp += this.tab.row( "Modules:",
            "jcMsg "        + appMsg.appVersion +
            " / jcApp "     + appFW.appVersion +
            " / jcAppFW "   + appFwVersion +
            " / jcCookies " + appCookie.appVersion +
            " / jcFunction "+ jc_functions_version +
            " / jcSlider "  + rm3slider.appVersion );
        set_temp += this.tab.row( "Sources:",  "<a href='https://github.com/jc-prg/remote/tree/"+git_branch+"/' target='_blank'>https://github.com/jc-prg/remote/tree/"+git_branch+"/</a>");
        set_temp += this.tab.row( "REST API:", "<a href='"+ RESTurl + "api/list/' target='_blank'>" + RESTurl + "api/list/</a>");
        set_temp += this.tab.end();
        let setting_info = set_temp;

        // server health
        let modules = [];
        for (const [key, value] of Object.entries(system_health)) {
            if (value === "registered")      { modules.push(key); }
        }
        setTimeout(() => { statusCheck_health(this.data); }, 500 );

        set_temp  = this.tab.start();
        set_temp += this.tab.row( 	"Threads:&nbsp;", "<div id='system_health'></div>" );
        set_temp += this.tab.row( 	"APIs:&nbsp;", modules.join(", ") );
        set_temp += this.tab.end();
        let setting_health = set_temp;

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

        const myBox = new RemoteElementSheetBox("module_system_info", height="220px", scroll=true);
        myBox.addSheet("Info",   "&nbsp;" + setting_info);
        myBox.addSheet("Health", "&nbsp;" + setting_health);
        myBox.addSheet("Screen", "&nbsp;" + setting_display);
        myBox.addSheet("Other",  "&nbsp;" + setting_other);
    }

    // create view with buttons and its explanations
    buttons() {

        this.update_data();
        let setting = "";
        let main_audio = this.data["CONFIG"]["main-audio"];  // get main audio device from file

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
        set_temp += this.tab.row( "<center>" + buttons + "</center>" );
        set_temp += this.tab.end();
        setting  += this.basic.container("setting_color_codes","Button color codes",set_temp,false);

        // button images
        set_temp = "";
        let images = this.data["CONFIG"]["elements"]["button_images"];
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
        let colors    = this.data["CONFIG"]["elements"]["button_colors"];
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
class RemoteSettingsMacro {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;
        this.button = this.settings.button;
    }

    // create container for macro settings
    create() {
        this.button.width = "100px";
        let setting   = "";
        setting  += "<br/><center><div id='macros-edit-json'></div></center>";
        setting  += "<center><div style='width:100%;align:center;'><br/>";
        setting  += this.button.sized("add_scene",lang("BUTTON_T_SAVE"),"settings","apiMacroChange([#groups#,#macro#,#dev-on#,#dev-off#]);","");
        setting  += "<br/></div></center>";
        return setting;
    }

    // load data for macro settings
    load() {
        const myBox2 = new RemoteElementSheetBox("macros-edit-json", "400px", true);
        myBox2.addSheet("Info",         lang("MANUAL_MACROS"));
        myBox2.addSheet("Groups",       "<h4>Edit JSON for device groups:</h4>" +     "<div id='json-edit-groups'></div>");
        myBox2.addSheet("Macros",       "<h4>Edit JSON for global macros:</h4>" +     "<div id='json-edit-macro'></div>");
        myBox2.addSheet("Device ON",    "<h4>Edit JSON for device ON macros:</h4>" +  "<div id='json-edit-dev-on'></div>");
        myBox2.addSheet("Device OFF",   "<h4>Edit JSON for device OFF macros:</h4>" + "<div id='json-edit-dev-off'></div>");

        const jsonEdit = new RemoteJsonEditing("edit-macros", "compact", "width:100%;height:270px;");
        jsonEdit.create("json-edit-groups", "groups",  this.settings.data["CONFIG"]["macros"]["groups"]);
        jsonEdit.create("json-edit-macro",  "macro",   this.settings.data["CONFIG"]["macros"]["global"]);
        jsonEdit.create("json-edit-dev-on", "dev-on",  this.settings.data["CONFIG"]["macros"]["device-on"]);
        jsonEdit.create("json-edit-dev-off","dev-off", this.settings.data["CONFIG"]["macros"]["device-off"]);
    }

}


/* module to edit the timer settings */
class RemoteSettingsTimer {
    constructor(name, parent) {
        this.app_name = name;
        this.settings = parent;
        this.logging = new jcLogging(this.app_name+".logging");

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

        if (value.indexOf("macro_") > -1)   {
            value = value.split("_")[1];
            data = Object.keys(dataAll["CONFIG"]["macros"][value]);
        }
        else {
            data = dataAll["CONFIG"]["devices"][value]["buttons"];
        }
        this.settings.basic.input_width = "125px;";
        let onchange = "document.getElementById('add_button_"+key+"').removeAttribute('disabled');";
        let select = this.settings.basic.select_array("add_button_command2_"+key, " ("+value+") ...", data, onchange);
        setTextById(target, select);
    }

    info (data) {

        let html = "";
        let tab = this.settings.tab;
        let input = this.settings.input;
        let basic = this.settings.basic;
        this.settings.button.width = "70px;"

        this.dialog = function (key, entry) {

            let data_fields = "timer_name_"+key+",timer_description_"+key+",timer_regular_"+key+",timer_once_"+key+",timer_commands_"+key;
            let link_save   = "val=document.getElementById(\"timer_name_"+key+"\").value; if(val!=\"\") { apiTimerEdit(\""+key+"\",\""+data_fields+"\"); } else { appMsg.alert(\"Add a title!\"); }";
            let link_reset  = "rm3settings.module_timer();";
            let link_delete = "appMsg.confirm(#Delete timer?#, #apiTimerDelete(##"+key+"##);#, 140);";
            let link_try    = "appMsg.confirm(#Try out timer?#, #apiTimerTry(##"+key+"##);#, 140);";

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
            entry_html += tab.row("&nbsp;");
            entry_html += tab.row("<textarea id='timer_once_"+key+"'    style='width:95%;height:80px;display:none;'>" + JSON.stringify(entry["timer_once"]) + "</textarea>");
            entry_html += tab.row("Commands:");
            entry_html += tab.row("<input id='timer_commands_"+key+"'   style='width:95%' value='" + JSON.stringify(entry["commands"]) + "'>");
            entry_html += tab.row("&nbsp;");

            this.settings.basic.input_width = "125px;";
            let onchange = "rm3settings.module_timer_select('"+key+"', 'add_button_command_"+key+"','add_button_device_"+key+"');";
            let onclick = "let command = getValueById(\"add_button_device_"+key+"\") + \"_\" + getValueById(\"add_button_command2_"+key+"\");";
            onclick += "let value = JSON.parse(getValueById(\"timer_commands_"+key+"\")); value.push(command); ";
            onclick += "setValueById(\"timer_commands_"+key+"\", JSON.stringify(value));";

            let device_macro = {};
            for (let key2 in dataAll["CONFIG"]["devices"]) { device_macro[key2] = "Device: " + dataAll["CONFIG"]["devices"][key2]["settings"]["label"]; }
            for (let key2 in dataAll["CONFIG"]["macros"])  { if (key2 !== "description") { device_macro["macro_"+key2] = "Macro: " + key2; } }

            entry_html += tab.row("Add Command:");
            entry_html += tab.row(
                "<div style='float:left;'>" + this.settings.basic.select("add_button_device_"+key,"...", device_macro, onchange) + "&nbsp; </div>" +
                "<div style='float:left;' id='add_button_command_"+key+"'><select style='width:"+this.settings.basic.input_width+";margin:1px;' disabled><option>...</option></select></div>" +
                "<div style='float:left;'>&nbsp;<button id='add_button_"+key+"'style='height:25px;margin:1px;' onclick='"+onclick+"' disabled>&nbsp;add&nbsp;</button>"
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
        html += "<center>&nbsp;<hr style='border:1px solid;height:1px;margin: 10px 5px 5px;padding:0;'/><small><i>Server time: <text id='current_server_time'></text></i></small></center>";
        setTextById('module_timer_info', html);
    }

    element (type, key, data) {

        this.input = function (input_type, timer_type, key, value) {
            let options;
            let onchange = this.app_name+".change(\"" + timer_type + "\", \""+key+"\");";
            let html = "<select id='timer_select_" + input_type + "_" + key +"' style='width:40px;' onchange='"+onchange+"' class='timer_select'>";

            if (input_type === "month")             { options = {"**": -1}; for (let i=1;i<=12;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "day_of_month") { options = {"**": -1}; for (let i=1;i<=31;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "hour")         { options = {"**": -1}; for (let i=0;i<24;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "minute")       { options = {"**": -1}; for (let i=0;i<60;i++) { options[i.toString().padStart(2, '0')] = i.toString().padStart(2, '0'); } }
            else if (input_type === "day_of_week")  { options = {"*": -1}; for (let i=0;i<=6;i++)  { options[i.toString().padStart(1, '0')] = i.toString().padStart(1, '0'); } }
            else                                    { options = {}; console.error("input type unknown: " + input_type); }

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
            let onchange = this.app_name+".change(\"" + type + "\", \""+key+"\");";
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


/* class to create simple select and input element for setting dialogs */
class RemoteSettingsElements {
    constructor(app_name, parent) {
        this.app_name = app_name;
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

