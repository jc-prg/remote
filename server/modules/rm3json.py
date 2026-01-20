import sys
import json
import codecs
import logging
import time
import traceback
import os
import server.modules.rm3presets as rm3presets

jsonPath = rm3presets.data_dir + "/"
jsonAppDir = os.path.dirname(os.path.abspath(__file__))
jsonSettingsPath = ""
json_logging = rm3presets.set_logging("json", logging.INFO)


def init():
    """
    global settings
    """

    global jsonPath, jsonAppDir, jsonSettings, jsonSettingsFile
    jsonSettingsPath = os.path.join(jsonAppDir, jsonPath)


def read(file, data_dir=True, called_by="unknown"):
    """
    read data from json file
    """

    d = {}
    file1 = file + ".json"
    if data_dir:
        file2 = os.path.join(jsonAppDir, jsonPath, file1)
    else:
        file2 = os.path.join(jsonAppDir, "..", file1)

    json_logging.debug(file2)

    try:
        with open(file2) as json_data:
            d = json.load(json_data)
    except Exception as e:
        exc_type, exc_value, exc_tb = sys.exc_info()
        tb = traceback.format_tb(exc_tb)
        json_logging.error(f"Error reading JSON file ({file}): {e} (called by {called_by})")
        #json_logging.error(f"EXCEPTION details: {exc_value} | {exc_value} | {tb}")
        d = {
            "ERROR": "Could not read JSON file: " + file,
            "ERROR_MSG": str(e)
        }
        return d

    return d.copy()


def delete(file):
    filename = os.path.join(jsonAppDir, jsonPath, file + ".json")
    os.remove(filename)


def if_exist(file):
    filename = os.path.join(jsonAppDir, jsonPath, file + ".json")

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
    file2 = os.path.join(jsonAppDir, jsonPath, file1)
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
    file_path = os.path.join(jsonAppDir, jsonPath, directory)

    for dirpath, dirnames, filenames in os.walk(file_path):
        for filename in [f for f in filenames if f.endswith(".json") and not f.startswith("_")]:
            file_name = os.path.join(dirpath, filename)
            file_name = file_name.replace(file_path + "/", "")
            file_name = file_name.replace(file_path, "")
            sub = ".json"
            if file_name.count(sub) > 1:
                file_name_parts = file_name.split(sub)
                file_name_parts = file_name_parts[:-1]
                file_name = sub.join(file_name_parts)
            else:
                file_name = file_name.replace(".json", "")

            files.append(file_name)

    return files
