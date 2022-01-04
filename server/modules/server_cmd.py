# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import configparser
import sys, getopt
import time, binascii
import netaddr, codecs
import logging
import json

from os import path
from Crypto.Cipher import AES

#---------------------------
# import jc://remote/ modules
#---------------------------

import interfaces
import modules

from modules.server_fnct import *

#---------------------------
# init vars ... check all, if still required after redesign
#---------------------------

Status                 = "Starting"

#---------------------------

if modules.test: Stage = "Test Stage"
else:            Stage = "Prod Stage"

#-------------------------------------------------
# Start and end of API answer
#-------------------------------------------------
     
def remoteAPI_start(setting=[]):
    '''
    create data structure for API response and read relevant data from config files
    '''

    global Status, LastAPICall
    
    # set time for last action -> re-read API information only if clients connected
    configFiles.cache_lastaction           = time.time() 

    if not "status-only" in setting:
       data                                = configFiles.api_init
       data["DATA"]                        = RmReadData()

       data["CONFIG"]                      = {}  
       data["CONFIG"]["button_images"]     = configFiles.read(modules.icons_dir + "/index")
       data["CONFIG"]["button_colors"]     = configFiles.read(modules.buttons  + "button_colors")
       data["CONFIG"]["scene_images"]      = configFiles.read(modules.scene_img_dir + "/index")
    
       data["CONFIG"]["interfaces"]        = deviceAPIs.available
       data["CONFIG"]["methods"]           = deviceAPIs.methods
    
       for device in data["DATA"]["devices"]:
         data["CONFIG"]["main-audio"] = "NONE"
         if "main-audio" in data["DATA"]["devices"][device]["settings"] and data["DATA"]["devices"][device]["settings"]["main-audio"] == "yes":
           data["CONFIG"]["main-audio"] = device
           break
    else:
       data                                = configFiles.api_init
       if "DATA" in data: del data["DATA"]
       
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()
    data["REQUEST"]["Button"]              = queueSend.last_button 

    data["STATUS"]                         = {}
    data["STATUS"]["devices"]              = RmReadData_deviceStatus()
    data["STATUS"]["scenes"]               = RmReadData_sceneStatus()
    data["STATUS"]["interfaces"]           = deviceAPIs.status()
    data["STATUS"]["system"]               = {} #  to be filled in remoteAPI_end()
    data["STATUS"]["request_time"]         = queueSend.avarage_exec
      
    return data
    

#-------------------------------------------------

def remoteAPI_end(data,setting=[]):
    '''
    add system status and timing data to API response
    '''

    global Status

    data["REQUEST"]["load-time"] = time.time() - data["REQUEST"]["start-time"]
    data["STATUS"]["system"]     = {
        "message"               :  Status,
        "server_start"          :  modules.start_time,
        "server_start_duration" :  modules.start_duration,
        "server_running"        :  time.time() - modules.start_time
        }
        
    #--------------------------------

    if "CONFIG" in data:
       data["CONFIG"]["reload_status"]       = queueQuery.reload
       data["CONFIG"]["reload_config"]       = configFiles.cache_update

    #--------------------------------
    
    if "no-data" in setting   and "DATA" in data:   del data["DATA"]
    if "no-config" in setting and "CONFIG" in data: del data["CONFIG"]
  
    if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])
    return data


#-------------------------------------------------

def RemoteToggle(current_value,complete_list):
        '''
        get net value from list
        '''
        
        logging.warn("Toggle: "+current_value+": "+str(complete_list))
        
        count = 0
        match = -1
        for element in complete_list:
           if current_value != element: count += 1
           else:                        match = count
        
        match += 1
        
        if match > -1 and match < len(complete_list): value = complete_list[match]
        elif match == len(complete_list):             value = complete_list[0]
        else:                                         value = "ERROR: value not found"

        logging.warn("Toggle: "+current_value+": "+value)
        return value
                                 

#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteReload():
        '''
        reload interfaces and reload config data in cache
        '''

        logging.warning("Request cache reload and device reconnect.")
        

        data                          = remoteAPI_start()
        data["REQUEST"]["Return"]     = "OK: Configuration reloaded"
        data["REQUEST"]["Command"]    = "Reload"
        
        deviceAPIs.reconnect()
        devicesGetStatus(data,readAPI=True)
        refreshCache()
        
        data                          = remoteAPI_end(data,["no-data"])
        return data

