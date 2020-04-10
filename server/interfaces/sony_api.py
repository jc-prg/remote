#-----------------------------------
# Sony API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

import interfaces.sonyapi.sony         as sony

#-------------------------------------------------
# API-class
#-------------------------------------------------

class sonyAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name,device):
       '''Initialize API / check connect to device'''
       
       self.api_name          = api_name       
       self.api_description   = "API for SONY Devices (SonyAPILib)"
       self.api_config        = rm3json.read(rm3config.interfaces+self.api_name)
       self.api_device        = device
       self.method            = "query" # or "record"
       self.working           = False
       
       logging.info("... "+self.api_name+" - " + self.api_description)
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       # commands to connect and to check, if connection works - if not, return error message

       self.status = "Connected"
       
       api_ip     = self.api_config["Devices"][self.api_device]["IPAddress"]
       api_name   = self.api_device
       api_config = rm3config.config_dir + rm3config.interfaces + self.api_device + ".json"
       
       try:
           self.api = sony.sonyDevice(api_ip,api_name,api_config)
           
       except Exception as e:
           self.status = "ERROR "+self.api_name+" - connect: " + str(e)
           return self.status
       
       return self.status

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
       
       logging.info("SONY send: "+command)

       if self.status == "Connected":
         try:
           result  = self.api.send(command)
         except Exception as e:
           self.working = True
           return "ERROR "+self.api_name+" - send: " + str(e)                     
       else:
         self.working = True
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       result = ""
       param  = ""
       
       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
         if "=" in command:
           params  = command.split("=")
           command = params[0]
           param   = params[1]
           
         try:
           result  = self.api.get_status(command,param)
         except Exception as e:
           self.working = True
           return "ERROR "+self.api_name+" - query: " + str(e)
           
       else:
         self.working = True
         return "ERROR "+self.api_name+": Not connected"
        
       if command == "power":
         if result == True:    result = "ON"
         elif result == False: result = "OFF"

       self.working = False
       return result
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''Record command, especially build for IR devices'''
       
       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def register(self,command,pin=""):
       '''Register command if device requires registration to initialize authentification'''

       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
          if   command == "start":    result = self.api.register_start()
          elif command == "finish":   result = self.api.register_finish(pin)
          else:                       result = "ERROR "+self.api_name+": Register command not available ("+command+")"          
          self.working = False
          return result
                    
       else:
          self.working = False
          return "ERROR "+self.api_name+": Not connected"

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
         try:
            self.api.send("PowerOn")
            time.sleep(5)
            self.api.send("Eject")
            time.sleep(5)
            self.api.send("PowerOff")
         except Exception as e:
            self.working = True
            return "ERROR "+self.api_name+" - test: " + str(e)                     
       else:
         self.working = True
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"


#-------------------------------------------------
# EOF

