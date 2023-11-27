# API commands defined in swagger.yml
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import time
import logging
import modules.rm3stage
import modules.rm3config
from modules.server_fnct import *

# ---------------------------

Status = "Starting"

if modules.rm3stage.test:
    Stage = "Test Stage"
else:
    Stage = "Prod Stage"


# ---------------------------


def remoteAPI_start(setting=[]):
    """
    create data structure for API response and read relevant data from config files
    """
    global Status, LastAPICall, RmReadData_errors

    # set time for last action -> re-read API information only if clients connected
    configFiles.cache_last_action = time.time()
    data = configFiles.api_init.copy()

    if "status-only" not in setting and "request-only" not in setting:
        data["DATA"] = RmReadData()

        data["CONFIG"] = {}
        data["CONFIG"]["button_images"] = configFiles.read(modules.rm3stage.icons_dir + "/index")
        data["CONFIG"]["button_colors"] = configFiles.read(modules.rm3config.buttons + "button_colors")
        data["CONFIG"]["scene_images"] = configFiles.read(modules.rm3stage.scene_img_dir + "/index")
        data["CONFIG"]["devices"] = RmReadData_devicesConfig()
        data["CONFIG"]["interfaces"] = deviceAPIs.available
        data["CONFIG"]["methods"] = deviceAPIs.methods

        for device in data["DATA"]["devices"]:
            data["CONFIG"]["main-audio"] = "NONE"
            if "main-audio" in data["DATA"]["devices"][device]["settings"] and \
                    data["DATA"]["devices"][device]["settings"]["main-audio"] == "yes":
                data["CONFIG"]["main-audio"] = device
                break
    else:
        if "DATA" in data:
            del data["DATA"]

    if "request-only" in setting:
        logging.info("----------- !!! " + str(data))

    data["REQUEST"] = {}
    data["REQUEST"]["start-time"] = time.time()
    data["REQUEST"]["Button"] = queueSend.last_button

    data["STATUS"] = {}
    if "request-only" not in setting:
        data["STATUS"]["devices"] = RmReadData_deviceStatus()
        data["STATUS"]["scenes"] = RmReadData_sceneStatus()
        data["STATUS"]["interfaces"] = deviceAPIs.api_get_status()
        data["STATUS"]["system"] = {}  # to be filled in remoteAPI_end()
        data["STATUS"]["request_time"] = queueSend.average_exec
        data["STATUS"]["config_errors"] = RmReadData_errors

    return data.copy()


def remoteAPI_end(data, setting=[]):
    """
    add system status and timing data to API response
    """
    global Status

    data["REQUEST"]["load-time"] = (time.time() - data["REQUEST"]["start-time"])
    data["STATUS"]["system"] = {
        "message": Status,
        "server_start": modules.rm3config.start_time,
        "server_start_duration": modules.rm3config.start_duration,
        "server_running": time.time() - modules.rm3config.start_time
    }

    # --------------------------------

    if "CONFIG" in data:
        data["CONFIG"]["reload_status"] = queueQuery.reload
        data["CONFIG"]["reload_config"] = configFiles.cache_update

    # --------------------------------

    if "no-data" in setting and "DATA" in data:
        del data["DATA"]
    if "no-config" in setting and "CONFIG" in data:
        del data["CONFIG"]
    if "no-status" in setting and "STATUS" in data:
        del data["STATUS"]

    if "ERROR" in data["REQUEST"]["Return"]:
        logging.error(data["REQUEST"]["Return"])

    return data.copy()


def RemoteToggle(current_value, complete_list):
    """
    get net value from list
    """
    logging.warning("Toggle: " + current_value + ": " + str(complete_list))

    count = 0
    match = -1
    for element in complete_list:
        if current_value != element:
            count += 1
        else:
            match = count

    match += 1

    if -1 < match < len(complete_list):
        value = complete_list[match]
    elif match == len(complete_list):
        value = complete_list[0]
    else:
        value = "ERROR: value not found"

    logging.warning("Toggle: " + current_value + ": " + value)
    return value


def RemoteReload():
    """
    reload interfaces and reload config data in cache
    """
    logging.warning("Request cache reload and device reconnect.")

    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = "OK: Configuration reloaded"
    data["REQUEST"]["Command"] = "Reload"

    deviceAPIs.api_reconnect()
    devicesGetStatus(data, readAPI=True)
    refreshCache()

    data = remoteAPI_end(data, ["no-data"])
    return data


