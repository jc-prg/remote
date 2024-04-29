# Interfaces for jc://remote/

Find here some further information on the integrated APIs and how to integrate additional APIs.\

## Integrated interfaces

The following interfaces are integrated at the moment. 

* [BROADLINK](broadlink/README.md) / [api_broadlink.py](api_broadlink.py)
* [EISCP ONKYO](eiscp/README.md) / [api_eiscp.py](api_eiscp.py)
* [KODI v13](kodi/README.md) / [api_kodi.py](api_kodi.py)
* [MAGIC-HOME](magichome/README.md) / [api_magichome.py](api_magichome.py)
* [TAPO P100](p100/README.md) / [api_p100.py](api_p100.py)
* [SONY API](sonyapi/README.md) / [api_sony.py](api_sony.py)

## Definitions

* **Remote** - Remote control for a single device
* **Scene** - Remote control to control a set of devices
* **Device** - End device to be control such as receiver, bluray player, smart sockets, light bulbs
* **API** - Interface to control one or more API Devices
* **API-Device** - Device that controls the end devices which can be the end devices itself or hub devices the control several end devices (like the [BROADLINK](broadlink/README.md) device)

## How to integrate new interfaces

* Find Python sources for the device API you want to integrate
* Create a subdirectory for your new API connector using small letters and/or "_"
* Copy sources to a subdirectory here or just add a README.md to describe your API implementation if the sources are available via 'pip3 install'
* Create a copy of the sample API connector [api_sample.py](api_sample.py) and name it "api_<short-api-name>.py"
* If you use new external sources in this API connector, add them to the docker requirements in both files [container/requirements.txt](../../config/container/requirements.txt) and
  [container_arm/requirements.txt](../../config/container_arm/requirements.txt)
* Add code to control the device API into the given framework (check-out the other APIs to learn more about the possibilities)
* Add the new api_*.py into the var **self.api_modules** in the file [interfaces.py](interfaces.py)
* Create a copy of the sample API configuration [data/_sample/devices/SAMPLE/](../../data/_sample/devices/SAMPLE/) and adjust it to your needs
* Create a new device in the file [data/_ACTIVE_DEVICES.json](../../data/_sample/_ACTIVE-DEVICES.json) that uses this new interface

## How to create the configuration files

* create a directory (capital letters) for your device in the directory [/data/devices/](../../data/devices/)
* create the file **00_default.json** in this directory that defines commands for all devices controlled by this API using the following format :

```json
{
  "data": {
    "description" : "",
    "method" : "query",
    "buttons" : {
      "name": "api_command"
      },
    "commands" : {
      "name": "api_command"
      }
  }
}
```

* create the file **00_interface.json** in this directory that defines the connection to the devices controlled by this API (the content of the device definition might be different depending on the API, i.e., it might contain username and password):

```json
{
  "API-Description": "",
  "API-Info": "https://put-url-here/",
  "API-Source": "https://put-url-here/",
  "API-Devices" : {
    "device01" : {
      "IPAddress": "192.168.1.10",
      "Port": "8080",
      "Timeout": 5,
      "Methods": ["send","query"],
      "Description" : ""
      },
    "device02" : {
      "IPAddress": "192.168.1.11",
      "Port": "8080",
      "Timeout": 5,
      "Methods": ["send","query"],
      "Description": ""
      }
    }
}
```

--------

_[Back to jc://remote/ documenation.](../../README.md)_
