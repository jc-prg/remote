# API Description: KODI v13

## Sources

* Python sources: https://github.com/jcsaaddupuy/python-kodijson
* API documentation: https://kodi.wiki/index.php?title=JSON-RPC_API/v13

## Usage of API Commands

* use commands defined here such as the following examples:
  * Addons.ExecuteAddon({'addonid': 'plugin.video.mediathekview'})
  * Input.ShowOSD()
  * GUI.ShowNotification(title='Hello World', message='Hello World!!!')
  * ...
  
## Additional jc://remote/ API Commands

In addition to the KODI specific API commands you can use the following jc://remote/ API commands. 
Those commands doesn't cover all parameters and possibilities of the KODI API but are intended 
to make the access to important commands a bit easier.

* jc.DecreaseVolume(&lt;value&gt;) - _decrease volume by &lt;value&gt; on a scale from 0 to 100_
* jc.IncreaseVolume(&lt;value&gt;) - _increase volume by &lt;value&gt; on a scale from 0 to 100_
* jc.KodiVersion() - _get KODI version from connected server_
* jc.PlayerControl('&lt;parameter&gt;') - _basic commands to control playback_
  * 'Play'
  * 'PlayPause'
  * 'Stop'
* jc.PlayerMetadata('&lt;parameter&gt;')  - _get information from player_
  * 'addon-list'
  * 'currentsubtitle'
  * 'genre'
  * 'info'
  * 'item-position'
  * 'muted'
  * 'playing'
  * 'playlist-position'
  * 'plot'
  * 'subtitles'
  * 'subtitleenabled'
  * 'type'
  * 'version'
  * 'volume'
* jc.PlayerSettings('&lt;parameter#1&gt;','&lt;parameter#1&gt;')
  * 'Subtitle', 'on' - _switch subtitle on_
  * 'Subtitle', 'off' - _switch subtitle off_
  * 'Subtitle', 'next' - _switch subtitle to next available_
  * 'Subtitle', 'previous' - _switch subtitle to previous available_
  * 'Subtitle', 'on-off' - _switch subtitle on and off_
  * 'Speed','backward' - _play backward, press more often to change speed_
  * 'Speed','forward' - _play forward, press more often to change speed_
  * 'Audiostream','previous' - _change audio stream: previous available_
  * 'Audiostream','next' - _change audio stream: next available_
* jc.PowerStatus() - _get power status from connected server_
* jc.ToggleMute() - _set mute on or off_