def RemoteCheckUpdate(APPversion):
    """
    Check if app is supported by this server version
    """
    refreshCache()
    d = {}
    data = remoteAPI_start(["request-only"])

    if APPversion == modules.rm3config.APPversion:
        d["ReturnCode"] = "800"
        d["ReturnMsg"] = "OK: " + modules.rm3config.ErrorMsg("800")
    elif APPversion in modules.rm3config.APPsupport:
        d["ReturnCode"] = "801"
        d["ReturnMsg"] = "WARN: " + modules.rm3config.ErrorMsg("801")
    else:
        d["ReturnCode"] = "802"
        d["ReturnMsg"] = "WARN: " + modules.rm3config.ErrorMsg("802")

    data["REQUEST"]["Return"] = d["ReturnMsg"]
    data["REQUEST"]["ReturnCode"] = d["ReturnCode"]
    data["REQUEST"]["Command"] = "CheckUpdate"

    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteList():
    """
    Load and list all data
    """
    data = remoteAPI_start()
    data["REQUEST"]["Return"] = "OK: Returned list and status data."
    data["REQUEST"]["Command"] = "List"
    data = remoteAPI_end(data)
    return data


def RemoteStatus():
    """
    Load and list all data
    """
    data = remoteAPI_start(["status-only"])
    data["REQUEST"]["Return"] = "OK: Returned status data."
    data["REQUEST"]["Command"] = "Status"
    data = remoteAPI_end(data)  #, ["no-config"])
    return data


def Remote(device, button):
    """
    send command and return JSON msg
    """
    data = remoteAPI_start(["request-only"])
    interface = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]

    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = button
    data["REQUEST"]["Return"] = queueSend.add2queue([[interface, device, button, ""]])
    data["REQUEST"]["Command"] = "Remote"

    if "ERROR" in data["REQUEST"]["Return"]:
        logging.error(data["REQUEST"]["Return"])

    data["DeviceStatus"] = getStatus(device, "power")  # to be removed
    data["ReturnMsg"] = data["REQUEST"]["Return"]  # to be removed

    data = remoteAPI_end(data, ["no-data"])
    return data


