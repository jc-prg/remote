#-----------------------------------------------
# read / write device status from config file
#-----------------------------------------------
# (c) Christoph Kloth
#-----------------------------------------------

import logging
import modules.rm3json       as rm3json

configFile = "devices/_active"


#-----------------------------------------------

def translateDevice(device):

    status = rm3json.read(configFile)
    if device in status: return status[device]["device"]
    else:                return ""
    
#-----------------------------------------------

def readStatus():
    '''read and return array'''

    status = rm3json.read(configFile)
    return status
    
#-----------------------------------------------

def readStatusOld():

    status     = readStatus()
    status_old = {}
    for device in status:
      if status[device]["visible"] == "yes" and "status" in status[device]:
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
    
#-----------------------------------------------

def resetStatus():
    '''set status for all devices to OFF'''

    status = readStatus()
    for key in status:
      # reset if device is not able to return status
      device = rm3json.read("remotes/" + status[key]["interfaces"] + "/" + status[key]["device"])
      if device[status[key]["device"]]["status"][status[key]["interfaces"]] != "query":      
        status[key]["status"]["power"] = "OFF" 

    writeStatus(status)

#-----------------------------------------------

def resetAudio():
    '''set status for all devices to OFF'''

    status = readStatus()
    for key in status:
      # reset if device is not able to return status
      device = rm3json.read("remotes/" + status[key]["interfaces"] + "/" + status[key]["device"])
      if device[status[key]["device"]]["status"][status[key]["interfaces"]] != "query":      
        if "vol"  in status[key]: status[key]["status"]["vol"]  = 0 
        if "mute" in status[key]: status[key]["status"]["mute"] = "MUTE_OFF"

    writeStatus(status)

#-----------------------------------------------

def getStatus(name):
    '''get status of device'''

    status      = readStatus()
    name_split  = name.split("_")    
    device      = name_split[0]
    device_code = translateDevice(device)
    if len(name_split) == 1 or name_split[1] == "": name = "power"

    if device in status and name in status[device]["status"]:
      logging.info("Get status: " + name + " = " + device_code)
      return status[device]["status"][name]
      
    else:
      logging.error("Get status: " + name + " = " + device_code)
      return 0    

#-----------------------------------------------
# EOF
