# API Description: KODI v13

## Sources

* Python sources: https://github.com/jcsaaddupuy/python-kodijson
* API documentation: https://kodi.wiki/index.php?title=JSON-RPC_API/v13

## Usage of API Commands

* use commands from the KODI API such as the following examples:
  * Addons.ExecuteAddon({'addonid': 'plugin.video.mediathekview'})
  * Addons.GetAddons()
  * GUI.ActivateWindow({'window':'pictures'})
  * GUI.ShowNotification(title='Hello World', message='Hello World!!!')
  * Input.Info()
  * Input.Left()
  * Input.Select()
  * Input.ShowOSD()
  * ...
  
## Additional jc://remote/ API Commands

In addition to the KODI API commands you can use the following jc://remote/ API commands. 
Those commands doesn't cover all parameters and possibilities of the KODI API but are intended 
to make the access to important commands a bit easier.

```json
{
  "jc.get_addons(parameter)": {
      "description": "get a list off installed KODI addons",
      "parameter": ["list", "properties"]
  },
  "jc.get_available_commands()": {
      "info": "get a list of all available commands"
  },
  "jc.get_metadata(category, parameter)": {
      "description": "get metadata from server, playback, etc.",
      "categories": ["title", "album", "artist", "plot", "mpaa", "genre", "episode", "season",
                   "showtitle", "studio", "duration", "runtime", "version", "muted", "volume",
                   "language", "name", "live", "speed", "percentage", "position", "playlistid", "subtitles",
                   "currentsubtitle", "audiostreams", "currentaudiostream", "subtitleenabled", "size",
                   "type", "addons", "addon-list", "power", "player", "playlist", "playlist-position",
                   "playing", "item", "info", "item-position", "name"]
  },
  "jc.set_player(category, parameter)": {
      "description": "player control",
      "parameters": {
          "Playback": ["Play", "Stop", "PlayPause"],
          "Subtitle": ['previous', 'next', 'on', 'off'],
          "AudioStream": ['previous', 'next'],
          "Speed": ["default", "forward", "backward", -32, -16, -8, -4, -2, -1, 0, 1, 2, 4, 8, 16, 32]
      }
  },
  "jc.set_volume(category, parameter)": {
      "description": "control volume settings",
      "parameters" : {
          "up": "integer: 1..100",
          "down": "integer: 1..100",
          "value": "integer: 1..100",
          "mute": "boolean: True|False"
      }
  },
  "jc.set_addons(addon, command)": {
      "description": "not implemented yet",
      "addon": "'addonid' of addon to be controlled (use jc.get_metadata('addons') to see available addons)'",
      "command": ["start", "execute"]
  }
}
```