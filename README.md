# jc://remote/

Based on the Script [BlackBeanControl)(#used-source) this software is build to control single IR devices or more complex scenes of several IR devices via a Web-App.

## Used Sources

* *Hardware:* Broadlink RM 3 Mini
* *Software:* BlackBeanControl (https://github.com/davorf/BlackBeanControl)

## How to setup the software

### Prerequisites

In order to use jc://music-box/ as it is you must have installed:

1. git
2. docker, docker-compose
3. python3, pip3, python2, pip
4. jc-modules [https://github.com/jc-prg/modules.git](https://github.com/jc-prg/modules.git)


### How to install, configure and run the software

1. Clone this repository and the modules

```bash
$ git clone https://github.com/jc-prg/remote.git
$ git clone https://github.com/jc-prg/modules.git
```

2. Change settings

```bash
$ cd remote\config
$ cp sample.config_prod config.prod
$ ./create_prod
```

3. Start via docker-compose ..

```bash
$ cd ..
$ sudo docker-compose build
$ sudo docker-compose up -d
```

4. Open in browser, e.g. http://localhost:81/


## Disclaimer

At the moment I'm reengineering the code. The goal is make it usable for other interested people also, and to integrate additional devices (e.g. ONKYO Receiver via API). 

A more detailed description will follow. Feel free already to try ... and stay tuned.
