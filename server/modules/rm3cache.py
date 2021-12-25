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
# read / write configuration
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
       self.name             = name
       self.stopProcess      = False
       self.wait             = 1
       self.cache            = {}
       self.cache_time       = time.time()        # initial time for timebased update
       self.cache_lastaction = time.time()        # initial time for timestamp of last action
       self.cache_interval   = 60                 # update interval in seconds (reread files)
       self.cache_sleep      = (5*60)             # sleeping mode after x seconds
       self.cache_update     = False              # foster manual update of files
       self.cache_update_api = False              # foster manual update of API information
       self.configMethods    = {}
       self.api_init         = { "API" : {
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
       
           # No update when in sleeping mode (no API request since a "cache_sleep")
           if time.time() - self.cache_lastaction >= self.cache_sleep:
               self.cache_update     = False
               self.cache_update_api = False
               
           # Update, when "cache_interval" is passed
           elif time.time() - self.cache_time >= self.cache_interval:
               self.cache_update     = True
               self.cache_update_api = True
               
           # "cache_update" can be set from outside also
           else:
               pass

           # Reread values from config files
           if self.cache_update == True:
               logging.info("Cache: reread config files ('" + self.name + "'): ...")
               
               i = 0
               for key in self.cache:
                  if key != "_api":
                    self.cache[key] = rm3json.read(key)
                    i += 1

               logging.info("... ("+str(i)+")")
               self.cache_time        = time.time()
               self.cache_update      = False

           # wait a few seconds
           else:
               time.sleep(self.wait)

       logging.info( "Exiting " + self.name )

    #------------------       

    def update(self):
        '''
        set var to enforce update
        '''

        self.cache_update     = True
        self.cache_update_api = True
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
        if device in status: return status[device]["config"]["device"]
        else:                return ""
        
    #---------------------------
    
    def get_method(self,device):
        '''
        get method for device
        '''

        status     = self.read(rm3config.active_devices)
        interface  = status[device]["config"]["interface_api"]
        device     = status[device]["config"]["device"]
        definition = self.read(rm3config.devices + interface + "/" + device)
        return definition["data"]["method"]
    
    #---------------------------
    
    def read_status(self,selected_device=""):
        '''
        read and return array
        '''
        status = self.read(rm3config.active_devices)
    
        # initial load of methods (record vs. query)
        if self.configMethods == {} and selected_device == "" and "ERROR" not in status:
    
          for device in status:
              key       = status[device]["config"]["device"]
              interface = status[device]["config"]["interface_api"]
              if interface != "" and key != "":
                 config = self.read(rm3config.commands + interface + "/" + key)
                 if not "ERROR" in config: self.configMethods[device] = config["data"]["method"]
                 
        elif "ERROR" in status:
          logging.error("ERROR while reading '"+rm3config.active_devices+"'!")
          logging.error(str(status))
    
        # if device is given return only device status
        if selected_device != "" and selected_device in status and "status" in status[selected_device]:
          status = status[selected_device]["status"]
      
        return status
    
    #---------------------------
    
    def write_status(self, status, source=""):
        '''
        write status and make sure only valid keys are saved
        '''
        status_temp   = {}
        relevant_keys = ["status","config","settings"]   
        
        for dev in status:
          status_temp[dev] = {}
          for key in status[dev]:
            if key in relevant_keys:
               status_temp[dev][key] = status[dev][key]                        

        self.write(rm3config.active_devices, status_temp, "cache.write_status "+source)
        self.cache[rm3config.active_devices] = status_temp
    
#-------------------------------------------------
# EOF
