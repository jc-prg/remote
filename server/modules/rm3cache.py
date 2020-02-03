#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import threading

import modules.rm3config     as rm3config
import modules.rm3json       as rm3json
import modules.rm3stage      as rm3stage

#-------------------------------------------------
# read / write configuratioh
#-------------------------------------------------

class configCache (threading.Thread):
    '''
    class to read and write configurations using a cache
    '''
    
    def __init__(self, name):
       '''
       create class, set name
       '''
       
       threading.Thread.__init__(self)
       self.name           = name
       self.stopProcess    = False
       self.wait           = 1
       self.cache          = {}
       self.cache_time     = time.time()        # initial time for timebased update
       self.cache_interval = (5*60)             # update interval in seconds (reread files)
       self.cache_update   = False              # foster manual update of files
       self.configMethods  = {}
       self.api_init       = { "API" : {
                                     "name"     : rm3config.APIname,
                                     "version"  : rm3config.APIversion,
                                     "stage"    : rm3config.initial_stage,
                                     "rollout"  : rm3stage.rollout
                                     } }
       
    #------------------       
       
    def run(self):
       '''
       loop running in the background
       '''
       
       logging.info( "Starting " + self.name )
       while not self.stopProcess:
       
           if self.cache_update or (time.time() - self.cache_time >= self.cache_interval):
               time.sleep(5)
               logging.info("Re-read config files: ...")
               i = 0
               for key in self.cache:
                  if key != "_api":
                    self.cache[key] = rm3json.read(key)
                    i += 1
               logging.info("... ("+str(i)+")")
               self.cache_time   = time.time()
               self.cache_update = False
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


    #---------------------------

    def translate_device(self,device):
        '''
        get device name as file name
        '''

        status = self.read(rm3config.devices + rm3config.active)
        if device in status: return status[device]["device"]
        else:                return ""
        
    #---------------------------
    
    def get_method(self,device):
        '''
        get method for device
        '''

        status     = self.read(rm3config.devices + rm3config.active)
        interface  = status[device]["interface"]
        device     = status[device]["device"]
        definition = self.read(rm3config.devices + interface + "/" + device)
        return definition["data"]["method"]
    
    #---------------------------
    
    def read_status(self,selected_device=""):
        '''
        read and return array
        '''

        status = self.read(rm3config.devices + rm3config.active)
    
        # initial load of methods (record vs. query)
        if self.configMethods == {} and selected_device == "":
    
          for device in status:
              key       = status[device]["device"]
              interface = status[device]["interface"]
        
              if interface != "" and key != "":
                  config = self.read(rm3config.commands + interface + "/" + key)
                  if not "ERROR" in config:
                      self.configMethods[device] = config["data"]["method"]
    
        # if device is given return only device status
        if selected_device != "" and selected_device in status and "status" in status[selected_device]:
          status = status[selected_device]["status"]
      
        return status
    
    #---------------------------
    
    def write_status(self,status):
        '''
        write status
        '''

        self.write(rm3config.devices + rm3config.active,status)

    
#-------------------------------------------------
# EOF
