#-----------------------------------
# Sample API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config
import modules.rm3ping                 as rm3ping

import interfaces.eiscp as eiscp

#-------------------------------------------------
# API-class
#-------------------------------------------------

shorten_info_to = rm3config.shorten_info_to

#-------------------------------------------------

class eiscpAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",ip_address=""):
       '''
       Initialize API / check connect to device
       '''
       
       self.api_name        = api_name       
       self.api_description = "API for ONKYO Devices"
       self.api_device      = device
       self.api_config      = rm3json.read("interfaces/eiscp/"+self.api_name,data_dir=False)
       self.api_ip          = self.api_config["IPAddress"]
       self.api_timeout     = 5
       self.method          = "query"
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       
       logging.info("... "+self.api_name+" - " + self.api_description + " (" + self.api_config["IPAddress"] +")")
       
       self.connect()
            
   #-------------------------------------------------

   def reconnect(self):
       self.api.command_socket = None
       self.connect()
   
   #-------------------------------------------------

   def connect(self):
       '''Connect / check connection'''
       
       # Create a receiver object, connecting to the host
       
       self.count_error          = 0
       self.count_success        = 0

       connect = rm3ping.ping(self.api_config["IPAddress"])
       if connect == False:
         self.status = "ONKYO Device not available (ping to "+self.api_config["IPAddress"]+" failed)"
         logging.error(self.status)       
         return self.status

       try:
          print("(Re)Connect eISCP ONKYO "+self.api_ip)
          self.api    = eiscp.eISCP(self.api_ip)
          #self.api    = eiscp.Receiver(self.api_ip)
          #self.api.on_message = callback_method
          self.status               = "Connected"
       except Exception as e:
          self.status = "Error connecting to ONKYO device: " + str(e)
          logging.warning(self.status)

       try:
          self.api.command("system-power query") # send a command to check if connected
          self.status               = "Connected"
          self.api.jc               = onkyoAPIaddOn(self.api)
          self.api.jc.status        = "Connected"
       except Exception as e:
          self.status    = "Error connecting to ONKYO device: " + str(e)
          self.api.jc.status = self.status
          logging.warning(self.status)
   
   
   #-------------------------------------------------
   
   def wait_if_working(self):
       '''Some devices run into problems, if send several requests at the same time'''
       
       while self.working:
         logging.debug(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------
   
   def send(self,device,command):
       '''Send command to API'''

       self.wait_if_working()
       self.working = True

       if self.status == "Connected":
         logging.debug("Button-Code: "+command[:shorten_info_to]+"...")
         button_code = command.replace("="," ")
         try:
           self.api.command(button_code)
           self.api.disconnect()
         except Exception as e:
           self.api.disconnect()
           self.working = False
           return "ERROR "+self.api_name+" - send ("+button_code+"): " + str(e)
           
       else:
         self.working = False
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return "OK"
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       self.wait_if_working()
       self.working = True
       result  = {}
       
       if "||" in command: command_param = command.split("||")
       else:               command_param = [command]      
       
       logging.debug(command)

       if self.status == "Connected":
       
         if "jc." in command:
         
           try:
             command = "self.api."+command
             result = eval(command)
             logging.debug(str(result))
           
             if "error" in result:
               self.working = False
               return "ERROR "+self.api_name+" - " + result["error"]
             
           except Exception as e:
             self.working = False
             return "ERROR "+self.api_name+" - query: " + str(e)
         
         else:
           button_code = command_param[0] #format: zone.parameter=command
           logging.debug("Button-Code: "+button_code[:shorten_info_to]+"... ("+self.api_name+")")
           try:
             result  = self.api.command(button_code)
             self.api.disconnect()
           except Exception as e:
             self.api.disconnect()
             self.working = False
             return "ERROR "+self.api_name+" - query ("+button_code+"): " + str(e)
           
           if "ERROR" in result: 
             self.working = False
             return result
           
         result = result[1]
         logging.debug(str(result))

         # if || try to extract data from the result
         if "||" in command:
           if "+'" in command_param[1]: new_cmd = "str(result)"+command_param[1]
           else:                        new_cmd = "result"+command_param[1]
           
           try:
             result2 = eval(new_cmd)
             result  = result2
             logging.debug(new_cmd+": "+str(result))
           except Exception as e:
             logging.warning("Not able to extract data: "+new_cmd+" / "+str(e))
           
       else:
         self.working = False
         return "ERROR "+self.api_name+": Not connected"

       self.working = False
       return result
       
       
   #-------------------------------------------------
   
   def record(self,device,command):
       '''Record command, especially build for IR devices'''

       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
   
   def register(self,command,pin=""):
       '''Register command if device requires registration to initialize authentification'''

       return "ERROR "+self.api_name+": Not supported by this API"

       
   #-------------------------------------------------
      
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True

       try:
         self.api.command('power on')
         self.api.command('source pc')
         self.api.disconnect()
       except Exception as e:
         return "ERROR "+self.api_name+" test: "+str(e)

       self.working = False
       return "OK"

#-------------------------------------------------
# additional functions -> define self.api.jc.*
#-------------------------------------------------

class onkyoAPIaddOn():
   '''
   additional functions that combine values
   '''

   def __init__(self,api):
   
      self.addon          = "jc://addon/onkyo/"
      self.api            = api
      self.volume         = 0
      self.cache_metadata = {}             # cache metadata to reduce api requests
      self.cache_time     = time.time()    # init cache time
      self.cache_wait     = 2              # time in seconds how much time should be between two api metadata requests
      
   #-------------------------------------------------
   
   def metadata(self,tags=""):
      '''
      Return metadata ... combined values
      '''
      
      # ERROR ... zwischen Titelwechseln (?) aktuell nur "R" als Wert zurück gegeben ... ?!
      # "no media" noch nicht implementiert
      
      md     = ""
      input_device = self.api.command("input-selector=query")[1]
      
      if tags == "net-info" and "net" in input_device:
        try:
          artist = self.api.command("dock.net-usb-artist-name-info=query")[1]
          title  = self.api.command("dock.net-usb-title-name=query")[1]
          album  = self.api.command("dock.net-usb-album-name-info=query")[1]
         
          if len(title)<2: md = "no media"
          else:           md = artist + ": " + title + " (Album: " + album + ")"
            
          self.api.disconnect()
          logging.info(md)
          
        except Exception as e:
          self.api.disconnect()
          
          error = "ERROR "+self.addon+" - metadata ("+tags+"): " + str(e) 
          logging.warning(error)
          return error
          
      elif tags == "net-info":
        md = "no media"
        
      else:
        md  = "not implemented"
        return [ "error", md ]
        
      return [ tags, md ]


#-------------------------------------------------
# EOF

