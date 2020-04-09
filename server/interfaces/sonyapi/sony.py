
#----------------------------------
# jc://remote/interface
# -------------------------
# Integration of SonyAPILib
#----------------------------------

import logging
import wakeonlan
import time

from sonyapilib.device import SonyDevice
from enum import Enum
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
        
        self.available_commands = []
        
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
          logging.error("SONY load device: "+str(e))

    #-----------------------------

    def load_device(self):
        '''
        Restore the device from disk.
        '''
        import os
        sony_device = None
        
        logging.info("SONY load: "+self.device_ip+", " +self.device_name+", "+self.device_config)
        
        try:
          if os.path.exists(self.device_config):
            with open(self.device_config, 'r') as content_file:
                json_data = content_file.read()
                sony_device = SonyDevice.load_from_json(json_data)
          else:
            logging.error("SONY load device: file not found ("+self.device_config+")")
          return sony_device
          
        except Exception as e:
          logging.error("SONY load device: "+str(e))

    #-----------------------------
    
    def register(self,pin):
        '''
        register device
        '''
        if not device:
            # device must be on for registration
            self.device = SonyDevice(self.device_ip, self.device_name)
            self.device.register()
            
            #pin = input("Enter the PIN displayed at your device: ")
            if self.device.send_authentication(pin):
               self.save_device()
            else:
               print("Registration failed")
               return "Registration failed"

    #-----------------------------

    def wake_on_lan(self):
        '''
        Wake device on LAN if off
        '''
        is_on = self.device.get_power_status()
        if not is_on:
            self.device.power(True)
            
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
        if   cmd == "PowerOn"  and self.get_status("power") == False: 
          try:
            logging.info("SONY wake on lan: START ("+self.device.mac+"/"+self.device_ip+")")
            wakeonlan.send_magic_packet(self.device.mac,ip_address=self.device_ip)
            # self.device.wakeonlan()
            time.sleep(3)

          except Exception as e:
            logging.error("SONY wake on lan: "+str(e))
            
        elif cmd == "PowerOff" and self.get_status("power") == True:
          self.power(False)
        
        elif self.get_status("power"):
           if self.available_commands == []:  self.available_commands = self.get_values("commands")
           if cmd in self.available_commands: self.device._send_command(cmd)
           else:                              return "ERROR: command not available for this device ("+cmd+")"
           return "OK"
           
        else:
           return "ERROR: Device is off."
           
        return "OK"

    #-----------------------------

    def get_values(self,cmd):
        '''
        get values that are available on the device
        '''
        if self.get_status("power"):
           if   cmd == "apps":            return self.device.get_apps()
           elif cmd == "commands":        return self.device.commands.keys()
           elif cmd == "actions":         return self.device.actions.keys()
           else:                          return "ERROR: no values available ("+cmd+")"
        else:
           return "ERROR: Device is off."
        
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
           try:
              content = self.device._post_soap_request(url=self.device.av_transport_url, params=data, action=action)
           except Exception as e:
              return "ERROR: Request failed ("+str(e)+")"
              
           if params[1]: result = find_in_xml(content, [".//"+params[1]]).text
           else:         result = str(content)
           return result
           
        else:
           return "ERROR: Device is off."

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
        
        if cmd == "power":             return self.device.get_power_status()
        elif cmd == "playing":         return self.device.get_playing_status()  # OK, PLAYING, ... NO_MEDIA_PRESENT, ...
        elif cmd == "SOAP":            return self.get_status_SOAP(param)
        elif cmd == "IRRC":            return self.get_status_IRRC(param)
        else:                          return "ERROR: Command not defined ("+cmd+")"
        
    #-----------------------------

    def start_app(self,app):
        '''
        start app
        '''
        if self.get_status("power"):
           self.device.start_app(app)
           return "OK"
        else:
           return "ERROR: Device is off."

    #-----------------------------

    def test(self):
        '''
        test system info ... checked for SONY BDP-S4500
        '''
        
        self.send("PowerOn")
        
        SOAPcalls = {
             "GetTransportInfo"			: ["CurrentTransportState","CurrentTransportStatus","CurrentSpeed"],
             "GetMediaInfo"			: ["NrTracks","MediaDuration","CurrentURI","CurrentURIMetaData","NextURI","NextURIMetaData","PlayMedium","RecordMedium","WriteStatus"],
             "GetDeviceCapabilities"		: ["PlayMedia","RecMedia","RecQualityModes"],
             "GetTransportSettings"		: ["PlayMode","RecQualityMode"],
             "GetPositionInfo"			: ["Track","TrackDuration","TrackMetaData","TrackURI","RelTime","AbsTime","RelCount","AbsCount"],
             "GetCurrentTransportActions"	: ["Actions"]
             }
             
        print(" ---- SOAP Calls ---- ")
        for key in SOAPcalls:
             for param in SOAPcalls[key]:
                 value = self.get_status("SOAP",key+"::"+param)
                 print(key+"::"+param+" = "+str(value))
        
        #-------------------

        IRRCcalls = {
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
