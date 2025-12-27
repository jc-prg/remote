# API Description: Denon AVR

## Source

* Python sources: https://github.com/ol-iver/denonavr
* API documentation: https://github.com/ol-iver/denonavr/blob/main/doc/XML_data_dump.txt

## How to install a DENON AVR device

1. Prepare the DENON AVR device
    - Connect the DENON AVR device to your Wi-Fi network 
    - Ensure on your router that your DENON AVR device keeps the same IPv4 address everytime.
    - Activate network forever in the device settings
2. Add Controller to configuration
    - Restart the jc://remote/ server to trigger a device discovery immediately
    - Navigate in the app to "Settings > API Settings > API: DENON"
    - Ensure the related toggle is activated
    - Press "Add" to open the dialog, here you should find your DENON AVR device in the list 
3. _Optional:_ Alternatively you can create an API config file using the app
    - save the config file as 00_interface.json in the folder [data/devices/DENON/00_interface.json](../../../data/_sample/devices/DENON/00_interface.json) 
      and restart the server
4. _Optional:_ To make changes at the configuration of your broadlink device: 
    - Option 1: change settings using the app in "Settings > API Settings > API: BROADLINK" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    - Option 2: edit directly the file [data/devices/DENON/00_interface.json](../../../data/_sample/devices/DENON/00_interface.json) and restart the server when done.

## Usage of API Commands

The API commands are defined in two files. The definition of default commands for all DENON devices are defined in the file [data/devices/DENON/00_default.json](../../../data/_sample/devices/DENON/00_default.json).
Commands for specific devices are defined in device configs such as the file [cfg-receiver-denon-avr-x2800h.json](../../../data/_sample/devices/DENON/cfg-receiver-denon-avr-x2800h.json)
for the DENON AVR X2800H DAB. The following example shows the structure of the default and device specific configuration. 

```json
{
  "data": {
	"description": "API to connect to DENON devices using denonavr",
	"buttons"    : {
      "off": "async_power_off",
      "on": "async_power_on"
    },
	"commands"   : {
      "api-discovery": {
        "get": "api-discovery"
      },
      "power": {
        "cmd": ["get"],
        "get": "power"
      }
    },
    "volume": {
      "cmd": ["get", "set"],
      "description": "get and set volume",
      "get": "volume",
      "set": "async_set_volume({DATA})",
      "type": "integer",
      "values": {
          "max": 98,
          "min": 0
      }
    },
	"method"     : "query",
    "query" : {
      "load_intervals" : {},
      "load_default" : 10,
      "load_after" : [],
      "load_after_values" : []
      }
  },
  "information": "This file defines default buttons and commands that are valid for all connected devices."
}
```
**Hints:** 
* key values never should use "_", use "-" instead.
* to use the volume functionality in the app, use "volume" and "mute" as keys for the related commands
* to connect buttons directly to an icon, name them as shown in the "Settings > Information > Image buttons" or defined 
  in the related [config file](../../../data/buttons/default/index.json).

## Additional jc://remote/ API Commands

In addition to the DENON AVR specific API commands you can use the following jc://remote/ API command:

```json
{
  "jc.get_available_commands()": {
      "info": "get a list of all available commands"
  },
  "jc.mute()": {
      "info": "toggle mute"
  },
  "jc.volume()": {
      "info": "get volume as absolute value (0.0..98.0) instead of in dB (-80.0..18.0)"
  },
  "jc.set_volume({DATA})": {
      "info": "set volume as absolute value (0.0..98.0) instead of in dB (-80.0..18.0)"
  }
}
```