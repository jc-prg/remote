//--------------------------------
// jc://remote/
//--------------------------------

// check if APP updates are available
function apiCheckUpdates() {

	appMsg.wait("Loading App ...", "remoteInit();" );
	appFW.requestAPI("GET", ["version",rm3version], "", apiCheckUpdates_msg, "wait" ); 	// doesn't work asynchronuous yet ... -> "wait" as param
	}

function apiCheckUpdates_msg( data ) {

	msg = data["REQUEST"]["Return"];
	msg = "<br/></b><i>"+msg+"</i>";

	appMsg.wait("Loading App ..."+msg, "remoteInit();" );

	if (data["REQUEST"]["ReturnCode"] != "802") {
		rm3update = true;
		}
	}


// show return message as alert
function apiAlertReturn(data) {

    setTimeout(function() {
        if (data["REQUEST"]["Command"] == "DeleteDevice") 	{ appCookie.erase("remote"); rm3remotes.active_name = ""; }
        if (data["REQUEST"]["Command"] == "DeleteScene") 	{ appCookie.erase("remote"); rm3remotes.active_name = ""; }
        remoteReload_load();
        }, 1000);

    setTimeout(function() {
        if (data["REQUEST"]["Command"] == "AddTemplate")  	    { rm3remotes.create( "device", data["REQUEST"]["Device"] ); }
        else if (data["REQUEST"]["Command"] == "AddDevice")   	{ rm3remotes.create( "device", data["REQUEST"]["Device"] ); }
        else if (data["REQUEST"]["Command"] == "EditDevice")   	{ rm3remotes.create( "device", data["REQUEST"]["Device"] ); }
        else if (data["REQUEST"]["Command"] == "AddScene")   	{ rm3remotes.create( "scene",  data["REQUEST"]["Scene"] ); }
        else if (data["REQUEST"]["Command"] == "EditScene")   	{ rm3remotes.create( "scene",  data["REQUEST"]["Scene"] ); }
        else if (data["REQUEST"]["Command"] == "ChangeVisibility" )	{
            if (data["REQUEST"]["Device"] == "device")          { rm3remotes.create( "device", data["REQUEST"]["Device"] ); }
            if (data["REQUEST"]["Device"] == "scene")           { rm3remotes.create( "scene", data["REQUEST"]["Device"] ); }
            }
        else if (data["REQUEST"]["Command"] == "DeleteDevice") 	{ remoteMainMenu(); }
        else if (data["REQUEST"]["Command"] == "DeleteScene") 	{ remoteMainMenu(); }
        else                                                    {}

        if (data["REQUEST"]["Return"].indexOf("ERROR") > -1 && data["REQUEST"]["Command"]) {
            appMsg.alert("<b>" + data["REQUEST"]["Command"] + "</b>: " + data["REQUEST"]["Return"]);
            }
        else if (data["REQUEST"]["Return"].indexOf("ERROR") > -1 && data["REQUEST"]["Command"]) {
            appMsg.alert(data["REQUEST"]["Return"]);
            }
        else if (data["REQUEST"]["Return"] && data["REQUEST"]["Command"] && data["REQUEST"]["Return"].indexOf("OK") > -1) {
            appMsg.info("<b>" + data["REQUEST"]["Command"] + "</b>: " + data["REQUEST"]["Return"], "ok");
            }
        else if (data["REQUEST"]["Return"] && data["REQUEST"]["Command"]) {
            appMsg.info("<b>" + data["REQUEST"]["Command"] + "</b>: " + data["REQUEST"]["Return"]);
            }
        else if (data["REQUEST"]["Return"]) {
            appMsg.info(data["REQUEST"]["Return"]);
            }

        }, 2000);
    }


// set main audio device
function setMainAudio(device)           { appFW.requestAPI( "POST", ["main-audio",device], "", apiAlertReturn ); }


