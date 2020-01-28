# BACKLOCK jc://remote/

## project

* OK - create configuration base on config-files and templates
* OK - configure and clean-up for git-project
* OK - create a new / license free icon set (to be improved continuously)


## server

* OK - read remote definitions from json files
* OK - read image mapping from json file
* OK - learn button via settings page (server side * OK) ... error server side after learn via web interface?! - Key Error (after reload also)
* OK - setting / delete button: button list filtered based on selected device
* OK - server side deletion of buttons
* OK - server side configuration handling: buttons in json file
* OK - change add dev/button to JSON
* OK - INACTIVE - add a PROD / TEST system on different ports -- inactive due to move to GitHub
* OK - check for updates (/remote/updates/<APP-version>/)
* OK - define main audio device in devices.json
* OK - switch connection between test / prod server
* OK - migrate to swagger-ui
* OK - added EISCP API: send commands
* OK - migrate to JSON files
* OK - EISCP API: query status
* OK - BROADLINK: optimized integration (as EISCP API)
* OK - simplified and optimized data structure
* OK - EISCP - process multiple requests
* OK - Execute makros server-side (and show OK in client, when done / close menu ...)
* OK - Cache config files
* OK - Use queue to execute commands
* OK - redesign / simplify module structure
* OK - Config files analog to mbox

* IN PROGRESS - add KODIjson (basic commands work, to be tested and additional commands to be added)

* SONY  - add API


## automated testing

* OK - data files (JSON) are correctly formatted
* OK - add test device, test buttons ... and delete
* OK - reset device status / audio settings
* OK - all API calls return a code 200 (instead of 404 or 500)

* main structure of data files is OK
* more detailled API testing (e.g. creating, modifing, changing a remote control)
* all defined image files are available


## client

* OK - use new command to log device status (ON/OFF)
* OK - change color of button, if device is ON (main menu & remote controls)
* OK - button in settings to reset device status
* OK - change makros, if some devices are already ON
* OK - change markos for TV Receiver, depending on modus = TV or RADIO (usable for similar use cases also)
* OK - send cmd only if device is ON (to be change with jc://app/ -> placed in function sendCmd)
* OK - show volume and mute status
* OK - use jc://app/
* OK - show light, when button pressed
* OK - set buttons to inactive if device is OFF
* OK - use extra makros to switch on / off (DEV-ON_<device> and DEV-OFF_<device>) ==>> PROBLEME (verursacht lange Wartezeiten)
* OK - ERROR - doesnt work on iPhone / Chrome -> Uncaught TypeError: Cannot read property 'AllDevices' of undefined menu.js:85
* OK - show mute if main audio device is OFF or volume is 0
* OK - if device OFF, dont send cmd - deactivate this funktion by click in settings
* OK - devices and commands to lower cases
* OK - add new device via settings page (server side not implemented yet)
* OK - settings in new structure (no overlay)
* OK - click on title = hide settings (and go to start page)
* OK - callback after learn / add device (not working correctly yet)
* OK - menu & start page in classes
* OK - delete buttons / devices via settings page
* OK - remotes as class
* OK - alert and waiting while loading with my own class for settings page
* OK - Label of Scene buttons only in lower case -> lower / upper cases only in ID?! -> Scene with description and label?
* OK - ERROR - Color Buttons doesn't work any more
* OK - ERROR - AV-Receiver (new ID) doesn't deactivate buttons any more if OFF
* OK - ERROR - ifconfirmed doesnt work any more / reset
* OK - ERROR - title for scenes is not set based on label but on id
* OK - enable makros in channel definition
* OK - ERROR - volumen control display in header doesnt work any more if device OFF or MUTE
* OK - settings to class
* OK - if (deactivateButton == true) ignore value and dont change value on server
* OK - deactivate makro_* buttons if all required devices for a scene are switched OFF
* OK - check for updates @ start / dont start, if update required (ignore possible)
* OK - server IP = app IP with different ports
* OK - check_status() after "on" / "off"-Command
* OK - ERROR - undefined buttons not in special style
* OK - ERROR - delete button/device -> selection of values from input fields doesn't work any more
* OK - ERROR - if switch from settings to start page via menu no background image is set
* OK - show status green, if required devices are ON (based on dev-on definition)
* OK - co* OKie ... start with last status* OK - use jcMsg as central service instead of rm_msg.js; show versions of jcMsg and jcApp in settings
* OK - link in menu to switch between intelligent mode (check status of device) and manual mode (buttons allways on)
* OK - migrate to jc-apps v1.3.6+
* OK - migrate to jc-msg v1.1.3+
* OK - edit mode: edit commands for remote in remote-view
* OK - edit mode: record IR directly from remote control, if template is loaded / defined
* OK - migrate to python3
* OK - server to docker-container
* OK - server side configuration handling: status in json file
* OK - migrate to jc-cookie
* OK - optimized directory structure to prepare additional device/API integration
* OK - added display (with queried information from API)
* OK - correct show / hide menu
* OK - get display size (small,middle,big) from remote config file
* OK - create license free icon set (sources see README.md)
* OK - check device status when pressed button / send command or makro
* OK - check / show if device API is connected
* OK - basic dark scheme (to be optimized)

* IN PROGRESS - edit device parameters via settings page (description, driver, image)

- dark scheme for menu
- dark scheme for jc-msg
- edit device parameters via settings page (status definition)
- edit device parameters via settings page (remote control)

