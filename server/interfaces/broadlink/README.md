# API Description: BROADLINK

## Source

* Python sources: [mjg59/python-broadlink](https://github.com/mjg59/python-broadlink) v0.19.0.
  
## How to install a Broadlink RM controller

1. Prepare the Broadlink RM Controller 
    - Load the Broadlink App for your mobile device
    - Connect the Broadlink device to your Wi-Fi network as described in the Quick Setup Guide: [https://www.ibroadlink.com/downloads](https://www.ibroadlink.com/downloads)
    - Ensure on your router that your Broadlink device keeps the same IPv4 address everytime.
    - Unlock the device using the app in the device settings for RM4 mini
2. Add Controller to configuration
    - Restart the jc://remote/ server to trigger a device discovery immediately
    - Navigate in the app to "Settings > API Settings > API: BROADLINK"
    - Ensure the related toggle is activated
    - Press "Add" to open the dialog, here you should find your RM Controller in the list 
3. Alternatively you can create an API config file using the app
    - save the config file as 00_interface.json in the folder [data/devices/BROADLINK/00_interface.json](../../../data/_sample/devices/BROADLINK/00_interface.json) 
      and restart the server
4. To make changes at the configuration of your broadlink device: 
    - Option 1: change settings using the app in "Settings > API Settings > API: BROADLINK" and reconnect. 
      Hint: there you only can change the configuration but not add another device.
    - Option 2: edit the file [data/devices/BROADLINK/00_interface.json](../../../data/_sample/devices/BROADLINK/00_interface.json)

## Add devices

1. Add devices to the Broadlink controller
    - Navigate in the app to "Settings > Device Settings > Add device"
    - Fill the dialog to and add the device
2. Create a remote control and record button commands
    - when added the device remote control it opens in edit mode
    - Navigate to the section "Edit Remote > Edit elements"
    - Add new buttons using "other buttons" - Hint: don't use "_" in the buttons name, the fresh buttons should appear in blue with a red border
    - Save the remote control
    - press onto the blue red bordered buttons to start recording a command from the original remote control

## Additional jc://remote/ API Commands

This device has no REST API that can be use to request information and there are no jc://remote/ API commands defined at the moment.
