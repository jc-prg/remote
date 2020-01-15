#-----------------------------------
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

import modules.server_init   as init
import modules.rm3status     as rm3status
import modules.rm3json       as rm3json
import modules.rm3stage      as rm3stage
import modules.rm3config     as rm3config

from os import path
from Crypto.Cipher import AES

#---------------------------

rm_data        = {}  # new cache variable
rm_data_update = True
rm_data_last   = time.time()

Device   = {}
Real     = {}
devList  = {}
cmdList  = []
ErrorMsg   = ""
Status     = "Starting"
lastButton = ""

#---------------------------

if rm3stage.test: Stage = "Test Stage"
else:             Stage = "Prod Stage"

#---------------------------

def ErrorMsg(code):
    m = rm3config.error_messages
    return m[code]
    

#---------------------------
# read / write configuration NEW
#---------------------------

status_cache          = {}
status_cache_time     = 0
status_cache_interval = 5

#---------------------------

def readStatus(data):
    '''
    read status data from config file (method=record) and/or device APIs (method=query)
    '''

    global status_cache, status_cache_time, status_cache_interval #,rm_data
        
    if time.time() - status_cache_time >= 5 or status_cache_time == 0:
    
      devices    = rm3json.read(rm3config.devices + rm3config.active)    
      for device in devices:        
        if "status" in devices[device] and "method" in data[device]:
            
          if data[device]["method"] == "record":
            for value in devices[device]["status"]:
              data[device]["status"][value] = devices[device]["status"][value]
                
          else:
        
            for value in data[device]["query_list"]:
              try:
                test = interfaces.query(data[device]["interface"],device,value)
                devices[device]["status"][value]      = str(test)
                data[device]["status"][value]         = str(test)
                  
              except Exception as e:
                logging.error(str(e)+" / " + device + "-" + value + " : " + data[device]["interface"])
                               
      status_cache = devices
      rm3json.write(rm3config.devices + rm3config.active, devices)

    else:
      devices = status_cache
                
    status_cache_time = time.time()
    return data
     
#---------------------------

def translateStatusOld():
    '''
    create old view to status data for compartibility reasons
    -> to be removed
    '''

    global status_cache, rm_data
    status     = status_cache
    status_old = {}
        
    for device in status:
      if "status" in status[device] and device in rm_data["devices"]:
        if "method" in rm_data["devices"][device]:
           status_old[device + "_method"] = rm_data["devices"][device]["method"]
        for value in status[device]["status"]:
           status_old[device + "_" + value]        = status[device]["status"][value]
           if value == "power": status_old[device] = status[device]["status"][value]
           
    return status_old

    
#---------------------------

