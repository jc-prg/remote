import logging
import modules.rm3config as rm3config
import modules.rm3json as rm3json


class RemotesData:
    """
    class to read and write configuration and status data for devices, scenes, remotes
    """

    def __init__(self, config, interfaces, apis, queue):
        """
        Constructor of this class

        Args:
            config (modules.ConfigCache): config file handler
        """
        self.config = config
        self.interfaces = interfaces
        self.queue = queue
        self.apis = apis
        self.errors = {}

        self.logging = logging.getLogger("rm-data")
        self.logging.setLevel = rm3config.log_set2level
        self.logging.info("Loading RemotesData")

    def complete_read(self, selected=None):
        """
        Read all relevant data and create data structure
        """
        if selected is None:
            selected = []
        data = {}

        # workaround, as "remote" section is removed somehow after some JSON edits
        if "_api" in self.config.cache and "scenes" in self.config.cache["_api"]:
            for key in self.config.cache["_api"]["scenes"]:
                if "remote" not in self.config.cache["_api"]["scenes"][key]:
                    self.config.cache_update = True

        # if update required
        if self.config.cache_update_cmd or "_api" not in self.config.cache:

            data["devices"] = self.devices_read(selected, True)
            data["macros"] = self.macros_read()
            data["scenes"] = self.scenes_read(selected, True)
            data["templates"] = self.templates_read(selected)["templates"]
            data["template_list"] = self.templates_read(selected)["template_list"]

            self.logging.debug("++++++++> " + str(data["scenes"]["music"].keys()))

            # save data in cache
            self.config.cache["_api"] = data

            # mark update as done
            self.logging.info("Update config data in cache (" + str(self.config.cache_update) + ")")
            self.config.cache_update_cmd = False

        # if no update required read from cache
        else:
            data = self.config.cache["_api"]

        # Update API data based on cache value
        if self.interfaces.cache_update_api:
            self.logging.info("Update config data from api.")
            data["devices"] = self.get_device_status(data["devices"], read_api=True)

        else:
            data["devices"] = self.get_device_status(data["devices"], read_api=False)

        # Update status data
        self.config.cache["_api"] = data

        return data.copy()

    def devices_read_config(self, more_details=False):
        """
        read configuration of all devices

        Args:
            more_details (bool): read and return more details
        Return:
            dict: device configuration
        """
        config_keys = ["buttons", "commands", "url", "method"]
        data = self.config.read_status()
        data_config = {}

        # read data for active devices
        for device in data:

            interface = data[device]["config"]["interface_api"]
            device_key = data[device]["config"]["device"]

            if interface == "":
                if device != "default":
                    self.logging.warning("No interface defined (" + device + "/" + device_key + ")")
                    self.logging.warning(device + ": " + str(data[device]))
                continue

            interface_def_device = self.config.read(
                rm3config.commands + interface + "/" + device_key)  # button definitions, presets, queries ...
            interface_def_default = self.config.read(
                rm3config.commands + interface + "/00_default")  # button definitions, presets, queries ...

            if "ERROR" in interface_def_device or "ERROR" in interface_def_default:
                self.logging.error("Error while reading configuration for device (" + device_key + ")")

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

                    if more_details:
                        data_config[device]["api_commands"] = {}
                        for key in interface_def_combined["buttons"]:
                            data_config[device]["api_commands"]["btn: " + key] = interface_def_combined["buttons"][key]

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
                    data_config[device]["commands"]["definition"] = interface_def_combined["commands"].copy()

                    if more_details:
                        for key in interface_def_combined["commands"]:
                            if "get" in interface_def_combined["commands"][key]:
                                data_config[device]["api_commands"]["get: " + key] = \
                                    interface_def_combined["commands"][key]["get"]
                            if "set" in interface_def_combined["commands"][key]:
                                data_config[device]["api_commands"]["set: " + key] = \
                                    interface_def_combined["commands"][key]["set"]

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
                        #    del data_config[device]["commands"]["definition"][key]["get"]
                        if "set" in data_config[device]["commands"]["definition"][key]:
                            data_config[device]["commands"]["definition"][key]["cmd"].append("set")
                        #    del data_config[device]["commands"]["definition"][key]["set"]

                data_config[device]["url"] = interface_def_combined["url"]

        return data_config.copy()

    def devices_read(self, selected=None, remotes=True):
        """
        read data for devices and combine with remote definition -> base for CONFIG and STATUS also

        Args:
            selected (list|None): selected device
            remotes (bool): tbc.
        Return:
            dict: device data
        """
        if selected is None:
            selected = []
        config_keys = ["buttons", "commands", "url", "method"]
        data = self.config.read_status()

        if "ERROR" in data:
            self.logging.error("ERROR while requesting devices status, main config file seems to be defect!")
            return data

        # read data for active devices
        for device in data:

            if data[device]["config"]["interface_api"] != "":
                if selected == [] or device in selected:

                    device_key = data[device]["config"]["device"]
                    key_remote = data[device]["config"]["remote"]
                    interface = data[device]["config"]["interface_api"]
                    remote = self.config.read(rm3config.remotes + key_remote)  # remote layout & display

                    if "devices" not in self.errors:
                        self.errors["devices"] = {}
                    if "ERROR" in remote:
                        self.logging.error("Error reading config file '" + key_remote + "': " + remote["ERROR_MSG"])
                        if device not in self.errors["devices"]:
                            self.errors["devices"][device] = {}
                        self.errors["devices"][device][rm3config.remotes + key_remote + ".json"] = \
                            remote["ERROR_MSG"]
                        continue
                    elif device in self.errors["devices"]:
                        if device not in self.errors["devices"]:
                            self.errors["devices"] = {}
                        del self.errors["devices"][device]

                    data_temp = data[device]
                    data_temp["remote"] = remote["data"]

                    # should not be necessary any more ... but how ever, if removed RmReadConfig_devices doesn't work
                    if remotes:
                        # button definitions, presets, queries ...
                        interface_def_device = self.config.read(rm3config.commands + interface + "/" + device_key)
                        interface_def_default = self.config.read(rm3config.commands + interface + "/00_default")

                        if "ERROR" in interface_def_device:
                            logging.error(
                                "Error reading config file '" + device_key + "': " + interface_def_device["ERROR_MSG"])
                            if device not in self.errors["devices"]:
                                self.errors["devices"][device] = {}
                            error_key = rm3config.commands + interface + "/" + device_key + ".json"
                            self.errors["devices"][device][error_key] = interface_def_device["ERROR_MSG"]
                            continue

                        if "ERROR" in interface_def_default:
                            logging.error(
                                "Error reading config file '" + device_key + "': " + interface_def_default["ERROR_MSG"])
                            if device not in self.errors["devices"]:
                                self.errors["devices"][device] = {}
                            error_key = rm3config.commands + interface + "/00_default.json"
                            self.errors["devices"][device][error_key] = interface_def_default["ERROR_MSG"]
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

    def devices_status(self):
        """
        read status data for devices

        Return:
            dict: devices status
        """
        status = {}
        data = self.config.read_status()

        # read data for active devices
        for device in data:
            status[device] = data[device]["status"]
            status[device]["api"] = data[device]["config"]["interface_api"] + "_" + data[device]["config"][
                "interface_dev"]

            if data[device]["settings"]["main-audio"]:
                status[device]["main-audio"] = data[device]["settings"]["main-audio"]
            else:
                status[device]["main-audio"] = "no"

        return status

    def devices_write(self, data):
        """
        write config data for devices and remove data not required in the file
        """
        var_relevant = ["config", "settings", "status"]

        self.logging.info(str(data))

        for device in data:
            var_delete = []
            for key in data[device]:
                if key not in var_relevant:
                    var_delete.append(key)

            for key in var_delete:
                del data[device][key]

        if data == {}:
            self.logging.error("ERROR: ...!")
        else:
            self.config.write_status(data, "remoteData.devices_write()")

    def scenes_read(self, selected=None, remotes=True):
        """
        read config data for scenes and combine with remote definition
        """
        if selected is None:
            selected = []
        data = self.config.read(rm3config.active_scenes)

        if "scenes" not in self.errors:
            self.errors["scenes"] = {}

        if remotes:
            for scene in data:
                if selected == [] or scene in selected:
                    remote_file = data[scene]["config"]["remote"]
                    try:
                        remote_config = self.config.read(rm3config.scenes + remote_file)
                        if "data" in remote_config:
                            data[scene]["remote"] = remote_config["data"]
                        else:
                            logging.error("Could not read remote data: " + rm3config.scenes + remote_file)
                            data[scene]["remote_error"] = {
                                "file": rm3config.scenes + remote_file,
                                "file_data": remote_config
                            }

                        if "ERROR" in remote_config:
                            logging.error("Error reading config file '" + remote_file + "': " + remote_config["ERROR_MSG"])
                            if scene not in self.errors["scenes"]:
                                self.errors["scenes"][scene] = {}
                            error_key = rm3config.scenes + remote_file + ".json"
                            self.errors["scenes"][scene][error_key] = remote_config["ERROR_MSG"]
                            data[scene]["remote"] = "error"

                    except Exception as e:
                        error_msg = "Reading scene failed: " + str(scene) + " / " + str(selected) + " (" + str(e) + ")"
                        logging.error(error_msg)
                        if scene not in self.errors["scenes"]:
                            self.errors["scenes"][scene] = {}
                        self.errors["scenes"][scene][rm3config.scenes + remote_file + ".json"] = error_msg
                        data[scene]["remote"] = "error"

                else:
                    logging.error("Scene not found: " + str(scene) + " / " + str(selected))
                    return {}

        return data

    def scenes_status(self):
        """
        read status data for devices of a scene
        """
        status = {}
        data = self.scenes_read()  # self.config.read(modules.active_scenes)

        # read data for active devices
        for scene in data:
            if data[scene]["remote"] != "error":
                status[scene] = data[scene]["remote"]["devices"]

        return status

    def scenes_write(self, data):
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

        self.config.write(rm3config.active_scenes, data, "RemoteData.scenes_write()")

    def macros_read(self):
        """
        read config data for macros
        """
        data = self.config.read(rm3config.active_macros)
        return data

    def macros_write(self, data):
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

        self.config.write(rm3config.active_macros, data, "RemoteData.macros_write()")

    def templates_read(self, selected=None):
        """
        read config data for templates
        """
        if selected is None:
            selected = []
        data = {"templates": {}, "template_list": {}}

        if not selected:
            templates = rm3json.available(rm3config.templates)

            for template in templates:
                template_keys = template.split("/")
                template_key = template_keys[len(template_keys) - 1]
                template_data = self.config.read(rm3config.templates + template)

                logging.debug(rm3config.templates + template)

                if "ERROR" in template_data:
                    data["templates"][template] = template_data
                else:
                    if template_key in template_data:
                        data["templates"][template] = template_data[template_key]
                    elif "data" in template_data:
                        data["templates"][template] = template_data["data"]
                    else:
                        data["templates"][template] = {"ERROR": "JSON file not correct, key missing: " + template_key}

                    if "ERROR" not in data["templates"][template]:
                        if "description" in data["templates"][template]:
                            data["template_list"][template] = data["templates"][template]["description"]
                        else:
                            data["template_list"][template] = template_key

        return data

    def get_device_status(self, data, read_api):
        """
        read status data from config file (method=record) and/or device APIs (method=query)
        data -> data["DATA"]["devices"]

        Args:
            data (dict): config data
            read_api (bool): read from api (or get from config data)
        Return:
            dict: device status data
        """
        devices = self.devices_read(None, True)
        config = self.devices_read_config()

        # set reload status
        if read_api:
            self.queue.add2queue(["START_OF_RELOAD"])
            self.queue.add2queue([0.5])
            self.logging.info("RELOAD data from devices")

        # read status of all devices
        for device in devices:

            if device == "default":
                continue

            if "status" not in devices[device]:
                devices[device]["status"] = {}

            if (device in data and device in config and "interface" in config[device]
                    and "method" in config[device]["interface"]):

                interface = config[device]["interface"]["interface_api"]
                api_dev = (config[device]["interface"]["interface_api"] + "_" +
                           config[device]["interface"]["interface_dev"])
                method = config[device]["interface"]["method"]

                # get status values from config files, if connected
                if api_dev in self.apis.api and self.apis.api[api_dev].status == "Connected":

                    # preset values
                    if method != "query":
                        for value in config[device]["commands"]["definition"]:
                            if value not in devices[device]["status"]:
                                devices[device]["status"][value] = ""

                    # get values from config file
                    for value in devices[device]["status"]:
                        data[device]["status"][value] = devices[device]["status"][value]

                    # request update for devices with API query
                    if method == "query" and read_api:
                        self.queue.add2queue([0.1])
                        self.queue.add2queue([[interface, device, config[device]["commands"]["get"], ""]])

        # set reload status
        if read_api:
            self.queue.add2queue(["END_OF_RELOAD"])

        # mark API update as done
        self.interfaces.cache_update_api = False

        return data


