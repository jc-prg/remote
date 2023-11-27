import logging, time
import threading

import modules.rm3config as rm3config
import modules.rm3json as rm3json
import modules.rm3stage as rm3stage


class ConfigInterfaces(threading.Thread):
    """
    Triggering update requests from interfaces (when request from APP is done)
    """

    def __init__(self, name):
        threading.Thread.__init__(self)
        self.name = name
        self.stopProcess = False
        self.wait = 1
        self.cache_update_api = False
        self.cache_time = time.time()  # initial time for time based update
        self.cache_interval = rm3config.refresh_device_status  # update interval in seconds (reread files)

        self.logging = logging.getLogger("cache.INT")
        self.logging.setLevel = rm3stage.log_set2level

    def run(self):
        """
        Start thread
        """
        self.logging.info("Starting " + self.name)
        while not self.stopProcess:

            if time.time() - self.cache_time >= self.cache_interval:
                # Reread values from interfaces with next request -> RemoteReload in server_cmd.py
                self.cache_update_api = True
                self.cache_time = time.time()
                self.logging.info("Reread device information via interface with next request (" + self.name + ", " +
                                  str(self.cache_interval) + "s)")

            # wait a few seconds
            time.sleep(self.wait)

        self.logging.info("Exiting " + self.name)

    def stop(self):
        """
        Stop thread
        """
        self.stopProcess = False


class ConfigCache(threading.Thread):
    """
    class to read and write configurations using a cache
    """

    def __init__(self, name):
        """
        create class, set name
        """

        threading.Thread.__init__(self)
        self.name = name
        self.stopProcess = False
        self.wait = 0.5
        self.cache = {}
        self.cache_time = time.time()  # initial time for timebased update
        self.cache_last_action = time.time()  # initial time for timestamp of last action
        self.cache_interval = rm3config.refresh_config_cache  # update interval in seconds (reread files)
        self.cache_sleep = rm3config.refresh_config_sleep  # sleeping mode after x seconds
        self.cache_update = False  # foster manual update of files
        self.cache_update_api = None
        self.configMethods = {}
        self.api_init = {"API": {
            "name": rm3config.APIname,
            "version": rm3config.APIversion,
            "stage": rm3config.initial_stage,
            "rollout": rm3stage.rollout
        }}

        self.logging = logging.getLogger("cache.CONF")
        self.logging.setLevel = rm3stage.log_set2level

    def run(self):
        """
        loop running in the background
        """

        self.logging.info("Starting " + self.name)
        while not self.stopProcess:

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

            # wait a few seconds
            else:
                time.sleep(self.wait)

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

        if error_msg != {}:
            self.logging.error("Error while reading MAIN CONFIG FILES:")
            for key in error_msg:
                self.logging.error(" - " + rm3stage.data_dir + "/" + key + ".json: " + str(error_msg[key]))
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
        self.logging.info("readConfig: " + config_file)
        if config_file_key not in self.cache or from_file:
            self.cache[config_file_key] = rm3json.read(config_file)
            self.logging.info("... from file (from_file=" + str(from_file) + ").")

        return self.cache[config_file_key].copy()

    def reread_cache(self):
        """
        reread all files into the cache
        """
        self.logging.debug("Reread config files ...")
        i = 0
        for key in self.cache:
            if key != "_api":
                key_path = key.replace("**", "/")
                self.cache[key] = rm3json.read(key_path)
                self.logging.info("... " + key_path)
                i += 1

        self.logging.debug("Reread " + str(i) + " config files into the cache (" + self.name + "," \
                           + str(self.cache_interval) + "s)")

        self.cache_time = time.time()
        self.cache_update = False

    def write(self, config_file, value, source=""):
        """
        write config to file and update cache
        """
        config_file_key = config_file.replace("/", "**")
        rm3json.write(config_file, value, "cache.write " + source)
        self.cache[config_file_key] = value

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

        return status

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
        self.cache[active_devices_key] = status_temp
