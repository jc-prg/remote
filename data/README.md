# jc://remote/data


## Data structure

* _sample configuration_
  - ./sample
  - ./sample/install-config
  - ./sample/*

* _active configuration_
  - \_ACTIVE-DEVICES.json
  - \_ACTIVE-MACROS.json
  - \_ACTIVE-SCENES.json

* _button configuration_
  - ./buttons/default/*.png                  -> default button images (use transparent png-files)
  - ./buttons/default/index.json             -> define images for buttons
  - ./buttons/button_colors.json             -> color definition
  - ./buttons/scenes/*.png                   -> header images for scenes
  - ./buttons/scenes/index.json              -> image index

* _API and device configuration_
  - ./devices/&lt;API&gt;/00_interface.json        -> configure interfaces to devices
  - ./devices/&lt;API&gt;/00_default.json          -> configure default commands
  - ./devices/&lt;API&gt;/&lt;device&gt;.json            -> configuraton of device specific commands

* _remote control / API configuration_
  - ./remotes/&lt;device_api&gt;.json             -> specific remote configuration files

* _remote control templates_
  - ./templates/&lt;device&gt;.json               -> remote templates


## Description and How-to

Find a how-to in the edit mode also. Summary:


### INTERFACES

The interfaces have to be configured in the respective configuration files directly. This includes two files:

* data/devices/&lt;INTERFACE&gt;/00_interface.json
* data/devices/&lt;INTERFACE&gt;/00_default.json

The file 00_interface.json defines the connect to a specific device:

* set IP address and MAC address of the device per API
* set additional API specific parameters
* if you want to addess more than one device per API add one section per device
* the connection between remote and device plus API is defined in the file \_ACTIVE-DEVICES.json

```json
{
  "Devices" : {
    "living_room" : {                        # 1st interface using this API 
        "IPAddress"   : "192.168.1.20",      # parameters depend on API
        "Port"        : 80,
        "MACAddress"  : "XX:XX:XX:XX:XX:XX",
        "Timeout"     : 5,
        "Methods"     : ["send","record"],
        "Description" : "Infrared RM3"
        },
    "office" : {                             # 2nd interface using this API
        "IPAddress"   : "192.168.1.21",      # parameters depend on API
        "Port"        : 80,
        "MACAddress"  : "XX:XX:XX:XX:XX:XX",
        "Timeout"     : 5,
        "Methods"     : ["send","record"],
        "Description" : "Infrared RM3"
        },
    "API-Source"      : "https://github.com/davorf/BlackBeanControl",
    "API-Info"        : "https://github.com/davorf/BlackBeanControl",
    "API-Description" : "Infrared Broadlink RM3"
}
```

The file 00_default.json defines button commands, queries, send commands etc. that are valid for all devices that uses a specific interfaces.

```json
{
  "data": {
    "buttons" : {                         # define button per command, e.g.
        "on" : "jc.turn_on()"
        },
    "commands" : {                        # define data type of command (enum, integer), e.g.
        "mute" : { 
            "command" : "audio-muting=",
            "type" : "enum"
            }
        },
    "description" : "",                   # description for the device
    "method" : "",                        # define if device works with query or record 
    "queries" : {                         # define queries to get data from device, e.g.
        "mode" : "jc.get_info('mode')"
        },
    "send-data": {                        # define commands to send data to device, e.g.
        "send-text" : "Input.SendText(text='{DATA}',done=False)" 
        },
    "url": "",                            # URL to device specific application / UI -> 00_interface
    "values": {                           # define default values for buttons & queries, e.g.
        "power": [ "on", "off" ],
        "mute" : [ "on", "off", "toggle" ],
        "value" : { "max": 100, "min": 1 }
        }
    }
}
```


### DEVICES

In additional files that use the format as defined for 00_default.json, device specific button commands, queries, send commands etc. can be defined. 
Data defined in this file will overwrite the data from the file 00_default.json.


### REMOTES

Remote controls for devices can be added, changed and deleted via edit mode in the GUI already and there are a few templates available:

* define standard remotes based on buttons
* a standard theme has 4 buttons per row
* use "button" to add a button (defined in the device configuration)
* use "." to draw an empty field (instead of a button)
* use "LINE||text" to draw a line (optional with text as description) and start in a new row
* use "DISPLAY" to add a display
* use "COLOR-PICKER||send-command" to add a color picker
* use "SLIDER||send-command||description||min-max||parameter" to add a slider


### SCENES

Remote controls for scenes can be added, changed and deleted via edit mode in the GUI already and there are a few templates available:

* define remotes for a scene (e.g. cinema) mixed with buttons from multiple remotes
* a standard theme has 4 buttons per row
* use "." to draw an empty field (instead of a button)
* use "LINE" to draw a line and start in a new row
* use "macro_*" to use a macro
* use "device_button" to use a button from a specific device
* use "Remote" : [] to define remote control ("<device>_<button>")
* use "Channel" : {} to define channel list ("<channel_name>" : ["<device_button","<device_button"])

### MACROS

Macros have to defined in the file \_ACTIVE-MACROS.json:

* define macros (sets of multiple buttons)
* use macros "dev-on" and "dev-off" to switch on / off devices
* use "<device>_<button>" to use a button from a specific device
* use "<device>_<button>||<value>" to send command only if value is different (value has to be tracked)
* use number to wait some seconds



