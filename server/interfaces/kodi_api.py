#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

from kodijson import Kodi, PLAYER_VIDEO

#-------------------------------------------------
# Execute command
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
          self.status = "Connected"

       except Exception as e:
          self.status = "Error connecting to KODI server: " + str(e)
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
       logging.info("Button-Code: "+command+" ("+self.api_name+")")

       if self.status == "Connected":
         command = "self.api."+command
         try:
           result = eval(command)
           logging.info(str(result))
           if "error" in result:      return "ERROR "+self.api_name+" - " + result["error"]["message"]
           if not "result" in result: return "ERROR "+self.api_name+" - unexpected result format."           
         except Exception as e: return "ERROR "+self.api_name+" - query: " + str(e)
       else:                    return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
       
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       self.wait_if_working()
       self.working = True
       
       result  = {}
       logging.info("Button-Code: "+command+" ("+self.api_name+")")
       command_param = command.split("||")

       if self.status == "Connected":
         command = "self.api."+command_param[0]
         try:
           result = eval(command)
           logging.info(str(result))
           if "error" in result:      return "ERROR "+self.api_name+" - " + result["error"]["message"]
           if not "result" in result: return "ERROR "+self.api_name+" - unexpected result format."
           
           if len(command_param) > 0: result_param = eval("result"+command_param[1])
           else:                      result_param = str(result)
           
         except Exception as e:       return "ERROR "+self.api_name+" - query: " + str(e)
       else:                          return "ERROR "+self.api_name+": Not connected"
       
       self.working = False
       return result_param
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''Record command, especially build for IR devices'''
       return "WARN: Not supported by this API"

       
   #-------------------------------------------------
       
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True

       try:
         self.api.GUI.ActivateWindow({"window":"home"})
         self.api.GUI.ActivateWindow({"window":"weather"})
       except Exception as e:
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
      logging.info("Increase Volume:"+str(self.volume))
      
      if (self.volume + step) > 100: self.volume  = 100
      else:                          self.volume += step
      self.api.Application.SetVolume({ "volume" : int(self.volume) })
      return({"result" : self.volume})

   #-------------------------------------------------
       
   def DecreaseVolume(self,step):
      '''get current volume and increase by step'''
      
      self.volume = self.api.Application.GetProperties({'properties': ['volume']})["result"]["volume"]
      logging.info("Decrease Volume:"+str(self.volume))

      if (self.volume - step) < 0:   self.volume  = 0
      else:                          self.volume -= step
      self.api.Application.SetVolume({ "volume" : int(self.volume) })
      return({"result" : self.volume})

   #-------------------------------------------------
       
   def ToggleMute(self):
      '''get muted value and set opposite state'''
      
      self.mute = self.api.Application.GetProperties({'properties': ['muted']})["result"]["muted"]
      logging.info("Toggle Mute:"+str(self.mute))
      
      if self.mute: self.mute = False
      else:         self.mute = True

      self.api.Application.SetMute({ "mute" : self.mute })
      return({"result" : self.mute})
      

#-------------------------------------------------
# EOF





