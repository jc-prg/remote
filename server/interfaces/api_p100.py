# -----------------------------------
# API integration for jc://remote/ PyP100
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import logging, time
import modules.rm3json as rm3json
import modules.rm3config as rm3config
import modules.rm3ping as rm3ping
import modules.rm3stage as rm3stage

import interfaces.p100.PyP100 as device

# -------------------------------------------------
# API-class
# -------------------------------------------------

shorten_info_to = rm3config.shorten_info_to


# -------------------------------------------------

class ApiControl:
    """
    Integration of PyP100 API to be use by jc://remote/
    """

    def __init__(self, api_name, device="", device_config={}, log_command=False):
        """
        Initialize API / check connect to device
        """
        self.api_name = api_name
        self.api_description = "API for Tapo-Link P100"
        self.not_connected = "ERROR: Device not connected (" + api_name + "/" + device + ")."
        self.status = "Start"
        self.method = "query"
        self.working = False
        self.count_error = 0
        self.count_success = 0
        self.log_command = log_command
        self.last_action = 0
        self.last_action_cmd = ""

        self.api_config = device_config
        self.api_device = device

        self.logging = logging.getLogger("api.P100")
        self.logging.setLevel = rm3stage.log_set2level
        self.logging.info(
            "_INIT: " + self.api_name + " - " + self.api_description + " (" + self.api_config["IPAddress"] + ")")

        # self.connect()

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
        api_user = self.api_config["TapoUser"]
        api_pwd = self.api_config["TapoPwd"]

        try:
            self.api = device.P100(api_ip, api_user, api_pwd)
            self.api.handshake()
            self.api.login()
        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            return self.status

        try:
            self.api.jc = APIaddOn(self.api, self.logging)
            self.api.jc.status = self.status
            self.api.jc.not_connected = self.not_connected

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.api.jc.status = self.status
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
        return self.get_info("power")

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

            try:
                command = "self.api." + command
                result = eval(command)
                self.logging.debug(str(result))

                if "error" in result:
                    self.working = False
                    return "ERROR " + self.api_name + " - " + result["error"]["message"]

                if not "result" in result:
                    self.working = False
                    return "ERROR " + self.api_name + " - unexpected result format."

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - query**: " + str(e)
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

        if self.status == "Connected":
            if self.log_command:
                self.logging.info("_QUERY: "+device+ "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

            try:
                command = "self.api." + command_param[0]
                result = eval(command)
                self.logging.debug(str(result))

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - query*: " + str(e) + " | " + command + " | " + \
                       str(result) + " | " + str(self.api.jc.info_result)

            try:
                if "error" in result:
                    if "message" in result["error"]:
                        msg = str(result["error"]["message"])
                    else:
                        msg = str(result["error"])
                    self.working = False
                    return "ERROR " + self.api_name + " - " + msg

                elif "result" not in result:
                    self.working = False
                    return "ERROR " + self.api_name + " - unexpected result format."

                elif result == {}:
                    self.working = False
                    return "ERROR " + self.api_name + " - empty answer from device."

                else:
                    if len(command_param) > 1:
                        result_param = eval("result['result']" + command_param[1])
                    else:
                        result_param = str(result['result'])

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - query°: " + str(e) + " | " + command + " | " + str(result)
        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return result_param

    def record(self, device, command):
        """
        Record command, especially build for IR devices
        """

        self.wait_if_working()
        self.working = True

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
        """
        Test device by sending a couple of commands
        """

        self.wait_if_working()
        self.working = True

        if self.status == "Connected":
            try:
                self.api.turn_on()
                time.sleep(1)
                self.api.turn_off()

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - test: " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"


# -------------------------------------------------
# additional functions -> define self.api.jc.*
# -------------------------------------------------

class APIaddOn():
    """
    individual commands for API
    """

    def __init__(self, api, logger):

        self.addon = "jc://addon/p100/"
        self.api = api
        self.volume = 0
        self.status = "Start"
        self.cache_metadata = {}  # cache metadata to reduce api requests
        self.cache_time = time.time()  # init cache time
        self.cache_wait = 2  # time in seconds how much time should be between two api metadata requests
        self.power_status = "OFF"
        self.logging = logger
        self.not_connected = "Connection Error api.P100"
        self.info_answer = {}
        self.info_result = {}
        self.last_request_time = time.time()
        self.last_request_data = {}
        self.cache_wait = 1

        self.logging = logging.getLogger("api.P100")
        self.logging.setLevel = rm3stage.log_set2level

    def turn_on(self):
        """
        turn on and set metadata
        """
        if self.status == "Connected":
            self.power_status = "ON"
            self.api.turnOn()
            return {"result", "ON"}

        else:
            self.power_status = "NOT CONNECTED"
            return self.not_connected

    def turn_off(self):
        """
        turn of and set metadata
        """
        if self.status == "Connected":
            self.power_status = "OFF"
            self.api.turnOff()
            return {"result", "OFF"}

        else:
            self.power_status = "NOT CONNECTED"
            return self.not_connected

    def get_info(self, param="status"):
        """
        return data
        """
        info_result = {}
        if self.status == "Connected":

            self.logging.debug(str(self.last_request_time) + "__" + str(time.time()))

            if self.last_request_time < time.time() - self.cache_wait:
                try:
                    self.info_answer = self.api.getDeviceInfo()
                except Exception as e:
                    self.info_answer = {"error_code": 10, "error": "Exception during API request", "error_msg": str(e)}
                #self.logging.info(".:|"+param+"|:."+str(self.info_answer))
                if "result" in self.info_answer:
                    self.last_request_data = self.info_answer.copy()
                    self.last_request_time = time.time()
                self.logging.debug(str(self.info_answer))
            else:
                self.info_answer = self.last_request_data.copy()

            self.logging.debug(str(self.info_answer))

            if "error_code" in self.info_answer and self.info_answer["error_code"] != 0:
                if "result" in self.info_answer:
                    #self.logging.info("---" + param + "---" + str(self.info_answer))
                    info_result = {"error": "device error (" + str(self.info_answer["result"]) + "|" +
                                        str(self.info_answer["error_code"]) + ")"}
            elif "error_code" in self.info_answer and "result" in self.info_answer:
                #self.logging.info("+++"+param+"+++"+str(self.info_answer))
                info_result = self.info_answer["result"].copy()
            elif self.info_answer == {}:
                #self.logging.info("..." + param + "..." + str(self.info_answer))
                info_result = {"error": "device error (empty response from device {})"}
            else:
                self.logging.info(":::" + param + ":::" + str(self.info_answer))
                info_result = {"error": "device error (unexpected API answer)"}

            if "device_on" in info_result and info_result["device_on"]:
                self.power_status = "ON"
            elif "device_on" in info_result:
                self.power_status = "OFF"

            if "error" not in info_result:
                if param in info_result:
                    info_result = {"result": info_result[param], "param": param}
                elif param == "status":
                    info_result = {"result": str(info_result), "param": param}
                elif param == "power":
                    info_result = {"result": self.power_status, "param": param}
                elif info_result == {} and "error" in self.info_answer:
                    info_result = {"error": "empty results (" + param + "||" + str(self.info_answer["error"]) + ")."}
                elif info_result == {}:
                    info_result = {"error": "empty results (" + param + "||" + str(self.info_answer) + ")."}
                else:
                    info_result = {"error": "unknown tag '" + param + "' ("+str(info_result)+")."}

        else:
            info_result = self.not_connected

        return info_result

    def test(self):

        if self.status == "Connected":

            status = self.api.getDeviceInfo()
            self.logging.info("PyP100: ..... TEST TEST TEST TEST TEST TEST TEST TEST")
            self.logging.info(str(status))

            if self.power_status == "ON":
                self.api.turnOff()
                time.sleep(1)
                self.api.turnOn()

            else:
                self.api.turnOn()
                time.sleep(1)
                self.api.turnOff()

            return {"result", "test"}

        else:
            return self.not_connected

# -------------------------------------------------
# EOF
