import time
import sys
import datetime
import importlib

import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3presets
import server.modules.rm3ping as rm3ping
from server.modules.rm3classes import RemoteThreadingClass


class Connect(RemoteThreadingClass):
    """
    class to control all interfaces including a continuous check if interfaces still available
    """

    def __init__(self, config):
        """
        Constructor to initialize interfaces

        Args:
            config (modules.pm3cache.ConfigCache): config handler
        """
        RemoteThreadingClass.__init__(self, "api", "API Device Controller")

        self.config = config

        self.api = {}
        self.api_first_load = True
        self.api_device_list = {}
        self.api_device_settings = {}
        self.api_request_reconnect = {}
        self.api_modules = {
            "KODI": "api_kodi",
            "SONY": "api_sony",
            "TEST": "api_test",
            "MAGIC-HOME": "api_magichome",
            "TAPO-P100": "api_p100",
            "BROADLINK": "api_broadlink",
            "EISCP-ONKYO": "api_eiscp",
            "ZIGBEE2MQTT": "api_zigbee"
        }
        self.api_configuration = {
            "API-Description": "",
            "API-Info": "",
            "API-Source": "",
            "API-Devices": {}
            }
        self.api_log = {"send": [], "query": [], "record": []}
        self.api_log_length = 100
        self.methods = {
            "send": "Send command via API (send)",
            "record": "Record per device (record)",
            "query": "Request per API (query)"
        }
        self.available = {}

        self.checking_interval = rm3presets.refresh_device_connection
        self.checking_last = 0
        self.check_error = time.time()
        self.last_message = ""
        self.info_no_devices_found = {}

        if rm3presets.log_api_data == "NO":
            self.log_commands = False
        else:
            self.log_commands = True

        self.thread_priority(2)

    def run(self):
        """
        Initialize APIs and loop to check connection status
        """
        self.logging.info("Starting " + self.name)

        api_load = self.load_api_connectors()
        time.sleep(5)
        self.config.interfaces_identify()

        if not api_load:
            self.logging.error("First load of API connectors didn't work. Try again ...")
            if not self.load_api_connectors():
                self.logging.critical("Could not load any API Connector! " +
                                      "Check your basic API and DEVICE configuration.")
                sys.exit()
            else:
                self.logging.info("Loading API connectors OK.")

        while self._running:
            if self.checking_last + self.checking_interval < time.time():
                self.checking_last = time.time()
                self.check_connection()
                self.check_activity()

            self.thread_wait()

            if self.api_request_reconnect != {}:
                for key in self.api_request_reconnect:
                    self.api_reconnect(key)
                self.api_request_reconnect = {}

        self.logging.info("Exiting " + self.name)

    def check_connection(self):
        """
        check IP connection and try reconnect if IP connection exists and status is not "Connected"
        """
        self.logging.debug(".................... CHECK CONNECTION (" + str(self.checking_interval) +
                           "s) ....................")
        self.logging.debug("Check Interface configuration: " + str(self.config.interface_configuration))

        connected = []
        not_connected = []
        start_time = time.time()
        device_status = self.config.read(rm3presets.active_devices)

        # check API status
        for key in self.api:
            [api, dev] = key.split("_")
            if api in self.config.interface_configuration and "active" in self.config.interface_configuration[api]:
                api_active = self.config.interface_configuration[api]["active"]
            else:
                self.logging.warning("API not yet in config file: " + api)
                api_active = True

            api_device_power = True
            if "PowerDevice" in self.config.interface_configuration[api]["devices"][dev]:
                power_device = self.config.interface_configuration[api]["devices"][dev]["PowerDevice"]
                if "_" in power_device:
                    [power_api, power_dev] = power_device.split("_")
                    check_devices = {}
                    check_devices_last_key = ""
                    for device in device_status:
                        if (device_status[device]["config"]["api_key"] == power_api
                                and device_status[device]["config"]["api_device"] == power_dev
                                and "power" in device_status[device]["status"]):
                            check_devices_last_key = power_api+"_"+power_dev+"_"+device
                            check_devices[check_devices_last_key] = device_status[device]["status"]["power"]
                    if len(check_devices) == 1:
                        if "OFF" in check_devices[check_devices_last_key].upper():
                            api_device_power = False

            if not api_active:
                self.logging.debug("API '" + key + "' is disabled.")
                self.api[key].status = "DISABLED (" + api + ")"

            elif (dev in self.config.interface_configuration[api]["devices_active"] and
                  not self.config.interface_configuration[api]["devices_active"][dev]):
                self.logging.debug("API-Interface '" + key + "' is disabled.")
                self.api[key].status = "DISABLED (" + key + ")"

            elif "ERROR" in self.api[key].api_device_available(key):
                self.logging.debug("API Device for '" + key + "' not found at the server.")
                self.api[key].status = self.api[key].api_device_available(key)

            elif not api_device_power:
                self.logging.debug("API-Interface '" + key + "' is switched off.")
                #self.api[key].status = "OFF (PowerDevice "+power_dev+")"
                self.api[key].status = "OFF (PowerDevice "+device_status[power_dev]["settings"]["label"]+")"

            elif "IPAddress" in self.api[key].api_config:
                connect = rm3ping.ping(self.api[key].api_config["IPAddress"])
                if key in self.api_device_list:
                    self.logging.debug(" * " + key + ": " + str(self.api_device_list[key]))
                else:
                    self.logging.debug(" * " + key + ": no devices connected yet.")
                self.logging.debug("   -> IP: " + self.api[key].api_config["IPAddress"] + " / connect = " +
                                   str(connect).upper())
                if dev in self.config.interface_configuration[api]["devices_active"]:
                    self.logging.debug("   -> API Active: " + str(self.config.interface_configuration[api]["active"]) +
                                       "  / API-Device Active: " +
                                       str(self.config.interface_configuration[api]["devices_active"][dev]))

                if not connect:
                    connect = rm3ping.ping(self.api[key].api_config["IPAddress"])
                    if not connect:
                        self.api[key].status = (self.api[key].not_connected + " ... PING " +
                                                self.api[key].api_config["IPAddress"])
                        self.logging.debug("   -> " + self.api[key].status)

                if connect:
                    if self.api[key].status != "Connected":
                        self.api[key].connect()
                    #self.api_reconnect(key)

                if not connect or self.api[key].status != "Connected":
                    not_connected.append(key.replace("_default", ""))
                else:
                    connected.append(key.replace("_default", ""))

        self.logging.info("Checked device connections (duration=" + str(round(time.time() - start_time, 1)) +
                          "s / interval=" + str(self.checking_interval) + "s) ...")
        if len(connected) > 0:
            self.logging.info("-> CONNECTION OK: " + ", ".join(connected))
        if len(not_connected) > 0:
            self.logging.info("-> NO CONNECTION: " + ", ".join(not_connected))

    def check_activity(self):
        """
        check when the last command was send and if an auto-off has to be reflected in the system status
        """
        self.logging.debug(".................... CHECK ACTIVITY (" + str(self.checking_interval) +
                           "s) ....................")

        active = []
        inactive = []
        auto_off = []

        for key in self.api:
            if key not in self.api_device_list:
                if key not in self.info_no_devices_found or not self.info_no_devices_found[key]:
                    self.logging.warning("Device Activity: Could not find list of devices for '" + key + "'; " +
                                         "Assumption: no devices connected yet.")
                    self.info_no_devices_found[key] = True
                continue

            device_list = self.api_device_list[key]
            self.logging.debug(" * " + key + " : " + str(device_list))
            if self.api[key].last_action > 0:
                self.logging.debug("   -> " + str(round((time.time() - self.api[key].last_action)*10)/10) +
                                   "s  (" + self.api[key].last_action_cmd + ")")
                active.append(key.replace("_default", "") +
                              " (" + str(round((time.time() - self.api[key].last_action)*10)/10) + "s)")
            else:
                self.logging.debug("   -> INACTIVE since server start")
                inactive.append(key.replace("_default", ""))

            for device in device_list:
                auto_power_off = self.device_auto_power_off(device)
                if auto_power_off != -1:
                    self.logging.debug("   -> " + device + " - auto-off: " + str(auto_power_off))
                    if auto_power_off["switch_off"]:
                        self.device_save_status(device, button="power", status="OFF")

        self.logging.info("Checked device activity (interval=" + str(self.checking_interval) + "s) ...")
        if len(active) > 0:
            self.logging.info("-> ACTIVITY: " + ", ".join(active))
        if len(inactive) > 0:
            self.logging.info("-> INACTIVE: " + ", ".join(inactive))

    def load_api_connectors(self):
        """
        load API connectors
        """
        config_dev = self.config.read(rm3presets.active_devices)
        config_api = self.config.read(rm3presets.active_apis)

        if self.api_first_load:
            self.logging.info(".................... 1st CONNECT OF INTERFACES ....................")
            self.api_first_load = False
        else:
            self.logging.info(".................... RECONNECT OF INTERFACES ....................")

        api_devices = []
        for device in config_dev:
            api = config_dev[device]["config"]["api_key"]
            dev = config_dev[device]["config"]["api_device"]
            api_dev = api + "_" + dev
            if api_dev not in api_devices:
                api_devices.append(api_dev)
            if api_dev not in self.api_device_list:
                self.api_device_list[api_dev] = []
            self.api_device_list[api_dev].append(device)

        self.logging.debug("---> api_device_list: " + str(self.api_device_list))

        if config_api != {}:
            for api in config_api:
                if api not in self.api_modules:
                    self.logging.error("API Connector for '" + api + "' not available.")
                    continue
                for api_device in config_api[api]["devices"]:
                    api_dev = api + "_" + api_device
                    api_device_config = config_api[api]["devices"][api_device]

                    self.logging.debug("Loading API connector for '" + api_dev + "' ...")
                    cmd_interface_mod = "server.interfaces." + self.api_modules[api]

                    try:
                        self.logging.debug("Try to import module '" + cmd_interface_mod + "'")
                        module = importlib.import_module(cmd_interface_mod)
                        self.api[api_dev] = module.ApiControl(api, api_device, api_device_config, self.log_commands, self.config)

                        if api in config_api:
                            self.available[api_dev] = api_dev + " (" + config_api[api]["description"] + ")"
                        self.logging.debug("OK: Import module '" + cmd_interface_mod + "'")

                    except ModuleNotFoundError:
                        self.logging.error("Could not connect API (0): Module '" +
                                           self.api_modules[api] + ".py' not found (" + api_dev + ")")
                        self.logging.error("... if exist, check if all required modules are installed, " +
                                           "that are to be imported in this module.")
                    except AttributeError:
                        self.logging.error(f"Could not connect API (1): Class or function not found")
                    except Exception as e:
                        self.logging.error("Could not connect API (2): " + str(e) + " (" + api_dev + ")")
                    except:
                        self.logging.error("Could not connect API (3): Unknown reason (" + api_dev + ")")
            return True

        elif config_dev != {}:
            for api_dev in api_devices:
                api, api_device = api_dev.split("_")
                api_device_config = {}

                if rm3json.if_exist(rm3presets.commands + api + "/00_interface"):
                    api_config = self.config.read(rm3presets.commands + api + "/00_interface")
                    if "API-Devices" in api_config and api_device in api_config["API-Devices"]:
                        api_device_config = api_config["API-Devices"][api_device]
                    elif "API-Devices" in api_config and "default" in api_config["API-Devices"]:
                        api_device_config = api_config["API-Devices"]["default"]
                    else:
                        self.logging.warning("Error in config-file - device not defined / no default device: " +
                                             rm3presets.commands + api + "/00_interface.json")
                else:
                    self.logging.error("Error: no configuration file '00_interface.json' available for API '" +
                                       api_dev + "'.")

                if api_device_config != {}:
                    self.logging.debug("Loading API for device " + api_dev + " ...")

                    cmd_import = "import interfaces." + self.api_modules[api]
                    cmd_connect = ("interfaces." + self.api_modules[api] +
                                   ".ApiControl(api, api_device, api_device_config, self.log_commands, self.config)")

                    try:
                        exec(compile(cmd_import, "string", "exec"))
                        self.api[api_dev] = eval(cmd_connect)
                        self.logging.debug("- OK")
                        if api in config_api:
                            self.available[api_dev] = api_device + " (" + config_api[api]["description"] + ")"
                    except ModuleNotFoundError:
                        self.logging.error("Could not connect API (4): Module '" +
                                           self.api_modules[api] + ".py' not found (" + api_dev + ")")
                        self.logging.error("... if exist, check if all required modules are installed, " +
                                           "that are to be imported in this module.")
                    except Exception as e:
                        self.logging.error("Could not connect API (5): " + str(e) + " (" + api_dev + ")")
                    except:
                        self.logging.error("Could not connect API (6): Unknown reason (" + api_dev + ")")

            return True
        else:
            return False

    def api_reconnect(self, interface="", reread_config=False):
        """
        reconnect single device or all devices if status is not "Connected"

        Args:
            interface (str): interface id (<api>_<api_device>)
            reread_config (bool): reread configuration data
        """
        config = {}
        if interface in self.info_no_devices_found:
            self.info_no_devices_found[interface] = False

        if reread_config or interface == "all":
            config = self.config.interfaces_identify()
            if interface != "all":
                api, api_device = interface.split("_")
                self.api[interface].config_set(config[api]["devices"][api_device])

        ip_address = ""
        if "_" in interface:
            api, api_device = interface.split("_")
            ip_address = self.config.interface_configuration[api]["devices"][api_device]["IPAddress"]

        self.logging.debug("API (re)connect '" + str(interface) + "' (reread_config=" + str(reread_config) +
                           ";IPAddress=" + ip_address + ") ...")

        if interface == "":
            for key in self.api:
                if self.api[key].status != "Connected":
                    self.api[key].connect()

        elif interface == "all":
            for api_dev in self.api:
                api, api_device = api_dev.split("_")
                self.api[api_dev].config_set(config[api]["devices"][api_device])
                self.api[api_dev].connect()

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

        Args:
            device (str): device id
        Returns:
            str|dict: interface status or error message
        """

        api_dev = self.device_api_string(device)
        if api_dev in self.api:
            return self.api[api_dev].method
        else:
            return "ERROR: interface not defined (" + api_dev + "/" + device + ")"

    def api_get_status(self, interface="", device=""):
        """
        return status of all devices or a selected device

        Args:
            interface (str): interface id
            device (str): device id
        Returns:
            str|dict: interface status or error message
        """

        status_all_interfaces = {}
        api_dev = interface + "_" + device

        self.logging.debug(str(api_dev))

        for key in self.api:
            status_all_interfaces[key] = self.api[key].status

        if interface == "":
            interface_config = {"connect": status_all_interfaces, "active": {}}
            for key in self.config.interface_configuration:
                interface_config["active"][key] = self.config.interface_configuration[key]["active"]
            return interface_config
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

        if self.api[api_dev].count_error > 0:
            self.logging.debug("ERROR RATE ... error: " + str(is_error) +  " / " + str(self.api[api_dev].count_error))

    def api_send_directly(self, device, command, external=False):
        """
        send command directly to API of the device
        """
        answer = "N/A"
        power = "N/A"

        if device in self.api:
            command_string = self.command_api_get(device, command)
            self.logging.info("__SEND API: " + device + " | " + command + " (" + command_string + ")")
            answer = self.api[device].send_api(command_string)
            return_msg = {
                "connect": self.api[device].status,
                "command": command_string,
                "answer": answer,
                "device_id": external,
                "last_action": self.api[device].last_action,
                "last_action_cmd": self.api[device].last_action_cmd
                }
        else:
            if external:
                dev_data = device.split("||")
                api_dev = dev_data[0]
                device_id = dev_data[1]
                self.logging.info("__SEND DIRECTLY: " + api_dev + "/** | " + command)

                if self.api[api_dev].status == "Connected":
                    answer = self.api[api_dev].query(device_id, device_id, command)
                    power = "N/A"
            else:
                api_dev = self.device_api_string(device)
                device_id = self.device_id_get(device)
                self.logging.info("__SEND DIRECTLY: " + api_dev + "/" + device + " | " + command)

                if self.api[api_dev].status == "Connected":
                    answer = self.api[api_dev].query(device, device_id, command)
                    power = self.device_status(device)["status"]["power"]

            return_msg = {
                "connect": self.api[api_dev].status,
                "command": command,
                "power": power,
                "answer": answer,
                "device_id": external,
                "last_action": self.api[api_dev].last_action,
                "last_action_cmd": self.api[api_dev].last_action_cmd
                }

        return return_msg

    def api_send(self, call_api, device, button, value=""):
        """
        send command if connected
        """
        api_dev = self.device_api_string(device)

        if api_dev not in self.api:
            self.logging.warning("Could not send command, API not (yet) loaded: " + api_dev)
            return

        device_id = self.device_id_get(device)
        method = self.api_method(device)
        return_msg = ""
        self.api_errors(device)
        self.logging.info("__SEND: " + api_dev + " / " + device + "_" + button + ":" + str(value) +
                          " (" + self.api[api_dev].status + ")")
        self.add2log("send", [api_dev, device, button, str(value), self.api[api_dev].status])

        if value.startswith("set-") and method == "record":
            value = value.replace("set-", "")
            self.device_save_status(device, button=button, status=value)

        elif self.api[api_dev].status == "Connected":

            if button.startswith("send-"):

                button = button.replace("send-", "")
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
                    self.logging.info("__SEND-DATA " + api_dev + " / " + button +
                                      " ('" + str(value) + "'/" + method + ")")
                    self.logging.debug("            " + str(button_code))

            else:
                if method == "record":
                    button_code = self.command_get(call_api, "buttons", device, button)
                elif method == "query" and value == "":
                    button_code = self.command_get(call_api, "buttons", device, button)
                else:
                    button_code = self.command_create(call_api, device, button, value)

                if self.log_commands:
                    self.logging.info("__SEND " + api_dev + " / " + button +
                                      " ('" + str(value) + "'/" + method + ")")
                    self.logging.debug("       " + str(button_code))

            # send if not error
            if api_dev in self.api and "ERROR" not in button_code:
                return_msg = self.api[api_dev].send(device, device_id, button_code)
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
                self.logging.debug(return_msg)

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
        device_id = self.device_id_get(device)
        self.api_errors(device)

        self.logging.info("__RECORD " + api_dev + " (" + self.api[api_dev].status + ")")
        self.add2log("record", [api_dev, device, button, "", self.api[api_dev].status])

        if self.api[api_dev].status == "Connected":
            if api_dev in self.api:
                return_msg = self.api[api_dev].record(device, button, device_id)
            else:
                return_msg = "ERROR: API not available (" + api_dev + ")"

            if self.log_commands:
                self.logging.debug("...... " + str(return_msg))

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
        Query an information from device via API.

        Values are store in self.config.cache[active_devices_key][device_id][category][key] and written to the main
        config file _ACTIVE-DEVICES.json via self.config.device_set_values(self, device_id, category, values).
        They can be requested using self.config.read(rm3presets.active_devices)[device_id].
        """
        button_code = ""
        api_dev = self.device_api_string(device)
        device_id = self.device_id_get(device)
        # self.check_errors(call_api, device)  #### -> leads to an error for some APIs

        self.logging.debug("__QUERY " + api_dev + " (" + device + "," + button + ";" + self.api[api_dev].status + ")")
        self.add2log("query", [api_dev, device, button, self.api[api_dev].status])

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
                return_msg = self.api[api_dev].query(device, device_id, button_code)
            else:
                return_msg = "ERROR: API not available (" + str(api_dev) + ")"

            if self.log_commands:
                self.logging.debug("__QUERY " + api_dev + " / " + button + " ('" + button_code + ")")
                self.logging.debug("        " + str(return_msg))

        else:
            return_msg = self.api[api_dev].status

        if "ERROR" in str(return_msg) or "error" in str(return_msg):

            if "'ApiControl' object has no attribute 'api'" in return_msg:
                return_msg = "ERROR: Interface not ready yet (" + api_dev + ")"
            elif "Device is off" in return_msg:
                self.logging.debug(return_msg)
                return return_msg

            if self.last_message != return_msg:
                self.logging.debug(return_msg)
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
        active = self.config.read_status()

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

            return self.config.device_set_values(device, "status", active[device]["status"])

        else:
            return "ERROR record_status: device not found"

    def device_api_string(self, device):
        """
        return short api_dev
        """
        try:
            active_devices = self.config.read_status()
            api = active_devices[device]["config"]["api_key"]
            dev = active_devices[device]["config"]["api_device"]
            return api + "_" + dev

        except:
            return "error_" + device

    def device_status(self, device) -> dict:
        """
        get status for a specific device
        """
        active_devices = self.config.read_status()
        if device in active_devices:
            return active_devices[device]
        else:
            return {"ERROR":  device}

    def device_configuration(self, device):
        """
        return configuration file of a device

        Args:
            device (str): device id
        Returns:
            dict: return message
        """
        active = self.config.read_status()
        if device in active:
            device_code = active[device]["config"]["device"]
            device_api = active[device]["config"]["api_key"]
            device_config = self.config.read(rm3presets.commands + device_api + "/" + device_code)
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

    def device_id_get(self, device):
        """
        identify unique device ID if define in device configuration

        Args:
            device (str): internal device ID
        Returns:
            str: external device ID, if defined; otherwise absolute internal ID <API>_<API-Device>_<device>
        """
        active = self.config.read_status()
        if device in active and "device_id" in active[device]["config"]:
            d_id = active[device]["config"]["device_id"]
        else:
            d_id = active[device]["config"]["api_key"]+"_" + active[device]["config"]["api_device"]+"_"+device
        return d_id

    def devices_available(self, interface):
        """
        get all available devices of this interface, if supported

        Args:
            interface (str): interface id
        Returns:
            dict: available devices with following parameters: id, name, supported, disabled, description
        """
        if interface in self.api:
            result = self.api[interface].devices_available()
            return result
        else:
            self.logging.warning("devices_available() ... API for '" + interface + "' not loaded.")
            return {}

    def device_listen(self, interface, active):
        """
        activate / disable listen mode new ZigBee devices

        Args:
            interface (str): interface id
            active (bool): True to activate, False to disable
        """
        if interface in self.api:
            return self.api[interface].devices_listen(active)
        else:
            self.logging.warning("devices_listen() ... API for '" + interface + "' not loaded.")
            return {}

    def command_get(self, dev_api, button_query, device, button):
        """
        translate device and button to command for the specific device
        """
        active = self.config.read_status()
        api = dev_api.split("_")[0]

        if button_query == "queries":
            type_new = "get"
        elif button_query == "send-data":
            type_new = "set"
        else:
            type_new = "N/A"

        if device in active:
            device_code = active[device]["config"]["device"]
            if "device_id" in active[device]["config"]:
                device_id = active[device]["config"]["device_id"]
            else:
                device_id = "N/A"
            device_file = rm3presets.commands + api + "/" + device_code
            buttons_device = self.device_configuration(device)
            if rm3json.if_exist(device_file):
                if self.log_commands:
                    self.logging.debug("...... button-file: " + device_file + ".json")
                    self.logging.debug("...... " + str(buttons_device))
            else:
                return "ERROR: device configuration isn't correct: " + device_file + " / " + str(buttons_device)

            device_default = rm3presets.commands + api + "/00_default"
            if rm3json.if_exist(device_default):
                buttons_default = self.config.read(device_default)
                if self.log_commands:
                    self.logging.debug("...... button-default-file: " + device_default + ".json")
                    self.logging.debug("...... " + str(buttons_default))
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

    def command_api_get(self, api_dev, command):
        """
        get command string for API command
        """
        self.logging.info("command_api_get: " + api_dev + "::" + command)

        api, api_device = api_dev.split("_")
        config = self.config.read(rm3presets.commands + api + "/00_default")
        self.logging.debug("command_api_get: " + str(config))

        if "data" in config and "api_commands" in config["data"] and command in config["data"]["api_commands"]:
            return config["data"]["api_commands"][command]
        else:
            return ""

    def command_create(self, dev_api, device, button, value):
        """
        create command with "button" and value, including check if value is correct
        """

        # read data -> to be moved to cache?!
        active = self.config.read_status()
        api = dev_api.split("_")[0]

        if device in active:
            device_code = active[device]["config"]["device"]
            buttons = self.device_configuration(device)

            # add button definitions from default.json if exist
            if rm3json.if_exist(rm3presets.commands + api + "/00_default"):
                buttons_default = self.config.read(rm3presets.commands + api + "/00_default")

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

    def add2log(self, source, commands):
        """
        add an entry to the internal temporary logging which can be requested using an API command

        Args:
            source (str): query type values - send, send_makro, request (tbc.)
            commands (list): list of parameters
        """
        log_time = self.config.local_time().strftime("%H:%M:%S.%f")

        if source not in self.api_log:
            self.api_log[source] = []
        self.api_log[source].insert(0, log_time + "  " + str(commands))
        if len(self.api_log) > self.api_log_length:
            self.api_log.pop()

    def get_query_log(self):
        """
        return query log for API call
        """
        return self.api_log