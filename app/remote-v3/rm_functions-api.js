//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// All complex commands to call API
//-----------------------------
/* INDEX:
function apiCheckUpdates()
function apiCheckUpdates_msg( data )
function apiAlertReturn(data)
function setMainAudio(device)
function setVolume(main_audio,volume)
function apiSetVolume(volume)
function apiTemplateAdd_exe(device,template)
function apiTemplateAdd(device_id, template_id)
function apiMakroChange(data=[])
function apiSceneAdd(data)
function apiSceneEdit(device,prefix,fields)
function apiSceneJsonEdit(device,json_buttons,json_channel,json_devices,json_display,display_size)
function apiSceneDelete_exe(device)
function apiSceneDelete(scene_id)
function apiDeviceEdit(device,prefix,fields)
function apiDeviceJsonEdit(device,json_buttons,json_display,display_size)
function apiDeviceMovePosition_exe(type,device,direction)
function apiDeviceMovePosition(data)
function apiDeviceAdd(data,onchange)
function apiDeviceDelete_exe(device)
function apiDeviceDelete(device_id)
function apiRemoteChangeVisibility(type, device_id, value_id)
function apiCommandSend(cmdButton, sync="", callback="", device="")
function apiCommandDelete_exe(button)
function apiCommandDelete(device_id, button_id)
function apiCommandRecord(device_id, button_id)
function apiButtonAdd(device_id, button_id)
function apiButtonDelete_exe(device,button)
function apiButtonDelete(device_id, button_id)
function apiMakroSend( makro, device="", content="" )
function apiMakroSend_hide( data )
*/
//--------------------------------

//================================
// CHECK FOR UPDATES
//================================

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

//--------------------------------

function apiAlertReturn(data) {
	var reload_timeout = 2000;
	appMsg.alertReturn(data);
	remoteReload_load();

	setTimeout(function(){ rm3remotes.data = dataAll; }, reload_timeout-100);
	
	if (data["REQUEST"]["Command"] == "AddTemplate")  	{ setTimeout(function(){ rm3remotes.create( "device", data["REQUEST"]["Device"] ); }, reload_timeout); }
	if (data["REQUEST"]["Command"] == "EditDevice")   	{ setTimeout(function(){ rm3remotes.create( "device", data["REQUEST"]["Device"] ); }, reload_timeout); }
	if (data["REQUEST"]["Command"] == "EditScene")   	{ setTimeout(function(){ rm3remotes.create( "scene",  data["REQUEST"]["Scene"] ); }, reload_timeout); }
	if (data["REQUEST"]["Command"] == "ChangeVisibility" )	{ 
		if (data["REQUEST"]["Device"] == "device") 	{ setTimeout(function(){ rm3remotes.create( "device", data["REQUEST"]["Device"] ); }, reload_timeout); }
		if (data["REQUEST"]["Device"] == "scene") 	{ setTimeout(function(){ rm3remotes.create( "scene", data["REQUEST"]["Device"] ); }, reload_timeout); }
		}
	
        if (data["REQUEST"]["Command"] == "DeleteDevice") 	{ setTimeout(function(){ rm3cookie.set("remote",""); rm3remotes.create( "", "" ); }, reload_timeout); }
        if (data["REQUEST"]["Command"] == "DeleteScene") 	{ setTimeout(function(){ rm3cookie.set("remote",""); rm3remotes.create( "", "" ); }, reload_timeout); }

        }
	
//--------------------------------
// send add commands       
//--------------------------------

function setMainAudio(device) 		{ appFW.requestAPI( "POST", ["main-audio",device], 			"", apiAlertReturn ); }
function setVolume(main_audio,volume)		{ appFW.requestAPI( "GET",  ["set",main_audio,"vol",volume], 	"", remoteReload_load ); }
function apiSetVolume(volume)			{ appFW.requestAPI( "GET",  ["set",rm3slider.device,"vol",volume],	"", remoteReload_load ); }

//================================
// TEMPLATES
//================================

