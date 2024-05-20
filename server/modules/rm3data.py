import time
import logging
import modules.rm3presets as rm3presets
import modules.rm3json as rm3json
from modules.rm3classes import RemoteDefaultClass, RemoteThreadingClass


class RemotesData(RemoteThreadingClass):
    """
    class to read and write configuration and status data for devices, scenes, remotes
    """

    def __init__(self, config, interfaces, apis, queue):
        """
        Constructor of this class

        Args:
            config (server.modules.rm3cache.ConfigCache): config file handler
            interfaces (server.modules.rm3cache.ConfigInterfaces): handler for config interfaces
            apis (server.interfaces.Connect): handler for device APIS
            queue (server.modules.rm3queue.QueueApiCalls): handler for query queue
        """
        RemoteThreadingClass.__init__(self, "rm-data", "RemoteData")

        self.logging.info("Loading " + self.name)

        self.config = config
        self.interfaces = interfaces
        self.queue = queue
        self.apis = apis
        self.errors = {}
        self.thread_priority(6)

    def run(self):
        """
        thread
        """
        self.logging.info("Starting RemoteData Thread ...")

        while self._running:

            self.thread_wait()
            self.logging.debug("Waiting time = " + str(self.thread_waiting_time()) + "s")

            if not self.config.user_inactive() and not self.queue.reload:
                self.devices_get_status({}, True)

            elif self.config.user_inactive():
                self.logging.debug("Skipping status request as last reload still running")

            else:
                self.logging.debug("Skipping status requests due to missing user activity.")

        self.logging.info("Exiting " + self.name)

    def api_devices_connections(self):
        """
        read all status information

        Returns:
            dict: collection of all status information
        """
        status_devices = self.config.read(rm3presets.active_devices)
        status_apis = self.config.read(rm3presets.active_apis)
        status_apis_connect = {}
        status_devices_power = {}
        for key in self.apis.api:
            status_apis_connect[key] = self.apis.api[key].status

        connection = {}
        for api in status_apis:
            connection[api] = {"active": status_apis[api]["active"], "api_devices": {}}
            for api_device in status_apis[api]["devices"]:
                api_device_infos = {"devices": {}, "power": "", "connect": ""}
                if api+"_"+api_device in status_apis_connect:
                    api_device_infos["connect"] = status_apis_connect[api+"_"+api_device]
                if api_device in status_apis[api]["devices_active"]:
                    api_device_infos["active"] = status_apis[api]["devices_active"][api_device]
                else:
                    api_device_infos["active"] = True
                if "PowerDevice" in status_apis[api]["devices"][api_device]:
                    api_device_infos["power_device"] = status_apis[api]["devices"][api_device]["PowerDevice"]
                else:
                    api_device_infos["power_device"] = ""
                if "MultiDevice" in status_apis[api]["devices"][api_device]:
                    api_device_infos["multi_device"] = status_apis[api]["devices"][api_device]["MultiDevice"]
                else:
                    api_device_infos["multi_device"] = ""
                connection[api]["api_devices"][api_device] = api_device_infos

        for device in status_devices:
            dev_api = status_devices[device]["config"]["api_key"]
            dev_api_device = status_devices[device]["config"]["api_device"]
            if dev_api in connection and dev_api_device in connection[dev_api]["api_devices"]:
                connection[dev_api]["api_devices"][dev_api_device]["devices"][device] = status_devices[device]["status"]
                key_device = dev_api + "_" + dev_api_device + "_" + device
                key_api_device = dev_api + "_" + dev_api_device
                if "power" in status_devices[device]["status"]:
                    status_devices_power[key_device] = status_devices[device]["status"]["power"]
                    if "multi_device" in connection[dev_api]["api_devices"][dev_api_device] \
                            and connection[dev_api]["api_devices"][dev_api_device]["multi_device"] is False:
                        status_devices_power[key_api_device] = status_devices[device]["status"]["power"]

        for api in connection:
            for api_device in connection[api]["api_devices"]:
                power_device = connection[api]["api_devices"][api_device]["power_device"]
                if power_device != "" and power_device in status_devices_power:
                    connection[api]["api_devices"][api_device]["power"] = status_devices_power[power_device]

        connection["_all"] = status_devices_power
        return connection.copy()

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
        devices = self.devices_read()
        data_config = {}

        # read data for active devices
        for device in data:

            interface = data[device]["config"]["api_key"]
            device_key = data[device]["config"]["device"]

            if interface == "":
                if device != "default":
                    self.logging.warning("No interface defined (" + device + "/" + device_key + ")")
                    self.logging.warning(device + ": " + str(data[device]))
                continue

            # button definitions, presets, queries ...
            interface_def_combined = {}
            interface_def_device = self.config.read(rm3presets.commands + interface + "/" + device_key)
            interface_def_default = self.config.read(rm3presets.commands + interface + "/00_default", True)

            if "ERROR" in interface_def_device or "ERROR" in interface_def_default:
                self.logging.error("Error while reading configuration for device (" + device_key + ")")
                if "ERROR" in interface_def_device:
                    self.logging.error("... " + str(interface_def_device["ERROR"]))
                if "ERROR" in interface_def_default:
                    self.logging.error("... " + str(interface_def_default["ERROR"]))

            else:
                data_config[device] = {}
                interface_def_device = interface_def_device["data"].copy()
                interface_def_default = interface_def_default["data"].copy()

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

                if interface_def_combined["buttons"] != "":
                    data_config[device]["buttons"] = list(interface_def_combined["buttons"].keys())
                else:
                    data_config[device]["buttons"] = []

                if more_details:
                    data_config[device]["api_commands"] = {}
                    for key in interface_def_combined["buttons"]:
                        data_config[device]["api_commands"]["btn: " + key] = interface_def_combined["buttons"][key]

                data_config[device]["settings"] = devices[device]["settings"]
                if "device_id" in data[device]["config"]:
                    data_config[device]["settings"]["device_id"] = data[device]["config"]["device_id"]
                else:
                    data_config[device]["settings"]["device_id"] = ""

                if "remote" in devices[device]:
                    data_config[device]["remote"] = devices[device]["remote"]
                else:
                    data_config[device]["remote"] = {}

                data_config[device]["interface"] = {}
                data_config[device]["interface"]["method"] = interface_def_combined["method"]
                data_config[device]["interface"]["files"] = [interface + "/00_interface.json",
                                                             interface + "/00_default.json",
                                                             interface + "/" + device_key + ".json"]
                data_config[device]["interface"]["api"] = (data[device]["config"]["api_key"] + "_" +
                                                           data[device]["config"]["api_device"])
                data_config[device]["interface"]["api_key"] = data[device]["config"]["api_key"]
                data_config[device]["interface"]["api_device"] = data[device]["config"]["api_device"]
                data_config[device]["interface"]["device"] = device_key
                data_config[device]["interface"]["remote"] = data[device]["config"]["remote"]

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

    def devices_read_api_structure(self):
        """
        create a list with interfaces and connected devices

        Returns:
            dict: devices per interfaces (<interface>:<api-device> = [list, of, device-ids])
        """
        status_devices = self.config.read(rm3presets.active_apis)
        devices = self.devices_read_config()
        devices_per_interface = {}

        for api in status_devices:
            devices_per_interface[api] = {}
            for api_device in status_devices[api]["devices"]:
                devices_per_interface[api][api_device] = []

        for key in devices:
            if "interface" in devices[key] and "api" in devices[key]["interface"]:
                api_dev = devices[key]["interface"]["api"]
                if "_" in api_dev:
                    [api, dev] = api_dev.split("_")
                    if api not in devices_per_interface:
                        devices_per_interface[api] = {}
                    if dev not in devices_per_interface[api]:
                        devices_per_interface[api][dev] = []
                    devices_per_interface[api][dev].append(key)

        return devices_per_interface.copy()

    def devices_read_api_commands(self, api_structure):
        """
        read api overarching commands using the API structure

        Args:
            api_structure (dict): API structure created by "devices_read_api_structure()"
        Returns:
            dict: API commands
        """
        api_info = {}
        for api in api_structure:
            interface_info = self.config.read(rm3presets.commands + api + "/00_default")
            for api_device in api_structure[api]:
                api_info[api + "_" + api_device] = []
                if "data" in interface_info and "api_commands" in interface_info["data"]:
                    for key in interface_info["data"]["api_commands"]:
                        api_info[api + "_" + api_device].append(key)

        return api_info

    def devices_read_api_new_devices(self):
        """
        create a list of devices detected by API Devices

        Returns:
            dict: devices detected by API Devices
        """
        devices_per_interface = {}
        apis = self.config.interface_configuration
        for api in apis:
            for api_device in apis[api]["devices"]:
                api_dev = api + "_" + api_device
                detect = self.apis.devices_available(api_dev)
                self.logging.debug("Check for new devices: " + str(api_dev) + " ... " + str(detect))
                if detect != {}:
                    devices_per_interface[api_dev] = detect

        return devices_per_interface

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

            if data[device]["config"]["api_key"] != "":
                if selected == [] or device in selected:

                    device_key = data[device]["config"]["device"]
                    key_remote = data[device]["config"]["remote"]
                    interface = data[device]["config"]["api_key"]
                    remote = self.config.read(rm3presets.remotes + key_remote)  # remote layout & display

                    if "devices" not in self.errors:
                        self.errors["devices"] = {}
                    if "ERROR" in remote:
                        self.logging.error("Error reading config file '" + key_remote + "': " + remote["ERROR_MSG"])
                        if device not in self.errors["devices"]:
                            self.errors["devices"][device] = {}
                        self.errors["devices"][device][rm3presets.remotes + key_remote + ".json"] = \
                            remote["ERROR_MSG"]
                        continue
                    elif device in self.errors["devices"]:
                        if device not in self.errors["devices"]:
                            self.errors["devices"] = {}
                        del self.errors["devices"][device]

                    data_temp = data[device]
                    data_temp["remote"] = remote["data"]

                    # should not be necessary anymore ... but however, if removed RmReadConfig_devices doesn't work
                    if remotes:
                        # button definitions, presets, queries ...
                        interface_def_device = self.config.read(rm3presets.commands + interface + "/" + device_key)
                        interface_def_default = self.config.read(rm3presets.commands + interface + "/00_default")

                        if "ERROR" in interface_def_device:
                            logging.error(
                                "Error reading config file '" + device_key + "': " + interface_def_device["ERROR_MSG"])
                            if device not in self.errors["devices"]:
                                self.errors["devices"][device] = {}
                            error_key = rm3presets.commands + interface + "/" + device_key + ".json"
                            self.errors["devices"][device][error_key] = interface_def_device["ERROR_MSG"]
                            continue

                        if "ERROR" in interface_def_default:
                            logging.error(
                                "Error reading config file '" + device_key + "': " + interface_def_default["ERROR_MSG"])
                            if device not in self.errors["devices"]:
                                self.errors["devices"][device] = {}
                            error_key = rm3presets.commands + interface + "/00_default.json"
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
            status[device]["api"] = (data[device]["config"]["api_key"] + "_" +
                                     data[device]["config"]["api_device"])

            if status[device]["api"] in self.apis.api:
                status[device]["api-status"] = self.apis.api[status[device]["api"]].status

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

    def devices_get_status(self, data, read_api):
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
            self.queue.add2queue([0.5])
            self.queue.add2queue(["START_OF_RELOAD"])
            self.logging.info("Request device status information ...")

        # read status of all devices
        for device in devices:

            if device == "default":
                continue

            if "status" not in devices[device]:
                devices[device]["status"] = {}

            if (device in config and "interface" in config[device]
                    and "method" in config[device]["interface"]):

                interface = config[device]["interface"]["api_key"]
                api_dev = (config[device]["interface"]["api_key"] + "_" +
                           config[device]["interface"]["api_device"])
                method = config[device]["interface"]["method"]

                # get status values from config files, if connected
                if api_dev in self.apis.api and self.apis.api[api_dev].status == "Connected":

                    # preset values
                    if method != "query":
                        for value in config[device]["commands"]["definition"]:
                            if value not in devices[device]["status"]:
                                devices[device]["status"][value] = ""

                    # request update for devices with API query
                    if method == "query" and read_api:

                        #self.queue.add2queue([0.1])
                        self.queue.add2queue([[interface, device, config[device]["commands"]["get"], ""]])

        # set reload status
        if read_api:
            self.queue.add2queue(["END_OF_RELOAD"])

        # mark API update as done
        self.interfaces.cache_update_api = False

    def scenes_read(self, selected=None, remotes=True):
        """
        read config data for scenes and combine with remote definition
        """
        if selected is None:
            selected = []
        data = self.config.read(rm3presets.active_scenes)

        if "scenes" not in self.errors:
            self.errors["scenes"] = {}

        if remotes:
            for scene in data:
                if selected == [] or scene in selected:
                    remote_file = data[scene]["config"]["remote"]
                    try:
                        remote_config = self.config.read(rm3presets.scenes + remote_file)
                        if "data" in remote_config:
                            data[scene]["remote"] = remote_config["data"]
                        else:
                            logging.error("Could not read remote data: " + rm3presets.scenes + remote_file)
                            data[scene]["remote_error"] = {
                                "file": rm3presets.scenes + remote_file,
                                "file_data": remote_config
                            }

                        if "ERROR" in remote_config:
                            logging.error("Error reading config file '" + remote_file + "': " +
                                          remote_config["ERROR_MSG"])
                            if scene not in self.errors["scenes"]:
                                self.errors["scenes"][scene] = {}
                            error_key = rm3presets.scenes + remote_file + ".json"
                            self.errors["scenes"][scene][error_key] = remote_config["ERROR_MSG"]
                            data[scene]["remote"] = "error"

                    except Exception as e:
                        error_msg = "Reading scene failed: " + str(scene) + " / " + str(selected) + " (" + str(e) + ")"
                        logging.error(error_msg)
                        if scene not in self.errors["scenes"]:
                            self.errors["scenes"][scene] = {}
                        self.errors["scenes"][scene][rm3presets.scenes + remote_file + ".json"] = error_msg
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

        self.config.write(rm3presets.active_scenes, data, "RemoteData.scenes_write()")

    def macros_read(self):
        """
        read config data for macros
        """
        data = self.config.read(rm3presets.active_macros)
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

        self.config.write(rm3presets.active_macros, data, "RemoteData.macros_write()")

    def templates_read(self, selected=None):
        """
        read config data for templates
        """
        if selected is None:
            selected = []
        data = {"templates": {}, "template_list": {}}

        if not selected:
            templates = rm3json.available(rm3presets.templates)

            for template in templates:
                template_keys = template.split("/")
                template_key = template_keys[len(template_keys) - 1]
                template_data = self.config.read(rm3presets.templates + template)

                logging.debug(rm3presets.templates + template)

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

    def macro_decode(self, macro):
        """
        decompose macro down to device commands

        Args:
            macro (list): list of buttons and macros
        Returns:
            list: list of device strings
        """
        decomposed_v1 = []
        decomposed_v2 = []
        decomposed_v3 = []
        act_devices = self.config.read(rm3presets.active_devices)
        act_macros = self.config.read(rm3presets.active_macros)
        act_scenes = self.config.read(rm3presets.active_scenes)

        # <device>_*
        # global_*
        # device-on_*
        # device-off_*

        for command in macro:
            if "_" not in str(command):
                decomposed_v1.append(command)
                continue
            parts = command.split("_")
            if parts[0] in act_devices:
                decomposed_v1.append(command)
            elif parts[0] == "global" or parts[0] == "macro":
                global_macro = command.replace("global_", "").replace("macro_", "")
                decomposed_v1.extend(act_macros["macro"][global_macro])
            elif parts[0] == "dev-on" or parts[0] == "dev-off":
                global_macro = command.replace(parts[0]+"_", "")
                decomposed_v1.extend(act_macros[parts[0]][global_macro])
            elif parts[0] in act_scenes and "macro-scene" in act_scenes[parts[0]]["remote"]:
                macro_key = command.replace(parts[0] + "_", "")
                decomposed_v1.extend(act_scenes[parts[0]]["remote"]["macro-scene"][macro_key])
            else:
                decomposed_v1.append(command)

        for command in decomposed_v1:
            if "_" in str(command):
                parts = command.split("_")
                if parts[0] in act_devices:
                    decomposed_v2.append(command)
                elif parts[0] == "global" or parts[0] == "macro":
                    global_macro = command.replace("global_", "").replace("macro_", "")
                    decomposed_v2.extend(act_macros["macro"][global_macro])
                elif parts[0] == "dev-on" or parts[0] == "dev-off":
                    global_macro = command.replace(parts[0]+"_", "")
                    decomposed_v2.extend(act_macros[parts[0]][global_macro])
                else:
                    decomposed_v2.append(command)
            else:
                decomposed_v2.append(command)

        for command in decomposed_v2:
            if "_" in str(command):
                parts = command.split("_")
                if parts[0] in act_devices:
                    decomposed_v3.append(command)
                elif parts[0] == "global" or parts[0] == "macro":
                    global_macro = command.replace("global_", "").replace("macro_", "")
                    decomposed_v3.extend(act_macros["macro"][global_macro])
                elif parts[0] == "dev-on" or parts[0] == "dev-off":
                    global_macro = command.replace(parts[0]+"_", "")
                    decomposed_v3.extend(act_macros[parts[0]][global_macro])
                else:
                    decomposed_v3.append(command)
            else:
                decomposed_v3.append(command)

        # <scene>_*
        # <scene>_scene-on
        # <scene>_scene-off

        return decomposed_v3


