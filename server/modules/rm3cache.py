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

           if time.time() - self.cache_time >= self.cache_interval:
               self.cache_update = True

           if self.cache_update == True:
               time.sleep(1)
               logging.info("Re-read config files ('" + self.name + "'): ...")
               
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
               #logging.warn("."+str(self.cache_update))

       logging.info( "Exiting " + self.name )

    #------------------       

    def update(self):
        '''
        set var to enforce update
        '''

        self.cache_update = True
        logging.info("Enforce cache update (" + self.name + ") "+str(self.cache_update))


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

    def write(self,config_file,value,source=""):
        '''
        write config to file and update cache
        '''
        
        rm3json.write(config_file,value,"cache.write "+source)
        self.cache[config_file] = value


    #---------------------------

    def translate_device(self,device):
        '''
        get device name as file name
        '''

        status = self.read(rm3config.active_devices)
        if device in status: return status[device]["config_device"]
        else:                return ""
        
    #---------------------------
    
    def get_method(self,device):
        '''
        get method for device
        '''

        status     = self.read(rm3config.active_devices)
        interface  = status[device]["interface"]
        device     = status[device]["config_device"]
        definition = self.read(rm3config.devices + interface + "/" + device)
        return definition["data"]["method"]
    
    #---------------------------
    
    def read_status(self,selected_device=""):
        '''
        read and return array
        '''

        config_file = rm3config.active_devices
        status      = self.read(config_file)
    
        # initial load of methods (record vs. query)
        if self.configMethods == {} and selected_device == "":
    
          for device in status:
              key       = status[device]["config_device"]
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
    
    def write_status(self,status,source=""):
        '''
        write status and make sure only valid keys are saved
        '''
        
        config_file = rm3config.active_devices
        
        # clear config file ...
        status_temp   = {}
        relevant_keys = ["status","visible","description","image","interface","label","config_device","config_remote","main-audio","position"]   
        
        for dev in status:
          status_temp[dev] = {}
          for key in status[dev]:
            if key in relevant_keys:
               status_temp[dev][key] = status[dev][key]                        

        # write status
        rm3json.write(config_file,status_temp,"cache.write_status "+source)
        self.cache[config_file] = status_temp
    
#-------------------------------------------------
# EOF