// swt volume
function setVolume(main_audio,volume)   { appFW.requestAPI( "GET",  ["set",main_audio,"send-vol",volume], "", remoteReload_load ); }

function apiSetVolume(volume)           { appFW.requestAPI( "GET",  ["set",rm3slider.device,"send-vol",volume], "", remoteReload_load ); }


// add template (load as JSON)
function apiTemplateAdd_exe(device,template) { appFW.requestAPI("PUT",["template",device,template], "", apiAlertReturn); }

function apiTemplateAdd(device_id, template_id) {

        device   = check_if_element_or_value(device_id,false);
        template = check_if_element_or_value(template_id,false);
        
	if (!dataAll["CONFIG"]["devices"][device])  { appMsg.alert(lang("DEVICE_DONT_EXISTS"));     return; }
	else if (device == "")                      { appMsg.alert(lang("DEVICE_INSERT_NAME"));     return; }
	else if (template == "")                    { appMsg.alert(lang("DEVICE_SELECT_TEMPLATE")); return;	}

	//appFW.requestAPI("PUT",["template",device,template], "", apiAlertReturn);
	question = "Do you really want overwrite buttons of '" + device + "' with template '" + template + "'?";
	appMsg.confirm(question,"apiTemplateAdd_exe('" + device + "','" + template + "'); ");
	}


// create new device
function apiSceneAdd(data) {

	send_data                   = {};
	send_data["id"]             = getValueById(data[0]);
	send_data["label"]          = getValueById(data[1]);
	send_data["description"]    = getValueById(data[2]);
	
	console.debug("apiSceneAdd: " + JSON.stringify(send_data));

    if (dataAll["CONFIG"]["scenes"][send_data["id"]])     { appMsg.alert(lang("SCENE_EXISTS",[send_data["id"]])); return; }
    else if (send_data["id"] == "")                     { appMsg.alert(lang("SCENE_INSERT_ID")); return; }
    else if (send_data["label"] == "")                  { appMsg.alert(lang("SCENE_INSERT_LABEL")); return; }

	appFW.requestAPI("PUT",["scene",send_data["id"]], send_data, apiAlertReturn);
	}

function apiSceneAddCheckID(element) {
    if (element.value && dataAll["CONFIG"]["scenes"][element.value]) {
        element.style.color = "red";
        }
    else {
        element.style.color = "";
        }
    }


// edit scene header data
function apiSceneEdit(device,prefix,fields) {

	var info        = {}
	var field_list  = fields.split(",");

	for (var i=0;i<field_list.length;i++) {
		if (document.getElementById(prefix+"_"+field_list[i])) {
			var value = document.getElementById(prefix+"_"+field_list[i]).value;
			info[field_list[i]] = value;	
			}
		}

	appFW.requestAPI("POST",["scene",device], info, apiAlertReturn);
	}


