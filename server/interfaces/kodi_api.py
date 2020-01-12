#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

from kodijson import Kodi, PLAYER_VIDEO

########################### exec("""command, ggf. auch in var auszuführen""")

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
          self.api  = Kodi(self.api_url)
          #self.api = Kodi(self.api_url, "login", "password")
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


       self.working = False
       return
       
       
   #-------------------------------------------------
       
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       self.wait_if_working()
       self.working = True


       self.working = False
       return
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''Record command, especially build for IR devices'''
       return "WARN: Not supported by this API"

       
   #-------------------------------------------------
       
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True

       self.api.GUI.ActivateWindow({"window":"home"})
       self.api.GUI.ActivateWindow({"window":"weather"})

       self.working = False
       return "OK: Test done, check results"


#-------------------------------------------------
# EOF

