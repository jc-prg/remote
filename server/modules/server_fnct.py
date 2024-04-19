import logging
import modules.rm3cache as rm3cache
import modules.rm3data as rm3data
import modules.rm3json
import modules.rm3queue as rm3queue
import modules.rm3config as rm3config
import interfaces


configInterfaces = rm3cache.ConfigInterfaces("configInterfaces")
configFiles = rm3cache.ConfigCache("ConfigFiles")

if configFiles.check_config() == "ERROR":
    exit()
else:
    configFiles.start()
    configInterfaces.start()

deviceAPIs = interfaces.Connect(configFiles)
deviceAPIs.start()

queueSend = rm3queue.QueueApiCalls("queueSend", "send", deviceAPIs, configFiles)
queueSend.start()

queueQuery = rm3queue.QueueApiCalls("queueQuery", "query", deviceAPIs, configFiles)
queueQuery.start()

remoteData = rm3data.RemoteData(configFiles, configInterfaces, deviceAPIs, queueQuery)

RmReadData_errors = {}


def refreshCache():
    """
    Reset vars to enforce a refresh of all cached data
    """
    configFiles.update()


def addScene(scene, info):
    """
    add new scene in active_jsons and create scene remote layout
    """
    active_json = remoteData.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)

    if scene in active_json:
        return "WARN: Scene " + scene + " already exists (active)."
    if modules.rm3json.if_exist(rm3config.remotes + "scene_" + scene):    return (
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
        remoteData.scenes_write(active_json)
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
        configFiles.write(rm3config.remotes + "scene_" + scene, remote)
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
    active_json = remoteData.scenes_read(selected=[], remotes=False)

    # read remote layout definitions
    remotes = configFiles.read(rm3config.remotes + "scene_" + scene)
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
    remoteData.scenes_write(active_json)

    # write remote layout definition
    try:
        configFiles.write(rm3config.remotes + "scene_" + scene, remotes)
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

    active_json = remoteData.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)

    if "ERROR" in active_json:
        return "ERROR: Could not read ACTIVE_JSON (active)."
    if scene not in active_json:
        return "ERROR: Scene " + scene + " doesn't exists (active)."
    if not modules.rm3json.if_exist(rm3config.remotes + "scene_" + scene):
        return "ERROR: Scene " + scene + " doesn't exists (remotes)."

    del active_json[scene]
    # configFiles.write(modules.active_scenes, active_json)
    remoteData.scenes_write(active_json)

    try:
        modules.rm3json.delete(rm3config.remotes + "scene_" + scene)
        configFiles.cache_update = True
        if not modules.rm3json.if_exist(rm3config.remotes + "scene_" + scene):
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
    if modules.rm3json.if_exist(rm3config.commands + interface + "/" + device_data["config_device"]): return (
            "WARN: Device " + device + " already exists (devices).")
    if modules.rm3json.if_exist(rm3config.remotes + device_data["config_remote"]):               return (
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
        configFiles.write(rm3config.commands + interface + "/" + device_data["config_device"], buttons)
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
        configFiles.write(rm3config.remotes + device_data["config_remote"], remote)
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
    file_device_remote = rm3config.remotes + device_remote
    file_inferface_remote = rm3config.commands + interface + "/" + device_code

    if "ERROR" in active_json:                                                return (
        "ERROR: Could not read ACTIVE_JSON (active).")
    if not device in active_json:                                             return (
            "ERROR: Device " + device + " doesn't exists (active).")
    if not modules.rm3json.if_exist(rm3config.commands + interface + "/" + device_code):      return (
            "ERROR: Device " + device + " doesn't exists (commands).")
    if not modules.rm3json.if_exist(rm3config.remotes + device_remote):                  return (
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
    active_json = remoteData.devices_read(selected=[], remotes=False)

    logging.info(active_json)

    interface = active_json[device]["config"]["interface_api"]
    device_code = active_json[device]["config"]["device"]
    device_remote = active_json[device]["config"]["remote"]

    # read command definition
    commands = configFiles.read(rm3config.commands + interface + "/" + device_code)
    if "ERROR" in commands: return ("ERROR: Device " + device + " doesn't exists (commands).")

    # read remote layout definitions
    remotes = configFiles.read(rm3config.remotes + device_remote)
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
        remoteData.devices_write(active_json)
    except Exception as e:
        return "ERROR: could not write changes (active) - " + str(e)

    # write command definition
    try:
        configFiles.write(rm3config.commands + interface + "/" + device_code, commands)
    except Exception as e:
        return "ERROR: could not write changes (commands) - " + str(e)

    # write remote layout definition
    try:
        configFiles.write(rm3config.remotes + device_remote, remotes)
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
    data = configFiles.read(rm3config.commands + interface + "/" + device_code)

    if "data" in data:
        if button in data["data"]["buttons"].keys():
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            command = str(command)
            command = command.replace("b'", "")
            command = command.replace("'", "")
            data["data"]["buttons"][button] = command
            configFiles.write(rm3config.commands + interface + "/" + device_code, data)
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
    data = configFiles.read(rm3config.remotes + device_remote)
    #    data        = configFiles.read(modules.remotes+interface+"/"+device_code)

    if "data" in data:
        if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
            return "WARN: Button '" + device + "_" + button + "' already exists."
        else:
            if button == "DOT": button = "."
            data["data"]["remote"].append(button)
            # configFiles.write(modules.remotes+interface+"/"+device_code,data)
            configFiles.write(rm3config.remotes + device_remote, data)
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
    data = configFiles.read(rm3config.commands + interface + "/" + device_code)

    if data["data"]:
        if button in data["data"]["buttons"].keys():

            data["data"]["buttons"].pop(button, None)
            data = configFiles.write(rm3config.commands + interface + "/" + device_code, data)
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
    data = configFiles.read(rm3config.remotes + device_remote)
    #    data         = configFiles.read(modules.remotes+interface+"/"+device_code)

    if data["data"] and data["data"]["remote"]:
        if buttonNumber >= 0 and buttonNumber < len(data["data"]["remote"]):
            data["data"]["remote"].pop(buttonNumber)
            data = configFiles.write(rm3config.remotes + device_remote, data)
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

    if not isinstance(macros, dict):
        return "ERROR: wrong data format - not a dict."
    for key in macros:
        if not isinstance(macros[key], dict):
            return "ERROR: wrong data format - not a dict (" + str(key) + ")."
        if key not in macro_keys:
            return "ERROR: wrong data format - unknown key (" + str(key) + ")"
        for key2 in macros[key]:
            if not isinstance(macros[key][key2], list):
                return "ERROR: wrong data format - macro is not a list (" + str(key) + "/" + str(key2) + ")"
            for list_key in macros[key][key2]:
                if not (isinstance(list_key, float) or isinstance(list_key, int)) and not isinstance(list_key, str):
                    return "ERROR: wrong data format - list entry is not a number or string (" + str(key) + "/" + str(
                        key2) + "/" + str(list_key) + ")"

    macro_file = remoteData.macros_read()
    for key in macros:
        macro_file[key] = macros[key]
    remoteData.macros_write(macro_file)

    return "OK, saved macro file."


def addTemplate(device, template):
    """
    add / overwrite remote layout definition by template
    """

    templates = configFiles.read(rm3config.templates + template)
    config = configFiles.read_status()
    interface = config[device]["config"]["interface_api"]
    device_code = config[device]["config"]["device"]
    device_remote = config[device]["config"]["remote"]
    data = configFiles.read(rm3config.remotes + device_remote)

    # check if error
    if "data" not in data.keys():
        return "ERROR: Device '" + device + "' does not exists."

    # add layout from template
    elif template in templates and data["data"] == []:

        if "data" in templates:
            data["data"]["remote"] = templates["data"]["remote"]
        else:
            data["data"]["remote"] = templates[template]["remote"]
        configFiles.write(rm3config.remotes + device_remote, data)
        return "OK: Template '" + template + "' added to '" + device + "'."

    # overwrite layout from template
    elif template in templates and data["data"] != []:

        if "data" in templates:
            data["data"]["remote"] = templates["data"]["remote"]
        else:
            data["data"]["remote"] = templates[template]["remote"]

        configFiles.write(rm3config.remotes + device_remote, data)
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

        data = remoteData.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
        if device not in data.keys():
            return "Scene '" + device + "' does not exists."

        elif visibility == "yes" or visibility == "no":
            data[device]["settings"]["visible"] = visibility
            remoteData.scenes_write(data)
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
        status = remoteData.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
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
            remoteData.scenes_write(status)  # configFiles.write(modules.active_scenes,status)

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
        remoteData.scenes_write(status)  # configFiles.write(modules.active_scenes,status)

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
                rm3config.commands + status[key]["config"]["interface_api"] + "/" + device_code)
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
                rm3config.commands + status[key]["config"]["interface_api"] + "/" + device_code)
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
                status[key]["settings"]["main-audio"] = "yes"
            else:
                status[key]["settings"]["main-audio"] = "no"
        configFiles.write_status(status, "resetAudio")

        if "main-audio" in status2[device]["settings"] and status2[device]["settings"]["main-audio"] == "yes":
            return_msg = "OK: Set " + device + " as main-audio device."
        else:
            return_msg = "ERROR: Could not set " + device + " as main-audio device."
    else:
        return_msg = "ERROR: device not defined."

    return return_msg


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
