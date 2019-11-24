//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// All complex commands to call API
//-----------------------------
// function check_for_updates_msg(data) {}
// function check_for_updates() {}
// function checkUpdates(version) {}  // --> check if still required
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
	rm3app.requestAPI("GET",["version",rm3version], "", check_for_updates_msg, "wait" );
	}


function check_for_updates_msg(data) {

	msg = data["ReturnMsg"];
	msg = "<br/></b><i>"+msg+"</i>";

	rm3msg.wait("Loading App ..."+msg, "initRemote();" );
	if (data["ReturnCode"] == "802") { rm3update = true; }
	}

function checkUpdates(version) {

	rm3app.requestAPI("GET",["version",version], "", rm3msg.alertReturn, "wait" );       
	}
	
//--------------------------------
// send add commands
//--------------------------------

function updateRemote(data) {
        rm3remotes.data = data["DeviceConfig"];
        rm3remotes.create();
        }
        
function alertReturn(data) {
        rm3app.requestAPI( "GET", ["list"], "", updateRemote, "wait" );
        rm3app.requestAPI( "GET", ["list"], "", rmDropDownMenu );
        rm3msg.alertReturn(data);
        }
        
//--------------------------------

function changeVisibilityDevice(device_id, value_id) {

        device   = check_if_element_or_value(device_id);
        value    = check_if_element_or_value(value_id);
        
	if (!dataConfig["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' doesn't exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert/select name for device (no space, no special cases)."); return; }
	else if (value == "")   		{ rm3msg.alert("Please insert/select visibility."); return;	}

	rm3app.requestAPI("PUT",["visibility",device,value], "", alertReturn);
	}
	
//--------------------------------

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
	
function addTemplate_exe(device,template) {

	rm3app.requestAPI("PUT",["template",device,template], "", alertReturn);	
	}
	
//--------------------------------

function addDevice(device, description) {
	device 		= document.getElementById(device).value.toLowerCase();
	description 	= document.getElementById(description).value;

	//if (dataConfig["device_list"][device]) 	{ rm3msg.alert("Device '" + device + "' already exists!"); return; }
	if (dataConfig["devices"][device]) 	{ rm3msg.alert("Device '" + device + "' already exists!"); return; }
	else if (device == "") 			{ rm3msg.alert("Please insert name for device (no space, no special cases)."); return; }
	else if (description == "") 		{ rm3msg.alert("Please insert short description for device."); 	return;	}

	rm3app.requestAPI("PUT",["device",device,description], "", alertReturn);
	}

//--------------------------------

function addButton(device_id, button_id) {

        var i=0;

	if (document.getElementById(device_id)) 	{ var device 	= document.getElementById(device_id).value.toLowerCase(); }
	else					        { var device    = device_id; i++; }
	if (document.getElementById(button_id)) 	{ var button 	= document.getElementById(button_id).value.toLowerCase(); }
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
	question = "Do you realy want to delete button '" + button1[1] + "' from '" + device + "'?";

	rm3msg.confirm(question,"deleteButton_exe('" + button + "'); ");
	}

function deleteButton_exe(button) {

        b = button.split("_");
	rm3app.requestAPI("DELETE",["button",b[0],b[1]], "", alertReturn);
	}

//--------------------------------

function deleteDevice(device_id) {

	var device1 = document.getElementById(device_id);

	if (device1.selectedIndex) 	{ var device  = device1.options[device1.selectedIndex].value;	}
	else 				{ var device  = device1.value;	}
	if (device == "")               { rm3msg.alert("Please select device!"); return; }

	var question = "Do you realy want to delete device '" + device + "'?";
	rm3msg.confirm(question,"deleteDevice_exe('" + device + "');");
	}

function deleteDevice_exe(device) {

	rm3app.requestAPI("DELETE",["device",device], "", alertReturn);       
	}


function check_if_element_or_value(name_value) {
        if (name_value == "")                                                                   { console.error("check_if_element_or_value: no value"); return; }
	if (document.getElementById(name_value) && document.getElementById(name_value).value) 	{ return document.getElementById(name_value).value.toLowerCase(); }
	else					                                                { return name_value; }
	}


//--------------------------------------------
// reload, reconnect to device
//--------------------------------------------

function loadRemote(cmd,callback="") {

	rm3app.requestAPI( "GET", [cmd], "", callback );
	}


//----------------------------------
// Commands an APP senden
//----------------------------------

