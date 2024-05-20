# API Description: SONY

## Source

* Python sources: https://github.com/alexmohr/sonyapilib
* Compatibility list: https://github.com/alexmohr/sonyapilib#compatibility-list

## Registration and list of commands

_Note:_ here are some information missing at the moment:

* When you first use the device via API you've to register it, and you'll get a file with the device \
  specific information, such as the following: [SONY-BDP-S4500.json](../../../data/_sample/devices/SONY/SONY-BDP-S4500.json)
* Follow the instructions in the sources, as this part is not yet fully integrated in to the jc://remote/ 

## Usage of API Commands

* use **commands** defined here such as the following examples:
  * Pause
  * Play
  * TopMenu
  * ZoomIn
  * ...

* use **actions** defined such as the following example:
  * SOAP=GetMediaInfo::PlayMedium
  * SOAP=GetPositionInfo::AbsTime
  * ...


## Additional jc://remote/ API Commands

There are no jc://remote/ API commands defined at the moment.