#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import interfaces.eiscp as eiscp

#import codecs, json
#import logging, time

#import modules_api.server_init        as init
#import modules.rm3json                as rm3json

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
   
def wait(wait=False):
   global last_cmd, wait_cmd
   
   difference = time.time() - last_cmd
   difference = wait_cmd - difference
   
   if difference > 0 and wait: time.sleep(difference)
   logging.debug(difference)
   last_cmd = time.time()

#-------------------------------------------------


def test():
   global receiver

   # Turn the receiver on, select PC input
   wait()
   receiver.command('power on')
   receiver.command('source pc')
   receiver.disconnect()
   
#-------------------------------------------------

def send(device,button_code):
   global receiver
   
   # Prepare command and send
   logging.info("Button-Code: "+button_code)
   button_code = button_code.replace("="," ")
   
   wait()
   receiver.command(button_code)
   receiver.disconnect()
   return


#-------------------------------------------------

def query(device,button_code):
   global receiver
   
   # Prepare command and send
   button_code = button_code.replace("="," ")
   
   #multiple requests? onkyo power=query audio-muting=query
   #result = receiver.command("master-volume=query system-power=query")
   #logging.info("Button-Code: "+button_code)
   
   wait(True)
   result = receiver.command(button_code)
   receiver.disconnect()
   
   print(result)
   return result
   
    
#-------------------------------------------------

def command_record():
   return "Not supported"
 

#-------------------------------------------------
# EOF

