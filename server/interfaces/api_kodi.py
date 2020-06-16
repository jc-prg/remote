#-----------------------------------
# KODI API using kodijson
# https://kodi.wiki/view/JSON-RPC_API/v10#Application.Property.Name
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

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

   def __init__(self,api_name):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "API for KODI Servers (basic functionality, under development)"
       self.api_config      = rm3json.read(rm3config.interfaces+self.api_name)
       self.api_url         = "http://"+str(self.api_config["IPAddress"])+":"+str(self.api_config["Port"])+"/jsonrpc"
       self.working         = False
       self.status          = "Started"
       self.method          = "query"
       self.not_connected   = "Device not connected (KODI)."

       logging.info("... "+self.api_name+" - " + self.api_description)
       logging.debug(self.api_url)
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       try:
          self.api    = Kodi(self.api_url)
          #self.api   = Kodi(self.api_url, "login", "password")
          self.api.jc = kodiAPIaddOn(self.api)
          logging.debug(str(self.api.JSONRPC.Ping()))
          
          self.status               = "Connected"
          self.api.jc.status        = "Connected"
          self.api.jc.not_connected = self.not_connected

       except Exception as e:
          self.status          = "Error connecting to KODI server: " + str(e)
          self.api.jc.status   = "Error connecting to KODI server: " + str(e)
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
         command = "self.api."+command
         try:
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
         command = "self.api."+command_param[0]
         try:
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
   
   def Play(self):
      '''Play active player'''

      if self.status == "Connected":
         active     = self.api.Player.GetActivePlayers()['result']
         player     = active[0]['playerid']
             
         if active == []:  return { "result" : "no media loaded" }
         else:             self.api.Player.Play(player)
         return { "result" : "OK" }

      else:
         return self.not_connected
         
   #-------------------------------------------------
   
   def Pause(self):
      '''Pause active player'''

      if self.status == "Connected":
         active     = self.api.Player.GetActivePlayers()['result']
         player     = active[0]['playerid']
             
         if active == []:  return { "result" : "no media loaded" }
         else:             self.api.Player.PlayPause(player)
         return { "result" : "OK" }         
         
      else:
         return self.not_connected
         
   #-------------------------------------------------
      
   def Stop(self):
      '''Stop active player'''

      if self.status == "Connected":
         active     = self.api.Player.GetActivePlayers()['result']
         player     = active[0]['playerid']
             
         if active == []:  return { "result" : "no media loaded" }
         else:             self.api.Player.Stop(player)
         return { "result" : "OK" }         

      else:
         return self.not_connected

   #-------------------------------------------------
   
   def ReplaceHTML(self,text):
      '''replace known html tags'''
      
      result = text
      result = result.replace("[B]","<b>")
      result = result.replace("[/B]","</b>")
      result = result.replace("[I]","<i>")
      result = result.replace("[/I]","</i>")
      result = result.replace("[COLOR ","<font color=\"")
      result = result.replace("[/COLOR]","</font>")
      result = result.replace("]","\">")
      
      return result
   
   #-------------------------------------------------
         
   def PlayingMetadata(self,tag=""):
      '''Return title of playing item'''
            
      if self.status == "Connected":
         metadata = {}

         if self.cache_metadata == {} or (self.cache_time + self.cache_wait) < time.time():
         
            active      = self.api.Player.GetActivePlayers()
            if "error" in active:             return active
            elif not "result" in active:      return { "error" : "API not available OR unknown error" }
            elif active["result"] == []:      active = active
            else:                             active = active["result"]         
  
            application = self.api.Application.GetProperties({'properties': ['version','muted','volume','language','name']})
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
                
            if_playing = ["player","playlist","playlist-position","playing","item","info","item-position","name"]
            for param in if_playing: metadata[param] = "no media loaded"
            
            if "result" in str(active) and active["result"] == []:
            
              logging.info("KODI API: no media loaded")
                                            
            elif 'playerid' in str(active):     
         
              playerid    = active[0]['playerid']
              playertype  = active[0]['type']   
              player      = self.api.Player.GetProperties({'playerid' : playerid, 'properties' : ['live','speed','percentage','position','playlistid'] })['result']
              playlistid  = player['playlistid']
              playlist    = self.api.Playlist.GetProperties({'playlistid' : playlistid, 'properties' : ['size','type'] })['result']
              item        = self.api.Player.GetItem({'playerid' : playerid, 'properties':['title','duration','album','artist','thumbnail','file','fanart']})['result']['item']

              metadata["player"]             = player
              metadata["player-type"]        = playertype
              metadata["playlist"]           = playlist
              metadata["playlist-position"]  = [ player['position'] + 1, playlist['size'] ]
              metadata["playing"]            = [ playertype, playerid ]
              metadata["item"]               = item
            
              if 'duration' in item:         metadata["item-position"]  = [ round(item['duration'] * player['percentage'] / 100,2), item['duration'] ]
              else:                          metadata["item-position"]  = "N/A"           
            
              if len(item['title']) > 0:     metadata["info"]           = item['title']
              elif len(item['label']) > 0:   metadata["info"]           = item['label']
              else:                          metadata["info"]           = "no title"
            
              if "album" in item and "artist" in item:
                if len(item['album']) > 0 and len(item['artist']) > 0:  metadata["info"] += " ("+item['album']+" / "+item['artist'][0]+")"
                elif len(item['album']) > 0:                            metadata["info"] += " ("+item['album']+")"
                elif len(item['artist']) > 0:                           metadata["info"] += " ("+item['artist'][0]+")"        
              
              metadata["info"]               = self.ReplaceHTML(metadata["info"])
              
            else:
              return { "error" : "unknown error ("+str(active)+")" }
              
            self.cache_metadata = metadata
              
         else:
            metadata            = self.cache_metadata
            
         #----------------------------------------------------         
            
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





