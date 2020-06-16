#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging, time
import threading

import modules
import modules.rm3config     as rm3config


#-------------------------------------------------
# QUEUE 1: send commands
#-------------------------------------------------

class queueApiCalls (threading.Thread):
    '''
    class to create a queue to send commands (or a chain of commands) to the devices
    '''
    
    def __init__(self, name, query_send, device_apis ):
       '''create queue, set name'''
    
       threading.Thread.__init__(self)
       self.queue          = []
       self.name           = name
       self.stopProcess    = False
       self.wait           = 0.1
       self.device_apis    = device_apis
       self.last_button    = "<none>"
       self.config         = ""
       self.query_send     = query_send
       self.reload         = False

    #------------------       
       
    def run(self):
       '''loop running in the background'''
       
       logging.info( "Starting " + self.name )
       count = 0
       while not self.stopProcess:
       
           logging.debug(".")
           
           if len(self.queue) > 0:
             command = self.queue.pop(0)
             self.execute(command)
             #logging.info("."+command[1]+command[2])
             
           else:
             time.sleep(self.wait)
             
             # send life sign from time to time
             if count * self.wait > 360:
                tt = time.time()
                logging.warn("Queue running "+str(tt))
                count = 0

           count += 1             
             
       logging.info( "Exiting " + self.name )
       
    #------------------       
    
    def execute(self,command):
       '''
       execute command or wait 
       SEND  -> command = number or command = [interface,device,button,state]
       QUERY -> command = number or command = [interface,device,[query1,query2,query3,...],state]
       '''
       
       # read device infos if query
       if self.config != "" and self.query_send == "query": 
          devices  = self.config.read_status()
          
       # check, if reload is requested ...
       if "END_OF_RELOAD" in str(command):
          self.reload = False

       # if is an array / not a number
       elif "," in str(command):
       
          interface,device,button,state = command
          
          logging.debug("Queue: Execute "+self.name+" - "+str(interface)+":"+str(device)+":"+str(button)+":"+str(state))
          logging.debug(str(command))
          
          if self.query_send == "send":   
             try:
                result = self.device_apis.send(interface,device,button,state)
                # -> if query and state ist set, create command
                # -> if record and state is set, record new value
                
             except Exception as e:
                result = "ERROR queue query_list: " + str(e)

          elif self.query_send == "query":
             for value in button:
                try:    
                   result = self.device_apis.query(interface,device,value)
                   logging.debug(str(device)+": "+str(result))
                   
                except Exception as e:
                   result = "ERROR queue query_list: " + str(e)             

                if not "ERROR" in str(result):  devices[device]["status"][value] = str(result)
                else:                           devices[device]["status"][value] = "Error"

                self.last_query = device + "_" + value
                pass
                
             if self.config != "" and not "ERROR" in str(result):
                self.config.write_status(devices,"execute ("+str(command)+")")
       
       # if is a number
       else:
          time.sleep(float(command))
        
    
    #------------------       

    def add2queue(self,commands):
       '''add single command or list of commands to queue'''
       
       logging.debug("Add to queue "+self.name+": "+str(commands))
       
       # set reload status
       if "START_OF_RELOAD" in str(commands): self.reload = True
       
       # or add command to queue
       else: self.queue.extend(commands)
       
       return "OK: Added command(s) to the queue '"+self.name+"': "+str(commands)
   
    #------------------       

    def stop(self):
       '''stop thread'''
       
       self.stopProcess = True              


#-------------------------------------------------
# EOF
