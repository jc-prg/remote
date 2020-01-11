#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging

import modules.rm3json                as rm3json
import modules.rm3config              as rm3config

import interfaces.test_api            as test_api
import interfaces.eiscp_api           as eiscp
import interfaces.broadlink_api       as broadlink

available = {
	"BROADLINK"   : "Infrared Broadlink RM3",
	"EISCP-ONKYO" : "API for ONKYO Devices",
	"TEST"        : "Test API for automated tests"
	}
	
methods = {
        "record"      : "Record per device (record)",
        "query"       : "Request per API (query)"
	}
	
#-------------------------------------------------

def init():
    '''
    Initialize APIs
    '''

    logging.info("... BROADLINK - " + available["BROADLINK"])
    Status = broadlink.init()
    if Status != "Connected": logging.warn(Status)

    logging.info("... EISCP-ONKYO - " + available["EISCP-ONKYO"])
    Status = eiscp.init('192.168.1.33')
    if Status != "Connected": logging.warn(Status)

    logging.info("... TEST - " + available["TEST"])
    Status = test_api.init()
    
init()

#-------------------------------------------------
# Execute commands
#-------------------------------------------------

def test():
    return "Interfaces are loaded"

#-------------------------------------------------

def send( api, device, button ):

    button_code = get_command( api, "buttons", device, button ) 
    if   api == "BROADLINK":    return broadlink.send(device,button_code)
    elif api == "EISCP-ONKYO":  return eiscp.send(device,button_code)
    elif api == "TEST":         return test_api.send(device,button_code)
    else:                       return "API not available"


def record( api, device, button ):

    if   api == "BROADLINK":    return broadlink.record(device,button)
    elif api == "TEST":         return test_api.record(device,button)
    elif api == "EISCP-ONKYO":  return "API does not support record"
    else:                       return "API not available"
    
    
def query( api, device, button):

    button_code = get_command( api, "queries", device, button )
    if   api == "BROADLINK":    return "API does not support record"
    elif api == "TEST":         return "API does not support record"
    elif api == "EISCP-ONKYO":  return eiscp.query(device,button_code)
    else:                       return "API not available"


#-------------------------------------------------

def get_command(api,button_query,device,button):

    # read data -> to be moved to cache?!
    active       = rm3json.read(rm3config.devices + rm3config.active)
    device_code  = active[device]["device"]
    buttons      = rm3json.read(rm3config.commands + api + "/" + device_code)
    
    # add button definitions from default.json if exist
    if rm3json.ifexist(rm3config.commands + api + "/default"):
       buttons_default = rm3json.read(rm3config.commands + api + "/default")
       for key in buttons_default["data"][button_query]:
         buttons["data"][button_query][key] = buttons_default["data"][button_query][key]

    # check for errors or return button code
    if "ERROR" in buttons or "ERROR" in active:         return "ERROR"
    elif button in buttons["data"][button_query]:       return buttons["data"][button_query][button]
    else:                                               return "ERROR"      


#-------------------------------------------------
# EOF

