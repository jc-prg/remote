#-----------------------------------
# API commands defined in swagger.yml
#-----------------------------------
# (c) Christoph Kloth
#-----------------------------------

#---------------------------
# initialize variables
#---------------------------

def init():
    '''init test device'''

    return "Connected"


#-------------------------------------------------
# Execute IR command
#-------------------------------------------------

def send(device,button_code):
    '''send IR command'''
    
    print("SEND: " + device + "/" + button_code)
    return("OK: send test-"+device+"-"+button_code)
    
#-------------------------------------------------

def record(device,button):
    '''record new command'''

    print("RECORD: " + device + "/" + button)
    return("OK: record test-"+device+"-"+button)


#-------------------------------------------------

def query():
    return "WARN: Not supported"


#-------------------------------------------------
# EOF

