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

rm_data  = {}  # new cache variable
Device   = {}
Real     = {}
devList  = {}
cmdList  = []
ErrorMsg   = ""
Status     = "Starting"
lastButton = ""

if rm3stage.test: Stage = "Test Stage"
else:             Stage = "Prod Stage"


def test_cmd():
    return rm3json.read( "server" )

#---------------------------

def ErrorMsg(code):
    m = {
          "200" : "OK",
          "800" : "Your app is up to date.",
          "801" : "Update available: " + rm3config.APPversion + ".",
          "802" : "Update required: "  + rm3config.APPversion + ". Delete your browser cache, please.",
        }
    return m[code]

#---------------------------

def dataInit():
    d = { "API"          : "RM3",
          "API-version"  : APIversion,
          "API-stage"    : Stage,
          "StatusMsg"    : "Started",
          "ReturnMsg"    : "",
          "DeviceConfig" : [] }
    return d
    
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

def RmReadData(selected=""):
    '''Read all relevant data and create data structure'''

    global rm_data

    data    = {}
    makros  = ["dev-on","dev-off","scene-on","scene-off","makro"]
    btnfile = ["buttons","status","values"]
    
    data["devices"] = rm3json.read("devices/_active")
    data["scenes"]  = rm3json.read("scenes/_active")
    data["makros"]  = {}
    
    # read data for active devices
    for device in data["devices"]:
        if data["devices"][device]["visible"] == "yes":
          if selected == "" or selected == device:

            key       = data["devices"][device]["device"]
            interface = data["devices"][device]["interface"]
            buttons   = rm3json.read("devices/"+interface+"/"+key)
            remote    = rm3json.read("remotes/"+interface+"/"+key)
           
            buttons_default  = rm3json.read("devices/"+interface+"/default")
            if not "ERROR" in buttons_default:
              for x in btnfile:
                if x in buttons_default["default"]:
                  for y in buttons_default["default"][x]:
                    buttons[key][x][y] = buttons_default["default"][x][y]

           
            data_temp = data["devices"][device]

            if interface in remote[key]["status"]:  data_temp["status"]["method"]  = remote[key]["status"][interface]
            else:                                   data_temp["status"]["method"]  = "undefined"
            if "presets" in remote[key]:            data_temp["status"]["presets"] = remote[key]["presets"]
             
            data_temp["buttons"]             = buttons[key]["buttons"]
            data_temp["description"]         = remote[key]["description"]
            data_temp["remote"]              = remote[key]["remote"]
           
            data["devices"][device] = data_temp

    # read data for active scenes
    for scene in data["scenes"]:
        if data["scenes"][scene]["visible"] == "yes":
          if selected == "" or selected == scene:

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
    if selected == "":
      templates                     = rm3json.available("templates")
      for template in templates:    
        template_keys = template.split("/")
        template_key  = template_keys[len(template_keys)-1]
        template_data = rm3json.read("templates/"+template)

        if "ERROR" in template_data:  data["templates"][template] = template_data
        else: 
          if template_key in template_data: data["templates"][template] = template_data[template_key]
          else:                             data["templates"][template] = { "ERROR" : "JSON file not correct, key missing: "+template_key }
        
        data["templates"][template]["file"] = "templates/"+template

    if selected == "": rm_data = data
    return data


#---------------------------
# add / delete devices & buttons to config
#---------------------------

def varsAddDev_json(device,description):
    '''add new device to config file or change existing'''

    if rm3json.ifexist("devices/"+device):    
        return("Device " + device + " already exists.")

    else:
        index = readDataJson("index")
        index["devices"].append(device)
        writeDataJson("index","",index)
        
        data                             = {}
        data[device]                     = {}
        data[device]["label"]            = description
        data[device]["description"]      = description
        data[device]["image"]            = ""
        data[device]["visibility"]       = "block"
        data[device]["audio"]            = ""
        data[device]["driver"]           = ""
        data[device]["buttons"]          = {}
        data[device]["remote"]           = []
        data[device]["status"]           = {
            "on-off": {  "list": ["ON","OFF"],           "value": "OFF"      },
            "mute"  : {  "list": ["MUTE_ON","MUTE_OFF"], "value": "MUTE_OFF" },
            "vol"   : {	 "max" : 0,  "value": 0,  "min":   0 }
            }
            
        writeDataJson("devices",device,data)
        
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
# get device data
#---------------------------

def getDeviceData():

     data = {}
     temp = getConfigData(data)

     data["DeviceConfig"]   = temp["DeviceConfig"]
     data["DeviceTemplate"] = temp["DeviceTemplate"] 
    
     return data

#---------------------------
     
