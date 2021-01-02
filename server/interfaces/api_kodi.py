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

class kodiAPI():
   '''
   Integration of KODI API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",ip_address=""):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "API for KODI Servers (basic functionality, under development)"
       self.api_config      = rm3json.read("interfaces/kodi/"+self.api_name,data_dir=False)

       if ip_address != "":
          self.api_config["IPAddress"] = ip_address       

       self.api_url         = "http://"+str(self.api_config["IPAddress"])+":"+str(self.api_config["Port"])+"/jsonrpc"
       self.working         = False
       self.status          = "Started"
       self.method          = "query"
       self.not_connected   = "Device not connected (KODI)."
       self.count_error     = 0
       self.count_success   = 0

       logging.info("... "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       logging.debug(self.api_url)
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       connect = rm3ping.ping(self.api_config["IPAddress"])
       if connect == False:
         self.status = "IR Device not available (ping to "+self.api_config["IPAddress"]+" failed)"
         logging.error(self.status)       
         return self.status

       try:
          self.api    = Kodi(self.api_url)
          #self.api   = Kodi(self.api_url, "login", "password")
          self.api.jc = kodiAPIaddOn(self.api)
          logging.debug(str(self.api.JSONRPC.Ping()))
          
          self.count_error          = 0
          self.count_success        = 0
          self.status               = "Connected"
          self.api.jc.status        = "Connected"
          self.api.jc.not_connected = self.not_connected

       except Exception as e:
          self.status               = "Error connecting to KODI server: " + str(e)
          logging.warn(self.status)
       
       
   #-------------------------------------------------
       
   def wait_if_working(self):
       '''Some devices run into problems, if send several requests at the same time'''
       while self.working:
         logging.debug(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------
       
   def send(self,device,command):
       '''Send command to API'''

       self.wait_if_working()
       self.working = True
       
       result  = {}
       logging.info("Button-Code: "+command[:shorten_info_to]+"... ("+self.api_name+")")

       if self.status == "Connected":
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
           return "ERROR "+self.api_name+" - query: " + str(e)
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
       
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       self.wait_if_working()
       self.working = True
       
       result  = {}
       logging.debug("Button-Code: "+command[:shorten_info_to]+"... ("+self.api_name+")")

       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]

       if self.status == "Connected":
         try:
           command = "self.api."+command_param[0]
           result = eval(command)
           logging.debug(str(result))
           
           if "error" in result:      
             self.working = False
             return "ERROR "+self.api_name+" - " + result["error"]["message"]
             
           if not "result" in result: 
             self.working = False
             return "ERROR "+self.api_name+" - unexpected result format."
           
           if len(command_param) > 1: result_param = eval("result['result']"+command_param[1])
           else:                      result_param = str(result['result'])
           
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - query: " + str(e) + " | " + command
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"
       
       self.working = False
       return result_param
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''Record command, especially build for IR devices'''
       
       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def register(self,command,pin=""):
       '''Register command if device requires registration to initialize authentification'''

       return "ERROR "+self.api_name+": Register not implemented"

       
   #-------------------------------------------------
       
   def test(self):
       '''Test device by sending a couple of commands'''

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

