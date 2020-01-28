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

import interfaces.interfaces as interfaces

import modules.rm3json       as rm3json
import modules.rm3stage      as rm3stage
import modules.rm3config     as rm3config
import modules.rm3cache      as rm3cache
import modules.rm3queue      as rm3queue

from os import path
from Crypto.Cipher import AES

#---------------------------
# init vars ... check all, if still required after redesign
#---------------------------

status_cache          = {}
status_cache_time     = 0
status_cache_interval = 5

rm_data               = {}  # new cache variable
rm_data_update        = True
rm_data_last          = time.time()

Status                = "Starting"
lastButton            = ""

#---------------------------

if rm3stage.test: Stage = "Test Stage"
else:             Stage = "Prod Stage"


#---------------------------
# see initialization of thread ad the end ...
#---------------------------

def refreshCache():
    '''
    Reset vars to enforce a refresh of all cached data
    '''
    
    global status_cache_time, rm_data_update
    rm_data_update         = True
    status_cache_time      = 0
    configFiles.cache_time = 0

#---------------------------
# Read data
#---------------------------


def RmReadData(selected=[]):
    '''Read all relevant data and create data structure'''

    global rm_data, rm_data_update, rm_data_last

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","queries","values"]

    # if update required
    if rm_data_update: 
    
        data["devices"] = configFiles.read(rm3config.devices + rm3config.active)
        data["scenes"]  = configFiles.read(rm3config.scenes  + rm3config.active)
        data["makros"]  = {}
    
        # read data for active devices
        for device in data["devices"]:
            if data["devices"][device]["interface"] != "":
              if selected == [] or device in selected:
	
                key        = data["devices"][device]["device"]
                interface  = data["devices"][device]["interface"]
                data_temp  = data["devices"][device]

                remote           = configFiles.read(rm3config.remotes  + interface + "/" + key) # remote layout & display
                buttons          = configFiles.read(rm3config.commands + interface + "/" + key) # button definitions, presets, queries ...
                
                # if default.json exists, add values to device specific values
                if rm3json.ifexist(rm3config.commands + interface + "/default"):   
                
                  buttons_default  = configFiles.read(rm3config.commands + interface + "/default")

                  # COMMAND/BUTTON : get button definitions, presets, queries ...
                  if not "ERROR" in buttons_default:
                    for x in btnfile:
                      if x in buttons_default["data"]:
                        for y in buttons_default["data"][x]:
                          buttons["data"][x][y] = buttons_default["data"][x][y]
                        
                #print(buttons)
                        
                if "method"  in buttons["data"]:   data_temp["method"]  = buttons["data"]["method"]              
                if "values"  in buttons["data"]:   data_temp["values"]  = buttons["data"]["values"]              
                if "queries" in buttons["data"]:
                    data_temp["queries"]         = buttons["data"]["queries"]
                    data_temp["query_list"]      = list(buttons["data"]["queries"].keys())                 
                
                data_temp["buttons"]             = buttons["data"]["buttons"]
                data_temp["button_list"]         = list(buttons["data"]["buttons"].keys())
                                
                # REMOTE : get remote layout & display # logging.info(device)
                data_temp["description"]         = remote["data"]["description"]              
                data_temp["remote"]              = remote["data"]["remote"]

                if "display" in remote["data"]:       data_temp["display"]       = remote["data"]["display"]              
                if "display-size" in remote["data"]:  data_temp["display-size"]  = remote["data"]["display-size"]              
           
                data["devices"][device] = data_temp
 
        # read data for active scenes
        for scene in data["scenes"]:
            if data["scenes"][scene]["visible"] == "yes":
              if selected == [] or scene in selected:

                thescene      = configFiles.read(rm3config.scenes_def + scene)
                keys          = ["remote","channel","devices","label"]
                
                for key in keys:
                    data["scenes"][scene][key] = thescene[scene][key]
           
        # read data for makros
        for makro in makros:        
            temp                      = configFiles.read(rm3config.makros + makro)
            data["makros"][makro]     = temp[makro]
                
        # read data for templates
        data["templates"]               = {}
        data["template_list"]           = {}
        if selected == []:
          templates                     = rm3json.available(rm3config.templates)
          for template in templates:    
            template_keys = template.split("/")
            template_key  = template_keys[len(template_keys)-1]
            template_data = configFiles.read(rm3config.templates + template)

            if "ERROR" in template_data:  data["templates"][template] = template_data
            else: 
                if template_key in template_data: data["templates"][template] = template_data[template_key]
                else:                             data["templates"][template] = { "ERROR" : "JSON file not correct, key missing: "+template_key }
                data["template_list"][template] = data["templates"][template]["description"]
        
            data["templates"][template]["file"] = template

        # update cache data
        if selected == []:
          rm_data        = data
          rm_data_update = False         

    # if no update required read from cache
    else: data           = rm_data

    # Update status data        
    data["devices"] = devicesGetStatus(data["devices"])
    rm_data         = data
    
    return data



