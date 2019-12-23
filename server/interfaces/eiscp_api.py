#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging
import interfaces.eiscp as eiscp

#import codecs, json
#import logging, time

#import modules_api.server_init        as init
#import modules.rm3json                as rm3json



#-------------------------------------------------
# Execute command
#-------------------------------------------------

def init(ip):
   global receiver

   # Create a receiver object, connecting to the host
   receiver = eiscp.eISCP(ip)

#-------------------------------------------------


def command_test():
   global receiver

   # Turn the receiver on, select PC input
   receiver.command('power on')
   receiver.command('source pc')
   receiver.disconnect()
   
#-------------------------------------------------

def command_send(device,button_code):
   global receiver
   
   # Prepare command and send
   logging.info("Button-Code: "+button_code)
   button_code = button_code.replace("="," ")
   receiver.command(button_code)
   receiver.disconnect()
   return


#-------------------------------------------------

def command_query():
   global receiver
   return
    
#-------------------------------------------------

def command_record():
   return "Not supported"
 

#-------------------------------------------------
# EOF

