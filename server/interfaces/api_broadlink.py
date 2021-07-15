#-----------------------------------
# Sample API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import codecs, json, netaddr
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config
import modules.rm3ping                 as rm3ping

import interfaces.broadlink.broadlink  as broadlink

#-------------------------------------------------
# API-class
#-------------------------------------------------

# Shorten Button Code for logging.info
shorten_info_to = rm3config.shorten_info_to

# commands to check on startup if IR devices runs (e.g. screen down and up)
check_on_startup = False
check_on_startup_commands = [
	"2600c60028112810281028100e2a0e290e2a0e2a0e2928100e2a0e2a0e2927110e2a27112711271127110d2a2711281028100e2a271127110e290f2927110e2a0e29270003d028102810281028100e2a0e290f290e2a0e2928110d2a0e2a0e2927110e2a27112711271127110e292810281028100e2a271127110e2a0d2a27110e2a0e29280003d027112711271127110d2a0e2a0e290e2a0e2a27110d2a0e2a0e2928100e2a27112711271127110e2a2711271127110d2a271128100e2a0e2928100e2a0e2928000d050000",
	"2600c60028112711271126120d2b0d2a0d2b0d2b0d2a0d2b26120d2a0d2b26120d2b2612261226120d2a2711271127110d2b261226120d2a27110d2b26120d2b0d2a260003d127112711271127110d2b0d2b0d2a0d2b0d2a0d2b26120d2b0d2a27110d2b2612261226120d2a2711271127110d2b261226120d2b26120d2a26120d2b0d2a270003d126122612261127110d2b0d2b0d2a0d2b0d2b0d2a26120d2b0d2a27110d2b2612261226120d2b2612261226110d2b261226120d2b26120d2a27110d2b0d2a28000d050000" 
	]


#-------------------------------------------------

class broadlinkAPI():
   '''
   Integration of BROADLINK API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",device_config={}):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "Infrared Broadlink RM3"
       #self.api_config      = rm3json.read("interfaces/broadlink/"+self.api_name,data_dir=False)
       self.api_config      = device_config
       self.working         = False
       self.method          = "record"
       self.count_error     = 0
       self.count_success   = 0
       self.api_config["Port"]       = int(self.api_config["Port"])
       self.api_config["MACAddress"] = netaddr.EUI(self.api_config["MACAddress"])
       self.api_config["Timeout"]    = int(self.api_config["Timeout"])

       logging.info("... "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       logging.debug(str(self.api_config["IPAddress"])+":"+str(self.api_config["Port"]))
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       self.count_error          = 0
       self.count_success        = 0
       
       connect = rm3ping.ping(self.api_config["IPAddress"])
       if connect == False:
         self.status = "IR Device not available (ping to "+self.api_config["IPAddress"]+" failed)"
         logging.error(self.status)       
         return self.status
         
       try:
         self.api  = broadlink.rm((self.api_config["IPAddress"], self.api_config["Port"]), self.api_config["MACAddress"])     
         if self.api.auth(): self.status = "Connected"
         else:               self.status = "IR Device not available (not found or no access)"
       except e as Exception:
         self.status = "ERROR IR Device: "+str(e)
         logging.error(self.status)
       
       if check_on_startup:
         try:
           for command in check_on_startup_commands:
             self.send("broadlink_test",command)
             time.sleep(0.5)
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
         try:
           DecodedCommand = codecs.decode(command,'hex')  # python3
         except Exception as e:
           return "ERROR "+self.api_name+" - decode: " + str(e) + " / " + str(command) 
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
   
   def register(self,command,pin=""):
       '''Register command if device requires registration to initialize authentification'''

       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       return "WARN: Not implemented for this API"

#-------------------------------------------------
# EOF

