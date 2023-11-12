import logging
import modules.rm3cache

configInterfaces = modules.rm3cache.ConfigInterfaces("configInterfaces")
configFiles = modules.rm3cache.ConfigCache("ConfigFiles")
if configFiles.check_config() == "ERROR":
    exit()
else:
    configFiles.start()
    configInterfaces.start()

import interfaces

deviceAPIs = interfaces.Connect(configFiles)
deviceAPIs.start()

from modules.rm3queue import QueueApiCalls

queueSend = QueueApiCalls("queueSend", "send", deviceAPIs)
queueSend.start()

queueQuery = QueueApiCalls("queueQuery", "query", deviceAPIs)
queueQuery.config = configFiles
queueQuery.start()

import modules.rm3json
import modules.rm3stage
import modules.rm3config

RmReadData_errors = {}


def refreshCache():
    """
    Reset vars to enforce a refresh of all cached data
    """
    configFiles.update()


def RmReadData_devicesConfig():
    """
    read configuration of all devices
    """
    config_keys = ["buttons", "commands", "url", "method"]
    data = {}
    data = configFiles.read_status()
    data_config = {}

    # read data for active devices
    for device in data:

        interface = data[device]["config"]["interface_api"]
        device_key = data[device]["config"]["device"]

        if interface == "":
            if device != "default":
                logging.warning("No interface defined (" + device + "/" + device_key + ")")
                logging.warning(device + ": " + str(data[device]))
            continue

        interface_def_device = configFiles.read(
            modules.rm3config.commands + interface + "/" + device_key)  # button definitions, presets, queries ...
        interface_def_default = configFiles.read(
            modules.rm3config.commands + interface + "/00_default")  # button definitions, presets, queries ...

        if "ERROR" in interface_def_device or "ERROR" in interface_def_default:
            logging.error("Error while reading configuration for device (" + device_key + ")")

        else:
            interface_def_device = interface_def_device["data"]
            interface_def_default = interface_def_default["data"]
            interface_def_combined = {}

            for value in config_keys:

                if value in interface_def_default:
                    interface_def_combined[value] = interface_def_default[value]
                elif value == "method":
                    interface_def_combined[value] = ""
                elif value == "url":
                    interface_def_combined[value] = ""
                else:
                    interface_def_combined[value] = {}

                if value in interface_def_device and value != "method" and value != "url":
                    for key in interface_def_device[value]:
                        interface_def_combined[value][key] = interface_def_device[value][key]

                elif value in interface_def_device:
                    interface_def_combined[value] = interface_def_device[value]

            data_config[device] = {}
            data_config[device]["buttons"] = {}
            if interface_def_combined["buttons"] != "":
                data_config[device]["buttons"] = list(interface_def_combined["buttons"].keys())

            data_config[device]["interface"] = {}
            data_config[device]["interface"]["method"] = interface_def_combined["method"]
            data_config[device]["interface"]["files"] = [interface + "/00_interface.json",
                                                         interface + "/00_default.json",
                                                         interface + "/" + device_key + ".json"]
            data_config[device]["interface"]["api"] = data[device]["config"]["interface_api"] + "_" + \
                                                      data[device]["config"]["interface_dev"]
            data_config[device]["interface"]["interface_api"] = data[device]["config"]["interface_api"]
            data_config[device]["interface"]["interface_dev"] = data[device]["config"]["interface_dev"]
            data_config[device]["interface"]["device"] = device_key

            data_config[device]["commands"] = {}
            data_config[device]["commands"]["definition"] = {}
            data_config[device]["commands"]["get"] = []
            data_config[device]["commands"]["set"] = []

            # check get and set definitions
            if "commands" in interface_def_combined:
                data_config[device]["commands"]["definition"] = interface_def_combined["commands"]

                for key in interface_def_combined["commands"]:
                    if "get" in interface_def_combined["commands"][key]:
                        if key not in data_config[device]["commands"]["get"]:
                            data_config[device]["commands"]["get"].append(key)

                    if "set" in interface_def_combined["commands"][key]:
                        if key not in data_config[device]["commands"]["set"]:
                            data_config[device]["commands"]["set"].append(key)

                    if ("get" not in interface_def_combined["commands"][key]
                            and "set" not in interface_def_combined["commands"][key]):
                        data_config[device]["commands"]["get"].append(key)

            for key in data_config[device]["commands"]["definition"]:
                if "str" not in str(type(data_config[device]["commands"]["definition"][key])):
                    data_config[device]["commands"]["definition"][key]["cmd"] = []

                    if "get" in data_config[device]["commands"]["definition"][key]:
                        data_config[device]["commands"]["definition"][key]["cmd"].append("get")
                        del data_config[device]["commands"]["definition"][key]["get"]
                    if "set" in data_config[device]["commands"]["definition"][key]:
                        data_config[device]["commands"]["definition"][key]["cmd"].append("set")
                        del data_config[device]["commands"]["definition"][key]["set"]

            data_config[device]["url"] = interface_def_combined["url"]

    return data_config


