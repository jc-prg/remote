# API Description: TAPO P100

## Source

* Python sources: https://github.com/fishbigger/TapoP100

## jc://remote/ API Commands

The TAPO P100 API commands can't be used directly. Use the following jc://remote/ API commands instead:

* jc.get_info() - _Get complete data set from device_
* jc.get_info('&lt;parameter&gt;') - _Get device information, execute without parameter to get them all_
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
    .
  * 'default_status' - _unknown_
  * 'nickname' - _unknown_
  * 'oemid' - _unknown_
  * 'rssi' - _unknown_
  * 'specs' - _unknown_
  * 'ssid' - _unknown_
  * 'state' - _unknown_
  
* jc.test() - _Test power socket_
* jc.turn_on() - _Turn power socket on_
* jc.turn_off() - _Turn power socket off_