class RemotesEdit(RemoteDefaultClass):
    """
    Class to edit remote configuration for scenes and devices
    """

    def __init__(self, data, config, interfaces, apis, queue):
        """
        Constructor of this class

        Args:
            data (RemotesData): handler for remote data
            config (server.modules.rm3cache.ConfigCache): config file handler
            interfaces (server.modules.rm3cache.ConfigInterfaces): handler for config interfaces
            apis (server.interfaces.Connect): handler for device APIS
            queue (server.modules.rm3queue.QueueApiCalls): handler for query queue
        """
        RemoteDefaultClass.__init__(self, "rm-edit", "RemoteEdit")
        self.logging.info("Loading " + self.name)

        self.config = config
        self.interfaces = interfaces
        self.queue = queue
        self.apis = apis
        self.data = data
        self.errors = {}

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
        if rm3json.if_exist(rm3presets.remotes + "scene_" + scene):
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
            msg = self.config.scene_add(scene, active_json[scene])
            if "OK:" not in msg:
                raise msg

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
            self.config.write(rm3presets.remotes + "scene_" + scene, remote)
        except Exception as e:
            return "ERROR: " + str(e)

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
        remotes = self.config.read(rm3presets.remotes + "scene_" + scene)
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
        msg = self.config.scene_set_values(scene, "settings", active_json[scene]["settings"])

        # write remote layout definition
        try:
            self.config.write(rm3presets.remotes + "scene_" + scene, remotes)
        except Exception as e:
            msg += "ERROR: could not write changes (remotes) - " + str(e)

        return msg

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
        if not rm3json.if_exist(rm3presets.remotes + "scene_" + scene):
            return "ERROR: Scene " + scene + " doesn't exists (remotes)."

        message = self.config.scene_delete(scene)
        if "OK:" not in message:
            return self.config.delete(rm3presets.remotes + "scene_" + scene)
        else:
            return message

    def device_add(self, device, info):
        """
        add new device to config file and create command/remote files

        Args:
            device (str): device id
            info (dict): further device information
        Returns:
            str: success or error information
        """
        self.logging.debug("device add: " + str(info))
        interface, interface_dev = info["api"].split("_")

        # Check if exists
        active_json = self.config.read_status()

        if device in active_json:
            return "WARNING: Device " + device + " already exists (active)."

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
                "device_id": info["id_ext"],
                "remote": info["config_remote"],
                "api_key": interface,
                "api_device": "default"
            },
            "settings": {
                "description": info["description"],
                "label": info["label"],
                "image": info["image"],
                "main-audio": "no",
                "position": active_json_position,
                "visible": "yes"
            },
            "status": {"power": "OFF"},
            "type": "device"
        }

        msg = ""
        try:
            msg += self.config.device_add(device, active_json[device])
            if "OK:" in msg:
                self.logging.debug("Added new device '"+device+"' to config file.")
                self.logging.debug("-> " + str(active_json[device]))
            else:
                raise msg
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
            if not rm3json.if_exist(rm3presets.commands + interface + "/" + info["config_device"]):
                self.config.write(rm3presets.commands + interface + "/" + info["config_device"], buttons)
            else:
                raise "Device " + device + " already exists (devices)."
        except Exception as e:
            msg += "WARNING: " + str(e)

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
            if not rm3json.if_exist(rm3presets.remotes + info["config_remote"]):
                self.config.write(rm3presets.remotes + info["config_remote"], remote)
            else:
                raise "Device " + device + " already exists (remotes)."
        except Exception as e:
            msg += "WARNING: " + str(e)

        self.logging.debug("Added device " + device + ": " + str(msg))
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
        keys_config = ["device_id"]
        keys_commands = ["description", "method"]
        keys_remotes = ["description", "remote", "display", "display-size", "type"]

        #    keys_remotes  = ["label","remote","macro-channel","devices","display","display-size"]

        # read central config file
        active_json = self.data.devices_read(selected=[], remotes=False)
        self.logging.debug("device edit: " + str(active_json[device]))

        interface = active_json[device]["config"]["api_key"]
        device_code = active_json[device]["config"]["device"]
        device_remote = active_json[device]["config"]["remote"]

        # read command definition
        commands = self.config.read(rm3presets.commands + interface + "/" + device_code)
        if "ERROR" in commands:
            return "ERROR: Device " + device + " doesn't exists (commands)."

        # read remote layout definitions
        remotes = self.config.read(rm3presets.remotes + device_remote)
        if "ERROR" in remotes:
            return "ERROR: Device " + device + " doesn't exists (remotes)."

        i = 0
        for key in keys_active:
            if key in info:
                active_json[device]["settings"][key] = info[key]
                i += 1

        for key in keys_config:
            if key in info:
                active_json[device]["config"][key] = info[key]
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
            msg1 = self.config.device_set_values(device, "config", active_json[device]["config"])
            msg2 = self.config.device_set_values(device, "settings", active_json[device]["settings"])
            if "ERROR" in msg1 or "ERROR" in msg2:
                raise mgs1 + " / " + msg2
        except Exception as e:
            return "ERROR: could not write changes (active) - " + str(e)

        # write command definition
        try:
            self.config.write(rm3presets.commands + interface + "/" + device_code, commands)
        except Exception as e:
            return "ERROR: could not write changes (commands) - " + str(e)

        # write remote layout definition
        try:
            self.config.write(rm3presets.remotes + device_remote, remotes)
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
        interface = active_json[device]["config"]["api_key"]
        device_code = active_json[device]["config"]["device"]
        device_remote = active_json[device]["config"]["remote"]
        file_device_remote = rm3presets.remotes + device_remote
        file_interface_remote = rm3presets.commands + interface + "/" + device_code

        if "ERROR" in active_json:
            return "ERROR: Could not read ACTIVE_JSON (active)."
        if device not in active_json:
            return "ERROR: Device " + device + " doesn't exists (active)."
        if not rm3json.if_exist(rm3presets.commands + interface + "/" + device_code):
            return "ERROR: Device " + device + " doesn't exists (commands)."
        if not rm3json.if_exist(rm3presets.remotes + device_remote):
            return "ERROR: Device " + device + " doesn't exists (remotes)."

        message = self.config.device_delete(device)
        if "ERROR: " in message:
            return message

        msg1 = self.config.delete(file_device_remote)
        msg2 = self.config.delete(file_interface_remote)

        if "OK:" in msg1 and "OK:" in msg2:
            message = "OK: Device '" + device + "' deleted."
        else:
            message = "ERROR: Could not fully delete device '" + device + "'. (" + msg1 + "; " + msg2 + ")"
        return message

    def device_status_get(self, device, key):
        """
        get status of device

        Args:
            device (str): device id
            key (str): status key
        Returns:
            Any: status information device->key
        """
        status = self.config.read_status()

        if device not in status:
            self.logging.error("Get status - Device not defined: " + device + " (" + key + ")")
            return 0

        if device in status and key in status[device]["status"]:
            self.logging.debug("Get status: " + key + " = " + str(status[device]["status"][key]))
            return status[device]["status"][key]

        else:
            self.logging.error("Get status: " + key + "/" + device)
            return 0

    def device_status_set(self, device, key, value):
        """
        change status and write to file

        Args:
            device (str): device id
            key (str): status key
            value (Any): value to be set
        Returns:
            Any: status information device->key
        """

        # set status
        if key == "":
            key = "power"

        return self.config.device_set_values(device, "status", {key: value})

    def device_status_reset(self):
        """
        set status for all devices to OFF

        Returns:
            str: success or error message
        """
        count_OK = 0
        count_ERROR = 0
        status = self.config.read_status()

        # reset if device is not able to return status and interface is defined
        for key in status:
            if status[key]["config"]["api_key"] != "":
                device_code = self.config.translate_device(key)
                device = self.config.read(rm3presets.commands + status[key]["config"]["api_key"] + "/" +
                                          device_code)
                logging.info("device_status_reset(): " + device_code + "/" + status[key]["config"]["api_key"])

                if device["data"]["method"] != "query":
                    status[key]["status"]["power"] = "OFF"
                    if "OK:" in self.config.device_set_values(key, "status", {"power": "OFF"}):
                        count_OK += 1
                    else:
                        count_ERROR += 1

        if count_ERROR == 0:
            return "OK: Reset POWER to OFF for devices without API"
        else:
            return "ERROR: Reset POWER to OFF for devices without API"

    def device_status_audio_reset(self):
        """
        set status for all devices to OFF

        Returns:
            str: success or error message
        """
        status = self.config.read_status()
        count_OK = 0
        count_ERROR = 0

        # reset if device is not able to return status and interface is defined
        for key in status:
            if status[key]["config"]["api_key"] != "":
                device_code = self.config.translate_device(key)
                device = self.config.read(rm3presets.commands + status[key]["config"]["api_key"] + "/" +
                                          device_code)
                logging.info("Reset device_status_reset_audio(): " + device_code + "/" +
                             status[key]["config"]["api_key"])

                if device["data"]["method"] != "query":
                    if "vol" in status[key]["status"]:
                        status[key]["status"]["vol"] = 0
                    if "mute" in status[key]["status"]:
                        status[key]["status"]["mute"] = "OFF"

                    if "OK:" in self.config.device_set_values(key, "status", status[key]["status"]):
                        count_OK += 1
                    else:
                        count_ERROR += 1

        if count_ERROR == 0:
            return "OK: Reset AUDIO to 0 for devices without API"
        else:
            return "ERROR: Reset AUDIO to 0 for devices without API"

    def device_main_audio_set(self, device):
        """
        set device as main audio device

        Args:
            device (str): device id
        Returns:
            str: success or error message
        """
        status = self.config.read_status()

        if device in status:
            for key in status:
                if key == device:
                    self.config.device_set_values(key, "settings", {"main-audio": "yes"})
                else:
                    self.config.device_set_values(key, "settings", {"main-audio": "no"})

            if "main-audio" in status[device]["settings"] and status[device]["settings"]["main-audio"] == "yes":
                return_msg = "OK: Set " + device + " as main-audio device."
            else:
                return_msg = "ERROR: Could not set " + device + " as main-audio device."
        else:
            return_msg = "ERROR: device not defined."

        return return_msg

    def button_add(self, device, button):
        """
        add new button to remote layout

        Args:
            device (str): device id
            button (str): button id
        Returns:
            str: success or error message
        """
        config = self.config.read_status()
        device_remote = config[device]["config"]["remote"]
        data = self.config.read(rm3presets.remotes + device_remote)

        if "data" in data:
            if button != "DOT" and button != "LINE" and button in data["data"]["remote"]:
                return "WARNING: Button '" + device + "_" + button + "' already exists."
            else:
                if button == "DOT":
                    button = "."
                data["data"]["remote"].append(button)
                self.config.write(rm3presets.remotes + device_remote, data)
                return "OK: Button '" + device + "_" + button + "' added."
        else:
            return "ERROR: Device '" + device + "' does not exists."

        # ---------------------------------------

    def button_add_command(self, device, button, command):
        """
        add new command to button or change existing

        Args:
            device (str): device id
            button (str): button id
            command (str): command to be connected with the button
        Returns:
            str: success or error message
        """
        config = self.config.read_status()
        interface = config[device]["config"]["api_key"]
        device_code = config[device]["config"]["device"]
        data = self.config.read(rm3presets.commands + interface + "/" + device_code)

        if "data" in data:
            if button in data["data"]["buttons"].keys():
                return "WARNING: Button '" + device + "_" + button + "' already exists."
            else:
                command = str(command)
                command = command.replace("b'", "")
                command = command.replace("'", "")
                data["data"]["buttons"][button] = command
                self.config.write(rm3presets.commands + interface + "/" + device_code, data)
                return "OK: Button '" + device + "_" + button + "' recorded and saved: " + str(command)
        else:
            return "ERROR: Device '" + device + "' does not exists."

    def button_delete_command(self, device, button):
        """
        delete command (not button) from json config file

        Args:
            device (str): device id
            button (str): button id
        Returns:
            str: success or error message
        """
        config = self.config.read_status()
        interface = config[device]["config"]["api_key"]
        device_code = config[device]["config"]["device"]
        data = self.config.read(rm3presets.commands + interface + "/" + device_code)

        if data["data"]:
            if button in data["data"]["buttons"].keys():

                data["data"]["buttons"].pop(button, None)
                self.config.write(rm3presets.commands + interface + "/" + device_code, data)
                return "OK: Command '" + device + "_" + button + "' deleted."
            else:
                return "ERROR: Command '" + device + "_" + button + "' does not exist."
        else:
            return "ERROR: Device '" + device + "' does not exist."

    def button_delete(self, device, button_number):
        """
        delete button (not command) from json config file

        Args:
            device (str): device id
            button_number (int): position of button in device remote
        Returns:
            str: success or error message
        """
        buttonNumber = int(button_number)
        config = self.config.read_status()
        device_remote = config[device]["config"]["remote"]
        data = self.config.read(rm3presets.remotes + device_remote)

        if data["data"] and data["data"]["remote"]:
            if 0 <= buttonNumber < len(data["data"]["remote"]):
                data["data"]["remote"].pop(buttonNumber)
                self.config.write(rm3presets.remotes + device_remote, data)
                return "OK: Button '" + device + " [" + str(buttonNumber) + "] deleted."
            else:
                return "ERROR: Button '" + device + " [" + str(buttonNumber) + "] does not exist."
        else:
            return "ERROR: Device '" + device + "' does not exist."

    def button_get_value(self, device, button):
        """
        Get Status from device for a specific button or display value

        Args:
            device (str): device id
            button (str): button id
        Returns:
            str: success or error message
        """
        power_buttons = ["on", "on-off", "off"]
        if button in power_buttons:
            button = "power"

        method = self.config.cache["_api"]["devices"][device]["method"]
        interface = self.config.cache["_api"]["devices"][device]["config"]["api_key"]

        self.logging.debug("button_get_value(): ...m:" + method + " ...d:" + device + " ...b:" + button)
        if method == "record":
            self.device_status_get(device, button)
        elif method == "query":
            return self.apis.api_query(interface, device, button)
        else:
            return "ERROR: Wrong method (" + method + ")"

        return "OK"

    def button_set_value(self, device, button, state):
        """
        Set Status of device for a specific button or display value (method = "record")
        used via callback from queueSend also

        Args:
            device (str): device id
            button (str): button id
            state (Any): value to be set
        Returns:
            str: success or error message
        """

        power_buttons = ["on", "on-off", "off"]
        vol_buttons = ["vol+", "vol-"]
        method = self.config.cache["_api"]["devices"][device]["method"]

        self.logging.debug("button_set_value(): ...m:" + method + " ...d:" + device +
                           " ...b:" + button + " ...s:" + str(state))

        if method == "record":

            if button in power_buttons:
                button = "power"
            if button in vol_buttons:
                button = "vol"
            if button == "on":
                state = "ON"
            if button == "off":
                state = "OFF"

            msg = self.device_status_set(device, button, state)
            self.config.cache_time = 0

            if "ERROR" in msg:
                return msg
            else:
                return "OK"

        else:
            self.logging.warning("button_set_value(): Wrong method (" + method + "," + device + "," + button + ")")
            return "ERROR: Wrong method (" + method + ")"

    def remote_move(self, remote_type, device, direction):
        """
        move device or scene button, direction => -x steps backward / x steps forward

        Args:
            remote_type (str): type of remote ('device' or 'scene')
            device (str): device or scene id
            direction (int): direction / steps to move the remote
        Returns:
            str: success or error message
        """
        if remote_type == "device" or remote_type == "remote":
            status = self.config.read_status()
        elif remote_type == "scene":
            status = self.data.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
        else:
            return "ERROR: type " + remote_type + " is unknown."

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

        # check if device is defined
        if device not in status:
            return "ERROR: " + device + " (" + remote_type + ") not defined."

        # check if position is defined and add, if not existing
        for key in status:
            if "position" not in status[key]["settings"]:
                position = False

        i = 1
        if not position:
            for key in status:
                status[key]["settings"]["position"] = i
                i += 1
            if remote_type == "device":
                self.config.device_set_values(device, "settings", {"position": i})
            elif remote_type == "scene":
                self.data.scenes_write(status)  # configFiles.write(modules.active_scenes,status)

            return_msg = "WARN: Position wasn't existing. Has been set, please move again."

        # get position and move into direction
        else:
            i = 1
            for key in status:
                i += 1

            if 0 < status[device]["settings"]["position"] + direction < i:
                old_position = status[device]["settings"]["position"]
                new_position = status[device]["settings"]["position"] + direction

                for key in status:
                    if status[key]["settings"]["position"] == new_position:
                        status[key]["settings"]["position"] = old_position

                status[device]["settings"]["position"] = new_position
                return_msg = "OK. Moved " + device + " from " + str(old_position) + " to " + str(new_position) + "."

            else:
                return_msg = "WARNING: Out of range."

        if remote_type == "device":
            self.config.device_set_values(device, "settings", {"position": status[device]["settings"]["position"]})

        elif remote_type == "scene":
            self.data.scenes_write(status)  # configFiles.write(modules.active_scenes,status)

        return return_msg

    def remote_visibility(self, remote_type, device, visibility):
        """
        change visibility in device configuration (yes/no)

        Args:
            remote_type (str): type of remote ('device' or 'scene')
            device (str): device or scene id
            visibility (str): visibility of remote ('yes' or 'no')
        Returns:
            str: success or error message
        """
        if remote_type == "remote" or remote_type == "device":
            return self.config.device_set_values(device, "settings", {"visible": visibility})

        elif remote_type == "scene":
            data = self.data.scenes_read(selected=[], remotes=False)  # configFiles.read(modules.active_scenes)
            if device not in data.keys():
                return "Scene '" + device + "' does not exists."

            elif visibility == "yes" or visibility == "no":
                data[device]["settings"]["visible"] = visibility
                self.data.scenes_write(data)
                return "OK: Change visibility for '" + device + "': " + visibility

            else:
                return "ERROR: Visibility value '" + visibility + "' does not exists."

        else:
            return "ERROR: changeVisibility - Type doesn't exist (" + remote_type + ")."

    def remote_add_template(self, device, template):
        """
        add / overwrite remote layout definition by template

        Args:
            device (str): device or scene id
            template (str): template id
        Returns:
            str: success or error message
        """
        templates = self.config.read(rm3presets.templates + template)
        config = self.config.read_status()
        device_remote = config[device]["config"]["remote"]
        data = self.config.read(rm3presets.remotes + device_remote)

        # check if error
        if "data" not in data.keys():
            return "ERROR: Device '" + device + "' does not exists."

        # add layout from template
        elif template in templates and data["data"] == []:

            if "data" in templates:
                data["data"]["remote"] = templates["data"]["remote"]
            else:
                data["data"]["remote"] = templates[template]["remote"]
            self.config.write(rm3presets.remotes + device_remote, data)
            return "OK: Template '" + template + "' added to '" + device + "'."

        # overwrite layout from template
        elif template in templates and data["data"] != []:

            if "data" in templates:
                data["data"]["remote"] = templates["data"]["remote"]
            else:
                data["data"]["remote"] = templates[template]["remote"]

            self.config.write(rm3presets.remotes + device_remote, data)
            return "OK: Remote definition of '" + device + "' overwritten by template '" + template + "'."

        # template doesn't exist
        else:
            return "ERROR: Template '" + template + "' does not exists."

    def remote_edit_macros(self, macros):
        """
        check if format is correct and save macros

        Args:
            macros (dict): macro information
        Returns:
            str: success or error message
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
                        return "ERROR: wrong data format - list entry is not a number or string (" + str(
                            key) + "/" + str(
                            key2) + "/" + str(list_key) + ")"

        macro_file = self.data.macros_read()
        for key in macros:
            macro_file[key] = macros[key]
        self.data.macros_write(macro_file)

        return "OK, saved macro file."