def RmReadData_devices(selected=[], remotes=True, config_only=False):
    """
    read data for devices and combine with remote definition -> base for CONFIG and STATUS also
    """
    global RmReadData_errors

    config_keys = ["buttons", "commands", "url", "method"]
    data = {}
    data = configFiles.read_status()

    if "ERROR" in data:
        logging.error("ERROR while requesting devices status, main config file seems to be defect!")
        return data

    # read data for active devices
    for device in data:

        if data[device]["config"]["interface_api"] != "":
            if selected == [] or device in selected:

                device_key = data[device]["config"]["device"]
                key_remote = data[device]["config"]["remote"]
                interface = data[device]["config"]["interface_api"]
                remote = configFiles.read(modules.rm3config.remotes + key_remote)  # remote layout & display

                if "devices" not in RmReadData_errors:
                    RmReadData_errors["devices"] = {}
                if "ERROR" in remote:
                    logging.error("Error reading config file '" + key_remote + "': " + remote["ERROR_MSG"])
                    if device not in RmReadData_errors["devices"]:
                        RmReadData_errors["devices"][device] = {}
                    RmReadData_errors["devices"][device][modules.rm3config.remotes+key_remote+".json"] = \
                        remote["ERROR_MSG"]
                    continue
                elif device in RmReadData_errors["devices"]:
                    if device not in RmReadData_errors["devices"]:
                        RmReadData_errors["devices"] = {}
                    del RmReadData_errors["devices"][device]

                data_temp = data[device]
                data_temp["remote"] = remote["data"]

                # should not be necessary any more ... but how ever, if removed RmReadConfig_devices doesn't work
                if remotes:

                    interface_def_device = configFiles.read(
                        modules.rm3config.commands + interface + "/" + device_key)  # button definitions, presets, queries ...
                    interface_def_default = configFiles.read(
                        modules.rm3config.commands + interface + "/00_default")  # button definitions, presets, queries ...

                    if "ERROR" in interface_def_device:
                        logging.error(
                            "Error reading config file '" + device_key + "': " + interface_def_device["ERROR_MSG"])
                        if device not in RmReadData_errors["devices"]:
                            RmReadData_errors["devices"][device] = {}
                        RmReadData_errors["devices"][device][
                            modules.rm3config.commands + interface + "/" + device_key + ".json"] = interface_def_device[
                            "ERROR_MSG"]
                        continue

                    if "ERROR" in interface_def_default:
                        logging.error(
                            "Error reading config file '" + device_key + "': " + interface_def_default["ERROR_MSG"])
                        if device not in RmReadData_errors["devices"]:
                            RmReadData_errors["devices"][device] = {}
                        RmReadData_errors["devices"][device][
                            modules.rm3config.commands + interface + "/00_default.json"] = interface_def_default[
                            "ERROR_MSG"]
                        continue

                    interface_def_device = interface_def_device["data"]
                    interface_def_default = interface_def_default["data"]
                    interface_def_combined = {}

                    for value in config_keys:

                        if value in interface_def_default:
                            interface_def_combined[value] = interface_def_default[value]
                        elif value == "method":
                            interface_def_combined[value] = ""
                        elif value == "url":
                            interface_def_combined[value] = ""
                        else:
                            interface_def_combined[value] = {}

                        if value in interface_def_device and value != "method" and value != "url":
                            for key in interface_def_device[value]:
                                interface_def_combined[value][key] = interface_def_device[value][key]

                        elif value in interface_def_device:
                            interface_def_combined[value] = interface_def_device[value]

                data[device] = data_temp

    return data


def RmReadData_deviceStatus():
    """
    read status data for devices
    """
    status = {}
    data = {}
    data = configFiles.read_status()

    # read data for active devices
    for device in data:
        status[device] = data[device]["status"]
        status[device]["api"] = data[device]["config"]["interface_api"] + "_" + data[device]["config"]["interface_dev"]

        if data[device]["settings"]["main-audio"]:
            status[device]["main-audio"] = data[device]["settings"]["main-audio"]
        else:
            status[device]["main-audio"] = "no"

    return status


def RmReadData_sceneStatus():
    """
    read status data for devices
    """
    status = {}
    data = {}
    data = RmReadData_scenes()  # configFiles.read(modules.active_scenes)

    # read data for active devices
    for scene in data:
        if data[scene]["remote"] != "error":
            status[scene] = data[scene]["remote"]["devices"]

    return status


def RmWriteData_devices(data):
    """
    write config data for devices and remove data not required in the file
    """
    var_relevant = ["config", "settings", "status"]

    logging.info(str(data))

    for device in data:
        var_delete = []
        for key in data[device]:
            if key not in var_relevant:
                var_delete.append(key)

        for key in var_delete:
            del data[device][key]

    if data == {}:
        logging.error("ERROR: ...!")
    else:
        configFiles.write_status(data, "RmWriteData_devices()")


def RmReadData_macros(selected=[]):
    """
    read config data for macros
    """
    data = {}
    data = configFiles.read(modules.rm3config.active_macros)
    return data


def RmWriteData_macros(data):
    """
    write config data for scenes and remove temp parameter required e.g. for REST API
    """
    var_relevant = ["description", "macro", "dev-on", "dev-off", "scene-on", "scene-off"]
    var_delete = []

    for key in data:
        if key not in var_relevant:
            var_delete.append(key)

    for key in var_delete:
        del data[key]

    configFiles.write(modules.rm3config.active_macros, data, "RmWriteData_macros()")


