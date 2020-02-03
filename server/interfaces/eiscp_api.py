#-----------------------------------
# Sample API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

import interfaces.eiscp as eiscp

#-------------------------------------------------
# API-class
#-------------------------------------------------

shorten_info_to = 30

#-------------------------------------------------

class eiscpAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "API for ONKYO Devices"
       self.api_config      = rm3json.read(rm3config.interfaces+self.api_name)
       self.api_ip          = self.api_config["IPAddress"]
       self.api_timeout     = 5
       self.working         = False
       
       logging.info("... "+self.api_name+" - " + self.api_description)
       
       self.connect()
            
   #-------------------------------------------------

   def reconnect(self):
       self.api.command_socket = None
       self.connect()
   
   #-------------------------------------------------

   def connect(self):
       '''Connect / check connection'''
       
       # Create a receiver object, connecting to the host
       
       try:
          print("(Re)Connect eISCP ONKYO "+self.api_ip)
          self.api    = eiscp.eISCP(self.api_ip)
          #self.api    = eiscp.Receiver(self.api_ip)
          #self.api.on_message = callback_method
          self.status = "Connected"
       except Exception as e:
          self.status = "Error connecting to ONKYO device: " + str(e)
          logging.warning(self.status)

       try:
          self.api.command("system-power query") # send a command to check if connected
          self.status = "Connected"
       except Exception as e:
          self.status = "Error connecting to ONKYO device: " + str(e)
          logging.warning(self.status)
   
   
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
         logging.debug("Button-Code: "+command[:shorten_info_to]+"...")
         button_code = command.replace("="," ")
         try:
           self.api.command(button_code)
           self.api.disconnect()
         except Exception as e:
           self.api.disconnect()
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

       self.wait_if_working()
       self.working = True
       result  = {}
       
       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]      

       if self.status == "Connected":
         button_code = command_param[0].replace("="," ")        
         logging.debug("Button-Code: "+button_code[:shorten_info_to]+"... ("+self.api_name+")")
         try:
           result  = self.api.command(button_code)          # ??????????????????
           self.api.disconnect()
         except Exception as e:
           self.api.disconnect()
           self.working = False
           return "ERROR "+self.api_name+" - query: " + str(e)
           
         if "ERROR" in result: 
           self.working = False
           return result
           
         result = result[1]
         logging.debug(str(result))

         # if || try to extract data from the result
         if "||" in command: 
           try:
             result2 = eval("result"+command_param[1])
             result  = result2
           except:
             logging.warning("Not able to extract data: result"+command_param[1])
           
       else:
         self.working = False
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return result
       
       
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
         self.api.command('power on')
         self.api.command('source pc')
         self.api.disconnect()
       except Exception as e:
         return "ERROR "+self.api_name+": "+str(e)

       self.working = False
       return "OK"

#-------------------------------------------------
# EOF