#---------------------------
# add / delete devices & buttons to config
#---------------------------

def addDevice(device,interface,description):
    '''
    add new device to config file and create command/remote files
    '''
    
    global rm_data_update
    
    ## Check if exists    
    active_json         = configFiles.read(rm3config.devices + rm3config.active)
    
    if device in active_json:                                        return("WARN: Device " + device + " already exists (active).")
    if rm3json.ifexist(rm3config.commands +interface+"/"+device):    return("WARN: Device " + device + " already exists (devices).")
    if rm3json.ifexist(rm3config.remotes  +interface+"/"+device):    return("WARN: Device " + device + " already exists (remotes).") 
    
    logging.info(device+" add")
    
    ## add to _active.json 
    active_json[device] = {
        "device"    : description,
        "image"     : device,
        "interface" : interface,
        "label"     : description,       # to be edited later
        "main-audio": "no",
        "status"    : { "power" : "OFF" },
        "visible"   : "yes"    	
        }
    try:
      configFiles.write(rm3config.devices + rm3config.active, active_json)
    except Exception as e:
      return "ERROR: " + str(e)
        
    ## add to devices = button definitions
    buttons = {
        "info" : "jc://remote/ - In this files the commands foreach button, queries, the query method is defined.",
        "data" : {
            "description" : description,
            "method"      : "record", #-> to be changed
            "buttons"     : {},
            "queries"     : {},
            "values"      : {}
            }
        }
    try:
      configFiles.write(rm3config.commands + interface+"/"+description,buttons)
    except Exception as e:
      return "ERROR: " + str(e)

    ## add to remotes = button layout
    remote = {
        "info" : "jc://remote/ - In this files the remote layout and a display layout is defined.",
        "data" : {
           "description" : description,
           "remote"      : [],
           "display"     : {}
           }
        }    
    try:
      configFiles.write(rm3config.remotes +interface+"/"+description,remote)
    except Exception as e:
      return "ERROR: " + str(e)
            
    rm_data_update = True
    return("OK: Device " + device + " added.")



#---------------------------------------
# add vars to config JSON (buttons & devices)
#---------------------------------------

def addCommand2Button(device,button,command):
    '''
    add new command to button or change existing
    '''

    global rm_data_update

    config      = configFiles.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(rm3config.commands+interface+"/"+device_code)
    
    if "data" in data:
        if button in data["data"]["buttons"].keys():
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            data["data"]["buttons"][button] = command
            configFiles.write(rm3config.commands+interface+"/"+device_code,data)
            rm_data_update = True
            return "OK: Button '" + device + "_" + button + "' recorded and saved: " + command
    else:
        return "ERROR: Device '" + device + "' does not exists."
        
#---------------------------------------

def addButton(device,button):
    '''
    add new button to remote layout
    '''
    
    global rm_data_update

    config      = configFiles.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(rm3config.remotes+interface+"/"+device_code)
    
    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            configFiles.write(rm3config.remotes+interface+"/"+device_code,data)
            rm_data_update = True
            return "OK: Button '" + device + "_" + button + "' added."
    else:
        return "ERROR: Device '" + device + "' does not exists."        

#---------------------------------------

