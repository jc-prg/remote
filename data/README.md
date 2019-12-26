# jc://remote/data

## Data structure

* DEVICES
 * commands (interface)		-> button vs. commands
 * remotes (interface)		-> remote layouts, presets, display definition
 * interfaces			-> interface configuration

* SCENES
  * scenes			-> scene layouts
  * makros			-> makros = chain of commands (by devices and buttons)
  * templates			-> sample remote layouts
  * buttons			-> button configurations


## Description and How-to
### DEVICES
#### DEVICES / remotes

* define standard remotes based on buttons
* a standard theme has 4 buttons per row
* use "." to draw an empty field (instead of a button)
* use "LINE" to draw a line and start in a new row

#### DEVICES / commands

* defines commands per button

#### DEVICES / interfaces

* specifies configuration for the interaces



### SCENES
#### SCENES / buttons

* **button_colors.json**
  * Define colors for buttons (not implemented)

* **button_images.json**
  * define images for buttons (name of button/command -> file name)
  * use transparent png-files
  * define folder in config-file, see [../config/config_prod.sample](../config/config_prod.sample)
  * per default, the icons use from **jc-prg/modules**

### SCENES / makros

* define makros (sets of multiple buttons)
* use makros "dev-on" and "dev-off" to switch on / off devices
* use "<device>_<button>" to use a button from a specific device
* use "<device>_<button>||<value>" to send command only if value is different (value has to be tracked)
* use number to wait some seconds


### SCENES / scenes

* define remotes for a scene (e.g. cinema) mixed with buttons from multiple remotes
* a standard theme has 4 buttons per row
* use "." to draw an empty field (instead of a button)
* use "LINE" to draw a line and start in a new row
* use "makro_*" to use a makro
* use "device_button" to use a button from a specific device
* use "Remote" : [] to define remote control ("<device>_<button>")
* use "Channel" : {} to define channel list ("<channel_name>" : ["<device_button","<device_button"])

### SCENES / templates

* contains templates (remote definitions for reuse)

