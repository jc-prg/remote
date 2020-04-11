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
# see initialization of thread ad the end ...
#---------------------------

def refreshCache():
    '''
    Reset vars to enforce a refresh of all cached data
    '''

    configFiles.update()


#---------------------------
# Read data
#---------------------------


def RmReadData(selected=[]):
    '''Read all relevant data and create data structure'''

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","queries","values","commands","url"]

    # if update required
    if configFiles.cache_update or "_api" not in configFiles.cache: 
    
        data["devices"] = configFiles.read_status()
        data["scenes"]  = configFiles.read(modules.active_scenes)
        data["makros"]  = {}
    
        # read data for active devices
        for device in data["devices"]:
            if data["devices"][device]["interface"] != "":
              if selected == [] or device in selected:
	
                key        = data["devices"][device]["config_device"]
                key_remote = data["devices"][device]["config_remote"]
                interface  = data["devices"][device]["interface"]
                data_temp  = data["devices"][device]

#                remote           = configFiles.read(modules.remotes  + interface + "/" + key) # remote layout & display
                remote           = configFiles.read(modules.remotes  + key_remote)      # remote layout & display
                buttons          = configFiles.read(modules.commands + interface + "/" + key) # button definitions, presets, queries ...
                
                logging.info(interface + "/" + key)
                
                # if default.json exists, add values to device specific values
                if modules.ifexist(modules.commands + interface + "/default"):   
                
                  buttons_default  = configFiles.read(modules.commands + interface + "/default")

                  # COMMAND/BUTTON : get button definitions, presets, queries ... from default.json
                  if not "ERROR" in buttons_default:
                    for x in btnfile:
                      if x in buttons_default["data"]:
                        if x not in buttons["data"]:
                          buttons["data"][x] = {}
                        for y in buttons_default["data"][x]:
                          buttons["data"][x][y] = buttons_default["data"][x][y]
                        
                #print(buttons)
	                        
                if "method"   in buttons["data"]:   data_temp["method"]    = buttons["data"]["method"]              
                if "values"   in buttons["data"]:   data_temp["values"]    = buttons["data"]["values"]              
                if "commands" in buttons["data"]:   data_temp["commands"]  = buttons["data"]["commands"] 
                if "url"      in buttons["data"]:   data_temp["url"]       = buttons["data"]["url"] 
                
                if "queries"  in buttons["data"]:
                    data_temp["queries"]         = buttons["data"]["queries"]
                    data_temp["query_list"]      = list(buttons["data"]["queries"].keys())                 
                
                data_temp["buttons"]             = buttons["data"]["buttons"]
                data_temp["button_list"]         = list(buttons["data"]["buttons"].keys())
                                
                # REMOTE : get remote layout & display # logging.info(device)
                if "data" in remote:
                   data_temp["description"]         = remote["data"]["description"]              
                   data_temp["remote"]              = remote["data"]["remote"]
                   
                   if "display" in remote["data"]:       data_temp["display"]       = remote["data"]["display"]              
                   if "display-size" in remote["data"]:  data_temp["display-size"]  = remote["data"]["display-size"]              
                   
                else:
                   data_temp["description"]         = "N/A"
                   data_temp["remote"]              = []

           
                data["devices"][device] = data_temp
 
        # read data for active scenes
        for scene in data["scenes"]:
            if data["scenes"][scene]["visible"] == "yes":
              if selected == [] or scene in selected:

                #thescene      = configFiles.read(modules.scenes + scene)
                thescene      = configFiles.read(modules.scenes + data["scenes"][scene]["config_scene"])
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
          #configFiles.cache_update  = False

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