def RemoteSendText(device, button, text):
    """
    send command and return JSON msg
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = button
    data["REQUEST"]["Command"] = "RemoteSendText"

    if device in configFiles.cache["_api"]["devices"]:
        interface = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]
        data["REQUEST"]["Return"] = queueSend.add2queue([[interface, device, button, text]])

    else:
        data["REQUEST"]["Return"] = "ERROR: Device '" + device + "' not defined."

    if "ERROR" in data["REQUEST"]["Return"]:
        logging.error(data["REQUEST"]["Return"])

    data["DeviceStatus"] = getStatus(device, "power")  # to be removed
    data["ReturnMsg"] = data["REQUEST"]["Return"]  # to be removed

    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteSet(device, command, value):
    """
    send command incl. value and return JSON msg
    """
    data = remoteAPI_start()
    interface = configFiles.cache["_api"]["devices"][device]["config"]["interface_api"]
    method = deviceAPIs.api_method(device)

    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = command
    data["REQUEST"]["Command"] = "Set"

    if method == "query":
        # data["REQUEST"]["Return"] = deviceAPIs.send(interface,device,command,value)
        data["REQUEST"]["Return"] = queueSend.add2queue([[interface, device, command, value]])
        devicesGetStatus(data, readAPI=True)

    elif method == "record":
        data["REQUEST"]["Return"] = setStatus(device, command, value)
        devicesGetStatus(data, readAPI=True)

    refreshCache()
    data = remoteAPI_end(data, ["no-data"])
    return data


def RemoteMacro(macro):
    """
    execute macro (list of commands)
    """
    data = remoteAPI_start()
    data["REQUEST"]["Button"] = macro
    data["REQUEST"]["Return"] = "ERROR: Started but not finished..."  # deviceAPIs.send(interface,device,button)
    data["REQUEST"]["Command"] = "Macro"

    commands_1st = macro.split("::")
    commands_2nd = []
    commands_3rd = []
    commands_4th = []
    return_msg = ""

    logging.debug("Decoded macro-string 1st: " + str(commands_1st))

    # decode macros: scene-on/off
    for command in commands_1st:
        command_str = str(command)
        if not command_str.isnumeric() and "_" in command:
            device, button = command.split("_", 1)
            if "scene-on_" in command:
                if button in data["DATA"]["macros"]["scene-on"]:
                    commands_2nd.extend(data["DATA"]["macros"]["scene-on"][button])
                else:
                    return_msg += "; ERROR: macro not defined (" + command + ")"
            elif "scene-off_" in command:
                if button in data["DATA"]["macros"]["scene-off"]:
                    commands_2nd.extend(data["DATA"]["macros"]["scene-off"][button])
                else:
                    return_msg += "; ERROR: macro not defined (" + command + ")"
            else:
                commands_2nd.extend([command])
        else:
            commands_2nd.extend([command])

    logging.debug("Decoded macro-string 2nd: " + str(commands_2nd))

    # decode macros: dev-on/off
    for command in commands_2nd:
        command_str = str(command)
        if not command_str.isnumeric() and "_" in command:
            device, button = command.split("_", 1)
            if "dev-on_" in command:
                if button in data["DATA"]["macros"]["dev-on"]:
                    commands_3rd.extend(data["DATA"]["macros"]["dev-on"][button])
                else:
                    return_msg += "; ERROR: macro not defined (" + command + ")"
            elif "dev-off_" in command:
                if button in data["DATA"]["macros"]["dev-off"]:
                    commands_3rd.extend(data["DATA"]["macros"]["dev-off"][button])
                else:
                    return_msg += "; ERROR: macro not defined (" + command + ")"
            else:
                commands_3rd.extend([command])
        else:
            commands_3rd.extend([command])

    logging.debug("Decoded macro-string 3rd: " + str(commands_3rd))

    # decode macros: macro
    for command in commands_3rd:
        command_str = str(command)
        if not command_str.isnumeric() and "_" in command:
            device, button = command.split("_", 1)
            if "macro_" in command:
                if button in data["DATA"]["macros"]["macro"]:
                    commands_4th.extend(data["DATA"]["macros"]["macro"][button])
                else:
                    return_msg += "; ERROR: macro not defined (" + command + ")"
            else:
                commands_4th.extend([command])
        else:
            commands_4th.extend([command])

    logging.debug("Decoded macro-string 4th: " + str(commands_4th))

    # execute buttons
    for command in commands_4th:
        command_str = str(command)
        if not command_str.isnumeric() and "_" in command:

            status = ""
            power_buttons = ["on", "on-off", "off"]
            device, button_status = command.split("_", 1)  # split device and button

            if device not in data["DATA"]["devices"]:
                error_msg = "; ERROR: Device defined in macro not found (" + device + ")"
                return_msg += error_msg
                logging.error(error_msg)
                continue

            interface = data["CONFIG"]["devices"][device]["interface"]["interface_api"]  # get interface / API
            method = data["CONFIG"]["devices"][device]["interface"]["method"]

            # check if future state defined
            if "||" in button_status:
                button, status = button_status.split("||", 1)  # split button and future state
                if "-" not in status:
                    status = status.upper()
            else:
                button = button_status

            if button in power_buttons:
                status_var = "power"
            else:
                status_var = button

            # if future state not already in place add command to queue
            logging.debug(" ...i:" + interface + " ...d:" + device + " ...b:" + button + " ...s:" + status)

            if device in data["DATA"]["devices"] and status_var in data["DATA"]["devices"][device]["status"]:
                logging.debug(" ...y:" + status_var + "=" +
                              str(data["DATA"]["devices"][device]["status"][status_var]) + " -> " + status)

                if data["DATA"]["devices"][device]["status"][status_var] != status:
                    return_msg += ";" + queueSend.add2queue([[interface, device, button, status]])

            # if no future state is defined just add command to queue
            elif status == "":
                return_msg += ";" + queueSend.add2queue([[interface, device, button, ""]])

        # if command is numeric, add to queue directly (time to wait)
        elif command_str.isnumeric():
            return_msg += ";" + queueSend.add2queue([float(command)])

    refreshCache()
    if return_msg != "":
        data["REQUEST"]["Return"] = return_msg
    data["DATA"] = {}
    data = remoteAPI_end(data, ["no-config", "no-data"])
    return data


def RemoteMacroChange(macros):
    """
    Change Macros and save to _ACTIVE-MACROS.json
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = editMacros(macros)
    data["REQUEST"]["Command"] = "ChangeMacros"
    data = remoteAPI_end(data, ["no-config", "no-data"])

    return data


