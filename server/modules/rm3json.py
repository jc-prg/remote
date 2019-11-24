import modules.rm3stage as rm3stage
import json, codecs, os
from os import path

jsonPath   = rm3stage.data_dir+"/"
jsonAppDir = path.dirname(path.abspath(__file__))
jsonSettingsPath = ""

#--------------------------------------------

def init():
    '''global settings'''

    global jsonPath, jsonAppDir, jsonSettings, jsonSettingsFile
    jsonSettingsPath = path.join(jsonAppDir, jsonPath)


#--------------------------------------------

def read(file):
    '''read data from json file'''

    d = {}
    file1 = file+".json"
    file2 = path.join(jsonAppDir,jsonPath,file1)
    with open(file2) as json_data:
        d = json.load(json_data)
    return d
    
#--------------------------------------------

def delete(file):
    filename = path.join(jsonAppDir,jsonPath,file+".json")
    os.remove(filename)
    
#--------------------------------------------

def ifexist(file):
    filename = path.join(jsonAppDir,jsonPath,file+".json")
    try:
        with open(filename, 'r') as fh:
            test = ""
    except:
        return False
    return True

#--------------------------------------------

def write(file, data):
    '''write data to readable json file'''

    d = {}
    file1 = file+".json"
    file2 = path.join(jsonAppDir,jsonPath,file1)

    with open(file2, 'wb') as outfile:
        json.dump(data, codecs.getwriter('utf-8')(outfile), ensure_ascii=False, sort_keys=True, indent=4)


#--------------------------------------------
# to remove a key from dict use:
# my_dict.pop('key', None)


