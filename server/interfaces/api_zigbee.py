import os.path
import time
import json

from flask import template_rendered

import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
import server.modules.rm3ping as rm3ping
from server.modules.rm3classes import RemoteDefaultClass, RemoteApiClass
import paho.mqtt.client as mqtt

shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("ZIGBEE2MQTT")


class ApiControl(RemoteApiClass):
    """
    Integration of ZigBee2MQTT API

    Further information can be found here:
    https://www.emqx.com/en/blog/how-to-use-mqtt-in-python
    https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """Initialize API / check connect to device"""
        if device_config is None:
            device_config = {}

        self.api_description = "API Zigbee2MQTT"
        RemoteApiClass.__init__(self, "api-zigbee", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

        self.config_add_key("USBDongle", "")
        self.config_add_key("MqttUser", "")
        self.config_add_key("MqttPassword", "")

        self.mqtt_client = None
        self.mqtt_msg_start = "zigbee2mqtt/"
        self.mqtt_devices = {}
        self.mqtt_bridge = {}
        self.mqtt_devices_status = {}
        self.mqtt_subscribed = []
        self.mqtt_msg_received = {}
        self.mqtt_friendly_name = {}
        self.mqtt_device_id = {}
        self.mqtt_device_availability = {}
        self.mqtt_device_availability_subscribed = []

        self.mqtt_force_update_interval = 5 * 60
        self.mqtt_force_update_last = 0

        self.connect_config = {
            "FIRST_RECONNECT_DELAY": 1,
            "RECONNECT_RATE": 2,
            "MAX_RECONNECT_COUNT": 12,
            "MAX_RECONNECT_DELAY": 60
            }
        self.not_available = []

    def _on_connect(self, client, userdata, flags, rc, properties):
        """
        async reaction on connection
        """
        self.logging.debug("on_connect: flags= " + str(flags) + "; userdata=" + str(userdata) + "; rc=" + str(rc))
        if rc == 0:
            if self.api_config["USBDongle"] != "":
                self.logging.info("Connected " + self.api_config["USBDongle"] + " - " + self.api_name)
            else:
                self.logging.info("Connected " + self.api_config["IPAddress"] + " - " + self.api_name)

            self.status = "Connected"
        else:
            self.logging.warning("Could not connect to ZigBee broker (" + self.api_config["IPAddress"] +
                                 "), return code: " + str(rc))
            self.status = "ERROR: Could not connect, return code=" + str(rc)

    def _on_connect_fail(self, client_id):
        """
        async reaction API connect failed
        """
        self.logging.error("Could not connect to " + self.api_name + "!")
        self.status = "ERROR connect failed."

    def _on_logging(self, client, userdata, level, buff):
        """
        async reaction API logging
        """
        self.logging.debug("MQTT Client logging ("+str(level)+"): " + str(buff))

    def _on_disconnect(self, client, userdata, flags, properties, rc):
        """
        async API reaction on disconnection
        """
        self.logging.info("Disconnected with result code: %s", rc)
        reconnect_count, reconnect_delay = 0, self.connect_config["FIRST_RECONNECT_DELAY"]
        while reconnect_count < self.connect_config["MAX_RECONNECT_COUNT"]:
            self.logging.info("Reconnecting in %d seconds...", reconnect_delay)
            time.sleep(reconnect_delay)

            try:
                self.mqtt_client.reconnect()
                self.logging.info("Reconnected successfully!")
                self.status = "Connected"
                return
            except Exception as err:
                self.status = "WARNING: " + str(err) + ". Reconnect failed. Retrying..."
                self.logging.warning("%s. Reconnect failed. Retrying...", err)

            reconnect_delay *= self.connect_config["RECONNECT_RATE"]
            reconnect_delay = min(reconnect_delay, self.connect_config["MAX_RECONNECT_DELAY"])
            reconnect_count += 1

        self.status = "ERROR: Reconnect failed after " + str(reconnect_count) + ". Exiting..."
        self.logging.info("Reconnect failed after %s attempts. Exiting...", reconnect_count)

    def _on_message(self, client, userdata, message):
        """
        async reaction API request
        """
        return_data = str(message.payload.decode("utf-8"))
        return_data_short = str(return_data)
        if len(return_data_short) > 300:
            return_data_short = return_data_short[:300] + "..."

        self.logging.debug("Message received: " + message.topic + " : " + str(return_data_short))
        self.mqtt_msg_received[message.topic+return_data] = True
        if "{" in str(return_data):
            self.execute_results(message.topic, json.loads(return_data))
        else:
            self.execute_results(message.topic, return_data)

    def connect(self):
        """
        Connect / check connection, if connect OK execute (subscribe & publish) the main topics.
        -> answers will be process in _on_message()
        -> this will trigger execute_results(), where devices will be subscribed
        """
        self.logging.debug("(Re)connect " + self.api_name + " (" + self.api_config["IPAddress"] + ") ... ")
        self.status = "Starting ..."
        self.count_error = 0
        self.count_success = 0
        self.not_available = []

        connect = rm3ping.ping(self.api_config["IPAddress"])
        if not connect:
            self.status = self.not_connected + " ... PING " + self.api_config["IPAddress"]
            self.logging.warning(self.status)
            return self.status

        try:
            self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            self.mqtt_client.on_connect = self._on_connect
            self.mqtt_client.on_message = self._on_message
            self.mqtt_client.on_log = self._on_logging
            self.mqtt_client.on_disconnect = self._on_disconnect
            self.mqtt_client.on_connect_fail = self._on_connect_fail

            if self.api_config["MqttUser"] != "" and self.api_config["MqttPassword"] != "":
                self.logging.debug("-> use username '" + self.api_config["MqttUser"] + "' and password")
                self.mqtt_client.username_pw_set(self.api_config["MqttUser"], self.api_config["MqttPassword"])

            self.logging.debug("-> mqtt://" + str(self.api_config["IPAddress"]) + ":" + str(self.api_config["Port"]))
            rc = self.mqtt_client.connect(self.api_config["IPAddress"], self.api_config["Port"])

            if rc == 0:
                self.status = "Connected"
                self.mqtt_client.loop_start()
                self.request_execute("bridge/devices")
                self.request_execute("bridge/info")
                self.request_execute("availability")
            else:
                self.mqtt_client = None
                raise "Could not send connect command correctly: " + str(rc)

        except Exception as e:
            self.status = "ERROR "+self.api_name+" - connect: " + str(e)
            self.logging.error(self.status)
            if "[Errno 111]" in self.status:
                self.logging.error("-> Check if IPAddress and Port are OK (mqtt://" + str(self.api_config["IPAddress"])
                                   + ":" + str(self.api_config["Port"]))
            return self.status

        return self.status

    def disconnect(self):
        """
        disconnect API
        """
        self.mqtt_client.loop_stop()
        self.mqtt_client.disconnect()

    def request_subscribe(self, topic):
        """
        subscribe a command, if not subscribed yet
        """
        if topic not in self.mqtt_subscribed and not topic.endswith("/get"):
            self.logging.debug("subscribe: " + topic)
            self.mqtt_client.subscribe(topic)
            self.mqtt_subscribed.append(topic)

    def request_execute(self, topic, data=None):
        """
        publish / subscribe command
        """
        if data is None or data == "":
            data = {}
        data = json.dumps(data)
        topic = self.mqtt_msg_start + topic

        # subscribe new topics and force update (first update or send)
        self.request_subscribe(topic)

        self.logging.debug("publish: " + topic + " - " + str(data))
        if data is None:
            rc = self.mqtt_client.publish(topic)
        else:
            rc = self.mqtt_client.publish(topic, data, 1)

    def request_update_devices(self):
        """
        force an update for all registered devices, if last update interval has expired
        """
        if time.time() - self.mqtt_force_update_interval < self.mqtt_force_update_last:
            return

        self.logging.debug(f"Force update for all {len(self.mqtt_devices)} registered devices")
        for device in self.mqtt_devices:
            self.request_execute(self.mqtt_msg_start + device)

        self.mqtt_force_update_last = time.time()

    def execute_results(self, topic, data):
        """
        execute commands based on received messages
        """
        for device_id in self.mqtt_devices:
            friendly_name = device_id
            if device_id in self.mqtt_friendly_name:
                friendly_name = self.mqtt_friendly_name[device_id]
            if friendly_name not in self.mqtt_device_availability_subscribed:
                self.logging.debug("Subscribed '/availability' for device " + friendly_name + "/" + device_id)
                self.request_subscribe(self.mqtt_msg_start + friendly_name + "/availability")
                self.request_execute(self.mqtt_msg_start + friendly_name + "/availability/get")
                self.mqtt_device_availability_subscribed.append(friendly_name)

            if topic == self.mqtt_msg_start + device_id:
                self.mqtt_devices_status[device_id] = data
                self.logging.debug("-> " + device_id + " : " + str(data))

        if "bridge/info" in topic and data != {} and data is not None:
            self.mqtt_bridge = data
            self.config.write(rm3config.commands + self.api_name + "/11_bridge", data)

        if "bridge/devices" in topic and data != {} and data is not None:
            self.logging.debug("Identified " + str(len(data)) + " ZigBee devices, subscribe and request information.")
            for device in data:
                device_id = device["friendly_name"]
                self.mqtt_devices[device_id] = device
                self.mqtt_device_id[device_id] = device["ieee_address"]
                self.mqtt_friendly_name[device["ieee_address"]] = device_id

                self.request_subscribe(self.mqtt_msg_start + device_id)
                self.request_execute(self.mqtt_msg_start + device_id + "/get")

            self.config.write(rm3config.commands + self.api_name + "/10_devices", self.mqtt_devices)

        if "availability" in topic and data != {} and data != "":
            device_id = topic.split("/")[1]
            friendly_name = device_id
            if device_id in self.mqtt_friendly_name:
                friendly_name = self.mqtt_friendly_name[device_id]
            self.mqtt_device_availability[device_id] = data
            self.mqtt_device_availability[friendly_name] = data
            self.logging.debug("Availability " + str(friendly_name) + ": " + str(data) + str(self.mqtt_device_availability))

    def api_device_available(self, api_device):
        """
        check if API device (USB Dongle) is defined and available

        Args:
            api_device (str): API Device identifier
        Returns:
            bool: False if USB Dongle is defined but not found
        """
        self.logging.debug("Device available: " + api_device + " / " + self.api_config["USBDongle"] + " / available=" +
                           str(os.path.exists(self.api_config["USBDongle"])))

        if self.api_config["USBDongle"] != "":
            device_file = self.api_config["USBDongle"]
            try:
                # Try opening the device file in read mode
                with open(device_file, 'r') as f:
                    return "OK: " + device_file + " is available."
            except FileNotFoundError:
                return "ERROR: " + device_file + " not found."
            except PermissionError:
                return "ERROR: " + device_file + " exists but is not accessible due to permissions."
            except Exception as e:
                return "ERROR: An error occurred: " + str(e)
        else:
            self.logging.debug("No USBDongle defined, try to connect with external server.")

        return "OK"

    def devices_available(self):
        """
        get all available devices

        Returns:
            dict: available devices with following parameters: id, name, supported, disabled, description
        """
        available = {}
        for key_x in self.mqtt_devices:
            device_infos = self.mqtt_devices[key_x].copy()
            key = device_infos["friendly_name"]
            available[key] = {
                "name":        device_infos["friendly_name"],
                "id":          device_infos["ieee_address"],
                "disabled":    device_infos["disabled"],
                "available":   (device_infos["interviewing"] is False and device_infos["interview_completed"] is True),
                "type":        device_infos["type"]
            }
            available[key]["description"] = ""
            if ("definition" in device_infos and device_infos["definition"] is not None
                    and "description" in device_infos["definition"]):
                available[key]["description"] = device_infos["definition"]["description"]
            else:
                if "manufacturer" in device_infos:
                    available[key]["description"] += device_infos["manufacturer"] + " "
                if "model_id" in device_infos:
                    available[key]["description"] += device_infos["model_id"] + " "

        return available

    def devices_listen(self, active):
        """
        activate / disable listen mode new ZigBee devices

        Args:
            active (bool): True to activate, False to disable
        """
        self.request_execute("bridge/request/permit_join", {"value": active})

    def devices_permit_joint(self):
        """
        permit new images to join for 2 min (120s)
        """
        self.request_execute("bridge/request/permit_join", "{\"value\": true, \"time\": 120}")

    def device_info(self, device_id=""):
        """
        Topic: zigbee2mqtt/bridge/request/device/info
        Payload: {"id": "<device_friendly_name>"}
        """
        device_infos = self.config.read(rm3config.commands + self.api_name + "/10_devices")
        if device_id != "" and device_id in device_infos:
            return device_infos[device_id]
        else:
            return device_infos

    def device_features(self, device_information):
        """
        extract exposed features from 10_devices.json format
        """
        result = {
            "ieee_address": device_information["ieee_address"],
            "friendly_name": device_information["friendly_name"],
            "description": device_information["definition"]["description"],
            "model_id": device_information["model_id"],
            "manufacturer": device_information["manufacturer"],
            "features": {},
            "options": [],
            "endpoints": []
        }
        access = {
            "1": ["get"],
            "2": ["set"],
            "3": ["get","set"],
            "4": ["notify"],
            "5": ["get","notify"],
            "7": ["get","set","notify"]
        }

        endpoints = device_information["endpoints"]
        features = device_information["definition"]["exposes"]
        options = device_information["definition"]["options"]

        for key in endpoints:
            result["endpoints"].append(key)

        for entry in options:
            result["options"].append(entry["property"])

        for entry in features:
            if "property" in entry:
                key = entry["property"]
                value = {}
                for key2 in ["access","label","description","type"]:
                    if key2 in entry:
                        if key2 == "access":
                            value[key2] = access[str(entry[key2])]
                        else:
                            value[key2] = entry[key2]
                result["features"][key] = value
            elif "features" in entry:
                subentries = entry["features"]
                for subentry in subentries:
                    key = subentry["property"]
                    value = {}
                    for key2 in ["label", "description", "type"]:
                        if key2 in entry:
                            value[key2] = subentry[key2]
                    result["features"][key] = value

        return result

    def device_configuration_command(self, cmd_information):
        """
        create command entry
        """
        result = {
            "cmd": [],
            "description": "",
            "type": ""
        }
        access = {
            "1": ["get"],
            "2": ["set"],
            "3": ["get","set"],
            "4": ["notify"],
            "5": ["get","notify"],
            "7": ["get","set","notify"]
        }
        if "access" in cmd_information:
            result["cmd"] = access[str(cmd_information["access"])]
        for key in ["unit", "type", "description", "values"]:
            if key in cmd_information:
                result[key] = cmd_information[key]
        if "get" in result["cmd"]:
            result["get"] = "get=" + cmd_information["property"]
        if "set" in result["cmd"]:
            result["set"] = "set={'" + cmd_information["property"] + "': '{DATA}'}"
        if "value_min" and "value_max" in cmd_information:
            result["values"] = { "min": cmd_information["value_min"], "max": cmd_information["value_max"] }
        if "value_on" and "value_off" in cmd_information:
            result["values"] = [cmd_information["value_on"], cmd_information["value_off"]]
            if "value_toggle" in cmd_information:
                result["values"].append(cmd_information["value_toggle"])

        return result

    def device_configuration_button(self, cmd_information):
        """
        create command entry
        """
        result = {}
        button_result = {}
        access = {
            "1": ["get"],
            "2": ["set"],
            "3": ["get","set"],
            "4": ["notify"],
            "5": ["get","notify"],
            "7": ["get","set","notify"]
        }
        if "access" in cmd_information:
            result["cmd"] = access[str(cmd_information["access"])]
        for key in ["values"]:
            if key in cmd_information:
                result[key] = cmd_information[key]
        if "value_on" and "value_off" in cmd_information:
            result["values"] = [cmd_information["value_on"], cmd_information["value_off"]]
            if "value_toggle" in cmd_information:
                result["values"].append(cmd_information["value_toggle"])

        if "set" in result["cmd"] and "values" in result and len(result["values"]) > 0:
            for value in result["values"]:
                if type(value) is bool:
                    if value:
                        key = cmd_information["property"].lower() + "-true"
                        key = key.replace("_","-")
                        if key.startswith("state-"):
                            key = key.replace("state-","")
                        value = "set={'"+cmd_information["property"]+"': true}"
                    else:
                        key = cmd_information["property"].lower() + "-false"
                        key = key.replace("_","-")
                        if key.startswith("state-"):
                            key = key.replace("state-","")
                        value = "set={'"+cmd_information["property"]+"': false}"
                else:
                    key = cmd_information["property"].lower() + "-" + str(value).lower()
                    key = key.replace("_","-")
                    if key.startswith("state-"):
                        key = key.replace("state-", "")
                    value = "set={'"+cmd_information["property"]+"': '"+value+"'}"
                button_result[key] = value

        return button_result

    def device_configuration(self, device_information):
        """
        extract exposed features from 10_devices.json format
        """
        result = {
            "data": {
                "buttons": {},
                "commands": {},
                "query": {
                    "load_intervals": {},
                    "load_default": 60,
                    "load_after": [],
                    "load_after_values": [],
                    "load_only": [],
                    "load_never": []
                },
                "details": {
                    "description": device_information["definition"]["description"],
                    "model_id": device_information["model_id"],
                    "manufacturer": device_information["manufacturer"],
                    "ieee_address": device_information["ieee_address"],
                    "friendly_name": device_information["friendly_name"],
                    "type": device_information["type"],
                }
            },
            "info": "jc://remote/ device configuration for '" + device_information["definition"]["description"] + "' (" +
                    device_information["manufacturer"] + " / " + device_information["model_id"] + ")",
        }
        features = device_information["definition"]["exposes"]

        for entry in features:
            if "property" in entry:
                key = entry["property"]
                cmd_value = self.device_configuration_command(entry)
                btn_value = self.device_configuration_button(entry)
                my_key = key.replace("_","-")
                result["data"]["commands"][my_key] = cmd_value
                for btn_key in btn_value:
                    result["data"]["buttons"][btn_key] = btn_value[btn_key]
            elif "features" in entry:
                subentries = entry["features"]
                for subentry in subentries:
                    key = subentry["property"]
                    cmd_value = self.device_configuration_command(subentry)
                    btn_value = self.device_configuration_button(subentry)
                    my_key = key.replace("_", "-")
                    result["data"]["commands"][my_key] = cmd_value
                    for btn_key in btn_value:
                        result["data"]["buttons"][btn_key] = btn_value[btn_key]

        important_commands = []
        for key in result["data"]["commands"]:
            if (key.startswith("state") or key.startswith("linkquality")) and "get" in result["data"]["commands"][key]["cmd"]:
                important_commands.append(key)
        result["data"]["query"]["load_intervals"]["10"] = important_commands

        return result

    def wait_if_working(self):
        """Some devices run into problems, if send several requests at the same time"""
        while self.working:
            self.logging.debug(".")
            time.sleep(0.2)
        return

    def send_api(self, command):
        """
        send API command

        Args:
            command (str): command string, e.g. "api_command={'key': 'value'}"
        Returns:
            Any: result from command execution
        """
        result = "OK"
        if "=" not in command:
            result = "ERROR: command not in the correct format (api_command={'key': 'value'})"
            self.logging.error(result)

        else:
            command_key, command_value = command.split("=")
            if "{" in command_value:
                command_value = command_value.replace("'", "\"")
                command_value_json = json.loads(command_value)
            else:
                command_value_json = {}
            self.request_execute("bridge/" + command_key, command_value_json)
            self.logging.debug(result)

        return result

    def send(self, device, device_id, command):
        """
        Send command to API

        Args:
            device (str): internal device id
            device_id (str): external device id given by the vendor
            command (str): command to be executed (see README.md in the API specific subfolder)
        Returns:
             Any
        """
        result = None
        self.wait_if_working()
        self.working = True
        
        # request an update, if interval has expired
        self.request_update_devices()
        
        if self.log_command:
            self.logging.info("__SEND: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        if self.status == "Connected":

            command_key = command.split("=")[0]
            command_value = command[len(command_key)+1:].replace("'", "\"")

            try:
                command_value_json = json.loads(command_value)
            except Exception as e:
                result = "ERROR: Could not send data '" + command_value + "': " + str(e)
                self.logging.error("__SEND: " + result)
                self.working = False
                return result

            if ("color" in command_value_json and ":" in command_value_json["color"]
                    and "{" not in command_value_json["color"]):
                xy = command_value_json["color"].split(":")
                command_value_json["color"] = {"x": float(xy[0]), "y": float(xy[1])}

            self.logging.debug("__SEND: " + str(device_id) + " !!! " + command_key + " -> " + command_value)

            if command_key == "set":
                self.request_execute(device_id + "/set", command_value_json)
                result = "OK"

            elif "request" in command_key:
                self.request_execute("bridge/" + command_key, command_value_json)

            else:
                result = "ERROR: unknown command (" + command + ")"
        else:
            result = "ERROR: API not connected"

        self.working = False
        return result

    def query(self, device, device_id, command):
        """
        Send command to API and wait for answer or if asynchronous communication take last cached answer

        Args:
            device (str): internal device id
            device_id (str): external device id given by the vendor
            command (str): command to be executed (see README.md in the API specific subfolder)
        Returns:
             Any
        """

        result = None
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command

        if device_id in self.mqtt_friendly_name:
            friendly_name = self.mqtt_friendly_name[device_id]
        elif device_id in self.mqtt_device_id:
            friendly_name = device_id
        else:
            if device_id not in self.not_available:
                self.logging.error("ERROR: No data for device '" + device_id + "' available (no further info for this device till reconnect).")
                self.not_available.append(device_id)
            self.working = False
            return "N/A"

        if self.status == "Connected":

            command_key = command.split("=")[0]
            command_value = command[len(command_key)+1:].replace("'", "\"")

            if command_key == "get":
                result = "N/A"
                unit = ""

                if "availability" in command:
                    result = self.mqtt_device_availability[friendly_name]

                if "device-info" in command:
                    result = self.device_info(friendly_name)

                if "device-features" in command:
                    result = self.device_info(friendly_name)
                    if "friendly_name" in result:
                        result = self.device_features(result)
                    else:
                        result = {"error": "Device '" + friendly_name + "' not yet found in the configuration."}

                if "device-configuration" in command:
                    result = self.device_info(friendly_name)
                    if "friendly_name" in result:
                        result = self.device_configuration(result)
                    else:
                        result = {"error": "Device '" + friendly_name + "' not yet found in the configuration."}

                if friendly_name in self.mqtt_devices_status and command_value in self.mqtt_devices_status[friendly_name]:
                    result = self.mqtt_devices_status[friendly_name][command_value]
                    if command_value == "color":
                        result["x"] = round(result["x"], 4)
                        result["y"] = round(result["y"], 4)

                    if friendly_name in self.mqtt_devices and "definition" in self.mqtt_devices[friendly_name] \
                            and "exposes" in self.mqtt_devices[friendly_name]["definition"]:
                        expose_entries = self.mqtt_devices[friendly_name]["definition"]["exposes"]
                        for expose_entry in expose_entries:
                            if "name" in expose_entry and "unit" in expose_entry and expose_entry["name"] == command_value:
                                unit = expose_entry["unit"]

                    if unit != "":
                        result = str(result) + " " + str(unit)

            result_log = str(result)[40:]
            self.logging.debug(f"__QUERY: {str(friendly_name)} | {command_value} -> {result_log}")

        if self.log_command:
            self.logging.debug(f"__QUERY: {str(friendly_name)} | NO CONNECTION")

        self.working = False
        return result

    def record(self, device, device_id, command):
        """Record command, especially build for IR devices"""
        self.logging.error("Record not implemented for this API.")
        return "ERROR: Record not implemented for this API."

    def test(self):
        """Test device by sending a couple of commands"""

        self.wait_if_working()
        self.working = True

        if self.log_command:
            self.logging.info("_TEST ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = True
        #           return "ERROR "+self.api_name+" - test: " + str(e)
        #       else:
        #         self.working = True
        #         return "ERROR "+self.api_name+": Not connected"

        self.logging.info("Testing API ...")

        #self.request_execute("0x70b3d52b6004fd1f/set", {"state": "TOGGLE"})
        #time.sleep(1)
        #self.request_execute("0x70b3d52b6004fd1f/set", {"state": "TOGGLE"})

        self.working = False
        return "OK"

