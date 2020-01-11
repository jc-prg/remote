#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import interfaces.kodijson as Kodi
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

#-------------------------------------------------

working  = False
last_cmd = time.time()
wait_cmd = 0.2

#-------------------------------------------------
# Execute command
#-------------------------------------------------

def init():

   global kodi
   config      = rm3json.read(rm3config.interfaces+"KODI")
   kodi_url    = "http://"+str(config["IPAddress"])+":"+str(config["Port"])+"/jsonrpc"

   # Create a receiver object, connecting to the host
   try:
     kodi = Kodi(kodi_url)
     #device = Kodi(kodi_url, "login", "password")
     print(kodi.JSONRPC.Ping())

   except Exception as e:
     return "Error connecting to KODI server: " + str(e)

   return "Connected"

#------------------------------------------------- 

def wait_if_working():
   '''API creates error, if several requests are done at the same time ... so wait'''
   global working
   while working:
     logging.debug(".")

#-------------------------------------------------

def test():
   global kodi, working

   # Turn the receiver on, select PC input
   wait_if_working()
   working = True
   kodi.GUI.ActivateWindow({"window":"home"})
   kodi.GUI.ActivateWindow({"window":"weather"})
   working = False
   
#-------------------------------------------------

def send(device,button_code):
   global receiver, working
   
   # Prepare command and send
   logging.info("Button-Code: "+button_code)
   button_code = button_code.replace("="," ")
   
   wait_if_working()
   working = True
#   receiver.command(button_code)
#   receiver.disconnect()
   working = False
   return 


#-------------------------------------------------

def query(device,button_code):
   global receiver, working
   
   # Prepare command and send
   logging.info("Button-Code: "+button_code)
   button_code = button_code.replace("="," ")
   
   wait_if_working()
   working = True
#   result = receiver.command(button_code)
#   receiver.disconnect()
   working = False
   logging.debug(result)

   return result


#-------------------------------------------------

def command_record():
   return "Not supported"
 

#-------------------------------------------------
# EOF