// edit button and display data using JSON
function apiSceneJsonEdit(device,field_names) {

    var fields = field_names.split(",");
    var values = {};
    var json   = {};

    for (i=0;i<fields.length;i++) {
        var field = fields[i];
        var key   = field.split("::")[1];
        var lower_case = false;

        if (field == "devices") { lower_case = true; }
        values[key] = check_if_element_or_value(field, lower_case);

        if (key != "display-size") {
            try         { json[key] = JSON.parse(values[key]); }
            catch(e)    { appMsg.alert("<b>JSON " + field + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
            }
        else {
            json[key] = values[key];
            }
        }

    /*
    buttons      = check_if_element_or_value(json_buttons,false);
    channel      = check_if_element_or_value(json_channel,false);
    devices      = check_if_element_or_value(json_devices,true);
    display      = check_if_element_or_value(json_display,false);
    display_size = check_if_element_or_value(display_size,false);

	try { json_buttons = JSON.parse(buttons); } catch(e) { appMsg.alert("<b>JSON Buttons - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	try { json_channel = JSON.parse(channel); } catch(e) { appMsg.alert("<b>JSON Channel - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	try { json_devices = JSON.parse(devices); } catch(e) { appMsg.alert("<b>JSON Devices - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	try { json_display = JSON.parse(display); } catch(e) { appMsg.alert("<b>JSON Display - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	
	var info = {};
	info["remote"]        = json_buttons;
	info["macro-channel"] = json_channel;
	info["devices"]       = json_devices;
	info["display"]       = json_display;
	info["display-size"]  = display_size;
		
	appFW.requestAPI("POST",["scene",device], info, apiAlertReturn);
	*/

	appFW.requestAPI("POST",["scene",device], json, apiAlertReturn);

	}


// delete scene
function apiSceneDelete_exe(device) {
    appFW.requestAPI("DELETE",["scene",device], "", apiAlertReturn);
    rm3remotes.active_name = "";
    appCookie.erase("remote");
    }

function apiSceneDelete(scene_id) {

	var scene = check_if_element_or_value(scene_id,true);
	if (scene == "") { appMsg.alert(lang("SCENE_SELECT")); return; }

	if (!dataAll["CONFIG"]["scenes"][scene_id]) {
	    appMsg.alert("Scene '"+scene_id+"' doesn't exist.");
	    }
	else {
        appMsg.confirm(lang("SCENE_ASK_DELETE",[scene]),"apiSceneDelete_exe('" + scene + "');", 140);
        }
	}


// switch interfaces and API devices On or Off
function apiInterfaceOnOff(interface, value) {

    appFW.requestAPI("PUT",["interface", interface, value], "", "");
    }

function apiApiDeviceOnOff(interface, api_device, value) {

    appFW.requestAPI("PUT",["api_device", interface, api_device, value], "", "");
    }

function apiApiDeviceOnOff_button(interface, api_device, button) {

    var value  = button.innerHTML;
    if (value == "ON") {
        apiApiDeviceOnOff(interface, api_device, "False");
        button.innerHTML = "OFF";
        }
    else if (value == "OFF") {
        apiApiDeviceOnOff(interface, api_device, "True");
        button.innerHTML = "ON";
        }
    else if (value == "ERROR") {
        apiApiDeviceOnOff(interface, api_device, "False");
        button.innerHTML = "OFF";
        }
    }


// edit device data
function apiDeviceEdit(device,prefix,fields) {

	var info        = {}
	var field_list  = fields.split(",");

	for (var i=0;i<field_list.length;i++) {
		if (document.getElementById(prefix+"_"+field_list[i])) {
			var value = document.getElementById(prefix+"_"+field_list[i]).value;
			info[field_list[i]] = value;	
			}
		}

	appFW.requestAPI("POST",["device",device], info, apiAlertReturn);
	}


// edit button and display data using JSON
function apiDeviceJsonEdit(device,json_buttons,json_display,display_size) {

	buttons      = check_if_element_or_value(json_buttons,false);
	display      = check_if_element_or_value(json_display,false);
	display_size = check_if_element_or_value(display_size,false);

	try { json_buttons = JSON.parse(buttons); } catch(e) { appMsg.alert("<b>JSON Buttons - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	try { json_display = JSON.parse(display); } catch(e) { appMsg.alert("<b>JSON Display - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
	
	var info = {};
	info["remote"]  = json_buttons;
	info["display"] = json_display;
	info["display-size"] = display_size;
		
	appFW.requestAPI("POST",["device",device], info, apiAlertReturn);	
	}


// move position of device or scene in the menu
function apiDeviceMovePosition_exe(type,device,direction) { appFW.requestAPI( "POST", ["move",type,device,direction], "", apiDeviceMovePosition_get); }

function apiDeviceMovePosition_get(data) {
    if (data["REQUEST"]["Return"].indexOf("ERROR") > -1)   { appMsg.alert(data["REQUEST"]["Return"]); }
    else if (data["REQUEST"]["Return"].indexOf("OK") > -1) { appMsg.info("<b>" + data["REQUEST"]["Command"] + "</b>: " + data["REQUEST"]["Return"], "ok"); }
    //setTimeout(function() { appFW.requestAPI("GET",["list"],"",apiDeviceMovePosition); }, 1000 );
    setTimeout(function() { remoteReload_load(); }, 1000 );
    }

function apiDeviceMovePosition(data) {
	// remoteReload_load();
	rm3settings.data = data;
	rm3settings.create();
	}

function apiMovePosition(id, dnd_list, from, to) {
    if (dnd_list.indexOf("scene") > -1 && id != "")         { apiDeviceMovePosition_exe("scene", id, (to - from)); }
    else if (dnd_list.indexOf("device") > -1 && id != "")   { apiDeviceMovePosition_exe("device", id, (to - from)); }
    else {
        appMsg.info("MOVE "+from+" >> "+to +"<br/>not ready implemented yet", "error");
        }
    }

// create new device
function apiDeviceAdd(data,onchange) {

    console.error(data);

	if (getValueById(data[5]) == "" || getValueById(data[6]) == "") { onchange(); }

	send_data		   = {};
	send_data["id"]            = getValueById(data[0]).replaceAll("_", "-");
	send_data["description"]   = getValueById(data[1]);
	send_data["label"]         = getValueById(data[2]);
	send_data["api"]           = getValueById(data[3]);
	send_data["device"]        = getValueById(data[4]);
	send_data["config_device"] = getValueById(data[5]);
	send_data["config_remote"] = getValueById(data[6]);
	send_data["id_ext"]        = getValueById(data[7]);
	send_data["image"]         = getValueById(data[8]);

	console.error(send_data);
	console.error(dataAll["CONFIG"]["devices"]);

	if (dataAll["CONFIG"]["devices"][send_data["id"]])  { appMsg.alert(lang("DEVICE_EXISTS",[send_data["id"]])); return; }
	else if (send_data["id"] == "")                     { appMsg.alert(lang("DEVICE_INSERT_ID")); return; }
	else if (send_data["label"] == "")                  { appMsg.alert(lang("DEVICE_INSERT_LABEL")); return; }
	else if (send_data["api"] == "")                    { appMsg.alert(lang("DEVICE_SELECT_API")); return; }
	else if (send_data["device"] == "")                 { appMsg.alert(lang("DEVICE_INSERT_NAME")); return;	}

	appFW.requestAPI("PUT",["device",send_data["id"]], send_data, apiAlertReturn);
	}

function apiDeviceAddCheckID(element) {
    if (element.value && dataAll["CONFIG"]["devices"][element.value]) {
        element.style.color = "red";
        }
    else {
        element.style.color = "";
        }
    }


// delete device
function apiDeviceDelete_exe(device) {
    appFW.requestAPI("DELETE",["device",device], "", apiAlertReturn);
    rm3remotes.active_name = "";
    appCookie.erase("remote");
    remoteInit(); // check if required !!!!!!!!!!!!!!!
    }

function apiDeviceDelete(device_id) {

	var device = check_if_element_or_value(device_id,true);
	if (device == "")  { appMsg.alert(lang("DEVICE_SELECT")); return; }

	appMsg.confirm(lang("DEVICE_ASK_DELETE",[device]),"apiDeviceDelete_exe('" + device + "');", 140);
	}


// REMOTES
function apiRemoteChangeVisibility(type, device_id, value_id) {
    device   = check_if_element_or_value(device_id,true);
    value    = getValueById(value_id, "", true);

    if (value == "yes") { setValueById(value_id, "no"); }
    else                { setValueById(value_id, "yes"); }
    value               = getValueById(value_id, "", true);

	appFW.requestAPI("PUT",["visibility",type,device,value], "", apiAlertReturn);
	}


// send command
function apiCommandSend(cmdButton, sync="", callback="", device="") {
	var ee, vv;
	var onoff = false;
	var button_show = "<div class='rm-button_show'>&nbsp;"+cmdButton+"&nbsp;</div>";

	// check if macro
	var types = ["macro", "scene-on", "scene-off", "dev-on", "dev-off"];
	for (var i=0;i<types.length;i++) {
        if (cmdButton.startsWith(types[i]+"_")) { return apiMacroSend(cmdButton, device); }
        }
    console.debug("apiCommandSend: " + cmdButton);

	// split into device and button
	if (Array.isArray(cmdButton))   { dc = cmdButton; }
	else                            { dc = cmdButton.split("_"); }

	// check, if manual mode (with out checking the device status) or intelligent mode (with checking the device status)
	if (deactivateButton)   { dc = ["send" , dc[0] , dc[1]]; }
    else                    { dc = ["send_check" , dc[0] , dc[1]]; }

    //if (callback == "")	{ callback = remoteReload_load; }

	// send via app
	if (sync == "sync") { 							// check, if still required ....
  		console.warn("use of apiCommandSend with sync -> try to reduce or eliminate");
  		
		appFW.requestAPI("GET",dc,"",callback,"wait");		// send command and reload data when done
		if (showButton) {
		    //setTextById("audio4", button_show);
            appMsg.info("<b>Request Button:</b> " + device + " / " + cmdButton);
		    }
		}

	else {
		appFW.requestAPI("GET",dc,"",callback);		// send command and reload data when done
		if (showButton) {
		    //setTextById("audio4", button_show);
            appMsg.info("<b>Request Button:</b> " + device + " / " + cmdButton);
		    }
		}
		
	// device content info (scenes)
	//device_media_info[device] = "";
	}


// delete commands
function apiCommandDelete_exe(button) { b = button.split("_"); appFW.requestAPI("DELETE",["command",b[0],b[1]], "", apiAlertReturn); }

function apiCommandDelete(device_id, button_id) {

	var device1 = document.getElementById(device_id);
	if (device1) {
		if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value; }
		else 				{ var device  = device1.value; }
		}
	else 					{ var device  = device_id; }

	if (device == "") { appMsg.alert(lang("DEVICE_SELECT")); return; }

	var button1 = document.getElementById(button_id);
	var button  = button1.options[button1.selectedIndex].value;
	if (button == "") { appMsg.alert(lang("BUTTON_SELECT")); return; }

	button1  = button.split("_");
	appMsg.confirm(lang("BUTTON_ASK_DELETE",[button1[1],device]),"apiCommandDelete_exe('" + button + "'); ");
	}


// add button to device
function apiCommandRecord(device_id, button_id) {

	if (document.getElementById(device_id)) 	{ var device	= document.getElementById(device_id).value.toLowerCase(); }
	else					 	{ var device	= device_id;}
	if (document.getElementById(button_id)) 	{ var button	= document.getElementById(button_id).value; 
							  if (button != "LINE")	{ button = button.toLowerCase(); }
							  if (button == ".")		{ button = "DOT"; }
							}
	else						{ var button    = button_id; }	
	
        cmd = "appFW.requestAPI('POST',['command','"+device+"','"+button+"'], '', appMsg.alertReturn );";

	if (device == "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
	if (button == "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
	
	appMsg.confirm(lang("BUTTON_RECORD",[button,device]),cmd); return; 
	}


// add button to device
function apiButtonAdd(device_id, button_id) {

    var i=0;

	if (document.getElementById(device_id)) {
	    var device	= document.getElementById(device_id).value.toLowerCase();
	    }
	else {
	    var device	= device_id; i++;
	    }
	if (document.getElementById(button_id)) 	{
	    var button	= document.getElementById(button_id).value;
		if (button != "LINE")	{ button = button.toLowerCase(); }
		if (button == ".")		{ button = "DOT"; }
		}
	else {
	    var button    = button_id; i++;
	    }
	
    cmd = "appFW.requestAPI('PUT',['button','"+device+"','"+button+"'], '', appMsg.alertReturn );";

	if (device == "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
	if (button == "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
	if (i == 2)       { appMsg.confirm(lang("BUTTON_RECORD",[button,device]),cmd); return; } 
	
	appFW.requestAPI("PUT",["button",device,button], "", apiAlertReturn);
	}


// delete buttons
function apiButtonDelete_exe(device,button) { appFW.requestAPI("DELETE",["button",device,button], "", apiAlertReturn); }

function apiButtonDelete(device_id, button_id) {

	var device1 = document.getElementById(device_id);
	if (device1) {
		if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value; }
		else 				{ var device  = device1.value; }
		}
	else 					{ var device  = device_id; }

	if (device == "") { appMsg.alert(lang("DEVICE_SELECT")); return; }

	var button1 = document.getElementById(button_id);
	var button  = button1.options[button1.selectedIndex].value;
	if (button == "") { appMsg.alert(lang("BUTTON_SELECT")); return; }

	appMsg.confirm(lang("BUTTON_ASK_DELETE_NUMBER",[button,device]),"apiButtonDelete_exe('"+device+"'," + button + "); ");
	}


// edit macros
function apiMacroChange(data=[]) {

	send_data = {};
	for (var i=0;i<data.length;i++) {
		var key            = data[i];
        try		{ send_data[key] = JSON.parse(getValueById(key)); }
        catch(e)	{ appMsg.alert("<b>JSON Macro " + key + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
		}

	appFW.requestAPI("PUT",["macro"], send_data, apiAlertReturn);
	}


// decompose macro data
function apiMacroDecompose(macro) {
    var types = ["macro", "dev-on", "dev-off"];
    var full_decompose = [];
    var translate = {
        "macro": "global",
        "dev-on": "device-on",
        "dev-off": "device-off"
    }
    for (var a=0;a<types.length;a++) {
        if (macro.startsWith(types[a]+"_")) {
            var macro_cmd = macro.split("_");
            var macro_string = "";
            var macro_wait = "";
            var macro_translate = translate[types[a]];
            var macro_data = rm3remotes.data["CONFIG"]["macros"][macro_translate];

            if (macro_data[macro_cmd[1]]) {
                for (var i=0; i<macro_data[macro_cmd[1]].length; i++) {
                    var command = macro_data[macro_cmd[1]][i];
                    if (command.startsWith && command.startsWith("WAIT")) {
                        var wait = command.split("-");
                        macro_wait = 'appMsg.wait_time("'+lang("MACRO_PLEASE_WAIT")+'", '+wait[1]+');';
                        full_decompose.push("wait=" + wait[1]+"s");
                        }
                    else {
                        macro_string += macro_data[macro_cmd[1]][i] + "::";
                        full_decompose.push(macro_data[macro_cmd[1]][i]);
                        }
                    }
                }
            }
        }
    console.debug("apiMacroDecompose: " + macro + " -> " + macro_string + " | " + macro_wait);
    if (showButton) {
        appMsg.info("<b>Macro Decompose:</b> " + macro + " -> " + full_decompose.join(", "));
        }
    return [ macro_string, macro_wait ];
    }


// separate macro into single commands and send commands
function apiMacroSend( macro, device="", content="" ) {  // SEND -> FEHLER? obwohl keiner Änderung ...
    console.debug("apiMacroSend: " + macro);
    if (!macro.includes("::")) {
        [macro_string, macro_wait] = apiMacroDecompose(macro);
        macro = macro_string;
        eval(macro_wait);
        }
	dc = [ "macro", macro ];
	appFW.requestAPI( "GET", dc, "", apiMacroSend_return );
	device_media_info[device] = content;

	if (showButton) {
	    appMsg.info("<b>Request Macro:</b> " + dc);
	    }
	}

function apiMacroSend_return( data ) {
	console.log("Send macro return :");
	console.log(data);
	if (data["REQUEST"]["macro_error"] && data["REQUEST"]["macro_error"] != "") {
	    appMsg.info("<b>Macro Error:</b> " + data["REQUEST"]["macro_error"], "error");
	    }
	if (showButton) {
	    appMsg.info("<b>Macro Queue:</b> " + data["REQUEST"]["decoded_macro"]);
	    }
	}


// edit timer
function apiTimerEdit(key, data_fields) {

    send_data = {};
    send_fields = data_fields.split(",");
    for (var i=0;i<send_fields.length;i++) {
        field_name = send_fields[i].split("_")[1];
        if (getValueById(send_fields[i])) { send_data[field_name] = getValueById(send_fields[i]); }
        else                              { send_data[field_name] = getTextById(send_fields[i]); }
        }

    try { send_data["timer_regular"] = JSON.parse(send_data["regular"]); }  catch(e) { appMsg.alert("<b>Repeating timer - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
    try { send_data["timer_once"]    = JSON.parse(send_data["once"]); }     catch(e) { appMsg.alert("<b>One-time timer - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
    try { send_data["commands"]      = JSON.parse(send_data["commands"]); } catch(e) { appMsg.alert("<b>Commands - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }

    delete send_data["regular"];
    delete send_data["once"];

    //console.error(data_fields);
    //console.error(send_data);
	appFW.requestAPI("PUT",["timer-edit", key], send_data, apiAlertReturn);
    }

function apiTimerTry(key) {

	appFW.requestAPI("PUT",["timer-try", key], "", apiAlertReturn);
    }

function apiTimerAdd(data_fields) {}

function apiTimerDelete(key) {

    appFW.requestAPI("DELETE",["timer-edit", key], "", apiAlertReturn);
    }


// send a command directly to an API of a device
function apiSendToDeviceApi( device, api_command ) {
    var send_cmd  = ["send-api", device];
    var send_data = api_command;
	appFW.requestAPI( "POST", send_cmd, send_data, apiSendToDeviceApi_return );
}

function apiSendToApi( api_command ) {
    var send_cmd  = ["send-api-command", api_command];
	appFW.requestAPI( "POST", send_cmd, "", apiSendToDeviceApi_return );
}

function apiSendToDeviceApi_return( data ) {
    console.warn(data);
    var response    = data["REQUEST"]["Return"];
    var answer      = "<b>" + response["interface"] + "/" + response["device"] + " (" + response["status"] + "):</b><br/>";
    answer         += "<pre>" + syntaxHighlightJSON(response["answer"]["answer"]) + "</pre>";
    answer         += "<br/>&nbsp;<br/>-----<br/><i>";
    answer         += "total: " + (data["REQUEST"]["load-time-app"])/1000 + "s / srv: " + Math.round(data["REQUEST"]["load-time"]*10000)/10000 + "s";
    setTextById('api_response', answer);
}


// get and edit specific configuration files
function apiGetConfig_createDropDown( device, callback ) {
    var send_cmd  = ["config", "device", device];
	appFW.requestAPI( "GET", send_cmd, "", callback );
}

function apiGetConfig_showInterfaceData( callback ) {
    var send_cmd = ["config", "interface", "all"];
	appFW.requestAPI( "GET", send_cmd, "", callback );
}

function apiSetConfig_InterfaceData( device, config ) {
    var config_data = {};
    var send_cmd    = ["config", "interface", device];

    try         { config_data = JSON.parse(getValueById( config )); }
    catch(e)    { appMsg.alert("<b>JSON Config " + device + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }

	appFW.requestAPI( "POST", send_cmd, config_data, apiAlertReturn );
}


// reload API Device connections
function apiReconnectInterface( interface ) {
    var send_cmd    = ["reconnect", interface];
	appFW.requestAPI( "POST", send_cmd, "", apiAlertReturn );
}