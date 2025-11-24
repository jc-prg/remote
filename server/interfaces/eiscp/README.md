# API Description: ONKYO Devices

## Source

* Python sources: https://github.com/miracle2k/onkyo-eiscp/
* API documentation: https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml

## How to install a EISCP-ONKYO device

* This solution comes with a sample configuration [00_interface.json](../../../data/_sample/devices/EISCP-ONKYO/00_interface.json)
* to create a version based on all detected EISCP-ONKYO devices move in the app to the "Settings > API Settings > API: EISCP-ONKYO"
* Select the sheet "create API config" and press "create", this will create a fresh 
  [00_interface.json](../../../data/_sample/devices/EISCP-ONKYO/00_interface.json) for all detected devices
* Replace the whole file in the folder [/data/devices/EISCP-ONKYO](../../../data/_sample/devices/EISCP-ONKYO/) or use 
  the created config to adapt the existing configuration
* When done restart the server

## Usage of API Commands

* This solution comes with a sample default configuration [00_default.json](../../../data/_sample/devices/EISCP-ONKYO/00_default.json) and
  a device specific configuration for the [ONKYO TXNR686](../../../data/_sample/devices/EISCP-ONKYO/receiver_onkyo-txnr686.json).
* If you want to use a different supported device or extend the possibilities, use the commands defined in the 
  [API documentation](https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml) such as the following examples:
  * audio-muting=toggle
  * setup=home 
  * tuning=up
  * audio-muting={DATA} ... _if you want to send data_
  * ...
  
## Additional jc://remote/ API Commands

In addition to the ONKYO specific API commands you can use the following jc://remote/ API command:

```json
{
  "jc.get_available_commands()": {
      "info": "get a list of all available commands"
  },
  "jc.get_metadata(parameter)": {
      "description": "get consolidated metadata from device",
      "parameter": ["net-info"]
  }
}
```  