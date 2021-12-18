#-----------------------------------
# API integration for jc://remote/ MAGIC HOME
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config
import modules.rm3ping                 as rm3ping

import interfaces.magichome.magichome  as device

#-------------------------------------------------
# API-class
#-------------------------------------------------

shorten_info_to = rm3config.shorten_info_to

#-------------------------------------------------

class APIcontrol():
   '''
   Integration of Magic Home API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",device_config={},log_command=False):
       '''
       Initialize API / check connect to device
       '''
       
       self.api_name        = api_name       
       self.api_description = "Magic Home (implementation in progress)"
       self.not_connected   = "ERROR: Device not connected ("+api_name+"/"+device+")."
       self.status          = "Start"
       self.method          = "query"
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       self.log_command     = log_command
       
       self.api_config      = device_config
       self.api_device      = device

       logging.info("_API-INIT: "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''
       Connect / check connection
       '''
       
       # commands to connect and to check, if connection works - if not, return error message

       connect = rm3ping.ping(self.api_config["IPAddress"])
       if not connect:
         self.status = self.not_connected + " ... PING"
         logging.error(self.status)       
         return self.status

       self.status               = "Connected"
       self.count_error          = 0
       self.count_success        = 0

       api_ip                    = self.api_config["IPAddress"]
       api_device_type           = self.api_config["DeviceType"]
       
       try:
           self.api = device.MagicHomeApi(api_ip, api_device_type)
           self.api.get_status()
           
           self.api.jc               = APIaddOn(self.api)
           self.api.jc.status        = self.status
           self.api.jc.not_connected = self.not_connected
          
       except Exception as e:
           self.status = self.not_connected + " ... CONNECT " + str(e)
           return self.status

       return self.status


   #-------------------------------------------------
   
   def wait_if_working(self):
       '''
       Some devices run into problems, if send several requests at the same time
       '''
       
       while self.working:
         logging.info(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------
   
   def send(self,device,command):
       '''
       Send command to API
       '''
       
       result  = {}
       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
         if self.log_command: logging.info("_SEND: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

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
       '''
       Send command to API and wait for answer
       '''

       result  = {}
       self.wait_if_working()
       self.working = True

       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]

       if self.status == "Connected":
         if self.log_command: logging.info("_QUERY: "+device+"/"+command[:shorten_info_to]+" ... ("+self.api_name+")")

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

class APIaddOn():
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
      self.last_preset    = 37
      self.power_status   = "OFF"
      self.mode           = "COLOR"
      
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
       self.mode   = "COLOR"
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
     if self.status == "Connected":
       self.mode        = "PRESET"
       self.last_preset = preset
       self.api.send_preset_function(self.last_preset, self.last_speed)
       self.power_status = "ON"
       return { "result", "preset" }
       
     else:
       return self.not_connected

   #-------------------------------------------------
    
   def set_speed(self, speed=100):
     '''
     set speed for preset
     '''
     
     if self.status == "Connected":
       self.last_speed = int(speed)
       if self.mode == "PRESET":
         self.api.send_preset_function(self.last_preset, self.last_speed)

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
       if self.mode == "COLOR":
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
   
   def decode_status(self,raw_status):
      '''
      decode device string for status, e.g. 
      
        b'\x813$a#\x1f\x00\x00\r\x00\n\x00\x0f\xa1'- OFF
        b'\x813$a#\x1f\x00\x003\x00\n\x00\x0f\xc7' - OFF blue
        b'\x813#a#\x1f\x0033\x00\n\x00\xf0\xda'    - ON
        b'\x813#a#\x1f\x00\x003\x00\n\x00\xf0\xa7' - ON blue
        b'\x813#a#\x1f\x00\x00\xff\x00\n\x00\xf0s' - ON blue
        b'\x813#a#\x1f3\x00\x00\x00\n\x00\xf0\xa7' - ON red 100%
        b'\x813#a#\x1f\n\x00\x00\x00\n\x00\xf0~'   - ON red 20%
        b'\x813#, #\x1f\x9c\x9c\x9c\x00\n\x00\xf0\x13'
        
        -> App is able to decode ??
      '''
      status = {}
      
      if "$" in raw_status:  status["power"] = "OFF"
      else:                  status["power"] = "ON"
      if "a#" in raw_status: status["mode"]  = "COLOR"
      else:                  status["mode"]  = "PRESET"

      data = raw_status.split("#")

      if status["power"] == "ON":  parts = data[2].split("\\")
      else:                        parts = data[1].split("\\")
      
      if status["mode"] == "COLOR":
         status["rgb"] = "#"+parts[2][1:3]+parts[3][1:3]+parts[4][1:3]
         status["RGB"] = {"r" : int(parts[2][1:3],16), "g" : int(parts[3][1:3],16), "b" : int(parts[4][1:3],16)} #, "x" : int(parts[5][1:3],16) }
         status["set"] = "." # {"a" : int(parts[7][1:3],16), "b" : int(parts[8][1:3],16), "c" : int(parts[9][1:3],16) }
      else:
         status["rgb"] = "#"+parts[2][1:3]+parts[3][1:3]+parts[4][1:3]
         status["RGB"] = {"r" : int(parts[2][1:3],16), "g" : int(parts[3][1:3],16), "b" : int(parts[4][1:3],16)} #, "x" : int(parts[5][1:3],16) }
         status["set"] = "." #{"a" : int(parts[7][1:3],16), "b" : int(parts[8][1:3],16) }
      
      
      return status
   
   
   #-------------------------------------------------
      
   def get_info(self, param):
      '''
      return data
      ''' 

      if self.status == "Connected":      

        raw_status = self.api.get_status()
        raw_status = str(raw_status)
        
        brightness = str(round(self.brightness*100))+"%"
        color_rgb  = "("+str(self.last_r)+","+str(self.last_g)+","+str(self.last_b)+")"
        status     = self.decode_status(raw_status)
        status_str = str(status)
        
        if param == "brightness":      return { "result": brightness }
        elif param == "color_rgb":     return { "result": color_rgb }
        elif param == "color_rgb_raw": return { "result": status["rgb"] }
        elif param == "power":         return { "result": status["power"] }
        elif param == "mode":          return { "result": status["mode"] }
        elif param == "preset":        return { "result": self.last_preset }
        elif param == "preset_speed":  return { "result": self.last_speed }
        elif param == "raw_status":    return { "result": raw_status + "<br>" + status_str }
        else:                          return { "error" : "unknown tag '"+param+"'" }

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

