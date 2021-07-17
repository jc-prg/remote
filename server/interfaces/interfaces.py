#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time, threading

import modules.rm3json                as rm3json
import modules.rm3config              as rm3config

import interfaces.api_test
import interfaces.api_kodi
import interfaces.api_eiscp
import interfaces.api_broadlink
import interfaces.api_sony
	
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
        self.methods      = {
            "send"        : "Send command via API (send)",
            "record"      : "Record per device (record)",
            "query"       : "Request per API (query)"
            }

    #-------------------------------------------------
    
    def run(self):
        '''
        Initialize APIs and loop to check connection status
        '''
               
        logging.info("Starting " + self.name)
        load_modules_from_config = True

        if load_modules_from_config:
          loaded_apis    = {}
          active_devices = self.configFiles.read_status()

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
               if api == "KODI"        and api not in self.api:  self.api[api] = interfaces.api_kodi.kodiAPI(api,dev,dev_config)
               if api == "EISCP-ONKYO" and api not in self.api:  self.api[api] = interfaces.api_eiscp.eiscpAPI(api,dev,dev_config)
               if api == "BROADLINK"   and api not in self.api:  self.api[api] = interfaces.api_broadlink.broadlinkAPI(api,dev,dev_config)
               if api == "SONY"        and api not in self.api:  self.api[api] = interfaces.api_sony.sonyAPI(api,dev,dev_config)
               if api == "TEST"        and api not in self.api:  self.api[api] = interfaces.api_test.testAPI(api,dev,dev_config)
            else:
               logging.error("Could not connect to "+api+" - Error in with config file ("+rm3config.commands + api + "/00_interface.json)")
                                               
        else:
          self.api["KODI"]        = interfaces.api_kodi.kodiAPI("KODI")
          self.api["TEST"]        = interfaces.api_test.testAPI("TEST")
          self.api["EISCP-ONKYO"] = interfaces.api_eiscp.eiscpAPI("EISCP-ONKYO","ONKYO-TXNR686")
          self.api["BROADLINK"]   = interfaces.api_broadlink.broadlinkAPI("BROADLINK")
          self.api["SONY"]        = interfaces.api_sony.sonyAPI("SONY","SONY-BDP-S4500")

        for key in self.api:
           self.available[key] = self.api[key].api_description

        while not self.stopProcess:
           time.sleep(self.wait)
           self.reconnect()
             
        logging.info( "Exiting " + self.name )

    #-------------------------------------------------
    
    def method(self,interface=""):
        '''
        return method of interface
        '''
        
        if interface in self.api:   return self.api[interface].method
        else:                       return "ERROR: interface not defined ("+interface+")"
    
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
    
    def status(self,interface=""):
        '''
        return status of all devices or a selected device
        '''
        
        status_all_interfaces = {}
        for key in self.api: 
           status_all_interfaces[key] = self.api[key].status

        if interface == "":          return status_all_interfaces
        elif interface in self.api:  return self.api[interface].status
        else:                        return "ERROR: API not found ("+interface+")."

    
    #-------------------------------------------------
    
    def check_errors(self,interface):
        '''
        check the amount of errors, if more than 80% errors and at least 5 requests try to reconnect
        '''
        
