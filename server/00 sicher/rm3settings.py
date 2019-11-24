import configparser
import logging
from os import path

configPath = "../config/"
configFile = "rm3server.ini"
ApplicationDir = path.dirname(path.abspath(__file__))

#--------------------------------------------

def init():
    '''read data from setting file'''

    global IPAddress, Port, MACAddress, Timeout, Settings, BlackBeanControlSettings

    BlackBeanControlSettings = path.join(ApplicationDir, configPath, configFile)

    logging.info("Read Config: "+BlackBeanControlSettings)

    Settings = configparser.ConfigParser()
    Settings.read(BlackBeanControlSettings)

    IPAddress  = Settings.get('General', 'IPAddress')
    Port       = Settings.get('General', 'Port')
    MACAddress = Settings.get('General', 'MACAddress')
    Timeout    = Settings.get('General', 'Timeout')

#--------------------------------------------

def add_entry(category,name,value):
    '''write settings to file :: General, Devices, Command'''

    global IPAddress, Port, MACAddress, Timeout, Settings, BlackBeanControlSettings

    name     = name.lower()
    Settings.set(category,name,value)

    with open(BlackBeanControlSettings, 'w') as configfile:
        Settings.write(configfile)

    return()

#--------------------------------------------

def delete_entry(category,name):
    '''delete settings from file :: General, Devices, Command'''

    global IPAddress, Port, MACAddress, Timeout, Settings, BlackBeanControlSettings

    name     = name.lower()
    Settings.remove_option(category,name)

    with open(BlackBeanControlSettings, 'w') as configfile:
        Settings.write(configfile)

    return()

#--------------------------------------------

def value_defined(category, name):
     '''check if value is defined'''

     global Settings
     values = Settings.options(category)

     i = 0
     while i < len(values):
       if values[i] == name:
         return True
       i += 1
     else:
       return False

