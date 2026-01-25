import logging
import sys
import time
import threading
import traceback
import server.modules.rm3presets as rm3presets
from datetime import datetime

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
        self.log_level_set = ""

        for key in rm3presets.log_level_module:
            if self.class_id in rm3presets.log_level_module[key]:
                self.log_level = eval("logging." + key.upper())
                self.log_level_name = key
                self.log_level_set = key.upper()

        if self.log_level is None:
            self.log_level = rm3presets.log_set2level
            self.log_level_name = rm3presets.log_level

        rm3presets.server_health[class_id] = "registered"
        self.logging = rm3presets.set_logging(self.class_id, self.log_level)
        self.logging.debug("Creating class " + name + " (Log Level: " + self.log_level_name + ") ...")

        if self.log_level_set != "":
            self.logging.info(f"Set log-level for {self.class_id} to {self.log_level_name}.")

    def error_details(self, details, called_from="", ignore=None):
        """ 
        print error details, call self.error_details(sys.exc_info(), "ClassName.def_name()")
        """
        if ignore is None:
            ignore = []

        exc_type, exc_value, exc_tb = details
        tb = traceback.format_tb(exc_tb)
        message = f"{self.name} ({called_from}): {exc_type} | {exc_value}\n {tb}"

        for key in ignore:
            if key in exc_value:
                self.logging.debug(f"IGNORE EXCEPTION in {message}")
                return

        self.logging.error(f"EXCEPTION in {message}")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        timestamp = ("-" * 50) + "\n" + timestamp + "  -> OTHER EXCEPTION:\n" + ("-" * 50)
        with open(rm3presets.log_filename_error, "a", encoding="utf-8") as f:
            f.write(f"{timestamp}\n{message}\n")


