#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import interfaces.broadlink_api       as broadlink_api

available = {
	"BROADLINK"   : "Infrared Broadlink RM3",
	"EISCP-ONKYO" : "API for ONKYO Devices"
	}

#-------------------------------------------------
# Execute commands
#-------------------------------------------------


def send( api, device, button ):
    if   api == "BROADLINK":    return broadlink_api.ir_command_send(device,button)
    elif api == "EISCP-ONKYO":  return "API not implemented yet"
    else:                       return "API not available"


def record( api, device, button ):
    if   api == "BROADLINK":    return broadlink_api.ir_command_record(device,button)
    elif api == "EISCP-ONKYO":  return "API does not support record"
    else:                       return "API not available"
    
    
def query( api, device, button):
    if   api == "BROADLINK":    return "API does not support record"
    elif api == "EISCP-ONKYO":  return "API not implemented yet"
    else:                       return "API not available"


#-------------------------------------------------
# EOF