def deleteCmd(device, button):
    '''
    delete command (button) from json config file
    -> not yet implemented, delete from remote file also
    '''

    config      = configFiles.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(rm3config.commands+interface+"/"+device_code)
    
    if data["data"]:
        if button in data["data"]["buttons"].keys():
        
            data["data"]["buttons"].pop(button,None)
            data = configFiles.write(rm3config.commands+interface+"/"+device_code,data)
            return "OK: Button '" + device + "_" + button + "' deleted."
        else:
            return "ERROR: Button '" + device + "_" + button + "' does not exist."
    else:
        return "ERROR: Device '" + device + "' does not exist."

#---------------------------------------

def addTemplate(device,template):
    '''
    add / overwrite remote layout definition by template
    '''

    templates   = configFiles.read(rm3config.templates + template)
    config      = configFiles.read(rm3config.devices + rm3config.active)
    interface   = config[device]["interface"]
    device_code = config[device]["device"]
    data       = configFiles.read(rm3config.remotes + interface + "/" + device_code)

    # check if error
    if "data" not in data.keys():  return "ERROR: Device '" + device + "' does not exists."
        
    # add layout from template
    elif template in templates and data["data"] == []:
    
        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(rm3config.remotes + interface + "/" + device_code, data)
        return "OK: Template '" + template + "' added to '" + device + "'."
            
    # overwrite layout from template
    elif template in templates and data["data"] != []:

        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(rm3config.remotes + interface + "/" + device_code, data)
        return "OK: Remote definition of '" + device + "' overwritten by template '" + template + "'."
        
    # template doesn't exist
    else:
        return "ERROR: Template '" + template + "' does't exists."

#---------------------------------------

def changeVisibility(device,visibility):
    '''
    change visibility in device configuration (yes/no)
    '''

    global rm_data_update
    
    data = configFiles.read(rm3config.devices + rm3config.active)
    
    if device not in data.keys():
        return "Device '" + device + "' does not exists."
        
    elif visibility == "yes" or visibility == "no":
        data[device]["visible"] = visibility
        configFiles.write(rm3config.devices + rm3config.active, data)
        rm_data_update = True
        return "OK: Change visibility for '" + device + "': " + visibility
        
    else:
        return "ERROR: Visibility value '" + visibility + "' does not exists."


#---------------------------------------

def deleteDevice(device):
    '''
    delete device from json config file and delete device related files
    '''
    
    global rm_data_update

    devices              = {}
    active_json          = configFiles.read(rm3config.devices + rm3config.active)
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["device"]  
    
    if not device in active_json:                                             return("ERROR: Device " + device + " doesn't exists (active).")
    if not rm3json.ifexist(rm3config.commands +interface+"/"+device_code):    return("ERROR: Device " + device + " doesn't exists (commands).")
    if not rm3json.ifexist(rm3config.remotes  +interface+"/"+device_code):    return("ERROR: Device " + device + " doesn't exists (remotes).") 

    interface = active_json[device]["interface"]  ############# funtioniert nicht so richtig ...
    for entry in active_json:
      if entry != device: 
        devices[entry] = active_json[entry]
        
    active_json = devices
    configFiles.write(rm3config.devices + rm3config.active, active_json)

    try:    
      rm3json.delete(rm3config.remotes  + interface + "/" + device_code)
      rm3json.delete(rm3config.commands + interface + "/" + device_code)
      rm_data_update = True
      
      if not rm3json.ifexist(rm3config.commands + interface + "/" + device_code) and not rm3json.ifexist(rm3config.remotes + interface + "/" + device_code):
        return "OK: Device '" + device + "' deleted."
      else:
        return "ERROR: Could not delete device '" + device + "'"
        
    except Exception as e:
      return "ERROR: Could not delete device '" + device + "': " + str(e)

#---------------------------------------

