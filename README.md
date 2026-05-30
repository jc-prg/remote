# jc://remote/

With this software you can control several **media and home devices** via Infrared and API with 
a web-app, e.g., on your smartphone. It requires a small server such as a Raspberry Pi and can 
control the hardware listed below. You can define remote controls for devices and create scenes 
that use those commands from those devices or macros to combine several commands on a single button. 
There are a few templates available to be used and modified.

## Table of Contents

- [Supported Devices and Interfaces](#supported-devices-and-interfaces)
- [Screenshots](#screenshots)
- [Data structure](#data-structure)
- [Release notes](docs/RELEASE-NOTES.md)
- [Used sources](#used-sources)
- [How to setup the software](#how-to-setup-the-software)
- [Integration of additional APIs and devices](#integration-of-additional-apis-and-devices)
- [Disclaimer](#disclaimer)


## Supported Devices and Interfaces

1. Broadlink Remote Controls  ... [API Info](./server/interfaces/broadlink/README.md)
2. DENON devices with API ... [API Info](./server/interfaces/denon/README.md)
3. KODI server  ... [API Info](./server/interfaces/kodi/README.md)
4. Magic Home compatible LED strips  ... [API Info](./server/interfaces/magichome/README.md)
5. ONKYO devices with API ... [API Info](./server/interfaces/eiscp/README.md)
6. Open Meteo Weather / PyGeo ... [API-Info](./server/interfaces/weather/README.md)
7. SONY devices with API ... [API Info](./server/interfaces/sonyapi/README.md)
8. Tapo SmartPlugs P100 ... [API Info](./server/interfaces/p100/README.md)
9. ZigBee Devices via ZigBee2MQTT API ... [API Info](./server/interfaces/zigbee/README.md)

## Screenshots

<img src="./docs/app/light-theme-01.jpg" width="19%"> <img 
src="./docs/app/light-theme-09.jpg" width="19%"> <img 
src="./docs/app/light-theme-06.jpg" width="19%"> <img 
src="./docs/app/light-theme-02.jpg" width="19%"> <img 
src="./docs/app/light-theme-04.jpg" width="19%"> <img 
src="./docs/app/dark-theme-14.jpg" width="19%"> <img 
src="./docs/app/dark-theme-16.jpg" width="19%"> <img 
src="./docs/app/dark-theme-15.jpg" width="19%"> <img 
src="./docs/app/dark-theme-20.jpg" width="19%"> <img 
src="./docs/app/dark-theme-04.jpg" width="19%">

Find here [further screenshots](./docs/IMPRESSIONS.md) ...

## Architecture and data structure

* [Architecture overview](docs/concepts/architecture.html)
* [Description of data and configuration files](data/README.md)

## Used sources

Many thanks to the authors ...
  
* [BlackBeanControl](https://github.com/davorf/BlackBeanControl)
* [Chart.js](https://www.chartjs.org/)
* [DenonAVR](https://github.com/ol-iver/denonavr)
* [eiscp-onkyo](https://github.com/miracle2k/onkyo-eiscp)
* [KodiJson](https://github.com/jcsaaddupuy/python-kodijson)
* [SonyApiLib](https://https://github.com/alexmohr/sonyapilib)
* [MagicHome API](https://github.com/adamkempenich/magichome-python)
* [Open Meteo](https://open-meteo.com/)
* [PyP100 API](https://github.com/fishbigger/TapoP100)
* [ZigBee2MQTT](https://www.zigbee2mqtt.io/)
* Free icons and images: https://icon-icons.com/, https://www.freeicons.io/, https://www.flaticon.com/, https://icons8.com/, https://unsplash.com/, https://chatgpt.com

Own included modules:

* [jc://modules/](https://github.com/jc-prg/modules)
* [jc://app-framework/](https://github.com/jc-prg/app-framework)

Since v3.1 this app is crafted in co-creation with [Claude Code](https://claude.ai).

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

2. Use the start script to create configuration [.env](./sample.env) and build the required docker container.
   ```bash
    $ sudo ./start

   # use the following to manually build the container, requires an .env-file
   # $ docker-compose build
   ```

3. Open in browser depending on your settings, e.g., http://localhost:81/
4. Activate the required APIs and create your first device remote control in the settings
5. To start the server on start-up add the following line to your /etc/rc.local

    ```bash
    /<your_path_to_remote>/start start
    ```

6. Update from Github (works, if configuration file has not changed)

    ```bash
    $ sudo ./start update
    ```

## Integration of additional APIs and devices

Additional APIs can be added with a little effort if an API source written in Python is available. 
Find here additional information [how to integrate APIs](./docs/INTERFACES.md).

## Disclaimer

This is a private crafting project. 
Feel free to try out and use as is or improve. Contributions are welcome.