def addDevice(device,device_data):
    '''
    add new device to config file and create command/remote files
    '''
    
    interface     = device_data["api"]
    config_remote = device_data["config_remote"]
    config_device = device_data["config_device"]
    
    ## Check if exists    
    active_json         = configFiles.read_status()
    
    if device in active_json:                                                            return("WARN: Device " + device + " already exists (active).")
    if modules.ifexist(modules.commands +interface+"/"+device_data["config_device"]):    return("WARN: Device " + device + " already exists (devices).")
    if modules.ifexist(modules.remotes  +device_data["config_remote"]):    return("WARN: Device " + device + " already exists (remotes).") 
    
    logging.info(device+" add")
    
    ## set position
    active_json_position = 0
    for key in active_json:
       if active_json[key]["position"] > active_json_position:
         active_json_position = active_json[key]["position"]
    active_json_position += 1
    
    ## add to _active.json 
    active_json[device]  = {
        "image"            : device,
        "config_device"    : device_data["config_device"],
        "config_remote"    : device_data["config_remote"],
        "interface"        : device_data["api"],
        "description"      : device_data["label"] + ": " + device_data["device"],
        "label"            : device_data["label"],
        "main-audio"       : "no",
        "status"           : { "power" : "OFF" },
        "position"         : active_json_position,
        "visible"          : "yes"    	
        }
        
    try:
      configFiles.write_status(active_json,"addDevice")
    except Exception as e:
      return "ERROR: " + str(e)
        
    ## add to devices = button definitions
    buttons = {
        "info" : "jc://remote/ - In this files the commands foreach button, queries, the query method is defined.",
        "data" : {
            "description" : device_data["label"] + ": " + device_data["device"],
            "method"      : deviceAPIs.api[device_data["api"]].method,
            "interface"   : device_data["api"],
            "buttons"     : {},
            "queries"     : {},
            "commands"    : {},
            "values"      : {}
            }
        }
    try:
      configFiles.write(modules.commands + interface+"/"+device_data["config_device"],buttons)
    except Exception as e:
      return "ERROR: " + str(e)

    ## add to remotes = button layout
    remote = {
        "info" : "jc://remote/ - In this files the remote layout and a display layout is defined.",
        "data" : {
           "description" : device_data["label"] + ": " + device_data["device"],
           "remote"      : [],
           "display"     : {}
           }
        }    
    try:
#      configFiles.write(modules.remotes +interface+"/"+description,remote)
      configFiles.write(modules.remotes +device_data["config_remote"],remote)
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

    config        = configFiles.read_status()
    interface     = config[device]["interface"]  
    device_code   = config[device]["config_device"]  
    device_remote = config[device]["config_remote"]  
    data          = configFiles.read(modules.commands+interface+"/"+device_code)
    
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
    
    config        = configFiles.read_status()
    interface     = config[device]["interface"]  
    device_code   = config[device]["config_device"]  
    device_remote = config[device]["config_remote"]  
    data          = configFiles.read(modules.remotes+device_remote)
#    data        = configFiles.read(modules.remotes+interface+"/"+device_code)
    
    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            #configFiles.write(modules.remotes+interface+"/"+device_code,data)
            configFiles.write(modules.remotes+device_remote,data)
            return "OK: Button '" + device + "_" + button + "' added."
    else:
        return "ERROR: Device '" + device + "' does not exists."        

#---------------------------------------

def deleteCmd(device, button):
    '''
    delete command (not button) from json config file
    '''

    config      = configFiles.read_status()
    interface   = config[device]["interface"]  
    device_code = config[device]["config_device"]  
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

    buttonNumber  = int(button_number)
    config        = configFiles.read_status()
    interface     = config[device]["interface"]  
    device_code   = config[device]["config_device"]  
    device_remote = config[device]["config_remote"]  
    data          = configFiles.read(modules.remotes+device_remote)
#    data         = configFiles.read(modules.remotes+interface+"/"+device_code)
    
    if data["data"] and data["data"]["remote"]:
        if buttonNumber >= 0 and buttonNumber < len(data["data"]["remote"]):
            data["data"]["remote"].pop(buttonNumber)
            data = configFiles.write(modules.remotes+device_remote,data)
#            data = configFiles.write(modules.remotes+interface+"/"+device_code,data)
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

    templates     = configFiles.read(modules.templates + template)
    config        = configFiles.read_status()
    interface     = config[device]["interface"]
    device_code   = config[device]["config_device"]
    device_remote = config[device]["config_remote"]  
    data          = configFiles.read(modules.remotes+device_remote)
#    data       = configFiles.read(modules.remotes + interface + "/" + device_code)

    # check if error
    if "data" not in data.keys():  return "ERROR: Device '" + device + "' does not exists."
        
    # add layout from template
    elif template in templates and data["data"] == []:
    
        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(modules.remotes+device_remote,data)
#       configFiles.write(modules.remotes + interface + "/" + device_code, data)
        return "OK: Template '" + template + "' added to '" + device + "'."
            
    # overwrite layout from template
    elif template in templates and data["data"] != []:

        data["data"]["remote"]           = templates[template]["remote"]
        configFiles.write(modules.remotes+device_remote,data)
