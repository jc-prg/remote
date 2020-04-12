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
		"BUTTON_ASK_DELETE"		: "Do you really want to delete the button '{0}' from '{1}'?",
		"BUTTON_ASK_DELETE_NUMBER"	: "Do you really want to delete the button number [{0}] from '{1}'?",
		"BUTTON_INSERT_NAME"		: "Please insert name for button.",
		"BUTTON_RECORD"			: "Record button &quot;{0}&quot; for device &quot;{1}&quot;: click OK and then press button within the next 5 seconds."
		"BUTTON_SELECT"			: "Please select button.",
		
		"DEVICE_ASK_DELETE"		: "Do you really want to delete device '{0}'?",
		"DEVICE_DONT_EXISTS"		: "Device '{0}' doesn't exists!",
		"DEVICE_EXISTS"			: "Device '{0}' already exists!",
		"DEVICE_INSERT_ID"		: "Please insert ID for device (no special cases).",
		"DEVICE_INSERT_LABEL"		: "Please insert label for device.",
		"DEVICE_INSERT_NAME"		: "Please insert name of device.",
		"DEVICE_SELECT"			: "Please select device.",
		"DEVICE_SELECT_API"		: "Please select API for device.",
		"DEVICE_SELECT_TEMPLATE"	: "Please select template to create remote for device.",
		"DEVICE_SELECT_VISIBLITY"	: "Please select if device should be visible or hidden.",

		"FORMAT_INCORRECT"		: "format is not correct",
		
		"PLEASE_WAIT"			: "Please wait ... .",

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
