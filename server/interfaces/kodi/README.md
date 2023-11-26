# API Description: KODI v13

## Source

* https://kodi.wiki/index.php?title=JSON-RPC_API/v13
* use commands defined here such as the following examples:
  * Addons.ExecuteAddon({'addonid': 'plugin.video.mediathekview'})
  * Input.ShowOSD()
  * GUI.ShowNotification(title='Hello World', message='Hello World!!!')
  * ...
  
## jc://remote/ API Commands

In addition to the KODI specific API commands you can use the following jc://remote/ API commands:

* jc.DecreaseVolume(5)
* jc.IncreaseVolume(5)
* jc.PlayerControl('&lt;parameter&gt;')
  * 'PlayPause'
  * 'Stop'
* jc.PlayerMetadata('&lt;parameter&gt;')
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
* jc.PlayingCommands('&lt;parameter&gt;')
  * 'Play'
* jc.PlayerSettings('Subtitle','on-off')
* jc.PlayerSettings('Speed','backward')
* jc.PlayerSettings('Speed','forward')
* jc.PowerStatus()
* jc.ToggleMute()