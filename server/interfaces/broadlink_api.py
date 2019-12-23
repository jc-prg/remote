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

def ir_command_send(device,button):
    '''send IR command'''

    cmd    = ""
    code   = device + "_" + button
    active = rm3json.read("devices/_active")
    
    if device in active: device = active[device]["device"]
    else:                return "Device " + device + " not defined"
    
    data = rm3json.read("devices/BROADLINK/"+device)
    if ((code != '_') and (code != device+'_')):
        if device in data.keys():
            if button in data[device]["buttons"].keys():
                cmd  = data[device]["buttons"][button]

                logging.info("Button-Code: " + cmd)
                #DecodedCommand = cmd.decode('hex')        # python2
                DecodedCommand = codecs.decode(cmd,'hex')  # python3
                init.RM3Device.send_data(DecodedCommand)
                return("OK")
            else:
                return("Button-Code not defined")
        else:
            return("Device not defined")
    else:
        return("No Button-Code")

#-------------------------------------------------

def ir_command_record(device,button):
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
# EOF

