# jc://remote/data

## Definitions

* **API**: Server interface to devices
* **API device**: Specific device to be controlled by the API
* **Device**: Device controlled by the API device, e.g. receiver, beamer, smart socket, bulb. In some cases 
  API device and device are the same (MultiDevice = false), in some cases one API device controls several devices
  (MultiDevice = true)
* **Command**: API request, recorded IR string or similar to trigger or control a specific function
* **Button**: Button (or other active element) in the remote control, usually connected to a command or a macro
* **Macro**: Sequence of buttons (and by that commands) without or with parameters

## Data structure

All API and device specific configurations are stored in the directory [data/](/). 
Find here an overview of the folder and file structure:

```
* SAMPLE CONFIGURATION

  ./_sample
  ./_sample/devices
  ./_sample/remotes
  ./_sample/install-config

* ACTIVE CONFIGURATION

  ./_ACTIVE-APIS.json                    -> Overview API, configuration which APIs and API devices are active
  ./_ACTIVE-DEVICES.json                 -> defines devices and connect API, API device and remote control
  ./_ACTIVE-MACROS.json                  -> defines global macros and device on/off macros
  ./_ACTIVE-SCENES.json                  -> defines scenes and connect remote control
  ./_ACTIVE-TIMER.json                   -> defines timer events
  ./_ACTIVE-TYPEs.json                   -> defines available device types

* ACTIVE API & API-DEVICE CONFIGURATION

  ./devices/<API>/00_interface.json     -> configures API and API device(s)
  ./devices/<API>/00_default.json       -> configures default commands that are applicable for all devices
  ./devices/<API>/cfg-<device>.json     -> configures device specific commands

* ACTIVE REMOTE CONTROL CONFIGURATION

  ./remotes/rmc_<device_name>.json      -> configures remote control for a specific device
  ./remotes/scene_<name>.json           -> configures remote control for a scene incl. macros

* REMOTE CONTROL TEMPLATES

  ./templates/<device>_<name>.json      -> configures remote control template for devices
  ./templates/scene_<name>.json         -> configures remote control template for scenes

* BUTTON CONFIGURATION

  ./buttons/default/index.json          -> configures images for buttons
  ./buttons/button_colors.json          -> configures color definition
  ./buttons/scenes/index.json           -> configures image index
  ./buttons/scenes/*.png                -> header images for scenes
  ./buttons/default/*.png               -> default button images (use transparent png-files)
```
  
## Description and How-To

A context specific how-to you'll find in the app when you activate the edit mode. Here is a summary:

### INTERFACES

The interfaces can be configured in the app or in the respective configuration files directly. 
This includes two files:

```
  ./devices/<API>/00_interface.json
  ./devices/<API>/00_default.json
```

The file 00_interface.json defines the connect to a specific device:

* set IP address and MAC address of the device per API
* set additional API specific parameters
* if you want to address more than one device per API add one section per device
* the connection between remote and device plus API is defined in the file \_ACTIVE-DEVICES.json

```json
{
  "API-Devices" : {
      "living_room" : {                        
          "Description" : "Infrared RM3",
          "IPAddress"   : "192.168.1.20",      
          "MACAddress"  : "XX:XX:XX:XX:XX:XX",
          "Methods"     : ["send","record"],
          "MultiDevice" : true,
          "Port"        : 80,
          "PowerDevice" : "TAPO-P100_plug1",
          "Timeout"     : 5
          },
      "office" : {                             
          "Description" : "Infrared RM3",
          "IPAddress"   : "192.168.1.21",
          "MACAddress"  : "XX:XX:XX:XX:XX:XX",
          "Methods"     : ["send","record"],
          "MultiDevice" : true,
          "Port"        : 80,
          "PowerDevice" : "TAPO-P100_plug1",
          "Timeout"     : 5
          } 
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
    "buttons" : { 
        "on" : "jc.turn_on()"
        },
    "commands" : {
        "mute" : { 
            "command" : "audio-muting=",
            "type" : "enum"
            }
        },
    "description" : "",
    "method" : "", 
    "queries" : { 
        "mode" : "jc.get_info('mode')"
        },
    "send-data": { 
        "send-text" : "Input.SendText(text='{DATA}',done=False)" 
        },
    "url": "",     
    "values": {    
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

* define global macros (sets of multiple buttons)
* use macros "dev-on" and "dev-off" to switch on / off devices
* use "<device>_<button>" to use a button from a specific device
* use "<device>_<button>||<value>" to send command only if value is different (value has to be tracked)
* use just a number (integer) to wait some seconds


--------

_[Back to jc://remote/ documentation.](../README.md)_
