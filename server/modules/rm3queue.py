#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import threading

import modules
import modules.rm3config     as rm3config
import modules.rm3json       as rm3json

#-------------------------------------------------
# send commands
#-------------------------------------------------

class sendCmd (threading.Thread):
    '''
    class to create a queue to send commands (or a chain of commands) to the devices
    '''
    
    def __init__(self, name, device_apis,callback_send,callback_query):
       '''create queue, set name'''
    
       threading.Thread.__init__(self)
       self.queue_send     = []
       self.queue_query    = []
       self.name           = name
       self.stopProcess    = False
       self.wait           = 0.1
       self.device_apis    = device_apis
       self.last_button    = "<none>"
       self.callback_send  = callback_send
       self.callback_query = callback_query

    #------------------       
       
    def run(self):
       '''loop running in the background'''
       
       logging.info( "Starting " + self.name )
       while not self.stopProcess:
       
           logging.debug(".")
           
           if len(self.queue_send) > 0:
             command = self.queue_send.pop(0)
             self.execute(command)
             #logging.info("."+command[1]+command[2])
             
           else:
             time.sleep(self.wait)

           if len(self.queue_query) > 0:
             command = self.queue_query.pop(0)
             self.query_list(command)
             
             
       logging.info( "Exiting " + self.name )


    #------------------       
    
    def query_list(self,command):
       '''read information from APIs'''
       
       logging.info("Query "+self.name+" - "+str(command))
       
       error                    = False
       interface,device,queries = command
       query_list               = queries.split("||")

       logging.debug("Query "+self.name+" - "+interface+":"+device+":"+str(query_list))
       devices = self.configFiles.read(modules.devices + modules.active)
    
       for value in query_list:
         if value != "" and error == False:
           try:    
             result = self.callback_query(device,value)
           except Exception as e:
             result = "ERROR queue query_list: " + str(e)
         
         if not "ERROR" in str(result):  
           devices[device]["status"][value]      = str(result)

         else:
           devices[device]["status"][value]      = "Error"
           error                                 = True
           logging.error(value+":"+str(result))

       self.configFiles.write(modules.devices + modules.active, devices)
    
    
    #------------------       
    
    def execute(self,command):
       '''execute command or wait -> command = number or command = [interface,device,button]'''
       
       command_str = str(command)
       if "," in str(command):
          interface,device,button,state = command
          logging.debug("Queue: Execute "+self.name+" - "+interface+":"+device+":"+button)
          
          try:
            result = self.device_apis.send(interface,device,button)
          except Exception as e:
             result = "ERROR queue query_list: " + str(e)
             
          if not "ERROR" in str(result) and state != "":
            self.callback_send(device,button,state) 
            self.last_button = device + "_" + button
          
       else:
          time.sleep(float(command))
        
    
    #------------------       

    def add2queue(self,commands):
       '''add single command or list of commands to queue'''
       
       logging.debug("Add to queue "+self.name+": "+str(commands))
       self.queue_send.extend(commands)
       return "OK: Added command(s) to the queue:"+str(commands)
   

    #------------------       

    def add2queryQueue(self,commands):
       '''add single command or list of commands to queue'''
       
       logging.debug("Add to query queue "+self.name+": "+str(commands))
       self.queue_query.extend(commands)
       return "OK: Added command(s) to the query queue:"+str(commands)

    #------------------       

    def stop(self):
       '''stop thread'''
       
       self.stopProcess = True              


#-------------------------------------------------
# EOF
