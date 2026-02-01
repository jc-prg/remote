# Development notes (incl. backlog)

* .... release v3.0.x

## KNOWN BUGS -------------------------------------------------------------------

* weather ... if timeout, signal and don't deliver data ... until control next reconnect / data collection (just return an error)
* confirm message reconnect single devices -> asks for "all devices"
* error ... vermutlich "Strom Medientechnik"?! Nach reconnect zunächst wieder OK

      01/26 22:52:07 | ERROR    api-P100    | EXCEPTION in API-Addon for Tapo-Link P100 (APIaddOn.get_info()): <class 'KeyError'> | 'result'
      File "/usr/src/app/server/interfaces/api_p100.py", line 308, in get_info
      self.info_answer = self.api.getDeviceInfo()
      ~~~~~~~~~~~~~~~~~~~~~~^^
      File "/usr/src/app/server/interfaces/p100/PyP100.py", line 284, in getDeviceInfo
      decryptedResponse = self.tpLinkCipher.decrypt(r.json()["result"]["response"])

* error ...

      01/26 18:02:49 | ERROR    api         | Could not get command: Connect.get_command('ZIGBEE2MQTT','queries','sensor4','power')
      01/26 18:02:49 | ERROR    api         | {'api_commands': {'permit-join': "request/permit_join={'value': true, 'time': 120}", 'restart-api': 'request/restart='}, 'buttons': {'off': "set={'state': 'OFF'}", 'on': "set={'state': 'ON'}", 'toggle': "set={'state': 'TOGGLE'}", 'l1-off': "set={'state_l1': 'OFF'}", 'l1-on': "set={'state_l1': 'ON'}", 'l1-toggle': "set={'state_l1': 'TOGGLE'}", 'l2-off': "set={'state_l2': 'OFF'}", 'l2-on': "set={'state_l2': 'ON'}", 'l2-toggle': "set={'state_l2': 'TOGGLE'}"}, 'commands': {'availability': {'cmd': ['get'], 'get': 'get=availability', 'type': 'enum', 'values': ['online', 'offline']}, 'api-last-answer': {'cmd': ['get'], 'get': 'get=api-last-answer'}, 'link-quality': {'cmd': ['get'], 'get': 'get=linkquality'}, 'power': {'cmd': []}, 'state': {'cmd': ['get', 'set'], 'get': 'get=state', 'set': "get={'state': '{DATA}'}", 'type': 'enum', 'values': ['ON', 'OFF']}, 'device-info': {'cmd': ['get'], 'get': 'get=device-info'}, 'device-configuration': {'cmd': ['get'], 'get': 'get=device-configuration'}, 'device-features': {'cmd': ['get'], 'get': 'get=device-features'}, 'l1-power': {'cmd': ['get', 'set'], 'get': 'get=state_l1', 'set': "get={'state_l1': '{DATA}'}", 'type': 'enum', 'values': ['ON', 'OFF']}, 'l2-power': {'cmd': ['get', 'set'], 'get': 'get=state_l2', 'set': "get={'state_l2': '{DATA}'}", 'type': 'enum', 'values': ['ON', 'OFF']}}, 'query': {'load_intervals': {'10': ['l1-power', 'l2-power']}, 'load_default': 30, 'load_after': ['on', 'off', 'toggle'], 'load_never': ['device-info', 'device-features', 'device-configuration']}, 'description': 'API for ZigBee Devices', 'method': 'query'}

