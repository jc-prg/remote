//--------------------------------------
// jc://music-box/, (c) Christoph Kloth
//--------------------------------------
// multi-language support (implementation just started)
//--------------------------------------
// language[LANG][<param>]
// lang(<param>);

var LANG     = "EN";
var language = {
	"DE" : {
		"FORMAT_INCORRECT" : "Format nicht korrekt",
		},
	"EN" : {
		"DEVICE_EXISTS"			: "Device '{0}' already exists!",
		"DEVICE_DONT_EXISTS"		: "Device '{0}' doesn't exists!",
		"FORMAT_INCORRECT"		: "format not correct",
		"INSERT_DEVICE_ID"		: "Please insert ID for device (no special cases).",
		"INSERT_DEVICE_LABEL"		: "Please insert label for device.",
		"INSERT_DEVICE_NAME"		: "Please insert name of device.",
		"SELECT_DEVICE_API"		: "Please select API for device.",
		"SELECT_DEVICE_VISIBLITY"	: "Please select if device should be visible or hidden.",
		}
	}

// -------------------------------------

function lang( param, replace_data=[] ) {
	var string = "";

	if (language[LANG][param]) 	 { string = language[LANG][param]; }
        else if (language["EN"][param])  { string = language["EN"][param]; }
        else if (language["DE"][param])  { string = language["DE"][param]; }
	else { return "<font color='red'>Translation not found</font>"; }
	
	for (var i=0;i<replace_data.length;i++) {
		string = string.replace( "{"+i+"}", replace_data[i] );
		}
		
	return string;
	}
	
// -------------------------------------
// EOF
