#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

#import configparser
#import sys, getopt
#import time, binascii
#import netaddr, codecs
import logging, time
#import json
import threading

import interfaces.interfaces as interfaces

#import modules.server_init   as init
#import modules.rm3status     as rm3status
#import modules.rm3json       as rm3json
#import modules.rm3stage      as rm3stage
#import modules.rm3config     as rm3config

#-------------------------------------------------

class sendCmd (threading.Thread):
    '''
    class to create a queue to send commands (or a chain of commands) to the devices
    '''
    
    def __init__(self, name):
       '''create queue, set name'''
    
       threading.Thread.__init__(self)
       self.queue       = []
       self.name        = name
       self.stopProcess = False
       self.wait        = 0.1


    #------------------       
       
    def run(self):
       '''loop running in the background'''
       
       logging.info( "Starting " + self.name )
       while not self.stopProcess:
           if len(self.queue) > 0:
             logging.debug(".")
             command = self.queue.pop(0)
             self.execute(command)
       
           else:
             time.sleep(self.wait)
             
       logging.info( "Exiting " + self.name )


    #------------------       
    
    def execute(self,command):
       '''execute command or wait -> command = number or command = [interface,device,button]'''
       
       command_str = str(command)
       if "," in str(command):
          interface,device,button = command
          logging.info("Thread "+self.name+" - "+interface+":"+device+":"+button)
          interfaces.send(interface,device,button)
          
       else:
          time.sleep(float(command))
        
    
    
    #------------------       

    def add2queue(self,commands):
       '''add single command or list of commands to queue'''
       
       logging.info("Add to queue "+self.name+": "+str(commands))
       self.queue.extend(commands)
       return "OK: Added command(s) to the queue:"+str(commands)
   

    #------------------       

    def stop(self):
       '''stop thread'''
       
       self.stopProcess = True              


#-------------------------------------------------
# EOF
