#-----------------------------------
# API integration for jc://remote/ MAGIC HOME
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

import interfaces.magichome            as device

#-------------------------------------------------
# API-class
#-------------------------------------------------

shorten_info_to = rm3config.shorten_info_to

#-------------------------------------------------

class magicAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",device_config={}):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "Magic Home (implementation in progress)"
       self.method          = "query" # or "record"
       self.api_config      = device_config
       self.api_device      = device
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       self.not_connected   = "Device not connected (MAGIC-HOME)."
       
       logging.info("... "+self.api_name+" - " + self.api_description)
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       # commands to connect and to check, if connection works - if not, return error message

       self.status               = "Connected"
       self.count_error          = 0
       self.count_success        = 0
       api_ip                    = self.api_config["IPAddress"]
       api_device_type           = self.api_config["DeviceType"]
       
       try:
           self.api = device.MagicHomeApi(api_ip, api_device_type)
           self.api.get_status()
           self.api.jc = magicAPIaddOn(self.api)
           self.api.jc.status        = "Connected"
           self.api.jc.not_connected = self.not_connected
#           self.api.jc.test()
           self.working = False
          
       except Exception as e:
           self.status = "ERROR "+self.api_name+" - send: " + str(e)
           self.working = False
           return self.status

       return self.status


   #-------------------------------------------------
   
   def wait_if_working(self):
       '''Some devices run into problems, if send several requests at the same time'''
       while self.working:
         logging.info(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------
   
   def send(self,device,command):
       '''Send command to API'''
       
       self.wait_if_working()
       self.working = True

       result  = {}
       logging.info("Button-Code: "+command[:shorten_info_to]+"... ("+self.api_name+")")

       if self.status == "Connected":
         try:
           command = "self.api."+command
           result = eval(command)
           logging.debug(str(result))

           if "error" in result:
             self.working = False
             return "ERROR "+self.api_name+" - " + result["error"]["message"]
             
           if not "result" in result:
             self.working = False
             return "ERROR "+self.api_name+" - unexpected result format."           
             
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - query**: " + str(e)
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       result = ""
       self.wait_if_working()
       self.working = True

       result  = {}
       logging.info("Button-Code: "+command[:shorten_info_to]+"... ("+self.api_name+")")

       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]

       if self.status == "Connected":
         try:
           command = "self.api."+command_param[0]
           result = eval(command)
           logging.debug(str(result))
           
           if "error" in result:      
             if "message" in result["error"]: msg = str(result["error"]["message"])
             else:                            msg = str(result["error"])
             self.working = False
             return "ERROR "+self.api_name+" - " + msg
             
           elif not "result" in result: 
             self.working = False
             return "ERROR "+self.api_name+" - unexpected result format."
           
           else:
             if len(command_param) > 1: result_param = eval("result['result']"+command_param[1])
             else:                      result_param = str(result['result'])
           
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - query*: " + str(e) + " | " + command
       else:
           self.working = False
           return "ERROR "+self.api_name+": Not connected"
       
       self.working = False
       return result_param
       
       
   #-------------------------------------------------
   
   def record(self,device,command):
       '''Record command, especially build for IR devices'''

       self.wait_if_working()
       self.working = True

# ---- change for your api ----
#       if self.status == "Connected":
#         try:
#           result  = self.api.command(xxx)
#         except Exception as e:
#           self.working = True
#           return "ERROR "+self.api_name+" - record: " + str(e)                     
#       else:
#         self.working = True
#         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
         try:
           self.api.turn_on
           time.sleep(0.3)
           self.api.update_device(255, 0, 0, 0, 0)
           time.sleep(0.3)
           self.api.update_device(0, 255, 0, 0, 0)
           time.sleep(0.3)
           self.api.update_device(0, 0, 255, 0, 0)
           time.sleep(0.3)
           self.api.update_device(0, 0, 0, 0, 0)
           #self.device.send_preset_function(37, 100)
           self.api.turn_off
           
         except Exception as e:
           self.working = False
           return "ERROR "+self.api_name+" - test: " + str(e)                     

       else:
         self.working = False
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"


#-------------------------------------------------
# additional functions -> define self.api.jc.*
#-------------------------------------------------

