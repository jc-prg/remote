#-----------------------------------------------
# read / write device status from config file
#-----------------------------------------------
# (c) Christoph Kloth
#-----------------------------------------------

import logging
import modules.rm3json        as rm3json
import modules.rm3config      as rm3config
import interfaces.interfaces  as interfaces

#-----------------------------------------------

configFile    = rm3config.devices + rm3config.active
configMethods = {}

#-----------------------------------------------

def translateDevice(device):

    status = rm3json.read(configFile)
    if device in status: return status[device]["device"]
    else:                return ""
    
#-----------------------------------------------

def readStatus(selected_device=""):
    '''read and return array'''

    status = rm3json.read(configFile)
    
    # initial load of methods (record vs. query)
    if configMethods == {} and selected_device == "":
      for device in status:
        key                   = status[device]["device"]
        interface             = status[device]["interface"]
        
        if interface != "" and key != "":
          config = rm3json.read(rm3config.commands + interface + "/" + key)
          if not "ERROR" in config:
            configMethods[device] = config["data"]["method"]
    
    # if device is given
    if selected_device != "" and selected_device in status and "status" in status[selected_device]:
      status = status[selected_device]["status"]
      
    return status
    
#-----------------------------------------------

def readStatusOld():

    status     = readStatus()
    status_old = {}
    for device in status:
      if "visible" in status[device] and status[device]["visible"] == "yes":
       if "status" in status[device]:
        status_old[device + "_method"] = configMethods[device]
        for value in status[device]["status"]:
           status_old[device + "_" + value]        = status[device]["status"][value]
           if value == "power": status_old[device] = status[device]["status"][value]
    return status_old

#-----------------------------------------------

def writeStatus(status):
    '''write status'''

    rm3json.write(configFile,status)

#-----------------------------------------------

def setStatus(name,value):
    '''change status and write to file'''

    status      = readStatus()
    name_split  = name.split("_")
    
    device      = name_split[0]
    device_code = translateDevice(device)
    if len(name_split) == 1 or name_split[1] == "": name = "power"
        
    status[device]["status"][name] = value
    writeStatus(status)
    
    return "Set status " + name + "/" + value
    
#-----------------------------------------------

def resetStatus():
    '''set status for all devices to OFF'''

    status = readStatus()
    for key in status:
    
      # reset if device is not able to return status and interface is defined
      if status[key]["interface"] != "":
      
        device_code = translateDevice(key)
        device      = rm3json.read(rm3config.commands + status[key]["interface"] + "/" + device_code)
        logging.info("Reset Device: " + device_code + "/" + status[key]["interface"])
      
        if device["data"]["method"] != "query":      
          status[key]["status"]["power"] = "OFF" 

    writeStatus(status)
    return "Reset POWER to OFF for devices without API"

#-----------------------------------------------

def resetAudio():
    '''set status for all devices to OFF'''
  
    status = readStatus()
    for key in status:
    
      # reset if device is not able to return status and interface is defined
      if status[key]["interface"] != "":
      
        device_code = translateDevice(key)
        device      = rm3json.read(rm3config.commands + status[key]["interface"] + "/" + device_code)
        logging.info("Reset Device: " + device_code + "/" + status[key]["interface"])
      
        if device["data"]["method"] != "query":      
          if "vol"  in status[key]["status"]: status[key]["status"]["vol"]  = 0 
          if "mute" in status[key]["status"]: status[key]["status"]["mute"] = "OFF"

    writeStatus(status)
    return "Reset AUDIO to 0 for devices without API"

#-----------------------------------------------

def getStatus(name):
    '''get status of device'''

    status        = readStatus()
    name_split    = name.split("_")
    device        = name_split[0]
    
    if not device in status: 
      logging.error("Get status - Device not defined: " +device + " (" + name + ")")
      return 0
    
    device_code   = translateDevice(device)
    device_method = configMethods[device]
    device_api    = status[device]["interface"]
    device_status = status[device]["status"]
    
    if len(name_split) == 1 or name_split[1] == "": name = "power"
    else:                                           name = name_split[1]

###### check if method = record or send request to api ######

    if device in status and name in status[device]["status"]:
      logging.info("Get status: " + name + " = " + device_code)
      return status[device]["status"][name]
      
    else:
      logging.error("Get status: " + name + " = " + device_code)
      return 0    

#-----------------------------------------------
# EOF
