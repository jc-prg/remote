# API Description: ONKYO Devices

## Source

* Python sources: https://github.com/miracle2k/onkyo-eiscp/
* API documentation: https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml

## How to install an EISCP-ONKYO device

1. Prepare the EISCP-ONKYO device
    - Connect the EISCP-ONKYO device to your Wi-Fi network 
    - Ensure on your router that your EISCP-ONKYO device keeps the same IPv4 address everytime.
    - Activate network forever in the device settings
2. Add Controller to configuration
    - Restart the jc://remote/ server to trigger a device discovery immediately
    - Navigate in the app to "Settings > API Settings > API: EISCP-ONKYO"
    - Ensure the related toggle is activated
    - Press "Add" to open the dialog, here you should find your DENON AVR device in the list 
3. _Optional:_ Alternatively you can create an API config file using the app
    - save the config file as 00_interface.json in the folder [data/devices/EISCP-ONKYO/00_interface.json](../../../data/_sample/devices/EISCP-ONKYO/00_interface.json) 
      and restart the server
4. _Optional:_ To make changes at the configuration of your broadlink device: 
    - Option 1: change settings using the app in "Settings > API Settings > API: BROADLINK" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    - Option 2: edit directly the file [data/devices/EISCP-ONKYO/00_interface.json](../../../data/_sample/devices/EISCP-ONKYO/00_interface.json) and restart the server when done.

## Usage of API Commands

The API commands are defined in two files. The definition of default commands for all DENON devices are defined in the file [data/devices/EISCP-ONKYO/00_default.json](../../../data/_sample/devices/EISCP-ONKYO/00_default.json).
Commands for specific devices are defined in device configs such as the file [receiver_onkyo-txnr686.json](../../../data/_sample/devices/EISCP-ONKYO/receiver_onkyo-txnr686.json)
for the DENON AVR X2800H DAB. The following example shows the structure of the default and device specific configuration. 

```json
{
  "data": {
    "buttons" : {
      "on"       : "system-power=on",
      "off"      : "system-power=off",
      "mute-on"  : "audio-muting=on"
      },
    "commands" : {
      "vol" : {
        "get"    : "master-volume=query",
        "set"    : "master-volume={DATA}",
        "type"   : "integer",
        "param"  : [ "level-up", "level-down" ],
        "values" : { "min" : 0, "max" : 70 }
        },
      "power" : {
        "get"    : "system-power=query",
        "set"    : "system-power={DATA}",
        "type"   : "enum",
        "param"  : [ "on", "off" ],
        "values" : [ "on", "off" ]
        },
      "api-discovery": {
        "get": "api-discovery"
        }
      },
    "query" : {
      "load_intervals" : {
        "10": ["power", "vol", "mute"]
      },
      "load_default" : 60,
      "load_after" : ["on", "off", "vol", "send-vol", "mute", "mute-off", "mute-on"],
      "load_after_values" : ["power", "vol", "mute", "current-playing"]
      },
    "description" : "API to connect to several devices from ONKYO - default set vor all devices",
    "method" : "query"
  }
}
```
**Hints:** 
* key values never should use "_", use "-" instead.
* to use the volume functionality in the app, use "volume" and "mute" as keys for the related commands
* find available commands in the [API documentation](https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml), they follow the format of the following examples
  * audio-muting=toggle
  * setup=home 
  * tuning=up
  * audio-muting={DATA} ... _if you want to send data_
  * ...
  
## Additional jc://remote/ API Commands

In addition to the ONKYO specific API commands you can use the following jc://remote/ API command:

```json
{
  "jc.get_available_commands()": {
      "info": "get a list of all available commands"
  },
  "jc.get_metadata(parameter)": {
      "description": "get consolidated metadata from device",
      "parameter": ["net-info"]
  }
}
```  