#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteCheckUpdate(APPversion):
        '''
        Check if app is supported by this server version
        '''

        refreshCache()
        d    = {}
        data = remoteAPI_start()

        if (APPversion == modules.APPversion):
            d["ReturnCode"]   = "800"
            d["ReturnMsg"]    = "OK: "  + modules.ErrorMsg("800")
        elif (APPversion in modules.APPsupport):
            d["ReturnCode"]   = "801"
            d["ReturnMsg"]    = "WARN: "+ modules.ErrorMsg("801")
        else:
            d["ReturnCode"]   = "802"
            d["ReturnMsg"]    = "WARN: "+ modules.ErrorMsg("802")


        data["REQUEST"]["Return"]     = d["ReturnMsg"]
        data["REQUEST"]["ReturnCode"] = d["ReturnCode"]
        data["REQUEST"]["Command"]    = "CheckUpdate"
        
        data                          = remoteAPI_end(data,["no-data","no-config"])
        return data

#-------------------------------------------------
# List all defined commands / buttons
#-------------------------------------------------

def RemoteList():
        '''
        Load and list all data
        '''

        data                       = remoteAPI_start()
        data["REQUEST"]["Return"]  = "OK: Returned list and status data."
        data["REQUEST"]["Command"] = "List"
        data                       = remoteAPI_end(data)        
        return data


#-------------------------------------------------
# List all defined commands / buttons
#-------------------------------------------------

def RemoteStatus():
        '''
        Load and list all data
        '''

        data                       = remoteAPI_start(["status-only"])
        data["REQUEST"]["Return"]  = "OK: Returned status data."
        data["REQUEST"]["Command"] = "Status"
        data                       = remoteAPI_end(data,["no-config"])        
        return data


#-------------------------------------------------
# main functions for API
#-------------------------------------------------

def Remote(device,button):
        '''
        send command and return JSON msg
        '''
        
        data                       = remoteAPI_start()
        interface                  = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]
        
        data["REQUEST"]["Device"]  = device
        data["REQUEST"]["Button"]  = button
        data["REQUEST"]["Return"]  = queueSend.add2queue([[interface,device,button,""]])
        data["REQUEST"]["Command"] = "Remote"
        
        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"]       = getStatus(device,"power")    # to be removed
        data["ReturnMsg"]          = data["REQUEST"]["Return"]    # to be removed

        data                       = remoteAPI_end(data,["no-data"])      
        return data


#-------------------------------------------------


def RemoteSendText(device,button,text):
        '''
        send command and return JSON msg
        '''
        
        data                       = remoteAPI_start()
        data["REQUEST"]["Device"]  = device
        data["REQUEST"]["Button"]  = button
        data["REQUEST"]["Command"] = "RemoteSendText"

        if device in configFiles.cache["_api"]["devices"]:
           interface                  = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]
           data["REQUEST"]["Return"]  = queueSend.add2queue([[interface,device,button,text]])
           
        else:
           data["REQUEST"]["Return"]  = "ERROR: Device '"+device+"' not defined."
        
        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"]       = getStatus(device,"power")    # to be removed
        data["ReturnMsg"]          = data["REQUEST"]["Return"]    # to be removed

        data                       = remoteAPI_end(data,["no-data"])      
        return data


#-------------------------------------------------

def RemoteSet(device,command,value):
        '''
        send command incl. value and return JSON msg
        '''
        
        data                      = remoteAPI_start()
        interface                 = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]
        method                    = deviceAPIs.method(device)
        
        data["REQUEST"]["Device"]  = device
        data["REQUEST"]["Button"]  = command
        data["REQUEST"]["Command"] = "Set"
        
        if method == "query":
          #data["REQUEST"]["Return"] = deviceAPIs.send(interface,device,command,value)
          data["REQUEST"]["Return"] = queueSend.add2queue([[interface,device,command,value]])
          devicesGetStatus(data,readAPI=True)
          
        elif method == "record":
          data["REQUEST"]["Return"] = setStatus(device,command,value)
          devicesGetStatus(data,readAPI=True)
        
        refreshCache()
        data                      = remoteAPI_end(data,["no-data"])
        return data


