
#----------------------------------
# jc://remote/interface
# -------------------------
# Integration of SonyAPILib
#----------------------------------

import logging
import wakeonlan
import time

from sonyapilib.device     import SonyDevice
from enum                  import Enum
from sonyapilib.xml_helper import find_in_xml

try:
  from urllib.parse import quote
  from urllib.parse import urljoin
  from urllib.parse import urlparse
except:
  from urlparse import urlparse, urljoin
  


class HttpMethod(Enum):
    '''
    Define which http method is used.
    '''
    GET  = "get"
    POST = "post"


class sonyDevice():
    '''
    Create Sony device
    '''

    def __init__(self,ip,name,config):
        '''
        initialize device
        '''
        self.device_ip     = ip
        self.device_name   = name
        self.device_config = config
        self.device        = self.load_device()
        
        self.cache         = {}
        self.cache_time    = 0
        
        self.available_commands       = []
        self.waiting_for_registration = False       

        self.logging = logging.getLogger("api.SONYlib")
        self.logging.setLevel = rm3stage.log_set2level

        # SOAPcalls // tested with SONY BDP S4500

        self.SOAPcalls = {
             "GetTransportInfo"		: ["CurrentTransportState","CurrentTransportStatus","CurrentSpeed"],
             "GetMediaInfo"			: ["NrTracks","MediaDuration","CurrentURI","CurrentURIMetaData","NextURI","NextURIMetaData","PlayMedium","RecordMedium","WriteStatus"],
             "GetDeviceCapabilities"		: ["PlayMedia","RecMedia","RecQualityModes"],
             "GetTransportSettings"		: ["PlayMode","RecQualityMode"],
             "GetPositionInfo"		: ["Track","TrackDuration","TrackMetaData","TrackURI","RelTime","AbsTime","RelCount","AbsCount"],
             "GetCurrentTransportActions"	: ["Actions"]
             }
             
        # IRRCcalls // tested with SONY BDP S4500

        self.IRRCcalls = {
             "getContentInformation" : {
                   "command" : "getContentInformation",
                   "main"    : "contentInformation",
                   "items"   : ["infoItem||class","infoItem||source","infoItem||mediaType","infoItem||mediaFormat"]
                   },
             "getSystemInformation"  : {
                   "command" : "getSystemInformation",
                   "main"    : "systemInformation",
                   "items"   : ["name","generation","supportContentsClass::class","supportSource::source"]
                   },
             "getStatus"             : {
                   "command" : "getStatus",
                   "main"    : "statusList",
                   "items"   : ["status||disc::statusItem||type","status||disc::statusItem||mediaType","status||disc::statusItem||mediaFormat"]
                   }
             }

        
    #-----------------------------

    def save_device(self):
        '''
        Save the device to disk.
        '''
        data      = device.save_to_json()
        try:
          text_file = open(self.device_config, "w")
          text_file.write(data)
          text_file.close()
          
        except Exception as e:
          self.logging.error("SONY load device: "+str(e))

    #-----------------------------

    def load_device(self):
        '''
        Restore the device from disk.
        Config file will be created during the registration process.
        '''
        
        import os
        sony_device = None
        
        self.logging.info("SONY load: "+self.device_ip+", " +self.device_name+", "+self.device_config)
                
        try:
          if os.path.exists(self.device_config):
            with open(self.device_config, 'r') as content_file:
                json_data   = content_file.read()
            sony_device = SonyDevice.load_from_json(json_data)
          else:
            self.logging.error("SONY load device: file not found ("+self.device_config+")")
          return sony_device
          
        except Exception as e:
          self.logging.error("SONY load device: "+str(e))

    #-----------------------------
    
    def registration_start(self):
        '''
        register device / device must be on for registration
        -> request registration
        '''
        self.logging.info("SONY Start Registration")
        
        self.device = SonyDevice(self.device_ip, self.device_name)
        self.device.register()
        self.waiting_for_registration = True
            
        return "SONY Device is waiting for PIN"

    #-----------------------------
    
    def registration_finish(self,pin):
        '''
        register device / device must be on for registration
        -> return PIN for registration and save data
        '''
        self.logging.info("SONY Finish Registration")
        
        if self.wating_for_registration:        
            if self.device.send_authentication(pin):  self.save_device()
            else:                                     return "ERROR: SONY Registration failed"               
        else:
            return "ERROR: SONY Not waiting for registration"

    #-----------------------------
            
    def power(self,power_on):
        '''
        switch power on / off
        '''
        self.device.power(power_on)

    #-----------------------------

    def send(self,cmd):
        '''
        send command
        '''
        if cmd == "PowerOn" and self.get_status("power") == False: 
          try:
            self.logging.info("SONY wake on lan: START ("+self.device.mac+"/"+self.device_ip+")")
            self.device.wakeonlan(self.device_ip)
            time.sleep(3)

          except Exception as e:
            self.logging.error("SONY wake on lan: "+str(e))


        elif cmd == "PowerOff" and self.get_status("power") == True:
          self.power(False)

        
        elif self.get_status("power"):
           if self.available_commands == []:  self.available_commands = self.get_values("commands")
           if cmd in self.available_commands: self.device._send_command(cmd)
           else:                              return "ERROR: command not available for this device ("+cmd+")"          
           return "OK"
           
        else:
           return "ERROR: Device is off (SONY)."
           
        return "OK"

    #-----------------------------

    def get_values(self,cmd):
        '''
        get values that are available on the device
        '''
        if self.get_status("power"):
           if   cmd == "apps":            return self.device.get_apps()
           elif cmd == "actions":         return self.device.actions.keys()
           elif cmd == "commands":        
              self.available_commands = []
              commands = self.device.commands.keys()
              for key in commands:
                  self.available_commands.append(key)
              self.available_commands.append("PowerOn")
              self.available_commands.append("PowerOff")
              return self.available_commands
           else:                          return "ERROR: no values available ("+cmd+")"
        else:
           return "ERROR: Device is off (SONY)."
        
    #-----------------------------

    def get_status_SOAP(self,param):
        '''
        get status using a SOAP call (if type is AVTransport)
        Spec for UPNP-av-AVTransport: http://upnp.org/specs/av/UPnP-av-AVTransport-v1-Service.pdf
        '''
        params  = param.split("::")
        data    = '<m:'+params[0]+' xmlns:m="urn:schemas-upnp-org:service:AVTransport:1"><InstanceID>0</InstanceID></m:'+params[0]+'>' 
        action  = "urn:schemas-upnp-org:service:AVTransport:1#"+params[0]
        
        
        if self.get_status("power"):
           if "SOAP_"+params[0] not in self.cache or self.cache_time + 5 < time.time():
             try:
               content = self.device._post_soap_request(url=self.device.av_transport_url, params=data, action=action)
               self.cache["SOAP_"+params[0]] = content
               self.cache_time               = time.time()
               
             except Exception as e:
               return "ERROR: Request failed ("+str(e)+")"
               
           else:
               content = self.cache["SOAP_"+params[0]]
               
           if params[1]: result = find_in_xml(content, [".//"+params[1]]).text
           else:         result = str(content)
           return result
           
        else:
           return "ERROR: Device is off (SONY)."

    #-----------------------------

    def get_status_CMD(self,param):
    
        return "NOT IMPLEMENTED (TESTING)"
    
        result = "test"
        try:
          result = self.device._send_http(self.device._get_action("getContentInformation").url, method=HttpMethod.GET)
          self.logging.warning(result.text)

          result = self.device._send_http(self.device._get_action("getSystemInformation").url, method=HttpMethod.GET)
          self.logging.warning(result.text)
          
          result = self.device._send_http(self.device._get_action("getContentURL").url, method=HttpMethod.GET)
          self.logging.warning(result.text)

          result = self.device._send_http(self.device._get_action("getStatus").url, method=HttpMethod.GET)
          self.logging.warning(result.text)

        except Exception as e:
          return "ERROR: " + str(e)
  
        return str(result.text)
        
    #-----------------------------

    def get_status_IRRC(self,param):
        '''
        get status using an IRRC call
        Spec for IRCC -> https://buildmedia.readthedocs.org/media/pdf/pyircc/latest/pyircc.pdf
        '''
        # param = { "command" : "...", "main" : "...", "items" : "..." }
        # :: -> split xml tags
        # || -> split tag and values (1. "name=...", 2. "field=...")
        
        return "NOT IMPLEMENTED YET"
        
    #-----------------------------
        
    def get_status(self,cmd,param=""):
        '''
        get status ...
        '''
        
        self.logging.debug("SONY get_status: "+str(cmd)+"/"+str(param)+" - " + str(self.device.get_power_status()))    
        if cmd == "power":               return self.device.get_power_status()
        
        if self.device.get_power_status():
          if cmd == "playing":           return self.device.get_playing_status()  # OK, PLAYING, ... NO_MEDIA_PRESENT, ...
          elif cmd == "SOAP":            return self.get_status_SOAP(param)
          elif cmd == "IRRC":            return self.get_status_IRRC(param)
          elif cmd == "CMD":             return self.get_status_CMD(param)
          else:                          return "ERROR: Command not defined ("+cmd+")"

        else:
           return "ERROR: Device is off (SONY)."
        
    #-----------------------------

    def start_app(self,app):
        '''
        start app
        '''
        if self.get_status("power"):
           self.device.start_app(app)
           return "OK"
        else:
           return "ERROR: Device is off (SONY)."

    #-----------------------------

    def test(self):
        '''
        test system info ... checked for SONY BDP-S4500
        '''
        
        self.send("PowerOn")
        
        SOAPcalls = self.SOAPcalls
        IRRCcalls = self.IRRCcalls


        print(" ---- SOAP Calls ---- ")
        for key in SOAPcalls:
             for param in SOAPcalls[key]:
                 value = self.get_status("SOAP",key+"::"+param)
                 print(key+"::"+param+" = "+str(value))
        

        print(" ---- IRRC Calls ---- ")
        for key in IRRCcalls:
              value = self.get_status("IRRC",key)
              print(key+" = "+str(value))
              # .....
              # add field to "get command" and return specific value (compared to SOAP calls)


	
        # IRCC -> https://buildmedia.readthedocs.org/media/pdf/pyircc/latest/pyircc.pdf
        #-------------------
        info          = ["getContentInformation","getSystemInformation","getStatus"]      

        for x in info:
           print(" .... " + x + " .... ")
           response = self.device._send_http(self.device._get_action(x).url, method=HttpMethod.GET)
           if response: print(response.text)

#        for element in find_in_xml( response.text, [("supportFunction", "all"), ("function", True)] ):
#            for function in element:
#                if function.attrib["name"] == "WOL":
#                    self.mac = function.find("functionItem").attrib["value"]
        

        #-------------------
        # https://github.com/KHerron/SonyAPILib
        # https://www.codeproject.com/Articles/875948/SonyAPILib
   

#---------------------------------------   
# EOF