def RemoteSendApiCmd(device, api_command):
    """
    Execute API command given as parameter and return value
    """
    data = remoteAPI_start(["request-only"])

    status = deviceAPIs.device_status(device)["status"]
    if "power" in status:
        pwr_status = status["power"]
    else:
        pwr_status = "N/A"

    data["REQUEST"]["Return"] = {
        "answer": deviceAPIs.api_send_directly(device, api_command),
        "device": device,
        "command": api_command,
        "interface": deviceAPIs.device_api_string(device),
        "status": pwr_status
    }
    data["REQUEST"]["Command"] = "RemoteSendApiCmd"

    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteOnOff(device, button):
    """
    check old status and document new status
    """
    status = ""
    types = {}
    presets = {}
    dont_send = False

    data = remoteAPI_start()

    method = deviceAPIs.api_method(device)
    interface = data["CONFIG"]["devices"][device]["interface"]["interface_api"]
    api_dev = data["CONFIG"]["devices"][device]["interface"]["api"]

    logging.info("__BUTTON: " + device + "/" + button + " (" + interface + "/" + method + ")")

    # if recorded values, check against status quo
    if method == "record":

        # Get method and presets
        definition = data["CONFIG"]["devices"][device]["commands"]["definition"]

        # special with power buttons
        if button == "on-off" or button == "on" or button == "off":
            value = "power"
        elif button[-1:] == "-" or button[-1:] == "+":
            value = button[:-1]
        else:
            value = button

        # get status
        current_status = getStatus(device, value)
        device_status = getStatus(device, "power")

        # buttons power / ON / OFF
        if value == "power":
            if button == "on":            status = "ON"
            if button == "off":           status = "OFF"
            if button == "on-off":        status = RemoteToggle(current_status, ["ON", "OFF"])

        elif value in definition and "type" in definition[value] \
                and ("values" in definition[value] or "param" in definition[value]):

            d_type = definition[value]["type"]
            if "param" in definition[value]:
                d_values = definition[value]["param"]
            else:
                d_values = definition[value]["values"]

            if device_status == "ON":
                if d_type == "enum":
                    status = RemoteToggle(current_status, d_values)
                elif d_type == "integer" and "min" in d_values and "max" in d_values:
                    minimum = int(d_values["min"])
                    maximum = int(d_values["max"])
                    direction = button[-1:]
                    current_status = str(current_status).strip()
                    if current_status:
                        current_status = int(current_status)
                    else:
                        current_status = 0

                    if direction == "+" and current_status < maximum:
                        status = current_status + 1
                    elif direction == "+":
                        dont_send = True
                    elif direction == "-" and current_status > minimum:
                        status = current_status - 1
                    elif direction == "-":
                        dont_send = True

                else:
                    logging.warning(
                        "RemoteOnOff - Unknown command definition: " + device + "_" + button + ":" + value + " (" + d_type + "/" + str(
                            d_values) + ")")

            else:
                logging.debug("RemoteOnOff - Device is off: " + device)
                dont_send = True

        # ----------------------------- OLD
        # other buttons with defined values
        elif value in types and value in presets:

            if device_status == "ON":

                if types[value]["type"] == "enum":    status = RemoteToggle(current_status, presets[value])
                if types[value]["type"] == "integer":
                    minimum = int(presets[value]["min"])
                    maximum = int(presets[value]["max"])
                    direction = button[-1:]
                    current_status = str(current_status).strip()
                    if current_status:
                        current_status = int(current_status)
                    else:
                        current_status = 0

                    if direction == "+" and current_status < maximum:
                        status = current_status + 1
                    elif direction == "+":
                        dont_send = True
                    elif direction == "-" and current_status > minimum:
                        status = current_status - 1
                    elif direction == "-":
                        dont_send = True

            else:
                logging.debug("RemoteOnOff - Device is off: " + device)
                dont_send = True
        # ----------------------------- OLD

        else:
            logging.warn("RemoteOnOff - Command not defined: " + device + "_" + value)
            logging.debug("types = " + str(types) + " / presets = " + str(presets))

    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = button
    data["REQUEST"]["Command"] = "OnOff"

    logging.info("... add to queue [" + str(api_dev) + "," + str(device) + "," + str(button) + "," + str(status) + "]")

    if dont_send:
        data["REQUEST"]["Return"] = "Dont send " + device + "/" + button + " as values not valid (" + str(
            current_status) + ")."
    else:
        data["REQUEST"]["Return"] = queueSend.add2queue([[api_dev, device, button, status]])

    refreshCache()
    data["DATA"] = {}
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteReset():
    """
    set status of all devices to OFF and return JSON msg
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = resetStatus()
    data["REQUEST"]["Command"] = "Reset"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteResetAudio():
    """
    set status of all devices to OFF and return JSON msg
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = resetAudio()
    data["REQUEST"]["Command"] = "ResetAudio"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteChangeMainAudio(device):
    """
    set device as main audio device (and reset other)
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = setMainAudioDevice(device)
    data["REQUEST"]["Command"] = "ChangeMainAudio"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteMove(type, device, direction):
    """
    Move position of device in start menu and drop down menu
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = moveDeviceScene(type, device, direction)
    data["REQUEST"]["Command"] = "RemoteMove"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteAddButton(device, button):
    """
    Learn Button and safe to init-file
    """
    data = remoteAPI_start(["request-only"])

    data["REQUEST"]["Return"] = addButton(device, button)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = button
    data["REQUEST"]["Command"] = "AddButton"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteRecordCommand(device, button):
    """
    Learn Button and safe to init-file
    """
    data = remoteAPI_start()
    interface = data["DATA"]["devices"][device]["config"]["interface_api"]
    data["DATA"] = {}

    EncodedCommand = deviceAPIs.api_record(interface, device, button)

    if "ERROR" not in str(EncodedCommand):
        data["REQUEST"]["Return"] = addCommand2Button(device, button, EncodedCommand)
    else:
        data["REQUEST"]["Return"] = str(EncodedCommand)

    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Button"] = button
    data["REQUEST"]["Command"] = "RecordCommand"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteDeleteCommand(device, button):
    """
    Delete button from layout file
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = deleteCmd(device, button)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Parameter"] = button
    data["REQUEST"]["Command"] = "DeleteCommand"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteDeleteButton(device, button_number):
    """
    Delete button from layout file
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = deleteButton(device, button_number)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Parameter"] = button_number
    data["REQUEST"]["Command"] = "DeleteButton"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteChangeVisibility(type, device, value):
    """
    change visibility of device in config file
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = changeVisibility(type, device, value)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Parameter"] = value
    data["REQUEST"]["Command"] = "ChangeVisibility"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteAddDevice(device, device_data):
    """
    add device in config file and create config files for remote and command
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = addDevice(device, device_data)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Parameter"] = device_data
    data["REQUEST"]["Command"] = "AddDevice"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteEditDevice(device, info):
    """
    Edit data of device
    """
    logging.info(str(info))

    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = editDevice(device, info)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Command"] = "EditDevice"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteDeleteDevice(device):
    """
    delete device from config file and delete device related files
    """

    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = deleteDevice(device)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Command"] = "DeleteDevice"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteAddScene(scene, info):
    """
    add device in config file and create config files for remote and command
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = addScene(scene, info)
    data["REQUEST"]["Scene"] = scene
    data["REQUEST"]["Parameter"] = info
    data["REQUEST"]["Command"] = "AddScene"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteEditScene(scene, info):
    """
    Edit data of device
    """
    logging.info(str(info))

    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = editScene(scene, info)
    data["REQUEST"]["Scene"] = scene
    data["REQUEST"]["Command"] = "EditScene"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteDeleteScene(scene):
    """
    delete device from config file and delete device related files
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = deleteScene(scene)
    data["REQUEST"]["Scene"] = scene
    data["REQUEST"]["Command"] = "DeleteScene"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteAddTemplate(device, template):
    """
    add / overwrite remote template
    """
    data = remoteAPI_start(["request-only"])
    data["REQUEST"]["Return"] = addTemplate(device, template)
    data["REQUEST"]["Device"] = device
    data["REQUEST"]["Parameter"] = template
    data["REQUEST"]["Command"] = "AddTemplate"

    refreshCache()
    data = remoteAPI_end(data, ["no-data", "no-config"])
    return data


def RemoteConfigDevice(device):
    """
    get configuration data for device
    """
    data = remoteAPI_start(["request-only"])

    data["DATA"] = {}
    device_config = RmReadData_devicesConfig(more_details=True)

    if device in device_config:
        api = device_config[device]["interface"]["interface_api"]
        api_config = configFiles.read(modules.rm3config.commands + api + "/00_interface")

        data["REQUEST"]["Return"] = "OK"
        data["DATA"]["device"] = device
        data["DATA"][device] = device_config[device]
        data["DATA"][device]["interface_details"] = api_config
    else:
        data["REQUEST"]["Return"] = "ERROR"
        data["DATA"]["device"] = device
        data["DATA"][device] = {"error": "Device '"+device+"' not found!"}

    data = remoteAPI_end(data, ["no-config", "no-status"])
    return data

def RemoteTest():
    """
    Test new functions
    """

    data = remoteAPI_start()
    data["TEST"] = RmReadData("")
    data["REQUEST"]["Return"] = "OK: Test - show complete data structure"
    data["REQUEST"]["Command"] = "Test"
    data = remoteAPI_end(data, ["no-data"])
    deviceAPIs.api_test()

    return data
