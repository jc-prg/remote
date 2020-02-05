# jc://remote/

Looking a remote control to control several devices I got disappointed ... and decided to develop my own web-app  running on my smartphone.
Therefore I found the **Broadlink RM 3 Mini** and sources on Github to control this IR device via API. About two years later several devices
as my new ONKYO receiver come with their own API and I started to rework my software and to integrate the first device via API directly ...

## Screenshots 

![light theme](docs/remote_standard.png)
Light theme on iPhone XS

![dark theme](docs/remote_dark.png)
Dark theme on iPhone XS

## Main features
### App v2.3 / Server v1.7

This is the first really good working version with API connection to devices.

* remote control for devices
* remote control for scenes incl. makros
* control devices via API (IR-Sender, Onkyo-API, KODI)
* create and edit remote controls for devices (initial)
* record IR commands for devices
* record status for devices controlled via IR (not a direct API)
* read information for devices via API
* light / dark theme based on device preset (Safari)
* basic automatic tests (check data format, check server API requests, check Onky API)

The definition of devices and scenes at the moment should be done based a set of JSON files. 
The code comes with several sample device and scene definitions that explain the possible options.
The integration of the device APIs is done in an easy way, so that the integration of additional device API should be easy also.

## Supported Hardware

* Broadlink RM 3 Mini - Infrared receiver/sender
* Several ONKYO devices with API (see section modelsets in the file eiscp-commands.yaml in https://github.com/miracle2k/onkyo-eiscp)
* KODI server (e.g. also installed on the Raspberry PI)
* *Other devices easily can be integrated*

## Used Sources

Many thanks to the authors ...
  
* BlackBeanControl (https://github.com/davorf/BlackBeanControl)
* eiscp-onkyo (https://github.com/miracle2k/onkyo-eiscp)
* KodiJson (https://github.com/jcsaaddupuy/python-kodijson)
* Free icons from (https://icon-icons.com/), (https://www.freeicons.io/), (https://www.flaticon.com/), and (https://icons8.com/)


## How to setup the software

### Prerequisites

In order to use jc://remote/ as it is, the following software must be installed:

1. git
2. docker, docker-compose


### How to install, configure and run the software

1. Clone this repository and the modules

```bash
$ git clone https://github.com/jc-prg/remote.git
$ git clone https://github.com/jc-prg/modules.git
```

2. Change settings

```bash
$ cd remote\config
$ cp sample.config_prod config_prod
$ ./create prod
```

3. Build and start via docker-compose ..

```bash
$ cd ..
$ docker-compose build
$ ./start
```

4. Open in browser, e.g. http://localhost:81/


## Disclaimer

I've tried to make the code usable for others also but still developing. Next steps could be:

* integrate additional API (e.g. Sony devices ...)
* editing of device remote controls (move buttons, assign API-commands, ...)
* editing of scene remote controls

A more detailed description will follow. Feel free already to try and to improve ... and stay tuned.