#        configFiles.write(modules.remotes + interface + "/" + device_code, data)
        return "OK: Remote definition of '" + device + "' overwritten by template '" + template + "'."
        
    # template doesn't exist
    else:
        return "ERROR: Template '" + template + "' does't exists."

#---------------------------------------

def changeVisibility(device,visibility):
    '''
    change visibility in device configuration (yes/no)
    '''

    data = configFiles.read_status()
    
    if device not in data.keys():
        return "Device '" + device + "' does not exists."
        
    elif visibility == "yes" or visibility == "no":
        data[device]["visible"] = visibility
        configFiles.write_status(data,"changeVisibility")
        return "OK: Change visibility for '" + device + "': " + visibility
        
    else:
        return "ERROR: Visibility value '" + visibility + "' does not exists."


#---------------------------------------

def deleteDevice(device):
    '''
    delete device from json config file and delete device related files
    '''
    
    devices              = {}
    active_json          = configFiles.read_status()
    
    if device not in active_json: return "ERROR: Could not delete, device not available ("+device+")"
    
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["config_device"]  
    device_remote        = active_json[device]["config_remote"]  
    
    if not device in active_json:                                             return("ERROR: Device " + device + " doesn't exists (active).")
    if not modules.ifexist(modules.commands +interface+"/"+device_code):      return("ERROR: Device " + device + " doesn't exists (commands).")
    if not modules.ifexist(modules.remotes  +device_remote):    return("ERROR: Device " + device + " doesn't exists (remotes).") 
#    if not modules.ifexist(modules.remotes  +interface+"/"+device_code):    return("ERROR: Device " + device + " doesn't exists (remotes).") 

    interface = active_json[device]["interface"]  ############# funtioniert nicht so richtig ...
    for entry in active_json:
      if entry != device: 
        devices[entry] = active_json[entry]
        
    active_json = devices
    configFiles.write_status(active_json,"deleteDevice")

    try:    
#      modules.delete(modules.remotes  + interface + "/" + device_code)
      modules.delete(modules.remotes  + device_remote)
      modules.delete(modules.commands + interface + "/" + device_code)
      