def editDevice(device,info):
    '''
    delete device from json config file and delete device related files
    '''
    
    global rm_data_update
    
    keys_active   = ["label","description","main-audio","interface"]
    keys_commands = ["description","method"]
    keys_remotes  = ["description"]

    # read central config file
    active_json          = configFiles.read(rm3config.devices + rm3config.active)
    if "ERROR" in active_json: return("ERROR: Device " + device + " doesn't exists (active).")
    
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["device"]  
    
    # read command definition
    commands             = configFiles.read(rm3config.commands +interface+"/"+device_code)
    if "ERROR" in commands: return("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes              = configFiles.read(rm3config.remotes +interface+"/"+device_code)
    if "ERROR" in remotes: return("ERROR: Device " + device + " doesn't exists (remotes).") 
    
    i = 0
    for key in keys_active:   
      if key in info: 
        active_json[device][key] = info[key]
        i+=1
      
    for key in keys_commands: 
      if key in info: 
        commands["data"][key] = info[key]
        i+=1
      
    for key in keys_remotes:   
      if key in info: 
        remotes["data"][key] = info[key]
        i+=1
    
    # write central config file
    try:                    configFiles.write(rm3config.devices + rm3config.active, active_json)
    except Exception as e:  return("ERROR: could not write changes (active) - "+str(e))

    # write command definition
    try:                    configFiles.write(rm3config.commands +interface+"/"+device_code, commands)
    except Exception as e:  return("ERROR: could not write changes (commands) - "+str(e))

    # write remote layout definition
    try:                    configFiles.write(rm3config.remotes +interface+"/"+device_code, remotes)
    except Exception as e:  return("ERROR: could not write changes (remotes) - "+str(e))

    if i > 0: return("OK: Edited device paramenters of "+device+" ("+str(i)+" changes)")
    else:     return("ERROR: no data key matched with keys from config-files ("+str(info.keys)+")")

      

#-----------------------------------------------
# Read and set status
#-----------------------------------------------

def setStatus(device,key,value):
    '''
    change status and write to file
    '''

    status = configFiles.read_status()
    
    if key == "":
        key = "power"
      
    if device in status:
        logging.debug("setStatus:"+key+"="+str(value))
        status[device]["status"][key] = value
        configFiles.write_status(status)
      
    else:
        logging.warn("setStatus: device does not exist ("+device+")")
        return "ERROR setStatus: device does not exist ("+device+")"
    
    return "TBC: setStatus: " + device + "/" + key + "/" + str(value)
    
#-----------------------------------------------

def resetStatus():
    '''set status for all devices to OFF'''

    status = configFiles.read_status()

    # reset if device is not able to return status and interface is defined
    for key in status:
    
      if status[key]["interface"] != "":     
        device_code = configFiles.translate_device(key)
        device      = configFiles.read(rm3config.commands + status[key]["interface"] + "/" + device_code)
        logging.info("Reset Device: " + device_code + "/" + status[key]["interface"])
      
        if device["data"]["method"] != "query":
          status[key]["status"]["power"] = "OFF"

    configFiles.write_status(status)
    return "TBC: Reset POWER to OFF for devices without API"

#-----------------------------------------------

def resetAudio():
    '''set status for all devices to OFF'''
  
    status = configFiles.read_status()

    # reset if device is not able to return status and interface is defined
    for key in status:
    
      if status[key]["interface"] != "":
      
        device_code = configFiles.translate_device(key)
        device      = configFiles.read(rm3config.commands + status[key]["interface"] + "/" + device_code)
        logging.info("Reset Device: " + device_code + "/" + status[key]["interface"])
      
        if device["data"]["method"] != "query":      
          if "vol"  in status[key]["status"]: status[key]["status"]["vol"]  = 0 
          if "mute" in status[key]["status"]: status[key]["status"]["mute"] = "OFF"

    configFiles.write_status(status)
    return "TBC: Reset AUDIO to 0 for devices without API"

#-----------------------------------------------

def getStatus(device,key):
    '''get status of device'''

    status = configFiles.read_status()
    
    if not device in status: 
      logging.error("Get status - Device not defined: " +device + " (" + key + ")")
      return 0
    
    if device in status and key in status[device]["status"]:
      logging.info("Get status: " + key + " = " + str(status[device]["status"][key]))
      return status[device]["status"][key]
      
    else:
      logging.error("Get status: " + key + "/" + device)
      return 0    



#-----------------------------------------------
# Device status
#-----------------------------------------------

def devicesGetStatus(data):
    '''
    read status data from config file (method=record) and/or device APIs (method=query)
    data -> data["DATA"]["devices"]
    '''

    global status_cache, status_cache_time, status_cache_interval

    devices       = configFiles.read(rm3config.devices + rm3config.active)
    relevant_keys = ["status","visible","description","image","interface","label","device","main-audio"]
    
    # if cache is older than 5 seconds or cache time is not set
    if (status_cache_time == 0) or (time.time() - status_cache_time >= status_cache_interval):
    
      for device in devices: 
        if "status" in devices[device] and "method" in data[device]:
          
          # if method == record read from file
          if data[device]["method"] == "record":

              for value in devices[device]["status"]:
                  data[device]["status"][value] = devices[device]["status"][value]
               
          # else request status from API 
          elif data[device]["method"] == "query":
          
              interface = data[device]["interface"]
              if deviceAPIs.status(interface) == "Connected":

                  for value in data[device]["query_list"]:              
                      result = deviceAPIs.query(interface,device,value)
                      if not "ERROR" in str(result):
                          devices[device]["status"][value]      = str(result)
                          data[device]["status"][value]         = str(result)

                      else:
                          devices[device]["status"][value]      = "Error"
                          data[device]["status"][value]         = "Error"
                          logging.error(result)
                  
              else:
                   devices[device]["status"][value] = "Not connected"
      
      # workaround: delete keys that are not required
      devices_temp = {}
      for device in devices:
          devices_temp[device] = {}
          for key in devices[device]:
              if key in relevant_keys:
                 devices_temp[device][key] = devices[device][key]
                  
      devices = devices_temp
                               
      status_cache = devices
      configFiles.write(rm3config.devices + rm3config.active, devices)

    else:
      devices = status_cache
                
    status_cache_time = time.time()
    return data

#-----------------------------------------------

def deviceStatusGet(device,button):
    '''
    Get Status from device for a specific button or display value (first step if method = "record")
    '''
    
    global rm_data
    power_buttons = ["on","on-off","off"]
    method        = rm_data["devices"][device]["method"]
    
    if method == "record":
      if button in power_buttons: button = "power"
      getStatus(device,button)
      return "OK"
    else:
      return "ERROR: Wrong method ("+method+")"
    
#-----------------------------------------------

def deviceStatusSet(device,button,state):
    '''
    Set Status of device for a specific button or display value (first step if method = "record")
    '''
    
    power_buttons = ["on","on-off","off"]
    vol_buttons   = ["vol+","vol-"]
    
    logging.warn("....d:"+device)
    method        = configFiles.get_method(device)
    
    logging.debug(" ...m:"+method+" ...d:"+device+" ...b:"+button+" ...s:"+str(state))
    
    if method == "record":

        if button in power_buttons: button = "power"
        if button in vol_buttons:   button = "vol"
        if button == "on":          state  = "ON"
        if button == "off":         state  = "OFF"
        
        setStatus(device,button,state)
        configFiles.cache_time = 0
        return "OK"
    else:
        logging.warn("deviceStatusSet: Wrong method ("+method+")")
        return "ERROR: Wrong method ("+method+")"



#-------------------------------------------------
# Start and end of API answer
#-------------------------------------------------
     
def remoteAPI_start(setting=[]):
    '''
    create data structure for API response and read relevant data from config files
    '''

    global Status, lastButton
    
    data                                   = configFiles.api_init
    data["DATA"]                           = RmReadData(setting)
    
    data["CONFIG"]                         = {}  
    data["CONFIG"]["button_images"]        = configFiles.read(rm3stage.icons_dir + "/index")
    data["CONFIG"]["button_colors"]        = configFiles.read(rm3config.buttons  + "button_colors")
    data["CONFIG"]["interfaces"]           = deviceAPIs.available
    data["CONFIG"]["methods"]              = deviceAPIs.methods
    
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()
    data["REQUEST"]["Button"]              = lastButton 

    data["STATUS"]                         = {}
    data["STATUS"]["interfaces"]           = deviceAPIs.status()
    data["STATUS"]["system"]               = {} #  to be filled in remoteAPI_end()

    for device in data["DATA"]["devices"]:
      if "main-audio" in data["DATA"]["devices"][device] and data["DATA"]["devices"][device]["main-audio"] == "yes": data["CONFIG"]["main-audio"] = device
      if "templates"  in data["DATA"]["devices"][device]:  del data["DATA"]["devices"][device]["templates"]
      if "queries"    in data["DATA"]["devices"][device]:  del data["DATA"]["devices"][device]["queries"]
      if "buttons"    in data["DATA"]["devices"][device]:  del data["DATA"]["devices"][device]["buttons"]
      
      if data["DATA"]["devices"][device]["interface"] in data["STATUS"]["interfaces"]:
        data["DATA"]["devices"][device]["connected"] = data["STATUS"]["interfaces"][data["DATA"]["devices"][device]["interface"]]
      else:
        data["DATA"]["devices"][device]["connected"] = "No connection yet."
    
    #--------------------------------
    
    if "no-data" in setting:   del data["DATA"]
    if "no-config" in setting: del data["CONFIG"]
        
    return data
    

#-------------------------------------------------

def remoteAPI_end(data):
    '''
    add system status and timing data to API response
    '''

    global Status

    data["REQUEST"]["load-time"] = time.time() - data["REQUEST"]["start-time"]
    data["STATUS"]["system"]     = {
        "message"               :  Status,
        "server_start"          :  rm3config.start_time,
        "server_start_duration" :  rm3config.start_duration,
        "server_running"        :  time.time() - rm3config.start_time
        }
  
    # Update device status (e.g. if send command and cache maybe is not up-to-date any more)      
    if "DATA" in data and "devices" in data["DATA"]:
        data["DATA"]["devices"] = devicesGetStatus(data["DATA"]["devices"])

    return data


#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteReload():
        '''
        reload interfaces and reload config data in cache
        '''
        
        deviceAPIs.reconnect()
        refreshCache()

        data                          = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]     = "OK: Configuration reloaded"
        data                          = remoteAPI_end(data)
        return data

