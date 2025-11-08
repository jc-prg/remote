import os.path
import time
import json
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
        RemoteApiClass.__init__(self, "api.zigbee", api_name, "query",
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
        self.connect_config = {
            "FIRST_RECONNECT_DELAY": 1,
            "RECONNECT_RATE": 2,
            "MAX_RECONNECT_COUNT": 12,
            "MAX_RECONNECT_DELAY": 60
            }

    def _on_connect(self, client, userdata, flags, rc, properties):
        """
        async reaction on connection
        """
        self.logging.debug("on_connect: flags= " + str(flags) + "; userdata=" + str(userdata) + "; rc=" + str(rc))
        if rc == 0:
            self.logging.info("Connected " + self.api_name + ".")
            self.status = "Connected"
        else:
            self.logging.error("Could not connect to ZigBee broker (" + self.api_config["IPAddress"] +
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
        """Connect / check connection"""
        self.logging.debug("(Re)connect " + self.api_name + " (" + self.api_config["IPAddress"] + ") ... ")
        self.status = "Starting ..."
        self.count_error = 0
        self.count_success = 0

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
                self.execute_request("bridge/devices")
                self.execute_request("bridge/info")
                self.execute_request("availability")
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

    def execute_results(self, topic, data):
        """
        execute commands based on received messages
        """
        for device_id in self.mqtt_devices:
            friendly_name = device_id
            if device_id in self.mqtt_friendly_name:
                friendly_name = self.mqtt_friendly_name[device_id]
            if friendly_name not in self.mqtt_device_availability_subscribed:
                self.mqtt_client.subscribe(self.mqtt_msg_start + friendly_name + "/availability")
                self.mqtt_client.publish(self.mqtt_msg_start + friendly_name + "/availability")
                self.mqtt_client.publish(self.mqtt_msg_start + friendly_name + "/availability/get")
                self.logging.debug("Subscribed '/availability' for device " + friendly_name + "/" + device_id)
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
                self.mqtt_client.subscribe(self.mqtt_msg_start + device_id)
                self.mqtt_client.publish(self.mqtt_msg_start + device_id + "/get")
                self.mqtt_device_id[device_id] = device["ieee_address"]
                self.mqtt_friendly_name[device["ieee_address"]] = device_id
            self.config.write(rm3config.commands + self.api_name + "/10_devices", self.mqtt_devices)

        if "availability" in topic and data != {} and data != "":
            device_id = topic.split("/")[1]
            friendly_name = device_id
            if device_id in self.mqtt_friendly_name:
                friendly_name = self.mqtt_friendly_name[device_id]
            self.mqtt_device_availability[device_id] = data
            self.mqtt_device_availability[friendly_name] = data
            self.logging.debug("Availability " + str(friendly_name) + ": " + str(data) +
                               str(self.mqtt_device_availability))

    def execute_request(self, topic, data=None):
        """
        publish / subscribe command
        """
        if data is None or data == "":
            data = {}
        data = json.dumps(data)
        self.logging.debug("execute: " + str(data))
        topic = self.mqtt_msg_start + topic

        self.mqtt_client.subscribe(topic)
        if data is None:
            rc = self.mqtt_client.publish(topic)
        else:
            rc = self.mqtt_client.publish(topic, data, 1)

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
            self.logging.info("No USBDongle defined, try to connect with external server.")

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
        self.execute_request("bridge/request/permit_join", {"value": active})

    def devices_permit_joint(self):
        """
        permit new images to join for 2 min (120s)
        """
        self.execute_request("bridge/request/permit_join", "{\"value\": true, \"time\": 120}")

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
            self.execute_request("bridge/" + command_key, command_value_json)
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
        self.last_action = time.time()
        self.last_action_cmd = "SEND: " + device + "/" + command

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
                self.execute_request(device_id + "/set", command_value_json)
                result = "OK"

            elif "request" in command_key:
                self.execute_request("bridge/" + command_key, command_value_json)

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
            self.logging.error("ERROR: No data for device '" + device_id + "' available.")
            self.working = False
            return "N/A"

        if self.log_command:
            self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        if self.status == "Connected":

            command_key = command.split("=")[0]
            command_value = command[len(command_key)+1:].replace("'", "\"")
            self.logging.debug("__QUERY: " + str(device_id) + " !!! " + command_key + " -> " + command_value)

            if command_key == "get":
                result = "N/A"
                unit = ""

                if "availability" in command:
                    result = self.mqtt_device_availability[friendly_name]

                if friendly_name in self.mqtt_devices_status and command_value in self.mqtt_devices_status[friendly_name]:
                    result = self.mqtt_devices_status[friendly_name][command_value]
                    if command_value == "color":
                        result["x"] = round(result["x"], 4)
                        result["y"] = round(result["y"], 4)

                    if friendly_name in self.mqtt_devices and "definition" in self.mqtt_devices[friendly_name] \
                            and "exposes" in self.mqtt_devices[friendly_name]["definition"]:
                        expose_entries = self.mqtt_devices[friendly_name]["definition"]["exposes"]
                        for expose_entry in expose_entries:
                            if ("name" in expose_entry and "unit" in expose_entry and
                                    expose_entry["name"] == command_value):
                                unit = expose_entry["unit"]

                    if unit != "":
                        result = str(result) + " " + str(unit)

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

        #self.execute_request("0x70b3d52b6004fd1f/set", {"state": "TOGGLE"})
        #time.sleep(1)
        #self.execute_request("0x70b3d52b6004fd1f/set", {"state": "TOGGLE"})

        self.working = False
        return "OK"

