# API Description: ONKYO Devices

## Source

* Python sources: https://github.com/miracle2k/onkyo-eiscp/
* API documentation: https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml

## Usage of API Commands

* use commands defined in the API documentation such as the following examples:
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