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
function apiDeviceEdit(device,prefix,fields)
function apiDeviceMovePosition(type,device,direction)
function apiDeviceChangeVisibility(device_id, value_id)
function apiDeviceAdd(device, api, description)
function apiDeviceDelete_exe(device)
function apiDeviceDelete(device_id)
function apiCommandSend(cmdButton, sync="", callback="")
function apiCommandDelete_exe(button)
function apiCommandDelete(device_id, button_id)
function apiButtonAdd(device_id, button_id)
function apiButtonDelete_exe(device,button)
function apiButtonDelete(device_id, button_id)
function apiMakroSend( makro )
function apiMakroSend_hide( data )
*/
//--------------------------------

//================================
// CHECK FOR UPDATES
//================================

function apiCheckUpdates() {

	rm3msg.wait("Loading App ...", "remoteInit();" );
	rm3app.requestAPI("GET", ["version",rm3version], "", apiCheckUpdates_msg, "wait" ); 	// doesn't work asynchronuous yet ... -> "wait" as param
	}


function apiCheckUpdates_msg( data ) {

	msg = data["REQUEST"]["Return"];
	msg = "<br/></b><i>"+msg+"</i>";

	rm3msg.wait("Loading App ..."+msg, "remoteInit();" );

	if (data["REQUEST"]["ReturnCode"] != "802") {
		rm3update = true;
		}
	}

//--------------------------------

function apiAlertReturn(data) {
        rm3msg.apiAlertReturn(data);
	remoteReload_load();
        }
	
//--------------------------------
// send add commands       
//--------------------------------

function setMainAudio(device) 			{ rm3app.requestAPI( "POST", ["main-audio",device], 		"", apiAlertReturn ); }
function setVolume(main_audio,volume)		{ rm3app.requestAPI( "GET",  ["set",main_audio,"vol",volume], 	"", remoteReload_load ); }
function apiSetVolume(volume)			{ rm3app.requestAPI( "GET",  ["set",rm3slider.device,"vol",volume], "", remoteReload_load ); }

//================================
// TEMPLATES
//================================

function apiTemplateAdd_exe(device,template) { rm3app.requestAPI("PUT",["template",device,template], "", apiAlertReturn); }
function apiTemplateAdd(device_id, template_id) {

        device   = check_if_element_or_value(device_id);
        template = check_if_element_or_value(template_id);
        
	if (!dataConfig["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' doesn't exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert/select name for device (no space, no special cases)."); return; }
	else if (template == "") 		{ rm3msg.alert("Please insert/select template name."); 	return;	}

	//rm3app.requestAPI("PUT",["template",device,template], "", apiAlertReturn);
	question = "Do you really want overwrite buttons of '" + device + "' with template '" + template + "'?";
	rm3msg.confirm(question,"apiTemplateAdd_exe('" + device + "','" + template + "'); ");
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

	rm3app.requestAPI("POST",["device",device], info, apiAlertReturn);
	}

//--------------------------------

function apiDeviceMovePosition(type,device,direction) 	{ rm3app.requestAPI( "POST", ["move",type,device,direction], 	"", remoteReload_load ); }

//--------------------------------

function apiDeviceChangeVisibility(device_id, value_id) {

        device   = check_if_element_or_value(device_id);
        value    = check_if_element_or_value(value_id);
        
	if (!dataAll["DATA"]["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' doesn't exists!"); return; }
	else if (device == "") 				{ rm3msg.alert("Please insert/select name for device (no space, no special cases)."); return; }
	else if (value == "")   			{ rm3msg.alert("Please insert/select visibility."); return;	}

	rm3app.requestAPI("PUT",["visibility",device,value], "", apiAlertReturn);
	}
	
// create new device
//--------------------------------

function apiDeviceAdd(device, api, description) {
        
	device 		= document.getElementById(device).value.toLowerCase();
	description 	= document.getElementById(description).value;
	api	 	= document.getElementById(api).value;

	if (dataAll["DATA"]["devices"][device])	{ rm3msg.alert("Device '" + device + "' already exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert name for device (no space, no special cases)."); return; }
	else if (api == "") 			{ rm3msg.alert("Please insert API for device (no space, no special cases)."); return; }
	else if (description == "") 		{ rm3msg.alert("Please insert short description for device."); 	return;	}

	rm3app.requestAPI("PUT",["device",device,api,description], "", apiAlertReturn);
	}

// delete device
//--------------------------------