def RmReadData_scenes(selected=[], remotes=True):
    """
    read config data for scenes and combine with remote definition
    """
    global RmReadData_errors

    data = {}
    data = configFiles.read(modules.rm3config.active_scenes)

    if "scenes" not in RmReadData_errors:
        RmReadData_errors["scenes"] = {}

    if remotes:
        for scene in data:
            if selected == [] or scene in selected:
                remote_file = data[scene]["config"]["remote"]
                try:
                    remote_config = configFiles.read(modules.rm3config.scenes + remote_file)
                    if "data" in remote_config:
                        data[scene]["remote"] = remote_config["data"]
                    else:
                        logging.error("Could not read remote data: "+modules.rm3config.scenes + remote_file)
                        data[scene]["remote_error"] = {
                            "file": modules.rm3config.scenes + remote_file,
                            "file_data": remote_config
                        }

                    if "ERROR" in remote_config:
                        logging.error("Error reading config file '" + remote_file + "': " + remote_config["ERROR_MSG"])
                        if scene not in RmReadData_errors["scenes"]:
                            RmReadData_errors["scenes"][scene] = {}
                        RmReadData_errors["scenes"][scene][modules.rm3config.scenes + remote_file + ".json"] = \
                            remote_config["ERROR_MSG"]
                        data[scene]["remote"] = "error"

                except Exception as e:
                    error_msg = "Reading scene failed: " + str(scene) + " / " + str(selected) + " (" + str(e) + ")"
                    logging.error(error_msg)
                    if scene not in RmReadData_errors["scenes"]:
                        RmReadData_errors["scenes"][scene] = {}
                    RmReadData_errors["scenes"][scene][modules.rm3config.scenes + remote_file + ".json"] = error_msg
                    data[scene]["remote"] = "error"

            else:
                logging.error("Scene not found: " + str(scene) + " / " + str(selected))
                return {}

    return data


def RmWriteData_scenes(data):
    """
    write config data for scenes and remove temp parameter required e.g. for REST API
    """
    var_relevant = ["config", "settings", "status"]
    var_delete = []

    for scene in data:
        for key in data[scene]:
            if key not in var_relevant:
                var_delete.append(key)

        for key in var_delete:
            if key in data[scene]:
                del data[scene][key]

    configFiles.write(modules.rm3config.active_scenes, data, "RmWriteData_scenes()")


def RmReadData_templates(selected=[]):
    """
    read config data for templates
    """
    data = {}
    data["templates"] = {}
    data["template_list"] = {}

    if selected == []:
        templates = modules.rm3json.available(modules.rm3config.templates)

        for template in templates:
            template_keys = template.split("/")
            template_key = template_keys[len(template_keys) - 1]
            template_data = configFiles.read(modules.rm3config.templates + template)

            logging.debug(modules.rm3config.templates + template)

            if "ERROR" in template_data:
                data["templates"][template] = template_data
            else:
                if template_key in template_data:
                    data["templates"][template] = template_data[template_key]
                elif "data" in template_data:
                    data["templates"][template] = template_data["data"]
                else:
                    data["templates"][template] = {"ERROR": "JSON file not correct, key missing: " + template_key}

                if not "ERROR" in data["templates"][template]:
                    if "description" in data["templates"][template]:
                        data["template_list"][template] = data["templates"][template]["description"]
                    else:
                        data["template_list"][template] = template_key

    return data


def RmReadData(selected=[]):
    """
    Read all relevant data and create data structure
    """

    data = {}
    btnfile = ["buttons", "commands", "url"]

    # workaround, as "remote" section is removed somehow after some JSON edits
    if "_api" in configFiles.cache and "scenes" in configFiles.cache["_api"]:
        for key in configFiles.cache["_api"]["scenes"]:
            if "remote" not in configFiles.cache["_api"]["scenes"][key]:
                configFiles.cache_update = True

    # if update required
    if configFiles.cache_update or "_api" not in configFiles.cache:

        data["devices"] = RmReadData_devices(selected, True, False)
        data["macros"] = RmReadData_macros(selected)
        data["scenes"] = RmReadData_scenes(selected, True)
        data["templates"] = RmReadData_templates(selected)["templates"]
        data["template_list"] = RmReadData_templates(selected)["template_list"]

        logging.warning("++++++++> "+str(data["scenes"]["music"].keys()))

        # save data in cache
        configFiles.cache["_api"] = data

        # mark update as done
        logging.info("Update config data in cache (" + str(configFiles.cache_update) + ")")
        configFiles.cache_update = False

    # if no update required read from cache
    else:
        data = configFiles.cache["_api"]

    # Update API data based on cache value
    if configInterfaces.cache_update_api:
        logging.info("Update config data from api.")
        data["devices"] = devicesGetStatus(data["devices"], readAPI=True)

    else:
        data["devices"] = devicesGetStatus(data["devices"], readAPI=False)

    # Update status data        
    configFiles.cache["_api"] = data

    return data.copy()


