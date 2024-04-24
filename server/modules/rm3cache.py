import time
import os
import modules.rm3config as rm3config
import modules.rm3json as rm3json
from modules.rm3classes import RemoteThreadingClass
from pathlib import Path


class ConfigInterfaces(RemoteThreadingClass):
    """
    Triggering update requests from interfaces (when request from APP is done)
    """

    def __init__(self, name):
        RemoteThreadingClass.__init__(self, "cache.INI", name)
        self.name = name
        self.cache_update_api = False
        self.cache_time = time.time()  # initial time for time based update
        self.cache_interval = rm3config.refresh_device_status  # update interval in seconds (reread files)
        self.thread_priority(3)

    def run(self):
        """
        Start thread
        """
        self.logging.info("Starting " + self.name)
        while self._running:

            if time.time() - self.cache_time >= self.cache_interval:
                # Reread values from interfaces with next request -> RemoteReload in server_cmd.py
                self.cache_update_api = True
                self.cache_time = time.time()
                self.logging.debug("Reread device information via interface with next request (" + self.name + ", " +
                                   str(self.cache_interval) + "s)")

            self.thread_wait()

        self.logging.info("Exiting " + self.name)

    def stop(self):
        """
        Stop thread
        """
        self._running = False


class ConfigCache(RemoteThreadingClass):
    """
    class to read and write configurations using a cache
    """

    def __init__(self, name):
        """
        create class, set name

        Returns:
            name (str): class name
        """
        RemoteThreadingClass.__init__(self, "cache.CONF", name)

        self.cache = {}
        self.cache_time = time.time()  # initial time for time based update
        self.cache_last_action = time.time()  # initial time for timestamp of last action
        self.cache_interval = rm3config.refresh_config_cache  # update interval in seconds (reread files)
        self.cache_sleep = rm3config.refresh_config_sleep  # sleeping mode after x seconds
        self.cache_update = False  # foster manual update of files
        self.cache_update_cmd = False
        self.cache_update_api = None
        self.configMethods = {}
        self.api_init = {"API": {
            "name": rm3config.API_name,
            "version": rm3config.API_version,
            "stage": rm3config.initial_stage,
            "rollout": rm3config.rollout
        }}
        self.interface_configuration = {}
        self.thread_priority(1)

    def run(self):
        """
        loop running in the background
        """
        self.logging.info("Starting " + self.name)
        while self._running:

            # No update when in sleeping mode (no API request since a "cache_sleep")
            if time.time() - self.cache_last_action >= self.cache_sleep:
                self.cache_update = False
                self.cache_update_api = False

            # Update, when "cache_interval" is passed
            elif time.time() - self.cache_time >= self.cache_interval:
                self.cache_update = True

            # "cache_update" can be set from outside also
            else:
                pass

            # Reread values from config files
            if self.cache_update:
                self.reread_cache()

            self.thread_wait()

        self.logging.info("Exiting " + self.name)

    def check_config(self):
        """
        read and check main config_files
        """
        error_msg = {}
        check = self.read(rm3config.active_devices)
        if "ERROR" in check:
            error_msg[rm3config.active_devices] = check["ERROR_MSG"]
        check = self.read(rm3config.active_scenes)
        if "ERROR" in check:
            error_msg[rm3config.active_scenes] = check["ERROR_MSG"]
        check = self.read(rm3config.active_macros)
        if "ERROR" in check:
            error_msg[rm3config.active_macros] = check["ERROR_MSG"]
        check = self.read(rm3config.active_apis)
        if "ERROR" in check:
            self.logging.warning("Error while reading MAIN CONFIG FILES:")
            self.logging.warning(" - " + rm3config.data_dir + "/" + rm3config.active_apis + ".json: " + check["ERROR"])

        if error_msg != {}:
            self.logging.error("Error while reading MAIN CONFIG FILES:")
            for key in error_msg:
                self.logging.error(" - " + rm3config.data_dir + "/" + key + ".json: " + str(error_msg[key]))
            return "ERROR"

    def update(self):
        """
        set var to enforce update
        """
        # self.cache_update = True
        self.reread_cache()
        self.logging.info("Enforce cache update (" + self.name + ") " + str(self.cache_update))

    def read(self, config_file, from_file=False):
        """
        read config from cache if not empty and not to old
        else read from file
        """
        config_file_key = config_file.replace("/", "**")
        self.logging.debug("readConfig: " + config_file)
        if config_file_key not in self.cache or from_file:
            self.cache[config_file_key] = rm3json.read(config_file)
            self.logging.debug("... from file (from_file=" + str(from_file) + ").")

        return self.cache[config_file_key].copy()

    def reread_cache(self):
        """
        reread all files into the cache
        """
        self.logging.debug("Reread config files ...")
        self.cache_update_cmd = True
        i = 0
        for key in self.cache:
            if key != "_api":
                key_path = key.replace("**", "/")
                self.cache[key] = rm3json.read(key_path)
                self.logging.debug("... " + key_path)
                i += 1

        self.logging.info("Reread " + str(i) + " config files into the cache (" + self.name + "," \
                          + str(self.cache_interval) + "s)")

        self.cache_time = time.time()
        self.cache_update = False

    def write(self, config_file, value, source=""):
        """
        write config to file and update cache
        """
        config_file_key = config_file.replace("/", "**")
        rm3json.write(config_file, value, "cache.write " + source)
        self.cache[config_file_key] = value.copy()

    def translate_device(self, device):
        """
        get device name as file name
        """
        status = self.read(rm3config.active_devices)
        if device in status:
            return status[device]["config"]["device"]
        else:
            return ""

    def get_method(self, device):
        """
        get method for device
        """
        status = self.read(rm3config.active_devices)
        interface = status[device]["config"]["interface_api"]
        device = status[device]["config"]["device"]
        definition = self.read(rm3config.devices + interface + "/" + device)
        return definition["data"]["method"]

    def interfaces_identify(self):
        """
        Identify existing interfaces

        Returns:
            dict: interface configuration
        """
        directories = []
        interface_dir = os.path.join(rm3config.data_dir, rm3config.devices)
        interface_sub_dirs = [str(p) for p in Path(str(interface_dir)).rglob('*') if p.is_dir()]
        for key in interface_sub_dirs:
            directories.append(key.replace(str(interface_dir), ""))

        self.logging.debug("Interfaces from interfaces: " + str(rm3config.api_modules))
        self.logging.debug("Interfaces from directory:  " + str(directories))
        self.logging.debug("API Config file: " + str(os.path.join(rm3config.data_dir, rm3config.active_apis)))

        if os.path.exists(os.path.join(rm3config.data_dir, rm3config.active_apis + ".json")):
            interface_config = self.read(rm3config.active_apis)
            for key in interface_config:
                if "error" in interface_config[key]:
                    del interface_config[key]["error"]
        else:
            interface_config = {}

        for key in directories:
            interface_config_dir = os.path.join(rm3config.commands, key, "00_interface")
            if key not in interface_config:
                interface_config[key] = {
                    "active":           True,
                    "config_file":      str(interface_config_dir) + ".json",
                    "config_info":      "Don't edit config here!",
                    "devices":          {},
                    "devices_active":   {},
                    "devices_count":    0
                }
            if os.path.exists(os.path.join(rm3config.data_dir, interface_config_dir + ".json")):
                interface_config_detail = self.read(interface_config_dir).copy()
                interface_config[key]["devices"] = interface_config_detail["API-Devices"]
                interface_config[key]["devices_count"] = len(interface_config_detail["API-Devices"])
                interface_config[key]["description"] = interface_config_detail["API-Description"]
                if "devices_active" not in interface_config[key]:
                    interface_config[key]["devices_active"] = {}
                for dev_key in interface_config[key]["devices"]:
                    if dev_key not in interface_config[key]["devices_active"]:
                        interface_config[key]["devices_active"][dev_key] = True
            else:
                interface_config[key]["error"] = "Config file not found!"
                interface_config[key]["active"] = False

        for key in rm3config.api_modules:
            if key not in interface_config:
                interface_config[key] = {
                    "active":           False,
                    "config_file":      rm3config.commands + key + "/00_interface.json",
                    "config_info":      "Create config file to use this API.",
                    "devices":          {},
                    "devices_active":   {},
                    "devices_count":    0,
                    "error":            "Config file for connected API not found!"
                }
        delete_apis = []
        for key in interface_config:
            if key not in rm3config.api_modules and key not in directories:
                delete_apis.append(key)
            elif key not in rm3config.api_modules:
                interface_config[key]["active"] = False
                interface_config[key]["error"] = "API '" + key + "' not found!"

        for key in delete_apis:
            del interface_config[key]

        self.write(rm3config.active_apis, interface_config)
        self.interface_configuration = interface_config.copy()
        return interface_config.copy()

    def interface_active(self, interface, active):
        """
        set activity of an interface

        Args:
            interface (str): interface id
            active (bool): interface active or not
        Returns:
            str: 'OK' or 'ERROR'
        """
        interface_config = self.read(rm3config.active_apis)

        if interface in interface_config:
            self.logging.debug(interface_config[interface])
            if active == "False":
                interface_config[interface]["active"] = False
            elif active == "True":
                interface_config[interface]["active"] = True
            self.logging.debug("Changed activity for '" + interface + "' to " + str(active) + ".")
        else:
            self.logging.error("Interface '" + interface + "' not available in '" + rm3config.active_apis + ".json'.")
            return "ERROR"

        self.write(rm3config.active_apis, interface_config)
        self.interface_configuration = interface_config.copy()
        return "OK"

    def interface_device_active(self, interface, api_device, active):
        """
        set activity of an interface

        Args:
            interface (str): interface id
            api_device (str): API-device id
            active (bool): interface active or not
        Returns:
            str: 'OK' or 'ERROR'
        """
        interface_config = self.read(rm3config.active_apis)

        if interface in interface_config:
            self.logging.debug(interface_config[interface])
            if api_device in interface_config[interface]["devices_active"]:
                if active == "False":
                    interface_config[interface]["devices_active"][api_device] = False
                elif active == "True":
                    interface_config[interface]["devices_active"][api_device] = True
                self.logging.debug("Changed activity for '" + interface + "' to " + str(active) + ".")
            else:
                self.logging.error("Interface '" + interface + "' has no API device '" + api_device +
                                   "' in '" + rm3config.active_apis + ".json'.")
                return "ERROR"
        else:
            self.logging.error("Interface '" + interface + "' not available in '" + rm3config.active_apis + ".json'.")
            return "ERROR"

        self.write(rm3config.active_apis, interface_config)
        self.interface_configuration = interface_config.copy()
        return "OK"

    def read_status(self, selected_device=""):
        """
        read and return array
        """
        status = self.read(rm3config.active_devices)

        # initial load of methods (record vs. query)
        if self.configMethods == {} and selected_device == "" and "ERROR" not in status:

            for device in status:
                key = status[device]["config"]["device"]
                interface = status[device]["config"]["interface_api"]
                if interface != "" and key != "":
                    config = self.read(rm3config.commands + interface + "/" + key)
                    config_default = self.read(rm3config.commands + interface + "/00_default")
                    if "ERROR" not in config and "method" in config["data"]:
                        self.configMethods[device] = config["data"]["method"]
                    elif "ERROR" not in config_default and "method" in config_default["data"]:
                        self.configMethods[device] = config_default["data"]["method"]

        elif "ERROR" in status:
            self.logging.error("ERROR while reading '" + rm3config.active_devices + "'!")
            self.logging.error(str(status))

        # if device is given return only device status
        if selected_device != "" and selected_device in status and "status" in status[selected_device]:
            status = status[selected_device]["status"]

        return status.copy()

    def write_status(self, status, source=""):
        """
        write status and make sure only valid keys are saved
        """
        status_temp = {}
        relevant_keys = ["status", "config", "settings"]

        for dev in status:
            status_temp[dev] = {}
            for key in status[dev]:
                if key in relevant_keys:
                    status_temp[dev][key] = status[dev][key]

        active_devices_key = rm3config.active_devices.replace("/", "**")
        self.write(rm3config.active_devices, status_temp, "cache.write_status " + source)
        self.cache[active_devices_key] = status_temp.copy()
