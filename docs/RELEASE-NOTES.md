# jc://remote/ - srRelease Notes

## v3.1 (in progress)

* move remote controls to archive, check scene definition for errors
* recording of device and weather data and visualization via Chart.js
* integration of Open Meteo Weather (incl. GeoPy)
* integration of Denon API incl. discovery
* macro editing via app (instead of JSON editing)
* improved and cleaned up app code, several bugfixes

## v3.0

* simple implementation of device groups (use buttons for all devices of a group at the same time)
* integration of ZigBee interface (using a Zigbee USB Dongle and ZigBee2MQTT): Smart Socket + RGB+CCT Bulb + Smart Switch
* schedule events (device commands and macros)
* color picker for RGB, CIE_1391, brightness and color temperature
* RGB+CCT light templates
* improved layout for editing of remotes, and improved JSON editing
* improved setting section and API configuration via app, incl. device discovery for EISCP-ONKYO, KODI, and BROADLINK
* improved adaptive remote layout, e.g., button grid, scaling text in buttons, additional icons and scene headers
* improved error messages for device, scene status, config files, etc.

**Note:** The data structure changed: recreate configuration files by coping them from the 
folder [_sample/devices](data/_sample/devices) to the productive folders and adjusting them to your needs.

## App v2.9 / Server v2.3

* directly view and execute API commands for devices in edit mode
* edit interface configuration via app
* activate and deactivate interfaces
* simplify server configuration (.env), code and REST api refactoring, improve logging

**Note:** The data structure changed: recreate the _00_interface.json_ files by coping them from the 
folder [_sample/devices](data/_sample/devices) to the productive folders.

## App v2.8 / Server v2.1

* toggles to switch on and off devices
* power toggles in scene remotes to switch on/off a power socket for the scene
* optimized UX for editing mode
* moved scene macro editing to the scene remotes
* define automatic "switch off time" for IR devices in config files

## App v2.7 / Server v2.0

* add remote control for LED strips compatible with MagicHome
* add remote control for Tapo SmartPlugs
* add slider and color-picker for remotes
* stabilize API connections
* optimize logging and add error handling for JSON files

## App v2.6 / Server v1.9

* send text input to API for KODI API
* integrate jc://modules/ as sub-module
* integrate jc://app-framework / as sub-module
* Optimize data structure (sample data files, productive files ignored by git)

## App v2.5 / Server v1.9

* add/edit/delete device remote controls via web-client
* add/edit/delete scene remote controls via web-client
* edit remote layouts including preview in the browser
* API for Sony devices (sonyapilib)
* optimized UI (e.g. menu)

## App v2.4 / Server v1.8

* stabled app and API connection incl. better performance
* integrated volume slider
* smaller UI optimizations
* start script including update from GitHub
* cleaned up code

## App v2.3 / Server v1.7

* control devices via API (Onkyo-API, KODI)
* create and edit remote controls for devices (initial)
* record IR commands for devices
* record status for devices controlled via IR (not a direct API)
* read information for devices via API
* light / dark theme based on device preset (Safari)
* basic automatic tests (check data format, check server API requests, check Onkyo-API)
* docker environment for app and server incl. central configuration for multiple stages
* definition of devices and scenes based on a set of JSON files

## App & Server v1.x

* remote control for devices
* remote control for scenes incl. macros
* control devices via IR sender/receiver (Broadlink RM3 Mini)
