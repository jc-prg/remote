//-----------------------------------------
// jc://volume-slider/
//-----------------------------------------
// slider for volume control
// requires jc-volume-slider-<version>.css
//-----------------------------------------
/* SAMPLE IMPLEMENTATION

var mboxSlider  = new jcSlider( name="mboxSlider", container="audio_slider");	// create slider
mboxSlider.init(min=0,max=100,label=mbox_device);				// set device information
mboxSlider.setPosition(top="45px",bottom=false,left=false,right="10px");	// set position (if not default)
mboxSlider.setOnChange(mboxVolumeSet);						// -> setVolume (api call to set volume -> this.callOnChange( this.value ))
mboxSlider.setShowVolume(mboxVolumeShow);					// -> showVolume e.g. in header

*/
//-----------------------------------------


function rmSlider(name) {
	this.appName      = name;
	this.callOnChange = this.info;
	this.showVolume   = this.info;
	
	// default position
	this.posBottom = false;
	this.posTop    = "50px";
	this.posLeft   = false;
	this.posRight  = "10px";

	// set callback functions
	this.setOnChange	= function(callOnChange="") {
		if (callOnChange != "") { this.callOnChange = callOnChange; }
		else			 { this.callOnChange = this.info; }
		}
		
	this.setShowVolume	= function(showVolume="") {
		if (showVolume != "")	 { this.showVolume = showVolume; }
		else			 { this.showVolume = this.info;  }
		}

	// initial callback functions (info via alert)
	this.setOnChange();
	this.setShowVolume();
		
	this.sliderHTML	= function(name,label,device,command,min,max,init="") {

		var setValueCmd;
		var defaultValue;
			
		if (init.indexOf("%") > 0)          { init = init.replaceAll("%",""); }
		if (init != "" && init != "Error")  { defaultValue = init; }
		else                                { defaultValue = min; }
		
		setValueCmd  = " onInput=\"document.getElementById('"+name+"_value').innerHTML=this.value;\" ";
		setValueCmd += " onMouseUp=\"appFW.requestAPI('GET',[ 'send-data', '"+device+"', '"+command+"', this.value ], '','');\" ";
		setValueCmd += " onTouchEnd=\"appFW.requestAPI('GET',[ 'send-data', '"+device+"', '"+command+"', this.value ], '','');\" ";
	
		this.slider_code   		=  "<div id=\""+name+"_container\" class=\"rm-slidecontainer\" style=\"display:block\">";
		this.slider_code   		+= "<div  id=\""+name+"_label\" class=\"rm-sliderlabel\">"+label+"</div>";
  		this.slider_code   		+= "<input type=\"range\" min=\""+min+"\" max=\""+max+"\" value=\""+defaultValue+"\" class=\"rm-slider\" id=\"slider_"+device+"_"+name+"_input\" "+setValueCmd+">";
 		this.slider_code   		+= "<div id=\""+name+"_value\" class=\"rm-slidervalue\">"+defaultValue+"</div>";
		this.slider_code   		+= "</div>";
		return this.slider_code;
	}

	this.toggleHTML = function(name, label, device, command_on, command_off, init="", disabled=false) {

		var setValueCmd, class_init;
		var setValueCmd_red    = " this.className='rm-slider device_off';   slider.disabled = false; ";
		var setValueCmd_green  = " this.className='rm-slider device_on';    slider.disabled = false; ";
		var setValueCmd_gray   = " this.className='rm-slider device_undef'; slider.disabled = true;";
		var setValueCmd_set    = " this.className='rm-slider device_set'; ";
		var defaultValue;

		var value_key          =    name.split("_");
		if (value_key.length > 1)   { value_key = value_key[1]; }
		else                        { value_key = name; }
		if (disabled)               { input_disabled = "disabled"; }
		else                        { input_disabled = ""; }

        var setCmdOn             = "if (document.getElementById('toggle_"+device+"_"+value_key+"_value').value==1) ";
        setCmdOn                += "{ apiCommandSend('"+command_on+"','','','toggle'); }";
        setCmdOn                += " else ";
        setCmdOn                += "{ apiCommandSend('"+command_off+"','','','toggle'); } ";

        var setCmdOnClick        = "if(this.value==0) { "+setValueCmd_set+" } ";
        setCmdOnClick           += "else { "+setValueCmd_set+" };document.getElementById('toggle_"+device+"_"+value_key+"_value').value=this.value;"+setCmdOn;

//        setCmdOnClick           += "alert(this.value+'|'+document.getElementById('toggle_"+device+"_"+value_key+"_value').value+'|'+document.getElementById('toggle_"+device+"_"+value_key+"_last_value').value);";

		var setValueCmd          = " onClick=\""+setCmdOnClick+"\" ";
		setValueCmd             += " onTouchEnds=\""+setCmdOnClick+"\" ";

        if (init == "")       { defaultValue = "0";  class_init = "device_undef"; }
        else if (init == "1") { defaultValue = init; class_init = "device_on"; }
        else if (init == "0") { defaultValue = init; class_init = "device_off"; }

		this.toggle_code   		=  "<div id=\"toggle_"+name+"_container\" class=\"rm-slidecontainer\" style=\"display:block\">";
        this.toggle_code   		+= "<input type=\"range\" min=\"0\" max=\"1\" value=\""+defaultValue+"\" class=\"rm-slider "+class_init+"\" id=\"toggle_"+device+"_"+value_key+"_input\" " + setValueCmd +" " + input_disabled + ">";
  		this.toggle_code        += "<input id=\"toggle_"+device+"_"+value_key+"_value\" value=\""+defaultValue+"\" style=\"display:none\">";
  		this.toggle_code        += "<input id=\"toggle_"+device+"_"+value_key+"_last_value\" value=\""+defaultValue+"\" style=\"display:none\">";
		this.toggle_code   		+= "</div>";
		return this.toggle_code;
	}

	}
















