# API Description: ONKYO Devices

## Source

* https://github.com/miracle2k/onkyo-eiscp/blob/master/eiscp-commands.yaml
* use commands defined here such as the following examples:
  * audio-muting=toggle
  * setup=home 
  * tuning=up
  * audio-muting={DATA} ... _if you want to send data_
  * ...
  
## jc://remote/ API Commands

In addition to the ONKYO specific API commands you can use the following jc://remote/ API command:

* jc.metadata('net-info') - _Get media info if playing via bluetooth from another device_
  