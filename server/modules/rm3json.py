import modules.rm3stage as rm3stage
import json, codecs, os
import logging
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
    try:
      with open(file2) as json_data:
        d = json.load(json_data)
    except Exception as e:
      logging.error("Error reading JSON file ("+file+"): " + str(e))
      d = { 
            "ERROR"     : "Could not read JSON file: " + file,
            "ERROR_MSG" : str(e)
          }
      return d
      
    return d
    
#--------------------------------------------

def delete(file):
    filename = path.join(jsonAppDir,jsonPath,file+".json")
    os.remove(filename)
    
#--------------------------------------------

def ifexist(file):
    filename = path.join(jsonAppDir,jsonPath,file+".json")
    logging.error("IF EXIST: "+filename)
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
        
    logging.info("write ..."+file)


#--------------------------------------------

def available(directory):
    files      = []
    file_path  = path.join(jsonAppDir,jsonPath,directory)

    for dirpath, dirnames, filenames in os.walk(file_path):
      for filename in [f for f in filenames if f.endswith(".json") and not f.startswith("_")]:
        file_name = os.path.join(dirpath, filename)
        file_name = file_name.replace( file_path+"/", "" )
        file_name = file_name.replace( file_path, "" )
        file_name = file_name.replace( ".json", "" )
        files.append( file_name )
    
    return files

#--------------------------------------------
# to remove a key from dict use:
# my_dict.pop('key', None)


