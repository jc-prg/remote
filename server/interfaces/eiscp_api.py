#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import interfaces.eiscp as eiscp

#-------------------------------------------------

working  = False
last_cmd = time.time()
wait_cmd = 0.2

#-------------------------------------------------
# Execute command
#-------------------------------------------------

def init(ip):
   global receiver

   # Create a receiver object, connecting to the host
   try:
     receiver = eiscp.eISCP(ip)
   except Exception as e:
     return "Error connecting to ONKYO device: " + str(e)
   
   return "Connected"

#------------------------------------------------- 

def wait_if_working():
   '''API creates error, if several requests are done at the same time ... so wait'''
   global working
   while working:
     logging.debug(".")

#-------------------------------------------------

def test():
   global receiver, working

   # Turn the receiver on, select PC input
   wait_if_working()
   working = True
   receiver.command('power on')
   receiver.command('source pc')
   receiver.disconnect()
   working = False
   
#-------------------------------------------------

def send(device,button_code):
   global receiver, working
   
   # Prepare command and send
   logging.info("Button-Code: "+button_code)
   button_code = button_code.replace("="," ")
   
   wait_if_working()
   working = True
   receiver.command(button_code)
   receiver.disconnect()
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
   result = receiver.command(button_code)
   receiver.disconnect()
   working = False
   logging.debug(result)

   return result
   
    
#-------------------------------------------------

def command_record():
   return "Not supported"
 

#-------------------------------------------------
# EOF