#-------------------------------------------------

def RemoteMakro(makro):
        '''
        send makro (list of commands)
        '''

        data                       = remoteAPI_start()
        data["REQUEST"]["Button"]  = makro
        data["REQUEST"]["Return"]  = "ERROR: Started but not finished..." #deviceAPIs.send(interface,device,button)
        data["REQUEST"]["Command"] = "Makro"
        
        commands_1st              = makro.split("::")
        commands_2nd              = []
        commands_3rd              = []
        commands_4th              = []
        
#### --> check, if makro is defined ... (or work with try: / except:)
#### --> check, why order isn't correct in some cases (dev-on / dev-off)
        
        logging.warning("Decoded makro-string 1st: "+str(commands_1st))

        # decode makros: scene-on/off
        for command in commands_1st:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "scene-on_" in command:     commands_2nd.extend(data["DATA"]["makros"]["scene-on"][button])
            elif "scene-off_" in command:  commands_2nd.extend(data["DATA"]["makros"]["scene-off"][button])
            else:                          commands_2nd.extend([command])
          else:                            commands_2nd.extend([command])
          
        logging.warning("Decoded makro-string 2nd: "+str(commands_2nd))

        # decode makros: dev-on/off
        for command in commands_2nd:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "dev-on_" in command:     commands_3rd.extend(data["DATA"]["makros"]["dev-on"][button])
            elif "dev-off_" in command:  commands_3rd.extend(data["DATA"]["makros"]["dev-off"][button])
            else:                        commands_3rd.extend([command])
          else:                          commands_3rd.extend([command])
          
        logging.warning("Decoded makro-string 3rd: "+str(commands_3rd))

        # decode makros: makro
        for command in commands_3rd:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "makro_" in command:      commands_4th.extend(data["DATA"]["makros"]["makro"][button])
            else:                        commands_4th.extend([command])
          else:                          commands_4th.extend([command])
          
        logging.warning("Decoded makro-string 4th: "+str(commands_4th))
                  
        # execute buttons
        for command in commands_4th:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:
          
            status                      = ""
            power_buttons               = ["on","on-off","off"]
            device,button_status        = command.split("_",1)                                        # split device and button
            
            if device not in data["DATA"]["devices"]:
               error_msg                   = ";ERROR: Device defined in makro not found ("+device+")"
               data["REQUEST"]["Return"]  += error_msg
               logging.error(error_msg)
               continue
            
            interface                   = data["DATA"]["devices"][device]["config"]["interface_api"]  # get interface / API
            method                      = data["DATA"]["devices"][device]["interface"]["method"]

            # check if future state defined
            if "||" in button_status:   button,status = button_status.split("||",1)                   # split button and future state           
            else:                       button        = button_status

            if button in power_buttons: status_var    = "power"
            else:                       status_var    = button

            if method != "query":
              if button == "on":          status        = "ON"
              elif button == "off":       status        = "OFF"
            else:
              status = ""

            # if future state not already in place add command to queue              
            logging.debug(" ...i:"+interface+" ...d:"+device+" ...b:"+button+" ...s:"+status)

            if device in data["DATA"]["devices"] and status_var in data["DATA"]["devices"][device]["status"]:
              logging.debug(" ...y:"+status_var+"="+str(data["DATA"]["devices"][device]["status"][status_var])+" -> "+status)
              
              if data["DATA"]["devices"][device]["status"][status_var] != status:
              
                  data["REQUEST"]["Return"]  += ";" + queueSend.add2queue([[interface,device,button,status]])
            
            # if no future state is defined just add command to queue
            elif status == "":
                data["REQUEST"]["Return"]  += ";" + queueSend.add2queue([[interface,device,button,""]])
                
          # if command is numeric, add to queue directly (time to wait)
          elif command_str.isnumeric():
            data["REQUEST"]["Return"]  += ";" + queueSend.add2queue([float(command)])

        refreshCache()
        data["DATA"]              = {}
        data                      = remoteAPI_end(data,["no-config"])        
        return data

