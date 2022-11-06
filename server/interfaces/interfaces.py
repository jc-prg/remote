# -----------------------------------
# API commands defined in swagger.yml
# -----------------------------------
# (c) Christoph Kloth
# -----------------------------------

import logging, time, threading, datetime

import modules.rm3json as rm3json
import modules.rm3config as rm3config
import modules.rm3ping as rm3ping
import modules.rm3stage as rm3stage


class Connect(threading.Thread):
    '''
    class to control all interfaces including a continuous check if interfaces still available
    '''

    def __init__(self, configFiles):
        '''
        Initialize Interfaces
        '''
        threading.Thread.__init__(self)

        self.api = {}
        self.available = {}
        self.name = "deviceInterfaces"
        self.stopProcess = False
        self.wait = 15  # seconds to check connection
        self.checking_interval = rm3config.refresh_device_connection
        self.checking_last = 0
        self.configFiles = configFiles
        self.check_error = time.time()
        self.last_message = ""
        self.methods = {
            "send": "Send command via API (send)",
            "record": "Record per device (record)",
            "query": "Request per API (query)"
        }
        self.api_modules = {
            "KODI": "api_kodi",
            "SONY": "api_sony",
            "TEST": "api_test",
            "MAGIC-HOME": "api_magichome",
            "TAPO-P100": "api_p100",
            "BROADLINK": "api_broadlink",
            "EISCP-ONKYO": "api_eiscp"
        }

        self.logging = logging.getLogger("api")
        self.logging.setLevel = rm3stage.log_set2level

        if rm3stage.log_apidata == "NO":
            self.log_commands = False
        else:
            self.log_commands = True

    def run(self):
        """
        Initialize APIs and loop to check connection status
        """

        self.logging.info("Starting " + self.name)

        try:
            active_devices = self.configFiles.read_status()
        except Exception as e:
            self.logging.error("Error while requesting information from " + rm3config.active_devices + ".json: " + str(e))
            return

        self.logging.info(".................... 1st CONNECT OF INTERFACES ....................")
        for device in active_devices:
            self.logging.debug("Load API for device " + device + " ...")
            api = active_devices[device]["config"]["interface_api"]
            dev = active_devices[device]["config"]["interface_dev"]

            dev_config = {}
            if rm3json.if_exist(rm3config.commands + api + "/00_interface"):
                api_config = self.configFiles.read(rm3config.commands + api + "/00_interface")
                if "Devices" in api_config and dev in api_config["Devices"]:
                    dev_config = api_config["Devices"][dev]
                elif "Devices" in api_config and "default" in api_config["Devices"]:
                    dev_config = api_config["Devices"]["default"]
                else:
                    self.logging.warning(
                        "Error in config-file - device not defined / no default device: " + rm3config.commands + api + "/00_interface.json")

            if dev_config != {}:
                api_dev = api + "_" + dev

                if api in self.api_modules and api_dev not in self.api:
                    cmd_import = "import interfaces." + self.api_modules[api]
                    cmd_connect = "interfaces." + self.api_modules[
                        api] + ".APIcontrol(api,dev,dev_config,self.log_commands)"
                    try:
                        exec(compile(cmd_import, "string", "exec"))
                        self.api[api_dev] = eval(cmd_connect)
                    except ModuleNotFoundError:
                        self.logging.error("Could not connect API: Module '" + self.api_modules[
                            api] + ".py' not found (" + api_dev + ")")
                    except Exception as e:
                        self.logging.error("Could not connect API: " + str(e) + " (" + api_dev + ")")
                    except:
                        self.logging.error("Could not connect API: Unknown reason (" + api_dev + ")")

            else:
                self.logging.error(
                    "Could not connect to " + api + " - Error in config file (" + rm3config.commands + api + "/00_interface.json)")

        for key in self.api:
            dev_key = key.split("_")[1]
            self.available[key] = self.api[key].api_description + " [" + dev_key + "]"

        time.sleep(5)
        while not self.stopProcess:
            if self.checking_last + self.checking_interval < time.time():
                self.checking_last = time.time()
                self.check_connection()
            else:
                time.sleep(1)

        self.logging.info("Exiting " + self.name)

    def api_device(self, device):
        '''
        return short api_dev
        '''

        try:
            active_devices = self.configFiles.read_status()
            api = active_devices[device]["config"]["interface_api"]
            dev = active_devices[device]["config"]["interface_dev"]
            return api + "_" + dev

        except:
            return "error_" + device

    def method(self, device=""):
        '''
        return method of interface
        '''

        api_dev = self.api_device(device)
        if api_dev in self.api:
            return self.api[api_dev].method
        else:
            return "ERROR: interface not defined (" + api_dev + "/" + device + ")"

    def check_connection(self):
        """
        check IP connection and try reconnect if IP connection exists and status is not "Connected"
        """

        self.logging.info("..................... CHECK CONNECTION (" + str(self.checking_interval) +
                          "s) .....................")

        # check API status
        for key in self.api:
            if "IPAddress" in self.api[key].api_config:
                connect = rm3ping.ping(self.api[key].api_config["IPAddress"])
                self.logging.info(
                    key + ": ip - " + self.api[key].api_config["IPAddress"] + " / connect -" + str(connect))

                if not connect:
                    connect = rm3ping.ping(self.api[key].api_config["IPAddress"])
                    if not connect:
                        self.api[key].status = self.api[key].not_connected + " ... PING"
                        self.logging.info(self.api[key].status)

                if connect:
                    self.reconnect(key)

    def reconnect(self, interface=""):
        """
        reconnect single device or all devices if status is not "Connected"
        """

        if interface == "":
            for key in self.api:
                if self.api[key].status != "Connected":
                    self.api[key].connect()
        else:
            self.api[interface].connect()

    def test(self):
        """
        test all APIs
        """

        for key in self.api:
            status = self.api[key].test()
            if "ERROR" in str(status): return status

        return "OK"

    def status(self, interface="", device=""):
        """
        return status of all devices or a selected device
        """

        status_all_interfaces = {}
        api_dev = interface + "_" + device

        self.logging.debug(str(api_dev))

        for key in self.api:
            status_all_interfaces[key] = self.api[key].status

        if interface == "":
            return status_all_interfaces
        elif api_dev in self.api:
            return self.api[api_dev].status
        else:
            return "ERROR: API ... not found (" + api_dev + ")."

    def check_errors(self, device):
        """
        check the amount of errors, if more than 80% errors and at least 5 requests try to reconnect
        """

        api_dev = self.api_device(device)

        if not api_dev in self.api:
            self.logging.warning("API not connected: " + str(api_dev))
            return

        requests = self.api[api_dev].count_error + self.api[api_dev].count_success
        if requests > 0:
            error_rate = self.api[api_dev].count_error / requests
        else:
            error_rate = 0

        self.logging.debug(
            "ERROR RATE ... " + str(error_rate) + "/" + str(self.api[api_dev].count_error) + "/" + str(requests))

        if error_rate >= 0.8 and requests > 5:
            self.api[api_dev].status = self.api[api_dev].not_connected + " ... HIGH ERROR RATE"
            self.reconnect(api_dev)

    def check_errors_count(self, device, is_error):
        """
        count errors and reset every x seconds
        """

        api_dev = self.api_device(device)

        if (self.check_error + 10) < time.time():
            self.api[api_dev].count_error = 0
            self.api[api_dev].count_success = 0
            self.check_error = time.time()

        if is_error:
            self.api[api_dev].count_error += 1
        else:
            self.api[api_dev].count_success += 1

        self.logging.debug("ERROR RATE ... error:" + str(is_error))

    def send(self, call_api, device, button, value=""):
        """
        send command if connected
        """

        return_msg = ""
        api_dev = self.api_device(device)
        self.check_errors(device)

        self.logging.info("__SEND: " + api_dev + " / " + device + "_" + button + ":" + str(value) + " (" + self.api[
            api_dev].status + ")")

        if self.api[api_dev].status == "Connected":
            method = self.method(device)

            if button.startswith("send-"):

                button = button.split("-")[1]
                if method == "query" and value != "":
                    try:
                        button_code = self.get_command(call_api, "send-data", device, button)
                    except Exception as e:
                        button_code = "ERROR send: count not get_command."
                else:
                    button_code = "ERROR send: wrong method (!query) or no data transmitted."

                if "ERROR" not in button_code:
                    button_code = button_code.replace("{DATA}", value)
                else:
                    self.logging.error(button_code)

                if self.log_commands:
                    self.logging.info("...... SEND-DATA " + api_dev + " / " + button + " ('" + str(value) + "'/" + method + ")")
                if self.log_commands:
                    self.logging.info("...... " + str(button_code))

            else:
                if method == "record":
                    button_code = self.get_command(call_api, "buttons", device, button)
                elif method == "query" and value == "":
                    button_code = self.get_command(call_api, "buttons", device, button)
                else:
                    button_code = self.create_command(call_api, device, button, value)

                if self.log_commands:      self.logging.info(
                    "...... SEND " + api_dev + " / " + button + " ('" + str(value) + "'/" + method + ")")
                if self.log_commands:      self.logging.info("...... " + str(button_code))

            if "ERROR" in button_code:
                return_msg = "ERROR: could not read/create command from button code (send/" + \
                             device + "/" + button + "); " + button_code
            elif api_dev in self.api:
                return_msg = self.api[api_dev].send(device, button_code)
            else:
                return_msg = "ERROR: API not available (" + api_dev + ")"

            if not "ERROR" in return_msg and self.api[api_dev].method == "record" and value != "":
                self.save_status(device, button, value)
            elif not "ERROR" in return_msg and self.api[api_dev].method == "query":
                self.save_status(device, "api-last-send", "add")

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):

            if "'APIcontrol' object has no attribute 'api'" in return_msg:
                return_msg = "ERROR: Interface not ready yet (" + api_dev + ")"
            elif "Device is off" in return_msg:
                self.logging.info(return_msg)
                return return_msg

            if self.last_message != return_msg:
                self.logging.warning(return_msg)

            self.last_message = return_msg
            self.check_errors_count(device, True)

        else:
            self.check_errors_count(device, False)

        return return_msg

    def record(self, call_api, device, button):
        """
        record a command e.g. from IR device if connected
        """

        return_msg = ""
        api_dev = self.api_device(device)
        self.check_errors(call_api, device)

        self.logging.debug("__RECORD: " + api_dev + " (" + self.api[api_dev].status + ")")

        if self.api[api_dev].status == "Connected":
            if api_dev in self.api:
                return_msg = self.api[api_dev].record(device, button)
            else:
                return_msg = "ERROR: API not available (" + api_dev + ")"

            if self.log_commands: self.logging.info("...... " + str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
            if self.last_message != return_msg:
                self.logging.warning(return_msg)
            self.last_message = return_msg
            self.check_errors_count(device, True)
        else:
            self.check_errors_count(device, False)

        return return_msg

    def query(self, call_api, device, button):
        """
        query an information from device via API
        """

        return_msg = ""
        api_dev = self.api_device(device)
        # self.check_errors(call_api, device)  #### -> leads to an error for some APIs

        self.logging.debug("__QUERY: " + api_dev + " ("+device+","+button+";" + self.api[api_dev].status + ")")

        if api_dev in self.api and self.api[api_dev].status == "Connected":

            try:
                button_code = self.get_command(call_api, "queries", device, button)
            except Exception as e:
                self.logging.error(button_code)
                button_code = "ERROR query, get_command: "+str(e)

            if "ERROR" in button_code:
                return_msg = "ERROR: could not read/create command from button code (query/" + device + "/" + button + "); " + button_code
            elif api_dev in self.api:
                return_msg = self.api[api_dev].query(device, button_code)
            else:
                return_msg = "ERROR: API not available (" + str(api_dev) + ")"

            if self.log_commands:
                self.logging.info("...... " + str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):

            if "'APIcontrol' object has no attribute 'api'" in return_msg:
                return_msg = "ERROR: Interface not ready yet (" + api_dev + ")"
            elif "Device is off" in return_msg:
                self.logging.info(return_msg)
                return return_msg

            if self.last_message != return_msg:
                self.logging.warning(return_msg)
            self.last_message = return_msg
            self.check_errors_count(device, True)
        else:
            self.check_errors_count(device, False)

        self.logging.debug(device + " QUERY " + str(return_msg))
        return return_msg

    def save_status(self, device, button, status):
        '''
        save status of button to active.json
        '''
        return_msg = ""
        active = self.configFiles.read_status()

        if button == "on" or button == "off" or button == "on-off":
            param = "power"
        elif button[-1:] == "+" or button[-1:] == "-":
            param = button[:-1]
        else:
            param = button

        if device in active:
            if not "status" in active[device]: active[device]["status"] = {}
            active[device]["status"][param] = status
            active[device]["status"]["api-last-send"] = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
            return_msg = "OK"

        else:
            return_msg = "ERROR record_status: device not found"

        self.configFiles.write_status(active, "save_status " + device + "/" + button)
        return return_msg

    def get_command(self, dev_api, button_query, device, button):
        """
        translate device and button to command for the specific device
        """

        value_list = ["buttons", "queries", "commands", "values", "send-data"]
        active = self.configFiles.read_status()
        api = dev_api.split("_")[0]

        if button_query == "queries":
            type_new = "get"
        elif button_query == "send-data":
            type_new = "set"
        else:
            type_new = "N/A"

        if device in active:
            device_code = active[device]["config"]["device"]
            buttons_device = self.configFiles.read(rm3config.commands + api + "/" + device_code)

            if self.log_commands:
                self.logging.info("...... button-file: " + api + "/" + device_code + ".json")

            if rm3json.if_exist(rm3config.commands + api + "/00_default"):
                buttons_default = self.configFiles.read(rm3config.commands + api + "/00_default")
                if self.log_commands:
                    self.logging.info("...... button-default-file: " + api + "/00_default.json")

            # check for errors or return button code
            if "ERROR" in buttons_device or "ERROR" in active:
                return "ERROR get_command: buttons not defined for device (" + device + ")"
            elif "commands" in buttons_device["data"] and button in buttons_device["data"]["commands"] and type_new in \
                    buttons_device["data"]["commands"][button]:
                return buttons_device["data"]["commands"][button][type_new]
            elif "commands" in buttons_default["data"] and button in buttons_default["data"]["commands"] and type_new in \
                    buttons_default["data"]["commands"][button]:
                return buttons_default["data"]["commands"][button][type_new]
            elif button in buttons_device["data"][button_query]:
                return buttons_device["data"][button_query][button]
            elif button in buttons_default["data"][button_query]:
                return buttons_default["data"][button_query][button]
            else:
                return "ERROR get_command: button not defined (" + device + "_" + button + ")"
        else:
            return "ERROR get_command: device not found (" + device + ")"

    def create_command(self, dev_api, device, button, value):
        """
        create command with "button" and value, including check if value is correct
        """

        # read data -> to be moved to cache?!
        active = self.configFiles.read_status()
        api = dev_api.split("_")[0]

        if device in active:
            device_code = active[device]["config"]["device"]
            buttons = self.configFiles.read(rm3config.commands + api + "/" + device_code)

            # add button definitions from default.json if exist
            if rm3json.if_exist(rm3config.commands + api + "/00_default"):
                buttons_default = self.configFiles.read(rm3config.commands + api + "/00_default")

                key_list = ["buttons", "queries", "commands", "values", "send-data"]
                for key in key_list:
                    if key not in buttons["data"]:
                        buttons["data"][key] = {}
                    if key in buttons_default["data"]:
                        for key2 in buttons_default["data"][key]:
                            buttons["data"][key][key2] = buttons_default["data"][key][key2]

            # check for errors or return button code
            if "ERROR" in buttons or "ERROR" in active:
                return "ERROR create_command: buttons not defined for device (" + device + ")"
            elif button in buttons["data"]["commands"]:

                cmd_ok = False
                cmd_type = buttons["data"]["commands"][button]["type"]
                cmd_values = buttons["data"]["values"][button]
                cmd = buttons["data"]["commands"][button]["command"] + value

                if cmd_type == "integer" and cmd_values["min"] <= int(value) <= cmd_values["max"]:
                    cmd_ok = True
                elif cmd_type == "enum" and value in cmd_values:
                    cmd_ok = True

                if not cmd_ok:
                    return "ERROR create_command: values not valid (" + device + ", " + button + ", " + str(value) + ")"
                else:
                    return cmd

            else:
                return "ERROR create_command: command not defined (" + device + ", " + button + ")"
        else:
            return "ERROR create_command: device not found (" + button + ")"
