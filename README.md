# jc://remote/

Looking a remote control to control several devices I got disappointed ... and decided to develop my own web-app  running on my smartphone.
Therefore I found the **Broadlink RM 3 Mini** and sources on Github to control this IR device via API. About two years later several devices
as my new ONKYO receiver come with their own API and I started to rework my software and to integrate the first device via API directly ...

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

In order to use jc://remote/ as it is you must have installed:

1. git
2. docker, docker-compose
3. jc-modules ([https://github.com/jc-prg/modules.git](https://github.com/jc-prg/modules.git))


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

3. Start via docker-compose ..

```bash
$ cd ..
$ ./start
```

4. Open in browser, e.g. http://localhost:81/


## Disclaimer

At the moment I'm reengineering the code. The goal is make it usable for other interested people also, and to integrate additional devices (e.g. ONKYO Receiver via API). 

A more detailed description will follow. Feel free already to try ... and stay tuned.