def addScene(scene, info):
    """
    add new scene in active_jsons and create scene remote layout
    """
    active_json = RmReadData_scenes(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)

    if scene in active_json:
        return "WARN: Scene " + scene + " already exists (active)."
    if modules.rm3json.if_exist(modules.rm3config.remotes + "scene_" + scene):    return (
            "WARN: Scene " + scene + " already exists (remotes).")

    logging.info("addScene: add " + scene)

    # set last position
    active_json_position = 0
    for key in active_json:
        if active_json[key]["settings"]["position"] > active_json_position:
            active_json_position = active_json[key]["settings"]["position"]
    active_json_position += 1

    # add to _active.json
    active_json[scene] = {
        "config": {
            "remote": "scene_" + scene
        },
        "settings": {
            "description": info["description"],
            "label": info["label"],
            "position": active_json_position,
            "visible": "yes"
        },
        "status": {},
        "type": "scene"
    }

    try:
        RmWriteData_scenes(active_json)
        # configFiles.write(modules.active_scenes,active_json)

    except Exception as e:
        return "ERROR: " + str(e)

    # add to devices = button definitions
    remote = {
        "info": "jc://remote/ - In this file the remote layout and channel/scene macros for the scene are defined.",
        "data": {
            "label": info["label"],
            "description": info["label"],
            "remote": [],
            "devices": [],
            "macro-channel": {},
            "macro-scene-on": [],
            "macro-scene-off": [],
            "macro-scene": {},
        }
    }

    try:
        configFiles.write(modules.rm3config.remotes + "scene_" + scene, remote)
    except Exception as e:
        return "ERROR: " + str(e)

    configFiles.cache_update = True
    return "OK: Scene " + scene + " added."


def editScene(scene, info):
    """
    edit scene data in json file
    """
    keys_active = ["label", "description", "image"]
    keys_remotes = ["label", "remote", "macro-channel", "macro-scene-on", "macro-scene-off", "macro-scene",
                    "devices", "display", "display-size", "type"]

    # check data format
    if not isinstance(info, dict):
        return "ERROR: wrong data format - not a dict."
    if "remote" in info:
        if not isinstance(info["remote"], list):
            return "ERROR: wrong data format - 'remote' is not a list."
        for entry in info["remote"]:
            if not isinstance(entry, str):
                return "ERROR: wrong data format - 'remote' other than strings (" + str(entry) + ")."
    if "devices" in info:
        if not isinstance(info["devices"], list):
            return "ERROR: wrong data format - 'devices' is not a list."
        for entry in info["devices"]:
            if not isinstance(entry, str):
                return "ERROR: wrong data format - 'devices' other than strings (" + str(entry) + ")."
    if "macro-channel" in info:
        if not isinstance(info["macro-channel"], dict):
            return "ERROR: wrong data format - 'macro-channel' is not a dict."
        for key in info["macro-channel"]:
            if not isinstance(info["macro-channel"][key], list):
                return "ERROR: wrong data format - 'macro-channel' contains not a list (" + str(key) + ")."
            for entry in info["macro-channel"][key]:
                if not isinstance(entry, str):
                    return "ERROR: wrong data format - 'macro-channel' list contains other than strings (" + str(entry) + ")."

    # read central config file
    active_json = RmReadData_scenes(selected=[], remotes=False)

    # read remote layout definitions
    remotes = configFiles.read(modules.rm3config.remotes + "scene_" + scene)
    if "ERROR" in remotes:
        return "ERROR: Scene " + scene + " doesn't exists (remotes)."

    i = 0
    i_list = ""
    for key in keys_active:
        if key in info:
            active_json[scene]["settings"][key] = info[key]
            i += 1
            i_list += key + ","

    for key in keys_remotes:
        if key in info:
            if "data" in remotes:
                remotes["data"][key] = info[key]
            elif scene in remotes:
                remotes[scene][key] = info[key]
            i += 1
            i_list += key + ","

    # write central config file
    RmWriteData_scenes(active_json)
    #    try:                   RmWriteData_scenes(active_json)
    #    except Exception as e: return "ERROR: could not write changes (active) - "+str(e)

    # write remote layout definition
    try:
        configFiles.write(modules.rm3config.remotes + "scene_" + scene, remotes)
    except Exception as e:
        return "ERROR: could not write changes (remotes) - " + str(e)

    configFiles.cache_update = True

    if i > 0:
        return "OK: Edited device parameters of " + scene + " <br/>(" + str(i) + " changes: " + i_list + ")"
    else:
        return "ERROR: no data key matched with keys from config-files (" + str(info.keys) + ")"


def deleteScene(scene):
    """
    delete scene from json config file and scene device related files
    """

    active_json = RmReadData_scenes(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)

    if "ERROR" in active_json:
        return "ERROR: Could not read ACTIVE_JSON (active)."
    if scene not in active_json:
        return "ERROR: Scene " + scene + " doesn't exists (active)."
    if not modules.rm3json.if_exist(modules.rm3config.remotes + "scene_" + scene):
        return "ERROR: Scene " + scene + " doesn't exists (remotes)."

    del active_json[scene]
    # configFiles.write(modules.active_scenes, active_json)
    RmWriteData_scenes(active_json)

    try:
        modules.rm3json.delete(modules.rm3config.remotes + "scene_" + scene)
        configFiles.cache_update = True
        if not modules.rm3json.if_exist(modules.rm3config.remotes + "scene_" + scene):
            return "OK: Scene '" + scene + "' deleted."
        else:
            return "ERROR: Could not delete scene '" + scene + "'"
    except Exception as e:
        return "ERROR: Could not delete scene '" + scene + "': " + str(e)


