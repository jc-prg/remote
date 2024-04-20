import logging
import threading
import modules.rm3config as rm3config


class RemoteDefaultClass(object):
    """
    Default class for jc://remote/
    """

    def __init__(self, class_id, name):
        """
        Class constructor
        """
        self.class_id = class_id
        self.name = name

        self.error = False
        self.error_msg = []
        self.error_time = None

        self.log_level = None
        self.log_level_name = ""
        for key in rm3config.log_level_module:
            if self.class_id in rm3config.log_level_module[key]:
                self.log_level = eval("logging." + key.upper())
                self.log_level_name = key

        if self.log_level is None:
            self.log_level = rm3config.log_set2level
            self.log_level_name = rm3config.log_level

        self.logging = rm3config.set_logging(self.class_id, self.log_level)
        self.logging.debug("Creating class " + name + " (Log Level: " + self.log_level_name + ") ...")


class RemoteApiClass(RemoteDefaultClass):
    """
    Class for APIs in jc://remote
    """

    def __init__(self, identifier, api_name, method, description, device="", device_config=None, log_command=False):
        """
        Class constructor
        """
        RemoteDefaultClass.__init__(self, identifier, description)

        if device_config is None:
            device_config = {}
        if "IPAddress" not in device_config:
            device_config["IPAddress"] = "N/A"

        self.api = None
        self.api_name = api_name
        self.api_config = device_config
        self.api_device = device
        self.api_description = description
        self.api_config_default = {
            "Description": "",
            "IPAddress": "",
            "Methods": ["send", "query"],
            "Port": "",
            "Timeout": 0
        }

        self.method = method
        self.status = "Start"
        self.working = False
        self.not_connected = "ERROR: Device not connected (" + api_name + "/" + device + ")."

        self.count_error = 0
        self.count_success = 0
        self.log_command = log_command
        self.last_action = 0
        self.last_action_cmd = ""

        self.logging.info("_INIT: " + str(self.api_name) + " - " + str(self.api_description) +
                          " (" + str(self.api_config["IPAddress"]) + ")")


class RemoteThreadingClass(threading.Thread, RemoteDefaultClass):
    """
    Class for threads in jc://remote/
    """

    def __init__(self, identifier, name):
        """
        Class constructor
        """
        threading.Thread.__init__(self)
        RemoteDefaultClass.__init__(self, identifier, name)

        self._running = True
        self._paused = False
        self._processing = False

        self.logging.debug("Creating thread " + name + " ...")

    def stop(self):
        """
        Stop if thread (set self._running = False)
        """
        self.logging.debug("GOT STOPPING SIGNAL ...")
        self._running = False
        self._processing = False