def remoteAPI_start(setting=[]):

    global Status, lastButton

    data                                      = init.dataInit() 


    #data["DATA"]   = readDataJsonAll() #"no-buttons"
    data["DATA"]   = RmReadData("")

    
    data["CONFIG"]                          = {}  
    data["CONFIG"]["button_images"]         = rm3json.read("buttons/button_images")
    data["CONFIG"]["button_colors"]         = rm3json.read("buttons/button_colors")

    
    data["REQUEST"]                        = {}
    data["REQUEST"]["start-time"]          = time.time()

    data["STATUS"]                         = {}
    #data["STATUS"]["devices"]              = rm3json.read("status")
    data["STATUS"]["devices"]              = rm3status.readStatusOld()
    data["STATUS"]["last_button"]          = lastButton
    data["STATUS"]["system"]               = Status

    # Stay compartible for a while    
    #--------------------------------
    data["DeviceConfig"]                   = {}
    data["DeviceConfig"]["button_images"]  = data["CONFIG"]["button_images"]
    data["DeviceConfig"]["button_colors"]  = data["CONFIG"]["button_colors"]
    data["DeviceConfig"]["devices"]        = data["DATA"]["devices"]
    data["DeviceConfig"]["device_makros"]  = data["DATA"]["makros"]
    data["DeviceConfig"]["scene_remotes"]  = data["DATA"]["scenes"]
    data["DeviceConfig"]["device_status"]  = data["STATUS"]["devices"]
    
    data["DeviceTemplate"]                 = data["DATA"]["templates"]

    data["StatusMsg"]                      = Status
    data["Button"]                         = lastButton 
    #--------------------------------
    
    if "no-data" in setting:   data["DATA"]   = {}
    if "no-config" in setting: data["CONFIG"] = {}
        
    return data
    

#-------------------------------------------------

def remoteAPI_end(data):

    data["REQUEST"]["load-time"] = time.time() - data["REQUEST"]["start-time"]
    data["STATUS"]["system"]        = {
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
        data = remoteAPI_start(["no-data"])
        data["ReturnMsg"]    = "Configuration reloaded"
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

        data = remoteAPI_end(data)
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
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Return"] = interfaces.send("BROADLINK",device,button)

        data["DeviceStatus"]      = rm3status.getStatus(device)
        data["ReturnMsg"]         = data["REQUEST"]["Return"]
        data                      = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteTest():
        '''Test new functions'''

        data                      = remoteAPI_start(["no-data"])
        data["TEST"]              = RmReadData("")
        data                      = remoteAPI_end(data)        
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

        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Return"] = interfaces.send("BROADLINK",device,button)

        data["DeviceStatus"]      = rm3status.getStatus(device)
        data["ReturnMsg"]         = data["REQUEST"]["Return"]
        
        data                      = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteReset():
        '''set status of all devices to OFF and return JSON msg'''

        data               = remoteAPI_start(["no-data"])
        rm3status.resetStatus()
        data["ReturnMsg"]  = "Reset all devices to OFF"
        data               = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteResetAudio():
        '''set status of all devices to OFF and return JSON msg'''

        data               = remoteAPI_start(["no-data"])
        rm3status.resetAudio()
        data["ReturnMsg"]  = "Reset all devices to OFF"
        data               = remoteAPI_end(data)        
        return data


#-------------------------------------------------

def RemoteAddButton(device,button):
        '''Learn Button and safe to init-file'''

        data                      = remoteAPI_start(["no-data"])
        EncodedCommand            = interfaces.record("BROADLINK",device,button)
        data["REQUEST"]["Return"] = varsAddCmd_json(device,button,EncodedCommand)
        data                      = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteDeleteButton(device,button):
        '''Learn Button and safe to init-file'''

        data               = remoteAPI_start(["no-data"])
        data["ReturnMsg"]  = varsDeleteCmd_json(device,button)
        data               = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteChangeVisibility(device,value):
        '''Add device and save'''

        data                = remoteAPI_start(["no-data"])
        data["ReturnMsg"]   = varsChangeVisibility_json(device,value)
        data["Device"]      = device
        data["Description"] = value
        data                = remoteAPI_end(data)        
        return data
        
#-------------------------------------------------

def RemoteAddDevice(device,description):
        '''Add device and save'''

        data                = remoteAPI_start(["no-data"])
        data["ReturnMsg"]   = varsAddDev_json(device,description)
        data["Device"]      = device
        data["Description"] = description
        data                = remoteAPI_end(data)        
        return data

#-------------------------------------------------

def RemoteAddTemplate(device,template):
        '''Add / overwrite remote template'''

        data                = remoteAPI_start(["no-data"])
        data["ReturnMsg"]   = varsAddTemplate_json(device,template)
        data["Device"]      = device
        data["Description"] = template
        data                = remoteAPI_end(data)        
        return data
        
#-------------------------------------------------

def RemoteDeleteDevice(device):
        '''Delete Button from init-file'''

        data                = remoteAPI_start(["no-data"])
        data["ReturnMsg"]   = varsDeleteDev_json(device)
        data["Device"]      = device
        data                = remoteAPI_end(data)        
        return data


#-------------------------------------------------
# EOF