class RemoteApiClass(RemoteDefaultClass):
    """
    Class for APIs in jc://remote
    """

    def __init__(self, class_id, api_name, method, description, device="", device_config=None,
                 log_command=False, config=None):
        """
        Class constructor
        """
        RemoteDefaultClass.__init__(self, class_id, description)

        if device_config is None:
            device_config = {}
        if "IPAddress" not in device_config:
            device_config["IPAddress"] = "N/A"

        self.config = config

        self.api = None
        self.api_name = api_name
        self.api_config = device_config
        self.api_device = device
        self.api_description = description
        self.api_discovery = {}
        self.api_device_config_default = {
            "API-Description": "",
            "API-Devices": {},
            "API-Info": "",
            "API-Source": ""
        }
        self.api_config_default = {
            "AdminURL": "",
            "Description": "",
            "IPAddress": "",
            "Methods": ["send", "query", "record"],
            "MultiDevice": False,
            "Port": "",
            "PowerDevice": "",
            "Timeout": 5
        }

        self.method = method
        self.status = "Start"
        self.working = False
        self.not_connected = "ERROR: Device not connected (" + api_name + "/" + device + ")."
        self.detected_devices = []
        self.devices_available_message = {}

        self.count_error = 0
        self.count_success = 0
        self.log_command = log_command
        self.last_action = 0
        self.last_action_cmd = ""

        if "Description" in self.api_config:
            self.api_description = self.api_config["Description"]

        self.logging.info("_INIT: " + str(self.api_name) + " - " + str(self.api_description) +
                          " (" + str(self.api_config["IPAddress"]) + ")")

    def config_add_key(self, key, default_value=None):
        """
        add a key to the default configuration

        Args:
            key (str): key to be added
            default_value (Any): default value, None if not set
        """
        self.api_config_default[key] = default_value

    def config_set(self, device_config):
        """
        (re)set API device configuration

        Args:
            device_config (dict): API device configuration
        """
        self.api_config = device_config

    def config_set_methods(self, methods):
        """
        change default methods for API

        Args:
            methods (list): available options als list, if all: ["send", "query", "record"]
        """
        self.api_config_default["Methods"] = methods

    def devices_available(self):
        """
        get all available devices of this interface, if supported

        Returns:
            dict: empty dict, as not implemented for this API
        """
        if not "devices_available" in self.devices_available_message:
            self.logging.debug("Method 'devices_available()' is not implemented for the API '" + self.name + "'.")
            self.devices_available_message["devices_available"] = True
        return {}

    def api_device_available(self, api_device):
        """
        check if API device is available, if not connected via IP (e.g. USB Dongle)

        Args:
            api_device (str): API Device identifier
        Returns:
            bool: True (otherwise redefine function in API connector)
        """
        if not "api_device_available" in self.devices_available_message:
            self.devices_available_message["api_device_available"] = True
            self.logging.debug("Method 'api_device_available()' is not implemented for the API '" + self.name + "'.")
        return "OK"

    def devices_listen(self, active):
        """
        activate / disable listen mode new ZigBee devices

        Args:
            active (bool): True to activate, False to disable
        Returns:
            dict: empty dict, as not implemented for this API
        """
        if not "devices_listen" in self.devices_available_message:
            self.devices_available_message["devices_listen"] = True
            self.logging.debug("Method 'devices_listen()' is not implemented for the API '" + self.name + "'.")
        return {}

    def discover(self):
        """
        discover available API devices
        """
        if not "discover" in self.devices_available_message:
            self.devices_available_message["discover"] = True
            self.logging.debug("Method 'discover()' is not implemented for the API '" + self.name + "'.")
        return {}

    def send_api(self, command):
        if not "send_api" in self.devices_available_message:
            self.devices_available_message["send_api"] = True
            self.logging.warning("Method 'send_api()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'send_api' not implemented (" + self.api_name + ")"

    def send(self, device, device_id, command):
        if not "send" in self.devices_available_message:
            self.devices_available_message["send"] = True
            self.logging.warning("Method 'send()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'send' not implemented (" + self.api_name + ")"

    def query(self, device, device_id, command):
        if not "query" in self.devices_available_message:
            self.devices_available_message["query"] = True
            self.logging.warning("Method 'record()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'query' not implemented (" + self.api_name + ")"

    def record(self, device, device_id, command):
        if not "record" in self.devices_available_message:
            self.devices_available_message["record"] = True
            self.logging.warning("Method 'record()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'record' not implemented (" + self.api_name + ")"

    def register(self, command, pin=""):
        if not "register" in self.devices_available_message:
            self.devices_available_message["register"] = True
            self.logging.warning("Method 'register()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'register' not implemented (" + self.api_name + ")"

    def wait_if_working(self):
        """
        Some devices run into problems, if send several requests at the same time
        """
        while self.working:
            self.logging.debug(".")
            time.sleep(0.2)
        return

    def test(self):
        if not "test" in self.devices_available_message:
            self.devices_available_message["test"] = True
            self.logging.warning("Method 'test()' is not implemented for the API '" + self.name + "'.")
        return "ERROR: 'test' not implemented (" + self.api_name + ")"


class RemoteThreadingClass(threading.Thread, RemoteDefaultClass):
    """
    Class for threads in jc://remote/
    """

    def __init__(self, class_id, name):
        """
        Class constructor

        Args:
            class_id (str): class identifier
            name (str): name of class
        """
        threading.Thread.__init__(self)
        RemoteDefaultClass.__init__(self, class_id, name)

        self._running = True
        self._paused = False
        self._processing = False

        self._thread_priority = 3                      # range 0..4 (1..5 via self.threat_set_priority)
        self._thread_waiting_times = [0.5, 1, 2, 4, 6, 8, 16, 32]  # to be used depending on priority

        rm3presets.server_health[class_id] = time.time()

        self.logging.debug("Creating thread " + name + " ...")

    def stop(self):
        """
        Stop if thread (set self._running = False)
        """
        self.logging.info("STOP SIGNAL for "+self.name+" ...")
        self._running = False
        self._processing = False
        rm3presets.server_health[self.class_id] = "stopped"

    def thread_wait(self, use_priority=True, use_wait_time=0):
        """
        wait some time and register health signal

        Args:
            use_priority (bool): use in class defined waiting time for the priority set for the class (True) or a default value of 0.05s instead (False)
            use_wait_time (float): use a specific waiting time in seconds
        """
        start_time = time.time()
        wait = self._thread_waiting_times[self._thread_priority]

        if use_wait_time != 0:
            time.sleep(use_wait_time)
        elif not use_priority:
            time.sleep(0.05)
        else:
            while self._running and start_time + wait > time.time():
                time.sleep(0.1)

        rm3presets.server_health[self.class_id] = time.time()

    def thread_life_signal(self):
        """
        send a life signal from another source than the thread_wait() in a loop for longer lasting processes
        """
        rm3presets.server_health[self.class_id] = time.time()

    def thread_priority(self, priority):
        """
        set thread priority, influence on loop_wait

        Args:
            priority (int): thread priority, highest = 1, lowest = 7
        """
        if 1 <= priority <= len(self._thread_waiting_times):
            self._thread_priority = priority - 1
        elif priority >= len(self._thread_waiting_times):
            self._thread_priority = len(self._thread_waiting_times) - 1
        else:
            self._thread_priority = 3

    def thread_waiting_time(self):
        """
        return current waiting time
        """
        return self._thread_waiting_times[self._thread_priority]

    def thread_is_running(self):
        """
        return True if thread is running
        """
        return self._running