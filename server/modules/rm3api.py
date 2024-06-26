import time
import modules.rm3presets as rm3presets
from modules.rm3classes import RemoteDefaultClass
from datetime import datetime


class RemoteAPI(RemoteDefaultClass):
    """
    Class with API commands
    """

    def __init__(self, data, edit, config, apis, queue, queue_send, timer):
        """
        Class constructor for Remote API

        Args:
            data (server.modules.rm3data.RemotesData): handler for remote data
            edit (server.modules.rm3data.RemotesEdit): handler for remote data
            config (server.modules.rm3cache.ConfigCache): config file handler
            apis (server.interfaces.Connect): handler for device APIS
            queue (server.modules.rm3queue.QueueApiCalls): handler for query queue
            queue_send (server.modules.rm3queue.QueueApiCalls): handler for send queue
        """
        RemoteDefaultClass.__init__(self, "rm-api", "RemoteAPI")
        self.logging.info("Loading " + self.name)

        self.config = config
        self.data = data
        self.apis = apis
        self.queue = queue
        self.queue_send = queue_send
        self.edit = edit
        self.timer = timer
        self.errors = {}

    def _api_CONFIG(self):
        """
        collect configuration information

        Returns:
            dict: information for "CONFIG" section
        """
        templates = self.data.templates_read()
        apis = self.data.devices_read_api_structure()
        apis_commands = self.data.devices_read_api_commands(apis)
        apis_detect = self.data.devices_read_api_new_devices()
        macros = self.data.macros_read()

        config = {
            "apis": {
                "list":                 list(apis.keys()),
                "list_devices":         list(self.apis.available.keys()),
                "list_description":     self.apis.available,
                "list_detect":          apis_detect,
                "list_api_commands":    apis_commands,
                "structure":            apis
                },
            "devices":                  self.data.devices_read_config(),
            "elements": {
                "button_images":        self.config.read(rm3presets.icons_dir + "/index"),
                "button_colors":        self.config.read(rm3presets.buttons + "button_colors"),
                "scene_images":         self.config.read(rm3presets.scene_img_dir + "/index")
                },
            "macros": {
                "device-on":            macros["dev-on"],
                "device-off":           macros["dev-off"],
                "global":               macros["macro"]
            },
            "main-audio":               "NONE",
            "methods":                  self.apis.methods,
            "scenes":                   self.data.scenes_read(None, True),
            "templates": {
                "definition":           templates["templates"],
                "list":                 templates["template_list"]
                }
            }
        for device in config["devices"]:
            if ("main-audio" in config["devices"][device]["settings"] and
                    config["devices"][device]["settings"]["main-audio"] == "yes"):
                config["main-audio"] = device
                break
        return config.copy()

    def _api_STATUS(self):
        """
        collect status information for system, interfaces and devices

        Returns:
            dict: information for "STATUS" section
        """
        status = {
            "config_errors":    self.data.errors,
            "connections":      self.data.api_devices_connections(),
            "devices":          self.data.devices_status(),
            "scenes":           self.data.scenes_status(),
            "interfaces":       self.apis.api_get_status(),
            "request_time":     self.queue_send.average_exec,
            "system": {
                "message":                  rm3presets.server_status,
                "server_start":             rm3presets.start_time,
                "server_start_duration":    rm3presets.start_duration,
                "server_running":           time.time() - rm3presets.start_time
                },
            "system_health": {}  # to be filled in self._end()
            }

        for key in rm3presets.server_health:
            if rm3presets.server_health[key] == "stopped" or rm3presets.server_health[key] == "registered":
                status["system_health"][key] = rm3presets.server_health[key]
            else:
                status["system_health"][key] = round(time.time() - rm3presets.server_health[key], 2)

        return status

    def _start(self, setting=None):
        """
        create data structure for API response and read relevant data from config files

        Args:
            setting (list): values can be "status-only", "request-only" or empty
        Returns:
            dict: CONFIG and STATUS element for API response
        """
        # set time for last action -> re-read API information only if clients connected
        if setting is None:
            setting = []

        self.config.user_action()
        data = self.config.api_init.copy()

        if "request-only" not in setting:
            data["STATUS"] = self._api_STATUS()

        if "status-only" not in setting and "request-only" not in setting:
            data["DATA"] = {}
            data["CONFIG"] = self._api_CONFIG()

        if "status-only" in setting or "request-only" in setting:
            del data["DATA"]

        data["REQUEST"] = {
            "start-time":   time.time(),
            "Button":       self.queue.last_button
            }

        return data.copy()

    def _end(self, data, setting=None):
        """
        add system status and timing data to API response
        """
        if setting is None:
            setting = []

        data["REQUEST"]["load-time"] = (time.time() - data["REQUEST"]["start-time"])
        data["REQUEST"]["server-time"] = datetime.now().strftime("%Y-%m-%d | %H:%M | %w")

        if "CONFIG" in data:
            data["CONFIG"]["reload_status"] = self.queue.reload

        if "no-data" in setting and "DATA" in data:
            del data["DATA"]
        if "no-config" in setting and "CONFIG" in data:
            del data["CONFIG"]
        if "no-status" in setting and "STATUS" in data:
            del data["STATUS"]

        if "ERROR" in data["REQUEST"]["Return"]:
            self.logging.error(data["REQUEST"]["Return"])

        return data.copy()

    def _refresh(self):
        """
        Trigger cache update
        """
        #self.config.cache_request_update()
        pass

    def _button_toggle(self, current_value, complete_list):
        """
        get net value from list
        """
        self.logging.info("Toggle: " + current_value + ": " + str(complete_list))

        count = 0
        match = -1
        for element in complete_list:
            if current_value != element:
                count += 1
            else:
                match = count
        match += 1

        if -1 < match < len(complete_list):
            value = complete_list[match]
        elif match == len(complete_list):
            value = complete_list[0]
        else:
            value = "ERROR: value not found"

        self.logging.info("Toggle: " + current_value + ": " + value)
        return value

    def check_update(self, app_version):
        """
        Check if app is supported by this server version

        Args:
            app_version (str): app version
        Return:
            dict: API response
        """
        self._refresh()
        d = {}
        data = self._start(["request-only"])

        if app_version == rm3presets.APP_version:
            d["ReturnCode"] = "800"
            d["ReturnMsg"] = "OK: " + rm3presets.error_message("800")
        elif app_version in rm3presets.APP_support:
            d["ReturnCode"] = "801"
            d["ReturnMsg"] = "WARN: " + rm3presets.error_message("801")
        else:
            d["ReturnCode"] = "802"
            d["ReturnMsg"] = "WARN: " + rm3presets.error_message("802")

        data["REQUEST"]["Return"] = d["ReturnMsg"]
        data["REQUEST"]["ReturnCode"] = d["ReturnCode"]
        data["REQUEST"]["Command"] = "CheckUpdate"

        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_button_add(self, device, button):
        """
        Add button to a device

        Args:
            device (str): device ID
            button (str): button ID
        Return:
            dict: API response
        """
        data = self._start(["request-only"])

        data["REQUEST"]["Return"] = self.edit.button_add(device, button)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Command"] = "AddButton"

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def edit_button_delete(self, device, button_number):
        """
        Delete button from layout file

        Args:
            device (str): device ID
            button_number (int): button position in remote control definition of the device
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.button_delete(device, button_number)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Parameter"] = button_number
        data["REQUEST"]["Command"] = "DeleteButton"

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def edit_button_record(self, device, button):
        """
        Learn Button and safe to init-file

        Args:
            device (str): device ID
            button (str): button ID
        Return:
            dict: API response
        """
        data = self._start()
        interface = data["DATA"]["devices"][device]["config"]["api_key"]
        data["DATA"] = {}

        EncodedCommand = self.apis.api_record(interface, device, button)

        if "ERROR" not in str(EncodedCommand):
            data["REQUEST"]["Return"] = self.edit.button_add_command(device, button, EncodedCommand)
        else:
            data["REQUEST"]["Return"] = str(EncodedCommand)

        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Command"] = "RecordCommand"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_button_reset(self, device, button):
        """
        Delete button from layout file

        Args:
            device (str): device ID
            button (str): button ID
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.button_delete_command(device, button)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Parameter"] = button
        data["REQUEST"]["Command"] = "DeleteCommand"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_config_interface(self, interface, config):
        """
        save configuration data for interface

        Args:
            interface (str): interface id
            config (dict): interface configuration
        Returns:
            dict: API response
        """
        data = self._start(["request-only"])

        data["DATA"] = {}
        data["REQUEST"]["Command"] = "EditApiConfig"
        interfaces = []
        device_config = self.data.devices_read_config(more_details=True)

        for key in device_config:
            api = device_config[key]["interface"]["api_key"]
            if api not in interfaces:
                interfaces.append(api)

        if interface == "all":
            data["REQUEST"]["Return"] = "ERROR: Parameter '" + interface + "' not supported!"
            data["DATA"]["interface"] = "all"

        elif "_" in interface and interface.split("_")[0] in interfaces:
            api, dev = interface.split("_")
            data["REQUEST"]["Return"] = "OK: saved interface configuration (" + interface + ")"
            data["DATA"]["interface"] = interface
            config_org = self.config.read(rm3presets.commands + api + "/00_interface")
            config_org["API-Devices"][dev] = config
            try:
                self.config.write(rm3presets.commands + api + "/00_interface", config_org)
            except Exception as e:
                data["REQUEST"]["Return"] = "ERROR: Could not save configuration for '" + interface + "': " + str(e)
                data["DATA"]["interface"] = "all"

        elif interface in interfaces:
            data["REQUEST"]["Return"] = "OK: saved interface configuration (" + interface + ")"
            data["DATA"]["interface"] = interface
            try:
                self.config.write(rm3presets.commands + interface + "/00_interface-test", data)
            except Exception as e:
                data["REQUEST"]["Return"] = "ERROR: Could not save configuration for '" + interface + "': " + str(e)
                data["DATA"]["interface"] = "all"

        else:
            data["REQUEST"]["Return"] = "ERROR: Interface '" + interface + "' not found!"
            data["DATA"]["interface"] = interface

        self._refresh()
        data = self._end(data, ["no-config", "no-status"])
        return data

    def edit_device(self, device, info):
        """
        Edit data of device

        Args:
            device (str): device id
            info (dict): device information
        Return:
            dict: API response
        """
        self.logging.info(str(info))

        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_edit(device, info)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Command"] = "EditDevice"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_device_add(self, device, device_data):
        """
        add device in config file and create config files for remote and command

        Args:
            device (str): device id
            device_data (dict): device information
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_add(device, device_data)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Parameter"] = device_data
        data["REQUEST"]["Command"] = "AddDevice"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_device_delete(self, device):
        """
        delete device from config file and delete device related files

        Args:
            device (str): device id
        Return:
            dict: API response
        """

        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_delete(device)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Command"] = "DeleteDevice"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_remote_template(self, device, template):
        """
        add / overwrite remote template

        Args:
            device (str): device id
            template (str): template id
        Returns:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.remote_add_template(device, template)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Parameter"] = template
        data["REQUEST"]["Command"] = "AddTemplate"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_remote_macros(self, macros):
        """
        Change Macros and save to _ACTIVE-MACROS.json

        Args:
            macros (dict): macro information
        Returns:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.remote_edit_macros(macros)
        data["REQUEST"]["Command"] = "ChangeMacros"
        data = self._end(data, ["no-config", "no-data", "no-status"])
        return data

    def edit_remote_move(self, remote_type, device, direction):
        """
        Move position of device in start menu and drop down menu

        Args:
            remote_type (str): type of remote control ('device' or 'scene')
            device (str): device id
            direction (int): steps to move remove forward or backward
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.remote_move(remote_type, device, direction)
        data["REQUEST"]["Command"] = "RemoteMove"

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def edit_remote_visibility(self, remote_type, device, value):
        """
        change visibility of device in config file

        Args:
            remote_type (str): type of remote control ('device' or 'scene')
            device (str): device id
            value (str): visibility ('yes' or 'no')
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.remote_visibility(remote_type, device, value)
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Parameter"] = value
        data["REQUEST"]["Command"] = "ChangeVisibility"

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def edit_scene(self, scene, info):
        """
        Edit data of scene

        Args:
            scene (str): scene id
            info (dict): scene information
        Return:
            dict: API response
        """
        self.logging.info(str(info))

        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.scene_edit(scene, info)
        data["REQUEST"]["Scene"] = scene
        data["REQUEST"]["Command"] = "EditScene"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_scene_add(self, scene, info):
        """
        add device in config file and create config files for remote and command

        Args:
            scene (str): scene id
            info (dict): scene information
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.scene_add(scene, info)
        data["REQUEST"]["Scene"] = scene
        data["REQUEST"]["Parameter"] = info
        data["REQUEST"]["Command"] = "AddScene"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def edit_scene_delete(self, scene):
        """
        delete device from config file and delete device related files

        Args:
            scene (str): scene id
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.scene_delete(scene)
        data["REQUEST"]["Scene"] = scene
        data["REQUEST"]["Command"] = "DeleteScene"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def get_config(self):
        """
        Load and list all data

        Return:
            dict: API response
        """
        data = self._start()
        data["REQUEST"]["Return"] = "OK: Returned list and status data."
        data["REQUEST"]["Command"] = "List"
        data = self._end(data)
        return data

    def get_config_device(self, device):
        """
        get configuration data for device

        Args:
            device (str): device id
        Return:
            dict: API response
        """
        data = self._start(["request-only"])

        data["DATA"] = {}
        device_config = self.data.devices_read_config(more_details=True)

        if device in device_config:
            api = device_config[device]["interface"]["api_key"]
            api_config = self.config.read(rm3presets.commands + api + "/00_interface")

            data["REQUEST"]["Return"] = "OK"
            data["DATA"]["device"] = device
            data["DATA"][device] = device_config[device]
            data["DATA"][device]["interface_details"] = api_config

        elif device == "all":
            data["REQUEST"]["Return"] = "OK"
            data["DATA"]["device"] = "all"
            data["DATA"]["devices"] = device_config

            for key in device_config:
                api = device_config[key]["interface"]["api_key"]
                api_method = device_config[key]["interface"]["method"]
                api_config = self.config.read(rm3presets.commands + api + "/00_interface")

                if "ERROR" not in str(api_config):
                    data["DATA"]["devices"][key]["interface_details"] = str(api_config)
                    # PROBLEM if not converted to string!

        else:
            data["REQUEST"]["Return"] = "ERROR"
            data["DATA"]["device"] = device
            data["DATA"][device] = {"error": "Device '" + device + "' not found!"}

        data = self._end(data, ["no-config", "no-status"])
        return data

    def get_config_interface(self, interface):
        """
        get configuration data for interface

        Args:
            interface (str): interface id
        Return:
            dict: API response
        """
        data = self._start(["request-only"])

        data["DATA"] = {}

        interfaces = []
        device_config = self.data.devices_read_config(more_details=True)
        api_config = self.config.interface_configuration

        self.logging.debug("get_config_interface: " + str(device_config.keys()))

        for api in api_config:
            if api not in interfaces:
                interfaces.append(api)

        if interface == "all":
            data["REQUEST"]["Return"] = "OK"
            data["DATA"]["interface"] = "all"
            data["DATA"]["interfaces"] = {}
            for api in interfaces:
                api_config = self.config.read(rm3presets.commands + api + "/00_interface")
                # data["DATA"]["interfaces"][api] = str(api_config)
                for key1 in api_config["API-Devices"]:
                    for key2 in api_config["API-Devices"][key1]:
                        if key2 == "MACAddress":
                            api_config["API-Devices"][key1][key2] = str(api_config["API-Devices"][key1][key2])

                data["DATA"]["interfaces"][api] = api_config

        elif interface in interfaces:
            data["REQUEST"]["Return"] = "OK"
            data["DATA"]["interface"] = interface
            api_config = self.config.read(rm3presets.commands + interface + "/00_interface")
            for key1 in api_config["API-Devices"]:
                for key2 in api_config["API-Devices"][key1]:
                    if key2 == "MACAddress":
                        api_config["API-Devices"][key1][key2] = str(api_config["API-Devices"][key1][key2])
            data["DATA"][interface] = api_config

        else:
            data["REQUEST"]["Return"] = "ERROR"
            data["DATA"]["interface"] = interface
            data["DATA"][interface] = {"error": "Interface '" + interface + "' not found!"}

        data = self._end(data, ["no-config", "no-status"])
        return data

    def get_timer(self):
        """
        Load and list all data

        Return:
            dict: API response
        """
        data = self._start()
        data["REQUEST"]["Return"] = "OK: Returned timer data."
        data["REQUEST"]["Command"] = "Get timer"
        data["DATA"] = {"timer": self.timer.get_timer_events()}
        data = self._end(data, ["no-config", "no-status"])
        return data

    def edit_timer(self, timer_id, timer_config):
        """
        edit data of a timer event

        Args:
            timer_id (str): timer id
            timer_config (dict): timer configuration
        Return:
            dict: API response
        """
        data = self._start()

        if timer_id != "NEW_TIMER_ID":
            data["REQUEST"]["Return"] = "OK: Edit timer data (" + str(timer_id) + ")"
            data["REQUEST"]["Command"] = "Edit timer"
            self.timer.schedule_timer_edit(timer_id, timer_config)
        else:
            data["REQUEST"]["Return"] = "OK: Create new timer"
            data["REQUEST"]["Command"] = "Create new timer"
            self.timer.schedule_timer_add(timer_config)

        data = self._end(data, ["no-config", "no-status", "no-data"])
        return data

    def edit_timer_try(self, timer_id):
        """
        edit timer event to queue to try out immediately

        Args:
            timer_id (str): timer id
        Return:
            dict: API response
        """
        data = self._start(["request-only"])

        data["REQUEST"]["Return"] = "OK: Added timer to queue. It will run within the next minute."
        data["REQUEST"]["Command"] = "Try out timer"
        self.timer.schedule_timer_try(timer_id)

        data = self._end(data, ["no-config", "no-status", "no-data"])
        return data

    def edit_timer_delete(self, timer_id):
        """
        edit data of a timer event

        Args:
            timer_id (str): timer id
        Return:
            dict: API response
        """
        data = self._start()
        data["REQUEST"]["Return"] = "OK: Delete timer data (" + str(timer_id) + ")"
        data["REQUEST"]["Command"] = "Delete timer"
        self.timer.schedule_timer_delete(timer_id)
        data = self._end(data, ["no-config", "no-status", "no-data"])
        return data

    def reload(self):
        """
        reload interfaces and reload config data in cache

        Return:
            dict: API response
        """
        self.logging.warning("Request cache reload and device reconnect.")

        self._refresh()
        time.sleep(1)

        data = self._start()
        data["REQUEST"]["Return"] = "OK: Configuration reloaded"
        data["REQUEST"]["Command"] = "Reload"

        self.apis.api_reconnect()
        self.data.devices_get_status(data["STATUS"]["devices"], read_api=True)

        data = self._end(data, ["no-data"])
        return data

    def reconnect_api(self, interface):
        """
        trigger reconnect of APIs
        """
        data = self._start()
        data["REQUEST"]["Return"] = "OK: Configuration reloaded"
        data["REQUEST"]["Command"] = "Reload"

        self.apis.api_reconnect(interface, True)

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_api(self, device, command):
        """
        Execute API command given as parameter and return value

        Args:
            device (str): device id
            command (str): device API command
        Returns:
            dict: API response
        """
        data = self._start(["request-only"])

        status = self.apis.device_status(device)["status"]
        if "power" in status:
            pwr_status = status["power"]
        else:
            pwr_status = "N/A"

        data["REQUEST"]["Return"] = {
            "answer": self.apis.api_send_directly(device, command),
            "device": device,
            "command": command,
            "interface": self.apis.device_api_string(device),
            "status": pwr_status
        }
        data["REQUEST"]["Command"] = "RemoteSendApiCmd"

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_api_command(self, api_command):
        """
        send a command to an API device (without device respective remote definition)
        """
        data = self._start([])
        interfaces = data["CONFIG"]["apis"]["list_api_commands"]

        api_dev = ""
        command = ""
        if "::" in api_command:
            api_dev, command = api_command.split("::")

        if api_dev in interfaces and command in interfaces[api_dev]:
            data["REQUEST"]["Return"] = {
                "answer": self.apis.api_send_directly(api_dev, command),
                "api_device": api_dev,
                "command": api_command
            }
        elif api_dev in interfaces:
            data["REQUEST"]["Return"] = {
                "error": "Given API Device doesn't have this command (" + api_dev + ": " + command + ")",
                "command": api_command
            }
        elif api_dev != "":
            data["REQUEST"]["Return"] = {
                "error": "Given API Device isn't defined (" + api_dev + ")",
                "command": api_command
            }
        else:
            data["REQUEST"]["Return"] = {
                "error": "Command doesn't contain an API Device",
                "command": api_command
            }

        data["REQUEST"]["Command"] = "RemoteSendApiDeviceCmd"
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_api_value(self, device, command, value):
        """
        send command incl. value and return JSON msg

        Args:
            device (str): device id
            command (str): command
            value (Any): value
        Return:
            dict: API response
        """
        data = self._start()
        interface = data["CONFIG"]["devices"][device]["interface"]["api"]
        method = self.apis.api_method(device)

        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = command
        data["REQUEST"]["Command"] = "Set"

        if method == "query":
            # data["REQUEST"]["Return"] = self.apis.send(interface,device,command,value)
            data["REQUEST"]["Return"] = self.queue_send.add2queue([[interface, device, command, value]])
            self.data.devices_get_status(data, read_api=True)

        elif method == "record":
            data["REQUEST"]["Return"] = self.edit.device_status_set(device, command, value)
            self.data.devices_get_status(data, read_api=True)

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_button(self, device, button):
        """
        send command and return JSON msg

        Args:
            device (str): device id
            button (str): button id
        Return:
            dict: API response
        """
        data = self._start()
        interface = data["CONFIG"]["devices"][device]["interface"]["api"]
        data["REQUEST"]["Command"] = "Remote"
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button

        if device in data["CONFIG"]["devices"] and button in data["CONFIG"]["devices"][device]["buttons"]:
            data["REQUEST"]["Return"] = self.queue_send.add2queue([[interface, device, button, ""]])

        elif device not in data["CONFIG"]["devices"]:
            data["REQUEST"]["Return"] = "ERROR: device '" + device + "' doesn't exist."
            data["REQUEST"]["Return"] = "ERROR: button '" + button + "' not defined for device '" + device + "'."

        if "ERROR" in data["REQUEST"]["Return"]:
            self.logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"] = self.edit.device_status_get(device, "power")  # to be removed
        data["ReturnMsg"] = data["REQUEST"]["Return"]  # to be removed

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_button_on_off(self, device, button):
        """
        send button with on or off command, consider old power status and document new status

        Args:
            device (str): device id
            button (str): button id
        Return:
            dict: API response
        """
        status = ""
        current_status = ""
        types = {}
        presets = {}
        dont_send = False

        data = self._start()

        method = self.apis.api_method(device)
        interface = data["CONFIG"]["devices"][device]["interface"]["api_key"]
        api_dev = data["CONFIG"]["devices"][device]["interface"]["api"]

        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Command"] = "SendButton (Check Values)"

        self.logging.info("__BUTTON: " + device + "/" + button + " (" + interface + "/" + method + ")")

        # if recorded values, check against status quo
        if method == "record":

            # Get method and presets
            definition = data["CONFIG"]["devices"][device]["commands"]["definition"]

            # special with power buttons / and vol buttons
            if button == "on-off" or button == "on" or button == "off":
                value = "power"
            elif button[-1:] == "-" or button[-1:] == "+":
                value = button[:-1]
            else:
                value = button

            # get status
            current_status = self.edit.device_status_get(device, value)
            device_status = self.edit.device_status_get(device, "power")

            data["REQUEST"]["status_device"] = device_status
            data["REQUEST"]["status_value"] = current_status

            # buttons power / ON / OFF
            if value == "power":
                if button == "on":
                    status = "ON"
                if button == "off":
                    status = "OFF"
                if button == "on-off":
                    status = self._button_toggle(current_status, ["ON", "OFF"])

            # other buttons
            elif value in definition and "type" in definition[value] \
                    and ("values" in definition[value] or "param" in definition[value]):

                d_type = definition[value]["type"]
                if "param" in definition[value]:
                    d_values = definition[value]["param"]
                else:
                    d_values = definition[value]["values"]

                if device_status == "ON":
                    if d_type == "enum":
                        status = self._button_toggle(current_status, d_values)

                    elif d_type == "integer" and "min" in d_values and "max" in d_values:
                        minimum = int(d_values["min"])
                        maximum = int(d_values["max"])
                        direction = button[-1:]
                        current_status = str(current_status).strip()
                        if current_status:
                            current_status = int(current_status)
                        else:
                            current_status = 0

                        if direction == "+" and current_status < maximum:
                            status = current_status + 1
                        elif direction == "+":
                            dont_send = True
                        elif direction == "-" and current_status > minimum:
                            status = current_status - 1
                        elif direction == "-":
                            dont_send = True

                    else:
                        self.logging.warning("RemoteOnOff - Unknown command definition: " +
                                             device + "_" + button + ":" + value +
                                             " (" + d_type + "/" + str(d_values) + ")")

                else:
                    self.logging.debug("RemoteOnOff - Device is off: " + device)
                    dont_send = True

            # ----------------------------- OLD
            # other buttons with defined values
            elif value in types and value in presets:

                if device_status == "ON":

                    if types[value]["type"] == "enum":
                        status = self._button_toggle(current_status, presets[value])

                    if types[value]["type"] == "integer":
                        minimum = int(presets[value]["min"])
                        maximum = int(presets[value]["max"])
                        direction = button[-1:]
                        current_status = str(current_status).strip()
                        if current_status:
                            current_status = int(current_status)
                        else:
                            current_status = 0

                        if direction == "+" and current_status < maximum:
                            status = current_status + 1
                        elif direction == "+":
                            dont_send = True
                        elif direction == "-" and current_status > minimum:
                            status = current_status - 1
                        elif direction == "-":
                            dont_send = True

                else:
                    self.logging.debug("RemoteOnOff - Device is off: " + device)
                    dont_send = True
            # ----------------------------- OLD

            else:
                self.logging.warning("RemoteOnOff - Command not defined: " + device + "_" + value)
                self.logging.debug("types = " + str(types) + " / presets = " + str(presets))

        self.logging.debug("... add to queue [" + str(api_dev) + "," + str(device) + "," + str(button) +
                           "," + str(status) + "]")

        if dont_send:
            data["REQUEST"]["Return"] = ("Dont send " + device + "/" + button +
                                         " as values not valid (" + str(current_status) + ").")
        else:
            data["REQUEST"]["Return"] = self.queue_send.add2queue([[api_dev, device, button, status]])

        self._refresh()
        data["DATA"] = {}
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def send_macro_buttons(self, macro):
        """
        execute macro (list of commands)

        Args:
            macro (str): string, list of button or macro IDs separated by the substring '::'
        Return:
            dict: API response
        """

        # !!! Auf Config statt auf DATA Zugreifen!
        # !!! dev-on zu device-on; dev-off zu device-off; macro zu global
        # !!! scene-on/off aus scene ziehen

        data = self._start()
        data["REQUEST"]["Button"] = macro
        data["REQUEST"]["Return"] = "ERROR: Started but not finished..."  # self.apis.send(interface,device,button)
        data["REQUEST"]["Command"] = "Macro"

        commands_1st = macro.split("::")
        commands_2nd = []
        commands_3rd = []
        commands_4th = []
        commands_dont_exist = []
        return_msg = ""

        self.logging.debug("Decoded macro-string 1st: " + str(commands_1st))

        # decode macros: scene-on/off
        for command in commands_1st:
            command_str = str(command)
            if not command_str.isnumeric() and "_" in command:
                device, button = command.split("_", 1)
                if "scene-on_" in command:

                    if button not in data["CONFIG"]["scenes"]:
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (scene '"+button+"' not found)")

                    elif (button in data["CONFIG"]["scenes"] and
                            "macro-scene-on" in data["CONFIG"]["scenes"][button]["remote"]):
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (scene '" + button + "' has no scene-macros)")

                    else:
                        commands_2nd.extend(data["CONFIG"]["scenes"][button]["remote"]["macro-scene-on"])

                elif "scene-off_" in command:
                    if button not in data["CONFIG"]["scenes"]:
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (scene '"+button+"' not found)")

                    elif (button in data["CONFIG"]["scenes"] and
                            "macro-scene-on" in data["CONFIG"]["scenes"][button]["remote"]):
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (scene '" + button + "' has no scene-macros)")

                    else:
                        commands_2nd.extend(data["CONFIG"]["scenes"][button]["remote"]["macro-scene-off"])

                else:
                    commands_2nd.extend([command])
            else:
                commands_2nd.extend([command])

        self.logging.debug("Decoded macro-string 2nd: " + str(commands_2nd))

        # decode macros: dev-on/off
        for command in commands_2nd:
            command_str = str(command)
            if not command_str.isnumeric() and "_" in command:
                device, button = command.split("_", 1)
                if "dev-on_" in command or "device-on_" in command:
                    if button in data["CONFIG"]["macros"]["device-on"]:
                        commands_3rd.extend(data["CONFIG"]["macros"]["device-on"][button])
                    else:
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (no such dev-on macro defined)")

                elif "dev-off_" in command or "device-off_" in command:
                    if button in data["CONFIG"]["macros"]["device-off"]:
                        commands_3rd.extend(data["CONFIG"]["macros"]["device-off"][button])
                    else:
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (no such dev-off macro defined)")

                else:
                    commands_3rd.extend([command])
            else:
                commands_3rd.extend([command])

        self.logging.debug("Decoded macro-string 3rd: " + str(commands_3rd))

        # decode macros: macro
        for command in commands_3rd:
            command_str = str(command)
            if not command_str.isnumeric() and "_" in command:
                device, button = command.split("_", 1)
                if "macro_" in command or "global_" in command:
                    if button in data["CONFIG"]["macros"]["global"]:
                        commands_4th.extend(data["CONFIG"]["macros"]["global"][button])
                    else:
                        return_msg += "; ERROR: macro not defined (" + command + ")"
                        commands_dont_exist.append(command + " (no such global macro defined)")
                else:
                    commands_4th.extend([command])
            else:
                commands_4th.extend([command])

        self.logging.debug("Decoded macro-string 4th: " + str(commands_4th))

        # check if buttons exist ...
        commands_exist = []
        for command in commands_4th:
            command_str = str(command)
            if not command_str.isnumeric() and "_" in command:
                device, button_status = command.split("_")
                if "||" in button_status:
                    button, status = button_status.split("||")
                else:
                    button = button_status
                if device not in data["CONFIG"]["devices"]:
                    commands_dont_exist.append(command + " (device '"+device+"' not found)")

                elif device in data["CONFIG"]["devices"] and button not in data["CONFIG"]["devices"][device]["buttons"]:
                    commands_dont_exist.append(command + " (button '"+button+"' for '" + device + "' not found)")
                else:
                    commands_exist.append(command)
            elif not command_str.isnumeric() and "WAIT-" not in command_str:
                commands_dont_exist.append(command)
            elif "WAIT-" in command_str:
                pass
            else:
                commands_exist.append(command)

        # execute buttons
        for command in commands_exist:
            command_str = str(command)
            if not command_str.isnumeric() and "_" in command:

                status = ""
                power_buttons = ["on", "on-off", "off"]
                device, button_status = command.split("_", 1)  # split device and button

                if device not in data["CONFIG"]["devices"]:
                    error_msg = "; ERROR: Device defined in macro not found (" + device + ")"
                    return_msg += error_msg
                    self.logging.error(error_msg)
                    continue

                interface = data["CONFIG"]["devices"][device]["interface"]["api_key"]  # get interface / API

                # check if future state defined
                if "||" in button_status:
                    button, status = button_status.split("||", 1)  # split button and future state
                    if "-" not in status:
                        status = status.upper()
                else:
                    button = button_status

                if button in power_buttons:
                    status_var = "power"
                else:
                    status_var = button

                # if future state not already in place add command to queue
                self.logging.debug(" ...i:" + interface + " ...d:" + device + " ...b:" + button + " ...s:" + status)

                if device in data["STATUS"]["devices"] and status_var in data["STATUS"]["devices"][device]:
                    self.logging.debug(" ...y:" + status_var + "=" +
                                       str(data["STATUS"]["devices"][device][status_var]) + " -> " + status)

                    if data["STATUS"]["devices"][device][status_var] != status:
                        return_msg += ";" + self.queue_send.add2queue([[interface, device, button, status]])

                # if no future state is defined just add command to queue
                elif status == "":
                    return_msg += ";" + self.queue_send.add2queue([[interface, device, button, ""]])

            # if command is numeric, add to queue directly (time to wait)
            elif command_str.isnumeric():
                return_msg += ";" + self.queue_send.add2queue([float(command)])

        self._refresh()
        if return_msg != "":
            data["REQUEST"]["Return"] = return_msg

        data["REQUEST"]["decoded_macro"] = ", ".join(str(e) for e in commands_4th)
        if len(commands_dont_exist) > 0:
            data["REQUEST"]["macro_error"] = ", ".join(str(e) for e in commands_dont_exist)

        data = self._end(data, ["no-config", "no-data", "no-status"])
        return data

    def send_text(self, device, button, text):
        """
        send command and return JSON msg

        Args:
            device (str): device id
            button (str): button id
            text (str): text to be send
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Device"] = device
        data["REQUEST"]["Button"] = button
        data["REQUEST"]["Command"] = "RemoteSendText"

        device_info = self.config.read_status()

        if device in device_info:
            interface = device_info[device]["config"]["api_key"]
            data["REQUEST"]["Return"] = self.queue_send.add2queue([[interface, device, button, text]])

        else:
            data["REQUEST"]["Return"] = "ERROR: Device '" + device + "' not defined."

        if "ERROR" in data["REQUEST"]["Return"]:
            self.logging.error(data["REQUEST"]["Return"])

        data["DeviceStatus"] = self.edit.device_status_get(device, "power")  # to be removed
        data["ReturnMsg"] = data["REQUEST"]["Return"]  # to be removed

        data = self._end(data, ["no-data", "no-config"])
        return data

    def set_main_audio(self, device):
        """
        set device as main audio device (and reset other)

        Args:
            device (str): device id
        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_main_audio_set(device)
        data["REQUEST"]["Command"] = "ChangeMainAudio"

        self._refresh()
        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def set_status_interface(self, interface, active):
        """
        change status if interface is active

        Args:
            interface (str): interface id
            active (str): 'True' or 'False'
        Returns:
             dict: API response
        """
        data = self._start(["request-only"])

        data["REQUEST"]["Interface"] = interface
        data["REQUEST"]["Parameter"] = active
        data["REQUEST"]["Command"] = "Change interface status"
        data["REQUEST"]["Return"] = self.config.interface_active(interface, active)

        self.apis.check_directly = True
        self._refresh()

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def set_status_api_device(self, interface, api_device, active):
        """
        change status if API device is active

        Args:
            interface (str): interface id
            api_device (str): API device id
            active (str): 'True' or 'False'
        Returns:
             dict: API response
        """
        data = self._start(["request-only"])

        data["REQUEST"]["Interface"] = interface
        data["REQUEST"]["Parameter"] = active
        data["REQUEST"]["Command"] = "Change API device status"
        data["REQUEST"]["Return"] = self.config.interface_device_active(interface, api_device, active)

        self.apis.check_directly = True
        self._refresh()

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data

    def status(self):
        """
        Load and list all data

        Return:
            dict: API response
        """
        data = self._start(["status-only"])
        data["REQUEST"]["Return"] = "OK: Returned status data."
        data["REQUEST"]["Command"] = "Status"
        data = self._end(data)
        return data

    def status_audio_reset(self):
        """
        set status of all devices to OFF and return JSON msg
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_status_audio_reset()
        data["REQUEST"]["Command"] = "ResetAudio"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def status_devices_reset(self):
        """
        set status of all devices to OFF and return JSON msg

        Return:
            dict: API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = self.edit.device_status_reset()
        data["REQUEST"]["Command"] = "Reset"

        self._refresh()
        data = self._end(data, ["no-data", "no-config"])
        return data

    def test(self):
        """
        test API call

        Returns:
            dict: REST API response
        """
        data = self._start(["request-only"])
        data["REQUEST"]["Return"] = "OK"
        data["REQUEST"]["Command"] = "Test"

        self.logging.info("!!!!!!!!!!!!!! TEST CALL !!!!!!!!!!!!!")

        data = self._end(data, ["no-data", "no-config", "no-status"])
        return data
