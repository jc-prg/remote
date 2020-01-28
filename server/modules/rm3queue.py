#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import threading

import modules.rm3config     as rm3config
import modules.rm3json       as rm3json


#-------------------------------------------------
# send commands
#-------------------------------------------------

class sendCmd (threading.Thread):
    '''
    class to create a queue to send commands (or a chain of commands) to the devices
    '''
    
    def __init__(self, name, device_apis,callback):
       '''create queue, set name'''
    
       threading.Thread.__init__(self)
       self.queue_send  = []
       self.name        = name
       self.stopProcess = False
       self.wait        = 0.1
       self.device_apis = device_apis
       self.callback    = callback

    #------------------       
       
    def run(self):
       '''loop running in the background'''
       
       logging.info( "Starting " + self.name )
       while not self.stopProcess:
           if len(self.queue_send) > 0:
             logging.debug(".")
             command = self.queue_send.pop(0)
             self.execute(command)
       
           else:
             time.sleep(self.wait)
             
       logging.info( "Exiting " + self.name )


    #------------------       
    
    def execute(self,command):
       '''execute command or wait -> command = number or command = [interface,device,button]'''
       
       command_str = str(command)
       if "," in str(command):
          interface,device,button,state = command
          logging.info("Thread "+self.name+" - "+interface+":"+device+":"+button)
          
          result = self.device_apis.send(interface,device,button)
          if not "ERROR" in str(result) and state != "":
            self.callback(device,button,state) 
          
       else:
          time.sleep(float(command))
        
    
    #------------------       

    def add2queue(self,commands):
       '''add single command or list of commands to queue'''
       
       logging.info("Add to queue "+self.name+": "+str(commands))
       self.queue_send.extend(commands)
       return "OK: Added command(s) to the queue:"+str(commands)
   

    #------------------       

    def stop(self):
       '''stop thread'''
       
       self.stopProcess = True              


#-------------------------------------------------
# EOF
