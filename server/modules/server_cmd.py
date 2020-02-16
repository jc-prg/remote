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

#---------------------------
# init vars ... check all, if still required after redesign
#---------------------------

Status                 = "Starting"

#---------------------------

if modules.test: Stage = "Test Stage"
else:            Stage = "Prod Stage"


#---------------------------
# see initialization of thread ad the end ...
#---------------------------

def refreshCache():
    '''
    Reset vars to enforce a refresh of all cached data
    '''
    
    configFiles.cache_update = True

#---------------------------
# Read data
#---------------------------


def RmReadData(selected=[]):
    '''Read all relevant data and create data structure'''

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","queries","values"]

    # if update required
    if configFiles.cache_update or "_api" not in configFiles.cache: 
    
        data["devices"] = configFiles.read(modules.devices + modules.active)
        data["scenes"]  = configFiles.read(modules.scenes  + modules.active)
        data["makros"]  = {}
    
        # read data for active devices
        for device in data["devices"]:
            if data["devices"][device]["interface"] != "":
              if selected == [] or device in selected:
	
                key        = data["devices"][device]["device"]
                interface  = data["devices"][device]["interface"]
                data_temp  = data["devices"][device]

                remote           = configFiles.read(modules.remotes  + interface + "/" + key) # remote layout & display
                buttons          = configFiles.read(modules.commands + interface + "/" + key) # button definitions, presets, queries ...
                
                logging.info(interface + "/" + key)
                
                # if default.json exists, add values to device specific values
                if modules.ifexist(modules.commands + interface + "/default"):   
                
                  buttons_default  = configFiles.read(modules.commands + interface + "/default")

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

                thescene      = configFiles.read(modules.scenes_def + scene)
                keys          = ["remote","channel","devices","label"]
 
                for key in keys:
                    data["scenes"][scene][key] = thescene[scene][key]
              else:
                logging.error("Scene not found: "+str(scene)+" / "+str(selected))
          
        # read data for makros
        for makro in makros:        
            temp                      = configFiles.read(modules.makros + makro)
            data["makros"][makro]     = temp[makro]
                
        # read data for templates
        data["templates"]               = {}
        data["template_list"]           = {}
        
        if selected == []:
          templates                     = modules.available(modules.templates)
          for template in templates:    
            template_keys = template.split("/")
            template_key  = template_keys[len(template_keys)-1]
            template_data = configFiles.read(modules.templates + template)
            
            logging.debug(modules.templates+template)

            if "ERROR" in template_data:  data["templates"][template] = template_data
            else: 
                if template_key in template_data: data["templates"][template] = template_data[template_key]
                elif "data" in template_data:     data["templates"][template] = template_data["data"]
                else:                             data["templates"][template] = { "ERROR" : "JSON file not correct, key missing: "+template_key }
                data["template_list"][template] = data["templates"][template]["description"]
        
            data["templates"][template]["file"] = template

        # update cache data
        if selected == []:
          configFiles.cache["_api"] = data
          configFiles.cache_update  = False

        data["devices"] = devicesGetStatus(data["devices"],readAPI=True)

    # if no update required read from cache
    else: 
        data            = configFiles.cache["_api"]
        data["devices"] = devicesGetStatus(data["devices"],readAPI=False)

    # Update status data        
    configFiles.cache["_api"] = data
    
    return data



#---------------------------
# add / delete devices & buttons to config
#---------------------------

def addDevice(device,interface,description):
    '''
    add new device to config file and create command/remote files
    '''
    
    ## Check if exists    
    active_json         = configFiles.read(modules.devices + modules.active)
    
    if device in active_json:                                        return("WARN: Device " + device + " already exists (active).")
    if modules.ifexist(modules.commands +interface+"/"+device):    return("WARN: Device " + device + " already exists (devices).")
    if modules.ifexist(modules.remotes  +interface+"/"+device):    return("WARN: Device " + device + " already exists (remotes).") 
    
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
      configFiles.write(modules.devices + modules.active, active_json)
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
      configFiles.write(modules.commands + interface+"/"+description,buttons)
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
      configFiles.write(modules.remotes +interface+"/"+description,remote)
    except Exception as e:
      return "ERROR: " + str(e)
            
    return("OK: Device " + device + " added.")



