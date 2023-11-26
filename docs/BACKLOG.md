# jc://remote/backlog/

## Bugs

* BUG - creating scene: 
        returns "ERROR: module 'modules' has no attribute 'active_scenes'"
* BUG - creating device: 
        returns "ERROR: [Errno 2] No such file or directory: '/projects/test/remote/data/devices/BROADLINK_default/cc_cc.json'"
        data/device/<API>/<device-config>.json is not created

  -> if created, wrong button commands are used (e.g. imported template for beamer and uses buttons from screen ... ?!)

## ToDo

* set value without executing the command (or ignore if device is offline)
  * when IR device automatically start with switch on the power; change power value in the settings 

## Last Done

* jc://msg/ -> wait dialog based on system time
* srv: respect auto-off time off devices that are only controlled via IR (e.g. TV receiver get off after 3h without a button was pressed)