#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteCheckUpdate(APPversion):
        '''
        Check if app is supported by this server version
        '''

        data = remoteAPI_start(["no-data"])

        if (APPversion == rm3config.APPversion):
            data["ReturnCode"]   = "800"
            data["ReturnMsg"]    = "OK: "+rm3config.ErrorMsg("800")
        elif (APPversion in rm3config.APPsupport):
            data["ReturnCode"]   = "801"
            data["ReturnMsg"]    = "WARN: "+rm3config.ErrorMsg("801")
        else:
            data["ReturnCode"]   = "802"
            data["ReturnMsg"]    = "WARN: "+rm3config.ErrorMsg("802")


        data["REQUEST"]["Return"]     = data["ReturnMsg"]
        data["REQUEST"]["ReturnCode"] = data["ReturnCode"]
        data                          = remoteAPI_end(data)
        return data

#-------------------------------------------------
# List all defined commands / buttons
#-------------------------------------------------

def RemoteList():
        '''
        Load and list all data
        '''

        #refreshCache()
        data                      = remoteAPI_start()
        data["REQUEST"]["Return"] = "OK: Returned list and status data."
        data                      = remoteAPI_end(data)        
        return data


#-------------------------------------------------
# main functions for API
#-------------------------------------------------

def Remote(device,button):
        '''
        send IR command and return JSON msg
        '''
        
        data                      = remoteAPI_start(["no-data"])
        interface                 = rm_data["devices"][device]["interface"]
        
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        #data["REQUEST"]["Return"] = deviceAPIs.send(interface,device,button)
        data["REQUEST"]["Return"] = sendRemote.add2queue([[interface,device,button,""]])
        
        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"]      = getStatus(device,"power")  # to be removed
        data["ReturnMsg"]         = data["REQUEST"]["Return"]    # to be removed

        #refreshCache()
        data                      = remoteAPI_end(data)      
        
        return data