#---------------------------------------
# add vars to config JSON (buttons & devices)
#---------------------------------------

def addCommand2Button(device,button,command):
    '''
    add new command to button or change existing
    '''

    config      = configFiles.read(modules.devices+modules.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(modules.commands+interface+"/"+device_code)
    
    if "data" in data:
        if button in data["data"]["buttons"].keys():
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            data["data"]["buttons"][button] = command
            configFiles.write(modules.commands+interface+"/"+device_code,data)
            return "OK: Button '" + device + "_" + button + "' recorded and saved: " + command
    else:
        return "ERROR: Device '" + device + "' does not exists."
        
#---------------------------------------

def addButton(device,button):
    '''
    add new button to remote layout
    '''
    
    config      = configFiles.read(modules.devices+modules.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(modules.remotes+interface+"/"+device_code)
    
    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            configFiles.write(modules.remotes+interface+"/"+device_code,data)
            return "OK: Button '" + device + "_" + button + "' added."
    else:
        return "ERROR: Device '" + device + "' does not exists."        

#---------------------------------------

def deleteCmd(device, button):
    '''
    delete command (not button) from json config file
    '''

    config      = configFiles.read(modules.devices+modules.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = configFiles.read(modules.commands+interface+"/"+device_code)
    
    if data["data"]:
        if button in data["data"]["buttons"].keys():
        
            data["data"]["buttons"].pop(button,None)
            data = configFiles.write(modules.commands+interface+"/"+device_code,data)
            return "OK: Command '" + device + "_" + button + "' deleted."
        else:
            return "ERROR: Command '" + device + "_" + button + "' does not exist."
    else:
        return "ERROR: Device '" + device + "' does not exist."


#---------------------------------------

def deleteButton(device, button_number):
    '''
    delete button (not command) from json config file
    '''

    buttonNumber = int(button_number)
    config       = configFiles.read(modules.devices+modules.active)
    interface    = config[device]["interface"]  
    device_code  = config[device]["device"]  
    data         = configFiles.read(modules.remotes+interface+"/"+device_code)
    
    if data["data"] and data["data"]["remote"]:
        if buttonNumber >= 0 and buttonNumber < len(data["data"]["remote"]):
            data["data"]["remote"].pop(buttonNumber)
            data = configFiles.write(modules.remotes+interface+"/"+device_code,data)
            return "OK: Button '" + device + " [" + str(buttonNumber) + "] deleted."
        else:
            return "ERROR: Button '" + device + " [" + str(buttonNumber) + "] does not exist."
    else:
        return "ERROR: Device '" + device + "' does not exist."

#---------------------------------------

def addTemplate(device,template):
    '''
    add / overwrite remote layout definition by template
    '''

    templates   = configFiles.read(modules.templates + template)
    config      = configFiles.read(modules.devices + modules.active)
    interface   = config[device]["interface"]
    device_code = config[device]["device"]
    data       = configFiles.read(modules.remotes + interface + "/" + device_code)

    # check if error
    if "data" not in data.keys():  return "ERROR: Device '" + device + "' does not exists."
        
    # add layout from template
    elif template in templates and data["data"] == []:
    
        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(modules.remotes + interface + "/" + device_code, data)
        return "OK: Template '" + template + "' added to '" + device + "'."
            
    # overwrite layout from template
    elif template in templates and data["data"] != []:

        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(modules.remotes + interface + "/" + device_code, data)
        return "OK: Remote definition of '" + device + "' overwritten by template '" + template + "'."
        
    # template doesn't exist
    else:
        return "ERROR: Template '" + template + "' does't exists."

#---------------------------------------

def changeVisibility(device,visibility):
    '''
    change visibility in device configuration (yes/no)
    '''

    data = configFiles.read(modules.devices + modules.active)
    
    if device not in data.keys():
        return "Device '" + device + "' does not exists."
        
    elif visibility == "yes" or visibility == "no":
        data[device]["visible"] = visibility
        configFiles.write(modules.devices + modules.active, data)
        return "OK: Change visibility for '" + device + "': " + visibility
        
    else:
        return "ERROR: Visibility value '" + visibility + "' does not exists."


#---------------------------------------

def deleteDevice(device):
    '''
    delete device from json config file and delete device related files
    '''
    
    devices              = {}
    active_json          = configFiles.read(modules.devices + modules.active)
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["device"]  
    
    if not device in active_json:                                             return("ERROR: Device " + device + " doesn't exists (active).")
    if not modules.ifexist(modules.commands +interface+"/"+device_code):    return("ERROR: Device " + device + " doesn't exists (commands).")
    if not modules.ifexist(modules.remotes  +interface+"/"+device_code):    return("ERROR: Device " + device + " doesn't exists (remotes).") 

    interface = active_json[device]["interface"]  ############# funtioniert nicht so richtig ...
    for entry in active_json:
      if entry != device: 
        devices[entry] = active_json[entry]
        
    active_json = devices
    configFiles.write(modules.devices + modules.active, active_json)

    try:    
      modules.delete(modules.remotes  + interface + "/" + device_code)
      modules.delete(modules.commands + interface + "/" + device_code)
      
      if not modules.ifexist(modules.commands + interface + "/" + device_code) and not modules.ifexist(modules.remotes + interface + "/" + device_code):
        return "OK: Device '" + device + "' deleted."
      else:
        return "ERROR: Could not delete device '" + device + "'"
        
    except Exception as e:
      return "ERROR: Could not delete device '" + device + "': " + str(e)

#---------------------------------------

def editDevice(device,info):
    '''
    edit device data in json file
    '''
    
    keys_active   = ["label","description","main-audio","interface"]
    keys_commands = ["description","method"]
    keys_remotes  = ["description"]
    
    # read central config file
    active_json          = configFiles.read(modules.devices + modules.active)
    if "ERROR" in active_json: return("ERROR: Device " + device + " doesn't exists (active).")
    
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["device"]  
    
    # read command definition
    commands             = configFiles.read(modules.commands +interface+"/"+device_code)
    if "ERROR" in commands: return("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes              = configFiles.read(modules.remotes +interface+"/"+device_code)
    if "ERROR" in remotes: return("ERROR: Device " + device + " doesn't exists (remotes).") 
    
    i = 0
    for key in keys_active:   
      if key in info: 
        active_json[device][key] = info[key]
        i+=1
        
    logging.info(str(active_json[device]))
      
    for key in keys_commands: 
      if key in info: 
        commands["data"][key] = info[key]
        i+=1
      
    for key in keys_remotes:   
      if key in info: 
        remotes["data"][key] = info[key]
        i+=1
    
    # write central config file
    try:                    configFiles.write(modules.devices + modules.active, active_json)
    except Exception as e:  
      logging.error("ERROR: could not write changes (active) - "+str(e))
      return("ERROR: could not write changes (active) - "+str(e))

    # write command definition
    try:                    configFiles.write(modules.commands +interface+"/"+device_code, commands)
    except Exception as e:
      logging.error("ERROR: could not write changes (commands) - "+str(e))
      return("ERROR: could not write changes (commands) - "+str(e))

    # write remote layout definition
    try:                    configFiles.write(modules.remotes +interface+"/"+device_code, remotes)
    except Exception as e:
      logging.error("ERROR: could not write changes (remotes) - "+str(e))
      return("ERROR: could not write changes (remotes) - "+str(e))

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
        device      = configFiles.read(modules.commands + status[key]["interface"] + "/" + device_code)
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
        device      = configFiles.read(modules.commands + status[key]["interface"] + "/" + device_code)
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

def devicesGetStatus(data,readAPI=False):
    '''
    read status data from config file (method=record) and/or device APIs (method=query)
    data -> data["DATA"]["devices"]
    '''

    relevant_keys = ["status","visible","description","image","interface","label","device","main-audio"]
    devices       = configFiles.read(modules.devices + modules.active)
    
    for device in devices: 
    
        if "status" in devices[device] and "method" in data[device]:
          
          for value in devices[device]["status"]:
              data[device]["status"][value] = devices[device]["status"][value]
               
          # else request status from API -> using the queue
          if data[device]["method"] == "query" and readAPI == True:
          
              interface = data[device]["interface"]
              queueQuery.add2queue ([4])                                  # wait a few seconds before queries
              queueQuery.add2queue ([[interface,device,data[device]["query_list"],""]])  # add querylist per device

# ---- tried out --- using a queue for queries -----------------------------------
#
#             querylist = ""
#             for x in data[device]["query_list"]: querylist += x+"||"
#             queryRemote.add2queue( [[interface,device,querylist]] );
#
# ---- old code --- direct call --------------------------------------------------          
#
#              if deviceAPIs.status(interface) == "Connected":
#
#                  for value in data[device]["query_list"]:              
#                  
#                      result = deviceAPIs.query(interface,device,value)
#                      
#                      if not "ERROR" in str(result):
#                          devices[device]["status"][value]      = str(result)
#                          data[device]["status"][value]         = str(result)
#
#                      else:
#                          devices[device]["status"][value]      = "Error"
#                          data[device]["status"][value]         = "Error"
#                          logging.error(result)
#                  
#              else:
#                   devices[device]["status"][value] = "Not connected"

# ---- end old code --- direct call ----------------------------------------------

      
    # workaround: delete keys that are not required -> not sure, where other keys are added
    devices_temp = {}
    for device in devices:
        devices_temp[device] = {}
        for key in devices[device]:
            if key in relevant_keys:
               devices_temp[device][key] = devices[device][key]                 
    devices = devices_temp
                            
    configFiles.write(modules.devices + modules.active, devices)
    return data


#-----------------------------------------------
# get / set status of specific value
#-----------------------------------------------

def getButtonValue(device,button):
    '''
    Get Status from device for a specific button or display value
    '''
    
    power_buttons = ["on","on-off","off"]
    if button in power_buttons: button = "power"
    
    method        = configFiles.cache["_api"]["devices"][device]["method"]
    interface     = configFiles.cache["_api"]["devices"][device]["interface"]
    
    logging.debug("getButtonValue: ...m:"+method+" ...d:"+device+" ...b:"+button+" ...s:"+str(state))

    if method == "record":   getStatus(device,button)
    elif method == "query":  return deviceAPIs.query(interface,device,button)
    else:                    return "ERROR: Wrong method ("+method+")"
    
    return "OK"
    
    
#-----------------------------------------------

def setButtonValue(device,button,state):
    '''
    Set Status of device for a specific button or display value (method = "record")
    used via callback from queueSend also
    '''
    
    power_buttons = ["on","on-off","off"]
    vol_buttons   = ["vol+","vol-"]
    method        = configFiles.cache["_api"]["devices"][device]["method"]
    
    logging.debug("setButtonValue: ...m:"+method+" ...d:"+device+" ...b:"+button+" ...s:"+str(state))
    
    if method == "record":

        if button in power_buttons: button = "power"
        if button in vol_buttons:   button = "vol"
        if button == "on":          state  = "ON"
        if button == "off":         state  = "OFF"
        
        setStatus(device,button,state)
        configFiles.cache_time = 0
        return "OK"
        
    else:
        logging.warn("setButtonValue: Wrong method ("+method+")")
        return "ERROR: Wrong method ("+method+")"



#-------------------------------------------------
# Start and end of API answer
#-------------------------------------------------
     
def remoteAPI_start(setting=[]):
    '''
    create data structure for API response and read relevant data from config files
    '''

    global Status

    data                                   = configFiles.api_init
    data["DATA"]                           = RmReadData()#setting)

    data["CONFIG"]                         = {}  
    data["CONFIG"]["button_images"]        = configFiles.read(modules.icons_dir + "/index")
    data["CONFIG"]["button_colors"]        = configFiles.read(modules.buttons  + "button_colors")

    data["CONFIG"]["interfaces"]           = deviceAPIs.available
    data["CONFIG"]["methods"]              = deviceAPIs.methods
    
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()
    data["REQUEST"]["Button"]              = queueSend.last_button 

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
        "server_start"          :  modules.start_time,
        "server_start_duration" :  modules.start_duration,
        "server_running"        :  time.time() - modules.start_time
        }
  
    # Update device status (e.g. if send command and cache maybe is not up-to-date any more)      
    if configFiles.cache_update and "DATA" in data and "devices" in data["DATA"]:
        data["DATA"]["devices"] = devicesGetStatus(data["DATA"]["devices"],readAPI=True)
        
#------------------------------------ ERROR -----------
#remote_server_test    |   File "/usr/src/app/server/modules/server_cmd.py", line 767, in RemoteList
#remote_server_test    |     data                      = remoteAPI_end(data)
#remote_server_test    |   File "/usr/src/app/server/modules/server_cmd.py", line 705, in remoteAPI_end
#remote_server_test    |     data["DATA"]["devices"] = devicesGetStatus(data["DATA"]["devices"])
#remote_server_test    | KeyError: 'DATA'
#remote_server_test    | INFO:werkzeug:172.21.0.1 - - [01/Feb/2020 07:57:57] "GET /api/list/ HTTP/1.1" 500 
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        

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

	refreshCache()
        d    = {}
        data = remoteAPI_start(["no-data","no-config"])

        if (APPversion == modules.APPversion):
            d["ReturnCode"]   = "800"
            d["ReturnMsg"]    = "OK: "+modules.ErrorMsg("800")
        elif (APPversion in modules.APPsupport):
            d["ReturnCode"]   = "801"
            d["ReturnMsg"]    = "WARN: "+modules.ErrorMsg("801")
        else:
            d["ReturnCode"]   = "802"
            d["ReturnMsg"]    = "WARN: "+modules.ErrorMsg("802")


        data["REQUEST"]["Return"]     = d["ReturnMsg"]
        data["REQUEST"]["ReturnCode"] = d["ReturnCode"]
        data                          = remoteAPI_end(data)
        return data

#-------------------------------------------------
# List all defined commands / buttons
#-------------------------------------------------

def RemoteList():
        '''
        Load and list all data
        '''

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
        interface                 = configFiles.cache["_api"]["devices"][device]["interface"]
        
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        #data["REQUEST"]["Return"] = deviceAPIs.send(interface,device,button)
        data["REQUEST"]["Return"] = queueSend.add2queue([[interface,device,button,""]])
        
        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"]      = getStatus(device,"power")  # to be removed
        data["ReturnMsg"]         = data["REQUEST"]["Return"]    # to be removed

        data                      = remoteAPI_end(data)      
        
        return data


#-------------------------------------------------

def RemoteMakro(makro):
        '''
        send makro (list of commands)
        '''

        data                      = remoteAPI_start()
        data["REQUEST"]["Button"] = makro
        data["REQUEST"]["Return"] = "ERROR: Started but not finished..." #deviceAPIs.send(interface,device,button)
        
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
          
        logging.debug("Decoded makro-string: "+str(commands_4th))
                  
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

            if button == "on":          status        = "ON"
            elif button == "off":       status        = "OFF"

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

        #logging.info("Start API CALL - 4 - " + method)

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
        
        #logging.info("Start API CALL - 5 - " + method)

        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Return"]    = queueSend.add2queue([[interface,device,button,status]])

        #logging.info("Start API CALL - 6 - " + method)

        refreshCache()
        data                         = remoteAPI_end(data)        

        #logging.info("End   API CALL - 7 - " + method)

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

def RemoteDeleteCommand(device,button):
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

def RemoteDeleteButton(device,button_number):
        '''
        Delete button from layout file
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = deleteButton(device,button_number)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button_number

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
        logging.info(str(info))
        
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

configFiles       = modules.configCache("configCache")
configFiles.start()

queueSend         = modules.queueApiCalls("queueSend","send",deviceAPIs,setButtonValue)
queueSend.start()

queueQuery        = modules.queueApiCalls("queueQuery","query",deviceAPIs,getButtonValue)
queueQuery.config = configFiles
queueQuery.start()

#queryRemote  = modules.queryQueue("queryRemote",deviceAPIs,deviceStatusSet,deviceStatusGet)
#queryRemote.start()
#queryRemote.configFiles = configFiles

#-------------------------------------------------
# EOF

