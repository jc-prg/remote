import logging, time, threading, datetime

import modules.rm3json as rm3json
import modules.rm3config as rm3config
import modules.rm3ping as rm3ping


class Connect(threading.Thread):
    """
    class to control all interfaces including a continuous check if interfaces still available
    """

    def __init__(self, configFiles):
        """
        Initialize Interfaces
        """
        threading.Thread.__init__(self)

        self.api = {}
        self.api_device_list = {}
        self.api_device_settings = {}
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
        self.logging.setLevel = rm3config.log_set2level

        if rm3config.log_apidata == "NO":
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

            if api + "_" + dev not in self.api_device_list:
                self.api_device_list[api+"_"+dev] = []
                self.api_device_settings[api+"_"+dev] = {}

            self.api_device_list[api+"_"+dev].append(device)
            self.api_device_settings[api + "_" + dev][device] = active_devices[device]

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
                        api] + ".ApiControl(api,dev,dev_config,self.log_commands)"
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
                self.check_activity()
            else:
                time.sleep(1)

        self.logging.info("Exiting " + self.name)

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
                self.logging.info(" * " + key + " : " + str(self.api_device_list[key]))
                self.logging.info("   -> IP: " + self.api[key].api_config["IPAddress"] + " / connect = " +
                                  str(connect).upper())

                if not connect:
                    connect = rm3ping.ping(self.api[key].api_config["IPAddress"])
                    if not connect:
                        self.api[key].status = self.api[key].not_connected + " ... PING"
                        self.logging.info("   -> " + self.api[key].status)

                if connect:
                    self.api_reconnect(key)

    def check_activity(self):
        """
        check when the last command was send and if an auto-off has to be reflected in the system status
        """
        self.logging.info("..................... CHECK ACTIVITY (" + str(self.checking_interval) +
                          "s) .....................")

        for key in self.api:
            device_list = self.api_device_list[key]
            self.logging.info(" * " + key + " : " + str(device_list))
            if self.api[key].last_action > 0:
                self.logging.info("   -> " + str(round((time.time() - self.api[key].last_action)*10)/10) +
                                  "s  (" + self.api[key].last_action_cmd + ")")
            else:
                self.logging.info("   -> INACTIVE since server start")

            for device in device_list:
                auto_power_off = self.device_auto_power_off(device)
                if auto_power_off != -1:
                    self.logging.info("   -> " + device + " - auto-off: " + str(auto_power_off))
                    if auto_power_off["switch_off"]:
                        self.device_save_status(device, button="power", status="OFF")

    def api_reconnect(self, interface=""):
        """
        reconnect single device or all devices if status is not "Connected"
        """

        if interface == "":
            for key in self.api:
                if self.api[key].status != "Connected":
                    self.api[key].connect()
        else:
            self.api[interface].connect()

    def api_test(self):
        """
        test all APIs
        """
        for key in self.api:
            status = self.api[key].api_test()
            if "ERROR" in str(status):
                return status

        return "OK"

    def api_method(self, device=""):
        """
        return method of interface
        """

        api_dev = self.device_api_string(device)
        if api_dev in self.api:
            return self.api[api_dev].method
        else:
            return "ERROR: interface not defined (" + api_dev + "/" + device + ")"

    def api_get_status(self, interface="", device=""):
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

    def api_errors(self, device):
        """
        check the amount of errors, if more than 80% errors and at least 5 requests try to reconnect
        """

        api_dev = self.device_api_string(device)

        if api_dev not in self.api:
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
            self.api_reconnect(api_dev)

    def api_error_count(self, device, is_error):
        """
        count errors and reset every x seconds
        """

        api_dev = self.device_api_string(device)

        if (self.check_error + 10) < time.time():
            self.api[api_dev].count_error = 0
            self.api[api_dev].count_success = 0
            self.check_error = time.time()

        if is_error:
            self.api[api_dev].count_error += 1
        else:
            self.api[api_dev].count_success += 1

        self.logging.debug("ERROR RATE ... error:" + str(is_error))

    def api_send_directly(self, device, command):
        """
        send command directly to API of the device
        """
        answer = "N/A"
        power = "N/A"
        api_dev = self.device_api_string(device)
        method = self.api_method(device)
        self.logging.info("__SEND DIRECTLY: " + api_dev + "/" + device + " | " + command)

        if self.api[api_dev].status == "Connected":
            answer = self.api[api_dev].query(device, command)
            power = self.device_status(device)["status"]["power"]

        return_msg = {
            "connect": self.api[api_dev].status,
            "power": power,
            "answer": answer
            }

        return return_msg

    def api_send(self, call_api, device, button, value=""):
        """
        send command if connected
        """
        api_dev = self.device_api_string(device)
        method = self.api_method(device)
        return_msg = ""
        self.api_errors(device)
        self.logging.info("__SEND: " + api_dev + " / " + device + "_" + button + ":" + str(value) +
                          " (" + self.api[api_dev].status + ")")

        if value.startswith("set-") and method == "record":
            value = value.replace("set-", "")
            self.device_save_status(device, button=button, status=value)

        elif self.api[api_dev].status == "Connected":
            if button.startswith("send-"):

                button = button.split("-")[1]
                if method == "query" and value != "":
                    try:
                        button_code = self.command_get(call_api, "send-data", device, button)
                    except Exception as e:
                        button_code = "ERROR send: count not get_command."
                else:
                    button_code = "ERROR send: wrong method (!query) or no data transmitted."

                if "ERROR" not in button_code:
                    button_code = button_code.replace("{DATA}", value)
                else:
                    self.logging.error(button_code)

                if self.log_commands:
                    self.logging.info("...... SEND-DATA " + api_dev + " / " + button +
                                      " ('" + str(value) + "'/" + method + ")")
                    self.logging.info("...... " + str(button_code))

            else:
                if method == "record":
                    button_code = self.command_get(call_api, "buttons", device, button)
                elif method == "query" and value == "":
                    button_code = self.command_get(call_api, "buttons", device, button)
                else:
                    button_code = self.command_create(call_api, device, button, value)

                if self.log_commands:
                    self.logging.info("...... SEND " + api_dev + " / " + button +
                                      " ('" + str(value) + "'/" + method + ")")
                    self.logging.info("...... " + str(button_code))

            # send if not error
            if api_dev in self.api and "ERROR" not in button_code:
                return_msg = self.api[api_dev].send(device, button_code)
            elif "ERROR" in button_code:
                return_msg = "ERROR: could not read/create command from button code (send/" + \
                             device + "/" + button + "); " + button_code
            else:
                return_msg = "ERROR: API not available (" + api_dev + ")"

            # save status depending on device method
            if "ERROR" not in return_msg and self.api[api_dev].method == "record" and value != "":
                self.device_save_status(device, button=button, status=value)
            elif "ERROR" not in return_msg and self.api[api_dev].method == "record":
                self.device_save_status(device, button="api-last-send", status="add")
            elif "ERROR" not in return_msg and self.api[api_dev].method == "query":
                self.device_save_status(device, button="api-last-send", status="add")

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):

            if "'ApiControl' object has no attribute 'api'" in return_msg:
                return_msg = "ERROR: Interface not ready yet (" + api_dev + ")"
            elif "Device is off" in return_msg:
                self.logging.debug(return_msg)
                return return_msg

            if self.last_message != return_msg:
                self.logging.warning(return_msg)

            self.last_message = return_msg
            self.api_error_count(device, True)

        else:
            self.api_error_count(device, False)

        return return_msg

    def api_record(self, call_api, device, button):
        """
        record a command e.g. from IR device if connected
        """

        return_msg = ""
        api_dev = self.device_api_string(device)
        self.api_errors(call_api, device)

        self.logging.debug("__RECORD: " + api_dev + " (" + self.api[api_dev].status + ")")

        if self.api[api_dev].status == "Connected":
            if api_dev in self.api:
                return_msg = self.api[api_dev].record(device, button)
            else:
                return_msg = "ERROR: API not available (" + api_dev + ")"

            if self.log_commands:
                self.logging.info("...... " + str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):
            if self.last_message != return_msg:
                self.logging.warning(return_msg)
            self.last_message = return_msg
            self.api_error_count(device, True)
        else:
            self.api_error_count(device, False)

        return return_msg

    def api_query(self, call_api, device, button):
        """
        query an information from device via API
        """
        return_msg = ""
        button_code = ""
        api_dev = self.device_api_string(device)
        # self.check_errors(call_api, device)  #### -> leads to an error for some APIs

        self.logging.debug("__QUERY: " + api_dev + " (" + device + "," + button + ";" + self.api[api_dev].status + ")")

        if api_dev in self.api and self.api[api_dev].status == "Connected":

            try:
                button_code = self.command_get(call_api, "queries", device, button)
            except Exception as e:
                self.logging.error(button_code)
                button_code = "ERROR query, get_command: "+str(e)

            if "ERROR" in button_code:
                return_msg = "ERROR: could not read/create command from button code (query/" + device + "/" + button + \
                             "); " + button_code
            elif api_dev in self.api:
                return_msg = self.api[api_dev].query(device, button_code)
            else:
                return_msg = "ERROR: API not available (" + str(api_dev) + ")"

            if self.log_commands:
                self.logging.info("...... QUERY " + api_dev + " / " + button +
                                  " ('" + button_code + ")")
                self.logging.info("...... " + str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):

            if "'ApiControl' object has no attribute 'api'" in return_msg:
                return_msg = "ERROR: Interface not ready yet (" + api_dev + ")"
            elif "Device is off" in return_msg:
                self.logging.debug(return_msg)
                return return_msg

            if self.last_message != return_msg:
                self.logging.warning(return_msg)
            self.last_message = return_msg
            self.api_error_count(device, True)
        else:
            self.api_error_count(device, False)

        self.logging.debug(device + " QUERY " + str(return_msg))
        return return_msg

    def device_save_status(self, device, button, status):
        """
        save status of button to active.json
        """
        active = self.configFiles.read_status()

        if button == "on" or button == "off" or button == "on-off":
            param = "power"
        elif button[-1:] == "+" or button[-1:] == "-":
            param = button[:-1]
        else:
            param = button

        if device in active:
            if "status" not in active[device]:
                active[device]["status"] = {}
            active[device]["status"][param] = status
            active[device]["status"]["api-last-send"] = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
            active[device]["status"]["api-last-send-tc"] = int(time.time())

            #power_auto_off = self.device_auto_power_off(device)
            #if power_auto_off != 1:
            #    active[device]["status"]["auto-power-off"] = power_auto_off["auto_off"]

            return_msg = "OK"

        else:
            return_msg = "ERROR record_status: device not found"

        self.configFiles.write_status(active, "save_status " + device + "/" + button)
        return return_msg

    def device_api_string(self, device):
        """
        return short api_dev
        """
        try:
            active_devices = self.configFiles.read_status()
            api = active_devices[device]["config"]["interface_api"]
            dev = active_devices[device]["config"]["interface_dev"]
            return api + "_" + dev

        except:
            return "error_" + device

    def device_status(self, device) -> dict:
        """
        get status for a specific device
        """
        active_devices = self.configFiles.read_status()
        if device in active_devices:
            return active_devices[device]
        else:
            return {"ERROR":  device}

    def device_configuration(self, device) -> dict:
        """
        return configuration file of a device
        """
        active = self.configFiles.read_status()
        if device in active:
            device_code = active[device]["config"]["device"]
            device_api = active[device]["config"]["interface_api"]
            device_config = self.configFiles.read(rm3config.commands + device_api + "/" + device_code)
            return device_config.copy()
        else:
            return {"ERROR": "Device configuration doesn't exist."}

    def device_auto_power_off(self, device):
        """
        check device activity and if auto power off for device not directly controlled via API but e.g. IR
        """
        device_config = self.device_configuration(device)
        device_status = self.device_status(device)
        if "data" in device_config:
            if "commands" in device_config["data"] and "power" in device_config["data"]["commands"] and \
                    "auto_off" in device_config["data"]["commands"]["power"]:

                last_action = 0
                current_time = int(time.time())
                power_auto_off = device_config["data"]["commands"]["power"]["auto_off"]
                power_status = ""
                switch_off = False

                if "power" in device_status["status"]:
                    power_status = device_status["status"]["power"]
                if "api-last-send-tc" in device_status["status"]:
                    last_action = device_status["status"]["api-last-send-tc"]
                if ("api-last-query-tc" in device_status["status"] and
                        device_status["status"]["api-last-send-tc"] > last_action):
                    last_action = device_status["status"]["api-last-send-tc"]
                if current_time - last_action > power_auto_off and power_status.upper() == "ON":
                    switch_off = True
                return {
                    "power": power_status,
                    "auto_off": power_auto_off,
                    "last_action": current_time - last_action,
                    "switch_off": switch_off
                }
            else:
                return -1
        else:
            self.logging.warning("Configuration file for device '" + device + "' isn't correct.")
            return -1

    def command_get(self, dev_api, button_query, device, button):
        """
        translate device and button to command for the specific device
        """
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
            device_file = rm3config.commands + api + "/" + device_code
            buttons_device = self.device_configuration(device)
            if rm3json.if_exist(device_file):
                if self.log_commands:
                    self.logging.info("...... button-file: " + device_file + ".json")
                    self.logging.info("...... " + str(buttons_device))
            else:
                return "ERROR: device configuration isn't correct: " + device_file + " / " + str(buttons_device)

            device_default = rm3config.commands + api + "/00_default"
            if rm3json.if_exist(device_default):
                buttons_default = self.configFiles.read(device_default)
                if self.log_commands:
                    self.logging.info("...... button-default-file: " + device_default + ".json")
                    self.logging.info("...... " + str(buttons_default))
            else:
                return "ERROR: not default configuration defined: " + device_default

            # check for errors or return button code
            if "ERROR" in buttons_device or "ERROR" in active:
                return "ERROR get_command: buttons not defined for device (" + device + ")"

            elif "commands" in buttons_device["data"] and button in buttons_device["data"]["commands"] \
                    and type_new in buttons_device["data"]["commands"][button]:
                return buttons_device["data"]["commands"][button][type_new]

            elif "commands" in buttons_default["data"] and button in buttons_default["data"]["commands"] \
                    and type_new in buttons_default["data"]["commands"][button]:
                return buttons_default["data"]["commands"][button][type_new]

            # -> check if still required for some device configurations ->
            elif button_query in buttons_device["data"] and button in buttons_device["data"][button_query]:
                return buttons_device["data"][button_query][button]

            elif button_query in buttons_default["data"] and button in buttons_default["data"][button_query]:
                return buttons_default["data"][button_query][button]

            else:
                return ("ERROR get_command: button not defined (" + dev_api + "," + button_query +
                        ": " + device + "_" + button + ")")

        else:
            return "ERROR get_command: device not found (" + dev_api + ": " + device + ")"

    def command_create(self, dev_api, device, button, value):
        """
        create command with "button" and value, including check if value is correct
        """

        # read data -> to be moved to cache?!
        active = self.configFiles.read_status()
        api = dev_api.split("_")[0]

        if device in active:
            device_code = active[device]["config"]["device"]
            buttons = self.device_configuration(device)

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
