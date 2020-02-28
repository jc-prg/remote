//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// All complex commands to call API
//-----------------------------
// function check_for_updates_msg(data) {}
// function check_for_updates() {}
//
// function addDevice(device, description) {}
// function addButton(device_id, button_id) {}
// function deleteButton(device_id, button_id) {}
// function deleteButton_exe(button) {}
// function deleteDevice(device_id) {}
// function deleteDevice_exe(device) {}
//
// function loadRemote(cmd,callback="") {}
// function sendCmd(cmdButton, sync="", callback="") {}
// function sendMakro( makro ) {}

//--------------------------------
// check if updates available
//--------------------------------

function check_for_updates() {

	rm3msg.wait("Loading App ...", "initRemote();" );
	rm3app.requestAPI("GET", ["version",rm3version], "", check_for_updates_msg, "wait" ); 	// doesn't work asynchronuous yet ... -> "wait" as param
	}


function check_for_updates_msg( data ) {

	msg = data["REQUEST"]["Return"];
	msg = "<br/></b><i>"+msg+"</i>";

	rm3msg.wait("Loading App ..."+msg, "initRemote();" );

	if (data["REQUEST"]["ReturnCode"] != "802") {
		rm3update = true;
		}
	}

	
//--------------------------------
// send add commands
//--------------------------------

function updateRemote(data) {
        rm3remotes.data = data["DATA"]["devices"]; //["DeviceConfig"];
        rm3remotes.create();
        }
        
function alertReturn(data) {
        rm3app.requestAPI( "GET", ["list"], "", remoteReload, "" );
        rm3app.requestAPI( "GET", ["list"], "", remoteDropDown );
        rm3msg.alertReturn(data);
        }
        
//--------------------------------

function setVolume(main_audio,volume)		{ rm3app.requestAPI( "GET",  ["set",main_audio,"vol",volume], 	"", check_status_load ); }
function setMainAudio(device) 			{ rm3app.requestAPI( "POST", ["main-audio",device], 		"", alertReturn ); }
function movePosition(type,device,direction) 	{ rm3app.requestAPI( "POST", ["move",type,device,direction], 	"", remoteInitData_load ); }

//--------------------------------

function changeVisibilityDevice(device_id, value_id) {

        device   = check_if_element_or_value(device_id);
        value    = check_if_element_or_value(value_id);
        
	if (!dataAll["DATA"]["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' doesn't exists!"); return; }
	else if (device == "") 				{ rm3msg.alert("Please insert/select name for device (no space, no special cases)."); return; }
	else if (value == "")   			{ rm3msg.alert("Please insert/select visibility."); return;	}

	rm3app.requestAPI("PUT",["visibility",device,value], "", alertReturn);
	}
	
//--------------------------------

function addTemplate_exe(device,template) { rm3app.requestAPI("PUT",["template",device,template], "", alertReturn); }
function addTemplate(device_id, template_id) {

        device   = check_if_element_or_value(device_id);
        template = check_if_element_or_value(template_id);
        
	if (!dataConfig["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' doesn't exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert/select name for device (no space, no special cases)."); return; }
	else if (template == "") 		{ rm3msg.alert("Please insert/select template name."); 	return;	}

	//rm3app.requestAPI("PUT",["template",device,template], "", alertReturn);
	question = "Do you really want overwrite buttons of '" + device + "' with template '" + template + "'?";
	rm3msg.confirm(question,"addTemplate_exe('" + device + "','" + template + "'); ");
	}
	
	
//--------------------------------
// create new device
//--------------------------------

function addDevice(device, api, description) {
        
	device 		= document.getElementById(device).value.toLowerCase();
	description 	= document.getElementById(description).value;
	api	 	= document.getElementById(api).value;

	if (dataAll["DATA"]["devices"][device])	{ rm3msg.alert("Device '" + device + "' already exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert name for device (no space, no special cases)."); return; }
	else if (api == "") 			{ rm3msg.alert("Please insert API for device (no space, no special cases)."); return; }
	else if (description == "") 		{ rm3msg.alert("Please insert short description for device."); 	return;	}

	rm3app.requestAPI("PUT",["device",device,api,description], "", alertReturn);
	}

