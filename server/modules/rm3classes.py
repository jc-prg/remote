import logging
import time
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

        rm3config.server_health[class_id] = "registered"
        self.logging = rm3config.set_logging(self.class_id, self.log_level)
        self.logging.debug("Creating class " + name + " (Log Level: " + self.log_level_name + ") ...")


class RemoteApiClass(RemoteDefaultClass):
    """
    Class for APIs in jc://remote
    """

    def __init__(self, class_id, api_name, method, description, device="", device_config=None, log_command=False):
        """
        Class constructor
        """
        RemoteDefaultClass.__init__(self, class_id, description)

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
            "Methods": ["send", "query", "record"],
            "MultiDevice": False,
            "Port": "",
            "PowerDevice": "",
            "Timeout": 5,
            "USBConnect": ""
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

    def config_add_key(self, key, default_value=None):
        """
        add a key to the default configuration
        """
        self.api_config_default[key] = default_value

    def config_set_methods(self, methods):
        """
        change default methods for API, options: "send", "query", "record"
        """
        self.api_config_default["Methods"] = methods


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

        rm3config.server_health[class_id] = time.time()

        self.logging.debug("Creating thread " + name + " ...")

    def stop(self):
        """
        Stop if thread (set self._running = False)
        """
        self.logging.debug("GOT STOPPING SIGNAL ...")
        self._running = False
        self._processing = False
        rm3config.server_health[self.class_id] = "stopped"

    def thread_wait(self):
        """
        wait some time and register health signal
        """
        start_time = time.time()
        wait = self._thread_waiting_times[self._thread_priority]
        while self._running and start_time + wait > time.time():
            time.sleep(0.1)

        rm3config.server_health[self.class_id] = time.time()

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
