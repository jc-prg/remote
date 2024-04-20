import time
import modules.rm3json as rm3json
import modules.rm3config as rm3config
from modules.rm3classes import RemoteDefaultClass, RemoteApiClass

# import sampleAPI as sample

# -------------------------------------------------
# API-class
# -------------------------------------------------

shorten_info_to = rm3config.shorten_info_to


class ApiControl(RemoteApiClass):
    """
    Integration of sample API to be used by jc://remote/
    """

    def __init__(self, api_name, device="", device_config={}, log_command=False):
        """Initialize API / check connect to device"""
        self.api_description = "Sample API Description"
        RemoteApiClass.__init__(self, "api.SAMPLE", api_name, "query",
                                self.api_description, device, device_config, log_command)

    def connect(self):
        """Connect / check connection"""

        # commands to connect and to check, if connection works - if not, return error message

        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

        # ---- change for your api ----
        #       try:
        #           result  = self.api.command(xxx)
        #       except Exception as e:
        #           self.status = "ERROR "+self.api_name+" - send: " + str(e)
        #           return self.status

        return self.status

    def wait_if_working(self):
        """Some devices run into problems, if send several requests at the same time"""
        while self.working:
            self.logging.debug(".")
            time.sleep(0.2)
        return

    def send(self, device, command):
        """Send command to API"""

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "SEND: " + device + "/" + command

        if self.log_command:
            self.logging.info("_SEND: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = True
        #           return "ERROR "+self.api_name+" - send: " + str(e)
        #       else:
        #         self.working = True
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"

    def query(self, device, command):
        """Send command to API and wait for answer"""

        result = ""
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command

        if self.log_command:
            self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = True
        #           return "ERROR "+self.api_name+" - query: " + str(e)
        #       else:
        #         self.working = True
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return result

    def record(self, device, command):
        """Record command, especially build for IR devices"""

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "RECORD: " + device + "/" + command

        if self.log_command:
            self.logging.info("__RECORD " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = True
        #           return "ERROR "+self.api_name+" - record: " + str(e)
        #       else:
        #         self.working = True
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"

    def test(self):
        """Test device by sending a couple of commands"""

        self.wait_if_working()
        self.working = True

        if self.log_command:
            self.logging.info("_TEST: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = True
        #           return "ERROR "+self.api_name+" - test: " + str(e)
        #       else:
        #         self.working = True
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"

