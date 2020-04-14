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
		},
	"EN" : {
		"AUDIO_IS_MAIN"			: "This device is defined as main AUDIO device.",
		"AUDIO_SET_AS_MAIN"		: "Set as main AUDIO device (change from &quot;{0}&quot;).",
		"AUDIO_N/A_AS_MAIN"		: "This device can't be set as main AUDIO device, no audio volume control available.",
		"BUTTON_ASK_DELETE"		: "Do you really want to delete the button '{0}' from '{1}'?",
		"BUTTON_ASK_DELETE_NUMBER"	: "Do you really want to delete the button number [{0}] from '{1}'?",
		"BUTTON_INSERT_NAME"		: "Please insert name for button.",
		"BUTTON_RECORD"			: "Record button &quot;{0}&quot; for device &quot;{1}&quot;: click OK and then press button within the next 5 seconds.",
		"BUTTON_SELECT"			: "Please select button.",
		
		"DEVICE_ASK_DELETE"		: "Do you really want to delete device '{0}'?",
		"DEVICE_DONT_EXISTS"		: "Device '{0}' doesn't exists!",
		"DEVICE_EXISTS"			: "Device '{0}' already exists!",
		"DEVICE_INSERT_ID"		: "Please insert ID for device (no special characters).",
		"DEVICE_INSERT_LABEL"		: "Please insert label for device.",
		"DEVICE_INSERT_NAME"		: "Please insert name of device.",
		"DEVICE_SELECT"			: "Please select device.",
		"DEVICE_SELECT_API"		: "Please select API for device.",
		"DEVICE_SELECT_TEMPLATE"	: "Please select template to create remote for device.",
		"DEVICE_SELECT_VISIBLITY"	: "Please select if device should be visible or hidden.",		

		"FORMAT_INCORRECT"		: "format is not correct",
		
		"MANUAL_CHANNEL"		: "<b>Edit Channels:</b><ul>" +
						  "<li>Fill dict for channel definition using the JSON format: " +
						  "<i>&quot;Channel Name&quot; : [ &quot;button&quot;, &quot;button&quot;, &quot;makro&quot;]</i></li>" +
						  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;makro_type&gt;_&lt;button&gt;&quot; to define buttons in channel makro; makro types are: makro, scene-on, scene-off, dev-on, dev-off</li>" +
						  "</ul>",
		"MANUAL_DISPLAY"		: "<b>Edit Display Definition</b><ul>" +
						  "<li>Fill dict for display definition using the JSON format: <i>&quot;Label&quot; : &quot;field_from_device&quot;</i>.</li>" +
						  "</ul>",
		"MANUAL_REMOTE"			: "<b>Edit Device Remote Control:</b><ul>" +
						  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
						  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
						  "<li>Add &quot;DISPLAY&quot; to add a display that show status information (details defined below).</li>" +
						  "<li>Add &quot;.&quot; to add an empty space.</li>" +
						  "</ul>",
		"MANUAL_SCENE"			: "<b>Edit Scene Remote Control:</b><ul>" +
						  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
						  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;makro_type&gt;_&lt;button&gt;&quot; to define buttons in the remote layout; makro types are: makro, scene-on, scene-off, dev-on, dev-off</li>" +
						  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
						  "<li>Add &quot;.&quot; to add an empty space.</li>" +
						  "</ul>",
		
		"MODE_EDIT"			: "Edit Mode",
		"MODE_INTELLIGENT"		: "Intelligent Mode",
		"MODE_MANUAL"			: "Manual Mode",

		"PLEASE_WAIT"			: "Please wait ... .",
		
		"REMOTE_ADD"			: "Add Remote Control",
		
		"SCENE_ASK_DELETE"		: "Do you really want to delete scene '{0}'?",
		"SCENE_EXISTS"			: "Scene '{0}' already exists!",
		"SCENE_INSERT_ID"		: "Please insert ID for scene (no special characters).",
		"SCENE_INSERT_LABEL"		: "Please insert label for scene.",
		"DEVICE_SELECT"			: "Please select scene.",

		"SETTINGS"			: "Settings",

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