def addDevice(device, device_data):
    """
    add new device to config file and create command/remote files
    """

    logging.warning(str(device_data))

    interface, interface_dev = device_data["api"].split("_")
    config_remote = device_data["config_remote"]
    config_device = device_data["config_device"]

    ## Check if exists    
    active_json = configFiles.read_status()

    if device in active_json:                                                                           return (
            "WARN: Device " + device + " already exists (active).")
    if modules.rm3json.if_exist(modules.rm3config.commands + interface + "/" + device_data["config_device"]): return (
            "WARN: Device " + device + " already exists (devices).")
    if modules.rm3json.if_exist(modules.rm3config.remotes + device_data["config_remote"]):               return (
            "WARN: Device " + device + " already exists (remotes).")

    logging.info("addDevice: add " + device)

    ## set position
    active_json_position = 0
    for key in active_json:
        if active_json[key]["settings"]["position"] > active_json_position:
            active_json_position = active_json[key]["settings"]["position"]
    active_json_position += 1

    ## add to _active.json 
    active_json[device] = {
        "config": {
            "device": device_data["config_device"],
            "remote": device_data["config_remote"],
            "interface_api": interface,
            "interface_dev": "default"
        },
        "settings": {
            "description": device_data["label"] + ": " + device_data["device"],
            "label": device_data["label"],
            "image": device,
            "main-audio": "no",
            "position": active_json_position,
            "visible": "yes"
        },
        "status": {"power": "OFF"},
        "type": "device"
    }

    try:
        configFiles.write_status(active_json, "addDevice")
    except Exception as e:
        return "ERROR: " + str(e)

    ## add to devices = button definitions
    buttons = {
        "info": "jc://remote/ - In this file the commands and buttons are defined.",
        "data": {
            "description": device_data["label"] + ": " + device_data["device"],
            "buttons": {},
            "commands": {}
        }
    }
    try:
        configFiles.write(modules.rm3config.commands + interface + "/" + device_data["config_device"], buttons)
    except Exception as e:
        return "ERROR: " + str(e)

    ## add to remotes = button layout
    remote = {
        "info": "jc://remote/ - In this file the remote layout and a display layout is defined.",
        "data": {
            "description": device_data["label"] + ": " + device_data["device"],
            "remote": [],
            "display": {}
        }
    }
    try:
        configFiles.write(modules.rm3config.remotes + device_data["config_remote"], remote)
    except Exception as e:
        return "ERROR: " + str(e)

    return ("OK: Device " + device + " added.")


def deleteDevice(device):
    """
    delete device from json config file and delete device related files
    """

    message = ""
    devices = {}
    active_json = configFiles.read_status()
    interface = active_json[device]["config"]["interface_api"]
    device_code = active_json[device]["config"]["device"]
    device_remote = active_json[device]["config"]["remote"]
    file_device_remote = modules.rm3config.remotes + device_remote
    file_inferface_remote = modules.rm3config.commands + interface + "/" + device_code

    if "ERROR" in active_json:                                                return (
        "ERROR: Could not read ACTIVE_JSON (active).")
    if not device in active_json:                                             return (
            "ERROR: Device " + device + " doesn't exists (active).")
    if not modules.rm3json.if_exist(modules.rm3config.commands + interface + "/" + device_code):      return (
            "ERROR: Device " + device + " doesn't exists (commands).")
    if not modules.rm3json.if_exist(modules.rm3config.remotes + device_remote):                  return (
            "ERROR: Device " + device + " doesn't exists (remotes).")

    interface = active_json[device]["config"]["interface_api"]  ############# funtioniert nicht so richtig ...
    for entry in active_json:
        if entry != device:
            devices[entry] = active_json[entry]

    active_json = devices
    configFiles.write_status(active_json, "deleteDevice")

    try:
        modules.rm3json.delete(file_device_remote)
        modules.rm3json.delete(file_inferface_remote)

        if not modules.rm3json.if_exist(file_device_remote) and not modules.rm3json.if_exist(file_interface_remote):
            message = "OK: Device '" + device + "' deleted."
        else:
            message = "ERROR: Could not delete device '" + device + "'"

    except Exception as e:
        message = "ERROR: Could not delete device '" + device + "': " + str(e)

    if "OK" in message:
        try:
            file_inferface_remote = file_inferface_remote.replace("/", "**")
            file_device_remote = file_device_remote.replace("/", "**")
            del configFiles.cache[file_inferface_remote]
            del configFiles.cache[file_device_remote]

        except Exception as e:
            message += "; ERROR: " + str(e)

    return message