function apiTemplateAdd_exe(device,template) { appFW.requestAPI("PUT",["template",device,template], "", apiAlertReturn); }
function apiTemplateAdd(device_id, template_id) {

        device   = check_if_element_or_value(device_id,false);
        template = check_if_element_or_value(template_id,false);
        
	if (!dataAll["DATA"]["devices"][device]) 	{ appMsg.alert(lang("DEVICE_DONT_EXISTS")); return; }
	else if (device == "")	 			{ appMsg.alert(lang("DEVICE_INSERT_NAME")); return; }
	else if (template == "") 			{ appMsg.alert(lang("DEVICE_SELECT_TEMPLATE")); 	return;	}

	//appFW.requestAPI("PUT",["template",device,template], "", apiAlertReturn);
	question = "Do you really want overwrite buttons of '" + device + "' with template '" + template + "'?";
	appMsg.confirm(question,"apiTemplateAdd_exe('" + device + "','" + template + "'); ");
	}
	
	
//================================
// MAKROS
//================================

function apiMakroChange(data=[]) {

	send_data = {};
	for (var i=0;i<data.length;i++) {
		var key            = data[i];
			try		{ send_data[key] = JSON.parse(getValueById(key)); }
		catch(e)	{ appMsg.alert("<b>JSON Makro " + key + " - "+lang("FORMAT_INCORRECT")+":</b><br/> "+e); return; }
		}

	appFW.requestAPI("PUT",["makro"], send_data, apiAlertReturn);
	}

//================================
// SCENES
//================================

// create new device
//--------------------------------

function apiSceneAdd(data) {

	send_data		   = {};
	send_data["id"]            = getValueById(data[0]);
	send_data["label"]         = getValueById(data[1]);
	send_data["description"]   = getValueById(data[2]);
	
	console.error(send_data);
        
	if (dataAll["DATA"]["devices"][send_data["id"]])	{ appMsg.alert(lang("SCENE_EXISTS",[send_data["id"]])); return; }
	else if (send_data["id"] == "")			{ appMsg.alert(lang("SCENE_INSERT_ID")); return; }
	else if (send_data["label"] == "")			{ appMsg.alert(lang("SCENE_INSERT_LABEL")); return; }

	appFW.requestAPI("PUT",["scene",send_data["id"]], send_data, apiAlertReturn);
	}

// edit device data
//--------------------------------

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
//--------------------------------

function apiSceneJsonEdit(device,json_buttons,json_channel,json_devices,json_display,display_size) {

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
	info["remote"]       = json_buttons;
	info["channel"]      = json_channel;
	info["devices"]      = json_devices;
	info["display"]      = json_display;
	info["display-size"] = display_size;
		
	appFW.requestAPI("POST",["scene",device], info, apiAlertReturn);	
	}

// delete scene
//--------------------------------

function apiSceneDelete_exe(device) { appFW.requestAPI("DELETE",["scene",device], "", apiAlertReturn); remoteInit(); }      
function apiSceneDelete(scene_id) {

	var scene = check_if_element_or_value(scene_id,true);
	if (scene == "") { appMsg.alert(lang("SCENE_SELECT")); return; }

	appMsg.confirm(lang("SCENE_ASK_DELETE",[scene]),"apiSceneDelete_exe('" + scene + "');");
	}


//================================
// DEVICES
//================================

// edit device data
//--------------------------------

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
//--------------------------------

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

//--------------------------------

function apiDeviceMovePosition_exe(type,device,direction) { appFW.requestAPI( "POST", ["move",type,device,direction], "", apiDeviceMovePosition_get); }
function apiDeviceMovePosition_get(data) {
	appFW.requestAPI("GET",["list"],"",apiDeviceMovePosition);
	}
function apiDeviceMovePosition(data) {
	remoteReload_load();
	rm3settings.mode = "";
	rm3settings.data = data;
	rm3settings.create();
	}
	
	
// create new device
//--------------------------------

function apiDeviceAdd(data,onchange) {

	if (getValueById(data[4]) == "" || getValueById(data[5]) == "") { onchange(); }

	send_data		   = {};
	send_data["id"]            = getValueById(data[0]);
	send_data["label"]         = getValueById(data[1]);
	send_data["api"]           = getValueById(data[2]);
	send_data["device"]        = getValueById(data[3]);
	send_data["config_device"] = getValueById(data[4]);
	send_data["config_remote"] = getValueById(data[5]);
	
	console.error(send_data);
        
//	if (dataAll["DATA"]["devices"][send_data["id"]]){ appMsg.alert("Device '" + device + "' already exists!"); return; }
	if (dataAll["DATA"]["devices"][send_data["id"]]){ appMsg.alert(lang("DEVICE_EXISTS",[send_data["id"]])); return; }
	else if (send_data["id"] == "")		{ appMsg.alert(lang("DEVICE_INSERT_ID")); return; }
	else if (send_data["label"] == "")		{ appMsg.alert(lang("DEVICE_INSERT_LABEL")); return; }
	else if (send_data["api"] == "") 		{ appMsg.alert(lang("DEVICE_SELECT_API")); return; }
	else if (send_data["device"] == "") 		{ appMsg.alert(lang("DEVICE_INSERT_NAME")); return;	}

	appFW.requestAPI("PUT",["device",send_data["id"]], send_data, apiAlertReturn);
	}

