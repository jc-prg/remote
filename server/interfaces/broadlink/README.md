# API Description: BROADLINK

## Source

* Python sources: [mjg59/python-broadlink](https://github.com/mjg59/python-broadlink) v0.19.0.
  
## How to install a Broadlink RM controller

1. Load the Broadlink App for your mobile device
2. Connect the Broadlink device to your wifi network as described in the Quick Setup Guide: [https://www.ibroadlink.com/downloads](https://www.ibroadlink.com/downloads)
3. Unlock the device using the app in the device settings for RM4 mini
4. Check the connection and identify data required for configuration 
   - Move in the app to the "Settings > API Settings > API: BROADLINK", select the sheet "create API config" and press "create", 
     this will create a fresh [00_interface.json](../../../data/_sample/devices/BROADLINK/00_interface.json) for all BroadLink devices
     that are available at the moment. If your device is not found, try to restart the server.py.
   - Now, replace the whole file in the folder [/data/devices/BROADLINK/](../../../data/_sample/devices/BROADLINK/) or use 
     the created config to adapt the existing configuration
   - Alternativly, use the [test_connect.py](test_connect.py) to get all relevant data for the identified BroadLink devices and modify the 
     [00_interface.json](../../../data/_sample/devices/BROADLINK/00_interface.json) on your own as described in step 5.
5. Configure the broadlink device in jc://remote/ 
    * Option 1: change settings using the app in "Settings > API Settings > API: BROADLINK" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    * Option 2: edit the file [data/devices/BROADLINK/00_interfaces.json](BROADLINK.json)
6. Ensure on your router that your Broadlink device keeps the same IPv4 address everytime.

## Additional jc://remote/ API Commands

This device has no REST API that can be use to request information and there are no jc://remote/ API commands defined at the moment.
