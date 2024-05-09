import logging
import time
import modules.rm3presets as rm3config
import modules.rm3ping as rm3ping
from modules.rm3classes import RemoteApiClass
import interfaces.sonyapi.sony as sony


shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("SONY")


# -------------------------------------------------
# API-class
# -------------------------------------------------

class ApiControl(RemoteApiClass):
    """
    Integration of sample API to be use by jc://remote/
    """
    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """
        API Class constructor
        """
        self.api_description = "API for SONY Devices (SonyAPILib)"
        RemoteApiClass.__init__(self, "api.SONY", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

        if rm3config.log_api_ext == "NO":
            log = logging.getLogger("sonyapilib.device")
            log.setLevel(logging.CRITICAL)

    def connect(self):
        """
        Connect / check connection
        """
        connect = rm3ping.ping(self.api_config["IPAddress"])
        if not connect:
            self.status = self.not_connected + " ... PING"
            self.logging.warning(self.status)
            return self.status

        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

        api_ip = self.api_config["IPAddress"]
        api_name = self.api_device
        api_config = rm3config.data_dir + "/" + rm3config.devices + self.api_name + "/" + self.api_device + ".json"

        try:
            self.api = sony.sonyDevice(api_ip, api_name, api_config)

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            return self.status

        return self.status

    def wait_if_working(self):
        """
        Some devices run into problems, if send several requests at the same time
        """
        while self.working:
            self.logging.debug(".")
            time.sleep(0.2)
        return

    def power_status(self):
        """
        request power status
        """
        return self.query("power")

    def send(self, device, device_id, command):
        """
        Send command to API
        """
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "SEND: " + device + "/" + command

        if self.status == "Connected":
            if self.log_command: self.logging.info(
                "_SEND: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

            try:
                result = self.api.send(command)
            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - send: " + str(e)
        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"

    def query(self, device, device_id, command):
        """
        Send command to API and wait for answer
        """
        param = ""
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command

        if self.status == "Connected":
            if self.log_command:
                self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] + " ... ("+self.api_name+")")

            if "=" in command:
                params = command.split("=")
                command = params[0]
                param = params[1]

            try:
                result = self.api.get_status(command, param)

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - query: " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        if command == "power":
            if result is True:
                result = "ON"
            elif result is False:
                result = "OFF"
            elif "Device is off" in result:
                result = "OFF"

        self.working = False
        return result

    def register(self, command, pin=""):
        """
        Register command if device requires registration to initialize authentication
        -> creates config file, to be stored
        """
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "REGISTER: " + device + "/" + command

        if self.status == "Connected":
            if command == "start":
                result = self.api.register_start()
            elif command == "finish":
                result = self.api.register_finish(pin)
            else:
                result = "ERROR " + self.api_name + ": Register command not available (" + command + ")"
            self.working = False
            return result

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

    def test(self):
        """
        Test device by sending a couple of commands
        """
        self.wait_if_working()
        self.working = True

        if self.status == "Connected":
            try:
                self.api.send("PowerOn")
                time.sleep(5)
                self.api.send("Eject")
                time.sleep(5)
                self.api.send("PowerOff")
            except Exception as e:
                self.working = True
                return "ERROR " + self.api_name + " - test: " + str(e)
        else:
            self.working = True
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"