#-------------------------------------------------

def RemoteMakro(makro):
        '''
        send makro (list of commands)
        '''

        data                      = remoteAPI_start()
        data["REQUEST"]["Button"] = makro
        data["REQUEST"]["Return"] = "ERROR: not implemented yet." #deviceAPIs.send(interface,device,button)
        
        commands_1st              = makro.split("::")
        commands_2nd              = []
        commands_3rd              = []
        commands_4th              = []
        
        # decode makros: scene-on/off
        for command in commands_1st:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "scene-on_" in command:     commands_2nd.extend(data["DATA"]["makros"]["scene-on"][button])
            elif "scene-off_" in command:  commands_2nd.extend(data["DATA"]["makros"]["scene-off"][button])
            else:                          commands_2nd.extend([command])
          else:                            commands_3rd.extend([command])
          
        # decode makros: dev-on/off
        for command in commands_2nd:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "dev-on_" in command:     commands_3rd.extend(data["DATA"]["makros"]["dev-on"][button])
            elif "dev-off_" in command:  commands_3rd.extend(data["DATA"]["makros"]["dev-off"][button])
            else:                        commands_3rd.extend([command])
          else:                          commands_3rd.extend([command])
          
        # decode makros: makro
        for command in commands_3rd:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:  
            device,button = command.split("_",1)
            if "makro_" in command:      commands_4th.extend(data["DATA"]["makros"]["makro"][button])
            else:                        commands_4th.extend([command])
          else:                          commands_4th.extend([command])
          
        logging.warn(str(commands_4th))
                  
        # execute buttons
        for command in commands_4th:
          command_str = str(command)
          if not command_str.isnumeric() and "_" in command:
          
            status                      = ""
            power_buttons               = ["on","on-off","off"]
            device,button_status        = command.split("_",1)                         # split device and button
            interface                   = data["DATA"]["devices"][device]["interface"] # get interface / API

            # check if future state defined
            if "||" in button_status:   button,status = button_status.split("||",1)                              # split button and future state           
            else:                       button        = button_status
            
            if button in power_buttons: status_var    = "power"
            else:                       status_var    = button

            # if future state not already in place add command to queue              
            logging.warn(" ...i:"+interface+" ...d:"+device+" ...b:"+button+" ...s:"+status)

            if device in data["DATA"]["devices"] and status_var in data["DATA"]["devices"][device]["status"]:
              logging.warn(" ...y:"+status_var+"="+str(data["DATA"]["devices"][device]["status"][status_var])+" -> "+status)
              
              if data["DATA"]["devices"][device]["status"][status_var] != status:
              
                  data["REQUEST"]["Return"]  += ";" + sendRemote.add2queue([[interface,device,button,status]])
            
            # if no future state is defined just add command to queue
            elif status == "":
                data["REQUEST"]["Return"]  += ";" + sendRemote.add2queue([[interface,device,button,""]])
                
          # if command is numeric, add to queue directly (time to wait)
          elif command_str.isnumeric():
            data["REQUEST"]["Return"]  += ";" + sendRemote.add2queue([float(command)])

        #refreshCache()
        data["DATA"]              = {}
        data                      = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteTest():
        '''
        Test new functions
        '''

        data                      = remoteAPI_start(["no-data"])
        data["TEST"]              = RmReadData("")
        data["REQUEST"]["Return"] = "OK: Test - show complete data structure"
        data                      = remoteAPI_end(data)                
        deviceAPIs.test()
        
        return data


