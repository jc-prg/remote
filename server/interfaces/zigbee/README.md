
# API Description: ZigBee2MQTT

_Note:_ this API connection is still under construction ...

## Source

* API Description: https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html
* Python sources: https://github.com/Koenkk/zigbee2mqtt

## ZigBee2MQTT Server

To control ZigBee devices you've to set up a ZigBee2MQTT server. An easy way might be to use a 
[supported ZigBee adapter or device](https://www.zigbee2mqtt.io/guide/supported-hardware.html) and a docker-compose based server configuration.
This configuration comes with an own UI which can help to configure the devices.

### Activate

* To activate ZIGBEE set ```ZIGBEE2MQTT_START=YES``` in the [.env](../../../sample.env) file and configure 
  the correct IPv4 address and the correct ```/dev/ttyXXX``` in this file also. 
* Start the server using the [start](../../../start) script, this will start the ZigBee docker container in addition to the remote server.

### Configure MQTT Server

When started the server the first time using the included [docker configuration](../../../docker-compose-zigbee.yml), the default configuration will be created. 
Adjust this configuration to your needs by editing './data/zigbee2mqtt/zigbee/configuration.yml', e.g.:

```yaml
frontend: true                      # activate / disable frontend
permit_join: true                   # set true to allow the registration of new devices
mqtt:
  base_topic: zigbee2mqtt
  server: mqtt://192.168.x.x:1883   # use the current IP address of your ZigBee2MQTT server 
serial:
  port: /dev/ttyACM0                # connect your ZigBee USB adapter here
  adapter: ezsp                     # depending on your adapter it might be necessary to specify the adapter type (ezsp|deconz|xbee|zigate|znp)
```


### Configure App

Adjust the ZIGBEE2MQTT connector configuration: [data/devices/ZIGBEE2MQTT/00_interface.json](../../../data/_sample/devices/ZIGBEE2MQTT/00_interface.json).
This can be done using the API settings in the app. If you want to use an external MQTT server, set "USBDongle" = "".

```json
{
    "API-Description": "ZigBee2MQTT interfaces",
    "API-Devices": {
        "default": {
            "AdminURL": "http://192.168.x.x:8080/",
            "Description": "ZigBee2MQTT Server",
            "IPAddress": "192.168.x.x",
            "MacAddress": "",
            "Methods": [
                "send",
                "query"
            ],
            "MqttPassword": "",
            "MqttUser": "",
            "Port": 1883,
            "PowerDevice": "",
            "Timeout": 5,
            "USBDongle": "/dev/ttyACM0"
        }
    },
    "API-Info": "https://github.com/jc-prg/remote/blob/master/server/interfaces/zigbee2mqtt/README.md",
    "API-Source": "https://github.com/Koenkk/zigbee2mqtt"
}
```

## Device Definition

Currently, there is a default configuration [data/devices/ZIGBEE2MQTT/00_default.json](../../../data/_sample/devices/ZIGBEE2MQTT/00_default.json) and two device types are defined:

* Plug:  [data/devices/ZIGBEE2MQTT/zigbee-plug.json](../../../data/_sample/devices/ZIGBEE2MQTT/zigbee-plug.json)
* RGB+CCT Bulb:  [data/devices/ZIGBEE2MQTT/zigbee-bulb.json](../../../data/_sample/devices/ZIGBEE2MQTT/zigbee-bulb.json)

Those definitions can be created automatically from the configuration that comes with the devices. There in the app move
to "Settings > API Settings > API: ZIGBEE2MQTT", select the API-Device and jump to the sheet "create device config".
Here you can select all detected devices and can create a fitting config file. Adjust and save this config as a JSON 
file in the folder [data/devices/ZIGBEE2MQTT/](../../../data/_sample/devices/ZIGBEE2MQTT/).

If you want to create this file on your own, use the file ```10_devices.json``', tha will be created when starting the 
server with ZIGBEE2MQTT enabled. This file contains all relevant information to create a definition file as shown here:

```json
{
  "data": {
    "api_commands": {
      "permit-join": "request/permit_join={'value': true, 'time': 120}",
      "restart": "request/restart="
    },
    "buttons": {
      "off": "set={'state': 'OFF'}",
      "on": "set={'state': 'ON'}",
      "toggle": "set={'state': 'TOGGLE'}"
    },
    "commands": {
      "availability": {
        "get": "get=availability",
        "type": "enum",
        "values": [
          "online",
          "offline"
        ]
      },
      "link-quality": {
        "get": "get=linkquality"
      },
      "state": {
        "get": "get=state",
        "set": "get={'state': '{DATA}'}",
        "type": "enum",
        "values": [
          "ON",
          "OFF"
        ]
      }
    }
  }
}
```

## Connect devices

Per default the server doesn't accept new devices. Use the API setting ```permit-join``` in the app to activate this for 2 min. 
Further settings can be done using web front end of ZigBee2MQTT, which is accessible via http://localhost:8080/ or what you've 
configured.  In the settings you can add a device based on identified metadata. 