def RmReadData(selected=[]):
    '''Read all relevant data and create data structure'''

    global rm_data, rm_data_update, rm_data_last

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","queries","values"]

    # if update required
    if rm_data_update: 
        data["devices"] = rm3json.read(rm3config.devices + rm3config.active)
        data["scenes"]  = rm3json.read(rm3config.scenes  + rm3config.active)
        data["makros"]  = {}
    
        # read data for active devices
        for device in data["devices"]:
            if data["devices"][device]["interface"] != "":
              if selected == [] or device in selected:
	
                key        = data["devices"][device]["device"]
                interface  = data["devices"][device]["interface"]
                data_temp  = data["devices"][device]

                remote           = rm3json.read(rm3config.remotes  + interface + "/" + key) # remote layout & display
                buttons          = rm3json.read(rm3config.commands + interface + "/" + key) # button definitions, presets, queries ...
                
                # if default.json exists, add values to device specific values
                if rm3json.ifexist(rm3config.commands + interface + "/default"):   
                  buttons_default  = rm3json.read(rm3config.commands + interface + "/default")
               
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
                  data_temp["queries"]           = buttons["data"]["queries"]
                  data_temp["query_list"]        = list(buttons["data"]["queries"].keys())                 
                
                data_temp["buttons"]             = buttons["data"]["buttons"]
                data_temp["button_list"]         = list(buttons["data"]["buttons"].keys())
                                
                # REMOTE : get remote layout & display # logging.info(device)
                data_temp["description"]         = remote["data"]["description"]              
                data_temp["remote"]              = remote["data"]["remote"]

                if "display" in remote["data"]:   
                  data_temp["display"]           = remote["data"]["display"]              
                if "display-size" in remote["data"]:   
                  data_temp["display-size"]           = remote["data"]["display-size"]              
           
                data["devices"][device] = data_temp
 
        # read data for active scenes
        for scene in data["scenes"]:
            if data["scenes"][scene]["visible"] == "yes":
              if selected == [] or scene in selected:

                thescene      = rm3json.read(rm3config.scenes_def + scene)
           
                data["scenes"][scene]["remote"]             = thescene[scene]["remote"]
                data["scenes"][scene]["channel"]            = thescene[scene]["channel"]
                data["scenes"][scene]["devices"]            = thescene[scene]["devices"]
                data["scenes"][scene]["label"]              = thescene[scene]["label"]
           
        # read data for makros
        for makro in makros:        
            temp                      = rm3json.read(rm3config.makros + makro)
            data["makros"][makro]     = temp[makro]
                
        # read data for templates
        data["templates"]               = {}
        data["template_list"]           = {}
        if selected == []:
          templates                     = rm3json.available(rm3config.templates)
          for template in templates:    
            template_keys = template.split("/")
            template_key  = template_keys[len(template_keys)-1]
            template_data = rm3json.read(rm3config.templates + template)

            if "ERROR" in template_data:  data["templates"][template] = template_data
            else: 
              if template_key in template_data: data["templates"][template] = template_data[template_key]
              else:                             data["templates"][template] = { "ERROR" : "JSON file not correct, key missing: "+template_key }
              data["template_list"][template] = data["templates"][template]["description"]
        
            data["templates"][template]["file"] = template

        if selected == []:
          rm_data        = data
          rm_data_update = False         

    # if no update required
    else:
        data            = rm_data

    # Update status data        
    data["devices"] = readStatus(data["devices"])
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
    active_json         = rm3json.read(rm3config.devices + rm3config.active)
    
    if device in active_json:                                        return("WARN: Device " + device + " already exists (active).")
    if rm3json.ifexist(rm3config.commands +interface+"/"+device):    return("WARN: Device " + device + " already exists (devices).")
    if rm3json.ifexist(rm3config.remotes  +interface+"/"+device):    return("WARN: Device " + device + " already exists (remotes).") 
    
    logging.warn(device+" add")
    ## add to _active.json 
    active_json[device] = {
        "device"    : description,
        "image"     : device,
        "interface" : interface,
        "label"     : description,       # to be edited later
        "main-audio": "no",
        "status"    : {
            "power" : "OFF",
            },
        "visible"   : "yes"    	
        }
    try:
      rm3json.write(rm3config.devices + rm3config.active, active_json)
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
      rm3json.write(rm3config.commands + interface+"/"+description,buttons)
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
      rm3json.write(rm3config.remotes +interface+"/"+description,remote)
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

    config      = rm3json.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = rm3json.read(rm3config.commands+interface+"/"+device_code)
    
    if "data" in data:
        if button in data["data"]["buttons"].keys():
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            data["data"]["buttons"][button] = command
            rm3json.write(rm3config.commands+interface+"/"+device_code,data)
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

    config      = rm3json.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = rm3json.read(rm3config.remotes+interface+"/"+device_code)
    
    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            rm3json.write(rm3config.remotes+interface+"/"+device_code,data)
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

    config      = rm3json.read(rm3config.devices+rm3config.active)
    interface   = config[device]["interface"]  
    device_code = config[device]["device"]  
    data        = rm3json.read(rm3config.commands+interface+"/"+device_code)
    
    if data["data"]:
        if button in data["data"]["buttons"].keys():
        
            data["data"]["buttons"].pop(button,None)
            data = rm3json.write(rm3config.commands+interface+"/"+device_code,data)
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

    templates   = rm3json.read(rm3config.templates + template)
    config      = rm3json.read(rm3config.devices + rm3config.active)
    interface   = config[device]["interface"]
    device_code = config[device]["device"]
    data       = rm3json.read(rm3config.remotes + interface + "/" + device_code)

    # check if error
    if "data" not in data.keys():  return "ERROR: Device '" + device + "' does not exists."
        
    # add layout from template
    elif template in templates and data["data"] == []:
    
        data["data"]["remote"]           = templates[template]["remote"]
        rm3json.write(rm3config.remotes + interface + "/" + device_code, data)
        return "OK: Template '" + template + "' added to '" + device + "'."
            
    # overwrite layout from template
    elif template in templates and data["data"] != []:

        data["data"]["remote"]           = templates[template]["remote"]
        rm3json.write(rm3config.remotes + interface + "/" + device_code, data)
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
    
    data = rm3json.read(rm3config.devices + rm3config.active)
    
    if device not in data.keys():
        return "Device '" + device + "' does not exists."
        
    elif visibility == "yes" or visibility == "no":
        data[device]["visible"] = visibility
        rm3json.write(rm3config.devices + rm3config.active, data)
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
    active_json          = rm3json.read(rm3config.devices + rm3config.active)
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
    rm3json.write(rm3config.devices + rm3config.active, active_json)

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
    active_json          = rm3json.read(rm3config.devices + rm3config.active)
    if "ERROR" in active_json: return("ERROR: Device " + device + " doesn't exists (active).")
    
    interface            = active_json[device]["interface"]
    device_code          = active_json[device]["device"]  
    
    # read command definition
    commands             = rm3json.read(rm3config.commands +interface+"/"+device_code)
    if "ERROR" in commands: return("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes              = rm3json.read(rm3config.remotes +interface+"/"+device_code)
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
    try:                    rm3json.write(rm3config.devices + rm3config.active, active_json)
    except Exception as e:  return("ERROR: could not write changes (active) - "+str(e))

    # write command definition
    try:                    rm3json.write(rm3config.commands +interface+"/"+device_code, commands)
    except Exception as e:  return("ERROR: could not write changes (commands) - "+str(e))

    # write remote layout definition
    try:                    rm3json.write(rm3config.remotes +interface+"/"+device_code, remotes)
    except Exception as e:  return("ERROR: could not write changes (remotes) - "+str(e))

    if i > 0: return("OK: Edited device paramenters of "+device+" ("+str(i)+" changes)")
    else:     return("ERROR: no data key matched with keys from config-files ("+str(info.keys)+")")
      
#---------------------------
     
def remoteAPI_start(setting=[]):
    '''
    create data structure for API response and read relevant data from config files
    '''

    global Status, lastButton
    
    data                                   = init.dataInit() 
    data["DATA"]                           = RmReadData(setting)
    
    data["CONFIG"]                         = {}  
    data["CONFIG"]["button_images"]        = rm3json.read(rm3stage.icons_dir + "/index")
    data["CONFIG"]["button_colors"]        = rm3json.read(rm3config.buttons  + "button_colors")
    data["CONFIG"]["interfaces"]           = interfaces.available
    data["CONFIG"]["methods"]              = interfaces.methods
    
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()
    data["REQUEST"]["Button"]              = lastButton 

    data["STATUS"]                         = {}
    data["STATUS"]["devices"]              = translateStatusOld()  # -> to be replaced
    data["STATUS"]["last_button"]          = lastButton
    data["STATUS"]["system"]               = {} #  to be filled in remoteAPI_end()

    #--------------------------------
    
    if "no-data" in setting:   data["DATA"]   = {}
    if "no-config" in setting: data["CONFIG"] = {}
        
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
    return data


#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteReload():
        '''
        reload interfaces and reload config data in cache
        '''
        
        global rm_data_update
        
        interfaces.init()
        rm_data_update = True
        
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
            data["ReturnMsg"]    = "OK: "+ErrorMsg("800")
        elif (APPversion in rm3config.APPsupport):
            data["ReturnCode"]   = "801"
            data["ReturnMsg"]    = "WARN: "+ErrorMsg("801")
        else:
            data["ReturnCode"]   = "802"
            data["ReturnMsg"]    = "WARN: "+ErrorMsg("802")


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
        
        global status_cache_time
        status_cache_time = 0

        data                      = remoteAPI_start(["no-data"])
        interface                 = rm_data["devices"][device]["interface"]
        
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Return"] = interfaces.send(interface,device,button)
        
        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"]      = rm3status.getStatus(device)  # to be removed
        data["ReturnMsg"]         = data["REQUEST"]["Return"]    # to be removed
        data                      = remoteAPI_end(data)      
        
        return data


#-------------------------------------------------

def RemoteMakro(makro):
        '''
        send makro (list of commands)
        '''

        global status_cache_time
        status_cache_time = 0

        data                      = remoteAPI_start(["no-data"])
      
        data["REQUEST"]["Button"] = makro
        data["REQUEST"]["Return"] = "ERROR: not implemented yet." #interfaces.send(interface,device,button)

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
        
        interfaces.test()
        
        return data


#-------------------------------------------------

def RemoteOnOff(device,button):
        '''
        check old status and document new status
        '''

        global status_cache_time
        status_cache_time = 0

        data            = remoteAPI_start()    
        interface       = data["DATA"]["devices"][device]["interface"]
        
        # Get method and presets
        if "method"  in data["DATA"]["devices"][device]:  method  = data["DATA"]["devices"][device]["method"]
        else:                                             method  = "record"
        if "values"  in data["DATA"]["devices"][device]:  presets = data["DATA"]["devices"][device]["values"]
        else:                                             presets = {}
        
        # delete DATA (less data to be returned via API)
        data["DATA"]    = {}
        
############### need for action ##
 # - if multiple values, check definition
 # - if volume, check minimum and maximum

        # if recorded values, check against status quo
        if method == "record":
          logging.info("RemoteOnOff: " +device+"/"+button+" ("+interface+"/"+method+")")
        
          # for device with only 1 button for ON and OFF
          if button == "on-off":
             devStat = rm3status.getStatus(device)
           
             if devStat == "OFF":   rm3status.setStatus(device,"ON")
             else:                  rm3status.setStatus(device,"OFF")

          # for device with diffent buttons for ON an OFF
          elif button == "on":      rm3status.setStatus(device,"ON")
          elif button == "off":     rm3status.setStatus(device,"OFF")

          # TV - change mode between TV and Radio (specific for Authors receiver from TOPFIELD!)
          elif button == "radiotv":
             devButton = device+"_"+button
             devStat   = rm3status.getStatus(devButton)
             if devStat == "TV":
                 rm3status.setStatus(devButton,"RADIO")
                 print(devButton+":"+devStat+"-RADIO")
             else:
                 rm3status.setStatus(devButton,"TV")
                 print(devButton+":"+devStat+"-TV")

          # change mute on/off
          elif button == "mute":
             devButton = device+"_"+button
             devStat   = rm3status.getStatus(devButton)
             if devStat == "ON":   rm3status.setStatus(devButton,"OFF")
             else:                 rm3status.setStatus(devButton,"ON")

          # document volume
          elif button == "vol+" or button == "vol-":
             devButton = device+"_vol"
             devStat   = int(rm3status.getStatus(devButton)) # has to be a number
             
             if button == "vol-" and devStat > 0:
                 devStat -= 1
             if button == "vol+" and devStat < 69:  # max base on receiver -> change to setting per device
                 devStat += 1
               
             rm3status.setStatus(devButton,devStat)
             
        # if values via API, no additional need for checks (as done by API ...)
        elif method == "query":
          logging.info("RemoteOnOff: " +device+"/"+button+" ("+interface+"/"+method+")")
        
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Return"]    = interfaces.send(interface,device,button)
        data                         = remoteAPI_end(data)        

        if "ERROR" in data["REQUEST"]["Return"]: logging.error(data["REQUEST"]["Return"])

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteReset():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = rm3status.resetStatus()
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteResetAudio():
        '''
        set status of all devices to OFF and return JSON msg
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = rm3status.resetAudio()
        data                         = remoteAPI_end(data)        

        rm_data_update = True
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
        data                         = remoteAPI_end(data)
        
        rm_data_update = True
        return data

#-------------------------------------------------

def RemoteRecordCommand(device,button):
        '''
        Learn Button and safe to init-file
        '''

        data                         = remoteAPI_start()
        interface                    = data["DATA"]["devices"][device]["interface"]
        data["DATA"]                 = {}
        
        EncodedCommand               = interfaces.record(interface,device,button)
        data["REQUEST"]["Return"]    = addCommand2Button(device,button,EncodedCommand)       
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data                         = remoteAPI_end(data)
        
        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteDeleteButton(device,button):
        '''delete button from layout file
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = deleteCmd(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button
        data                         = remoteAPI_end(data)        

        rm_data_update = True
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
        data                         = remoteAPI_end(data)        

        rm_data_update = True
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
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data

        
#-------------------------------------------------

def RemoteDeleteDevice(device):
        '''
        delete device from config file and delete device related files
        '''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = deleteDevice(device)
        data["REQUEST"]["Device"]    = device
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------
# EOF