function apiDeviceDelete_exe(device) { rm3app.requestAPI("DELETE",["device",device], "", apiAlertReturn); }      
function apiDeviceDelete(device_id) {

	var device1 = document.getElementById(device_id);

	if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value;	}
	else 				{ var device  = device1.value;	}
	if (device == "")               { rm3msg.alert("Please select device!"); return; }

	var question = "Do you realy want to delete device '" + device + "'?";
	rm3msg.confirm(question,"apiDeviceDelete_exe('" + device + "');");
	}

//================================
// COMMANDS
//================================

// Commands an APP senden
//----------------------------------

function apiCommandSend(cmdButton, sync="", callback="") {

  
	var dc; 	// device & command
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
  		
		rm3app.requestAPI("GET",dc,"",callback,"wait");		// send command and reload data when done
		statusShowApiStatus("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}

	else {
		rm3app.requestAPI("GET",dc,"",callback);		// send command and reload data when done
		statusShowApiStatus("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}
	}

// delete commands
//--------------------------------

function apiCommandDelete_exe(button) { b = button.split("_"); rm3app.requestAPI("DELETE",["command",b[0],b[1]], "", apiAlertReturn); }
function apiCommandDelete(device_id, button_id) {

	var device1 = document.getElementById(device_id);
	if (device1) {
		if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value; }
		else 				{ var device  = device1.value; }
		}
	else 					{ var device  = device_id; }

	if (device == "") { rm3msg.alert("Please select device!"); return; }

	var button1 = document.getElementById(button_id);
	var button  = button1.options[button1.selectedIndex].value;
	if (button == "") { rm3msg.alert("Please select button (for command)!"); return; }

	button1  = button.split("_");
	question = "Do you realy want to delete button '" + button1[1] + "' from '" + device + "'?";

	rm3msg.confirm(question,"apiCommandDelete_exe('" + button + "'); ");
	}


//================================
// BUTTONS
//================================

// add button to device
//--------------------------------

function apiButtonAdd(device_id, button_id) {

        var i=0;

	if (document.getElementById(device_id)) 	{ var device 	= document.getElementById(device_id).value.toLowerCase(); }
	else					        { var device    = device_id; i++; }
	if (document.getElementById(button_id)) 	{ var button 	= document.getElementById(button_id).value; 
							  if (button != "LINE") { button = button.toLowerCase(); }
							  if (button == ".")	{ button = "DOT"; }
							  }
	else					        { var button    = button_id; i++; }	
	
        cmd = "rm3app.requestAPI('PUT',['button','"+device+"','"+button+"'], '', rm3msg.apiAlertReturn );";

	if (device == "") { rm3msg.alert("Please select device."); return; }
	if (button == "") { rm3msg.alert("Please insert name for button."); return; }
	if (i == 2)       { rm3msg.confirm("Record button &quot;"+button+"&quot; for device &quot;"+device+"&quot;: click OK and then press button within the next 5 seconds.",cmd); return; } 

	rm3app.requestAPI("PUT",["button",device,button], "", apiAlertReturn);
	}

// delete buttons
//--------------------------------

function apiButtonDelete_exe(device,button) { rm3app.requestAPI("DELETE",["button",device,button], "", apiAlertReturn); }
function apiButtonDelete(device_id, button_id) {

	var device1 = document.getElementById(device_id);
	if (device1) {
		if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value; }
		else 				{ var device  = device1.value; }
		}
	else 					{ var device  = device_id; }

	if (device == "") { rm3msg.alert("Please select device!"); return; }

	var button1 = document.getElementById(button_id);
	var button  = button1.options[button1.selectedIndex].value;
	if (button == "") { rm3msg.alert("Please select button!"); return; }

	button1  = button.split("_");
	question = "Do you realy want to delete button number [" + button + "] from '" + device + "'?";

	rm3msg.confirm(question,"apiButtonDelete_exe('"+device+"'," + button + "); ");
	}

//================================
// MAKROS
//================================

// separate makro into single commands and send commands
//----------------------------------

function apiMakroSend( makro ) {  // SEND -> FEHLER? obwohl keiner Änderung ...

	rm3msg.wait_small("Please wait ...<br/>");
	console.log( "Send makro: " + makro );
	
	dc = [ "makro", makro ];
	rm3app.requestAPI( "GET", dc, "", apiMakroSend_hide );
	
	// if request takes more time, hide message after 5 seconds
	setTimeout(function(){ rm3msg.hide(); }, 5000);
	}
	
	
function apiMakroSend_hide( data ) {
	rm3msg.hide();
	}

// --------------------
// EOF

