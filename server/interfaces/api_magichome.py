# -----------------------------------
# API integration for jc://remote/ MAGIC HOME
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import logging
import time
import modules.rm3json as rm3json
import modules.rm3config as rm3config
import modules.rm3ping as rm3ping

import interfaces.magichome.magichome as device

# ######## to be solved:
#  Error during requesting data: [Errno 9] Bad file descriptor
#  -> def get_info()
#  And other Error
#  ERROR MAGIC-HOME - query*: list index out of range | self.api.jc.get_info('power')


shorten_info_to = rm3config.shorten_info_to


class ApiControl:
    """
    Integration of Magic Home API to be use by jc://remote/
    """

    def __init__(self, api_name, device="", device_config={}, log_command=False):
        """
        Initialize API / check connect to device
        """
        self.api_name = api_name
        self.api_description = "API for LED via Magic Home"
        self.not_connected = "ERROR: Device not connected (" + api_name + "/" + device + ")."
        self.status = "Start"
        self.method = "query"
        self.working = False
        self.count_error = 0
        self.count_success = 0
        self.log_command = log_command
        self.last_action = 0
        self.last_action_cmd = ""

        self.power_status = "STARTING"
        self.brightness = 1

        self.api_config_default = {
            "Description": "",
            "DeviceType": 1,
            "IPAddress": "",
            "Methods": ["send", "query"],
            "Timeout": 0
        }
        self.api_config = device_config
        self.api_device = device

        self.logging = logging.getLogger("api.MAGIC")
        self.logging.setLevel = rm3config.log_set2level
        self.logging.info(
            "_INIT: " + self.api_name + " - " + self.api_description + " (" + self.api_config["IPAddress"] + ")")

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
        api_device_type = self.api_config["DeviceType"]
        api_timeout = self.api_config["Timeout"]

        try:
            self.api = device.MagicHomeApi(api_ip, api_device_type, False, api_timeout)

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            return self.status

        #       if self.api.connected == False:
        #          self.status = self.not_connected + " ... API-CONNECT " + self.api.connection_status

        try:
            self.api.jc = APIaddOn(self.api, self.logging)
            self.api.jc.status = self.status
            self.api.jc.not_connected = self.not_connected

        except Exception as e:
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.api.jc.status = self.status
            return self.status

        return self.status

    def reconnect(self):
        """
        close socket & reconnect
        """
        if self.api.s:
            self.api.s.close()
        self.connect()

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
        return self.jc.get_info("power")

    def send(self, device, command):
        """
        Send command to API
        """
        result = {}
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

        if "||" in command:
            command_param = command.split("||")
        else:
            command_param = [command]

        if self.status == "Connected":
            if self.log_command:
                self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] +
                                  " ... (" + self.api_name + ")")

            try:
                command = "self.api." + command_param[0]
                result = eval(command)
                self.logging.debug(str(result))

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - query*: " + str(e) + " | " + command

            if "error" in result:
                if "Errno 9" in result["error"]: self.reconnect()
                if "message" in result["error"]:
                    msg = str(result["error"]["message"])
                else:
                    msg = str(result["error"])

                self.working = False
                return "ERROR " + self.api_name + " - " + msg

            elif not "result" in result:
                self.working = False
                return "ERROR " + self.api_name + " - unexpected result format."

            else:
                if len(command_param) > 1:
                    result_param = eval("result['result']" + command_param[1])
                else:
                    result_param = str(result['result'])

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return result_param

    def record(self, device, command):
        '''Record command, especially build for IR devices'''

        return "ERROR: record not available"

    def test(self):
        '''Test device by sending a couple of commands'''

        self.wait_if_working()
        self.working = True

        if self.status == "Connected":
            try:
                self.api.turn_on
                time.sleep(0.3)
                self.api.update_device(255, 0, 0, 0, 0)
                time.sleep(0.3)
                self.api.update_device(0, 255, 0, 0, 0)
                time.sleep(0.3)
                self.api.update_device(0, 0, 255, 0, 0)
                time.sleep(0.3)
                self.api.update_device(0, 0, 0, 0, 0)
                # self.device.send_preset_function(37, 100)
                self.api.turn_off

            except Exception as e:
                self.working = False
                return "ERROR " + self.api_name + " - test: " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return "OK"


