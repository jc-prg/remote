# jc://remote/

With this software you can control several **home media devices** via Infrared and API with an app on your smartphone.
It requires a small server such as a Raspberry Pi and can control the hardware listed below. 
You can define remote controls for devices and create scenes that use those commands from 
those devices or macros to combine several commands on a single button. 
There are a few templates available to be used and modified.

## Table of Content

- [Currently Supported Hardware](#supported-hardware)
- [Screenshots](#screenshots)
- [Data structure](#data-structure)
- [Main features](#main-feature)
- [Used sources](#used-sources)
- [How to setup the software](#how-to-setup-the-software)
- [Integration of additional APIs and devices](#integration-of-additional-apis-and-devices)
- [Disclaimer](#disclaimer)


## Currently Supported Hardware

* Broadlink RM 3 Mini - Infrared receiver/sender
* Several ONKYO devices with API (see section modelsets [eiscp-commands.yaml](https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml))
* Several SONY devices with API (see [compatibility list](https://github.com/alexmohr/sonyapilib#compatibility-list))
* KODI server
* Magic Home compatible LED strips 
* Tapo SmartPlugs P100

## Screenshots

### Default theme on iPhone XS

<img src="./docs/remote_iphone_default_01.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_02.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_03.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_04.PNG" width="17%"> <img 
src="./docs/remote_iphone_15.PNG" width="17%"> <img 
src="./docs/remote_iphone_14.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_05.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_06.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_07.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_08.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_09.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_10.PNG" width="17%"> <img 
src="./docs/remote_iphone_default_11.PNG" width="17%"> 

### Default theme in the browser

<img src="./docs/remote_browser_01.png" width="48%"> <img src="./docs/remote_browser_03.png" width="48%">

### Dark theme on iPhone XS

<img src="./docs/remote_iphone_01.PNG" width="17%"> <img src="./docs/remote_iphone_11.PNG" width="17%"> <img 
src="./docs/remote_iphone_02.PNG" width="17%"> <img src="./docs/remote_iphone_03.PNG" width="17%"> <img 
src="./docs/remote_iphone_05.PNG" width="17%"> <img src="./docs/remote_iphone_04.PNG" width="17%"> <img 
src="./docs/remote_iphone_07.PNG" width="17%"> <img src="./docs/remote_iphone_06.PNG" width="17%"><img 
src="./docs/remote_iphone_09.PNG" width="17%"> <img src="./docs/remote_iphone_08.PNG" width="17%">

### Information and Settings on iPhone XS

<img src="./docs/remote_iphone_16.PNG" width="17%"> <img src="./docs/remote_iphone_17.PNG" width="17%"> <img 
src="./docs/remote_iphone_18.PNG" width="17%">

### Edit mode on iPhone XS

<img src="./docs/remote_edit_iphone_01.PNG" width="17%"> <img src="./docs/remote_edit_iphone_02.PNG" width="17%"> <img 
src="./docs/remote_edit_iphone_03.PNG" width="17%"> <img src="./docs/remote_edit_iphone_04.PNG" width="17%"> <img 
src="./docs/remote_edit_iphone_05.PNG" width="17%"> <img src="./docs/remote_edit_iphone_06.PNG" width="17%"> <img 
src="./docs/remote_edit_iphone_07.PNG" width="17%"> 


### Edit mode in the browser

<img src="./docs/remote_browser_edit_01.png" width="48%"> <img src="./docs/remote_browser_edit_02.png" width="48%"> <img 
src="./docs/remote_browser_edit_03.png" width="48%">

## Data structure

* [Description of data and configuration files](data/README.md)

## Main features

### App v2.9 / Server v2.3 (in progress)

* directly view and execute API commands for devices in edit mode
* edit interface configuration via app
* activate and deactivate interfaces
* simplify server configuration (.env), code refactoring, improve logging

**Note:** The data structure changed a bit. Recreate the _00_interface.json_ files by coping them from the 
folder [_sample/devices](data/_sample/devices) to the productive folders.

### App v2.8 / Server v2.1

* toggles to switch on and off devices
* power toggles in scene remotes to switch on/off a power socket for the scene
* optimized UX for editing mode
* moved scene macro editing to the scene remotes
* define automatic "switch off time" for IR devices in config files

### App v2.7 / Server v2.0

* add remote control for LED strips compatible with MagicHome
* add remote control for Tapo SmartPlugs
* add slider and color-picker for remotes
* stabilize API connections
* optimize logging and add error handling for JSON files

### App v2.6 / Server v1.9

* send text input to API for KODI API
* integrate jc://modules/ as sub-module
* integrate jc://app-framework / as sub-module
* Optimize data structure (sample data files, productive files ignored by git)

### App v2.5 / Server v1.9

* add/edit/delete device remote controls via web-client
* add/edit/delete scene remote controls via web-client
* edit remote layouts including preview in the browser
* API for Sony devices (sonyapilib)
* optimized UI (e.g. menu)

### App v2.4 / Server v1.8

* stabled app and API connection incl. better performance
* integrated volume slider
* smaller UI optimizations
* start script including update from GitHub
* cleaned up code

### App v2.3 / Server v1.7

* control devices via API (Onkyo-API, KODI)
* create and edit remote controls for devices (initial)
* record IR commands for devices
* record status for devices controlled via IR (not a direct API)
* read information for devices via API
* light / dark theme based on device preset (Safari)
* basic automatic tests (check data format, check server API requests, check Onkyo-API)
* docker environment for app and server incl. central configuration for multiple stages
* definition of devices and scenes based on a set of JSON files

### App & Server v1.x

* remote control for devices
* remote control for scenes incl. macros
* control devices via IR sender/receiver (Broadlink RM3 Mini)

## Used sources

Many thanks to the authors ...
  
* [BlackBeanControl](https://github.com/davorf/BlackBeanControl)
* [eiscp-onkyo](https://github.com/miracle2k/onkyo-eiscp)
* [KodiJson](https://github.com/jcsaaddupuy/python-kodijson)
* [SonyApiLib](https://https://github.com/alexmohr/sonyapilib)
* [MagicHome API](https://github.com/adamkempenich/magichome-python)
* [PyP100 API](https://github.com/fishbigger/TapoP100)
* Free icons and images: https://icon-icons.com/, https://www.freeicons.io/, https://www.flaticon.com/, https://icons8.com/, https://unsplash.com/

Own included modules:

* [jc://modules/](https://github.com/jc-prg/modules)
* [jc://app-framework/](https://github.com/jc-prg/app-framework)


## How to setup the software

### Prerequisites

In order to use jc://remote/ as it is, the following software must be installed:

1. git
2. docker, docker-compose


### How to install, configure and run the software

1. Clone this repository and the modules

    ```bash
    $ git clone https://github.com/jc-prg/remote.git
    $ git submodule update --init
    $ cd remote
    ```

2. Change settings: [sample.env](./sample.env)

    ```bash
    $ cp sample.env .env
    $ nano .env              # modify configuration for your needs
    ```

3. Install sample remote controls

    ```bash
    $ cd data/_sample
    $ ./install-config
    $ cd ../..
    ```

4. Build and start via docker-compose ..

    ```bash
    $ docker-compose build
    $ sudo ./start start
    ```

5. Open in browser depending on your settings, e.g., http://localhost:81/

6. To start automatically add the following line to your /etc/rc.local

    ```bash
    /<your_path_to_remote>/start start
    ```

7. Update from Github (works, if configuration file has not changed)

    ```bash
    $ sudo ./start update
    ```

8. Additional options are available in the start script

    ```bash
    $ sudo ./start update
    ```

## Integration of additional APIs and devices

Additional APIs can be added with a little effort if an API source written in Python is available. 
Find additional information [how to integrate APIs here](server/interfaces/README.md).

## Disclaimer

This is a private crafting project. Feel free to try out and improve ... and stay tuned.

