# -----------------------------------
# Sample API integration for jc://remote/
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import logging
import time
import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
from server.modules.rm3classes import RemoteApiClass

# import sampleAPI as sample

shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("TEST")


# -------------------------------------------------
# API-class
# -------------------------------------------------

class ApiControl(RemoteApiClass):
    """
     Integration of sample API to be used by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """
        Initialize API / check connect to device
        """
        self.api_description = "Test API for automatic testing"
        RemoteApiClass.__init__(self, "api.TEST", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

        self.default_config = {
            "API-Description": "Test API",
            "API-Devices": {
                "default": self.api_config_default
            },
            "API-Info": "N/A",
            "API-Source": "N/A"
        }
        self.default_config["API-Devices"]["default"]["Description"] = "Test device"
        self.default_config["API-Devices"]["default"]["IPAddress"] = "127.0.0.1"

    def connect(self):
        """
        Connect / check connection
        """
        self.logging.debug("(Re)connect " + self.api_name + " (" + self.api_config["IPAddress"] + ") ... ")

        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

        self.logging.info("Connected TEST API.")

    def wait_if_working(self):
        """
        Some devices run into problems, if send several requests at the same time
        """
        while self.working:
            logging.debug(".")
            time.sleep(0.2)
        return

    def power_status(self):
        """
        request power status
        """
        return "N/A"

    def send(self, device, device_id, command):
        """
        Send command to API
        """
        if self.log_command: self.logging.info(
            "__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "OK: send test-" + device + "-" + command

    def query(self, device, device_id, command):
        """
        Send command to API and wait for answer
        """
        if self.log_command: self.logging.info(
            "__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "WARN: Not supported by this API"

    def record(self, device, device_id, command):
        """
        Record command, especially build for IR devices
        """
        if self.log_command: self.logging.info(
            "__RECORD " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "OK: record test-" + device + "-" + command

    def discover(self):
        """
        return discover command for test API
        """
        self.logging.info("__DISCOVER: " + self.api_name + " - " + str(self.default_config))
        return self.default_config

    def test(self):
        """
        Test device by sending a couple of commands
        """
        self.logging.info("_TEST:" + self.api_name + "/" + self.api_description + " (no further action)")
        return "OK: test commands"

