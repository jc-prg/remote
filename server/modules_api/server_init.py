#-----------------------------------------------
# init IR device
#-----------------------------------------------
# (c) Christoph Kloth
#-----------------------------------------------

import sys, getopt
import time, binascii
import netaddr, logging

import interfaces.broadlink.broadlink as broadlink

import modules.rm3json       as rm3json
import modules.rm3stage      as rm3stage
import modules.rm3config     as rm3config

from os import path
from Crypto.Cipher import AES


#-------------------------------------------------

Status     	= "Starting"
rm3configDir    = path.dirname(path.abspath(__file__)) + "/remotes/"

#-------------------------------------------------

if rm3stage.test:
    if rm3config.DEBUG: logging.basicConfig(level=logging.DEBUG)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    else:               logging.basicConfig(level=logging.INFO)   # DEBUG, INFO, WARNING, ERROR, CRITICAL
else:                   logging.basicConfig(level=logging.WARN)    # DEBUG, INFO, WARNING, ERROR, CRITICAL


#-------------------------------------------------
# basic server functions
#-------------------------------------------------

def time_since_start():
    current_time = time.time()
    time_info    = int((current_time - rm3config.start_time))
    return "  ("+ str(time_info) +"s)"

#-------------------------------------------------

def ErrorMsg(code,info=""):
    if info != "": info = "(" + info + ")"

    message = rm3config.error_messages

    if code in message:
      if int(code) >= 300:
        data = {}
        data["Code"]    = code
        data["Msg"]     = message[code]
        data["Info"]    = message[code] + " " + info
        return data

      else:
        return message[code]

    else:
        return "UNKNOWN ERROR CODE"

#---------------------------

def dataInit():
    d = { "API"          : {
              "name"     : rm3config.APIname,
              "version"  : rm3config.APIversion,
              "stage"    : rm3config.initial_stage,
              "rollout"  : rm3stage.rollout
              },
	}
    return d

#---------------------------
# initialize variables
#---------------------------

def initBroadlink():
    '''Set vars'''

    config_file = "interfaces/broadlink"
    logging.info(config_file)
    
    config         = rm3json.read(config_file)
    config["Name"] = "Broadlink"
    
    config["Port"]       = int(config["Port"])
    config["MACAddress"] = netaddr.EUI(config["MACAddress"])
    config["Timeout"]    = int(config["Timeout"])
    
    return config


#---------------------------

def initDevice():
    '''init RM3 IR device'''

    global RM3Device, Status
    DeviceConfig = initBroadlink()
    RM3Device    = broadlink.rm((DeviceConfig["IPAddress"], DeviceConfig["Port"]), DeviceConfig["MACAddress"])
    
    if RM3Device.auth(): Status = "Connected"
    else:                Status = "IR Device not available (not found or no access)"
    
    return Status


#-------------------------------------------------
# main program
#-------------------------------------------------

logging.info("Load Data ..." + time_since_start())

msg = initDevice()
if msg == "Connected":  logging.info(msg)
else:                   logging.warn(msg)




