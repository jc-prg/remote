#-----------------------------------
# KODI API using kodijson
# https://kodi.wiki/view/JSON-RPC_API/v10#Application.Property.Name
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config
import modules.rm3ping                 as rm3ping

from   interfaces.kodi             import Kodi

#-------------------------------------------------
# Execute command
#-------------------------------------------------

shorten_info_to = rm3config.shorten_info_to

#-------------------------------------------------

class APIcontrol():
   '''
   Integration of KODI API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",device_config={},log_command=False):
       '''
       Initialize API / check connect to device
       '''
       
       self.api_name        = api_name       
       self.api_description = "API for KODI Servers (basic functionality, under development)"
       self.not_connected   = "ERROR: Device not connected ("+api_name+"/"+device+")."
       self.status          = "Start"
       self.method          = "query"
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       self.log_command     = log_command

       self.api_config      = device_config
       self.api_url         = "http://"+str(self.api_config["IPAddress"])+":"+str(self.api_config["Port"])+"/jsonrpc"

       logging.info("_API-INIT: "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''
       Connect / check connection
       '''
       
       connect = rm3ping.ping(self.api_config["IPAddress"])
       if not connect:
         self.status = self.not_connected + " ... PING"
         logging.error(self.status)       
         return self.status

       self.status               = "Connected"
       self.count_error          = 0
       self.count_success        = 0

       try:
          self.api       = Kodi(self.api_url)

       except Exception as e:
          self.status = self.not_connected + " ... CONNECT " + str(e)
          logging.warn(self.status)

       try:
          self.api.jc    = APIaddOn(self.api)
          logging.debug(str(self.api.JSONRPC.Ping()))
          
          self.api.jc.status        = self.status
          self.api.jc.not_connected = self.not_connected

       except Exception as e:
          self.status = self.not_connected + " ... CONNECT " + str(e)
          logging.warn(self.status)
       
       
   #-------------------------------------------------
       
   def wait_if_working(self):
       '''
       Some devices run into problems, if send several requests at the same time
       '''
       
       while self.working:
         logging.debug(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------

   def power_status(self):
       '''
       request power status
       '''
       return self.jc.PlayerMetadata("power")
       
       
   #-------------------------------------------------
       
   def send(self,device,command):
       '''
       Send command to API
       '''

       result  = {}
       self.wait_if_working()
       self.working = True
       
       if self.status == "Connected":
         if self.log_command: logging.info("_SEND: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

         try:
           command = "self.api."+command
           result = eval(command)
           logging.debug(str(result))
           
           if "error" in result:
             self.working = False
             return "ERROR "+self.api_name+" - " + result["error"]["message"]
             
           if not "result" in result:
             self.working = False
             return "ERROR "+self.api_name+" - unexpected result format."           
             
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - query**: " + str(e)
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
       
   def query(self,device,command):
       '''
       Send command to API and wait for answer
       '''

       result  = {}
       self.wait_if_working()
       self.working = True

       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]

       if self.status == "Connected":
         if self.log_command: logging.info("_QUERY: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

         try:
           command = "self.api."+command_param[0]
           result = eval(command)
           logging.debug(str(result))
           
           if "error" in result:      
             self.working = False
             if "message" in result["error"]: msg = str(result["error"]["message"])
             else:                            msg = str(result["error"])
             return "ERROR "+self.api_name+" - " + msg
             
           elif not "result" in result: 
             self.working = False
             return "ERROR "+self.api_name+" - unexpected result format."
           
           else:
             if len(command_param) > 1: result_param = eval("result['result']"+command_param[1])
             else:                      result_param = str(result['result'])
           
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - query*: " + str(e) + " | " + command
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"
       
       self.working = False
       return result_param
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''
       Record command, especially build for IR devices
       '''
       
       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def register(self,command,pin=""):
       '''
       Register command if device requires registration to initialize authentification
       '''

       return "ERROR "+self.api_name+": Register not implemented"

       
   #-------------------------------------------------
       
   def test(self):
       '''
       Test device by sending a couple of commands
       '''

       self.wait_if_working()
       self.working = True

       try:
         self.api.GUI.ActivateWindow({"window":"home"})
         self.api.GUI.ActivateWindow({"window":"weather"})
       except Exception as e:
         self.working = False
         return "ERROR "+self.api_name+": "+str(e)

       self.working = False
       return "OK: Test done, check results"

#-------------------------------------------------
# additional functions -> define self.api.jc.*
#-------------------------------------------------

class APIaddOn():
   '''
   did not found a way to increase or decrease volume directly
   '''

   def __init__(self,api):
   
      self.addon          = "jc://addon/kodi/"
      self.api            = api
      self.volume         = 0
      self.cache_metadata = {}             # cache metadata to reduce api requests
      self.cache_time     = time.time()    # init cache time
      self.cache_wait     = 2              # time in seconds how much time should be between two api metadata requests
      
   #-------------------------------------------------
       
   def IncreaseVolume(self,step):
      '''
      get current volume and increase by step
      '''
      
      if self.status == "Connected":
         self.volume = self.api.Application.GetProperties({'properties': ['volume']})["result"]["volume"]
         #self.volume = self.PlayingMetadata("volume")["result"]
         
         logging.debug("Increase Volume:"+str(self.volume))
      
         if (self.volume + step) > 100: self.volume  = 100
         else:                          self.volume += step
         self.api.Application.SetVolume({ "volume" : int(self.volume) })
         return({"result" : self.volume})
         
      else:
         return self.not_connected

   #-------------------------------------------------
       
   def DecreaseVolume(self,step):
      '''
      get current volume and increase by step
      '''
      
      if self.status == "Connected":
         self.volume = self.api.Application.GetProperties({'properties': ['volume']})["result"]["volume"]
         #self.volume = self.PlayingMetadata("volume")["result"]

         logging.debug("Decrease Volume:"+str(self.volume))

         if (self.volume - step) < 0:   self.volume  = 0
         else:                          self.volume -= step
         self.api.Application.SetVolume({ "volume" : int(self.volume) })
         return({"result" : self.volume})
         
      else:
         return self.not_connected

   #-------------------------------------------------
       
   def ToggleMute(self):
      '''
      get muted value and set opposite state
      '''
      
      if self.status == "Connected":
         self.mute = self.api.Application.GetProperties({'properties': ['muted']})["result"]["muted"]
         #self.mute = self.PlayingMetadata("muted")["result"]

         logging.debug("Toggle Mute:"+str(self.mute))
      
         if self.mute: self.mute = False
         else:         self.mute = True

         self.api.Application.SetMute({ "mute" : self.mute })
         return({"result" : self.mute})
         
      else:
         return self.not_connected
      
   #-------------------------------------------------
   
   def PowerStatus(self):
      '''
      Return Power Status
      '''

      if self.status == "Connected":
         self.power = {}
         if self.status == "Connected": self.power = "ON"
         else:                          self.power = "OFF"
         return { "result" : self.power }
      
      else:
         return self.not_connected

   #-------------------------------------------------
   
   def KodiVersion(self):
      '''
      Return Kodi Version as string
      '''
       
      if self.status == "Connected":
         version      = {}
         version      = self.api.Application.GetProperties({'properties': ['version']})['result']['version']
         #version      = self.PlayingMetadata("version")["result"]

         self.version = "KODI "+str(version['major'])+"."+str(version['minor'])+" "+str(version['tag'])      
         return { "result" : self.version }        
      
      else:
         return self.not_connected
         
   #-------------------------------------------------
   # IDEA ... def NavigationCommands
   #-------------------------------------------------
   # analouge to the official KODI app ...
   # up / down - show information - if media is running
   # left / right - jump step back / jump step forward - if media is running
   # ...
         
   #-------------------------------------------------

   def ReplaceHTML(self,text):
      '''
      replace known html tags
      '''
      
      result = str(text)
      result = result.replace("[CR]","<br/>")
      result = result.replace("[B]","<b>")
      result = result.replace("[/B]","</b>")
      result = result.replace("[I]","<i>")
      result = result.replace("[/I]","</i>")
      result = result.replace("[/COLOR]","</font>")
      result = result.replace("[COLOR ","<font color=\"")
      if "<font" in result: result = result.replace("]","\">")
      
      return result
   
   #-------------------------------------------------

   def PlayerActive(self):
      '''
      Get infos for active player
      '''
      active  = self.api.Player.GetActivePlayers()

      if "error" in active:             return { "error" : str(active) }
      elif not "result" in active:      return { "error" : "API not available OR unknown error" }
      elif active["result"] == []:      active = active
      else:                             active = active["result"]         
  
      if "result" in str(active) and active["result"] == []:           
         return { "result" : "no media" }                                      
 
      elif 'playerid' in str(active):
         playerid    = active[0]['playerid']
         playertype  = active[0]['type']
         return { 'playerid' : playerid, 'playertype' : playertype }   
 
      else:
         return { "error" : "unknown error ("+str(active)+")" }

   #-------------------------------------------------
         
   def PlayerControl(self,command,values):
      '''
      Control player // https://kodi.wiki/view/JSON-RPC_API/v12#Player
      
      5.10.10 Player.PlayPause (= Play)
      5.10.21 Player.Stop
      5.10.1  Player.AddSubtitle   - not implemented yet
      5.10.7  Player.GoTo          - not implemented yet
      5.10.8  Player.Move          - not implemented yet
      5.10.9  Player.Open          - not implemented yet
      5.10.11 Player.Rotate        - not implemented yet
      5.10.12 Player.Seek          - not implemented yet
      5.10.22 Player.Zoom          - not implemented yet
      '''

      commands_not_implemented = ['AddSubtitle','GoTo','Move','Open','Rotate','Seek','Zoom']
      commands_implemented     = ['PlayPause','Stop','Play']

      if self.status == "Connected":

         active = self.PlayerActive()
         if "error" in active:    return active
         elif "result" in active: return active
         else:
            playerid   = active["playerid"]
            playertype = active["playertype"]
            player     = { 'playerid' : playerid }

         if command in commands_not_implemented:      return { "error"  : "command not implemented (" + unknown + ")" }
         elif command not in commands_implemented:    return { "error"  : "command unkown (" + unknown + ")" }
         elif command == "Play":                      msg = self.api.Player.PlayPause(player)
         elif command == "PlayPause":                 msg = self.api.Player.PlayPause(player)
         elif command == "Stop":                      msg = self.api.Player.Stop(player)

         if result["result"] != "OK":  return { "error" : command+": '"+str(value)+"' failed (" + str(result["result"]) + ")" }
         else:                         return { "result" : result }
         
      else:
         return self.not_connected

   #-------------------------------------------------
            
   def PlayerSettings(self,command,value):
      '''
      Settings for playing media // https://kodi.wiki/view/JSON-RPC_API/v12#Player
      
      5.10.13 Player.SetAudioStream
      5.10.17 Player.SetSpeed
      5.10.18 Player.SetSubtitle
      5.10.14 Player.SetPartymode    - not implemented yet
      5.10.15 Player.SetRepeat       - not implemented yet
      5.10.16 Player.SetShuffle      - not implemented yet
      5.10.19 Player.SetVideoStream  - not implemented yet
      5.10.20 Player.SetViewMode     - not implemented yet
      '''

      commands_not_implemented = ['Partymode','Repeat','Shuffle','Videostream','Viewmode']
      commands_implemented     = ['AudioStream','Subtitle','Speed']
      command_values = {
             "Subtitle"    : ['previous','next','on','off'],
             "AudioStream" : ['previous','next'],
             "Speed"       : [-32,-16,-8,-4,-2,-1,0,1,2,4,8,16,32]
             }

      if self.status == "Connected":

         active = self.PlayerActive()
         if "error" in active:    return active
         elif "result" in active: return active
         else:
            playerid   = active["playerid"]
            playertype = active["playertype"]

         if command in commands_not_implemented:      return { "error"  : "command not implemented yet (" + str(command) + ")" }
         elif command not in commands_implemented:    return { "error"  : "command unkown (" + str(command) + ")" }

         elif command == "AudioStream":
            current_status = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : ['audiostreams','currentaudiostream']})['result']
            if value in command_values["AudioStream"]:
               result = self.api.Player.SetAudioStream({'playerid' : playerid, 'stream' : value})
            else:
               return { "error" : "SetAudioStream: value not supported" }
               
         elif command == "Speed":
            current_status = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : ['speed']})['result']['speed']
            logging.debug("..... SPEED ... " + str(current_status))
            if value in command_values["Speed"]:
               result = self.api.Player.SetSpeed({'playerid' : playerid, 'speed' : value})
            elif value == "forward":
               if current_status <= 0:    current_status = 0
               elif current_status == 32: current_status = 0
               new_status = command_values["Speed"].index(current_status) + 1
               new_status = command_values["Speed"][new_status]
               result = self.api.Player.SetSpeed({'playerid' : playerid, 'speed' : new_status})
            elif value == "backward":
               if current_status >= 0:    current_status = 0
               elif current_status == -32: current_status = 0
               new_status = command_values["Speed"].index(current_status) - 1
               new_status = command_values["Speed"][new_status]
               result = self.api.Player.SetSpeed({'playerid' : playerid, 'speed' : new_status})
            else:
               return { "error" : "SetAudioStream: value not supported" }
               
         elif command == "Subtitle":
            current_status = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : ['subtitles','subtitleenabled','currentsubtitle']})['result']
            if value in command_values["Subtitle"]:
               result = self.api.Player.SetSubtitle({'playerid' : playerid, 'subtitle' : value})
            elif value == "on-off":
               if current_status['subtitleenabled']:  result = self.api.Player.SetSubtitle({'playerid' : playerid, 'subtitle' : 'off'})
               else:                                  result = self.api.Player.SetSubtitle({'playerid' : playerid, 'subtitle' : 'on'})
            else:
               return { "error" : "SetSubtitle: value not supported" }


         if result["result"] != "OK":  return { "error" : command+": '"+str(value)+"' failed (" + str(result["result"]) + ")" }
         else:                         return { "result" : result }
         
      else:
         return self.not_connected


   #-------------------------------------------------

         
   def PlayerMetadata(self,tag="",subtag=""):
      '''
      Get information from player // https://kodi.wiki/view/JSON-RPC_API/v12#Player

      5.10.2 Player.GetActivePlayers
      5.10.3 Player.GetItem
      5.10.4 Player.GetPlayers
      5.10.5 Player.GetProperties
      5.10.6 Player.GetViewMode    - not implemented yet
      '''
    
      all_media_properties =     [ "title", "artist", "albumartist", "genre", "year", "rating", "album", "track", "duration", "comment", 
                                 "lyrics", "musicbrainztrackid", "musicbrainzartistid", "musicbrainzalbumid", "musicbrainzalbumartistid", 
                                 "playcount", "fanart", "director", "trailer", "tagline", "plot", "plotoutline", "originaltitle", 
                                 "lastplayed", "writer", "studio", "mpaa", "cast", "country", "imdbnumber", "premiered", "productioncode", 
                                 "runtime", "set", "showlink", "streamdetails", "top250", "votes", "firstaired", "season", "episode", 
                                 "showtitle", "thumbnail", "file", "resume", "artistid", "albumid", "tvshowid", "setid", "watchedepisodes", 
                                 "disc", "tag", "art", "genreid", "displayartist", "albumartistid", "description", "theme", "mood", "style", 
                                 "albumlabel", "sorttitle", "episodeguide", "uniqueid", "dateadded", "channel", "channeltype", "hidden", 
                                 "locked", "channelnumber", "starttime", "endtime", "specialsortseason", "specialsortepisode", 
                                 "compilation", "releasetype", "albumreleasetype", "contributors", "displaycomposer", "displayconductor", 
                                 "displayorchestra", "displaylyricist", "userrating", "sortartist", "musicbrainzreleasegroupid", 
                                 "mediapath", "dynpath"
                                 ]              
      selected_media_properties      = ['title','album','artist','plot','mpaa','genre','episode','season','showtitle','studio','duration','runtime']             
      selected_system_properties     = ['version','muted','volume','language','name']
      selected_player_properties     = ['live','speed','percentage','position','playlistid','subtitles','currentsubtitle','audiostreams','currentaudiostream','subtitleenabled']
      selected_plist_properties      = ['size','type']
      selected_other_properties      = ['addons','addon-list','power']
      if_playing                     = ["player","playlist","playlist-position","playing","item","info","item-position","name"]


      if self.status == "Connected":
         metadata = {}

         # read all metadata from API (if no tag is given or tag requires to read all metadata)
         if (self.cache_metadata == {} or (self.cache_time + self.cache_wait) < time.time()) and tag not in all_media_properties and tag not in selected_system_properties and tag not in selected_player_properties and tag not in selected_plist_properties and tag not in selected_other_properties:
         
            application = self.api.Application.GetProperties({'properties': selected_system_properties })
            
            if "error" in application:        return application
            elif not "result" in application: return { "error" : "API not available OR unknown error" }
            else:                             application = application["result"]

            version     = application['version']
            version     = "KODI "+str(version['major'])+"."+str(version['minor'])+" "+str(version['tag'])      

            metadata["status"]             = time.time()
            metadata["application"]        = application
            metadata["addons"]             = self.AddOns("properties")["result"]
            metadata["addon-list"]         = self.AddOns("list")["result"]
            metadata["power"]              = self.PowerStatus()
            metadata["version"]            = version
                
            for param in if_playing: 
              metadata[param]              = "no media"
            
            active = self.PlayerActive()
            if "error" in active:    return active
            elif "result" in active: return active
            else:
              playerid   = active["playerid"]
              playertype = active["playertype"]

              player      = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : selected_player_properties })['result']

              playlistid  = player['playlistid']
              playlist    = self.api.Playlist.GetProperties({'playlistid' : playlistid, 'properties' : selected_plist_properties })['result']
              item        = self.api.Player.GetItem({'playerid' : playerid, 'properties': selected_media_properties })['result']['item']
              item2       = self.api.Player.GetItem({'playerid' : playerid, 'properties': all_media_properties })['result']['item']
              
              metadata["player"]             = player
              metadata["player-type"]        = playertype
              metadata["playlist"]           = playlist
              metadata["playlist-position"]  = [ player['position'] + 1, playlist['size'] ]
              metadata["playing"]            = [ playertype, playerid ]
              metadata["item"]               = item
              metadata["info"]               = ""
            
              if 'duration' in item:           metadata["item-position"]  = [ round(item['duration'] * player['percentage'] / 100,2), item['duration'] ]
              else:                            metadata["item-position"]  = "N/A"           

              if "showtitle" in item:
                if len(item['showtitle']) > 0: metadata["info"]           = item['showtitle'] + ": "
              
              if len(item['title']) > 0:       metadata["info"]           += item['title']
              elif len(item['label']) > 0:     metadata["info"]           += item['label']
              else:                            metadata["info"]           += "no title"
              
              if item['type'] == 'episode' and item['season'] > 0  and item['episode'] > 0:  
                                               metadata["info"]           += " (" + str(item['season']) + "-" + str(item['episode']) + ")"
                                             
              elif "album" in item and "artist" in item:
                if len(item['album']) > 0 and len(item['artist']) > 0:  metadata["info"] += " ("+item['album']+" / "+item['artist'][0]+")"
                elif len(item['album']) > 0:                            metadata["info"] += " ("+item['album']+")"
                elif len(item['artist']) > 0:                           metadata["info"] += " ("+item['artist'][0]+")"        
              
              metadata["info"]               = self.ReplaceHTML(metadata["info"])
              
            self.cache_metadata = metadata
              
         # read single matadata field from API (if possible)
         elif self.cache_metadata == {} or (self.cache_time + self.cache_wait) < time.time():

            if tag in selected_system_properties:  
              application = self.api.Application.GetProperties({'properties': selected_system_properties })
              if "error" in application:        return application
              elif not "result" in application: return { "error" : "API not available OR unknown error" }
              else:                             application = application["result"]
              
              version = application["version"]
              if tag == "version":  metadata[tag] = "KODI "+str(version['major'])+"."+str(version['minor'])+" "+str(version['tag'])      
              else:                 metadata[tag] = application[tag]

            elif tag in selected_other_properties:
            
              if   tag == "addons":      metadata[tag] = self.AddOns("properties")["result"]
              elif tag == "addon-list":  metadata[tag] = self.AddOns("list")["result"]
              elif tag == "power":       metadata[tag] = self.PowerStatus()
              

            elif tag in selected_player_properties or tag in selected_plist_properties or tag in selected_media_properties:
              active = self.PlayerActive()
              if "error" in active:    return active
              elif "result" in active: return active
              else:
                playerid   = active["playerid"]
                playertype = active["playertype"]
                player     = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : selected_player_properties })['result']
                playlistid = player['playlistid']

                if tag in selected_player_properties: 
                   if tag in player:
                      if player[tag] == [] or player[tag] == {}:  metadata[tag] = "none"
                      else:                                       metadata[tag] = player[tag]
                                            
                elif tag in selected_plist_properties:                
                   playlist            = self.api.Playlist.GetProperties({'playlistid' : playlistid, 'properties' : selected_plist_properties })['result']
                   if tag in playlist:
                      metadata[tag]    = playlist[tag]
                      
                elif tag in selected_media_properties:                
                   item                = self.api.Player.GetItem({'playerid' : playerid, 'properties': [ tag ] })['result']['item']
                   metadata[tag]       = self.ReplaceHTML(item)

            else:
              return { "error" : "unknown error ("+str(active)+")" }

         else:
            metadata            = self.cache_metadata
            
         #----------------------------------------------------         
                
                
         if tag != "item" and "item" in metadata:
           if "plot" in metadata["item"]:       metadata["item"]["plot"]       = self.ReplaceHTML(metadata["item"]["plot"])
           if "showtitle" in metadata["item"]:  metadata["item"]["showtitle"]  = self.ReplaceHTML(metadata["item"]["showtitle"])
           if "title" in metadata["item"]:      metadata["item"]["title"]      = self.ReplaceHTML(metadata["item"]["title"])

         if subtag != "" and tag in metadata and subtag in metadata[tag] :   return { "result" : metadata[tag][subtag] }
         elif tag in metadata:                                               return { "result" : metadata[tag] }
         elif "item" in metadata        and tag in metadata["item"]:         return { "result" : metadata["item"][tag] }
         elif "application" in metadata and tag in metadata["application"]:  return { "result" : metadata["application"][tag] }
         else:                                                               return { "error"  : "unknown tag (" + tag + ")" }
         
      else:
         return self.not_connected

   #-------------------------------------------------
   
   def AddOns(self,cmd=""):
      '''
      get infos for addons
      '''
       
      if self.status == "Connected":
         data   = self.api.Addons.GetAddons()['result']['addons']
         addons = []
       
         if cmd == "list" or cmd == "":
           for item in data:
             if item['type'] == 'xbmc.python.pluginsource':
               details = self.api.Addons.GetAddonDetails({ 'addonid' : item['addonid'], 'properties' : ['name'] })
               details = details['result']['addon']
               result  = self.ReplaceHTML(details['name'])
               addons.append(result)
           return { "result" : addons }
           
         elif cmd == "properties":
           for item in data:
             if item['type'] == 'xbmc.python.pluginsource':
               details            = self.api.Addons.GetAddonDetails({ 'addonid' : item['addonid'], 'properties' : ['name','description','enabled','installed'] })
               details            = details['result']['addon']
               details['addonid'] = item['addonid']
               details['name']    = self.ReplaceHTML(details['name'])
               addons.append(details)
           return { "result" : addons }
           
         else:
           return { "error"  : "unknown tag (" + tag + ")" }
   
      else:
         return self.not_connected
   

#-------------------------------------------------
# EOF





