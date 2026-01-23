//--------------------------------
// jc://remote/
//--------------------------------


class RemoteApiControl extends RemoteDefaultClass {
    constructor(name) {
        super(name);

        this.execute = this.execute.bind(this);
        this.answer = this.answer.bind(this);
        this.answer_api_request = this.answer_api_request.bind(this);

        /*
         */

        this.log_level_status = "warning";
        this.temp_data = {};
        this.temp_callback = undefined;
        this.commands_unused = {
            "ApiDeviceSettingsEdit":{ command: "device_api_settings", method: "POST", confirm: false, param: 3, prepare: true, answer: this.answer },
            "ButtonAdd":            { command: "button", method: "PUT", confirm: false, param: 2, prepare: true, answer: this.answer },
            "ButtonDelete":         { command: "button", method: "DELETE", confirm: true, message: "BUTTON_ASK_DELETE_NUMBER", param: 2, prepare: true, answer: this.answer },
            "GroupSend":            { command: "macro", method: "GET", confirm: false, param: 3, prepare: true, answer: this.answer },
            "TemplateAdd":          { command: "template", method: "PUT", confirm: true, message: "TEMPLATE_OVERWRITE", param: 2, prepare: true, answer: this.answer },
        }
        this.commands = {
            "ApiDeviceAdd":         { command: "edit_api_device", method: "PUT", confirm: false, param: 1, param_info: "[api_name]", prepare: true, answer: this.answer },
            "ApiDeviceDelete":      { command: "edit_api_device", method: "DELETE", confirm: true, param: 2, param_info: "[api_name, api_device]", message: "API_DEVICE_DELETE", prepare: true, answer: this.answer },
            "ApiDeviceOnOff":       { command: "api_device", method: "PUT", confirm: false, param: 3, param_info: "[interface, api_device, value]" },
            "ChangeVisibility":     { command: "visibility", method: "PUT", confirm: false, param: 3, param_info: "[rm_type, rm_id, value_id]", prepare: true, answer: this.answer },
            "CommandDelete":        { command: "command", method: "DELETE", confirm: true, message: "BUTTON_ASK_DELETE", param: 2, param_info: "[device_id, button_id]", prepare: true, answer: this.answer },
            "CommandRecord":        { command: "command", method: "POST", confirm: true, message: "BUTTON_RECORD", param: 3, param_info: "[device_id, button_id, read_from_input]", prepare: true, answer: this.answer },
            "CommandSend":          { command: "send", method: "GET", confirm: false, param: 3, param_info: "[cmdButton, sync, device]", prepare: true },
            "CommandSendWait":      { command: "send", method: "GET", confirm: false, param: 3, param_info: "[cmdButton, sync, device]", prepare: true, wait: true },
            "CommandSendCheck":     { command: "send_check", method: "GET", confirm: false, param: 3, param_info: "[cmdButton, sync, device]", prepare: true },
            "CommandSendCheckWait": { command: "send_check", method: "GET", confirm: false, param:  3, param_info: "[cmdButton, sync, device]", prepare: true, wait: true },
            "ConfigInterface":      { command: ["config", "interface"], method: "POST", confirm: false, param: 1, param_info: "[device, config]", prepare: true, answer: this.answer },
            "ConfigInterfaceShow":  { command: ["config", "interface"], method: "GET", confirm: false, param: 0, prepare: true },
            "ConfigDropDown":       { command: ["config", "device"], method: "GET", confirm: false, param: 1, param_info: "[device]", prepare: true },
            "DeviceAdd":            { command: "device", method: "PUT", confirm: false, param: 2, param_info: "[data, onchange]", prepare: true, answer: this.answer },
            "DeviceChangeConfigs":  { command: "device-api-settings", method: "POST", confirm: false, param: 1, param_info: "[remote_id]", prepare: true, answer: this.answer },
            "DeviceDelete":         { command: "device", method: "DELETE", confirm: true, message: "DEVICE_ASK_DELETE", param: 1, param_info: "[device_id]", prepare: true, answer: this.answer },
            "DeviceEdit":           { command: "device", method: "POST", confirm: false, param: 3, param_info: "[device_id, prefix, fields]", prepare: true, answer: this.answer },
            "DeviceJsonEdit":       { command: "device", method: "POST", confirm: false, param: 4, param_info: "[device_id, json_buttons, json_display, display_size]", prepare: true, answer: this.answer },
            "DiscoverDevices":      { command: "discovery", method: "POST", confirm: true, message: "API_DEVICE_DISCOVERY", param: 0, prepare: false, answer: this.answer },
            "InterfaceOnOff":       { command: "interface", method: "PUT", confirm: false, param: 2, param_info: "[interface, value]", prepare: false },
            "LoggingLoad":          { command: "log_queue", method: "GET", confirm: false, param: 0, prepare: false },
            "MacroChange":          { command: "macro", method: "PUT", confirm: false, param: 4, param_info: "['groups','macro','dev-on','dev-off']", prepare: true, answer: this.answer },
            "MacroSend":            { command: "macro", method: "GET", confirm: false, param: 3, param_info: "[macro, device, content]", prepare: true, answer: this.answer },
            "MainVolume":           { command: "set", method: "GET", param: 1, param_info: "[volume]", prepare: true, answer: this.answer },
            "MoveToArchive":        { command: ["archiving", "move"], method: "PUT", confirm: true, message: "REMOTE_MOVE_TO_ARCHIVE", param: 2, param_info: "[remote_type, remote_id]", prepare: false, answer: this.answer },
            "ReconnectInterface":   { command: "reconnect", method: "POST", confirm: true, message: "API_RECONNECT_ALL", param: 1, param_info: "[interface_id]", prepare: false, answer: this.answer },
            "RecordingEdit":        { command: "edit-recording", method: "PUT", confirm: false, param: 0, data: true, prepare: false, answer: this.answer },
            "RemoteMove":           { command: "move", method: "POST", confirm: false, param: 4, param_info: "[id, dnd_list, from, to]", prepare: true, answer: this.answer },
            "Reset":                { command: "reset", method:"GET", confirm: true, message: "RESET_SWITCH_OFF", answer: this.answer },
            "ResetAudio":           { command: "reset-audio", method:"GET", confirm: true, message: "RESET_VOLUME_TO_ZERO", answer: this.answer },
            "RestoreFromArchive":   { command: ["archiving", "restore"], method: "PUT", confirm: true, message: "REMOTE_RESTORE_FROM_ARCHIVE", param: 2, param_info: "[remote_type, remote_id]", prepare: false, answer: this.answer },
            "SceneAdd":             { command: "scene", method: "PUT", confirm: false, param: 3, param_info: "[add_scene_id,add_scene_label,add_scene_description]", prepare: true, answer: this.answer },
            "SceneDelete":          { command: "scene", method: "DELETE", confirm: true, message: "SCENE_ASK_DELETE", param: 1, param_info: "[scene_id]", prepare: true, answer: this.answer },
            "SceneEdit":            { command: "scene", method: "POST", confirm: false, param: 3, param_info: "[scene_id, prefix, fields]", prepare: true, answer: this.answer },
            "SceneJsonEdit":        { command: "scene", method: "POST", confirm: false, param: 2, param_info: "[scene_id, field_names]", prepare: true, answer: this.answer },
            "SendToApi":            { command: "send-api-command", method: "POST", confirm: false, param: 1, param_info: "[api_command]", prepare: false, answer: this.answer_api_request },
            "SendToDeviceApi":      { command: "send-api", method: "POST", confirm: false, param: 2, param_info: "[device, external_id]", prepare: true, answer: this.answer_api_request },
            "SendToDeviceApi-ext":  { command: "send-api-external", method: "POST", confirm: false, param: 2, param_info: "[device, external_id]", prepare: true, answer: this.answer_api_request },
            "SetMainAudio":         { command: "main-audio", method: "POST", confirm: false, param: 1, param_info: "[volume]", answer: this.answer },
            "ShutdownRestart":      { command: "shutdown", method: "GET", confirm: true, message: "RESTART", param: 0, prepare: false, answer: this.answer },
            "TimerDelete":          { command: "timer-edit", method: "DELETE", confirm: true, message: "TIMER_DELETE", param: 1, param_info: "[timer_id]", prepare: false, answer: this.answer },
            "TimerEdit":            { command: "timer-edit", method: "PUT", confirm: false, prepare: true, param: 2, param_info: "[key, data_fields]", answer: this.answer },
            "TimerTry":             { command: "timer-try", method: "PUT", confirm: true, message: "TIMER_TRY", param: 1, param_info: "[timer_id]", prepare: false, answer: this.answer },
        }
    }

