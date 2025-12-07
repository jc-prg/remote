import time
import codecs
import netaddr
import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
import server.modules.rm3ping as rm3ping
from server.modules.rm3classes import RemoteDefaultClass, RemoteApiClass
import broadlink


shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("BROADLINK")

# commands to check on startup if IR devices runs (e.g. screen down and up)
check_on_startup = False
check_on_startup_commands = [
    "2600c60028112810281028100e2a0e290e2a0e2a0e2928100e2a0e2a0e2927110e2a27112711271127110d2a2711281028100e2a271127110e290f2927110e2a0e29270003d028102810281028100e2a0e290f290e2a0e2928110d2a0e2a0e2927110e2a27112711271127110e292810281028100e2a271127110e2a0d2a27110e2a0e29280003d027112711271127110d2a0e2a0e290e2a0e2a27110d2a0e2a0e2928100e2a27112711271127110e2a2711271127110d2a271128100e2a0e2928100e2a0e2928000d050000",
    "2600c60028112711271126120d2b0d2a0d2b0d2b0d2a0d2b26120d2a0d2b26120d2b2612261226120d2a2711271127110d2b261226120d2a27110d2b26120d2b0d2a260003d127112711271127110d2b0d2b0d2a0d2b0d2a0d2b26120d2b0d2a27110d2b2612261226120d2a2711271127110d2b261226120d2b26120d2a26120d2b0d2a270003d126122612261127110d2b0d2b0d2a0d2b0d2b0d2a26120d2b0d2a27110d2b2612261226120d2b2612261226110d2b261226120d2b26120d2a27110d2b0d2a28000d050000"
]


class ApiControl(RemoteApiClass):
    """
    Integration of BROADLINK API to be used by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """
        Initialize API / check connect to device
        """
        self.api_description = "API for Broadlink RM Controller"
        RemoteApiClass.__init__(self, "api.RM3", api_name, "record",
                                self.api_description, device, device_config, log_command, config)

        self.config_add_key("MACAddress", "")
        self.config_add_key("DeviceType", "")
        self.config_set_methods(["send", "record"])
        self.api_discovery = {}

        self.api_info_url = "https://github.com/jc-prg/remote/blob/master/server/interfaces/broadlink/README.md"
        self.api_source_url = "https://github.com/davorf/BlackBeanControl"

    def connect(self):
        """
        Connect / check connection
        """
        self.logging.debug("(Re)connect " + self.api_name + " (" + self.api_config["IPAddress"] + ") ... ")
        self.last_action = time.time()

        connect = rm3ping.ping(self.api_config["IPAddress"])
        if not connect:
            self.status = self.not_connected + " ... PING " + self.api_config["IPAddress"]
            self.logging.warning(self.status)
            return self.status

        """
        STATUS: it works, a few things are still open
        TODO:
        - check how to include 2 or more RM devices (compare with TAPO) - and include into description
            - 2 configs works, if RM3mini is disabled in the _ACTIVE-APIS.json; how to enable both?
        """

        self.count_error = 0
        self.count_success = 0

        try:
            self.logging.debug("Configuration: " + str(self.api_config))

            mac_address = str(self.api_config["MACAddress"]).replace(":","")
            self.api = broadlink.gendevice(
                        dev_type=int(self.api_config["DeviceType"]),
                        host=(self.api_config["IPAddress"], int(self.api_config["Port"])),
                        mac=bytearray.fromhex(mac_address)
                        )
            self.api.auth()
            self.status = "Connected"

            self.discover()

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.logging.error(self.status)

        if check_on_startup:
            try:
                for command in check_on_startup_commands:
                    self.send("broadlink_test", command)
                    time.sleep(0.5)
            except Exception as e:
                self.status = "ERROR IR Device: " + str(e)
                self.logging.error(self.status)

        if self.status == "Connected":
            self.logging.info("Connected BROADLINK (" + self.api_config["IPAddress"] + ")")

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
        msg = "N/A"
        self.logging.debug("power_status:" + msg)
        return msg

    def send(self, device, device_id, command):
        """Send command to API"""

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "SEND: " + device + "/" + command[:25] + "..."

        if self.status == "Connected":
            if self.log_command:
                self.logging.info("_SEND: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

            try:
                DecodedCommand = codecs.decode(command, 'hex')  # python3
            except Exception as e:
                return "ERROR " + self.api_name + " - decode: " + str(e) + " / " + str(command)
            try:
                self.api.send_data(DecodedCommand)
            except Exception as e:
                return "ERROR " + self.api_name + " - send: " + str(e)

        else:
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"

    def query(self, device, device_id, command):
        """
        Send command to API and wait for answer
        """
        msg = "N/A"
        available_queries = ["api-discovery"]
        if command in available_queries:
            if command == "api-discovery":
                msg = self.api_discovery
        else:
            msg = "WARN " + command + " for is not available for API " + self.api_name

        self.logging.debug(msg)
        return msg

    def record(self, device, device_id, command):
        """
        Record command, especially build for IR devices
        """
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "RECORD: " + device + "/" + command

        if self.status == "Connected":
            self.logging.info("__RECORD " + device + "/" + command[:shorten_info_to] +
                              " ... (" + self.api_name + ")")

            code = device + "_" + command
            try:
                self.api.enter_learning()
                time.sleep(5)
                LearnedCommand = self.api.check_data()
                if LearnedCommand is None:
                    self.working = False
                    return 'ERROR: Learn Button (' + code + '): No IR command received'
                EncodedCommand = codecs.encode(LearnedCommand, 'hex')  # python3
            except Exception as e:
                self.working = False
                message = "ERROR " + self.api_name + ": Could not learn command (" + str(e) + ")"
                if "The device storage is full" in message:
                    message += " ... Check whether the remote control actually sent a signal and is pointing close enough to the " + self.api_name + " device."
                return message

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return EncodedCommand

    def discover(self):
        """
        check if broadlink devices are available in the network
        """
        devices = broadlink.discover(timeout=3)
        device_information = {}
        count = 0
        for device in devices:
            count += 1
            dev_name = self.api_name + "_" + str(count)
            device_information[dev_name] = {
                "Description": device.model + " (" + device.manufacturer + ")",
                "DeviceType": "10039",
                "IPAddress": device.host[0],
                "MACAddress": str(':'.join(format(x, '02x') for x in device.mac)).upper(),
                "Methods": [ "send", "record" ],
                "MultiDevice": True,
                "Port": device.host[1],
                "PowerDevice": "",
                "Timeout": device.timeout,
                "Status": {
                    "Locked": device.is_locked,
                    "Auth": device.auth()
                }
            }
        api_config = {
            "API-Description": self.api_description,
            "API-Devices": device_information,
            "API-Info": self.api_info_url,
            "API-Source": self.api_source_url
        }

        self.api_discovery = api_config
        self.logging.info("__DISCOVER: " + self.api_name + " - " + str(self.api_discovery))
        return api_config.copy()

    def register(self, command, pin=""):
        """
        Register command if device requires registration to initialize authentication
        """
        msg = "ERROR " + self.api_name + ": Not supported by this API"
        self.logging.debug(msg)
        return msg

    def test(self):
        """Test device by sending a couple of commands"""
        msg = "WARN " + self.api_name + ": Not implemented for this API"
        self.logging.debug(msg)
        return msg