#-------------------------------------------------

def RemoteOnOff(device,button):
        '''
        check old status and document new status
        '''

        data            = remoteAPI_start()    
        interface       = data["DATA"]["devices"][device]["interface"]
        
        # Get method and presets
        if "method"  in data["DATA"]["devices"][device]:  method  = data["DATA"]["devices"][device]["method"]
        else:                                             method  = "record"
        if "values"  in data["DATA"]["devices"][device]:  presets = data["DATA"]["devices"][device]["values"]
        else:                                             presets = {}
        
        # delete DATA (less data to be returned via API)
        data["DATA"]    = {}
        status          = ""


############### need for action ##
 # - if multiple values, check definition
 # - if volume, check minimum and maximum

        # if recorded values, check against status quo
        if method == "record":
        
          logging.info("RemoteOnOff: " +device+"/"+button+" ("+interface+"/"+method+")")
        
          statPower = getStatus(device,"power")
          statTV    = getStatus(device,"radiotv")
          statMute  = getStatus(device,"mute")
          statVol   = getStatus(device,"vol")
   
          # buttons ON / OFF
          if button == "on-off":
              if statPower == "OFF": status = "ON" 
              else:                  status = "OFF"
          elif button == "on":       status = "ON" 
          elif button == "off":      status = "OFF" 
              
          # TV - change mode between TV and Radio (specific for Authors receiver from TOPFIELD!)
          elif button == "radiotv":
              if statTV == "TV":     status = "RADIO"
              else:                  status = "TV"
              
          # change mute on/off
          elif button == "mute":
              if statMute == "OFF":  status = "ON"
              else:                  status = "OFF"
          
          # document volume
          elif "vol-" in button:
              status = statVol
              if statVol > 0:        status = statVol - 1
          elif "vol+" in button:
              status = statVol
              if statVol < 69:       status = statVol + 1  # max base on receiver -> change to setting per device # !!!!
             
        # if values via API, no additional need for checks (as done by API ...)
        elif method == "query":
          logging.info("RemoteOnOff: " +device+"/"+button+" ("+interface+"/"+method+")")
          status = ""
        
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Return"]    = sendRemote.add2queue([[interface,device,button,status]])

        refreshCache()
        data                         = remoteAPI_end(data)        

        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])
        return data


