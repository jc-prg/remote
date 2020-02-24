#-----------------------------------
# Sample API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import codecs, json, netaddr
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

import interfaces.broadlink.broadlink  as broadlink

#-------------------------------------------------
# API-class
#-------------------------------------------------

shorten_info_to = 30

#-------------------------------------------------

class broadlinkAPI():
   '''
   Integration of BROADLINK API to be use by jc://remote/
   '''

   def __init__(self,api_name):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "Infrared Broadlink RM3"
       self.api_config      = rm3json.read(rm3config.interfaces+self.api_name)
       self.working         = False
       
       self.api_config["Port"]       = int(self.api_config["Port"])
       self.api_config["MACAddress"] = netaddr.EUI(self.api_config["MACAddress"])
       self.api_config["Timeout"]    = int(self.api_config["Timeout"])

       logging.info("... "+self.api_name+" - " + self.api_description)
       logging.debug(str(self.api_config["IPAddress"])+":"+str(self.api_config["Port"]))
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       try:
         self.api  = broadlink.rm((self.api_config["IPAddress"], self.api_config["Port"]), self.api_config["MACAddress"])     
         if self.api.auth(): self.status = "Connected"
         else:               self.status = "IR Device not available (not found or no access)"
       except e as Exception:
         self.status = "ERROR IR Device: "+str(e)
         logging.error(self.status)
    
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

       if self.status == "Connected":
         logging.info("Button-Code: " + command[:shorten_info_to]+"...")
         DecodedCommand = codecs.decode(command,'hex')  # python3
         try: 
           self.api.send_data(DecodedCommand)
         except Exception as e:
           return "ERROR "+self.api_name+" - send: " + str(e)
           
       else:
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return("OK")
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       return "WARN: Not supported for this API"



   #-------------------------------------------------
   
   def record(self,device,command):
       '''Record command, especially build for IR devices'''

       self.wait_if_working()
       self.working = True

       if self.status == "Connected":

         code = device + "_" + command
         self.api.enter_learning()
         time.sleep(5)
         LearnedCommand = self.api.check_data()
         if LearnedCommand is None:
            return('ERROR: Learn Button (' + code + '): No IR command received')
            sys.exit()
         EncodedCommand = codecs.encode(LearnedCommand,'hex')   # python3

       else:
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return EncodedCommand

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       return "WARN: Not implemented for this API"

#-------------------------------------------------
# EOF

