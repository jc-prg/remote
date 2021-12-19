#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time, threading

import modules.rm3json                as rm3json
import modules.rm3config              as rm3config

#-------------------------------------------------

class connect(threading.Thread):
    '''
    class to control all interfaces including a continuous check if interfaces still available
    '''

    def __init__(self,configFiles):
        '''
        Initialize Interfaces
        '''
	    
        threading.Thread.__init__(self)
        self.api          = {}
        self.available    = {}
        self.stopProcess  = False
        self.wait         = 60       # time for reconnects
        self.configFiles  = configFiles
        self.name         = "jc://remote/interfaces/"
        self.check_error  = time.time()
        self.last_message = ""
        self.log_commands = True
        self.methods      = {
            "send"        : "Send command via API (send)",
            "record"      : "Record per device (record)",
            "query"       : "Request per API (query)"
            }

    
    def run(self):
        '''
        Initialize APIs and loop to check connection status
        '''
               
        logging.info("Starting " + self.name)

        try:
          loaded_apis    = {}
          active_devices = self.configFiles.read_status()
          
        except e as Exception:
          logging.error("Error while requesting infos from "+rm3config.active_devices+".json: "+str(e))
          return
          
        for device in active_devices:       
            logging.debug("Load API for device "+device+" ...")
            api = active_devices[device]["config"]["interface_api"]
            dev = active_devices[device]["config"]["interface_dev"]

            if rm3json.ifexist(rm3config.commands + api + "/00_interface"):
               dev_config = {}
               api_config = self.configFiles.read(rm3config.commands + api + "/00_interface")
               if "Devices" in api_config and dev in api_config["Devices"]:          dev_config = api_config["Devices"][dev]
               elif "Devices" in api_config and "default" in api_config["Devices"]:  dev_config = api_config["Devices"]["default"]
               else:                                                                 logging.warning("Error in config-file - device not defined / no default device: "+rm3config.commands + api + "/00_interface.json")
            
            if dev_config != {}:
               api_dev = api + "_" + dev
               
               if api == "KODI"        and api_dev not in self.api:
                  import interfaces.api_kodi
                  self.api[api_dev] = interfaces.api_kodi.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "EISCP-ONKYO" and api_dev not in self.api:
                  import interfaces.api_eiscp
                  self.api[api_dev] = interfaces.api_eiscp.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "BROADLINK"   and api_dev not in self.api:
                  import interfaces.api_broadlink
                  self.api[api_dev] = interfaces.api_broadlink.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "SONY"        and api_dev not in self.api:
                  import interfaces.api_sony
                  self.api[api_dev] = interfaces.api_sony.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "MAGIC-HOME"  and api_dev not in self.api:  
                  import interfaces.api_magichome
                  self.api[api_dev] = interfaces.api_magichome.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "TAPO-P100"   and api_dev not in self.api:
                  import interfaces.api_p100
                  self.api[api_dev] = interfaces.api_p100.APIcontrol(api,dev,dev_config,self.log_commands)
                  
               if api == "TEST"        and api_dev not in self.api:  
                  import interfaces.api_test
                  self.api[api_dev] = interfaces.api_test.APIcontrol(api,dev,dev_config,self.log_commands)

            else:
               logging.error("Could not connect to "+api+" - Error in config file ("+rm3config.commands + api + "/00_interface.json)")
        
        for key in self.api:
           self.available[key] = self.api[key].api_description

        while not self.stopProcess:
           time.sleep(self.wait)
           self.reconnect()
             
        logging.info( "Exiting " + self.name )

    #-------------------------------------------------

    def api_device(self,device):
        '''
        return short api_dev
        '''
        
        try:
          active_devices = self.configFiles.read_status()
          api = active_devices[device]["config"]["interface_api"]
          dev = active_devices[device]["config"]["interface_dev"]  
          return api + "_" + dev
          
        except:
          return "error_"+device
        
    
    #-------------------------------------------------
    
    def method(self,device=""):
        '''
        return method of interface
        '''
        
        api_dev = self.api_device(device)
        if api_dev in self.api:   return self.api[api_dev].method
        else:                     return "ERROR: interface not defined ("+api_dev+"/"+device+")"
    
    #-------------------------------------------------
    
    def reconnect(self,interface=""):
        '''
        reconnect all devices
        '''
        
        if interface == "":
          for key in self.api:
            if self.api[key].status != "Connected":
              self.api[key].connect()
        else:
          self.api[interface].connect()
               
    #-------------------------------------------------
    
    def test(self):
        '''
        test all APIs
        '''
      
        for key in self.api: 
          status = self.api[key].test()
          if "ERROR" in str(status): return status
          
        return "OK"

    #-------------------------------------------------
    
    def status(self,interface="",device=""):
        '''
        return status of all devices or a selected device
        '''
        
        status_all_interfaces = {}
        api_dev               = interface + "_" + device
        
        logging.debug(str(api_dev))

        for key in self.api: 
           status_all_interfaces[key] = self.api[key].status

        if interface == "":          return status_all_interfaces
        elif api_dev in self.api:    return self.api[api_dev].status
        else:                        return "ERROR: API ... not found ("+api_dev+")."

    
    #-------------------------------------------------
    
    def check_errors(self,device):
        '''
        check the amount of errors, if more than 80% errors and at least 5 requests try to reconnect
        '''
        
        api_dev = self.api_device( device )
        
        if not api_dev in self.api:
          logging.warning("!!!")
          return
        
        requests   = self.api[api_dev].count_error + self.api[api_dev].count_success
        if requests > 0: error_rate = self.api[api_dev].count_error / requests
        else:            error_rate = 0
        
        logging.debug("ERROR RATE ... "+str(error_rate) + "/"+str(self.api[api_dev].count_error)+"/"+str(requests))
        
        if error_rate >= 0.8 and requests > 5: 
           self.reconnect( api_dev )
           
    #-------------------------------------------------

    def check_errors_count(self, device, is_error):
        '''
        count errors and reset every x seconds
        '''
        
        api_dev = self.api_device( device )
       
        if (self.check_error + 10) < time.time():
        
           self.api[api_dev].count_error   = 0
           self.api[api_dev].count_success = 0
           self.check_error = time.time()
        
        if is_error:   self.api[api_dev].count_error   += 1
        else:          self.api[api_dev].count_success += 1
        
        logging.debug("ERROR RATE ... error:" + str(is_error))


    #-------------------------------------------------

    def send(self, call_api, device, button, value=""):
        '''
        send command if connected
        '''
        
        return_msg = ""
        api_dev = self.api_device( device )
        self.check_errors( device )        

        logging.info("__SEND: "+api_dev+" / " + button + ":" + value + " ("+self.api[api_dev].status+")")

        if self.api[api_dev].status == "Connected":
            method = self.method(device)
            
            if button.startswith("send-"):
               if method == "query" and value != "":    button_code = self.get_command( call_api, "send-data", device, button )
               else:                                    button_code = "ERROR, wrong method (!query) or no data transmitted."
               if not "ERROR" in button_code:           button_code = button_code.replace("{DATA}",value)

               if self.log_commands:      logging.info("...... SEND-DATA "+api_dev+" / "+button+" ('"+str(value)+"'/"+method+")")
               if self.log_commands:      logging.info("...... "+str(button_code))
               
            else:            
               if  method == "record":                  button_code = self.get_command( call_api, "buttons", device, button ) 
               elif method == "query" and value == "":  button_code = self.get_command( call_api, "buttons", device, button )
               else:                                    button_code = self.create_command( call_api, device, button, value ) 

               if self.log_commands:      logging.info("...... SEND "+api_dev+" / "+button+" ('"+str(value)+"'/"+method+")")
               if self.log_commands:      logging.info("...... "+str(button_code))

            if "ERROR" in button_code: return_msg = "ERROR: could not read/create command from button code (send/"+mode+"/"+button+"); " + button_code
            elif api_dev in self.api:  return_msg = self.api[api_dev].send(device,button_code)
            else:                      return_msg = "ERROR: API not available ("+api_dev+")"
            
            if not "ERROR" in return_msg and self.api[api_dev].method == "record" and value != "":
               self.save_status(device, button, value)
           
        else:
            return_msg = self.api[api_dev].status
        

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           if self.last_message != return_msg:
             logging.warn(return_msg)
           self.last_message = return_msg
           self.check_errors_count(device,True)
           
        else:
           self.check_errors_count(device,False)

        return return_msg


    #-------------------------------------------------

    def record(self, call_api, device, button ):
        '''
        record a command e.g. from IR device if connected
        '''
    
        return_msg = ""
        api_dev = self.api_device( device )       
        self.check_errors(call_api,device)

        logging.debug("__RECORD: "+api_dev+" ("+self.api[api_dev].status+")")

        if self.api[api_dev].status == "Connected":       
            if api_dev in self.api:    return_msg = self.api[api_dev].record(device,button)
            else:                      return_msg = "ERROR: API not available ("+api_dev+")"

            if self.log_commands:      logging.info("...... "+str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           if self.last_message != return_msg:
             logging.warn(return_msg)
           self.last_message = return_msg
           self.check_errors_count(device,True)
        else:
           self.check_errors_count(device,False)
           
        return return_msg

#-------------------------------------------------

    def query(self, call_api, device, button):
        '''
        query an information from device via API
        '''

        return_msg = ""
        api_dev = self.api_device( device )
        #self.check_errors(call_api, device)  #### -> leads to an error for some APIs

        logging.debug("__QUERY: "+api_dev+" ("+self.api[api_dev].status+")")

        if api_dev in self.api and self.api[api_dev].status == "Connected":
            button_code = self.get_command( call_api, "queries", device, button )
                       
            if "ERROR" in button_code: return_msg = "ERROR: could not read/create command from button code (query/"+device+"/"+button+"); " + button_code
            elif api_dev in self.api:  return_msg = self.api[api_dev].query(device,button_code)
            else:                      return_msg = "ERROR: API not available ("+str(api_dev)+")"

            if self.log_commands:      logging.info("...... "+str(return_msg))

        else:
             return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           if self.last_message != return_msg:
             logging.warn(return_msg)
           self.last_message = return_msg
           self.check_errors_count(device,True)
        else:
           self.check_errors_count(device,False)
           
        logging.debug(device+" QUERY "+str(return_msg))
        return return_msg

#-------------------------------------------------

    def save_status(self, device, button, status):
        '''
        save status of button to active.json
        '''

        return_msg = ""
        active     = self.configFiles.read_status()
        
        if button == "on" or button == "off" or button == "on-off":  param  = "power"
        elif button[-1:] == "+" or button[-1:] == "-":               param  = button[:-1]
        else:                                                        param  = button

        if device in active:
          if not "status" in active[device]: active[device]["status"] = {}
          active[device]["status"][param]  = status
          active[device]["status"]["TEST"] = str(time.time()) + " / " + param
          return_msg = "OK"
          
        else:
          return_msg = "ERROR record_status: device not found"
        
        self.configFiles.write_status(active,"save_status "+device+"/"+button)
        return return_msg


#-------------------------------------------------

    def get_command(self,dev_api,button_query,device,button):
        '''
        translate device and button to command for the specific device
        '''

        # read data -> to be moved to cache?!
        active        = self.configFiles.read_status()
        api           = dev_api.split("_")[0]
        
        if device in active:
          device_code  = active[device]["config"]["device"]
          buttons      = self.configFiles.read(rm3config.commands + api + "/" + device_code)
    
          # add button definitions from default.json if exist
          if rm3json.ifexist(rm3config.commands + api + "/00_default"):
             buttons_default = self.configFiles.read(rm3config.commands + api + "/00_default")

             value_list      = [ "buttons", "queries", "commands", "values", "send-data" ]            
             for value in value_list:
                if not value in buttons["data"]: buttons["data"][value] = {}             
                if value in buttons_default["data"]:
                   for key in buttons_default["data"][value]:
                     buttons["data"][value][key] = buttons_default["data"][value][key]
             
          # check for errors or return button code
          if "ERROR" in buttons or "ERROR" in active:         return "ERROR get_command: buttons not defined for device ("+device+")"
          elif button in buttons["data"][button_query]:       return buttons["data"][button_query][button]
          else:                                               return "ERROR get_command: button not defined ("+device+"_"+button+")"
        else:                                                 return "ERROR get_command: device not found ("+device+")"

#-------------------------------------------------

    def create_command(self,api,device,button,value):
        '''
        create command with "button" and value, including check if value is correct
        '''
        
        # read data -> to be moved to cache?!
        active        = self.configFiles.read_status()
        api           = dev_api.split("_")[0]
        
        if device in active:
          device_code  = active[device]["config"]["device"]
          buttons      = self.configFiles.read(rm3config.commands + api + "/" + device_code)

          # add button definitions from default.json if exist
          if rm3json.ifexist(rm3config.commands + api + "/00_default"):
             buttons_default = self.configFiles.read(rm3config.commands + api + "/00_default")

             key_list      = [ "buttons", "queries", "commands", "values", "send-data" ]            
             for key in key_list:
                if not key in buttons["data"]: buttons["data"][key] = {}             
                if key in buttons_default["data"]:
                   for key2 in buttons_default["data"][key]:
                     buttons["data"][key][key2] = buttons_default["data"][key][key2]
             
          # check for errors or return button code
          if "ERROR" in buttons or "ERROR" in active:         return "ERROR create_command: buttons not defined for device ("+device+")"
          elif button in buttons["data"]["commands"]:
   
             cmd_ok     = False       
             cmd_type   = buttons["data"]["commands"][button]["type"]
             cmd_values = buttons["data"]["values"][button]
             cmd        = buttons["data"]["commands"][button]["command"] + value

             if cmd_type == "integer" and int(value) >= cmd_values["min"] and int(value) <= cmd_values["max"]:  cmd_ok = True
             elif cmd_type == "enum"  and value in cmd_values:                                                  cmd_ok = True

             if cmd_ok == False:                              return "ERROR create_command: values not valid ("+device+", "+button+", "+str(value)+")"
             else:                                            return cmd

          else:                                               return "ERROR create_command: command not defined ("+device+", "+button+")"
        else:                                                 return "ERROR create_command: device not found ("+button+")"


#-------------------------------------------------
# EOF

