#-----------------------------------------------
# read / write device status from config file
#-----------------------------------------------
# (c) Christoph Kloth
#-----------------------------------------------

import modules.rm3json       as rm3json

configFile = "status"

#-----------------------------------------------

def readStatus():
    '''read and return array'''

    status = rm3json.read(configFile)
    return status


#-----------------------------------------------

def setStatus(name,value):
    '''change status and write to file'''

    status = rm3json.read(configFile)
    status[name] = value
    rm3json.write(configFile,status)
    
#-----------------------------------------------

def resetStatus():
    '''set status for all devices to OFF'''

    status = rm3json.read(configFile)
    for key in status:
      if "_" not in key:
        status[key] = "OFF" 
    rm3json.write(configFile,status)

#-----------------------------------------------

def resetAudio():
    '''set status for all devices to OFF'''

    status = rm3json.read(configFile)
    for key in status:
      if "_vol"  in key: status[key] = 0 
      if "_mute" in key: status[key] = "MUTE_OFF"
    rm3json.write(configFile,status)

#-----------------------------------------------

def getStatus(name):
    '''get status of device'''

    status = readStatus()
    if name in status:
      return status[name]
    else:
      return 0    

#-----------------------------------------------
# EOF
