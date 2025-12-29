# Interfaces for jc://remote/

Find here some further information on the integrated APIs and how to integrate additional APIs.\

## Integrated interfaces

The following interfaces are integrated at the moment. 

* [BROADLINK](../server/interfaces/broadlink/README.md) / [api_broadlink.py](../server/interfaces/api_broadlink.py)
* [EISCP ONKYO](../server/interfaces/eiscp/README.md) / [api_eiscp.py](../server/interfaces/api_eiscp.py)
* [DENON](../server/interfaces/denon/README.md) / [api_eiscp.py](../server/interfaces/api_denon.py)
* [KODI v13](../server/interfaces/kodi/README.md) / [api_kodi.py](../server/interfaces/api_kodi.py)
* [MAGIC-HOME](../server/interfaces/magichome/README.md) / [api_magichome.py](../server/interfaces/api_magichome.py)
* [SONY API](../server/interfaces/sonyapi/README.md) / [api_sony.py](../server/interfaces/api_sony.py)
* [TAPO P100](../server/interfaces/p100/README.md) / [api_p100.py](../server/interfaces/api_p100.py)
* [ZIGBEE](../server/interfaces/zigbee/README.md) / [api_zigbee.py](../server/interfaces/api_zigbee.py)

## Definitions

* **Device** - Remote control for an end device such as receiver, bluray player, smart sockets, light bulbs
* **Scene** - Remote control to control a set of devices
* **API** - Interface to control one or more API Devices (part of the server)
* **API-Device** - Device that controls the end devices which can be the end devices itself or hub devices the control several end devices (like the [BROADLINK](../server/interfaces/broadlink/README.md) device)

## How to integrate a new completely API

* Find Python sources for the device API you want to integrate
* Create a subdirectory in the python interface directory [server/interfaces](../server/interfaces/) for your new API connector using small letters and/or "_"
* Copy sources to a subdirectory here or just add a README.md to describe your API implementation if the sources are available via 'pip3 install'
* Create a copy of the sample API connector [api_sample.py](../server/interfaces/api_sample.py) and name it "api_<short-api-name>.py"
* If you use new external sources in this API connector, add them to the docker requirements in both files [container/requirements.txt](../config/container/requirements.txt) and
  [container_arm/requirements.txt](../config/container_arm/requirements.txt)
* Add code to control the device API into the given framework (check-out the other APIs to learn more about the possibilities)
* Add the new api_*.py into the var **self.api_modules** in the file [interfaces.py](../server/interfaces/interfaces.py)
* Create a copy of the sample API configuration [data/_sample/devices/SAMPLE/](../data/_sample/devices/SAMPLE/) and adjust it to your needs
* Create a new device in the file [data/_ACTIVE_DEVICES.json](../data/_sample/_ACTIVE-DEVICES.json) that uses this new interface

## How to create the configuration files

* create a directory (capital letters) for your device in the directory [/data/devices/](../data/devices/)
 
### API-Device integration and configuration

* For all already implemented APIs new API devices can be added in the app in the "Settings > API Settings". 
  The APIs Broadlink and Eiscp-Onkyo are supporting a discovery of related devices in the local network. For the others
  config files in the right format will be created that can be adapted to the specific device needs.

* For completely new APIs create the file **00_interface.json** in this directory that defines the connection to the 
  API-devices controlled by this API in the following format.
  * The content of the device definition might be different depending on the API, i.e., it might contain username and password.
  * There are multi device API-devices that are used to control several devices (such as ZigBee Hubs or Broadlink RM4).
  * Other devices are connected directly to the API such as ONKYO or SONY devices.

```json
{
  "API-Description": "",
  "API-Info": "https://put-url-here/",
  "API-Source": "https://put-url-here/",
  "API-Devices" : {
    "device01" : {
      "AdminURL": "http://192.168.1.10:8081/",
      "Description" : "API Device 01",
      "IPAddress": "192.168.1.10",
      "MACAddress": "AA:BB:CC:DD:EE:FF",
      "Methods": ["send","query"],
      "MultiDevice": true,
      "Port": "8080",
      "PowerDevice": "TAPO-P100_plug02",
      "Timeout": 5
      },
    "device02" : {
      "AdminURL": "http://192.168.1.11:8081/",
      "Description": "API Device 02",
      "IPAddress": "192.168.1.11",
      "MACAddress": "AA:BB:CC:DD:EE:00",
      "Methods": ["send","query"],
      "MultiDevice": true,
      "Port": "8080",
      "PowerDevice": "",
      "Timeout": 5
      }
    }
}
```

### Add API devices to the configuration

* Add API devices using the API Settings in the app: select the API and look for your device. The server will scan the network defined
  in [.env](../sample.env) as "REMOTE_LOCAL_NETWORK" for devices. If available it uses the discovery mechanism of the API.


### Default commands for all devices

* create the file **00_default.json** in this directory that defines commands that are valid for all devices controlled by this API using the following format:
```json
{
  "data": {
    "description" : "name or description of device or interface",
    "method" : "query",
    "buttons" : {
      "btn-name-1": "api_command",
      "btn-name-2": "api_command"
    },
    "commands" : {
      "cmd-name-3": {
        "get": "api_command",
        "set": "api_command",
        "type": "datatype (integer,boolean,...)",
        "param": [],
        "values": []
      },
      "cmd-name-4": {
        "get": "api_command",
        "set": "api_command",
        "type": "datatype (integer,boolean,...)",
        "param": [],
        "values": []
      },
      "cmd-name-5": {
        "get": "api_command",
        "set": "api_command",
        "type": "datatype (integer,boolean,...)",
        "param": [],
        "values": []
      }
    },
    "query" : {
      "load_interval": { "5": ["cmd-name-3", "cmd-name-4"] }, 
      "load_default": 60,
      "load_after": ["btn-name-1","cmd-name-3"],
      "load_after_commands": ["cmd-name-3","cmd-name-4"],
      "load_never": [],
      "load_only": ["cmd-name-1","cmd-name-2","cmd-name-3","cmd-name-4"]
    }
  }
}
```
**Hints:** 
* key values never should use "_", use "-" instead.
* to use the volume functionality in the app, use "volume" and "mute" as keys for the related commands
* to connect buttons directly to an icon, name them as shown in the "Settings > Information > Image buttons" or defined 
  in the related [config file](../data/buttons/default/index.json).
* In the **query** section you can set the following:
  * _load_interval_: load specific commands in a defined interval, e.g., "cmd_name_3" and "cmd_name_4" every 5 seconds (values from "commands")
  * _load_default_: load all commands at this default interval (integer)
  * _load_after_: after this commands load the values defined in _load_after_values_ in addition to the defined intervals (values from "commands" and "buttons")
  * _load_after_values_: defines values that will be loaded when _load_after_ (values from "commands")
  * _load_never_: not implemented yet
  * _load_only_: not implemented yet

### Device specific configurations

* Create a JSON file with device specific buttons and commands using the same format as **00_default.json**, 
  the device specific definition is added to the default configuration or overwrites where things are defined in both files.
* For ZigBee devices this file can be generated automatically in the API Settings of the app. 
  Open 'API: ZIGBEE2MQTT' and the desired API-Device, navigate to the sheet "API create config".



--------

_[Back to jc://remote/ documentation.](../README.md)_