class magicAPIaddOn():
   '''
   did not found a way to increase or decrease volume directly
   '''

   def __init__(self,api):
   
      self.addon          = "jc://addon/magic-home/"
      self.api            = api
      self.volume         = 0
      self.cache_metadata = {}             # cache metadata to reduce api requests
      self.cache_time     = time.time()    # init cache time
      self.cache_wait     = 2              # time in seconds how much time should be between two api metadata requests
      self.brightness     = 1
      self.last_r         = 0
      self.last_g         = 0
      self.last_b         = 0
      self.last_speed     = 100
      self.power_status   = "OFF"
      
   #-------------------------------------------------

   def turn_on(self):
     '''
     turn on and set metadata
     '''
     if self.status == "Connected":
       self.power_status = "ON"
       self.api.turn_on()
       return { "result", "test" }
       
     else:
       self.power_status = "NOT CONNECTED"
       return self.not_connected

   #-------------------------------------------------
   
   def turn_off(self):
     '''
     turn of and set metadata
     '''
     if self.status == "Connected":
       self.power_status = "OFF"
       self.api.turn_off()
       return { "result", "test" }
       
     else:
       self.power_status = "NOT CONNECTED"
       return self.not_connected
   
   #-------------------------------------------------
   
   def set_color(self, r, g="", b=""):
     '''
     set color including brightness
     '''
     
     if g == "" and b == "":
       data = r.split(":")
       r    = int(data[0])
       g    = int(data[1])
       b    = int(data[2])
     
     if self.status == "Connected":
       self.last_r = r
       self.last_g = g
       self.last_b = b
       r = int(r*self.brightness)
       g = int(g*self.brightness)
       b = int(b*self.brightness)
       self.api.update_device(r, g, b, 0, 0)

       if r+g+b == 0: self.power_status = "OFF"
       else:          self.power_status = "ON"
       return { "result", "set_color" }
       
     else:
       return self.not_connected
    
   #-------------------------------------------------

   def set_preset(self, preset):
     '''
     set led program
     '''
     
     presets = [37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52]
         
     if self.status == "Connected":
       logging.info("............................"+str(presets[preset]))
       #self.api.send_preset_function(presets[preset], 200)
       self.api.send_preset_function(preset, 255)
       return { "result", "preset" }
       
     else:
       return self.not_connected

   #-------------------------------------------------
    
   def set_brightness(self, percent):
     '''
     set brightness
     '''
     
     if self.status == "Connected":
       self.brightness = percent/100
       r = self.last_r
       g = self.last_g
       b = self.last_b
       r = round(r*self.brightness)
       g = round(g*self.brightness)
       b = round(b*self.brightness)
       self.api.update_device(r, g, b, 0, 0)

       if r+g+b == 0: self.power_status = "OFF"
       else:          self.power_status = "ON"
       return { "result", "test" }

     else:
       return self.not_connected
   
   #-------------------------------------------------
   
   def _decode_status(self,status):
      '''
      decode device string for status, e.g. 
      
        b'\x813$a#\x1f\x00\x00\r\x00\n\x00\x0f\xa1'- OFF
        b'\x813$a#\x1f\x00\x003\x00\n\x00\x0f\xc7' - OFF blue
        b'\x813#a#\x1f\x0033\x00\n\x00\xf0\xda'    - ON
        b'\x813#a#\x1f\x00\x003\x00\n\x00\xf0\xa7' - ON blue
        b'\x813#a#\x1f\x00\x00\xff\x00\n\x00\xf0s' - ON blue
        b'\x813#a#\x1f3\x00\x00\x00\n\x00\xf0\xa7' - ON red 100%
        b'\x813#a#\x1f\n\x00\x00\x00\n\x00\xf0~'   - ON red 20%
        
        -> App is able to decode ??
      '''
      
      return "not implemented yet"
   
   #-------------------------------------------------
      
   def get_info(self, param):
      '''
      return data
      ''' 

      if self.status == "Connected":      
        brightness = str(self.brightness*100)+"%"
        color_rgb  = "("+str(self.last_r)+","+str(self.last_g)+","+str(self.last_b)+")"
        power      = self.power_status
        raw_status = str(self.api.get_status())

        if param == "brightness":   return { "result": brightness }
        elif param == "color_rgb":  return { "result": color_rgb }
        elif param == "power":      return { "result": power }
        elif param == "raw_status": return { "result": raw_status }
        else:                       return { "error" : "unknown tag '"+param+"'" }

      else:
        return self.not_connected
       
   #-------------------------------------------------
   
   def test(self):
   
     if self.status == "Connected":
       logging.info("MAGIC-HOME: ..... TEST TEST TEST TEST TEST TEST TEST TEST")
       logging.info(str(self.api.get_status()))

       self.api.turn_on()
       time.sleep(0.3)
       self.api.update_device(0, 0, 255, 0, 0)
       time.sleep(0.3)
       self.api.update_device(0, 255, 0, 0, 0)
       time.sleep(0.3)
       self.api.update_device(255, 0, 0, 0, 0)
       time.sleep(0.3)
       self.api.update_device(0, 0, 0, 0, 0)
      
       self.api.turn_off()
       time.sleep(0.3)

       r=255
       g=0
       b=255
       h=[0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0]
       for var_h in h:
         r1=round(r*var_h)
         g1=round(g*var_h)
         b1=round(b*var_h)
         self.api.update_device(r1, g1, b1, 0, 0)
         time.sleep(0.3)
      
       #self.device.send_preset_function(37, 100)
       self.api.turn_off()
      
       return { "result", "test" }        

     else:
       return self.not_connected


#-------------------------------------------------
# EOF