#-------------------------------------------------

def RemoteReset():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = resetStatus()

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteResetAudio():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = resetAudio()

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteAddButton(device,button):
        '''
        Learn Button and safe to init-file
        '''

        data                         = remoteAPI_start(["no-data"])

        data["REQUEST"]["Return"]    = addButton(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button

        refreshCache()
        data                         = remoteAPI_end(data)
        return data

#-------------------------------------------------

def RemoteRecordCommand(device,button):
        '''
        Learn Button and safe to init-file
        '''

        data                         = remoteAPI_start()
        interface                    = data["DATA"]["devices"][device]["interface"]
        data["DATA"]                 = {}
        
        EncodedCommand               = deviceAPIs.record(interface,device,button)
        data["REQUEST"]["Return"]    = addCommand2Button(device,button,EncodedCommand)       
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button

        refreshCache()
        data                         = remoteAPI_end(data)
        return data


#-------------------------------------------------

def RemoteDeleteButton(device,button):
        '''
        Delete button from layout file
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = deleteCmd(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteChangeVisibility(device,value):
        '''
        change visibility of device in config file
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = changeVisibility(device,value)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = value

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data

        
#-------------------------------------------------

def RemoteChangeMainAudio(device,value):
        '''
        change main audio device in config file
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = "ERROR: Not implemented yet." #changeVisibility(device,value)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = value

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data

 #-------------------------------------------------

def RemoteAddDevice(device,interface,description):
        '''
        add device in config file and create config files for remote and command
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = addDevice(device,interface,description)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = description

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteEditDevice(device,info):
        '''
        Edit data of device
        '''
        logging.info(info)
        
        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = editDevice(device,info)
        data["REQUEST"]["Device"]    = device

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteAddTemplate(device,template):
        '''
        add / overwrite remote template
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = addTemplate(device,template)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = template

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data

        
#-------------------------------------------------

def RemoteDeleteDevice(device):
        '''
        delete device from config file and delete device related files
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = deleteDevice(device)
        data["REQUEST"]["Device"]    = device

        refreshCache()
        data                         = remoteAPI_end(data)        
        return data


#-------------------------------------------------

deviceAPIs  = interfaces.connect()
deviceAPIs.start()

sendRemote  = rm3queue.sendCmd("sendRemote",deviceAPIs,deviceStatusSet)
sendRemote.start()

configFiles = rm3cache.configuration("Config")
configFiles.start()

#-------------------------------------------------
# EOF

