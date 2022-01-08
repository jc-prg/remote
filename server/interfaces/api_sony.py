#-----------------------------------
# Sony API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time, os
import modules.rm3json                 as rm3json
import modules.rm3stage                as rm3stage
import modules.rm3config               as rm3config
import modules.rm3ping                 as rm3ping

import interfaces.sonyapi.sony         as sony

shorten_info_to = rm3config.shorten_info_to

#-------------------------------------------------
# API-class
#-------------------------------------------------

class APIcontrol():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",device_config={},log_command=False):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "API for SONY Devices (SonyAPILib)"
       self.not_connected   = "ERROR: Device not connected ("+api_name+"/"+device+")."
       self.status          = "Start"
       self.method          = "query"
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       self.log_command     = log_command
       
       self.api_config      = device_config
       self.api_device      = device

       self.logging = logging.getLogger("api.SONY")
       self.logging.setLevel = rm3stage.log_set2level
       self.logging.info("_INIT: "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       
       if rm3stage.log_apiext == "NO":
          log = logging.getLogger("sonyapilib.device")
          log.setLevel(logging.CRITICAL)
       
       #self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''
       Connect / check connection
       '''
       
       connect = rm3ping.ping(self.api_config["IPAddress"])
       if not connect:
         self.status = self.not_connected + " ... PING"
         self.logging.warning(self.status)       
         return self.status

       self.status               = "Connected"
       self.count_error          = 0
       self.count_success        = 0
       
       api_ip     = self.api_config["IPAddress"]
       api_mac    = self.api_config["MacAddress"]
       api_name   = self.api_device
       api_config = rm3stage.data_dir + "/" + rm3config.devices + self.api_name + "/" + self.api_device + ".json"
       
       try:
           self.api = sony.sonyDevice(api_ip,api_name,api_config)
           
       except Exception as e:
           self.status = self.not_connected + " ... CONNECT " + str(e)
           return self.status
       
       return self.status

   #-------------------------------------------------
   
   def wait_if_working(self):
       '''
       Some devices run into problems, if send several requests at the same time
       '''
       
       while self.working:
         self.logging.info(".")
         time.sleep(0.2)
       return

       
   #-------------------------------------------------

   def power_status(self):
       '''
       request power status
       '''
       return self.query("power")
      
       
   #-------------------------------------------------
   
   def send(self,device,command):
       '''
       Send command to API
       '''

       self.wait_if_working()
       self.working = True
       
       if self.status == "Connected":
         if self.log_command: self.logging.info("_SEND: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

         try:
           result  = self.api.send(command)
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - send: " + str(e)                     
       else:
         self.working = False
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
         if self.log_command: self.logging.info("_QUERY: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

         if "=" in command:
           params  = command.split("=")
           command = params[0]
           param   = params[1]
           
         try:
             result  = self.api.get_status(command,param)
             
         except Exception as e:
             self.working = False
             return "ERROR "+self.api_name+" - query: " + str(e)
                        
       else:
         self.working = False
         return "ERROR "+self.api_name+": Not connected"
        
       if command == "power":
         if result == True:              result = "ON"
         elif result == False:           result = "OFF"
         elif "Device is off" in result: result = "OFF"

       self.working = False
       return result
       
       
   #-------------------------------------------------
       
   def record(self,device,command):
       '''Record command, especially build for IR devices'''
       
       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def register(self,command,pin=""):
       '''
       Register command if device requires registration to initialize authentification
       -> creates config file, to be stored
       '''

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

