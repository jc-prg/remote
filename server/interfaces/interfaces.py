#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import logging

import modules.rm3json                as rm3json
import modules.rm3config              as rm3config

import interfaces.test_api
import interfaces.kodi_api
import interfaces.eiscp_api
import interfaces.broadlink_api

available = {}
api       = {}
	
methods = {
        "record"      : "Record per device (record)",
        "query"       : "Request per API (query)"
	}

	
#-------------------------------------------------

def init():
    '''
    Initialize APIs
    '''
    
    global api, available

    api["KODI"]        = interfaces.kodi_api.kodiAPI("KODI")
    api["TEST"]        = interfaces.test_api.testAPI("TEST")
    api["EISCP-ONKYO"] = interfaces.eiscp_api.eiscpAPI("EISCP-ONKYO")
    api["BROADLINK"]   = interfaces.broadlink_api.broadlinkAPI("BROADLINK")
    
    for key in api:
       available[key] = api[key].api_description



init()

#-------------------------------------------------
# Execute commands
#-------------------------------------------------

def test(call_api):
    '''test API'''
    
    global api   

    if call_api in api: return api[call_api].test()
    else:               return "ERROR: API not available ("+call_api+")"

    return "Interfaces are loaded"

#-------------------------------------------------

def send( call_api, device, button ):
    '''check if API exists and send command'''
    
    global api   
    logging.debug("SEND "+call_api+" / "+device+" - "+button)

    button_code = get_command( call_api, "buttons", device, button ) 
    if call_api in api: return api[call_api].send(device,button_code)
    else:               return "ERROR: API not available ("+call_api+")"


#-------------------------------------------------

def record( call_api, device, button ):
    '''record a command'''
    
    global api   
    logging.debug("RECORD "+call_api+" / "+device+" - "+button)

    if call_api in api: return api[call_api].send(device,button_code)
    else:               return "ERROR: API not available ("+call_api+")"


#-------------------------------------------------

def query( call_api, device, button):
    '''query an information'''

    global api   
    button_code = get_command( call_api, "queries", device, button )
    logging.debug("QUERY "+call_api+" / "+device+" - "+button)

    if call_api in api: return api[call_api].query(device,button_code)
    else:               return "ERROR: API not available ("+call_api+")"


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

    #logging.debug(buttons["data"][button_query][button])

    # check for errors or return button code
    if "ERROR" in buttons or "ERROR" in active:         return "ERROR"
    elif button in buttons["data"][button_query]:       return buttons["data"][button_query][button]
    else:                                               return "ERROR"      


#-------------------------------------------------
# EOF