#        if not self.api[interface].count_error:   self.api[interface].count_error   = 0
#        if not self.api[interface].count_success: self.api[interface].count_success = 0

        requests   = self.api[interface].count_error + self.api[interface].count_success
        if requests > 0: error_rate = self.api[interface].count_error / requests
        else:            error_rate = 0
        
        logging.debug("ERROR RATE ... "+str(error_rate) + "/"+str(self.api[interface].count_error)+"/"+str(requests))
        
        if error_rate >= 0.8 and requests > 5: 
           self.reconnect(interface)
           
    #-------------------------------------------------

    def check_errors_count(self,interface,is_error):
        '''
        count errors and reset every x seconds
        '''
        
        if (self.check_error + 10) < time.time():
        
           self.api[interface].count_error   = 0
           self.api[interface].count_success = 0
           self.check_error = time.time()
        
        if is_error:   self.api[interface].count_error   += 1
        else:          self.api[interface].count_success += 1
        
        logging.debug("ERROR RATE ... error:" + str(is_error))


    #-------------------------------------------------

    def send(self, call_api, device, button, value=""):
        '''
        check if API exists and send command
        '''
        
        return_msg = ""
        self.check_errors(call_api)
        logging.debug("SEND "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":
            method = self.method(call_api)
            
            if button.startswith("send-"):
               logging.info("SEND-DATA "+call_api+" / "+device+" - "+button+" ("+str(value)+")")
               if method == "query" and value != "":    button_code = self.get_command( call_api, "send-data", device, button )
               else:                                    button_code = "ERROR, wrong method (!query) or no data transmitted."
               if not "ERROR" in button_code:           button_code = button_code.replace("{DATA}",value)

               logging.info("BUTTON-CODE "+button_code)
               
            else:            
               logging.info("SEND "+call_api+" / "+device+" - "+button+" ("+str(value)+")")
               if  method == "record":                  button_code = self.get_command( call_api, "buttons", device, button ) 
               elif method == "query" and value == "":  button_code = self.get_command( call_api, "buttons", device, button )
               else:                                    button_code = self.create_command( call_api, device, button, value ) 
            
            if "ERROR" in button_code: return_msg = "ERROR: could not read/create command from button code (send/"+mode+"/"+button+"); " + button_code
            elif call_api in self.api: return_msg = self.api[call_api].send(device,button_code)
            else:                      return_msg = "ERROR: API not available ("+call_api+")"
            
            if not "ERROR" in return_msg and self.api[call_api].method == "record" and value != "":
               self.save_status(device, button, value)
           
        else:
            return_msg = "ERROR: API not connected ("+call_api+")"
        

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           logging.warn(return_msg)
           self.check_errors_count(call_api,True)
        else:
           self.check_errors_count(call_api,False)

        return return_msg


    #-------------------------------------------------

    def record(self, call_api, device, button ):
        '''
        record a command (e.g. from IR device)
        '''
    
        return_msg = ""
        self.check_errors(call_api)
        logging.debug("RECORD "+call_api+" / "+device+" - "+button)
        logging.info("RECORD "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":       
            if call_api in self.api: return_msg = self.api[call_api].record(device,button)
            else:                    return_msg = "ERROR: API not available ("+call_api+")"
        else:                        return_msg = "ERROR: API not connected ("+call_api+")"

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           logging.warn(return_msg)
           self.check_errors_count(call_api,True)
        else:
           self.check_errors_count(call_api,False)
           
        return return_msg

#-------------------------------------------------

    def query(self, call_api, device, button):
        '''
        query an information from device via API
        '''

        return_msg = ""
        self.check_errors(call_api)
        logging.debug("QUERY "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":       
            button_code = self.get_command( call_api, "queries", device, button )
            
            if "ERROR" in button_code: return_msg = "ERROR: could not read/create command from button code (query/"+device+"/"+button+"); " + button_code
            elif call_api in self.api: return_msg = self.api[call_api].query(device,button_code)
            else:                      return_msg = "ERROR: API not available ("+str(call_api)+")"
        else:                          return_msg = "ERROR: API not connected ("+str(call_api)+")"

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
           logging.warn(return_msg)
           self.check_errors_count(call_api,True)
        else:
           self.check_errors_count(call_api,False)
           
        return return_msg

#-------------------------------------------------

    def save_status(self, device, button, status):
        '''
        save status of button to active.json
        '''
    
        return_msg = ""
        active        = self.configFiles.read_status()
        
        if button == "on" or button == "off" or button == "on-off":  value  = "power"
        elif button[-1:] == "+" or button[-1:] == "-":               value  = button[:-1]
        else:                                                        value  = button

        if device in active:
          if not "status" in active[device]: active[device]["status"] = {}
          active[device]["status"][value] = status
          return_msg = "OK"
          
        else:
          return_msg = "ERROR record_status: device not found"
        
        self.configFiles.write_status(active,"save_status "+device+"/"+button)
        return return_msg


#-------------------------------------------------

    def get_command(self,api,button_query,device,button):
        '''
        translate device and button to command for the specific device
        '''

        # read data -> to be moved to cache?!
        active        = self.configFiles.read_status()
        
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
             
#             if button_query in buttons_default["data"]:
#               for key in buttons_default["data"][button_query]:
#                 buttons["data"][button_query][key] = buttons_default["data"][button_query][key]
#             else:
#               return "ERROR get_command: button_query does not exist for device ("+device+"/"+button_query+")"

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
             
#             if not "commands" in buttons["data"]: buttons["data"]["commands"] = {}
#             if not "values"   in buttons["data"]: buttons["data"]["values"]   = {}
             
#             if "commands" in buttons_default["data"]:
#               for key in buttons_default["data"]["commands"]:
#                 buttons["data"]["commands"][key] = buttons_default["data"]["commands"][key]
                
#             if "values" in buttons_default["data"]:
#               for key in buttons_default["data"]["values"]:
#                 buttons["data"]["values"][key]   = buttons_default["data"]["values"][key]

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

