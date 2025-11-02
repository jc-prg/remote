//--------------------------------------
// jc://app-framework/, (c) Christoph Kloth
//--------------------------------------
// multi-language support (implementation just started)
//--------------------------------------
// language_app[LANG][<param>]
// add your app specific translations

var language_app = {
    "DE" : {
        "CONNECTION_ERROR"          : "Verbindungsproblem",
        "CONNECTION_DISABLED"       : "API deaktiviert",
        "RESET_SWITCH_OFF"          : "Reset Devices:<br/>vorher alle Geräte ausschalten.",
        "RESET_VOLUME_TO_ZERO"      : "Reset Audio Settings:<br/>vorher alle Receiver mit Audio auf Mininum (0) einstellen.",

        "POWER_DEVICE_OFF"             : "Schalte zuerst den Strom für das Gerät ein. {0}",
        "POWER_DEVICE_OFF_SCENE"       : "Schalte über den Toggle oben rechts den Strom für das Gerät ein. {0}",
        "POWER_DEVICE_OFF_SCENE_INFO"  : "<b>Kein Strom:</b> Schalte den Strom über den Toggle oben rechts ein.",

        "STATUS_DEV_OK"             : "Das Gerät <b>{0}</b> ist in Ordnung.",
        "STATUS_DEV_POWER_OFF"      : "Der Strom für <b>{0}</b> ist ausgeschaltet.",
        "STATUS_DEV_ERROR"          : "Beim Gerät <b>{0}</b> ist ein Fehler aufgetreten. {1}",
        "STATUS_DEV_API_DISABLED"   : "Die API <b>{0}</b> für das Gerät <b>{1}</b> wurde deaktiviert.",
        "STATUS_DEV_API_ERROR"      : "Bei der API <b>{0}</b> und dem angeschlossene Gerät <b>{1}</b> ist ein Fehler aufgetreten. {2}",
        "STATUS_DEV_OTHER_ERROR"    : "Es ist ein unbekannter Fehler beim Gerät <b>{0}</b> aufgetreten."
        },
    "EN" : {
        "ADD_ELEMENTS"          : "Add elements",
        "ADD_DISPLAY"           : "Add display",
        "ADD_SCENE"             : "Add scene",
        "ADD_REMOTE"            : "Add remote",
        "ADD_DEVICE"            : "Add device",
        "ADD_LINE"              : "Add simple line",
        "ADD_EMPTY"             : "Add empty field",

        "AUDIO_IS_MAIN"         : "This device is defined as main AUDIO device.",
        "AUDIO_SET_AS_MAIN"     : "Set as main AUDIO device (change from &quot;{0}&quot;).",
        "AUDIO_N/A_AS_MAIN"     : "This device can't be set as main AUDIO device, no audio volume control available.",
        
        "API"                   : "API",
        "API_INTERFACE"         : "API / API-Device",
        "API_COMMANDS"          : "API commands",
        "API_COMMANDS_TEST"     : "API commands - manual testing",
        "API_INFORMATION"       : "API information",
        "API_SELECT_CMD"        : "API command or use your own ...",
        "API_INFO"              : "API info",
        "API_DEVICE_NOT_CONNECTED"   : "API device {0} not connected",
        "API_NOT_CONNECTED"          : "API {1} not connected",
        "API_SETTINGS"          : "API settings",
        "API_TEST"              : "API test",

        "BUTTON_ASK_DELETE"     : "Do you really want to delete the button '{0}' from '{1}'?",
        "BUTTON_ASK_DELETE_NUMBER" : "Do you really want to delete the button number [{0}] from '{1}'?",
        "BUTTON_INSERT_NAME"    : "Please insert name for button.",
        "BUTTON_RECORD"         : "Record button &quot;{0}&quot; for device &quot;{1}&quot;: click OK and then press button within the next 5 seconds.",
        "BUTTON_SELECT"         : "Please select button.",
        "BUTTON_INFOS"          : "Button Information",
        
        "BUTTON_T"              : "button",
        "BUTTON_T_ADD"          : "add",
        "BUTTON_T_CLONE"        : "clone",
        "BUTTON_T_COLORPICKER"  : "color picker",
        "BUTTON_T_COLOR"        : "color model",
        "BUTTON_T_CREATE"       : "create",
        "BUTTON_T_DEL"          : "delete button",
        "BUTTON_T_DELETE"       : "delete",
        "BUTTON_T_DEL_VALUE"    : "delete value",
        "BUTTON_T_DESCRIPTION"  : "description",
        "BUTTON_T_DEVICE"       : "device",
        "BUTTON_T_DISPLAY"      : "add display",
        "BUTTON_T_DISPLAY_VALUE": "display value",
        "BUTTON_T_EMPTY"        : "empty field",
        "BUTTON_T_HEADER"       : "header image",
        "BUTTON_T_KEYBOARD"     : "keyboard",
        "BUTTON_T_LINE"         : "line",
        "BUTTON_T_LINE_TEXT"    : "line with text",
        "BUTTON_T_MINMAX"       : "min-max",
        "BUTTON_T_MOVE2REMOTE"  : "move to remote",
        "BUTTON_T_PREVEW"       : "preview",
        "BUTTON_T_RESET"        : "reset",
        "BUTTON_T_SAVE"         : "save",
        "BUTTON_T_STOP_EDIT"    : "stop editing",
        "BUTTON_T_SEND"         : "send-command",
        "BUTTON_T_SHOW_HIDE"    : "show/hide",
        "BUTTON_T_SLIDER"       : "slider",
        "BUTTON_T_TEMPLATE"     : "template",
        "BUTTON_T_OTHER"        : "other button",
        "BUTTON_T_PARAMETER"    : "parameter",
        "BUTTON_T_PREVIEW"      : "preview",
        "BUTTON_T_VALUE"        : "add value",
        "BUTTON_T_TRY"          : "try",
        "BUTTON"                : "button",
        "BUTTONS"               : "buttons",

        "CHANNEL_USE_JSON"      : "Please use JSON to edit the channel list.",
        "CHANGE_ORDER"          : "Change order of remote controls",
        "CHANGE_ORDER_SCENES"   : "Change order of scenes",
        "CHANGE_ORDER_DEVICES"  : "Change order of devices",
        "CHANGE_MODES"          : "Change working modes",
        "CHANNEL"               : "channel",

        "CONNECTION_ERROR"      : "Connection Error",
        "CONNECTION_POWER_OFF"  : "Power Off",
        "CONNECTION_DEVICE_OFF" : "Device Off",
        "CONNECTION_MANUAL"     : "Manual Mode",
        "CONNECTION_DISABLED"   : "API Disabled",
        "CONNECTED"             : "connected",

        "COLORPICKER_SELECT_CMD" : "Select command, to insert color picker.",
        "COLORPICKER_N/A"       : "Color picker not supported",
        
        "CONFIG_INTERFACE"      : "Interface-Config",
        "CONFIG_REMOTE"         : "Remote-Config",
        "COMMANDS"              : "Commands",
        
        "COMMAND_DELETE_INFO"   : "When deleted you can record a command for a button again.",
        "COMMAND_RECORD_INFO"   : "Undefined buttons are colored blue. Click to record an IR command for those buttons.",
        
        "DESCRIPTION"           : "Description",
        
        "DELETE"                : "delete",
        "DELETE_ELEMENTS"       : "Delete elements",
        "DELETE_COMMAND"        : "Delete command",

        "DEVICE"                : "Device",
        "DEVICE_ASK_DELETE"     : "Do you really want to delete device '{0}'?",
        "DEVICE_DONT_EXISTS"    : "Device '{0}' doesn't exists!",
        "DEVICE_EXISTS"         : "Device '{0}' already exists!",
        "DEVICE_INSERT_ID"      : "Please insert ID for device (no special characters).",
        "DEVICE_INSERT_LABEL"   : "Please insert label for device.",
        "DEVICE_INSERT_NAME"    : "Please insert name of device.",
        "DEVICE_SELECT"         : "Please select device.",
        "DEVICE_SELECT_API"     : "Please select API for device.",
        "DEVICE_SELECT_TEMPLATE"   : "Please select template to create remote for device.",
        "DEVICE_SELECT_VISIBILITY" : "Please select if device should be visible or hidden.",
        "DEVICES"                  : "devices",
        "DEVICES_NOT_CONNECTED"    : "Devices not connected",

        "DISPLAY"                : "display",
        "DISPLAY_EXISTS"         : "Display active for this remote.",
        "DISPLAY_LABEL_SELECT"   : "Select label to be deleted in the display.",
        "DISPLAY_LABEL_DONT_EXIST" : "Selected label doesn't exist in display definition.",
        "DISPLAY_VALUE_SELECT"   : "Select device and value to be added in the display.",
        "DISPLAY_LABEL_ADD"      : "Insert label for the additional value in the display.",
        "DISPLAY_LABEL_EXISTS_ALREADY" : "Label already exists in the display.",
        "DISPLAY_NOT_ADDED"      : "No display added yet. Changes below will have no effect.",
        
        "EDIT"                   : "edit",
        "EDIT_ADD_DISPLAY"       : "Add and edit display",
        "EDIT_DEVICE"            : "Edit device",
        "EDIT_DEVICES"           : "Edit devices",
        "EDIT_DISPLAY"           : "Edit display",
        "EDIT_ELEMENTS"          : "Edit elements",
        "EDIT_JSON"              : "Edit JSON",
        "EDIT_INTERFACES"        : "Edit interfaces",
        "EDIT_INTERFACE"         : "Edit interface configuration for {0}",
        "EDIT_MACROS"            : "Edit macros",
        "EDIT_REMOTE"            : "Edit remote",
        "EDIT_REMOTES"           : "Edit remotes",
        "EDIT_SCENE"             : "Edit scene",
        "EDIT_SCENES"            : "Edit scenes",

        "EXTERNAL_ID"            : "External ID",
        "ERROR_UNKNOWN"          : "Unknown error",

        "FORMAT_INCORRECT"       : "format is not correct",
        "FAVICON_INFO"           : "Select a different favicon or apple-icon. <i>Note:</i> this selection at the moment is temporary only - " +
                                   "select and save WebApp to Home-Screen to use a specific apple-icon.",
        
        "GET_DATA"               : "Get data",
        "GET_AVAILABLE_COMMANDS" : "List commands",

        "HEADER"                : "header",
        "HEADER_IMAGE_EXISTS"   : "There is already a HEADER-IMAGE in this remote control.",
        
        "ID"                    : "ID",
        "IMAGE"                 : "Image",
        "INFO"                  : "info",
        "INTERFACES"            : "Interfaces",
        "INTERFACE_STATUS"      : "Interface Status",

        "JSON_EDIT"             : "Edit JSON data",
        "JSON_CHANNEL"          : "JSON channel macros",
        "JSON_DISPLAY"          : "JSON display information",
        "JSON_DEVICE"           : "JSON required devices",
        "JSON_REMOTE"           : "JSON remote control",
        "JSON_SCENE_MACROS"     : "JSON scene macros",
        "JSON_DEVICE_MACROS"    : "JSON device macros",
        "JSON_REMOTE_MACROS"    : "JSON macros (ON|OFF)",

        "JSON_REQUIRED_DEVICES"        : "Required devices",
        "JSON_EDIT_RMC_DEFINITION"     : "Edit remote control definition",
        "JSON_EDIT_DISPLAY_DEFINITION" : "Edit display definition",
        "JSON_EDIT_CHANNEL_MACROS"     : "Edit channel macros",
        "JSON_EDIT_MACRO_SCENE"        : "Edit macros SCENE",
        "JSON_EDIT_MACRO_SCENE_OTHER"  : "Edit scene macros",

        "LABEL"                 : "Label",

        "LOAD_TEMPLATE"         : "Load template",

        "MACRO"                 : "macro",
        "MACROS"                : "macros",
        "MACRO_PLEASE_WAIT"     : "Executing commands, please wait a few seconds!",
        "MACRO_DEVICE_EDIT"     : "<p>Just for information; edit macros in the <u style='cursor:pointer;' onclick='rm3settings.create(\"edit_scenes\");'>scene settings</u> ...<br/></p>",

        "MAIN"                  : "main",
        "MAIN_SETTINGS"         : "Main settings",
        "MANUAL"                : "manual",

        "MANUAL_ADD_ELEMENTS"   : "<h4>Add elements</h4><p>Here you can add different new elements to the remote control. All new elements will be added at the end of the remote control and can be moved up using the tool tip.</p>",
        "MANUAL_ADD_TEMPLATE"   : "<h4>Load template</h4><p>By loading a template you will overwrite the existing remote definition.</p>",

        "MANUAL_CHANNEL"        : "<i>Edit Channels:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill dict for channel definition using the JSON format: " +
                                  "<i>&quot;Channel Name&quot; : [ &quot;button&quot;, &quot;button&quot;, &quot;macro&quot;]</i></li>" +
                                  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; to define buttons in channel macro; macro types are: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "</ul>",
        "MANUAL_DEVICES"        : "<i>Edit Devices for Scene</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of included devices using the JSON format: [&quot;device_id&quot;,&quot;device_id&quot;]</i>.</li>" +
                                  "</ul>",
        "MANUAL_DISPLAY"        : "<i>Edit Display Definition</i><br/><br/><ul class='help'>" +
                                  "<li>Fill dict for display definition using the JSON format: <i>&quot;Label&quot; : &quot;field_from_device&quot;</i>.</li>" +
                                  "<li>If &quot;auto_off&quot; is defined for the device (check JSON file), use &quot;auto-power-off&quot; as field to show the time till the devices automatically switches of.</li>" +
                                  "</ul>",
        "MANUAL_REMOTE"         : "<i>Edit Device Remote Control:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
                                  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
                                  "<li>Add &quot;DISPLAY&quot; to add a display that show status information (details defined below).</li>" +
                                  "<li>Add &quot;SLIDER||send-&lt;command&gt;||&lt;description&gt;||&lt;min&gt;-&lt;max&gt;||&lt;parameter&gt;&quot; to add a slider input element.</li>" +
                                  "<li>Add &quot;COLOR-PICKER||send-&lt;command&gt;&quot; to add an input element to select a color.</li>" +
                                  "<li>Add &quot;.&quot; to add an empty space.</li>" +
                                  "</ul>",
        "MANUAL_SCENE"          : "<i>Edit Scene Remote Control:</i><br/><br/><ul class='help'>" +
                                  "<li>Fill array of button names using the JSON format, four buttons per row.</li>" +
                                  "<li>Use &quot;&lt;device_id&gt;_&lt;button&gt;&quot; or &quot;&lt;macro_type&gt;_&lt;button&gt;&quot; to define buttons in the remote layout; macro types are: macro, scene-on, scene-off, dev-on, dev-off</li>" +
                                  "<li>Add &quot;.&quot; to add an empty space.</li>" +
                                  "<li>Add &quot;LINE&quot; to add a horizontal line and &quot;LINE||description&quot; to add a line with text.</li>" +
                                  "<li>Add &quot;HEADER-IMAGE&quot; to add an image. The image can be selected in the scene settings.</li>" +
                                  "<li>Add &quot;TOGGLE||&lt;device&gt;_&lt;value&gt;||&lt;description&gt;||&lt;command_on&gt;||&lt;command_off&gt;&quot; to add a toggle."+
                                  " This is supported for values with ON|OFF or TRUE|FALSE only." +
                                  " If the toggle shall be integrated into the header image, place it directly below the &quot;HEADER-IMAGE&quot; and use &quot;HEADER-IMAGE||toggle&quot;.</li>" +
                                  "<li>Add &quot;SLIDER||send-&lt;value&gt;||&lt;description&gt;||&lt;range-from&gt;-&lt;range-to&gt;||&lt;value&gt;&quot; to add a slider."+
                                  " This is support for devices with query mode and if a number can be send via API." +
                                  "</ul>",
        "MANUAL_MACROS"            : "<h4>Edit Macros:</h4><ul class='help'>" +
                                  "<li>Here you can define macros using the JSON format. Macros can consist out of buttons from any defined remote control and integers for seconds to wait.</li>" +
                                  "<li><i>Important:</i> When you safe, there will be a generic check if the JSON format is correct. Please ensure, the required data structure is used as described below.</li>" +
                                  "<li><u>Groups (implementation in progress)</u>: combines several similar devices to a group to use the same buttons or commands for all devices at the same time."+
                                  "<br/><i>-&gt; Format:</i> \"&lt;group_id&gt;\" : {\"description\": \"&lt;description&gt;\", \"devices\": [\"&lt;device_01&gt;\",\"&lt;device_02&gt;\"]} </li>" +
                                  "<li>Groups can be used in all scenes (not in devices): 'group_&lt;button&gt;'.</li>" +
                                  "<li><u>Macro type DEV-ON</u>: macros to switch a device on/off, e.g., switch on and set initial volume (to be edited also in the respective device settings)."+
                                  "<br/><i>-&gt; Format:</i>  \"&lt;device&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\",] </li>" +
                                  "<li><u>Macro type DEV-OFF</u>: macros to switch a device off (to be edited also in the respective device settings)." +
                                  "<br/><i>-&gt; Format:</i>  \"&lt;device&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\",] </li>" +
                                  "<li><u>Global macros</u>: all other macros."+
                                  "<br/><i>-&gt; Format:</i> \"&lt;macro&gt;\" : [\"&lt;device&gt;_&lt;button&gt;||&lt;value&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +

                                  "<li>Macros can be used in all scenes (not in devices): 'macro_&lt;macro&gt;', 'dev-on_&lt;device&gt;', 'dev-off_&lt;device&gt;'. Note: if in the scene a macro with the same name is defined, the scene macro is used.</li>" +
                                  "<li>Start with &quot;WAIT-xx&quot; in a macro to show a message that it's necessary to wait for xx seconds</li>" +
                                  "<li>For devices without API (method=record) use e.g. \"&lt;button&gt;||set-&lt;value&gt;\" to set a value without sending the command. This can be useful if you work with wifi controlled outlets and a device always start in mode \"ON\".</li>" +
                                  "</ul>",
        "MANUAL_MACROS_SCENE"   : "<i>Edit Macros for this scene:</i><br/><br/><ul class='help'>" +
                                  "<li>Define macros using the JSON format. Combine buttons from any defined device, global macros, and integers for seconds to wait.</li>" +
                                  "<li><u>Macro type SCENE ON</u>: add here all buttons / commands to switch all devices of this scene on, set input channels and similar. Use the macro as \"scene-on\" in the remote definition."+
                                  "<br/><i>-&gt; Format:</i> [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +
                                  "<li><u>Macro type SCENE OFF</u>: add here all buttons / commands to switch all devices of a scene off. Use the macro as \"scene-off\" in the remote definition."+
                                  "<br/><i>-&gt; Format:</i> [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"] </li>" +
                                  "<li><u>Other scene macros</u>: add here all buttons / commands to create another macro for this scene."+
                                  "<br/><i>-&gt; Format:</i> {\"&lt;macro_name&gt;\" : [\"&lt;device&gt;_&lt;button&gt;\", 2, \"dev-on_&lt;device&gt;\"]}</li>" +
                                  "<li>Use the command &quot;WAIT-xx&quot; in a macro to show a message that it's necessary to wait for xx seconds</li>" +
                                  "<li>For devices without API (method=record) use e.g. \"&lt;button&gt;||set-&lt;value&gt;\" to set a value without sending the command. This can be useful if you work with wifi controlled sockets and a device always start in mode \"ON\".</li>" +
                                  "</ul>",

        "METHOD"                : "Method",
                          
        "MISSING_DATA"          : "Data are missing for '{0}'.<br/>Check files '{1}' and '{2}' in data directory.",
        "MISSING_DATA_SCENE"    : "Data are missing for '{0}'.<br/>Check file '{1}' in data directory.",
        
        "MODE_SHOW_BUTTON"      : "Show button code",
        "MODE_EDIT"             : "Edit mode",
        "MODE_INTELLIGENT"      : "Intelligent mode",
        "MODE_MANUAL"           : "Manual mode",

        "MSG_ONLY_ONE_COLOR_PICKER"    : "This color picker already exists in the remote control, only one is possible.",
        
        "NOT_USED"                     : "not used in remote control",
        "NO_DEVICE_CONNECTED"          : "no device connected",

        "OFFLINE"                      : "Offline",

        "PLEASE_WAIT"                  : "Please wait ... .",
        
        "PREVIEW"                      : "Preview",
        "POWER_DEVICE_OFF"             : "Switch on the power device first. {0}",
        "POWER_DEVICE_OFF_SCENE"       : "Switch on the power device using the toggle in the header. {0}",
        "POWER_DEVICE_OFF_SCENE_INFO"  : "<b>Power Off:</b> Use the toggle in the header to switch on.",

        "QUICK_ACCESS"                 : "Quick Access",

        "RECONNECT"                    : "Reconnect",
        "RECORD_COMMAND"               : "Record command",
        "RECORD_DELETE_COMMANDS"       : "Record / delete commands",
        "REMOTE"                       : "remote",
        "REMOTE_ADD"                   : "Add remote controls",
        "REMOTE_CONFIG_ERROR"          : "Error in remote config file(s) '{0}': ",
        "REMOTE_CONFIG_ERROR_UNKNOWN"  : "Unknown error in remote config file(s) '{0}'",
        "RELOAD_TAKES_LONGER"          : "Reload takes longer than expected ...",
        "RELOAD_TAKES_MUCH_LONGER"     : "Reload takes longer than much expected ...",
        "RESET_SWITCH_OFF"             : "Reset devices:<br/>switch off all devices before.",
        "RESET_VOLUME_TO_ZERO"         : "Reset audio settings:<br/>set the volume of all audio devices to mininum (0) before.",

        "SAVE"                         : "Save",

        "SCENE"                        : "scene",
        "SCENE_CONFIG_ERROR"           : "Error in scene config file(s) '{0}': ",
        "SCENE_CONFIG_ERROR_UNKNOWN"   : "Unknown error in scene config file(s) '{0}'",

        "SCENE_ASK_DELETE"             : "Do you really want to delete scene '{0}'?",
        "SCENE_EXISTS"                 : "Scene '{0}' already exists!",
        "SCENE_IMAGE"                  : "Scene image",
        "SCENE_INSERT_ID"              : "Please insert ID for scene (no special characters).",
        "SCENE_INSERT_LABEL"           : "Please insert label for scene.",
        "SCENE_SELECT"                 : "Please select scene.",

        "SEND_DATA"                    : "Send data",
        "SELECT"                       : "Select",
        "SELECT_DEV_MACRO"             : "select device or macro",
        "SELECT_DEV_FIRST"             : "select device first",
        "SELECT_API_FIRST"             : "select interface first",
        "SERVER_SETTINGS"              : "Server &amp; client settings",
        "SETTINGS"                     : "Settings",
        "SETTINGS_GENERAL"             : "General settings",
        "SETTINGS_REMOTE"              : "Remote Control Settings",
        "SETTINGS_DEVICES"             : "Device Settings",
        "SETTINGS_API"                 : "API Settings",
        "SETTINGS_MACROS"              : "Global Macros &amp; Groups",
        "SETTINGS_SCENES"              : "Scene Settings",
        "SETTINGS_TIMER"               : "Timer Settings",

        "SLIDER"                       : "slider",
        "SLIDER_SELECT_CMD"            : "Select command, to insert slider.",
        "SLIDER_SELECT_PARAM"          : "Select parameter, to insert slider.",
        "SLIDER_INSERT_DESCR"          : "Insert description, to insert slider.",
        "SLIDER_INSERT_MINMAX"         : "Insert minimum and maximum value (min-max), to insert slider.",
        "SLIDER_N/A"                   : "Slider not supported",

        "STATUS_DEV_OK"                : "Device <b>{0}</b> is OK.",
        "STATUS_DEV_POWER_OFF"         : "Power device <b>{0}</b> is switched off.",
        "STATUS_DEV_ERROR"             : "An error occurred for device <b>{0}</b>. {1}",
        "STATUS_DEV_API_DISABLED"      : "The API <b>{0}</b> for the device <b>{1}</b> has been disabled.",
        "STATUS_DEV_API_ERROR"         : "An API error occurred for <b>{0}</b> and the connected device <b>{1}</b>. {2}",
        "STATUS_DEV_OTHER_ERROR"       : "Unknown error occurred for the device <b>{0}</b>.",

        "TEXT_INPUT"                   : "Text input",
        "TEMPLATE"                     : "template",
        "TEMPLATE_OVERWRITE"           : "Do you really want overwrite buttons of '{0}' with template '{1}'?",
        "TEST_DEVICE_COMMANDS"         : "Test here your commands for device {0}.",
        "TRY_OUT"                      : "try out",

        "TOGGLE"                       : "toggle",
        "TOGGLE_SELECT_DEVICE"         : "Select a toggle device.",
        "TOGGLE_SELECT_DESCR"          : "Define a description for the toggle.",
        "TOGGLE_SELECT_VALUE"          : "Select a value field for the toggle.",
        "TOGGLE_SELECT_ON"             : "Select a switch ON command for the toggle.",
        "TOGGLE_SELECT_OFF"            : "Select a switch OFF command for the toggle.",

        "VERSION_AND_STATUS"           : "Version and Status Information",

        "WORKING_MODES"                : "Working modes",
        }
    }

// -------------------------------------
// EOF