// delete device
//--------------------------------

function apiDeviceDelete_exe(device) { appFW.requestAPI("DELETE",["device",device], "", apiAlertReturn); remoteInit(); }      
function apiDeviceDelete(device_id) {

	var device = check_if_element_or_value(device_id,true);
	if (device == "")               { appMsg.alert(lang("DEVICE_SELECT")); return; }

	appMsg.confirm(lang("DEVICE_ASK_DELETE",[device]),"apiDeviceDelete_exe('" + device + "');");
	}

//================================
// REMOTES
//================================

function apiRemoteChangeVisibility(type, device_id, value_id) {
        device   = check_if_element_or_value(device_id,true);
        value    = getValueById(value_id,false);
        
        if (value == "yes")	{ setValueById(value_id, "no"); }
        else			{ setValueById(value_id, "yes"); }
	
        value    = getValueById(value_id,false);
        
	appFW.requestAPI("PUT",["visibility",type,device,value], "", apiAlertReturn);
	}
	
//================================
// COMMANDS
//================================

// Commands an APP senden
//----------------------------------

function apiCommandSend(cmdButton, sync="", callback="", device="") {

  
	var ee, vv;
	var onoff = false;

	// split into device and button
	if (Array.isArray(cmdButton))	{ dc = cmdButton; }
	else				{ dc = cmdButton.split("_"); }

	// check, if manual mode (with out checking the device status) or intelligent mode (with checking the device status)
	if (deactivateButton) 	{ dc = ["send" , dc[0] , dc[1]]; }
        else 			{ dc = ["send_check" , dc[0] , dc[1]]; }
        
        if (callback == "")	{ callback = remoteReload_load; }

	// send via app
	if (sync == "sync") { 							// check, if still required ....
  		console.warn("use of apiCommandSend with sync -> try to reduce or eliminate");
  		
		appFW.requestAPI("GET",dc,"",callback,"wait");		// send command and reload data when done
		if (showButton) {setTextById("audio4", cmdButton);}
		}

	else {
		appFW.requestAPI("GET",dc,"",callback);		// send command and reload data when done
		if (showButton) {setTextById("audio4", cmdButton);}
		}
		
	// device content info (scenes)
	//device_media_info[device] = "";
	}

// delete commands
//--------------------------------

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
//--------------------------------

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


//================================
// BUTTONS
//================================

// add button to device
//--------------------------------

function apiButtonAdd(device_id, button_id) {

        var i=0;

	if (document.getElementById(device_id)) 	{ var device	= document.getElementById(device_id).value.toLowerCase(); }
	else					 	{ var device	= device_id; i++; }
	if (document.getElementById(button_id)) 	{ var button	= document.getElementById(button_id).value; 
							  if (button != "LINE")	{ button = button.toLowerCase(); }
							  if (button == ".")		{ button = "DOT"; }
							}
	else						{ var button    = button_id; i++; }	
	
        cmd = "appFW.requestAPI('PUT',['button','"+device+"','"+button+"'], '', appMsg.alertReturn );";

	if (device == "") { appMsg.alert(lang("DEVICE_SELECT")); return; }
	if (button == "") { appMsg.alert(lang("BUTTON_INSERT_NAME")); return; }
	if (i == 2)       { appMsg.confirm(lang("BUTTON_RECORD",[button,device]),cmd); return; } 
	
	appFW.requestAPI("PUT",["button",device,button], "", apiAlertReturn);
	}


// delete buttons
//--------------------------------

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

//================================
// MAKROS
//================================

// separate makro into single commands and send commands
//----------------------------------

function apiMakroSend( makro, device="", content="" ) {  // SEND -> FEHLER? obwohl keiner Änderung ...

	console.log( "Send makro: " + makro );
	dc = [ "makro", makro ];
	appFW.requestAPI( "GET", dc, "", apiMakroSend_return );
	device_media_info[device] = content;	
	}
	
	
function apiMakroSend_return( data ) {
	console.log("Send makro return :");
	console.log(data);
	}

// --------------------
// EOF