#-------------------------------------------------

def RemoteMakroChange(makros):
        '''
        Change Makros and save to _ACTIVE-MAKROS.json
        '''
        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = editMakros(makros)
        data["REQUEST"]["Command"]   = "ChangeMakros"
        data                         = remoteAPI_end(data)

        return data

#-------------------------------------------------

def RemoteOnOff(device,button):
        '''
        check old status and document new status
        '''

        status          = ""
        types           = {}
        presets         = {}
        
        data            = remoteAPI_start()
        interface       = data["DATA"]["devices"][device]["config"]["interface_api"]
        method          = deviceAPIs.method(device)
        api_dev         = interface+"_"+data["DATA"]["devices"][device]["config"]["interface_dev"]
        dont_send       = False

        logging.info("__BUTTON: " +device+"/"+button+" ("+interface+"/"+method+")")

        # if recorded values, check against status quo
        if method == "record":
                  
          # Get method and presets
          if "commands" in data["DATA"]["devices"][device]["interface"]:  types   = data["DATA"]["devices"][device]["interface"]["commands"]
          if "values"   in data["DATA"]["devices"][device]["interface"]:  presets = data["DATA"]["devices"][device]["interface"]["values"]        

          # special with power buttons
          if button == "on-off" or button == "on" or button == "off":  value = "power"
          elif button[-1:] == "-" or button[-1:] == "+":               value = button[:-1]
          else:                                                        value = button
          
          # get status
          current_status = getStatus(device,value)
          device_status  = getStatus(device,"power")
          
          # buttons power / ON / OFF
          if value == "power":
            if button == "on":            status = "ON" 
            if button == "off":           status = "OFF" 
            if button == "on-off":        status = RemoteToggle( current_status, ["ON","OFF"] )
            
          # other buttons with defined values
          elif value in types and value in presets:
          
            if device_status == "ON":
            
              if types[value]["type"] == "enum":    status = RemoteToggle( current_status, presets[value] )
              if types[value]["type"] == "integer":
                 minimum   = presets[value]["min"]
                 maximum   = presets[value]["max"]
                 direction = button[-1:]
               
                 if   direction == "+" and current_status < maximum: status = current_status + 1
                 elif direction == "+":                              dont_send = True
                 elif direction == "-" and current_status > minimum: status = current_status - 1
                 elif direction == "-":                              dont_send = True
                 
            else:
               logging.debug("RemoteOnOff - Device is off: "+device)
               dont_send = True
               
          else:
            logging.warn("RemoteOnOff - Command not defined: "+device+"_"+value)
            logging.debug("types = " + str(types) + " / presets = " + str(presets))
                                     
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Command"]   = "OnOff"
        
        if dont_send: data["REQUEST"]["Return"] = "Dont send "+device+"/"+button+" as values not valid ("+str(current_status)+")."
        else:         data["REQUEST"]["Return"] = queueSend.add2queue([[api_dev,device,button,status]])
        
        refreshCache()
        data["DATA"]                 = {}
        data                         = remoteAPI_end(data)        

        return data


#-------------------------------------------------
# Set status data
#-------------------------------------------------

def RemoteReset():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = resetStatus()
        data["REQUEST"]["Command"]   = "Reset"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])
        return data


#-------------------------------------------------

def RemoteResetAudio():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = resetAudio()
        data["REQUEST"]["Command"]   = "ResetAudio"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data


#-------------------------------------------------

def RemoteChangeMainAudio(device):
        '''
        set device as main audio device (and reset other)
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = setMainAudioDevice(device)
        data["REQUEST"]["Command"]   = "ChangeMainAudio"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data","no-config"])        
        return data


#-------------------------------------------------
# Edit Buttons & Commands
#-------------------------------------------------

def RemoteMove(type,device,direction):
        '''
        Move position of device in start menu and drop down menu
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = moveDeviceScene(type,device,direction)
        data["REQUEST"]["Command"]   = "RemoteMove"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data","no-config"])
        return data


#-------------------------------------------------

