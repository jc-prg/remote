# API Description: TAPO P100

## Source

* Python sources: https://github.com/fishbigger/TapoP100

## jc://remote/ API Commands

The TAPO P100 API commands can't be used directly. Use the following jc://remote/ API commands instead:

```json
{
  "jc.get_available_commands()": {
      "info": "get a list of all available commands"
  },
  "jc.turn_on()": {
      "description": "turn smart plug on"
  },
  "jc.turn_off()": {
      "description": "turn smart plug off"
  },
  "jc.get_metadata(parameter)": {
      "description": "get metadata from device",
      "parameters": ['avatar', 'device_id', 'device_on', 'fw_ver', 'has_set_location_info', 'hw_ver', 'ip',
                     'lang', 'latitude', 'longitude', 'location', 'mac', 'model', 'on_time', 'overheated',
                     'power' 'region', 'signal_level', 'time_diff', 'type', 'default_status', 'nickname',
                     'oemid', 'rssi', 'specs', 'ssid', 'state']
  },
  "jc.test()": {
      "description": "switch on/off test sequence"
  }
}
```

Details for jc.get_metadata():

  * 'avatar' - _Get info for selected avatar_
  * 'device_id' - _Get device ID_
  * 'device_on' - _Get power status_
  * 'fw_ver' - _Get firmware version_
  * 'has_set_location_info' - _Get info if GPS data are set_
  * 'hw_ver' - _Get hardware version_
  * 'ip' - _Get IPv4 address_
  * 'lang' - _Get language_
  * 'latitude' - _Get GPS data - latitude_
  * 'longitude' - _Get GPS data - longitude_
  * 'location' - _Get device location (description set from user)_
  * 'mac' - _Get device MAC-Address of the device WiFi_
  * 'model' - _Get device model information_
  * 'on_time' - _Get time the device is on_
  * 'overheated' - _Get information if device is overheated_
  * 'power' - _Get power status_
  * 'region' - _Get geographic region_
  * 'signal_level' - _Get WIFI signal level_
  * 'time_diff' - _Get time difference in minutes_
  * 'type' - _Get device type_\
