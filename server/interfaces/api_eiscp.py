import logging, time
import modules.rm3json as rm3json
import modules.rm3config as rm3config
import modules.rm3ping as rm3ping
import modules.rm3stage as rm3stage

import interfaces.eiscp as eiscp

# -------------------------------------------------
# API-class
# -------------------------------------------------

shorten_info_to = rm3config.shorten_info_to


class ApiControl:
    """
    Integration of sample API to be use by jc://remote/
    """

    def __init__(self, api_name, device="", device_config={}, log_command=False):
        """
        Initialize API / check connect to device
        """

        self.api_name = api_name
        self.api_description = "API for ONKYO Devices"
        self.not_connected = "ERROR: Device not connected (" + api_name + "/" + device + ")."
        self.status = "Start"
        self.method = "query"
        self.working = False
        self.count_error = 0
        self.count_success = 0
        self.log_command = log_command
        self.last_action = 0
        self.last_action_cmd = ""

        self.api_config_default = {
            "Description": "",
            "IPAddress": "",
            "Methods": ["send", "query"],
            "Timeout": 0
        }
        self.api_device = device
        self.api_timeout = 5
        self.api_config = device_config
        self.api_ip = self.api_config["IPAddress"]

        self.logging = logging.getLogger("api.ONKYO")
        self.logging.setLevel = rm3stage.log_set2level
        self.logging.info(
            "_INIT: " + self.api_name + " - " + self.api_description + " (" + self.api_config["IPAddress"] + ")")

        # self.connect()

    def reconnect(self):
        self.api.command_socket = None
        self.connect()

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

        try:
            self.api = eiscp.eISCP(self.api_ip)
            # self.api    = eiscp.Receiver(self.api_ip)
            # self.api.on_message = callback_method

        except Exception as e:
            self.status = "Error connecting to ONKYO device: " + str(e)
            self.api.command("system-power query")  # send a command to check if connected
            self.logging.warning(self.status)

        try:
            self.api.jc = APIaddOn(self.api)
            self.api.jc.status = self.status
            self.api.jc.not_connected = self.not_connected

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.api.jc.status = self.status
            self.logging.warning(self.status)

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
        status = self.query("system-power=query", "")
        if "on" in str(status).lower():
            return "ON"
        if "off" in str(status).lower():
            return "OFF"

    def send(self, device, command):
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

            button_code = command.replace("=", " ")
            try:
                self.api.command(button_code)
                self.api.disconnect()
            except Exception as e:
                self.api.disconnect()
                self.working = False
                return "ERROR " + self.api_name + " - send (" + button_code + "): " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"

    def query(self, device, command):
        """
        Send command to API and wait for answer
        """
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command
        result = {}

        if "||" in command:
            command_param = command.split("||")
        else:
            command_param = [command]

        self.logging.debug(command)

        if self.status == "Connected":
            if self.log_command: self.logging.info(
                "_QUERY: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

            if "jc." in command:

                try:
                    command = "self.api." + command
                    result = eval(command)
                    self.logging.debug(str(result))

                    if "error" in result:
                        self.working = False
                        return "ERROR " + self.api_name + " - " + result["error"]

                except Exception as e:
                    self.working = False
                    return "ERROR " + self.api_name + " - query: " + str(e)

            else:
                button_code = command_param[0]  # format: zone.parameter=command
                self.logging.debug("Button-Code: " + button_code[:shorten_info_to] + "... (" + self.api_name + ")")
                try:
                    result = self.api.command(button_code)
                    self.api.disconnect()
                except Exception as e:
                    self.api.disconnect()
                    self.working = False
                    return "ERROR " + self.api_name + " - query (" + button_code + "): " + str(e)

                if "ERROR" in result:
                    self.working = False
                    return result

            result = result[1]
            self.logging.debug(str(result))

            # if || try to extract data from the result
            if "||" in command:
                if "+'" in command_param[1]:
                    new_cmd = "str(result)" + command_param[1]
                else:
                    new_cmd = "result" + command_param[1]

                try:
                    result2 = eval(new_cmd)
                    result = result2
                    self.logging.debug(new_cmd + ": " + str(result))
                except Exception as e:
                    self.logging.warning("Not able to extract data: " + new_cmd + " / " + str(e))

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return result

    def record(self, device, command):
        """
        Record command, especially build for IR devices
        """
        return "ERROR " + self.api_name + ": Not supported by this API"

    def register(self, command, pin=""):
        """
        Register command if device requires registration to initialize authentication
        """
        return "ERROR " + self.api_name + ": Not supported by this API"

    def test(self):
        """
        Test device by sending a couple of commands
        """
        self.wait_if_working()
        self.working = True

        try:
            self.api.command('power on')
            self.api.command('source pc')
            self.api.disconnect()
        except Exception as e:
            return "ERROR " + self.api_name + " test: " + str(e)

        self.working = False
        return "OK"


# -------------------------------------------------
# additional functions -> define self.api.jc.*
# -------------------------------------------------

class APIaddOn():
    """
    additional functions that combine values
    """
    def __init__(self, api):

        self.addon = "jc://addon/onkyo/"
        self.api = api
        self.volume = 0
        self.cache_metadata = {}  # cache metadata to reduce api requests
        self.cache_time = time.time()  # init cache time
        self.cache_wait = 2  # time in seconds how much time should be between two api metadata requests

        self.logging = logging.getLogger("api.ONKYO")
        self.logging.setLevel = rm3stage.log_set2level

    def metadata(self, tags=""):
        """
        Return metadata ... combined values
        """

        # ERROR ... zwischen Titelwechseln (?) aktuell nur "R" als Wert zurück gegeben ... ?!
        # "no media" noch nicht implementiert

        input_device = self.api.command("input-selector=query")[1]

        if tags == "net-info" and "net" in input_device:
            try:
                artist = self.api.command("dock.net-usb-artist-name-info=query")[1]
                title = self.api.command("dock.net-usb-title-name=query")[1]
                album = self.api.command("dock.net-usb-album-name-info=query")[1]

                if len(title) < 2:
                    md = "no media"
                else:
                    md = artist + ": " + title + " (Album: " + album + ")"

                self.api.disconnect()
                self.logging.info(md)

            except Exception as e:
                self.api.disconnect()

                error = "ERROR " + self.addon + " - metadata (" + tags + "): " + str(e)
                self.logging.warning(error)
                return error

        elif tags == "net-info":
            md = "no media"

        else:
            md = "not implemented"
            return ["error", md]

        return [tags, md]

