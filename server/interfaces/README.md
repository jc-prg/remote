# Interfaces for jc://remote/

Find here some further information on the integrated APIs and how to integrate additional APIs.\

## Integrated interfaces

The following interfaces are integrated at the moment. 

* [BROADLINK](broadlink/README.md) / [api_broadlink.py](api_broadlink.py)
* [EISCP ONKYO](eiscp/README.md) / [api_eiscp.py](api_eiscp.py)
* [KODI v13](kodi/README.md) / [api_kodi.py](api_kodi.py)
* [MAGIC-HOME](magichome/README.md) / [api_magichome.py](api_magichome.py)
* [TAPO P100](p100/README.md) / [api_p100.py](api_p100.py)
* [SONY API](sonyapi/README.md) / [api_sony.py](api_sony.py)

## How to integrate new interfaces

* Find Python sources for the device API you want to integrate
* Copy sources to a sub-directory here
* Create a copy of the following code: [api_sample.py](api_sample.py)
* Add code to control the device API into the given framework; \
  check-out the other APIs to learn more about the possibilities
* Add the new api_*.py into the var **self.api_modules** in the file [interfaces.py](interfaces.py)


--------

_[Back to jc://remote/ documenation.](../../README.md)_