function sendCmd(cmdButton, sync="", callback="") {

        console.warn("use of sendCmd -> try to reduce or eliminate");

	var dc; 	// device & command
	var ee, vv;
	var onoff = false;

	if (cmdButton) {
		// split into device and button

		if (Array.isArray(cmdButton))	{ dc = cmdButton; }
		else				{ dc = cmdButton.split("_"); }

		// Send command only, if device is active (ON), else return
		if ((device_status[dc[0]] == "OFF" && dc[1] != "on-off" && dc[1] != "on" && dc[1] != "off") && (deactivateButton == false)) { 
			show_status("red", showButtonTime);
			return;
			}
		if (dc[1] == "on-off" || dc[1] == "on" || dc[1] == "off") { onoff = true; }
		}
	else {
		// unkar, wofür benötigt ... ?! aber ohne funktionierts auch nicht
		ee = document.getElementById("goSelect");
		vv = ee.options[ee.selectedIndex].value;
		dc = vv.split("_");
		}

	if (deactivateButton) {
		dc = ["sendIR" , dc[0] , dc[1]];
		}
        else {
		dc = ["sendIR_check" , dc[0] , dc[1]];
                }

	// send via app
	if (sync == "sync") 	{
		rm3app.sendCmdSync( dc, callback );
		show_status("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}

	else                	{
		rm3app.sendCmd( dc, callback );
		show_status("green", showButtonTime);
		if (showButton) {setTextById("audio4", cmdButton);}
		}

	// check, if device inactive and change color of buttons (if on/off-button)
	if (onoff) { setTimeout(function(){ check_status_inactive(); }, 3000); }
	}


//----------------------------------
// separate makro into single commands and send commands
//----------------------------------

function sendMakro( makro ) {  // SEND -> FEHLER? obwohl keiner Änderung ...

	rm3msg.wait_small("Please wait ...<br/>");
	console.log( "Send makro: " + makro );
	
	var makro_def = dataAll["DATA"]["makros"];

    	setTimeout(function(){

		// set vars
		var wait  = 0;
		var test = "";
		var list  = makro.split("::");
		var list2 = [];

		// for each key check if it is a "sub-makro" and translate in real commands
		for (var i=0; i<list.length; i++) {
        		// if not a number ...
			if (isNaN(list[i])) {
				var dev = list[i].split("_");

				// if makro for switch on/off a device
				if (dev[0] == "dev-on" || dev[0] == "dev-off" || dev[0] == "makro") {
					// add commands from device makro
					if (dev[1] in makro_def[dev[0]]) {
						var list3 = makro_def[dev[0]][dev[1]];
						for (var a=0; a<list3.length; a++) { list2.push(list3[a]); }
						}
					else { console.error("Did not find makro: " + dev[1]); }
					}
				else {
					// already a command
					list2.push(list[i]);
					}
				}
			else 	{ list2.push(list[i]); } // add existing number
			}

		// for each command execute / for each number wait
		for (var i=0; i<list2.length; i++) {

			test += list2[i] + "\n";
			var last = false;
			if (i == list2.length) { last = true; }

        		// if is not a number, then execute command
			if (isNaN(list2[i])) {
				// split into button and device state to achive
				var button = list2[i].split("||");
				var device = button[0].split("_");
				var send   = true;
				var onoff  = false;

				if (button[1] == "ON" || button[1] == "OFF") {
					// check if device switched ON or OFF
					// if state already reached -> then send = false
					if (button[1] == check_status_dev(device[0])) { send = false; }
					//alert("test "+device[0]+"- on/off: " + check_status_dev(device[0]));
					}
				else if (button[1]) {
					// check if specific mode set (e.g. switch between TV / RADIO with the same button)
					// if state already reached -> then send = false
					if (button[1] == check_status_dev(button[0])) { send = false; }
					//alert("test "+button[0]+"-"+button[1]+": " + check_status_dev(button[0]));
					}

				// check if on/off button then check_status()
				if (device[1] == "on" || device[1] == "off" || device[1] == "on-off") {	onoff = true; }

				if (send && onoff) {
					// send command, if state not already reached and on/off button
					//pausecomp(1000);
					sendCmd(button[0], "sync", check_status); // callback -> check device status
					wait = 0;
					//console.log("-> cmd: "+button[0]);
					}
				else if (send) {
					// send command, if state not already reached
					//pausecomp(1000);
					sendCmd(button[0], "sync"); // "sync" - synchron/sequentiel command execution
					wait = 0;
					//console.log("-> cmd: "+button[0]);
					}
				else {
					// dont sent command, if state already reached
					show_status("yellow", showButtonTime);
					if (showButton) {setTextById("audio4", "<strike>" + button[0] + " (" + button[1] + ")</strike>");}
					//console.log("-> not cmd: "+button[0]);
					}
				}
			// if is a number, then wait number as seconds
			else {
				if (showButton) {setTextById("audio4", "wait:" + list2[i]);}
				wait = list2[i] * 1000;
				if (wait>0) {
					pausecomp(wait);
					wait=wait/1000;
					}
				//console.log("-> wait: "+wait);
				}
			}
		rm3msg.hide();

		// wait ms before starting makro execution
		}, 500 );
	}

// --------------------
// EOF

