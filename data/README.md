# jc://remote/data

Update data description in progress ...


## Data structure

* _sample configuration_
  - ./sample
  - ./sample/install-config
  - ./sample/*

* _active configuration_
  - \_ACTIVE-DEVICES.json
  - \_ACTIVE-MAKROS.json
  - \_ACTIVE-SCENES.json

* _button configuration_
  - ./buttons/default/*.png                  -> default button images (use transparent png-files)
  - ./buttons/default/index.json             -> define images for buttons
  - ./buttons/button_colors.json             -> color definition
  - ./buttons/scenes/*.png                   -> header images for scenes
  - ./buttons/scenes/index.json              -> image index

* _API and device configuration_
  - ./devices/<API>/00_interface.json        -> configure interfaces to devices
  - ./devices/<API>/00_default.json          -> configure default commands
  - ./devices/<API>/<device>.json            -> configuraton of device specific commands

* _remote control / API configuration_
  - ./remotes/<device_api>.json             -> specific remote configuration files

* _remote control templates_
  - ./templates/<device>.json               -> remote templates


## Description and How-to

### DEVICES

Remote controls for devices can be added, changed and deleted via edit mode in the GUI already and there are a few templates available:

* define standard remotes based on buttons
* a standard theme has 4 buttons per row
* use "." to draw an empty field (instead of a button)
* use "LINE" to draw a line and start in a new row


### INTERFACES

The interfaces have to be configured in the respective configuration files directly:

* set IP address and MAC address of the device per API
* if you want to addess more than one device per API add one section per device
* the connection between remote and device plus API is defined in the file \_ACTIVE-DEVICES.json


### MAKROS

Makros have to defined in the file \_ACTIVE-MAKROS.json:

* define makros (sets of multiple buttons)
* use makros "dev-on" and "dev-off" to switch on / off devices
* use "<device>_<button>" to use a button from a specific device
* use "<device>_<button>||<value>" to send command only if value is different (value has to be tracked)
* use number to wait some seconds


### SCENES

Remote controls for scenes can be added, changed and deleted via edit mode in the GUI already and there are a few templates available:

* define remotes for a scene (e.g. cinema) mixed with buttons from multiple remotes
* a standard theme has 4 buttons per row
* use "." to draw an empty field (instead of a button)
* use "LINE" to draw a line and start in a new row
* use "makro_*" to use a makro
* use "device_button" to use a button from a specific device
* use "Remote" : [] to define remote control ("<device>_<button>")
* use "Channel" : {} to define channel list ("<channel_name>" : ["<device_button","<device_button"])