//--------------------------------
// edit device data
//--------------------------------

function editDevice(device,prefix,fields) {

	var info        = {}
	var field_list  = fields.split(",");

	for (var i=0;i<field_list.length;i++) {
		if (document.getElementById(prefix+"_"+field_list[i])) {
			var value = document.getElementById(prefix+"_"+field_list[i]).value;
			info[field_list[i]] = value;	
			}
		}

	rm3app.requestAPI("POST",["device",device], info, alertReturn);
	}

//--------------------------------
// add button to device
//--------------------------------

function addButton(device_id, button_id) {

        var i=0;

	if (document.getElementById(device_id)) 	{ var device 	= document.getElementById(device_id).value.toLowerCase(); }
	else					        { var device    = device_id; i++; }
	if (document.getElementById(button_id)) 	{ var button 	= document.getElementById(button_id).value; 
							  if (button != "LINE") { button = button.toLowerCase(); }
							  if (button == ".")	{ button = "DOT"; }
							  }
	else					        { var button    = button_id; i++; }	
	
        cmd = "rm3app.requestAPI('PUT',['button','"+device+"','"+button+"'], '', rm3msg.alertReturn );";

	if (device == "") { rm3msg.alert("Please select device."); return; }
	if (button == "") { rm3msg.alert("Please insert name for button."); return; }
	if (i == 2)       { rm3msg.confirm("Record button &quot;"+button+"&quot; for device &quot;"+device+"&quot;: click OK and then press button within the next 5 seconds.",cmd); return; } 

	rm3app.requestAPI("PUT",["button",device,button], "", alertReturn);
	}

//--------------------------------
// send delete commands
//--------------------------------

function deleteCommand_exe(button) { b = button.split("_"); rm3app.requestAPI("DELETE",["command",b[0],b[1]], "", alertReturn); }
function deleteCommand(device_id, button_id) {

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

	rm3msg.confirm(question,"deleteCommand_exe('" + button + "'); ");
	}


//--------------------------------

function deleteButton_exe(device,button) { rm3app.requestAPI("DELETE",["button",device,button], "", alertReturn); }
function deleteButton(device_id, button_id) {

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

	rm3msg.confirm(question,"deleteButton_exe('"+device+"'," + button + "); ");
	}


//--------------------------------

function deleteDevice_exe(device) { rm3app.requestAPI("DELETE",["device",device], "", alertReturn); }      
function deleteDevice(device_id) {

	var device1 = document.getElementById(device_id);

	if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value;	}
	else 				{ var device  = device1.value;	}
	if (device == "")               { rm3msg.alert("Please select device!"); return; }

	var question = "Do you realy want to delete device '" + device + "'?";
	rm3msg.confirm(question,"deleteDevice_exe('" + device + "');");
	}


//--------------------------------

function check_if_element_or_value(name_value) {
        if (name_value == "")                                                                   { console.error("check_if_element_or_value: no value"); return; }
	if (document.getElementById(name_value) && document.getElementById(name_value).value) 	{ return document.getElementById(name_value).value.toLowerCase(); }
	else					                                                { return name_value; }
	}


//----------------------------------
// Commands an APP senden
//----------------------------------

function sendCmd(cmdButton, sync="", callback="") {

  
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
  		console.warn("use of sendCmd with sync -> try to reduce or eliminate");
  		
		rm3app.requestAPI("GET",dc,"",callback,"wait");		// send command and reload data when done
		show_status("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}

	else {
		rm3app.requestAPI("GET",dc,"",callback);		// send command and reload data when done
		show_status("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}
	}


//----------------------------------
// separate makro into single commands and send commands
//----------------------------------

function sendMakro( makro ) {  // SEND -> FEHLER? obwohl keiner Änderung ...

	rm3msg.wait_small("Please wait ...<br/>");
	console.log( "Send makro: " + makro );
	
	dc = [ "makro", makro ];
	rm3app.requestAPI( "GET", dc, "", sendMakro_hide );
	
	// if request takes more time, hide message after 5 seconds
	setTimeout(function(){ rm3msg.hide(); }, 5000);
	}
	
	
function sendMakro_hide( data ) {
	rm3msg.hide();
	}

// --------------------
// EOF

