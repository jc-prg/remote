#-----------------------------------
# KODI API using kodijson
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

from   interfaces.kodi             import Kodi, PLAYER_VIDEO

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
          
          self.status        = "Connected"
          self.api.jc.status = "Connected"

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
   
      self.addon  = "jc://addon/kodi/"
      self.api    = api
      self.volume = 0
      
   #-------------------------------------------------
       
   def IncreaseVolume(self,step):
      '''get current volume and increase by step'''
      
      self.volume = self.api.Application.GetProperties({'properties': ['volume']})["result"]["volume"]
      logging.debug("Increase Volume:"+str(self.volume))
      
      if (self.volume + step) > 100: self.volume  = 100
      else:                          self.volume += step
      self.api.Application.SetVolume({ "volume" : int(self.volume) })
      return({"result" : self.volume})

   #-------------------------------------------------
       
   def DecreaseVolume(self,step):
      '''get current volume and increase by step'''
      
      self.volume = self.api.Application.GetProperties({'properties': ['volume']})["result"]["volume"]
      logging.debug("Decrease Volume:"+str(self.volume))

      if (self.volume - step) < 0:   self.volume  = 0
      else:                          self.volume -= step
      self.api.Application.SetVolume({ "volume" : int(self.volume) })
      return({"result" : self.volume})

   #-------------------------------------------------
       
   def ToggleMute(self):
      '''get muted value and set opposite state'''
      
      self.mute = self.api.Application.GetProperties({'properties': ['muted']})["result"]["muted"]
      logging.debug("Toggle Mute:"+str(self.mute))
      
      if self.mute: self.mute = False
      else:         self.mute = True

      self.api.Application.SetMute({ "mute" : self.mute })
      return({"result" : self.mute})
      
   #-------------------------------------------------
   
   def PowerStatus(self):
      '''Return Power Status'''

      self.power = {}
      if self.status == "Connected": self.power = "ON"
      else:                          self.power = "OFF"
      
      logging.debug("TEST "+str(self.status))

      return { "result" : self.power }
      
   #-------------------------------------------------
   
   def KodiVersion(self):
       '''Return Kodi Version as string'''
       
       version = {}
       version = self.api.Application.GetProperties({'properties': ['version']})['result']['version']
       self.version = "KODI "+str(version['major'])+"."+str(version['minor'])+" "+str(version['tag'])
       
       return { "result" : self.version }        
      
   #-------------------------------------------------
   
   def Play(self):
       '''Play active player'''

       active     = self.api.Player.GetActivePlayers()['result']
       player     = active[0]['playerid']
             
       if active == []:
         return { "result" : "no media loaded" }
       else:
         self.api.Player.Play(player)
         return { "result" : "OK" }
         
   #-------------------------------------------------
   
   def Pause(self):
       '''Pause active player'''

       active     = self.api.Player.GetActivePlayers()['result']
       player     = active[0]['playerid']
             
       if active == []:
         return { "result" : "no media loaded" }
       else:
         self.api.Player.PlayPause(player)
         return { "result" : "OK" }         
         
   #-------------------------------------------------
      
   def Stop(self):
       '''Stop active player'''

       active     = self.api.Player.GetActivePlayers()['result']
       player     = active[0]['playerid']
             
       if active == []:
         return { "result" : "no media loaded" }
       else:
         self.api.Player.Stop(player)
         return { "result" : "OK" }         

   #-------------------------------------------------
   
   def PlayingMetadata(self,tag=""):
       '''Return title of playing item'''
       
       active     = self.api.Player.GetActivePlayers()['result']
 
       if active == []:
          return { "result" : "no media loaded" }

       elif tag == "playing":
          return { "result" : [ active[0]['type'], active[0]['playerid'] ] }
          
       elif tag == "player":
         player   = self.api.Player.GetProperties({'playerid' : active[0]['playerid'], 'properties' : ['live','speed','percentage','position'] })['result']
         return { "result" : player }
              
       elif 'playerid' in active[0] and active[0]['playerid'] == 0 or active[0]['playerid'] == 1:
       
          playerid   = active[0]['playerid']
          playertype = active[0]['type']   
          metadata   = self.api.Player.GetItem({'properties':['title','duration','album','artist','thumbnail','file','fanart'],'playerid':playerid})['result']['item']
          
          if   tag == "info":
            info = ""
            if len(metadata['title']) > 0:                                  info += metadata['title']
            elif len(metadata['label']) > 0:                                info += metadata['label']
            else:                                                           info += "no title"
            
            if "album" in metadata and "artist" in metadata:
              if len(metadata['album']) > 0 and len(metadata['artist']) > 0:  info += " ("+metadata['album']+" / "+metadata['artist'][0]+")"
              elif len(metadata['album']) > 0:                                info += " ("+metadata['album']+")"
              elif len(metadata['artist']) > 0:                               info += " ("+metadata['artist'][0]+")"
              
            metadata = info
          
          elif tag != "" and tag     in metadata:  metadata = metadata[tag]
          elif tag != "" and tag not in metadata:  metadata = "tag '"+tag+"' not defined"
          
          return { "result" : metadata }
          
       else:
          return { "result" : "unknown error ("+str(active)+")" }

      
   #-------------------------------------------------
   
   def AddOns(self,cmd=""):
       '''get infos for addons'''
       
       data   = "not implemented yet"
       data   = self.api.Addons.GetAddons()['result']['addons']
       addons = []
       
       for item in data:
          if item['type'] == 'xbmc.python.pluginsource':
             details = self.api.Addons.GetAddonDetails({ 'addonid' : item['addonid'], 'properties' : ['name','description','enabled','installed'] })
             details = details['result']['addon']
             addons.append(details['name'])
       
       return { "result" : addons }
   
   
          
#            "addons": "Addons.GetAddons()||['result']"

#-------------------------------------------------
# EOF





