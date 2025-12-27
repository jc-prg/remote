import time
import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
import server.modules.rm3ping as rm3ping
from server.modules.rm3classes import RemoteDefaultClass, RemoteApiClass
import server.interfaces.eiscp as eiscp


shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("EISCP-ONKYO")


class ApiControl(RemoteApiClass):
    """
    Integration of sample API to be use by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """
        Initialize API / check connect to device
        """
        self.api_description = "API for ONKYO Devices"
        RemoteApiClass.__init__(self, "api-ONKYO", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

        self.api_timeout = 5
        self.api_discovery = {}
        self.api_ip = self.api_config["IPAddress"]
        self.api_info_url = "https://github.com/jc-prg/remote/blob/master/server/interfaces/eiscp/README.md"
        self.api_source_url = "https://github.com/miracle2k/onkyo-eiscp"

    def reconnect(self):
        self.api.command_socket = None
        self.connect()

    def connect(self):
        """
        Connect / check connection
        """
        self.logging.debug("(Re)connect " + self.api_name + " (" + self.api_config["IPAddress"] + ") ... ")

        connect = rm3ping.ping(self.api_config["IPAddress"])
        if not connect:
            self.status = self.not_connected + " ... PING " + self.api_config["IPAddress"]
            self.logging.warning(self.status)
            return self.status

        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

        try:
            self.api = eiscp.eISCP(self.api_ip)
            self.api.command("system-power query")  # send a command to check if connected
            # self.api    = eiscp.Receiver(self.api_ip)
            # self.api.on_message = callback_method
            #self.discover()

        except Exception as e:
            self.status = "Error connecting to ONKYO device: " + str(e)
            self.logging.warning(self.status)

        try:
            self.api.jc = APIaddOn(self.api)
            self.api.jc.status = self.status
            self.api.jc.not_connected = self.not_connected

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.api.jc.status = self.status
            self.logging.warning(self.status)

        if self.status == "Connected":
            self.logging.info(f"Connected {self.api_config["IPAddress"]} - {self.api_name}:{self.api_device}")
        else:
            self.logging.warning(f"Could not connect {self.api_config["IPAddress"]} - {self.api_name}:{self.api_device}")

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
        status = self.query("system-power=query", "")
        if "on" in str(status).lower():
            return "ON"
        if "off" in str(status).lower():
            return "OFF"

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

            button_code = command.replace("=", " ")
            try:
                self.api.command(button_code)
                #self.api.disconnect()
            except Exception as e:
                #self.api.disconnect()
                self.working = False
                return "ERROR " + self.api_name + " - send (" + button_code + "): " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"

    def query(self, device, device_id, command):
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

        if self.status == "Connected" or command == "api-discovery":
            if self.log_command:
                self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] +
                                  " ... (" + self.api_name + ")")

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

            elif command == "api-discovery":
                self.working = False
                return self.api_discovery

            else:
                button_code = command_param[0]  # format: zone.parameter=command
                self.logging.debug("Button-Code: " + button_code[:shorten_info_to] + "... (" + self.api_name + ")")
                try:
                    result = self.api.command(button_code)
                    #self.api.disconnect()
                except Exception as e:
                    #self.api.disconnect()
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

    def record(self, device, device_id, command):
        """
        Record command, especially build for IR devices
        """
        return "ERROR " + self.api_name + ": Not supported by this API"

    def discover(self):
        """
        discover available EISCP-ONKYO devices in the network
        """
        try:
            devices = eiscp.eISCP.discover(timeout=3)
            self.logging.debug(f"Discovery for EISCP-ONKYO done: Found {len(devices)} devices.")
        except Exception as e:
            devices = {}
            self.logging.warning(f"Discovery for EISCP-ONKYO failed: {e}")

        device_information = {}
        count = 0
        for device in devices:
            count += 1
            dev_name = self.api_name + "_" + str(count)
            device_information[dev_name] = {
                "Description": device.info["model_name"],
                "DeviceType": device.info["device_category"],
                "IPAddress": device.host,
                "MACAddress": "N/A",
                "Methods": [ "send", "query" ],
                "MultiDevice": False,
                "PowerDevice": "",
                "Port": device.port,
                "Timeout": 5,
                "Status": {}
            }
        api_config = {
            "API-Description": self.api_description,
            "API-Devices": device_information,
            "API-Info": self.api_info_url,
            "API-Source": self.api_source_url
        }

        self.api_discovery = api_config
        self.logging.info("__DISCOVER: " + self.api_name + " - " + str(len(self.api_discovery["API-Devices"])) + " devices")
        self.logging.debug("            " + self.api_name + " - " + str(self.api_discovery))
        return api_config

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
            #self.api.disconnect()
        except Exception as e:
            return "ERROR " + self.api_name + " test: " + str(e)

        self.working = False
        return "OK"


class APIaddOn(RemoteDefaultClass):
    """
    additional functions that combine values
    """
    def __init__(self, api):
        self.api_description = "API-Addon for ONKYO Devices"
        RemoteDefaultClass.__init__(self, "api-ONKYO", self.api_description)

        self.status = None
        self.not_connected = None
        self.addon = "jc://addon/onkyo/"
        self.api = api
        self.volume = 0
        self.cache_metadata = {}  # cache metadata to reduce api requests
        self.cache_time = time.time()  # init cache time
        self.cache_wait = 2  # time in seconds how much time should be between two api metadata requests

        self.available_commands = {
            "jc.get_available_commands()": {
                "info": "get a list of all available commands"
            },
            "jc.get_metadata(parameter)": {
                "description": "get consolidated metadata from device",
                "parameter": ["net-info"]
            }
        }

    def get_available_commands(self):
        """returns a list of all commands defined for this API"""
        return ["result", self.available_commands]

    def get_metadata(self, parameter):
        """
        get consolidated metadata from devices
        """
        if self.status == "Connected":
            return self.metadata(parameter)
        else:
            return ["error", "API " + self.api.api_name + " not connected."]

    def metadata(self, tags=""):
        """
        Return metadata ... combined values
        """

        # ERROR ... zwischen Titelwechseln (?) aktuell nur "R" als Wert zurück gegeben ... ?!
        # "no media" noch nicht implementiert

        input_device = self.api.command("input-selector=query")[1]

        if tags in ["net-info","current-playing"] and ("net" in input_device or "blu" in input_device):
            try:
                artist = self.api.command("dock.net-usb-artist-name-info=query")[1]
                title = self.api.command("dock.net-usb-title-name=query")[1]
                album = self.api.command("dock.net-usb-album-name-info=query")[1]

                if len(title) < 2:
                    md = "no media"
                else:
                    md = artist + ": " + title + " (Album: " + album + ")"

                #self.api.disconnect()
                #self.logging.info(md)

            except Exception as e:
                #self.api.disconnect()

                error = "ERROR " + self.addon + " - metadata (" + tags + "): " + str(e)
                self.logging.warning(error)
                return error

        elif tags == "net-info":
            md = "no media"

        else:
            md = "not implemented"
            return ["error", md]

        return [tags, md]

