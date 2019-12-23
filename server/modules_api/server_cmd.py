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

import interfaces.broadlink.broadlink as broadlink
import interfaces.broadlink_api       as broadlink_api
import interfaces.interfaces          as interfaces

import modules_api.server_init        as init

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
# read / write configuration
#---------------------------

def readDataJson(category, entry=""):

    if entry == "":  filename = category
    else:            filename = category + "/" + entry
    data = rm3json.read(filename)
    return data

# ---

def readDataJsonAll(setting=""):

    index = readDataJson("index")
    data  = {}
    
    for key in index:
      data[key] = {}
      for entry in index[key]:
        temp = readDataJson(key,entry)
        data[key][entry] = temp[entry]
        if setting == "no-buttons" and "buttons" in data[key][entry]: data[key][entry]["buttons"] = {}
        
    return data

# ---

def writeDataJson(category, entry, data):

    if entry == "":  filename = category
    else:            filename = category + "/" + entry
    
    logging.info("writeDataJSON: "+filename)
    data = rm3json.write(filename, data)
    return
    
# ---

def writeDataJsonAll(data):

    index = {}

    for key in data:
      index[key] = []
      for entry in data[key]:
        index[key].push(entry)
        temp = {}
        temp[entry] = data[key][entry]
        writeDataJson(key,entry,temp)
        
    writeDataJson("index","",index)
    return


#---------------------------
# read / write configuration NEW
#---------------------------

def RmReadData(selected=[]):
    '''Read all relevant data and create data structure'''

    global rm_data, rm_data_update, rm_data_last

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","queries","values"]

    # if update required
    if rm_data_update: 
        data["devices"] = rm3json.read("devices/_active")
        data["scenes"]  = rm3json.read("scenes/_active")
        data["makros"]  = {}
    
        # read data for active devices
        for device in data["devices"]:
            if data["devices"][device]["visible"] == "yes":
              if selected == [] or device in selected:

                key       = data["devices"][device]["device"]
                interface = data["devices"][device]["interface"]
                buttons   = rm3json.read("devices/"+interface+"/"+key)
                remote    = rm3json.read("remotes/"+interface+"/"+key)
                data_temp = data["devices"][device]
                
                if interface in remote[key]["status"]:  data_temp["method"]  = remote[key]["status"][interface]
                else:                                   data_temp["method"]  = "undefined"
                if "presets" in remote[key]:            data_temp["presets"] = remote[key]["presets"]

                buttons_default  = rm3json.read("devices/"+interface+"/default")
                if not "ERROR" in buttons_default:
                  for x in btnfile:
                    if x in buttons_default["default"]:
                      for y in buttons_default["default"][x]:
                        buttons[key][x][y] = buttons_default["default"][x][y]
           
                if "queries" in buttons[key]:
                  data_temp["queries"]           = buttons[key]["queries"]
                  data_temp["query_list"]        = list(buttons[key]["queries"].keys())
                  
                data_temp["buttons"]             = buttons[key]["buttons"]
                data_temp["description"]         = remote[key]["description"]              
                data_temp["button_list"]         = list(buttons[key]["buttons"].keys())
                data_temp["remote"]              = remote[key]["remote"]
           
                data["devices"][device] = data_temp
 
        # read data for active scenes
        for scene in data["scenes"]:
            if data["scenes"][scene]["visible"] == "yes":
              if selected == [] or scene in selected:

                thescene      = rm3json.read("scenes/"+scene)
           
                data["scenes"][scene]["remote"]             = thescene[scene]["remote"]
                data["scenes"][scene]["channel"]            = thescene[scene]["channel"]
                data["scenes"][scene]["devices"]            = thescene[scene]["devices"]
                data["scenes"][scene]["label"]              = thescene[scene]["label"]
           
        # read data for makros
        for makro in makros:        
            data["makros"][makro]     = rm3json.read("makros/"+makro)
                
        # read data for templates
        data["templates"]               = {}
        data["template_list"]           = {}
        if selected == []:
          templates                     = rm3json.available("templates")
          for template in templates:    
            template_keys = template.split("/")
            template_key  = template_keys[len(template_keys)-1]
            template_data = rm3json.read("templates/"+template)

            if "ERROR" in template_data:  data["templates"][template] = template_data
            else: 
              if template_key in template_data: data["templates"][template] = template_data[template_key]
              else:                             data["templates"][template] = { "ERROR" : "JSON file not correct, key missing: "+template_key }
              data["template_list"][template] = data["templates"][template]["description"]
        
            data["templates"][template]["file"] = "templates/"+template

        if selected == []:
          rm_data        = data
          rm_data_update = False         

    # if no update required
    elif selected == []: 
        data       = rm_data
        devices    = rm3json.read("devices/_active")
        #scenes     = rm3json.read("scenes/_active")
        
        for device in devices:        
          if "status" in devices[device] and device != "default":
            
            if data["devices"][device]["method"] == "record":
              for value in devices[device]["status"]:
                data["devices"][device]["status"][value] = devices[device]["status"][value]
                
            elif time.time() - rm_data_last > 5:
              for value in data["devices"][device]["query_list"]:
                try:
                  test = interfaces.query(data["devices"][device]["interface"],device,value)
                  data["devices"][device]["status"][value] = test[1]
                  devices[device]["status"][value]         = test[1]
                  
                except Exception as e:
                  logging.error(e)
                
              rm3json.write("devices/_active",devices)
              rm_data_last = time.time()
                
                #####
                # check, if combined command helps to reduce requests
              
