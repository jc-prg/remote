#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

import codecs, json
import logging, time

import interfaces.broadlink.broadlink as broadlink
import modules_api.server_init        as init
import modules.rm3json                as rm3json

#-------------------------------------------------
# Execute IR command
#-------------------------------------------------

def command_send(device,button_code):
    '''send IR command'''
    
    if button_code == "ERROR":  return "Button not available"
    
    logging.info("Button-Code: " + button_code)
    DecodedCommand = codecs.decode(button_code,'hex')  # python3
    init.RM3Device.send_data(DecodedCommand)
    return("OK")
    
#-------------------------------------------------

def command_record(device,button):
    '''record new command'''

    code = device + "_" + button
    init.RM3Device.enter_learning()
    time.sleep(5)
    LearnedCommand = init.RM3Device.check_data()

    if LearnedCommand is None:
        return('Learn Button (' + code + '): No IR command received')
        sys.exit()

    #EncodedCommand = LearnedCommand.encode('hex')         # python2
    EncodedCommand = codecs.encode(LearnedCommand,'hex')   # python3
    return EncodedCommand

#-------------------------------------------------

def command_query():
    return "Not supported"


#-------------------------------------------------
# EOF

