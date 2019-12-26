#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import codecs, json, netaddr
import logging, time

import interfaces.broadlink.broadlink  as broadlink
import modules.rm3json                 as rm3json
import modules.rm3config               as rm3config


#---------------------------
# initialize variables
#---------------------------

def init():
    '''init RM3 IR device'''

    global RM3Device, Status

    config_file = rm3config.interfaces+"/BROADLINK"
    logging.info(config_file)
    
    config               = rm3json.read(config_file)
    config["Name"]       = "Broadlink"
    config["Port"]       = int(config["Port"])
    config["MACAddress"] = netaddr.EUI(config["MACAddress"])
    config["Timeout"]    = int(config["Timeout"])
    
    RM3Device    = broadlink.rm((config["IPAddress"], config["Port"]), config["MACAddress"])
    
    if RM3Device.auth(): Status = "Connected"
    else:                Status = "IR Device not available (not found or no access)"
    
    return Status


#-------------------------------------------------
# Execute IR command
#-------------------------------------------------

def send(device,button_code):
    '''send IR command'''
    
    global RM3Device, Status
    if button_code == "ERROR":  return "Button not available"
    
    logging.info("Button-Code: " + button_code)
    DecodedCommand = codecs.decode(button_code,'hex')  # python3
    RM3Device.send_data(DecodedCommand)
    return("OK")
    
#-------------------------------------------------

def record(device,button):
    '''record new command'''

    global RM3Device, Status

    code = device + "_" + button
    RM3Device.enter_learning()
    time.sleep(5)
    LearnedCommand = RM3Device.check_data()

    if LearnedCommand is None:
        return('Learn Button (' + code + '): No IR command received')
        sys.exit()

    #EncodedCommand = LearnedCommand.encode('hex')         # python2
    EncodedCommand = codecs.encode(LearnedCommand,'hex')   # python3
    return EncodedCommand

#-------------------------------------------------

def query():
    return "Not supported"


#-------------------------------------------------
# EOF

