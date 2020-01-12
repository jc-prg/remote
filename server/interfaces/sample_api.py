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

class sampleAPI():
   '''
   Integration of sample API to be use by jc://remote/
   '''

   def __init__(self,api_name):
       '''Initialize API / check connect to device'''
       
       self.api_name        = api_name       
       self.api_description = "Sample API Description"
       self.working         = False
       
       logging.info("... "+self.api_name+" - " + self.api_description)
       
       self.connect()
            
   #-------------------------------------------------
   
   def connect(self):
       '''Connect / check connection'''
       
       # commands to connect and to check, if connection works - if not, return error message

       self.status = "Connected"
       
       
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


       self.working = False
       return
       
       
   #-------------------------------------------------
   
   def query(self,device,command):
       '''Send command to API and wait for answer'''

       self.wait_if_working()
       self.working = True


       self.working = False
       return
       
       
   #-------------------------------------------------
   
   def record(self,device,command):
       '''Record command, especially build for IR devices'''

       self.wait_if_working()
       self.working = True


       self.working = False
       return

       
   #-------------------------------------------------
   
   def test(self):
       '''Test device by sending a couple of commands'''

       self.wait_if_working()
       self.working = True


       self.working = False
       return

#-------------------------------------------------
# EOF