    /* coordinate api call */
    call(cmd, param=[], data=undefined, callback=undefined) {
        if (typeof param === "string") { param = [param]; }
        this.status("call: " + cmd + " | " + JSON.stringify(param));

        if (!this.commands[cmd]) {
            this.logging.error("call: command not defined: " + cmd);
            return;
        } else if (this.commands[cmd].param !== param.length) {
            this.logging.error("call: got other amount of parameters than required: " + this.commands[cmd].param + " param required, got " + param);
            return;
        } else if (this.commands[cmd].data === true && (data === undefined || data === "")) {
            this.logging.error("call: 'data' are required but not delivered as parameter.");
            return;
        }

        let command = this.commands[cmd];

        if (data)                        { this.temp_data[cmd] = data; }
        if (callback && callback !== "") { this.temp_callback = callback; } else { this.temp_callback = undefined; }

        //console.warn("callback", this.temp_callback);
        //console.warn("data", data);

        if (command.prepare)        { this.prepare(cmd, param); }
        else if (command.confirm)   { this.confirm(cmd, param); }
        else                        { this.execute(cmd, param); }
    }

    /* prepare data before executing */
    prepare(cmd, param=[]) {
        this.status("prepare: " + cmd + " | " + JSON.stringify(param));

        let command = this.commands[cmd];
        let data = "";
        if (this.temp_data[cmd]) { data = this.temp_data[cmd]; }

        if (cmd === "ApiDeviceAdd") {
            this.temp_data[cmd] = {
                "ip": getValueById("add_api_ip_"+param[0]),
                "description": getValueById("add_api_description_"+param[0]),
                "api": param[0]
            };
        }
        else if (cmd === "ApiDeviceDelete") {
            param = [param[0] + "_" + param[1]];
        }
        else if (cmd === "ButtonAdd") {
            let i = 0;
            let device, button;

            if (document.getElementById(param[0])) {
                device = document.getElementById(param[0]).value.toLowerCase();
            } else {
                device= param[0];
                i++;
            }

            if (document.getElementById(param[1])) 	{
                button = document.getElementById(param[1]).value;
                if (button !== "LINE")	{ button = button.toLowerCase(); }
                if (button === ".")		{ button = "DOT"; }
            } else {
                button = param[1]; i++;
            }

            cmd = "appFW.requestAPI('PUT',['button','"+device+"','"+button+"'], '', appMsg.alertReturn );";

            if (device === "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
            if (button === "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
            if (i === 2)       { appMsg.confirm(lang("BUTTON_RECORD",[button,device]),cmd); return; }

            param = [device, button];
        }
        else if (cmd === "ButtonDelete") {
            let device;
            const device1 = document.getElementById(param[0]);
            const button1 = document.getElementById(param[1]);
            if (device1) {
                if (device1.selectedIndex) { device = device1.options[device1.selectedIndex].value; }
                else { device = device1.value; }
            }
            else {
                device = param[0];
            }

            let button = button1.options[button1.selectedIndex].value;
            if (device === "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
            if (button === "") { appMsg.alert(lang("BUTTON_SELECT")); return; }
            param = [device, button];
        }
        else if (cmd === "ChangeVisibility") {
            let device = check_if_element_or_value(param[1],true);
            let value  = getValueById(param[2], "", true);
            if (value === "yes") { setValueById(param[2], "no"); }
            else                 { setValueById(param[2], "yes"); }
            value                = getValueById(param[2], "", true);
            param = [param[0], device, value];
        }
        else if (cmd === "CommandRecord") {
            let device, button;
            let [device_id, button_id, read_from_input] = param;

            if (!this.status_ok("device", device_id, cmd, false, ["OFF"])) { return; }

            if (document.getElementById(device_id) && read_from_input) {
                device	= document.getElementById(device_id).value.toLowerCase();
            } else {
                device	= device_id;
            }
            if (document.getElementById(button_id) && read_from_input) {
                button	= document.getElementById(button_id).value;
                if (button !== "LINE")	{ button = button.toLowerCase(); }
                if (button === ".")		{ button = "DOT"; }
            } else {
                button    = button_id;
            }
            if (device === "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
            if (button === "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }

            param = [device, button];
        }
        else if (cmd === "CommandDelete") {
            let device, button;
            let device_id = param[0];
            let button_id = param[1];

            const device1 = document.getElementById(device_id);
            const button1 = document.getElementById(button_id);

            if (device1) {
                if (device1.selectedIndex) { device = device1.options[device1.selectedIndex].value; }
                else { device = device1.value; }
            }
            else { device = device_id; }
            button = button1.options[button1.selectedIndex].value;

            if (device === "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
            if (button === "") { appMsg.alert(lang("BUTTON_SELECT")); return; }

            param = button.split("_");
            param = param.push(device);
        }
        else if (cmd === "CommandSend" || cmd === "CommandSendWait" || cmd === "CommandSendCheck" || cmd === "CommandSendCheckWait") {

            let [cmdButton, sync, device] = param;
            let send_command = [];
            let types = ["macro", "scene-on", "scene-off", "dev-on", "dev-off"];

            // check if macro
            for (let i=0;i<types.length;i++) {
                if (cmdButton.startsWith(types[i]+"_")) { rmApi.call("MacroSend", [cmdButton, device,""]); return; }
            }

            // split into device and button
            if (Array.isArray(cmdButton)) {
                send_command = cmdButton;
            }
            else if (cmdButton.indexOf("group_") >= 0) {
                send_command = cmdButton.split("_");
                send_command = [send_command[0]+"_"+send_command[1], send_command[2]];
            }
            else {
                send_command = cmdButton.split("_");
            }

            // check, if manual mode (with out checking the device status) or intelligent mode (with checking the device status)
            if (!deactivateButton) { cmd = "CommandSendCheck"; }
            if (sync === "sync")   { cmd += "Wait"; }
            if (showButton)        { appMsg.info("<b>Request Button:</b> " + device + " / " + cmdButton); }

            param = [send_command[0] , send_command[1]];
        }
        else if (cmd === "ConfigInterface") {
            let config_data = {};
            try         { config_data = JSON.parse(getValueById( param[1] )); }
            catch(e)    { appMsg.alert("<b>JSON Config " + param[0] + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }

            param = [param[0]];
            this.temp_data[cmd] = config_data;
        }
        else if (cmd === "ConfigInterfaceShow") {
            param = ["all"];
        }
        else if (cmd === "ConfigDropDown") {
            param = [param[0]];
        }
        else if (cmd === "DeviceAdd") {
            const data = param[0];
            const onchange = param[1];

            if (onchange && (getValueById(data[5]) === "" || getValueById(data[6]) === "")) { onchange(); }

            let send_data = {};
            send_data["id"]            = getValueById(data[0]).replaceAll("_", "-");
            send_data["description"]   = getValueById(data[1]);
            send_data["label"]         = getValueById(data[2]);
            send_data["api"]           = getValueById(data[3]);
            send_data["device"]        = getValueById(data[4]);
            send_data["config_device"] = getValueById(data[5]);
            send_data["config_remote"] = getValueById(data[6]);
            send_data["id_ext"]        = getValueById(data[7]);
            send_data["image"]         = getValueById(data[8]);

            this.logging.debug("DeviceAdd ...",send_data);

            if (rmData.devices.exists(send_data["id"]))          { appMsg.alert(lang("DEVICE_EXISTS",[send_data["id"]])); return; }
            else if (send_data["id"] === "")                     { appMsg.alert(lang("DEVICE_INSERT_ID")); return; }
            else if (send_data["label"] === "")                  { appMsg.alert(lang("DEVICE_INSERT_LABEL")); return; }
            else if (send_data["api"] === "")                    { appMsg.alert(lang("DEVICE_SELECT_API")); return; }
            else if (send_data["device"] === "")                 { appMsg.alert(lang("DEVICE_INSERT_NAME")); return;	}

            param = [send_data["id"]];
            this.temp_data[cmd] = send_data;
        }
        else if (cmd === "DeviceDelete") {
            let device = check_if_element_or_value(param[0], true);
            if (device === "")  { appMsg.alert(lang("DEVICE_SELECT")); return; }
            param = [device];
        }
        else if (cmd === "DeviceChangeConfigs") {
            this.temp_data[cmd] = {
                "api_file": document.getElementById("edit_dev_api").value,
                "device_file": document.getElementById("edit_dev_config").value,
                "remote_file": document.getElementById("edit_dev_rm").value,
            }
        }
        else if (cmd === "DeviceEdit" || cmd === "SceneEdit" || cmd === "ApiDeviceSettingsEdit") {
            let info = {}
            let field_list = param[2].split(",");

            for (let i=0;i<field_list.length;i++) {
                if (document.getElementById(param[1]+"_"+field_list[i])) {
                    info[field_list[i]] = document.getElementById(param[1] + "_" + field_list[i]).value;
                }
            }
            param = [param[0]];
            this.temp_data[cmd] = info;
        }
        else if (cmd === "DeviceJsonEdit") {

            let info = {};
            let buttons = check_if_element_or_value(param[1],false);
            let display = check_if_element_or_value(param[2],false);
            let display_size = check_if_element_or_value(param[3],false);

            try { buttons = JSON.parse(buttons); } catch(e) { appMsg.alert("<b>JSON Buttons - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
            try { display = JSON.parse(display); } catch(e) { appMsg.alert("<b>JSON Display - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }

            info["remote"]  = buttons;
            info["display"] = display;
            info["display-size"] = display_size;

            param = [param[0]];
            this.temp_data[cmd] = info;
        }
        else if (cmd === "MacroChange") {
            let send_data = {};
            for (let i=0;i<param.length;i++) {
                let key = param[i];
                try         { send_data[key] = JSON.parse(getValueById(key)); }
                catch(e)    { appMsg.alert("<b>JSON Macro " + key + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
            }
            param = [];
            this.temp_data[cmd] = send_data;
        }
        else if (cmd === "MacroSend") {

            let macro = param[0];
            let macro_wait = "";
            let macro_string = "";

            if (macro === "") {
                appMsg.info(lang("MACRO_EMPTY", [param[1]]), "error");
                return;
            }

            if (!macro.includes("::") && macro.indexOf("::") < 0) {
                [macro_string, macro_wait] = rmData.macros.decompose(macro);
                macro = macro_string;
                eval(macro_wait);
            } else {
                let commands = macro.split("::");
                let commands_server = [];
                for (let i=0; i<commands.length; i++) {
                    if (commands[i].indexOf("MSG") < 0 && commands[i].indexOf("WAIT") < 0) {
                        commands_server.push(commands[i]);
                    } else {
                        let macro_time = commands[i].split("-")[1];
                        macro_wait = 'appMsg.wait_time("'+lang("MACRO_PLEASE_WAIT")+'", '+macro_time+');';
                        eval(macro_wait);
                    }
                }
                macro = commands_server.join("::");
            }
            device_media_info[param[1]] = param[2];
            if (showButton) { appMsg.info("<b>Request Macro:</b> " + macro); }
            param = [param[0]];
        }
        else if (cmd === "MainVolume") {
            if (!this.status_ok("device", rmStatusAudio.audio_device, cmd)) { return; }
            param = [rmStatusAudio.audio_device,"send-vol",param[0]];
        }
        else if (cmd === "GroupSend") {
            device_media_info[param[1]] = param[2];
            if (showButton) { appMsg.info("<b>Request Group:</b> marco:" + param[0]); }
            param = [param[0]];
        }
        else if (cmd === "RemoteMove") {
            let [id, dnd_list, from, to] = param;
            if (dnd_list.indexOf("scene") > -1 && id !== "")         { param = ["scene", id, (to - from)]; }
            else if (dnd_list.indexOf("device") > -1 && id !== "")   { param = ["device", id, (to - from)]; }
            else { appMsg.info("MOVE "+from+" >> "+to +"<br/>not implemented", "error"); return; }
        }
        else if (cmd === "RemoteMoveUpdate") {}
        else if (cmd === "SceneAdd") {
            let send_data = {};
            send_data["id"]             = getValueById(param[0]).replaceAll("_","-");
            send_data["label"]          = getValueById(param[1]);
            send_data["description"]    = getValueById(param[2]);

            if (rmData.scenes.exists(send_data["id"]))   { appMsg.alert(lang("SCENE_EXISTS",[send_data["id"]])); return; }
            else if (send_data["id"] === "")             { appMsg.alert(lang("SCENE_INSERT_ID")); return; }
            else if (send_data["label"] === "")          { appMsg.alert(lang("SCENE_INSERT_LABEL")); return; }

            this.temp_data[cmd] = send_data;
            param = [send_data["id"]];
        }
        else if (cmd === "SceneDelete") {
            const scene = check_if_element_or_value(param[0], true);
            if (scene === "") { appMsg.alert(lang("SCENE_SELECT")); return; }
            if (!rmData.scenes.exists(scene)) {
                appMsg.alert("Scene '" + scene + "' doesn't exist.");
                return;
            }
            param = [scene];
        }
        else if (cmd === "SceneJsonEdit") {
            let fields = param[1].split(",");
            let values = {};
            let json   = {};

            for (let i=0;i<fields.length;i++) {
                let field = fields[i];
                let key   = field.split("::")[1];
                let lower_case = false;

                if (field === "devices") { lower_case = true; }
                values[key] = check_if_element_or_value(field, lower_case);

                if (key !== "display-size") {
                    try         { json[key] = JSON.parse(values[key]); }
                    catch(e)    { appMsg.alert("<b>JSON " + field + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
                }
                else {
                    json[key] = values[key];
                }
            }
            param = [param[0]];
            this.temp_data[cmd] = json;

        }
        else if (cmd === "SendToDeviceApi") {
            if (param[1]) { cmd = "SendToDeviceApi-ext"; }
            param = [param[0]];
        }
        else if (cmd === "TemplateAdd") {
            let device   = check_if_element_or_value(param[0], false);
            let template = check_if_element_or_value(param[1], false);

            if (!dataAll["CONFIG"]["devices"][device])  { appMsg.alert(lang("DEVICE_DONT_EXISTS"));     return; }
            else if (device === "")                     { appMsg.alert(lang("DEVICE_INSERT_NAME"));     return; }
            else if (template === "")                   { appMsg.alert(lang("DEVICE_SELECT_TEMPLATE")); return; }
            param = [device, template];
        }
        else if (cmd === "TimerEdit") {
            let send_data = {};
            let send_fields = param[1].split(",");
            for (let i=0;i<send_fields.length;i++) {
                let field_name = send_fields[i].split("_")[1];
                if (getValueById(send_fields[i])) { send_data[field_name] = getValueById(send_fields[i]); }
                else                              { send_data[field_name] = getTextById(send_fields[i]); }
            }

            try { send_data["timer_regular"] = JSON.parse(send_data["regular"]); }  catch(e) { appMsg.alert("<b>Repeating timer - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
            try { send_data["timer_once"]    = JSON.parse(send_data["once"]); }     catch(e) { appMsg.alert("<b>One-time timer - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
            try { send_data["commands"]      = JSON.parse(send_data["commands"]); } catch(e) { appMsg.alert("<b>Commands - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }

            delete send_data["regular"];
            delete send_data["once"];

            param = [param[0]];
            this.temp_data[cmd] = send_data;
        }
        else {}

        if (command.confirm)   { this.confirm(cmd, param); }
        else                   { this.execute(cmd, param); }
    }

    /* display confirm message if command shall be executed */
    confirm(cmd, param=[]) {
        this.status("confirm: " + cmd + " | " + JSON.stringify(param));

        let command = this.commands[cmd];
        let parameters = JSON.stringify(param).replaceAll("\"", "#");

        appMsg.confirm(lang(command.message, param), `${this.name}.execute(#${cmd}#, ${parameters});`, 150);
    }

    /* send api request */
    execute(cmd, param=[]) {
        this.status("execute: " + cmd + " | " + JSON.stringify(param));

        let api_commands;
        let wait = "";
        let command = this.commands[cmd];

        if (typeof command.command === "string") { api_commands = [command.command]; }
        else { api_commands = command.command; }

        api_commands = api_commands.concat(param);
        if (command.wait) { wait = "wait"; }

        let data = "";
        if (this.temp_data[cmd]) { data = this.temp_data[cmd]; }

        if (this.temp_callback) { appFW.requestAPI(command.method, api_commands, data, this.temp_callback, wait); }
        if (command.answer)     { appFW.requestAPI(command.method, api_commands, data, command.answer, wait); }
        else                    { appFW.requestAPI(command.method, api_commands, data, "", wait); }

        delete this.temp_data[cmd];
        this.temp_callback = undefined;
    }

    /* process answer, e.g., reload something and display return messages depending on status */
    answer(data) {
        if (!data["REQUEST"]) {
            appMsg.alert("Request returned an invalid answer!");
            this.logging.error("Request returned an invalid answer: " + JSON.stringify(data));
            return;
        }

        let cmd = data["REQUEST"]["Command"];
        let msg = data["REQUEST"]["Return"];

        const erase_settings = ["SceneDelete", "DeviceDelete"];
        const create_remote_device = ["DeviceAdd"];
        const create_remote_scene = ["SceneAdd"];
        const load_main_menu = ["SceneDelete", "DeviceDelete"];
        const reload_drop_down = ["ChangeVisibility", "MainVolume", "RemoteMove"];
        const reload_app = [
            "ApiDeviceSettingsEdit",
            "CommandRecord", "SetMainAudio",
            "DeviceAdd", "DeviceEdit", "DeviceJsonEdit",
            "SceneAdd", "SceneEdit", "SceneJsonEdit",
            "TemplateAdd"
        ];
        const dont_show_info = ["Macro", "MacroSend", "CommandSend", "Set", "SceneAdd"];

        this.status("answer: " + cmd + " | " + msg + " | " + JSON.stringify(data["REQUEST"]));

        setTimeout(() => {
            if (erase_settings.includes(cmd)) { rmRemote.active_name = ""; rmCookies.erase(); rmMain.set_main_var("edit_mode", "false"); }
            if (create_remote_device.includes(cmd))   { rmCookies.set_remote( "device", data["REQUEST"]["Device"], "" ); rmSettings.active = false; }
            if (create_remote_scene.includes(cmd))    { rmCookies.set_remote( "scene",  data["REQUEST"]["Scene"], "" ); rmSettings.active = false; }

            // rmMain.load_remote();
        }, 500);

        setTimeout(() => {
            if (cmd === "RestoreFromArchive" || cmd === "MoveToArchive") {
                rmSettings.create("edit_"+data["REQUEST"]["Type"]+"s");
            }
            else if (cmd === "ApiDeviceAdd" || cmd === "ApiDeviceDelete") {
                rmSettings.create("edit_interfaces");
            }
            else if (cmd === "SetMainAudio") {
                // add a device remote reload
            }
            else if (cmd === "MacroSend") {
                console.log("Send macro return :", data);
                if (data["REQUEST"]["macro_error"] && data["REQUEST"]["macro_error"] !== "") {
                    appMsg.info("<b>Macro Error:</b> " + data["REQUEST"]["macro_error"], "error");
                }
                if (showButton) {
                    appMsg.info("<b>Macro Queue:</b> " + data["REQUEST"]["decoded_macro"]);
                }
            }
            else if (cmd === "GroupSend") {
                console.log("Send group return :", data);
                if (data["REQUEST"]["macro_error"] && data["REQUEST"]["macro_error"] !== "") {
                    appMsg.info("<b>Macro Error:</b> " + data["REQUEST"]["macro_error"], "error");
                }
                if (showButton) {
                    appMsg.info("<b>Macro Queue:</b> " + data["REQUEST"]["decoded_macro"]);
                }
            }

            if (load_main_menu.includes(cmd))         { rmMain.load_main(); }
            if (reload_drop_down.includes(cmd))       { rmMain.load_remote(); }
            if (reload_app.includes(cmd))             { rmMain.load_app(); }

            if (cmd && msg.indexOf("ERROR") > -1) { appMsg.alert("<b>" + cmd + "</b>: " + msg); }
            else if (msg.indexOf("ERROR") > -1) { appMsg.alert(msg); }
            else if (msg && cmd && !dont_show_info.includes(cmd)) {
                if (msg && cmd && msg.indexOf("OK") > -1) {
                    appMsg.info("<b>" + cmd + "</b>: " + msg, "ok");
                } else if (msg && cmd) {
                    appMsg.info("<b>" + cmd + "</b>: " + msg);
                } else if (msg) {
                    appMsg.info(msg);
                }
            }
        }, 4000);
    }

    /* answer for api requests - "SendToApi" and "SendToDeviceApi" */
    answer_api_request( data ) {
        let formatted = "N/A";
        const response = data["REQUEST"]["Return"];
        const response_id = data["REQUEST"]["Return"]["request_id"];
        const timestamp = response["answer"]["last_action"]; // timestamp (seconds)

        this.status("answer_api_request: " + response_id + " | " + timestamp + " | " + JSON.stringify(response));

        if (timestamp > 0) {
            const date = new Date(timestamp * 1000); // convert to milliseconds
            formatted =
                String(date.getDate()).padStart(2, '0') + '.' +
                String(date.getMonth() + 1).padStart(2, '0') + '.' +
                String(date.getFullYear()).slice(-2) + ' ' +
                String(date.getHours()).padStart(2, '0') + ':' +
                String(date.getMinutes()).padStart(2, '0') + ':' +
                String(date.getSeconds()).padStart(2, '0');
        }

        let answer = "";
        answer += "<i>Request:</i> <b>" + response["command"] + "</b><br/>";
        if (response["command"] === "api-discovery")    { answer += "<i>Interface:</i> " + response["device"].split("_")[0]; }
        else if (response["answer"]["device_id"])       { answer += "<i>Interface &amp; device:</i> " + response["device"].replace("||", " / "); }
        else                                            { answer += "<i>Interface &amp; device:</i> " + response["interface"] + " / " + response["device"] + " (" + response["status"] + ")"; }
        answer += "<br/>-----<br/>";
        answer += "<pre>" + syntaxHighlightJSON(response["answer"]["answer"]) + "</pre>";
        answer += "<pre id='JSON_copy' style='display:none;'>" + JSON.stringify(response["answer"]["answer"], null, 2) + "</pre>";
        answer += "<br/>&nbsp;<br/>-----<br/><i>";
        answer += "total: " + (data["REQUEST"]["load-time-app"])/1000 + "s / srv: " + Math.round(data["REQUEST"]["load-time"]*10000)/10000 + "s / " +
            "last: " + formatted;

        if (response_id !== "") {
            setTextById('api_response_' + response_id, answer);
        } else {
            setTextById('api_response', answer);
        }
    }

    /* check if status of required device is OK or return a message ... to be embedded for commands in the prepare section */
    status_ok (rm_type, rm_id, source, on_error_show_message=true, additional_commands=[]) {
        let rm_status, rm_status_details, rm_status_message;
        let rm_status_return = true;
        let ok_commands = ["ON", "OK"];
        ok_commands = ok_commands.concat(additional_commands);

        rm_status = rmStatus.get_status(rm_type, rm_id, false);
        rm_status_return = (ok_commands.includes(rm_status));

        if (!rm_status_return && on_error_show_message) {
            rm_status_details = rmStatus.get_status(rm_type, rm_id, true);
            rm_status_message = rm_status_details["message"];
            appMsg.alert(lang("EXECUTION_ERROR", [rm_type, rm_id, source, rm_status_message]));
        }


        this.status(`status_ok: ${source} | ${rm_type}:${rm_id} | ${rm_status} (${rm_status_return}): ${rm_status_message}`);
        return rm_status_return;
    }

    /* show status message with log level set in the constructor */
    status(message) {
        if (this.log_level_status === "warning") { this.logging.warn(message); }
        else if (this.log_level_status === "info") { this.logging.info(message); }
        else if (this.log_level_status === "error") { this.logging.error(message); }
        else { this.logging.debug(message); }
    }
}


remote_scripts_loaded += 1;