#      if not modules.ifexist(modules.commands + interface + "/" + device_code) and not modules.ifexist(modules.remotes + interface + "/" + device_code):
      if not modules.ifexist(modules.commands + interface + "/" + device_code) and not modules.ifexist(modules.remotes + device_remote):
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
    active_json          = configFiles.read_status()
    if "ERROR" in active_json: return("ERROR: Device " + device + " doesn't exists (active).")
    
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["config_device"]  
    device_remote        = active_json[device]["config_remote"]  
    
    # read command definition
    commands             = configFiles.read(modules.commands +interface+"/"+device_code)
    if "ERROR" in commands: return("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes              = configFiles.read(modules.remotes +device_remote)
#    remotes              = configFiles.read(modules.remotes +interface+"/"+device_code)
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
    try:                    configFiles.write_status(active_json,"editDevice")
    except Exception as e:  
      logging.error("ERROR: could not write changes (active) - "+str(e))
      return("ERROR: could not write changes (active) - "+str(e))

    # write command definition
    try:                    configFiles.write(modules.commands +interface+"/"+device_code, commands)
    except Exception as e:
      logging.error("ERROR: could not write changes (commands) - "+str(e))
      return("ERROR: could not write changes (commands) - "+str(e))

    # write remote layout definition
    try:                    configFiles.write(modules.remotes +device_remote, remotes)
#    try:                    configFiles.write(modules.remotes +interface+"/"+device_code, remotes)
    except Exception as e:
      logging.error("ERROR: could not write changes (remotes) - "+str(e))
      return("ERROR: could not write changes (remotes) - "+str(e))

    if i > 0: return("OK: Edited device paramenters of "+device+" ("+str(i)+" changes)")
    else:     return("ERROR: no data key matched with keys from config-files ("+str(info.keys)+")")

      
#-----------------------------------------------

def moveDeviceScene(button_type,device,direction):
    '''
    move device or scene button, direction => -x steps backward / x steps forward
    '''
    
    if button_type == "device":  status = configFiles.read_status()
    elif button_type == "scene": status = configFiles.read(modules.active_scenes)
    else:                        return "ERROR: type "+button_type+" is unknown."
    
    # normalize position (required, if remotes have been deleted)
    order      = {}
    order_keys = []
    for key in status:
      pos = status[key]["position"]
      if pos < 10:    pos = "00" + str(pos)
      elif pos < 100: pos = "0" + str(pos)
      else:           pos = str(pos)
      order[pos] = key
      order_keys.append(pos)
      
    order_keys.sort()
    i=1
    for key in order_keys:
      status[order[key]]["position"] = i
      i += 1
    
    # start move
    position   = True
    direction  = int(direction)
    return_msg = ""
    
    # check if device is defined
    if device not in status:
      return "ERROR: "+button_type+" not defined."
    
    # check if position is defined and add, if not existing
    for key in status: 
      if not "position" in status[key]: 
        position = False
        
    i = 1
    if position == False:
       for key in status:
          status[key]["position"] = i
          i += 1
       if button_type == "device":  configFiles.write_status(status)
       elif button_type == "scene": configFiles.write(modules.active_scenes,status)
       
       return_msg = "WARN: Position wasn't existing. Has been set, please move again."
      
    # get position and move into direction
    else:
       i = 1
       for key in status: i += 1

       if status[device]["position"] + direction > 0 and status[device]["position"] + direction < i:
          old_position = status[device]["position"]
          new_position = status[device]["position"] + direction
         
          for key in status:
            if status[key]["position"] == new_position: status[key]["position"] = old_position
           
          status[device]["position"] = new_position
          return_msg = "OK. Moved "+device+" from "+str(old_position)+" to "+str(new_position)+"."
 
       else:
          return_msg = "WARN: Out of range."
         
    if button_type == "device":  configFiles.write_status(status)
    elif button_type == "scene": configFiles.write(modules.active_scenes,status)

    return return_msg


#-----------------------------------------------
# Read and set status
#-----------------------------------------------

def setStatus(device,key,value):
    '''
    change status and write to file
    '''

    status = configFiles.read_status()
        
    # set status
    if key == "":
        key = "power"
      
    if device in status:
        logging.debug("setStatus:"+key+"="+str(value))
        status[device]["status"][key] = value
        configFiles.write_status(status,"setStatus")
      
    else:
        logging.warn("setStatus: device does not exist ("+device+")")
        return "ERROR setStatus: device does not exist ("+device+")"
    
    return "TBC: setStatus: " + device + "/" + key + "/" + str(value)
    
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

    configFiles.write_status(status,"resetStatus")
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

    configFiles.write_status(status,"resetAudio")
    return "TBC: Reset AUDIO to 0 for devices without API"


#-----------------------------------------------

def setMainAudioDevice(device):
    '''
    set device as main audio device
    '''

    return_msg = ""
    status     = configFiles.read_status()
    
    if device in status:
       for key in status:
          if key == device: status[key]["main-audio"] = "yes"
          else:             status[key]["main-audio"] = "no"
       return_msg = "OK: Set "+device+" as main-audio device."
    else:
       return_msg = "ERROR: device not defined."

    configFiles.write_status(status,"resetAudio")
    return return_msg

#-----------------------------------------------
# Device status
#-----------------------------------------------

def devicesGetStatus(data,readAPI=False):
    '''
    read status data from config file (method=record) and/or device APIs (method=query)
    data -> data["DATA"]["devices"]
    '''

    devices = configFiles.read_status()
   
    for device in devices: 
    
        if "status" in devices[device] and "method" in data[device]:
          
          # get status values from config files
          for value in devices[device]["status"]:
              data[device]["status"][value] = devices[device]["status"][value]
               
          # request update of status from API -> will be written via "interface.py"
          if data[device]["method"] == "query" and readAPI == True:
          
              interface = data[device]["interface"]
              queueQuery.add2queue ([2])                                                 # wait a few seconds before queries
              queueQuery.add2queue ([[interface,device,data[device]["query_list"],""]])  # add querylist per device
   
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
        
        msg = setStatus(device,button,state)
        configFiles.cache_time = 0
        
        if "ERROR" in msg: return msg
        else:              return "OK"
        
    else:
        logging.warn("setButtonValue: Wrong method ("+method+","+device+","+button+")")
        return "ERROR: Wrong method ("+method+")"


#-------------------------------------------------
# Initialize cache, device API and queues
#-------------------------------------------------

configFiles       = modules.configCache("configFiles")
configFiles.start()

deviceAPIs        = interfaces.connect(configFiles)
deviceAPIs.start()

queueSend         = modules.queueApiCalls("queueSend", "send", deviceAPIs)
queueSend.start()

queueQuery        = modules.queueApiCalls("queueQuery","query",deviceAPIs)
queueQuery.config = configFiles
queueQuery.start()

#-------------------------------------------------
# EOF

