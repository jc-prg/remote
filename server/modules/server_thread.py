#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import threading

import modules.rm3json       as rm3json

#-------------------------------------------------
# read / write configuratioh
#-------------------------------------------------

class configuration (threading.Thread):
    '''
    class to read and write configurations using a cache
    '''
    
    def __init__(self, name):
       '''create class, set name'''
       threading.Thread.__init__(self)
       self.name           = name
       self.stopProcess    = False
       self.wait           = 1
       self.cache          = {}
       self.cache_time     = time.time()
       self.cache_interval = 60
  
    #------------------       
       
    def run(self):
       '''
       loop running in the background
       '''
       
       logging.info( "Starting " + self.name )
       while not self.stopProcess:
       
           if (self.cache_time == 0) or (time.time() - self.cache_time >= self.cache_interval):
               logging.info("Re-read config files: ...")
               i = 0
               for key in self.cache:
                  self.cache[key] = rm3json.read(key)
                  i += 1
               logging.info("... ("+str(i)+")")
               self.cache_time = time.time()
           else:
               time.sleep(self.wait)
             
       logging.info( "Exiting " + self.name )
       
    #------------------       
       
    def read(self,config_file,from_file=False):
        '''
        read config from cache if not empty and not to old
        else read from file
        '''

        logging.debug("readConfig: "+config_file)
        if config_file not in self.cache or from_file:
            self.cache[config_file] = rm3json.read(config_file)
            logging.debug("... from file.")

        return self.cache[config_file]

    #---------------------------

    def write(self,config_file,value):
        '''
        write config to file and update cache
        '''

        rm3json.write(config_file,value)
        self.cache[config_file] = value





#-------------------------------------------------
# send commands
#-------------------------------------------------

class sendCmd (threading.Thread):
    '''
    class to create a queue to send commands (or a chain of commands) to the devices
    '''
    
    def __init__(self, name, device_apis):
       '''create queue, set name'''
    
       threading.Thread.__init__(self)
       self.queue_send  = []
       self.name        = name
       self.stopProcess = False
       self.wait        = 0.1
       self.device_apis = device_apis

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
          interface,device,button = command
          logging.info("Thread "+self.name+" - "+interface+":"+device+":"+button)
          self.device_apis.send(interface,device,button)
          
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