def editDevice(device, info):
    """
    edit device data in json file
    """

    keys_active = ["label", "image", "description", "main-audio", "interface"]
    keys_commands = ["description", "method"]
    keys_remotes = ["description", "remote", "display", "display-size", "type"]

    #    keys_remotes  = ["label","remote","macro-channel","devices","display","display-size"]

    # read central config file
    active_json = RmReadData_devices(selected=[], remotes=False, config_only=False)

    logging.info(active_json)

    interface = active_json[device]["config"]["interface_api"]
    device_code = active_json[device]["config"]["device"]
    device_remote = active_json[device]["config"]["remote"]

    # read command definition
    commands = configFiles.read(modules.rm3config.commands + interface + "/" + device_code)
    if "ERROR" in commands: return ("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes = configFiles.read(modules.rm3config.remotes + device_remote)
    if "ERROR" in remotes: return ("ERROR: Device " + device + " doesn't exists (remotes).")

    i = 0
    for key in keys_active:
        if key in info:
            active_json[device]["settings"][key] = info[key]
            i += 1

    for key in keys_commands:
        if key in info:
            commands["data"][key] = info[key]
            i += 1

    for key in keys_remotes:
        if key in info:
            remotes["data"][key] = info[key]
            i += 1

    # write central config file
    try:
        RmWriteData_devices(active_json)
    except Exception as e:
        return "ERROR: could not write changes (active) - " + str(e)

    # write command definition
    try:
        configFiles.write(modules.rm3config.commands + interface + "/" + device_code, commands)
    except Exception as e:
        return "ERROR: could not write changes (commands) - " + str(e)

    # write remote layout definition
    try:
        configFiles.write(modules.rm3config.remotes + device_remote, remotes)
    except Exception as e:
        return "ERROR: could not write changes (remotes) - " + str(e)

    if i > 0:
        return "OK: Edited device parameters of " + device + " (" + str(i) + " changes)"
    else:
        return "ERROR: no data key matched with keys from config-files (" + str(info.keys) + ")"


def addCommand2Button(device, button, command):
    """
    add new command to button or change existing
    """

    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    device_remote = config[device]["config"]["remote"]
    data = configFiles.read(modules.rm3config.commands + interface + "/" + device_code)

    if "data" in data:
        if button in data["data"]["buttons"].keys():
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            command = str(command)
            command = command.replace("b'", "")
            command = command.replace("'", "")
            data["data"]["buttons"][button] = command
            configFiles.write(modules.rm3config.commands + interface + "/" + device_code, data)
            return "OK: Button '" + device + "_" + button + "' recorded and saved: " + str(command)
    else:
        return "ERROR: Device '" + device + "' does not exists."


def addButton(device, button):
    """
    add new button to remote layout
    """

    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    device_remote = config[device]["config"]["remote"]
    data = configFiles.read(modules.rm3config.remotes + device_remote)
    #    data        = configFiles.read(modules.remotes+interface+"/"+device_code)

    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            # configFiles.write(modules.remotes+interface+"/"+device_code,data)
            configFiles.write(modules.rm3config.remotes + device_remote, data)
            return "OK: Button '" + device + "_" + button + "' added."
    else:
        return "ERROR: Device '" + device + "' does not exists."

    # ---------------------------------------


def deleteCmd(device, button):
    """
    delete command (not button) from json config file
    """

    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    data = configFiles.read(modules.rm3config.commands + interface + "/" + device_code)

    if data["data"]:
        if button in data["data"]["buttons"].keys():

            data["data"]["buttons"].pop(button, None)
            data = configFiles.write(modules.rm3config.commands + interface + "/" + device_code, data)
            return "OK: Command '" + device + "_" + button + "' deleted."
        else:
            return "ERROR: Command '" + device + "_" + button + "' does not exist."
    else:
        return "ERROR: Device '" + device + "' does not exist."


def deleteButton(device, button_number):
    """
    delete button (not command) from json config file
    """

    buttonNumber = int(button_number)
    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    device_remote = config[device]["config"]["remote"]
    data = configFiles.read(modules.rm3config.remotes + device_remote)
    #    data         = configFiles.read(modules.remotes+interface+"/"+device_code)

    if data["data"] and data["data"]["remote"]:
        if buttonNumber >= 0 and buttonNumber < len(data["data"]["remote"]):
            data["data"]["remote"].pop(buttonNumber)
            data = configFiles.write(modules.rm3config.remotes + device_remote, data)
            return "OK: Button '" + device + " [" + str(buttonNumber) + "] deleted."
        else:
            return "ERROR: Button '" + device + " [" + str(buttonNumber) + "] does not exist."
    else:
        return "ERROR: Device '" + device + "' does not exist."


def editMacros(macros):
    """
    check if format is correct and save macros
    """
    macro_keys = ["macro", "dev-on", "dev-off", "scene-on", "scene-off"]

    if not isinstance(macros, dict):                  return "ERROR: wrong data format - not a dict."
    for key in macros:
        if not isinstance(macros[key], dict):          return "ERROR: wrong data format - not a dict (" + str(
            key) + ")."
        if key not in macro_keys:                      return "ERROR: wrong data format - unknown key (" + str(
            key) + ")"
        for key2 in macros[key]:
            if not isinstance(macros[key][key2], list): return "ERROR: wrong data format - macro is not a list (" + str(
                key) + "/" + str(key2) + ")"
            for list_key in macros[key][key2]:
                if not (isinstance(list_key, float) or isinstance(list_key, int)) and not isinstance(list_key, str):
                    return "ERROR: wrong data format - list entry is not a number or string (" + str(key) + "/" + str(
                        key2) + "/" + str(list_key) + ")"

    macro_file = RmReadData_macros()
    for key in macros:
        macro_file[key] = macros[key]
    RmWriteData_macros(macro_file)

    return "OK, saved macro file."


def addTemplate(device, template):
    """
    add / overwrite remote layout definition by template
    """

    templates = configFiles.read(modules.rm3config.templates + template)
    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    device_remote = config[device]["config"]["remote"]
    data = configFiles.read(modules.rm3config.remotes + device_remote)

    # check if error
    if "data" not in data.keys():
        return "ERROR: Device '" + device + "' does not exists."

    # add layout from template
    elif template in templates and data["data"] == []:

        if "data" in templates:
            data["data"]["remote"] = templates["data"]["remote"]
        else:
            data["data"]["remote"] = templates[template]["remote"]
        configFiles.write(modules.rm3config.remotes + device_remote, data)
        return "OK: Template '" + template + "' added to '" + device + "'."

    # overwrite layout from template
    elif template in templates and data["data"] != []:

        if "data" in templates:
            data["data"]["remote"] = templates["data"]["remote"]
        else:
            data["data"]["remote"] = templates[template]["remote"]

        configFiles.write(modules.rm3config.remotes + device_remote, data)
        return "OK: Remote definition of '" + device + "' overwritten by template '" + template + "'."

    # template doesn't exist
    else:
        return "ERROR: Template '" + template + "' does't exists."


def changeVisibility(type, device, visibility):
    """
    change visibility in device configuration (yes/no)
    """

    if type == "remote":

        data = configFiles.read_status()
        if device not in data:
            return "Remote control '" + device + "' does not exists."

        elif visibility == "yes" or visibility == "no":
            data[device]["settings"]["visible"] = visibility
            configFiles.write_status(data, "changeVisibility")
            return "OK: Change visibility for '" + device + "': " + visibility

        else:
            return "ERROR: Visibility value '" + visibility + "' does not exists."

    elif type == "scene":

        data = RmReadData_scenes(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
        if device not in data.keys():
            return "Scene '" + device + "' does not exists."

        elif visibility == "yes" or visibility == "no":
            data[device]["settings"]["visible"] = visibility
            RmWriteData_scenes(data)
            configFiles.cache_update = True
            return "OK: Change visibility for '" + device + "': " + visibility

        else:
            return "ERROR: Visibility value '" + visibility + "' does not exists."

    else:
        return "ERROR: changeVisibility - Type doesn't exist (" + type + ")."


def moveDeviceScene(button_type, device, direction):
    """
    move device or scene button, direction => -x steps backward / x steps forward
    """

    if button_type == "device":
        status = configFiles.read_status()
    elif button_type == "scene":
        status = RmReadData_scenes(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
    else:
        return "ERROR: type " + button_type + " is unknown."

    # normalize position (required, if remotes have been deleted)
    order = {}
    order_keys = []
    for key in status:
        pos = status[key]["settings"]["position"]
        if pos < 10:
            pos = "00" + str(pos)
        elif pos < 100:
            pos = "0" + str(pos)
        else:
            pos = str(pos)
        order[pos] = key
        order_keys.append(pos)

    order_keys.sort()
    i = 1
    for key in order_keys:
        status[order[key]]["settings"]["position"] = i
        i += 1

    # start move
    position = True
    direction = int(direction)
    return_msg = ""

    # check if device is defined
    if device not in status:
        return "ERROR: " + button_type + " not defined."

    # check if position is defined and add, if not existing
    for key in status:
        if not "position" in status[key]["settings"]:
            position = False

    i = 1
    if position == False:
        for key in status:
            status[key]["settings"]["position"] = i
            i += 1
        if button_type == "device":
            configFiles.write_status(status)
        elif button_type == "scene":
            RmWriteData_scenes(status)  # configFiles.write(modules.active_scenes,status)

        return_msg = "WARN: Position wasn't existing. Has been set, please move again."

    # get position and move into direction
    else:
        i = 1
        for key in status: i += 1

        if status[device]["settings"]["position"] + direction > 0 and status[device]["settings"][
            "position"] + direction < i:
            old_position = status[device]["settings"]["position"]
            new_position = status[device]["settings"]["position"] + direction

            for key in status:
                if status[key]["settings"]["position"] == new_position: status[key]["settings"][
                    "position"] = old_position

            status[device]["settings"]["position"] = new_position
            return_msg = "OK. Moved " + device + " from " + str(old_position) + " to " + str(new_position) + "."

        else:
            return_msg = "WARN: Out of range."

    if button_type == "device":
        configFiles.write_status(status)
    elif button_type == "scene":
        RmWriteData_scenes(status)  # configFiles.write(modules.active_scenes,status)

    configFiles.cache_update = True
    return return_msg


def setStatus(device, key, value):
    """
    change status and write to file
    """

    status = configFiles.read_status()

    # set status
    if key == "":
        key = "power"

    if device in status:
        logging.debug("setStatus:" + key + "=" + str(value))
        status[device]["status"][key] = value
        configFiles.write_status(status, "setStatus")

    else:
        logging.warn("setStatus: device does not exist (" + device + ")")
        return "ERROR setStatus: device does not exist (" + device + ")"

    return "TBC: setStatus: " + device + "/" + key + "/" + str(value)


def getStatus(device, key):
    """
    get status of device
    """
    status = configFiles.read_status()

    if not device in status:
        logging.error("Get status - Device not defined: " + device + " (" + key + ")")
        return 0

    if device in status and key in status[device]["status"]:
        logging.debug("Get status: " + key + " = " + str(status[device]["status"][key]))
        return status[device]["status"][key]

    else:
        logging.error("Get status: " + key + "/" + device)
        return 0

    # -----------------------------------------------


def resetStatus():
    """
    set status for all devices to OFF
    """

    status = configFiles.read_status()

    # reset if device is not able to return status and interface is defined
    for key in status:

        if status[key]["config"]["interface_api"] != "":
            device_code = configFiles.translate_device(key)
            device = configFiles.read(
                modules.rm3config.commands + status[key]["config"]["interface_api"] + "/" + device_code)
            logging.info("Reset Device: " + device_code + "/" + status[key]["config"]["interface_api"])

            if device["data"]["method"] != "query":
                status[key]["status"]["power"] = "OFF"

    configFiles.write_status(status, "resetStatus")
    return "TBC: Reset POWER to OFF for devices without API"


def resetAudio():
    """
    set status for all devices to OFF
    """

    status = configFiles.read_status()

    # reset if device is not able to return status and interface is defined
    for key in status:

        if status[key]["config"]["interface_api"] != "":

            device_code = configFiles.translate_device(key)
            device = configFiles.read(
                modules.rm3config.commands + status[key]["config"]["interface_api"] + "/" + device_code)
            logging.info("Reset Device: " + device_code + "/" + status[key]["config"]["interface_api"])

            if device["data"]["method"] != "query":
                if "vol" in status[key]["status"]: status[key]["status"]["vol"] = 0
                if "mute" in status[key]["status"]: status[key]["status"]["mute"] = "OFF"

    configFiles.write_status(status, "resetAudio")
    return "TBC: Reset AUDIO to 0 for devices without API"


def setMainAudioDevice(device):
    """
    set device as main audio device
    """

    return_msg = ""
    status = configFiles.read_status()

    if device in status:
        for key in status:
            if key == device:
                status[key]["main-audio"] = "yes"
            else:
                status[key]["main-audio"] = "no"
        return_msg = "OK: Set " + device + " as main-audio device."
    else:
        return_msg = "ERROR: device not defined."

    configFiles.write_status(status, "resetAudio")
    return return_msg


def devicesGetStatus(data, readAPI=False):
    """
    read status data from config file (method=record) and/or device APIs (method=query)
    data -> data["DATA"]["devices"]
    """

    # devices = configFiles.read_status()
    devices = RmReadData_devices([], True, False)
    config = RmReadData_devicesConfig()

    # set reload status
    if readAPI == True:
        queueQuery.add2queue(["START_OF_RELOAD"])
        queueQuery.add2queue([0.5])
        logging.info("RELOAD data from devices")

    # read status of all devices
    for device in devices:

        if device == "default":
            continue

        if "status" not in devices[device]:
            devices[device]["status"] = {}

        if device in data and device in config and "interface" in config[device] and "method" in config[device][
            "interface"]:

            interface = config[device]["interface"]["interface_api"]
            api_dev = config[device]["interface"]["interface_api"] + "_" + config[device]["interface"]["interface_dev"]
            method = config[device]["interface"]["method"]

            # get status values from config files, if connected
            if api_dev in deviceAPIs.api and deviceAPIs.api[api_dev].status == "Connected":

                # preset values
                if method != "query":
                    for value in config[device]["commands"]["definition"]:
                        if not value in devices[device]["status"]:
                            devices[device]["status"][value] = ""

                # get values from config file
                for value in devices[device]["status"]:
                    data[device]["status"][value] = devices[device]["status"][value]

                # request update for devices with API query
                if method == "query" and readAPI == True:
                    queueQuery.add2queue([0.1])  # wait a few seconds before queries
                    queueQuery.add2queue(
                        [[interface, device, config[device]["commands"]["get"], ""]])  # add querylist per device

    # set reload status
    if readAPI == True:
        queueQuery.add2queue(["END_OF_RELOAD"])

    # mark API update as done
    configInterfaces.cache_update_api = False

    return data


def getButtonValue(device, button):
    """
    Get Status from device for a specific button or display value
    """

    power_buttons = ["on", "on-off", "off"]
    if button in power_buttons: button = "power"

    method = configFiles.cache["_api"]["devices"][device]["method"]
    interface = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]

    logging.debug("getButtonValue: ...m:" + method + " ...d:" + device + " ...b:" + button + " ...s:" + str(state))

    if method == "record":
        getStatus(device, button)
    elif method == "query":
        return deviceAPIs.api_query(interface, device, button)
    else:
        return "ERROR: Wrong method (" + method + ")"

    return "OK"


def setButtonValue(device, button, state):
    """
    Set Status of device for a specific button or display value (method = "record")
    used via callback from queueSend also
    """

    power_buttons = ["on", "on-off", "off"]
    vol_buttons = ["vol+", "vol-"]
    method = configFiles.cache["_api"]["devices"][device]["method"]

    logging.debug("setButtonValue: ...m:" + method + " ...d:" + device + " ...b:" + button + " ...s:" + str(state))

    if method == "record":

        if button in power_buttons: button = "power"
        if button in vol_buttons:   button = "vol"
        if button == "on":          state = "ON"
        if button == "off":         state = "OFF"

        msg = setStatus(device, button, state)
        configFiles.cache_time = 0

        if "ERROR" in msg:
            return msg
        else:
            return "OK"

    else:
        logging.warn("setButtonValue: Wrong method (" + method + "," + device + "," + button + ")")
        return "ERROR: Wrong method (" + method + ")"
