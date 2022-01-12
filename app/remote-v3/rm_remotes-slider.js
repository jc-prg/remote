//-----------------------------------------
// jc://volume-slider/
//-----------------------------------------
// slider for volume control
// requires jc-volume-slider-<version>.css
//-----------------------------------------
/* INDEX
function rmSlider(name)
	this.setOnChange	= function(callOnChange="")
	this.setShowVolume	= function(showVolume="")
	this.sliderHTML	= function(name,label,device,command,min,max,init="")
function jcSlider2 ( name, container )
	this.setOnChange	= function(callOnChange="")
	this.setShowVolume	= function(showVolume="")
	this.init		= function( min, max, label )
		this.slider.oninput		= function( )
		this.slider.onmousedown		= function()
		this.slider.onmouseup		= function()
		this.slider.ontouchstart	= function()
		this.slider.ontouchend		= function()
	this.setPosition	= function(top=false,bottom=false,left=false,right=false)
	this.set_value		= function( value )
	this.show_hide		= function()
	this.info		= function()
		alert("Please define a function to be called on change.")
*/
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
			
		if (init.indexOf("%") > 0)		{ init = init.replace(/%/g,""); }
		if (init != "" && init != "Error")	{ defaultValue = init; }
		else					{ defaultValue = min; }
		
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
	
	}


//-----------------------------------------
// EOF
















