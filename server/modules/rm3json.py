import modules.rm3presets as rm3presets
import json
import codecs
import time
from os import path
import os

jsonPath = rm3presets.data_dir + "/"
jsonAppDir = path.dirname(path.abspath(__file__))
jsonSettingsPath = ""
json_logging = rm3presets.set_logging("json")


def init():
    """
    global settings
    """

    global jsonPath, jsonAppDir, jsonSettings, jsonSettingsFile
    jsonSettingsPath = path.join(jsonAppDir, jsonPath)


def read(file, data_dir=True):
    """
    read data from json file
    """

    d = {}
    file1 = file + ".json"
    if data_dir:
        file2 = path.join(jsonAppDir, jsonPath, file1)
    else:
        file2 = path.join(jsonAppDir, "..", file1)

    json_logging.debug(file2)

    try:
        with open(file2) as json_data:
            d = json.load(json_data)
    except Exception as e:
        json_logging.error("Error reading JSON file (" + file + "): " + str(e))
        d = {
            "ERROR": "Could not read JSON file: " + file,
            "ERROR_MSG": str(e)
        }
        return d

    return d.copy()


def delete(file):
    filename = path.join(jsonAppDir, jsonPath, file + ".json")
    os.remove(filename)


def if_exist(file):
    filename = path.join(jsonAppDir, jsonPath, file + ".json")

    try:
        f = open(filename)
    except IOError:
        return False

    return True


def write(file, data, call_from=""):
    """
    write data to readable json file
    """

    d = {}
    file1 = file + ".json"
    file2 = path.join(jsonAppDir, jsonPath, file1)
    file3 = file2+".temp-"+str(time.time())

    # with open(file3, 'wb') as outfile:
    #     json.dump(data, codecs.getwriter('utf-8')(outfile), ensure_ascii=False, sort_keys=True, indent=4)

    with open(file3, 'wb') as outfile:
        json.dump(data, codecs.getwriter('utf-8')(outfile), ensure_ascii=False, sort_keys=True, indent=4)
    with open(file2, 'wb') as outfile:
        json.dump(data, codecs.getwriter('utf-8')(outfile), ensure_ascii=False, sort_keys=True, indent=4)

    if os.path.isfile(file3):
        os.remove(file3)

    json_logging.debug("write ... " + file + " ... from:" + call_from)


def available(directory):
    files = []
    file_path = path.join(jsonAppDir, jsonPath, directory)

    for dirpath, dirnames, filenames in os.walk(file_path):
        for filename in [f for f in filenames if f.endswith(".json") and not f.startswith("_")]:
            file_name = os.path.join(dirpath, filename)
            file_name = file_name.replace(file_path + "/", "")
            file_name = file_name.replace(file_path, "")
            file_name = file_name.replace(".json", "")
            files.append(file_name)

    return files