class APIaddOn():
    '''
   did not found a way to increase or decrease volume directly
   '''

    def __init__(self, api, logger):

        self.addon = "jc://addon/magic-home/"
        self.api = api
        self.volume = 0
        self.cache_metadata = {}  # cache metadata to reduce api requests
        self.cache_time = time.time()  # init cache time
        self.cache_wait = 5  # time in seconds how much time should be between two api metadata requests
        self.brightness = 1
        self.last_r = 0
        self.last_g = 0
        self.last_b = 0
        self.last_speed = 100
        self.last_preset = 37
        self.power_status = "OFF"
        self.mode = "COLOR"
        self.logging = logger

        self.last_request_time = time.time()
        self.last_request_data = {}

    def turn_on(self):
        '''
     turn on and set metadata
     if self.status == "Connected":
     '''
        if self.status == "Connected":
            self.power_status = "ON"

            try:
                self.api.turn_on()
                self.power_status = "ON"
                return {"result", "turn_on"}

            except Exception as e:
                self.logging.error("Error during turn on: " + str(e))
                self.power_status = "ERROR"
                return {"error", e}

        else:
            self.power_status = "NOT CONNECTED"
            return self.not_connected

    def turn_off(self):
        '''
     turn of and set metadata
     '''
        if self.status == "Connected":
            self.power_status = "OFF"

            try:
                self.api.turn_off()
                self.power_status = "OFF"
                return {"result", "turn_off"}

            except Exception as e:
                self.logging.error("Error during turn off: " + str(e))
                self.power_status = "ERROR"
                return {"error", e}

        else:
            self.power_status = "NOT CONNECTED"
            return self.not_connected

    def set_color(self, r, g=0, b=0):
        '''
     set color including brightness
     '''

        if g == 0 and b == 0 and ":" in str(r):
            data = r.split(":")
            r = int(data[0])
            g = int(data[1])
            b = int(data[2])

        if self.status == "Connected":
            self.mode = "COLOR"
            self.last_r = r
            self.last_g = g
            self.last_b = b

            r = int(r * self.brightness)
            g = int(g * self.brightness)
            b = int(b * self.brightness)

            try:
                self.logging.error("SETTING color...")
                self.api.update_device(r, g, b, 0, 0)
                if r + g + b == 0:
                    self.power_status = "OFF"
                else:
                    self.power_status = "ON"
                return {"result", "set_color"}

            except Exception as e:
                self.logging.error("Error during setting color: " + str(e))
                self.power_status = "ERROR"
                return {"error", e}



        else:
            return self.not_connected

    def set_preset(self, preset):
        '''
     set led program
     '''
        if self.status == "Connected":
            self.mode = "PRESET"
            self.last_preset = preset

            try:
                self.api.send_preset_function(self.last_preset, self.last_speed)
                self.power_status = "ON"
                return {"result", "preset"}

            except Exception as e:
                self.logging.error("Error during setting preset: " + str(e))
                self.power_status = "ERROR"
                return {"error", e}

        else:
            return self.not_connected

    def set_speed(self, speed=100):
        '''
     set speed for preset
     '''

        if self.status == "Connected":
            self.last_speed = int(speed)
            if self.mode == "PRESET":
                try:
                    self.api.send_preset_function(self.last_preset, self.last_speed)
                    self.power_status = "ON"
                    return {"result", "speed"}

                except Exception as e:
                    self.logging.error("Error during setting preset: " + str(e))
                    return {"error", e}

        else:
            return self.not_connected

    def set_brightness(self, percent):
        '''
     set brightness
     '''

        if self.status == "Connected":
            self.brightness = percent / 100
            r = self.last_r
            g = self.last_g
            b = self.last_b
            if self.mode == "COLOR":
                r = round(r * self.brightness)
                g = round(g * self.brightness)
                b = round(b * self.brightness)

                try:
                    self.api.update_device(r, g, b, 0, 0)
                    self.power_status = "ON"
                    if r + g + b == 0:
                        self.power_status = "OFF"
                    else:
                        self.power_status = "ON"
                    return {"result", "brightness"}

                except Exception as e:
                    self.logging.error("Error during setting brightness: " + str(e))
                    self.power_status = "ERROR"
                    return {"error", e}

        else:
            return self.not_connected

    def decode_status(self, raw_status_input):
        '''
      decode device string for status, e.g. 

	get_info
	      
        b'\x813$a#\x1f\x00\x00\r\x00\n\x00\x0f\xa1'- OFF
        b'\x813$a#\x1f\x00\x003\x00\n\x00\x0f\xc7' - OFF blue
        b'\x813#a#\x1f\x0033\x00\n\x00\xf0\xda'    - ON
        b'\x813#a#\x1f\x00\x003\x00\n\x00\xf0\xa7' - ON blue
        b'\x813#a#\x1f\x00\x00\xff\x00\n\x00\xf0s' - ON blue
        b'\x813#a#\x1f3\x00\x00\x00\n\x00\xf0\xa7' - ON red 100%
        b'\x813#a#\x1f\n\x00\x00\x00\n\x00\xf0~'   - ON red 20%
        b'\x813#, #\x1f\x9c\x9c\x9c\x00\n\x00\xf0\x13'

	return if send_data

	b'\n\x00\xf0q\x813#a#\x1f\xff\xff\xff\x00'	OFF
	b'\n\x00\xf0r\x813#a#\x1f\xff\x00\xff\x00'	ON
	b'\x0fq#\xa3' 					ON
	b'\x0fq$\xa4'					OFF
	b'\x813#a#\x1f\xff\xff\x00\x00\n\x00\xf0r'	SEND COLOR
	b'\x813#6#\x1f\x00\x00\x00\x00\n\x00\x0fh'	SEND PRESET
        
        -> App is able to decode ??
        -> API answers seem to be not stable, partly not a correct byte code
      '''
        dec_status = {}
        raw_status = str(raw_status_input)

        if "$" in raw_status:
            dec_status["power"] = "OFF"
        else:
            dec_status["power"] = "ON"
        if "a#" in raw_status:
            dec_status["mode"] = "COLOR"
        else:
            dec_status["mode"] = "PRESET"

        if "#" in raw_status:
            data = raw_status.split("#")
        else:
            self.logging.error("Error decoding unkown raw status: " + str(raw_status))
            dec_status = {
                "mode": "unknown",
                "rgb": "unknown",
                "RGB": "unknown",
                "set": "unknown"
            }
            return dec_status

        try:
            if dec_status["power"] == "ON":
                parts = data[2].split("\\")
            else:
                parts = data[1].split("\\")

            if dec_status["mode"] == "COLOR":
                dec_status["rgb"] = "#" + parts[2][1:3] + parts[3][1:3] + parts[4][1:3]
                dec_status["RGB"] = {"r": int(parts[2][1:3], 16), "g": int(parts[3][1:3], 16),
                                     "b": int(parts[4][1:3], 16)}  # , "x" : int(parts[5][1:3],16) }
                dec_status[
                    "set"] = "."  # {"a" : int(parts[7][1:3],16), "b" : int(parts[8][1:3],16), "c" : int(parts[9][1:3],16) }
            else:
                dec_status["rgb"] = "#" + parts[2][1:3] + parts[3][1:3] + parts[4][1:3]
                dec_status["RGB"] = {"r": int(parts[2][1:3], 16), "g": int(parts[3][1:3], 16),
                                     "b": int(parts[4][1:3], 16)}  # , "x" : int(parts[5][1:3],16) }
                dec_status["set"] = "."  # {"a" : int(parts[7][1:3],16), "b" : int(parts[8][1:3],16) }

        except Exception as e:
            self.logging.error("Error decoding output: " + str(e))
            self.logging.debug("... " + str(raw_status))
            self.logging.error("... " + str(parts))

            dec_status["rgb"] = "#000000"
            dec_status["RGB"] = {"r": 0, "g": 0, "b": 0}
            dec_status["set"] = "."

        return dec_status

    def get_info(self, param):
        '''
      return data
      '''

        status_info = {}
        self.logging.debug("..." + param)

        if self.status == "Connected":

            self.logging.debug(str(self.last_request_time) + "__" + str(time.time()))
            if not self.last_request_data or self.last_request_data == {} or self.last_request_time < time.time() - self.cache_wait:

                try:
                    raw_status = self.api.get_status()
                    self.power_status = "ON"
                    status_info["raw_status"] = str(raw_status)

                except Exception as e:
                    self.logging.error("Error requesting data - get_info('" + str(param) + "'): " + str(e))
                    self.last_request_time = time.time()  # wait for a while for next retry; seems not to work yet .... ??????
                    return {"error": "error requesting data - get_info('" + str(param) + "'): " + str(e)}

                ######## -> wait for a while, till next request ist done???

                try:
                    self.logging.debug("RAW STATUS: " + str(raw_status))
                    status_info = self.decode_status(raw_status)
                    self.last_request_data = status_info

                except Exception as e:
                    self.logging.error("Error decoding data: " + str(e))
                    return {"error": "error decoding data: " + str(e)}

                self.last_request_raw_data = raw_status
                self.last_request_time = time.time()

                status_info["brightness"] = str(round(self.brightness * 100))
                status_info["color_rgb"] = "(" + str(self.last_r) + "," + str(self.last_g) + "," + str(
                    self.last_b) + ")"
                status_info["rgb"] = status_info["color_rgb"]
                status_info["preset"] = self.last_preset
                status_info["speed"] = self.last_speed
                status_info["raw_status"] = str(raw_status)
                self.last_request_data = status_info

            else:
                status_info = self.last_request_data
                self.logging.debug("USE CACHE: " + str(status_info))

            if param in status_info:
                return {"result": status_info[param]}
            else:
                return {"error": "unknown tag '" + param + "'"}

            return {"result": "get_info"}

        else:
            return self.not_connected

    def test(self):

        if self.status == "Connected":
            self.logging.info("MAGIC-HOME: ..... TEST TEST TEST TEST TEST TEST TEST TEST")
            self.logging.info(str(self.api.get_status()))

            self.api.turn_on()
            time.sleep(0.3)
            self.api.update_device(0, 0, 255, 0, 0)
            time.sleep(0.3)
            self.api.update_device(0, 255, 0, 0, 0)
            time.sleep(0.3)
            self.api.update_device(255, 0, 0, 0, 0)
            time.sleep(0.3)
            self.api.update_device(0, 0, 0, 0, 0)

            self.api.turn_off()
            time.sleep(0.3)

            r = 255
            g = 0
            b = 255
            h = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
            for var_h in h:
                r1 = round(r * var_h)
                g1 = round(g * var_h)
                b1 = round(b * var_h)
                try:
                    self.api.update_device(r1, g1, b1, 0, 0)
                    self.power_status = "ON"
                    return {"result", "preset"}

                except Exception as e:
                    self.logging.error("Error during testing: " + str(e))
                    self.power_status = "ERROR"
                    return {"error", e}

                time.sleep(0.3)

            # self.device.send_preset_function(37, 100)
            self.api.turn_off()

            return {"result", "test"}

        else:
            return self.not_connected
