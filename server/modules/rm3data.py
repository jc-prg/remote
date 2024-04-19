import logging
import modules.rm3config as rm3config
import modules.rm3json as rm3json


class RemoteData:
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
        self.logging.info("Loading RemoteData")

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
