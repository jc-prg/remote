# API Description: Magic-Home

## Source

* https://github.com/adamkempenich/magichome-python
* Further README from the MagicHome API: [README-API.md](README-API.md)

## jc://remote/ API Commands

The Magic-Home API commands can't be used directly. Use the following jc://remote/ API commands instead:

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