class kodiAPIaddOn():
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
      '''get current volume and increase by step'''
      
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
      '''get current volume and increase by step'''
      
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
      '''get muted value and set opposite state'''
      
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
      '''Return Power Status'''

      if self.status == "Connected":
         self.power = {}
         if self.status == "Connected": self.power = "ON"
         else:                          self.power = "OFF"
         return { "result" : self.power }
      
      else:
         return self.not_connected

   #-------------------------------------------------
   
   def KodiVersion(self):
      '''Return Kodi Version as string'''
       
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
   
   def PlayingCommands(self,command):
      '''Send play, pause, stop to active device'''

      if self.status == "Connected":
         active     = self.api.Player.GetActivePlayers()['result']        
         try:
           msg        = ""
           player     = { 'playerid' : active[0]['playerid'] }
           
           if command == "Play"        : msg = self.api.Player.PlayPause(player)
           elif command == "PlayPause" : msg = self.api.Player.PlayPause(player)
           elif command == "Stop"      : msg = self.api.Player.Stop(player)
           
           if msg != "" and not "error" in str(msg):  return { "result" : "OK" }
           elif "error" in str(msg):                  return msg
           else:                                      return { "error"  : "command not defined" }
           
         except Exception as e:
           logging.warn("error" + str(e))
           return { "result" : "no media loaded" }
         
      else:
         return self.not_connected
         
   #-------------------------------------------------

   def ReplaceHTML(self,text):
      '''replace known html tags'''
      
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
         
   def PlayingMetadata(self,tag=""):
      '''
      Return title of playing item
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
      selected_media_properties  = ['title','album','artist','plot','mpaa','genre','episode','season','showtitle','studio','duration','runtime']             
      selected_system_properties = ['version','muted','volume','language','name']
      selected_player_properties = ['live','speed','percentage','position','playlistid']
      selected_plist_properties  = ['size','type']
      selected_other_properties  = ['addons','addon-list','power']
      if_playing                 = ["player","playlist","playlist-position","playing","item","info","item-position","name"]


      if self.status == "Connected":
         metadata = {}

         # read all metadata from API (if no tag is given or tag requires to read all metadata)
         if (self.cache_metadata == {} or (self.cache_time + self.cache_wait) < time.time()) and tag not in all_media_properties and tag not in selected_system_properties and tag not in selected_player_properties and tag not in selected_plist_properties and tag not in selected_other_properties:
         
            active      = self.api.Player.GetActivePlayers()
            
            if "error" in active:             return active
            elif not "result" in active:      return { "error" : "API not available OR unknown error" }
            elif active["result"] == []:      active = active
            else:                             active = active["result"]         
  
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
            

            if "result" in str(active) and active["result"] == []:
            
              logging.info("KODI API: no media loaded")
              return { "result" : "no media" }

                                            
            elif 'playerid' in str(active):     
         
              playerid    = active[0]['playerid']
              playertype  = active[0]['type']   

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
              

            else:
              return { "error" : "unknown error ("+str(active)+")" }

              
            self.cache_metadata = metadata
              
         # read single matadata field from API (if possible)
         elif self.cache_metadata == {} or (self.cache_time + self.cache_wait) < time.time():

            active      = self.api.Player.GetActivePlayers()
            if "error" in active:             return active
            elif not "result" in active:      return { "error" : "API not available OR unknown error" }
            elif active["result"] == []:      active = active
            else:                             active = active["result"]

            if tag in selected_system_properties:
  
              application = self.api.Application.GetProperties({'properties': selected_system_properties })
              if "error" in application:        return application
              elif not "result" in application: return { "error" : "API not available OR unknown error" }
              else:                             application = application["result"]
              
              version = application["version"]
              if tag == "version":  metadata[tag] = "KODI "+str(version['major'])+"."+str(version['minor'])+" "+str(version['tag'])      
              else:                 metadata[tag] = application[tag]

#              metadata[tag] = application


            elif tag in selected_other_properties:
            
              if   tag == "addons":      metadata[tag] = self.AddOns("properties")["result"]
              elif tag == "addon-list":  metadata[tag] = self.AddOns("list")["result"]
              elif tag == "power":       metadata[tag] = self.PowerStatus()
              

            elif tag in selected_player_properties or tag in selected_plist_properties or selected_media_properties:
                        
              if "result" in str(active) and active["result"] == []:          
                logging.info("KODI API: no media loaded ("+str(tag)+")")
                return { "result" : "no media" }
                                            
              elif 'playerid' in str(active):     
                playerid           = active[0]['playerid']
                playertype         = active[0]['type']   
                player             = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : selected_player_properties })['result']
                playlistid         = player['playlistid']
                
                if tag in selected_player_properties: 
                   if tag in player: 
                      metadata[tag]    = player[tag]
                if tag in selected_plist_properties:                
                   playlist            = self.api.Playlist.GetProperties({'playlistid' : playlistid, 'properties' : selected_plist_properties })['result']
                   if tag in playlist:
                      metadata[tag]    = playlist[tag]
                if tag in selected_media_properties:                
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

         if   tag in metadata:                                               return { "result" : metadata[tag] }
         elif "item" in metadata        and tag in metadata["item"]:         return { "result" : metadata["item"][tag] }
         elif "application" in metadata and tag in metadata["application"]:  return { "result" : metadata["application"][tag] }
         else:                                                               return { "error"  : "unknown tag (" + tag + ")" }
         
      else:
         return self.not_connected

   #-------------------------------------------------
   
   def AddOns(self,cmd=""):
      '''get infos for addons'''
       
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