def RemoteAddButton(device,button):
        '''
        Learn Button and safe to init-file
        '''

        data                         = remoteAPI_start()

        data["REQUEST"]["Return"]    = addButton(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Command"]   = "AddButton"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])
        return data

#-------------------------------------------------

def RemoteRecordCommand(device,button):
        '''
        Learn Button and safe to init-file
        '''

        data                         = remoteAPI_start()
        interface                    = data["DATA"]["devices"][device]["config"]["interface_api"]
        data["DATA"]                 = {}
        
        EncodedCommand               = deviceAPIs.record(interface,device,button)

        if not "ERROR" in str(EncodedCommand):
           data["REQUEST"]["Return"]    = addCommand2Button(device,button,EncodedCommand)       
        else:
           data["REQUEST"]["Return"]    = str(EncodedCommand)
        
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Command"]   = "RecordCommand"

        refreshCache()
        data                         = remoteAPI_end(data)
        return data


#-------------------------------------------------

def RemoteDeleteCommand(device,button):
        '''
        Delete button from layout file
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = deleteCmd(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button
        data["REQUEST"]["Command"]   = "DeleteCommand"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data

#-------------------------------------------------

def RemoteDeleteButton(device,button_number):
        '''
        Delete button from layout file
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = deleteButton(device,button_number)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button_number
        data["REQUEST"]["Command"]   = "DeleteButton"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data

#-------------------------------------------------
# Change Remotes 
#-------------------------------------------------

def RemoteChangeVisibility(type,device,value):
        '''
        change visibility of device in config file
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = changeVisibility(type,device,value)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = value
        data["REQUEST"]["Command"]   = "ChangeVisibility"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data","no-config"])        
        return data

        

#-------------------------------------------------
# Edit device remotes
#-------------------------------------------------

def RemoteAddDevice(device,device_data):
        '''
        add device in config file and create config files for remote and command
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = addDevice(device,device_data)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = device_data
        data["REQUEST"]["Command"]   = "AddDevice"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data


#-------------------------------------------------

def RemoteEditDevice(device,info):
        '''
        Edit data of device
        '''
        logging.info(str(info))
        
        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = editDevice(device,info)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Command"]   = "EditDevice"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data
        
#-------------------------------------------------

def RemoteDeleteDevice(device):
        '''
        delete device from config file and delete device related files
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = deleteDevice(device)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Command"]   = "DeleteDevice"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])
        return data


#-------------------------------------------------
# Edit scene remotes
#-------------------------------------------------

def RemoteAddScene(scene,info):
        '''
        add device in config file and create config files for remote and command
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = addScene(scene,info)
        data["REQUEST"]["Scene"]     = scene
        data["REQUEST"]["Parameter"] = info
        data["REQUEST"]["Command"]   = "AddDevice"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        

        
        return data


#-------------------------------------------------

def RemoteEditScene(scene,info):
        '''
        Edit data of device
        '''
        logging.info(str(info))
        
        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = editScene(scene,info)
        data["REQUEST"]["Scene"]     = scene
        data["REQUEST"]["Command"]   = "EditScene"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])
        return data
        
#-------------------------------------------------

def RemoteDeleteScene(scene):
        '''
        delete device from config file and delete device related files
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = deleteScene(scene)
        data["REQUEST"]["Scene"]     = scene
        data["REQUEST"]["Command"]   = "DeleteScene"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])
        return data


#-------------------------------------------------
# Templates
#-------------------------------------------------

def RemoteAddTemplate(device,template):
        '''
        add / overwrite remote template
        '''

        data                         = remoteAPI_start()
        data["REQUEST"]["Return"]    = addTemplate(device,template)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = template
        data["REQUEST"]["Command"]   = "AddTemplate"

        refreshCache()
        data                         = remoteAPI_end(data,["no-data"])        
        return data

#-------------------------------------------------
# Test command
#-------------------------------------------------

def RemoteTest():
        '''
        Test new functions
        '''

        data                       = remoteAPI_start()
        data["TEST"]               = RmReadData("")
        data["REQUEST"]["Return"]  = "OK: Test - show complete data structure"
        data["REQUEST"]["Command"] = "Test"
        data                       = remoteAPI_end(data,["no-data"])                
        deviceAPIs.test()
        
        return data


#-------------------------------------------------
# EOF