* observation: if remote is disabled due to power_off and then enabled -> power buttons are still displayed like disabled (but are still usable)
* add reconnect trigger for some cases ... maybe add a delay time of e.g. 30s?!
* Error TAPO P100 - no bad consequences?!

      01/26 05:17:46 | ERROR    api-P100    | EXCEPTION in API-Addon for Tapo-Link P100 (APIaddOn.get_info()): <class 'requests.exceptions.ConnectTimeout'> | HTTPConnectionPool(host='192.168.1.22', port=80): Max retries exceeded with url: /app?token=33C996C0CB501154BF1452168D367B37 (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.1.22', port=80) at 0x7f8467bce0>, 'Connection to 192.168.1.22 timed out. (connect timeout=None)'))
         File "/usr/src/app/server/interfaces/api_p100.py", line 308, in get_info
          self.info_answer = self.api.getDeviceInfo()
                             ~~~~~~~~~~~~~~~~~~~~~~^^
        File "/usr/src/app/server/interfaces/p100/PyP100.py", line 283, in getDeviceInfo
          r = requests.post(URL, json=SecurePassthroughPayload, headers=headers)
        File "/usr/local/lib/python3.14/site-packages/requests/api.py", line 115, in post
          return request("post", url, data=data, json=json, **kwargs)
        File "/usr/local/lib/python3.14/site-packages/requests/api.py", line 59, in request
          return session.request(method=method, url=url, **kwargs)
                 ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        File "/usr/local/lib/python3.14/site-packages/requests/sessions.py", line 589, in request
          resp = self.send(prep, **send_kwargs)
        File "/usr/local/lib/python3.14/site-packages/requests/sessions.py", line 703, in send
          r = adapter.send(request, **kwargs)
        File "/usr/local/lib/python3.14/site-packages/requests/adapters.py", line 665, in send
          raise ConnectTimeout(e, request=request)


      01/26 08:59:43 | ERROR    Q-query     | ERROR queue query_list (query,TAPO-P100,plug02,signal): 'P100' object has no attribute 'jc'
      01/26 08:59:43 | ERROR    Q-query     | EXCEPTION in queueQuery (QueueApiCalls.execute()): <class 'AttributeError'> | 'P100' object has no attribute 'jc'
         File "/usr/src/app/server/modules/rm3queue.py", line 141, in execute
          result = self.device_apis.api_query(interface, device, value)
        File "/usr/src/app/server/interfaces/interfaces.py", line 973, in api_query
          return_msg = self.api[api_dev].query(device, device_id, button_code)
        File "/usr/src/app/server/interfaces/api_p100.py", line 146, in query
          return f"ERROR {self.api_name} - query*: {e} | {command} | {result} | {self.api.jc.info_result}"
                                                                                 ^^^^^^^^^^^


* if "_ACTIVE-APIS.json" refers to API device, that is not available in 00_interface.json -> a fatal error occurs (rm_status-device.js line 229)
* reconnecting weather (after a network error) doesn't work 
* edit mode
  * toggle & slider for groups doesn't work (but are in the drop-down menus) -> rm_remote-control.js:432
  * don't show groups in drop-down if no device is defined in it

### Observe ...

### known but not that urgent

* when API has an error / isn't available anymore, the connect device still reports online
  * EISCP-ONKYO -> was connected during startup, plugged of -> still green with old values
  * ERROR: Device not connected (EISCP-ONKYO/ONKYP-TXNR686). ... PING 192.168.1.80

* error deleting API devices
  * when just started and create new configs from sample ...
  * no connection, no deletion without error
  * after restart it works
  
* remote editing
  * Happens when not using BROADLINK_default:
    * RecordCommand: ERROR BROADLINK: Could not learn command ([Errno -5] The device storage is full) ... 
      Check whether the remote control actually sent a signal and is pointing close enough to the BROADLINK device.

## UNDER DEVELOPMENT -------------------------------------------------------------

* macro editing in the app
  * OPEN: sort in some order (alphabetically or in the order of the menu)
  * OPEN: edit groups with the same option (different data structure)

### paused a bit

* check if data exist, if not create some from sample data (or create fresh data)
  * OK: .env (... ./start)
  * BUG: Problem with ~/log/server.log !!!!
  * OPEN: add initial start with to start script
  * data/devices (00_interfaces.json with demo)
  * data/remotes (all marked as "template" -> buttons without device / marko)
  * new: data/templates
  * _ACTIVE-*
  * _DEVICE-*

* when creating fresh config files 
  * coping /_sample/buttons/* doesn't work
  * idea: ensure TEST API does something -> e.g. though out visible messages; connect works ... and so on

* create a clean data set
  * OPEN: _ACTIVE-DEVICES.json -> integrate at least one device per API (hidden, not status data)

  
## NEW / IDEAS --------------------------------------------------------------------

### NEW 01-2025


* API refactoring
  * from:   command = "self.api." + command_param[0]
            result = eval(command)
  * to:     method = getattr(self.api, command)
            result = await method(args)

* QUESTION: is there a need for a device or is it possible to get data if API-Device is defined
  * idea: whenever MultiDevice = False and same set of commands (defined in 00_default.json) is enough,
    address it via <API-Device-Key>_Command - or additional setting in 00_interface.json - key starting with a specific character (:WEATHER:default_temperature)
    -> no device remote required but data available in a scene ...

### NEW 12-2025

* APP PERFORMANCE in edit mode - Interaction to next paint (INP) -> to be improved;
  * further ideas, e.g., loading when required and async functions
  * IDEA: separate view to edit all no remote related settings (for a better performance)
  * IDEA: http://localhost:5001/api/list/
    * http://localhost:5001/api/list-update/ <-> transmit "CONFIG" only if updates are done (compare dicts)
    * ??? introduce an unique app instance ID?
  * IDEA: Check which CONFIG data are not used (anymore), when refactoring is done
    * and optimize structure
  
* front end improvements
  * format errors
    * color picker (small -> color indicator drops into next line; stretch to right width)

* Implementing DENON API
  * OPEN: Data definition
    * internet-radio / usb

* Improve API Device settings
  * add possibility to select PowerDevice from a menu

* device deletion (srv & app): when deleting a device, check if the remote is used somewhere else:
  * if yes -> do not delete
  * if no ask whether it should be deleted

* working with templates
  * set buttons to "!template_" (instead of device)
    * show buttons in a specific color to mark them as not defined yet (for scenes), remove "!template_" for devices
    * offer option to replace with device or macro for scenes (editing in preview instead of adding something before or after)
  * save default icon in device templates
  * save default header image in scene templates
  * save/export remote as template

### NEW 11-2025

* SERVER
  * INTERFACES / API
    * if device defines commands with "get" and query is not defined, query all (at least in a wider rhythm)
    * integrate from "query": "load_only", "load_never"

* SETTINGS
  * GROUPS: GUI to add, edit and delete groups (same for macros)
 
* ZIGBEE Integration
  * OPEN: disconnect / reconfiguration of a device

* CLIENT
    * Set language via settings: translate complete dictionary to German
    * add copy button to JSON editing field
    * editing mode scenes -> buttons are usable; leads to actions while editing (and should not)


### NEW 09-2025

* SAVE - change apple icon in the settings (maybe just in .env-file)

* optimize API communication
  * define "media-info" -> return different values depending of fields filled
  * combine requests -> request more data with a single request and return some structured data (how done best?)

* devices
  * ensure reconnect to device configuration, e.g., triggered by API (without restart)
  * Konfiguration eines Devices soll zum Neueinlesen in _ACTIVE-APIS.json führen?!


### OLDER (to be checked if still relevant)

* Further ZigBee Integration
  * Check ZigBee with Password
   
    
# DONE --------------------------------------------------------------------------

* monitor if network connection gets lost, if so keep an eye on it ...
  ... show in "attention"; force reconnect of all APIs if got connections back / stop API and Queue processes if no connection to local network
* replace global dataAll where ever used 
* SOLVED: ?! further errors (4x) - EXCEPTION in Denon AV-Receiver API (ApiControl.send()): <class 'TypeError'> | argument of type 'RuntimeError' is not a container or iterable
* bugfix visualize group status (toggle and power button)
* integrating weather API
  * OPEN: create default configuration with sample data (quasi as device discovery)
* check in scene editing for errors in current 
* differ between "invisible" and "archived" for remotes
  * archived are filtered nearly everywhere, except in the settings in an own list (no drag&drop required) - filtering done in rmData.XX
  * archived have to be moved to active before editing them again
  * archived just can be moved to active or deleted
  * invisible can be made visible via menu entry
* complete refactoring of rm_main.js
* complete refactoring of rm_functions-api.js
* compacter API status summery
* SOLVED several bugs
* archiving
  * OK: check / visualize if remotes are missing for scenes
  * OK: check if device is required from a scene ... make this part of the message
  * OK: restore archived remote for scenes and devices
  * OK: list archived remotes for scenes and devices
  * OK: 01/19 13:03:36 | WARNING  api         | Configuration file for device 'tv' isn't correct. <- device_auto_power_off()
  * OK: call remove to from edit list incl. confirm message
  * OK: server move to / restore from archive
  * OK: api commands to move
* app: scroll opened container into view 
* save last get data in zigbee API and show in display details
* create a clean data set
  * OK: renamed cfg-files incl. references in README.md's
  * OK: _ACTIVE-APIS.json -> clean version, one default API device per API
  * OK: templates -> check, what to move to template also; check description inside
  * OK: remotes -> rename device remotes to rmc-*.json; check description inside
  * OK: remotes -> check own remotes, what to move into sample set
* SOLVED: reload all configuration files (empty cache?!) ... by pull down remote more than 80px
* SOLVED: macro editing -> reset button is missing
* SOLVED: RuntimeError: dictionary changed size during iteration -> configFiles -> assumption: after adding ZigBee device
* SOLVED: error in rm3record.self.record_values_now() - new / alternative error
* SOLVED: error in rm3record.self.record_values_now()
* double column display
* SOLVED: WAIT-xx Macros lead to errors
  * scene-on -> dev-on -> WAIT-xx // Umstellung auf MSG-xx ? und wie damit umgehen, dass mehrere dev-on hintereinander möglich sind?
  * ideen: MSG nur auf oberste Ebene auswerten, d.h. in dem Falle nur bei scene-on
* OK/OBSERVE: size display compared to buttons (possible reason - reduce border size from 1 to 0.5px)
  * json_edit_values["display-size"] not set correctly? rm_remotes.js, Line 2751
  * h1w2, manual mode - Höhe abhängig von der Breite nicht adaptiv (bleibt konstant, während buttons sich verändern)
  * andere modi, andere größen sind unauffällig
* bugs edit mode
  * SOLVED: DISPLAY - not weather display
  * SOLVED: editing device - looses display size when saving
* integrating weather API
  * OK: specific weather display, e.g., big weather icon on one half and basic weather data on the other half
  * OK: read weather data from API-Device configuration (00_interface.json)
  * OK: record weather data, display in a remote control (default)
  * OK: connect weather API with sample data set
  * OK: create config file set
  * OK: query to request all relevant data for current weather and API status
* OK: reload button / icon on charts (in title?!)
* OK: check, if recording is nto pause (if recording, do not deactivate an API)
* Improving text on displays
  * OK: table instead of divs
  * OK: scrollbars if necessary
  * OK: check volume level, add possibility to display other values as bar also
* Rethink sizing
  * keep: show menu ...
  * change -> 2 columns now 880 -> 1000
  * change -> 3 columns now 1250 -> 1400
* refactoring moved cookie handling to separate class
* SOLVED: catch errors from pythonping
* statusCheck_* refactoring -> RemoteVisualizeStatus()
* OK: integrate status of Zigbee "always on devices", e.g., via availability: { "state": "online" }
* integrate ZigBee temperature and humidity sensor
* bugs due to refactoring
  * SOLVED: select with options
  * SOLVED: buttons for scene macros doesn't work - scene_test; scene_scene-on; scene_scene-off
* visualize queues that hang for more than 120s (show attention sign)
* create relevant classes out of RemoteDefaultClass (incl. unified logging)
* move main parts of the data processing to -> class rmData {} and class rmStatus {}
* Improve API Device settings
  * OK: add a toggle to API Device edit dialog to enable / disable
  * OK: activating an API device takes time, looks like it jumps back to old status?!
  * OK: move API definition to separate sheet, keep initial sheet for information, enable/disable, and reconnect
  * OK: move add API device to sheet box and move "create device config" there if exists
* macro editing in the app
  * OK: scene macros (additional place, partly collecting data from different places ... requires server adaption)
  * OK: add / delete macro keys
  * OK: save from this GUI / realize for all types of macros (and groups?)
  * OK: improve layout (best use the available space on different screen sizes)
  * OK: hide (unhide) invisible devices in the sources
  * OK: add macros and groups
  * OK: close sources ()
  * OK: Drag'n'Drop for browser and touch (at the moment touch only)
  * OK: first testing in Macro Settings with fixed data
  * OK: improved layout
  * OK: load data set
* statusCheck_apiConnection() in rm-status.js -> use rmStatus()
  * OK: all show status elements plus different other functions
  * OK: Power Buttons scenes
  * OK: Power Buttons devices
  * OK: deactivate all other buttons, if device / scene error or off
* APP PERFORMANCE in edit mode - Interaction to next paint (INP) -> to be improved;
  * OK: toggle for JSON highlighting
  * OK: load sheets in SheetBoxes when selected (for those, where possible)
  * OK: load SVG Text Images asynchronously
* OK: introduce a cache for calculating the device status, so this is calculated only once per statusCheck()
  * function statusCheck_devicePowerStatus, function statusCheck_scenePowerStatus
  * refactoring -> move to class; enable more specific requests (such as for a single device, with or without message details)
* SOLVED: when devices or APIs are disabled, the message shows an error (API_ERROR_DEVICE) instead of a message with inactive
* OK: move other configs to data("CONFIG")("elements"), such as "icons", "device-types", "methods"
* scene macros doesn't work or just not defined?!
* when updating without config files for a new device, such as DENON, it shows a messages and starts without that API
  * OK: attention sign / no content in API settings -> give at least recommendations, what to do and show an error for the API (may already open with message)!
  * OK: attention sign should be visible in front of all others ... maybe in the header
* OK: start script: when rebuilding the containers, they start ... zigbee after jc://server/, is there a way just to build?
* API Improvement
  * OK: reconnect APIs -> send request (instead of doing now) | request_reconnect_api
  * OK: return message asynchronously ??? done here already? should become a separate def in rm3config (-> if not, make it part of statusCheck())
  * OK: reconnect is not disabled anymore based on status
  * OK: Trigger check devices immediately after an API devices was switch on/off again (if API is active)
  * OK: introduce toggle to a activate API device
  * OK: discover APIs -> send request | request_discover_devices
  * OK: rearrange api device settings -> splitted info/reconnect and edit config
  * OK: rearrange api settings -> logging, device api speed, ...
* Implementing DENON API
  * OK: Data definition: prg+ / prg- / 1..4 / ffw / fbw (next / previous)
  * OK: Update relevant macros for own installation
  * OK: Documentation (main README.md)
  * NOT POSSIBLE @ THE MOMENT: specific commands - current-playing (DAB)
  * OK: Improved RMC design incl. display
  * OK: Documentation (API README.md)
  * OK: Documentation - ensure, keys doesn't include "_"; maybe check somewhere and put warning into logging
  * OK: volume in header doesn't work for DENON -> REFACTORING
    * hide, if no main_audio defined
    * show error msg, if error with main_audio device
    * inactive, if main_audio device or it's PowerDevice is off
    * ensure, sending data works for DENON
  * OK: creating device for DENON - existing configuration isn't shown in the list?!
  * OK: save device configuration doesn't work anymore
  * OK: specific commands - volume, mute (toggle)
  * OK: Send
  * OK: Query
  * OK: Connection
  * OK: discovery incl. request
  * OK: Initial Remote Control design
  * OK: RMC using Broadlink
* SOLVED: "preview" works
* SOLVED: recording of buttons doesn't work (new button? at least in freshly created remotes)
* Bug: APIs / add devices
  * SOLVED: creating device for DENON device doesn't set the device ID -> DENON_default instead of DENON_DEVICE-2
  * OK: count copies ...
  * OK: creation: if using the RMC, use api not from device
  * OK: creation: create a copy (default)
* front end format errors
  * OK: in Firefox the placement of the audio icon and the volume level visualization doesn't work correctly
  * OK: font-sizes in buttons
  * OK: color buttons ... text not as image
* AUDIO Slider -> improve behavior
  * OK: when status of device / API changes, update audio values also (requires reload at the moment)
  * OK: send ... Umrechung zwischen DB und absoluten Werten ebenfalls vornehmen!
  * OK: timeout set until set audio volume is send back from server
* new button icons
  * OK: new: eco, cd, HDMI, internet-radio, aux, media-player/media-center, game, heos
  * OK: new keys: fbw||next, ffw||previous 
  * OK: new keys: cable_sat||tv, tuner||radio, blu-ray||bluray, option||context, sleep||timer
* avoid selection of button texts and images
* bugfix ONKYO discovery
* when creating fresh config files 
  * OK: add link to create device
  * OK: add linkt to create scene
  * OK: message "no device or scene defined yet" + hint what to do
  * OK: one sample device per API, and disabled
* config error -> rm3data -> self.data.errors
  * OK: add errors in main config files
  * OK: add errors in API definition
  * OK: improve / bugfix sign and alert for config errors
* solved: if || in button definition for a device remote, its status not detected
* solved: in device remote, the button "media-center_keyboard" has to be set inactive, when the device is switched off (such as slider, color picker & co)
* ON/OFF/POWER_OFF/ERROR - check if starting and if app_connection error, display respective messages
* add API device via app
  * OK: when adding more than one entries
    * uses not entry from discovery but other entry form detecting all devices in network
  * OK: recreate consolidated device config
    * interface_config = self.read(rm3presets.active_apis)
  * OK: add entry to 00_interface.json
  * OK: reload API configuration
  * OK: Check, if description and IP are set
  * OK: REST API
  * OK: list of detected devices (incl. discovery)
  * OK: GUI to add API device
* delete API device via app
* discover available KODI servers based on the list of available IP addresses
* Initiate a restart from the GUI / plus clean shutdown within the server (such as for birdhouse cam to avoid data loss)
* optimize API communication
  * OK: Update README.md -> interfaces, data format and description
  * OK: extra requests for some commands after SEND - even faster reaction on changes
  * OK: combine for timing + timing_default from 00_default.json and <device-name>.json doesn't work?! rm3data.devices_read_config !!!
  * QUESTION:
    * why 00_default.json "commands" other format as in <device>.json; <-> "cmd" : ["get"] ... potentially saved back to .json but not required there? ONKYO, ZigBee
* Clean server shutdown (to avoid data loss)
* option to reload all CSS and JS-Files (client/server) ... does work for CSS files, not really for JS 
  (reload of files but no rewriting the loaded JS code)
* move timer execution to send queue
* BUTTONS set individual icons for buttons for scenes
* refactoring of queue; do not wait but execute based on a given execution time (calculated based on waiting times)
* API-Device discovery
  * BROADLINK
  * EISCP-ONKYO
* API-SETTINGS: change of API settings for device remotes not implemented yet -> rm_remotes.js l480ff.
  * OK: wrong files selected
  * OK: save new data -> device_edit_api_settings; rm3data.py; line 1367 ff
  * OK: reload of configuration in the browser
  * OK: connect edit dialog to function apiDeviceApiSettingsEdit()
  * OK: enhance dialog "onchange API create select interface-config
  * OK: enhance dialog "don't forget initial value -> reset button"
  * OK: appMsg dialog - do you really want to change, describe impact off ...
  * OK: API connect in rm3api.yml and rm3api.py
  * OK: function apiDeviceApiSettingsEdit(device,prefix,fields)
* bugfix recording with BROADLINK RM4mini plus improved error messages
* implementing groups part 1
  * OK: add group as option for color-picker, slider, and toggle
    * OK: add color-picker for groups
    * OK: add toggle for groups
    * OK: add slider for groups
    * OK: send command for groups (toggle, slider, color-picker)
  * OK: add group command to timer, add waiting time to timer
  * OK: add cmd to GUI
  * OK: react on "group_<group_id>_<button>"
  * OK: rm_status.js
    * OK: status toggles (get status of all included devices; "middle-status"; ...)
    * OK: status group ON / OFF buttons
  * OK: remove data.macro_decode (old)
  * OK: Save sample configuration
  * OK: create toggle with group ID
  * OK: remove api.send_macro_buttons_org
  * OK: decompose groups for send commands (such as color)
* add hint to timer settings, if server time differs to client time
* JSON Editing
  * OK: Edited JSON is not reflected to mark-up
  * OK: scene -> simple LINE: "<scene>_LINE||<text>" < should be "LINE||<text>"
* SETTINGS:
  * OK: size of buttons in info section doesn't fit anymore
  * OK: moving a device using drag & drop doesn't work any more
  * OK: edit mode for hidden remotes? (scenes)
* wrong element positions after refactoring:
  * OK: Scene Power Button toggle is left instead of right
  * OK: text in displays is not centered anymore
  * OK: rm-button used in the settings -> expect a grid but don't have one
* error message pop-up -> when clicking on link, e.g., to smart plug, then pop-up with "undefined" and switch to smart plug
* Display bugs
  * SCENE DISPLAY:
    * OK: adding value -> alert, value already exists (even if not)
    * OK: preview -> display sizes is set to some default value (1hw2); field in edit dialog is not set any more ...
    * OK: deleting value
  * DEVICE DISPLAY:
    * OK: adding / deleting value
    * OK: Scene - Display size editing (da ist generell der Wurm drin)
* Refactor BUTTON-GRID incl. tool-tips
  * OK: toggle with label -> tooltips missing
  * OK: grids for starting view
  * TBC: common function for tooltip content (scene and device -> option to enrich tooltips)
  * OK: coloring of tooltips, esp. for light theme
  * OK: cleanup CSS definitions
  * OK: solve problems with button onclick-commands from tooltips
  * OK: tooltips for channels in scenes
  * OK: tooltips for unused buttons in remotes
  * OK: refactoring tooltips for scenes and remotes
  * OK: refactoring button-grid
* BUTTONS set individual icons for buttons
  * OK: edit dialog (device + scene) -> select alternative button or type in alternative label
  * OK: create JSON "<button>||<button-image>"
  * OK: use "l1-power-on||on" / "<button>||<button-image>" -> use default, if no <button-image> is defined else use <button-image> as label
  * OK: adapt "unused buttons" to that logic
* OK: device remote: if OFF or POWER_OFF, slider are still shown as partly aktive ... not in black as OFF buttons (formatting of the container element; input range is disabled)
* OK: anordnung von elementen im display bei unterschiedlichen Screengrößen (insbesondere SMALL)
    * h1w2/h2w2 - wenn breiter; in 2 Spalten statt nur 1
* show connected remotes and detected devices in the API settings
* add other elements to scene using a GUI - COLOR_PICKER
  * OK: process JSON definition
  * OK: add label to color picker element (possibly only for scenes)
  * OK: refactoring to add, remove, move elements in JSON using the GUI
  * OK: create GUI to add JSON definition for color picker - SCENE
* edit mode
  * OK: wenn ON, immer irgendwo ein button zum ausschalten
  * OK: in den Remote selbst ein Button zum einschalten, ggf. zu aktivieren in den Settings
* refactoring RemoteMain class (function -> class, plus split into more classes)
* ZIGBEE Integration
  * OK: when pressing "permit-join" or "restart-api" ... send appMsg.info()
  * OK: erkanntes device hinzufügen ... dateiname ".json"
  * OK: more explanation how to connect and disconnect devices (help text)
  * OK: show device information from "10_device.json" (or original source) -> create <device>.json
  * OK: derive available end points and available commands
  * OK: enrich documentation, add link to admin-tool in the API settings
* Set language via settings
  * OK: safe as cookie or in .env
  * OK: test mode (lang "TEST" -> show "x" per character to make missing dictionary text visible; -> app-framework)
  * OK: use lang() in many more places
* ON/OFF/POWER_OFF/ERROR
  * OK: central detection for devices and scenes -> status information
  * OK: messages for device remotes at the top
  * OK: if POWER_OFF -> deactivate ON and OFF buttons for devices
  * OK: messages for scene remotes -> move also to the top and grab from central functions
  * OK: ZigBee devices show "unknown error" ... when power == "N/A"; Add additional error message in the sense of "N/A, try out ..."
  * OK - BUG: led03 display shows connection error (POWER OFF, der strom über plug02 ist ausgeschaltet) ... ??? but PowerDevice == ""
  * OK: differentiated message, when parts of the required devices are ON / OFF
  * OK: differentiated message, when parts of the required devices report an ERROR or DISABLED API
  * OK: use cookies to switch off some off the MESSAGES (-> PARTLY, POWER_OFF)
* create device slider in scene via GUI
  * OK: slider creation dialog
  * OK: auto naming incl. device label (e.g. "LED Streifen Brightness" )
  * OK: check, where min-max is defined to select which devices can be chosen @ GUI -> do also for devices
  * OK: slider active if device is ON
* start editing from every remote control, end via icon in the header
* add other elements to scene using a GUI
  * OK: HEADER incl. TOGGLE
  * OK: TOGGLE
  * OK: SLIDER
* improve error handling - show in display that power is off (instead of connection error)
* groups
  * OK: decompose groups for buttons
  * OK: edit groups via JSON (in scene settings)
  * OK: add toggle via GUI to remote (not scene)
  * OK: Rearranged element editing for remote
  * OK: add groups as buttons
* header for settings -> 1 row, scroll if not enough space
* save edit mode in cookies (incl. restore)
* group editing functionality in sheet boxes
  * scene and remote button editing
  * json editing
  * macro editing, incl. new category
* optimize API communication
  * OK: define request time -> if defined use different intervals for different fields / reduce request interval for most values
  * OK: pause requests, if no client is connected
* refactoring theme colors & font sizes
* check / shorten error messages for displays
* adaptive buttons and button content size
* header images - max. ausdehnung (as not constant aspect ratio any more)
* Zusatzinfos zu APIs / Devices inklusive Ladezeiten => Info?
* reconnect of interfaces? Bsp. TAPO-100 ...
* ZigBee Connect (start with Socket and Bulb)
* when deleting a device, do not delete the device config (relevant for reuse)
* create new device -> choose from available device configs and remote definitions, e.g., if you want to recreate or double a device
* improved adaptive layout
* integrate Broadlink RM devices based on more general Broadlink module -> enable new devices such as RM4 mini
* new color picker, RGB / CIE_1392 / Brightness / Color Temp
* Sorting devices doesn't work correctly
* Settings für Remote Controls / Scene Controls / Devices trennen
  * list of all devices -> drag and drop to sort plus editing option on each entry
* OK: LW geht wieder hoch // nicht definiertes Device
* OK: Slider for main audio doesn't work
* MACRO: Error msg, if a device doesn't exist any more -> Visible as appMsg.info(ERROR)
* BUG: nach gewisser Laufzeit bleibt Thread "api" in interface.py hängen; Unklarheit warum!
  * assumption: loop of reconnecting; TRY TO AVOID ...
* BUG: im Edit Mode werden Daten unkontrolliert neu geladen, sodass Änderungen zurückgesetzt werden
  * scheins "manchmal" ausgelöst durch eine Aktion
  * in Aktion immer nur "update preview vorgesehen"
  * was habe ich wann verändert? 
* BUG: Tooltip
  * für Header, Toggle, Display noch nicht korrekt!
  * Display ... mehrere Displays, von denen immer nur eines angezeigt wird; im EDIT MODE nur das eine laden?
* Wenn Strom aus, dann sehr lange Wartezeiten auf API Thread
  * OK: Define "PowerDevice" in API Settings and show in Settings
  * OK: Differentiate Multi- / Single-Device API
  * OK: Check connection and power status of PowerDevice (depending on Single/MultiDevice)
  * OK: Based on PowerDevice -> PowerStatus = Off (instead of ERROR), if PowerDevice = OFF
* CSS refactoring; % width where ever it makes sense to reduce need for device specific definitions
* Schedule timer (app, server -> macros & device buttons; regular timer)
* Caching
  * OK: Measure time for REQUEST execution per interface
  * OK: Add new reload only when last reload is done
* Further ZigBee Integration
  * OK: Add a new device (LED RGB)
    * OK: Color Picker
    * OK: validate color button values
    * OK: reduce opacity of color wheel when inactive
    * OK: select color model in "button definition"
    * OK: reduce log level
    * OK: buttons / color picker for cool white to warm white
  * OK: Check if USB Dongle is available
  * OK: Add device based on identified device (external ID; API)
  * OK: Start / Stop device detection via API
    * OK: command on button definition
    * OK: button in device config
    * OK: execute buttons without defined device
* BUGS
  * OK: Slider -> creating slider: "send-" is missing
  * OK: Color Picker -> use field name in definition
  * OK: Device Driver Definition -> parameter with "-" in name doesn't work (or "_")
* Displays and buttons -> off, if power device off (name it in the display)
  * OK: Displays
  * OK: Error or other status / style (must be disabled)
* OK: rm3presets: rename all former import vars rm3config
* OK: rm3config: scene editing in rm3config analogue to remote editing
  * OK: check
  * OK: remove old commands
  * OK: build success and error messages based on return of .config.scene_*()
* OK: central ping / life sign for user activity -> check for API requests
* OK: rm3config: deletion of files including cleaning up cache
* show buttons and decomposed macros in the lower right corner if showButton is set
* OK: API details in api sections doesn't work anymore
* Settings
  * OK: Settings und Informationen über eine Startseite mit 4 Kacheln zugänglich machen
  * OK: Settings wieder ein/ausblenden
  * OK: show / check if PowerDevice is switched off
  * OK: disable API DEVICE
  * OK: differentiate between ON/OFF and ACTIVE/DISABLED
  * OK: MAGIC-HOME shows error even if API is disabled
  * OK: Show ZigBee Devices devices even when nothing is connected
  * OK: Check if detected device is OK:
    * if "interviewing" = false and "interview_completed" = false => device not available (e.g. connected with other broker)
  * OBSERVE: creates APIS in _ACTIVE-APIS.json only if device for API is defined -> create as disabled instead!
* OK: latest version of JS loading not installed (compare birdhouse, loading covers full screen)
* OK: on jc-server: "app_loading_image is not defined"
* OK: check if other git modules are installed (see birdhouse)
* ZIGBEE2MQTT Integration
  * OK: connection, control, get data
  * OK: if server not available, fatal error that blocks other functions for other devices
  * OK: if server loses connection, fatal error
* device status bleibt nicht gespeichert
* Connected Devices auch über Status neu laden
* API Device status ändern 
  * OK: Button mit API Command verbunden inkl. Auswertung des Wertes
  * OK: rm_status -> Update value im button, wenn nötig
  * OK: rm_status -> Farbcodierung für ON/OFF button abhängig vom Wert
  * OK: Connection status vom API-Device auswerten
    * API-Requests im Status OFF einstellen
    * "STATUS"|"interface"|"connect"|<interface>_<api_device> entsprechend setzen
  * OK: Button inaktiv setzen, wenn INTERFACE im Status OFF

