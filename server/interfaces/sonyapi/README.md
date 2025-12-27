# API Description: SONY

## Source

* Python sources: https://github.com/alexmohr/sonyapilib
* Compatibility list: https://github.com/alexmohr/sonyapilib#compatibility-list

## How to install a SONY device

1. Prepare the SONY device
    - Connect the SONY device to your network using its default app
    - Ensure on your router that your SONY device keeps the same IPv4 address everytime.
    - When you first use the device via API you've to register it, and you'll get a file with the device \
      specific information, such as the following: [SONY-BDP-S4500.json](../../../data/_sample/devices/SONY/SONY-BDP-S4500.json)
    - Follow the instructions in the sources, as this part is not yet fully integrated in to the jc://remote/ 
2. Add Controller to configuration
    - Restart the jc://remote/ server to trigger a device discovery immediately
    - Navigate in the app to "Settings > API Settings > API: SONY"
    - Ensure the related toggle is activated
    - Press "Add" to open the dialog, here you should find your SONY device in the list, if not check your router for the IP address
3. _Optional:_ Alternatively you can create an API config file using the app
    - save the config file as 00_interface.json in the folder [data/devices/SONY/00_interface.json](../../../data/_sample/devices/SONY/00_interface.json) 
      and restart the server
4. _Optional:_ To make changes at the configuration of your broadlink device: 
    - Option 1: change settings using the app in "Settings > API Settings > API: SONY" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    - Option 2: edit directly the file [data/devices/SONY/00_interface.json](../../../data/_sample/devices/SONY/00_interface.json) and restart the server when done.

## Usage of API Commands

The API commands are defined in two files. The definition of default commands for all DENON devices are defined in the file [data/devices/SONY/00_default.json](../../../data/_sample/devices/SONY/00_default.json).
Commands for specific devices are defined in device configs such as the file [bluray_sony-bdp-s4500.json](../../../data/_sample/devices/SONY/bluray_sony-bdp-s4500.json)
for the SONY BDP S4500. The following example shows the structure of the default and device specific configuration. 

 ```json
{
    "data": {
        "buttons": {
            "off": "PowerOff",
            "on": "PowerOn",
            "open": "Eject",
            "pause": "Pause",
        },
        "commands" : {
            "power": {
             	"get" : "power",
             	"type" : "enum",
             	"values" : ["ON", "OFF"]
             	},
            "media-duration": {
             	"get" : "SOAP=GetMediaInfo::MediaDuration"
             	},
            "playing": {
             	"get" : "playing"
             	}
        },
        "description": "SONY BDP-S4500"
    }
}

```

**Hints:** 
* key values never should use "_", use "-" instead.
* to use the volume functionality in the app, use "volume" and "mute" as keys for the related commands
* to connect buttons directly to an icon, name them as shown in the "Settings > Information > Image buttons" or defined 
  in the related [config file](../../../data/buttons/default/index.json).
* use **commands** defined here such as the following examples 
  (see [API documentation](https://github.com/alexmohr/sonyapilib) and [sample](../../../data/_sample/devices/SONY/bluray_sony-bdp-s4500.json) for details):
  * Pause
  * Play
  * TopMenu
  * ZoomIn
  * ...
* use **actions** defined such as the following example 
  (see [API documentation](https://github.com/alexmohr/sonyapilib) and [sample](../../../data/_sample/devices/SONY/bluray_sony-bdp-s4500.json) for details):
  * SOAP=GetMediaInfo::PlayMedium
  * SOAP=GetPositionInfo::AbsTime
  * ...

## Additional jc://remote/ API Commands

There are no jc://remote/ API commands defined at the moment.