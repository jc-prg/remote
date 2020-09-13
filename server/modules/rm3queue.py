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
       self.exec_times     = {}
       self.avarage_exec   = {}

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
       
          interface,device,button,state,request_time = command
          
          logging.debug("Queue: Execute "+self.name+" - "+str(interface)+":"+str(device)+":"+str(button)+":"+str(state)+":"+str(request_time))
          logging.debug(str(command))
          
          if self.query_send == "send":   
             try:
                result = self.device_apis.send(interface,device,button,state)
                self.execution_time(device,request_time,time.time())
                
                # -> if query and state ist set, create command
                # -> if record and state is set, record new value
                
             except Exception as e:
                result = "ERROR queue query_list: " + str(e)

          elif self.query_send == "query":
             for value in button:
                try:    
                   result = self.device_apis.query(interface,device,value)
                   #self.execution_time(device,request_time,time.time())
                   
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
       else:
       
         for command in commands:
           if "," in str(command):
             command.append(time.time())   # add element to array
           self.queue.append(command)      # add command array to queue
           
         #self.queue.extend(commands)    # extend list with additional list
       
       return "OK: Added command(s) to the queue '"+self.name+"': "+str(commands)
   
    #------------------       

    def stop(self):
       '''stop thread'''
       
       self.stopProcess = True              

    #------------------       
    
    def execution_time(self,device,start_time,end_time):
        '''
        calculate the avarage execution time per device (duration between request time and time when executed)
        '''
    
        duration = end_time - start_time

        logging.warning("Avarage Execution Time: "+device+" ("+str(duration)+")" )

        if device in self.exec_times:       
           self.exec_times[device].append(duration)
           #if len(self.exec_times[device]) > 10: old = self.exec_times[device].pop(0)

        else:
           self.exec_times[device] = []
           self.exec_times[device].append(duration)
           
        logging.warning("Avarage Execution Time: TEST ..................................." )

        i     = 0
        total = 0
        for d in self.exec_times[device]: 
          total += d
          i     += 1

        self.avarage_exec[device] = total / i
        
        logging.warning("Avarage Execution Time: " + device + " / " + str(self.avarage_exec[device]) )
        
#-------------------------------------------------
# EOF
