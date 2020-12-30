#-----------------------------------
# Sample API integration for jc://remote/
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config

#import sampleAPI as sample

#-------------------------------------------------
# API-class
#-------------------------------------------------

class testAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name,device="",ip_address=""):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "Test API Description for automatic testing"
       self.api_config      = rm3json.read("interfaces/test/"+self.api_name,data_dir=False)
       self.working         = False
       self.count_error     = 0
       self.count_success   = 0
       
       logging.info("... "+self.api_name+" - " + self.api_description)
              
       self.connect()
            

   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''

       self.status               = "Connected"
       self.count_error          = 0
       self.count_success        = 0


   #-------------------------------------------------
   
   def wait_if_working(self):
       '''Some devices run into problems, if send several requests at the same time'''

       while working:
         logging.debug(".")
         time.sleep(0.2)
       return
       
       
   #-------------------------------------------------
   
   def send(self,device,command):
       '''Send command to API'''

       print("SEND: " + device + "/" + command)
       return("OK: send test-"+device+"-"+command)
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       return "WARN: Not supported by this API"
       
       
   #-------------------------------------------------
   
   def record(self,device,command):
       '''Record command, especially build for IR devices'''

       print("RECORD: " + device + "/" + command)
       return("OK: record test-"+device+"-"+command)

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       print("TEST:" + self.api_name + "/" + self.api_description + " (no further action)")
       return("OK: test commands")

#-------------------------------------------------
# EOF