class RemotesEdit:
    """
    Class to edit remote configuration for scenes and devices
    """

    def __init__(self, data, config, interfaces, apis, queue):
        """
        Constructor of this class

        Args:
            config (modules.ConfigCache): config file handler
        """
        self.config = config
        self.interfaces = interfaces
        self.queue = queue
        self.apis = apis
        self.data = data
        self.errors = {}

        self.logging = logging.getLogger("rm-edit")
        self.logging.setLevel = rm3config.log_set2level
        self.logging.info("Loading RemotesEdit")

    def scene_add(self, scene, info):
        """
        add new scene in active_jsons and create scene remote layout

        Args:
            scene (str): scene id
            info (dict): further information
        Return:
            str: success or error message
        """
        active_json = self.data.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)

        if scene in active_json:
            return "WARNING: Scene " + scene + " already exists (active)."
        if rm3json.if_exist(rm3config.remotes + "scene_" + scene):
            return "WARNING: Scene " + scene + " already exists (remotes)."

        self.logging.info("remotesEdit.scene_add(): add " + scene)

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
            self.data.scenes_write(active_json)

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
            self.config.write(rm3config.remotes + "scene_" + scene, remote)
        except Exception as e:
            return "ERROR: " + str(e)

        self.config.cache_update = True
        return "OK: Scene " + scene + " added."

    def scene_edit(self, scene, info):
        """
        edit scene data in json file

        Args:
            scene (str): scene id
            info (dict): further information
        Return:
            str: success or error message
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
                        return "ERROR: wrong data format - 'macro-channel' list contains other than strings (" + str(
                            entry) + ")."

        # read central config file
        active_json = self.data.scenes_read(selected=[], remotes=False)

        # read remote layout definitions
        remotes = self.config.read(rm3config.remotes + "scene_" + scene)
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
        self.data.scenes_write(active_json)

        # write remote layout definition
        try:
            self.config.write(rm3config.remotes + "scene_" + scene, remotes)
        except Exception as e:
            return "ERROR: could not write changes (remotes) - " + str(e)

        self.config.cache_update = True

        if i > 0:
            return "OK: Edited device parameters of " + scene + " <br/>(" + str(i) + " changes: " + i_list + ")"
        else:
            return "ERROR: no data key matched with keys from config-files (" + str(info.keys) + ")"

    def scene_delete(self, scene):
        """
        delete scene from json config file and scene device related files

        Args:
            scene (str): scene id
        Return:
            str: success or error message
        """
        active_json = self.data.scenes_read(selected=[], remotes=False)

        if "ERROR" in active_json:
            return "ERROR: Could not read ACTIVE_JSON (active)."
        if scene not in active_json:
            return "ERROR: Scene " + scene + " doesn't exists (active)."
        if not rm3json.if_exist(rm3config.remotes + "scene_" + scene):
            return "ERROR: Scene " + scene + " doesn't exists (remotes)."

        del active_json[scene]
        self.data.scenes_write(active_json)

        try:
            rm3json.delete(rm3config.remotes + "scene_" + scene)
            self.config.cache_update = True
            if not rm3json.if_exist(rm3config.remotes + "scene_" + scene):
                return "OK: Scene '" + scene + "' deleted."
            else:
                return "ERROR: Could not delete scene '" + scene + "'"
        except Exception as e:
            return "ERROR: Could not delete scene '" + scene + "': " + str(e)

    def device_add(self, device, info):
        """
        add new device to config file and create command/remote files

        Args:
            device (str): device id
            info (dict): further device information
        Returns:
            str: success or error information
        """
        self.logging.debug(str(info))
        interface, interface_dev = info["api"].split("_")

        # Check if exists
        active_json = self.config.read_status()

        if device in active_json:
            return "WARNING: Device " + device + " already exists (active)."
        if rm3json.if_exist(rm3config.commands + interface + "/" + info["config_device"]):
            return "WARNING: Device " + device + " already exists (devices)."
        if rm3json.if_exist(rm3config.remotes + info["config_remote"]):
            return "WARNING: Device " + device + " already exists (remotes)."

        self.logging.info("remotesEdit.device_add(): add " + device)

        # set position
        active_json_position = 0
        for key in active_json:
            if active_json[key]["settings"]["position"] > active_json_position:
                active_json_position = active_json[key]["settings"]["position"]
        active_json_position += 1

        # add to _active.json
        active_json[device] = {
            "config": {
                "device": info["config_device"],
                "remote": info["config_remote"],
                "interface_api": interface,
                "interface_dev": "default"
            },
            "settings": {
                "description": info["label"] + ": " + info["device"],
                "label": info["label"],
                "image": device,
                "main-audio": "no",
                "position": active_json_position,
                "visible": "yes"
            },
            "status": {"power": "OFF"},
            "type": "device"
        }

        try:
            self.config.write_status(active_json, "addDevice")
        except Exception as e:
            return "ERROR: " + str(e)

        # add to devices = button definitions
        buttons = {
            "info": "jc://remote/ - In this file the commands and buttons are defined.",
            "data": {
                "description": info["label"] + ": " + info["device"],
                "buttons": {},
                "commands": {}
            }
        }
        try:
            self.config.write(rm3config.commands + interface + "/" + info["config_device"], buttons)
        except Exception as e:
            return "ERROR: " + str(e)

        # add to remotes = button layout
        remote = {
            "info": "jc://remote/ - In this file the remote layout and a display layout is defined.",
            "data": {
                "description": info["label"] + ": " + info["device"],
                "remote": [],
                "display": {}
            }
        }
        try:
            self.config.write(rm3config.remotes + info["config_remote"], remote)
        except Exception as e:
            return "ERROR: " + str(e)

        return "OK: Device " + device + " added."

    def device_edit(self, device, info):
        """
        edit device data in json file

        Args:
            device (str): device id
            info (dict): further device information
        Returns:
            str: success or error information
        """

        keys_active = ["label", "image", "description", "main-audio", "interface"]
        keys_commands = ["description", "method"]
        keys_remotes = ["description", "remote", "display", "display-size", "type"]

        #    keys_remotes  = ["label","remote","macro-channel","devices","display","display-size"]

        # read central config file
        active_json = self.data.devices_read(selected=[], remotes=False)
        self.logging.debug(active_json)

        interface = active_json[device]["config"]["interface_api"]
        device_code = active_json[device]["config"]["device"]
        device_remote = active_json[device]["config"]["remote"]

        # read command definition
        commands = self.config.read(rm3config.commands + interface + "/" + device_code)
        if "ERROR" in commands:
            return "ERROR: Device " + device + " doesn't exists (commands)."

        # read remote layout definitions
        remotes = self.config.read(rm3config.remotes + device_remote)
        if "ERROR" in remotes:
            return "ERROR: Device " + device + " doesn't exists (remotes)."

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
            self.data.devices_write(active_json)
        except Exception as e:
            return "ERROR: could not write changes (active) - " + str(e)

        # write command definition
        try:
            self.config.write(rm3config.commands + interface + "/" + device_code, commands)
        except Exception as e:
            return "ERROR: could not write changes (commands) - " + str(e)

        # write remote layout definition
        try:
            self.config.write(rm3config.remotes + device_remote, remotes)
        except Exception as e:
            return "ERROR: could not write changes (remotes) - " + str(e)

        if i > 0:
            return "OK: Edited device parameters of " + device + " (" + str(i) + " changes)"
        else:
            return "ERROR: no data key matched with keys from config-files (" + str(info.keys) + ")"

    def device_delete(self, device):
        """
        delete device from json config file and delete device related files

        Args:
            device (str): device id
        Returns:
            str: success or error information
        """
        devices = {}
        active_json = self.config.read_status()
        interface = active_json[device]["config"]["interface_api"]
        device_code = active_json[device]["config"]["device"]
        device_remote = active_json[device]["config"]["remote"]
        file_device_remote = rm3config.remotes + device_remote
        file_interface_remote = rm3config.commands + interface + "/" + device_code

        if "ERROR" in active_json:
            return "ERROR: Could not read ACTIVE_JSON (active)."
        if device not in active_json:
            return "ERROR: Device " + device + " doesn't exists (active)."
        if not rm3json.if_exist(rm3config.commands + interface + "/" + device_code):
            return "ERROR: Device " + device + " doesn't exists (commands)."
        if not rm3json.if_exist(rm3config.remotes + device_remote):
            return "ERROR: Device " + device + " doesn't exists (remotes)."

        interface = active_json[device]["config"]["interface_api"]  # funtioniert nicht so richtig ...

        for entry in active_json:
            if entry != device:
                devices[entry] = active_json[entry]

        active_json = devices
        self.config.write_status(active_json, "deleteDevice")

        try:
            rm3json.delete(file_device_remote)
            rm3json.delete(file_interface_remote)

            if not rm3json.if_exist(file_device_remote) and not rm3json.if_exist(file_interface_remote):
                message = "OK: Device '" + device + "' deleted."
            else:
                message = "ERROR: Could not delete device '" + device + "'"

        except Exception as e:
            message = "ERROR: Could not delete device '" + device + "': " + str(e)

        if "OK" in message:
            try:
                file_interface_remote = file_interface_remote.replace("/", "**")
                file_device_remote = file_device_remote.replace("/", "**")
                del self.config.cache[file_interface_remote]
                del self.config.cache[file_device_remote]

            except Exception as e:
                message += "; ERROR: " + str(e)

        return message


