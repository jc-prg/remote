# API Description: Magic-Home

## Sources

* Python sources: https://github.com/adamkempenich/magichome-python
* Further README from the MagicHome API: [README-API.md](README-API.md)

## How to install a Magic-Home device

1. Prepare the Magic-Home device
    - Connect the Magic-Home to your network using its default app
    - Ensure on your router that your Magic-Home keeps the same IPv4 address everytime.
2. Add Controller to configuration
    - Restart the jc://remote/ server to trigger a device discovery immediately
    - Navigate in the app to "Settings > API Settings > API: MAGIC-HOME"
    - Ensure the related toggle is activated
    - Press "Add" to open the dialog, here you should find your SONY device in the list, if not check your router for the IP address
3. _Optional:_ Alternatively you can create an API config file using the app
    - save the config file as 00_interface.json in the folder [data/devices/MAGIC-HOME/00_interface.json](../../../data/_sample/devices/MAGIC-HOME/00_interface.json) 
      and restart the server
4. _Optional:_ To make changes at the configuration of your broadlink device: 
    - Option 1: change settings using the app in "Settings > API Settings > API: MAGIC-HOME" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    - Option 2: edit directly the file [data/devices/MAGIC-HOME/00_interface.json](../../../data/_sample/devices/MAGIC-HOME/00_interface.json) and restart the server when done.

## jc://remote/ API Commands

The Magic-Home API commands can't be used directly. Use the following jc://remote/ API commands instead. 
For details check the existing sample configuration file [light_magichome_LED.json](../../../data/_sample/devices/MAGIC-HOME/light_magichome_LED.json).

* jc.get_info('rgb') - _Get device information for the following parameters_
  * 'brightness'
  * 'rgb'
  * 'mode'
  * 'power'
  * 'preset'
  * 'speed'
  * 'raw_status'
* jc.set_brightness(100) - _Set brightness in percent_
* jc.set_color(0, 0, 0) - _Set color in (Red, Green, Blue) with values from 0 to 255_
* jc.set_preset(1) - _Set preset from 0 to 16_
* jc.set_speed(0) - _Set speed for programs from 0 to 100_
* jc.turn_on() - _Turn device on_
* jc.turn_off() - _Turn device of_
* jc.test()