#### Device Status - request from API if method = "query"
#
#        for scene in scenes:
#          if "status" in scenes[scene]:
#            for value in scenes[scene]["status"]:
#              data["scenes"][scene]["status"][value] = scenes[scene]["status"][value]
              
        rm_data = data
    
    return data


#---------------------------
# add / delete devices & buttons to config
#---------------------------

def addDevice(device,interface,description):
    '''add new device to config file or change existing'''
    
    global rm_data_update

    ## Check if exists    
    active_json          = rm3json.read("devices/_active")
    if device in active_json:                               return("Device " + device + " already exists (active).")
    if rm3json.ifexist("devices/"+interface+"/"+device):    return("Device " + device + " already exists (devices).")
    if rm3json.ifexist("remotes/"+interface+"/"+device):    return("Device " + device + " already exists (remotes).") 
    
    ## add to _active.json 
    active = {
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
    active_json[device]  = active
    rm3json.write("devices/_active",active_json)
    
    ## add to devices = button definitions
    buttons = {
        description : {
            "description" : description,
            "buttons"     : {},
            "presets"     : {}
            }
        }
    rm3json.write("devices/"+interface+"/"+description,buttons)

    ## add to remotes = button layout
    remote = {
        description : {
           "description" : description,
           "api"         : [ interface ],
           "status"      : {
               interface : "record"      # options: record, query (editing via ui not implemented yet)
               },
           "remote"      : []
           }
        }    
    rm3json.write("remotes/"+interface+"/"+description,remote)
            
    rm_data_update = True
    return("Device " + device + " added.")


#---------------------------------------
# add vars to config JSON (buttons & devices)
#---------------------------------------

def varsAddCmd_json(device,button,command):
    '''add new button to config file or change existing'''

    data = readDataJson("devices",device)
    if device in data:
        if button in data[device]["buttons"].keys():
            return "Button '" + device + "_" + button + "' already exists."
        else:
            data[device]["buttons"][button] = command
            writeDataJson("devices",device,data)
            return "Button '" + device + "_" + button + "' recorded and saved: " + command
    else:
        return "Device '" + device + "' does not exists."

#---------------------------------------

def varsDeleteCmd_json(device, button):
    '''delete button from json config file'''

    data = readDataJson("devices",device)
    if data[device]:
        if button in data[device]["buttons"].keys():
            data[device]["buttons"].pop(button,None)
            writeDataJson("devices",device,data)
            return "Button '" + device + "_" + button + "' deleted."
        else:
            return "Button '" + device + "_" + button + "' does not exist."
    else:
        return "Device '" + device + "' does not exist."

#---------------------------------------

def varsAddTemplate_json(device,template):
    '''add / overwrite remote definition by template'''

    templates = readDataJson("templates",template) #rm3json.read("remote-templates")
    data      = readDataJson("devices",device)     #rm3json.read("devices")
    if device not in data.keys():

        return "Device '" + device + "' does not exists."
        
    elif template in templates and data[device] == []:
    
        data[device]["remote"]           = templates[template]["remote"]
        #rm3json.write("devices",data)
        writeDataJson("devices",device,data)
        return "Template '" + template + "' added to '" + device + "'."
        
    elif template in templates and data[device] != []:

        data[device]["remote"]           = templates[template]["remote"]
        #rm3json.write("devices",data)
        writeDataJson("devices",device,data)
        return "Remote definition of '" + device + "' overwritten by template '" + template + "'."
        
    else:

        return "Template '" + template + "' does not exists."

#---------------------------------------

def varsChangeVisibility_json(device,visibility):
    '''add / overwrite remote definition by template'''

    data = readDataJson("devices",device)
    
    if device not in data.keys():
        return "Device '" + device + "' does not exists."
        
    elif visibility == "block" or visibility == "none":
        data[device]["visibility"]           = visibility
        writeDataJson("devices",device,data)
        return "Change visibility for '" + device + "'."
        
    else:
        return "Visibility value '" + visibility + "' does not exists."


#---------------------------------------

def varsDeleteDev_json(device):
    '''delete device from json config file'''

    devices = []
    index   = readDataJson("index")
    for entry in index["devices"]:
      if entry != device: 
        devices.append(entry)
    if device == index["devices"]:
        return "Device '" + device + "' does not exist."
        
    index["devices"] = devices
    writeDataJson("index","",index)

    try:    
      rm3json.delete("devices/"+device)
      return "Device '" + device + "' deleted."
    except Exception as e:
      return "Could not delete device '" + device + "': " + str(e)


#---------------------------
     
def remoteAPI_start(setting=[]):

    global Status, lastButton

    data                                   = init.dataInit() 
    data["DATA"]                           = RmReadData(setting)
    
    data["CONFIG"]                         = {}  
    data["CONFIG"]["button_images"]        = rm3json.read("buttons/button_images")
    data["CONFIG"]["button_colors"]        = rm3json.read("buttons/button_colors")
    data["CONFIG"]["interfaces"]           = interfaces.available
    
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()
    data["REQUEST"]["Button"]              = lastButton 

    data["STATUS"]                         = {}
    data["STATUS"]["devices"]              = rm3status.readStatusOld()  # -> to be replaced
    data["STATUS"]["last_button"]          = lastButton
    data["STATUS"]["system"]               = {} #  to be filled in remoteAPI_end()

    #--------------------------------
    
    if "no-data" in setting:   data["DATA"]   = {}
    if "no-config" in setting: data["CONFIG"] = {}
        
    return data
    

#-------------------------------------------------

def remoteAPI_end(data):

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

        initDevice()
        data                          = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]     = "Configuration reloaded"
        data                          = remoteAPI_end(data)
        return data

