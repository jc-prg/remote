//--------------------------------
// jc://remote/
//--------------------------------
// (c) Christoph Kloth
// Build standard Remote Controls
//-----------------------------
/* INDEX:
function rmRemoteKeyboard(name)
	this.set_device	= function ( device )
	this.input		= function ()
	this.toggle_cmd	= function ()
	this.input_toggle	= function ()
	this.update		= function ()
	this.send		= function ()
*/
//--------------------------------


function rmRemoteKeyboard(name) {

	this.app_name = name;
	this.logging  = new jcLogging(this.app_name);
	
	this.set_device	= function ( device ) {
		this.active_name = device;
		this.logging.default("Set device name for remote keyboard: "+this.active_name);
		}
                
	this.input		= function () {
		var cmd_update  = this.app_name + ".update();";
		var cmd_send    = this.app_name + ".send();";		
		var cmd_enter   = "if (event.keyCode==13) {"+cmd_send+"}";
		var remote      = "<center><div id='"+this.app_name+"_keyboard' class='remote-keyboard'><br/>";
		remote         += "<input id='"+this.app_name+"_keyboard_input' onkeypress='"+cmd_enter+"' oninput='"+cmd_update+"' type='text' style='width:80%;font-size:18px;'>&nbsp;";
		remote         += "<button onclick=\""+cmd_send+"\">&nbsp;&gt;&nbsp;</button></div></center>";
		return remote;
		}
        
	this.toggle_cmd	= function () {
		return this.app_name+'.input_toggle();';
		}
        
	this.input_toggle	= function () {
	alert(this.app_name+"_keyboard_input");
		input      = document.getElementById(this.app_name+"_keyboard");
		input_text = document.getElementById(this.app_name+"_keyboard_input");
		if (input.style.display == "block")	{ input.style.display = "none";  input_text.blur(); input_text.value = ""; }
		else					{ input.style.display = "block"; input_text.focus(); }
		}
        
	this.update		= function () {
		this.logging.default("Update text via keyboard: "+this.active_name);
	
		if (this.kupdate) { return; }
		this.kupdate = true;
		input = document.getElementById(this.app_name+"_keyboard_input").value;
		appFW.requestAPI('GET',[ 'send-data', this.active_name, 'send-text', input ], '','');
		this.kupdate = false;
		}

	this.send		= function () {
		input = document.getElementById(this.app_name+"_keyboard_input").value;
		appFW.requestAPI('GET',[ 'send-data', this.active_name, 'send-text-enter', input ], '','');
		}

	}

//--------------------------------
// EOF
