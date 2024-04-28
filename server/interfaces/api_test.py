# -----------------------------------
# Sample API integration for jc://remote/
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import logging
import time
import modules.rm3json as rm3json
import modules.rm3config as rm3config
from modules.rm3classes import RemoteApiClass

# import sampleAPI as sample

shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("TEST")


# -------------------------------------------------
# API-class
# -------------------------------------------------

class ApiControl(RemoteApiClass):
    """
     Integration of sample API to be use by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """
        Initialize API / check connect to device
        """
        self.api_description = "Test API for automatic testing"
        RemoteApiClass.__init__(self, "api.TEST", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

    def connect(self):
        """
        Connect / check connection
        """
        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

    def wait_if_working(self):
        """
        Some devices run into problems, if send several requests at the same time
        """
        while working:
            logging.debug(".")
            time.sleep(0.2)
        return

    def power_status(self):
        """
        request power status
        """
        return "N/A"

    def send(self, device, command):
        """
        Send command to API
        """
        if self.log_command: self.logging.info(
            "__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "OK: send test-" + device + "-" + command

    def query(self, device, command):
        """
        Send command to API and wait for answer
        """
        if self.log_command: self.logging.info(
            "__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "WARN: Not supported by this API"

    def record(self, device, command):
        """
        Record command, especially build for IR devices
        """
        if self.log_command: self.logging.info(
            "__RECORD " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")
        return "OK: record test-" + device + "-" + command

    def test(self):
        """
        Test device by sending a couple of commands
        """
        self.logging.info("_TEST:" + self.api_name + "/" + self.api_description + " (no further action)")
        return "OK: test commands"