#-------------------------------------------------
# Reload data
#-------------------------------------------------

def RemoteCheckUpdate(APPversion):
        '''Check if app is supported by this server version'''

        data = remoteAPI_start(["no-data"])

        if (APPversion == rm3config.APPversion):
            data["ReturnCode"]   = "800"
            data["ReturnMsg"]    = ErrorMsg("800")
        elif (APPversion in rm3config.APPsupport):
            data["ReturnCode"]   = "801"
            data["ReturnMsg"]    = ErrorMsg("801")
        else:
            data["ReturnCode"]   = "802"
            data["ReturnMsg"]    = ErrorMsg("802")


        data["REQUEST"]["Return"]     = data["ReturnMsg"]
        data["REQUEST"]["ReturnCode"] = data["ReturnCode"]
        data                          = remoteAPI_end(data)
        return data

#-------------------------------------------------
# List all defined commands / buttons
#-------------------------------------------------

def RemoteList():
        '''Load and list all data'''

        data = remoteAPI_start()
        data = remoteAPI_end(data)        
        return data


#-------------------------------------------------
# main functions for API
#-------------------------------------------------

def Remote(device,button):
        '''send IR command and return JSON msg'''

        data                      = remoteAPI_start(["no-data"])
        interface                 = rm_data["devices"][device]["interface"]
        
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Return"] = interfaces.send(interface,device,button)

        data["DeviceStatus"]      = rm3status.getStatus(device)
        data["ReturnMsg"]         = data["REQUEST"]["Return"]
        data                      = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteTest():
        '''Test new functions'''

        data                      = remoteAPI_start(["no-data"])
        data["TEST"]              = RmReadData("")
        data["REQUEST"]["Return"] = "Test: show complete data structure"
        data                      = remoteAPI_end(data)        
        
        interfaces.test()
        
        return data


#-------------------------------------------------

def RemoteOnOff(device,button):
        '''check old and document new status'''

        data = remoteAPI_start(["no-data"])

############### need for action ##
 # - if api
 # - if multiple values, check definition
 # - if volume, check minimum and maximum


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
           #
           print(rm3status.getStatus(devButton))
           #
           devStat   = int(rm3status.getStatus(devButton)) # has to be a number
           if button == "vol-" and devStat > 0:
               devStat -= 1
           if button == "vol+" and devStat < 69:  # max base on receiver -> change to setting per device
               devStat += 1
               
           rm3status.setStatus(devButton,devStat)

        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data["REQUEST"]["Return"]    = interfaces.send("BROADLINK",device,button)
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteReset():
        '''set status of all devices to OFF and return JSON msg'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = rm3status.resetStatus()
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteResetAudio():
        '''set status of all devices to OFF and return JSON msg'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = rm3status.resetAudio()
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteAddButton(device,button):
        '''Learn Button and safe to init-file'''

        data                         = remoteAPI_start(["no-data"])
        EncodedCommand               = interfaces.record("BROADLINK",device,button)
        data["REQUEST"]["Return"]    = varsAddCmd_json(device,button,EncodedCommand)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Button"]    = button
        data                         = remoteAPI_end(data)
        
        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteDeleteButton(device,button):
        '''Learn Button and safe to init-file'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = varsDeleteCmd_json(device,button)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = button
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteChangeVisibility(device,value):
        '''Add device and save'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = varsChangeVisibility_json(device,value)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = value
        data                         = remoteAPI_end(data)        
        return data

        
#-------------------------------------------------

def RemoteAddDevice(device,interface,description):
        '''Add device and save'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = addDevice(device,interface,description)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = description
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------

def RemoteAddTemplate(device,template):
        '''Add / overwrite remote template'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = varsAddTemplate_json(device,template)
        data["REQUEST"]["Device"]    = device
        data["REQUEST"]["Parameter"] = template
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data

        
#-------------------------------------------------

def RemoteDeleteDevice(device):
        '''Delete Button from init-file'''

        data                         = remoteAPI_start(["no-data"])
        data["REQUEST"]["Return"]    = varsDeleteDev_json(device)
        data["REQUEST"]["Device"]    = device
        data                         = remoteAPI_end(data)        

        rm_data_update = True
        return data


#-------------------------------------------------
# EOF

