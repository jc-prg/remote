#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import modules.rm3json                as rm3json

import interfaces.broadlink_api       as broadlink
import interfaces.eiscp_api           as eiscp

available = {
	"BROADLINK"   : "Infrared Broadlink RM3",
	"EISCP-ONKYO" : "API for ONKYO Devices"
	}
	
#-------------------------------------------------

eiscp.init('192.168.1.33')

#-------------------------------------------------
# Execute commands
#-------------------------------------------------

def test():
    eiscp.command_test()

#-------------------------------------------------

def send( api, device, button ):

    button_code = get_command( api, device, button ) 
    if   api == "BROADLINK":    return broadlink.command_send(device,button_code)
    elif api == "EISCP-ONKYO":  return eiscp.command_send(device,button_code)
    else:                       return "API not available"


def record( api, device, button ):

    if   api == "BROADLINK":    return broadlink.command_record(device,button)
    elif api == "EISCP-ONKYO":  return "API does not support record"
    else:                       return "API not available"
    
    
def query( api, device, button):

    button_code = get_command( api, device, button )
    if   api == "BROADLINK":    return "API does not support record"
    elif api == "EISCP-ONKYO":  return "API not implemented yet"
    else:                       return "API not available"


#-------------------------------------------------

def get_command(api,device,button):

    # read data -> to be moved to cache?!
    active       = rm3json.read("devices/_active")
    device_code  = active[device]["device"]
    buttons      = rm3json.read("devices/"+api+"/"+device_code)
    
    # add button definitions from default.json if exist
    if rm3json.ifexist("devices/"+api+"/default"):
       buttons_default = rm3json.read("devices/"+api+"/default")
       for key in buttons_default["default"]["buttons"]:
         buttons[device_code]["buttons"][key] = buttons_default["default"]["buttons"][key]

    # check for errors or return button code
    if "ERROR" in buttons or "ERROR" in active:      return "ERROR"
    elif button in buttons[device_code]["buttons"]:  return buttons[device_code]["buttons"][button]
    else:                                            return "ERROR"      

#-------------------------------------------------
# EOF

