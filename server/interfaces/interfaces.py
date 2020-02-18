#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time, threading

import modules.rm3json                as rm3json
import modules.rm3config              as rm3config

import interfaces.test_api
import interfaces.kodi_api
import interfaces.eiscp_api
import interfaces.broadlink_api
	
#-------------------------------------------------

class connect(threading.Thread):
    '''
    class to control all interfaces including a continuous check if interfaces still available
    '''

    def __init__(self):
        '''
        Initialize Interfaces
        '''
	    
        threading.Thread.__init__(self)
        self.api         = {}
        self.available   = {}
        self.stopProcess = False
        self.wait        = 60       # time for reconnects
        self.name        = "jc://remote/interfaces/"

        self.methods   = {
            "send"        : "Send command via API (send)",
            "record"      : "Record per device (record)",
            "query"       : "Request per API (query)"
            }

    #-------------------------------------------------
    
    def run(self):
        '''
        Initialize APIs and loop to check connection status
        '''
        
        logging.info( "Starting " + self.name )
        
        self.api["KODI"]        = interfaces.kodi_api.kodiAPI("KODI")
        self.api["TEST"]        = interfaces.test_api.testAPI("TEST")
        self.api["EISCP-ONKYO"] = interfaces.eiscp_api.eiscpAPI("EISCP-ONKYO")
        self.api["BROADLINK"]   = interfaces.broadlink_api.broadlinkAPI("BROADLINK")

        for key in self.api:
           self.available[key] = self.api[key].api_description

        while not self.stopProcess:
        
           time.sleep(self.wait)
           self.reconnect()
             
        logging.info( "Exiting " + self.name )

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
        '''test all APIs'''
      
        for key in self.api: 
          status = self.api[key].test()
          if "ERROR" in str(status): return status
          
        return "OK"

    #-------------------------------------------------
    
    def status(self,interface=""):
        '''
        return status of all devices
        '''
        
        if interface == "":
           status = {}
           for key in self.api: status[key] = self.api[key].status
           return status
        elif interface in self.api:
           return self.api[interface].status
        else:
           return "ERROR: API not found ("+interface+")."
    
    #-------------------------------------------------

    def send(self, call_api, device, button, value="" ):
        '''check if API exists and send command'''
        
        return_msg = ""
        logging.debug("SEND "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":
            if value == "":  button_code = self.get_command( call_api, "buttons", device, button ) 
            else:            button_code = self.create_command( call_api, device, button, value ) 
            
            if call_api in self.api: return_msg = self.api[call_api].send(device,button_code)
            else:                    return_msg = "ERROR: API not available ("+call_api+")"
        else:                        return_msg = "ERROR: API not connected ("+call_api+")"
        
        if "ERROR" in str(return_msg): logging.warn(return_msg)
        return return_msg


    #-------------------------------------------------

    def record(self, call_api, device, button ):
        '''record a command'''
    
        return_msg = ""
        logging.debug("RECORD "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":       
            if call_api in self.api: return_msg = self.api[call_api].send(device,button)
            else:                    return_msg = "ERROR: API not available ("+call_api+")"
        else:                        return_msg = "ERROR: API not connected ("+call_api+")"

        if "ERROR" in str(return_msg): logging.warn(return_msg)
        return return_msg

#-------------------------------------------------

    def query(self, call_api, device, button):
        '''query an information'''

        return_msg = ""
        logging.debug("QUERY "+call_api+" / "+device+" - "+button)

        if self.api[call_api].status == "Connected":       
            button_code = self.get_command( call_api, "queries", device, button )
            if call_api in self.api: return_msg = self.api[call_api].query(device,button_code)
            else:                    return_msg = "ERROR: API not available ("+str(call_api)+")"
        else:                        return_msg = "ERROR: API not connected ("+str(call_api)+")"

        if "ERROR" in str(return_msg): logging.warn(return_msg)
        return return_msg

#-------------------------------------------------

    def get_command(self,api,button_query,device,button):
        '''
        translate device and button to command for the specific device
        '''

        # read data -> to be moved to cache?!
        active       = rm3json.read(rm3config.devices + rm3config.active)
        
        if device in active:
          device_code  = active[device]["device"]
          buttons      = rm3json.read(rm3config.commands + api + "/" + device_code)
    
          # add button definitions from default.json if exist
          if rm3json.ifexist(rm3config.commands + api + "/default"):
             buttons_default = rm3json.read(rm3config.commands + api + "/default")
             for key in buttons_default["data"][button_query]:
               buttons["data"][button_query][key] = buttons_default["data"][button_query][key]

          # check for errors or return button code
          if "ERROR" in buttons or "ERROR" in active:         return "ERROR get_command: buttons not defined for device ("+device+")"
          elif button in buttons["data"][button_query]:       return buttons["data"][button_query][button]
          else:                                               return "ERROR get_command: button not defined ("+device+"_"+button+")"
        else:                                                 return "ERROR get_command: device not found ("+device+")"

#-------------------------------------------------

    def create_command(self,api,device,command,value):
        '''
        create command with "button" and value, including check if value is correct
        '''
        
        # read data -> to be moved to cache?!
        active       = rm3json.read(rm3config.devices + rm3config.active)
        
        if device in active:
          device_code  = active[device]["device"]
          buttons      = rm3json.read(rm3config.commands + api + "/" + device_code)
    
          # add button definitions from default.json if exist
          if rm3json.ifexist(rm3config.commands + api + "/default"):
             buttons_default = rm3json.read(rm3config.commands + api + "/default")
             if not "commands" in buttons["data"]: buttons["data"]["commands"] = {}
             if not "values"   in buttons["data"]: buttons["data"]["values"]   = {}
             
             if "commands" in buttons_default["data"]:
               for key in buttons_default["data"]["commands"]:
                 buttons["data"]["commands"][key] = buttons_default["data"]["commands"][key]
                
             if "values" in buttons_default["data"]:
               for key in buttons_default["data"]["values"]:
                 buttons["data"]["values"][key]   = buttons_default["data"]["values"][key]

          # check for errors or return button code
          if "ERROR" in buttons or "ERROR" in active:         return "ERROR create_command: buttons not defined for device ("+device+")"
          elif command in buttons["data"]["commands"]:
   
             cmd_ok     = False       
             cmd_type   = buttons["data"]["commands"][command]["type"]
             cmd_values = buttons["data"]["values"][command]
             cmd        = buttons["data"]["commands"][command]["command"] + value
                          
             if cmd_type == "integer" and int(value) >= cmd_values["min"] and int(value) <= cmd_values["max"]:  cmd_ok = True
             elif cmd_type == "enum"  and value in cmd_values:                                                  cmd_ok = True

             if cmd_ok == False:                              return "ERROR create_command: values not valid ("+device+", "+command+", "+value+")"
             else:                                            return cmd

          else:                                               return "ERROR create_command: command not defined ("+device+", "+command+")"
        else:                                                 return "ERROR create_command: device not found ("+device+")"


#-------------------------------------------------
# EOF

