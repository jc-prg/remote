import time
import denonavr
import asyncio
import asyncio
import socket
import sys
import re
import requests
from xml.etree import ElementTree as ET

import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
import server.modules.rm3ping as rm3ping
from server.modules.rm3classes import RemoteDefaultClass, RemoteApiClass

# -------------------------------------------------
# API-class
# -------------------------------------------------

shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("DENON")


class ApiControl(RemoteApiClass):
    """
    Integration of DENON API to be used by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """Initialize API / check connect to device"""
        if device_config is None:
            device_config = {}

        self.api_description = "Denon AV-Receiver API"
        RemoteApiClass.__init__(self, "api-DENON", api_name, "query", self.api_description, device, device_config, log_command, config)

        self.config_add_key("DescriptionUrl", "")
        self.config_add_key("MultiDevice", False)
        self.config_add_key("PowerDevice", "")
        self.config_set_methods(["send", "query"])

        self.api_jc = None
        self.api_discovery = {}
        self.api_info_url = "https://github.com/jc-prg/remote/blob/master/server/interfaces/denon/README.md"
        self.api_source_url = "https://github.com/ol-iver/denonavr"
        self.api_max_interval = 6
        self.api_last_request = time.time() + 10

        self.SSDP_GROUP = ("239.255.255.250", 1900)
        self.MSEARCH_MSG = (
            "M-SEARCH * HTTP/1.1\r\n"
            "HOST:239.255.255.250:1900\r\n"
            "MAN:\"ssdp:discover\"\r\n"
            "MX:2\r\n"
            "ST:ssdp:all\r\n"
            "\r\n"
        )
        self.TIMEOUT = 5

    async def initialize(self):
        """
        initialize API
        """
        await self.api.async_setup()
        await self.api.async_update()
        await self.api.async_telnet_connect()

        available_var = []
        for name in vars(self.api):
            if not name.startswith("_"):
                available_var.append(name)

        self.logging.debug(f"TEST DENON API for {self.api.model_name} ... vol={self.api.volume}")
        self.logging.debug(f"Available vars: {available_var}")

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
            self.api = denonavr.DenonAVR(self.api_config["IPAddress"])
            asyncio.run(self.initialize())

        except Exception as e:
            self.error_details(sys.exc_info())
            self.status = self.not_connected + " ... CONNECT " + str(e)
            return self.status

        try:
            self.api_jc = APIaddOn(self.api)
            self.api_jc.status = self.status
            self.api_jc.not_connected = self.not_connected

        except Exception as e:
            self.error_details(sys.exc_info())
            self.status = self.not_connected + " ... CONNECT " + str(e)
            self.api_jc.status = self.status
            self.logging.warning(self.status)

        if self.status == "Connected":
            self.logging.info(f"Connected {self.api_config["IPAddress"]} - {self.api_name}:{self.api_device}")

        return self.status

    def discover_denon_avrs(self):
        """
        Discover existing denon AVRs
        """
        self.logging.debug(f"Discover available Denon devices ...")
        discovered = {}

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.settimeout(self.TIMEOUT)
        sock.sendto(self.MSEARCH_MSG.encode("utf-8"), self.SSDP_GROUP)

        start = time.time()

        while time.time() - start < self.TIMEOUT:
            try:
                data, addr = sock.recvfrom(65507)
                response = data.decode("utf-8", errors="ignore")

                # Look for Denon / Marantz / HEOS
                if not re.search(r"denon|marantz|heos", response, re.IGNORECASE):
                    continue

                ip = addr[0]

                location = None
                for line in response.split("\r\n"):
                    if line.lower().startswith("location:"):
                        location = line.split(":", 1)[1].strip()
                        break

                if not location or ip in discovered:
                    continue

                info = self.discover_device_info(location)
                discovered[ip] = info

            except socket.timeout:
                break

        sock.close()
        return discovered

    def discover_device_info(self, description_url):
        """
        Grab device information for detected device
        """
        self.logging.debug(f"Grab information from {description_url} ...")
        info = {
            "model": None,
            "friendly_name": None,
            "manufacturer": None,
            "description_url": description_url,
        }

        try:
            r = requests.get(description_url, timeout=2)
            xml = ET.fromstring(r.text)

            ns = {"upnp": "urn:schemas-upnp-org:device-1-0"}

            info["friendly_name"] = xml.findtext(".//upnp:friendlyName", namespaces=ns)
            info["manufacturer"] = xml.findtext(".//upnp:manufacturer", namespaces=ns)
            info["model"] = xml.findtext(".//upnp:modelName", namespaces=ns)

        except Exception:
            pass

        return info

    def discover(self):
        """
        Identify available DENON devices in the network
        """
        device_information = {}
        avr = self.discover_denon_avrs()

        if not avr:
            self.logging.debug("No Denon / Marantz AVRs found.")
        else:
            count = 1
            self.logging.debug("Discovered Denon / Marantz AVRs:\n")
            for ip, info in avr.items():
                self.logging.debug(f"- {info['model']} : {ip}")
                key = f"device-{count}"
                device = self.api_config_default.copy()
                device["AdminURL"] = f"http://{ip}:11080/"
                device["Description"] = info['model']
                device["DescriptionURL"] = info['description_url']
                device["IPAddress"] = ip
                device_information[key] = device
                count += 1

        api_config = {
            "API-Description": self.api_description,
            "API-Devices": device_information,
            "API-Info": self.api_info_url,
            "API-Source": self.api_source_url
        }

        self.api_discovery = api_config.copy()
        self.logging.info("__DISCOVER: " + self.api_name + " - " + str(len(self.api_discovery["API-Devices"])) + " devices")
        self.logging.debug("            " + self.api_name + " - " + str(self.api_discovery))
        return api_config.copy()

    async def send_command(self, command):
        """
        Send command via DENON API

        Args:
            command (str): API or telnet command
        Returns:
            bool: True if OK, False if ERROR
        """
        try:
            if command.startswith("telnet:"):
                await self.api.telnet_api.async_send_command(command.split(":", 1)[1])
                self.logging.debug(f"Send telnet command '{command}'")
            else:
                if not "(" in command:
                    command += "()"
                await eval(f"self.api.{command}")
                await self.api.async_update()
                self.logging.debug(f"Send api command '{command}'")
            return True
        except Exception as e:
            if "is bound to a different event loop" in str(e):
                self.logging.debug(f"Send api command '{command}' (bound to a different event loop)")
                return True
            else:
                self.error_details(sys.exc_info())
                self.logging.error(f"Could not send command '{command}': {e}")
                return False

    def send(self, device, device_id, command):
        """
        Send command to API

        Args:
            device (str): API-Device, e.g., "DENON_device-1"
            device_id (str): device-id of connected device
            command (str): command in the format "device_command"
        Returns:
            str: "OK" or "ERROR: <error message>"
        """

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = f"SEND: {device}/{command}"

        if self.log_command:
            self.logging.info(f"_SEND: {device}/{command[:shorten_info_to]} ... ({self.api_name})")

        if self.status == "Connected":

            if command.startswith("jc."):
                try:
                    command = "self.api_" + command
                    if not "(" in command:
                        command += "()"
                    result = eval(command)
                    self.logging.debug(f"{command} -> {result}")

                    if "error" in result:
                        self.working = False
                        return f"ERROR {self.api_name} - {result["error"]}"

                except Exception as e:
                    self.error_details(sys.exc_info())
                    self.working = False
                    return "ERROR " + self.api_name + " - query: " + str(e)

            else:
                try:
                    result = asyncio.run(self.send_command(command))
                    self.logging.debug(f"Send -> {result}")
                except Exception as e:
                    self.error_details(sys.exc_info())
                    self.working = False
                    return f"ERROR {self.api_name} - send: {e}"
        else:
            self.working = False
            return f"ERROR {self.api_name}: Not connected"

        self.working = False
        return "OK"

    async def query_update(self):
        """
        update vars from device
        """
        try:
            await self.api.async_update()
        except Exception as e:
            self.error_details(sys.exc_info())
            self.logging.error(f"Could not execute update: {e}")

    def query(self, device, device_id, command):
        """
        Send command to API and wait for answer

        Args:
            device (str): API-Device, e.g., "DENON_device-1"
            device_id (str): device-id of connected device
            command (str): command in the format "device_command"
        """
        result = ""
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command

        if self.log_command:
            self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        if self.status == "Connected" or command == "api-discovery":

            if command.startswith("jc."):
                try:
                    command = "self.api_" + command
                    if not "(" in command:
                        command += "()"

                    if time.time() - self.api_last_request > self.api_max_interval:
                        asyncio.run(self.query_update())
                        self.api_last_request = time.time()

                    result = eval(command)
                    self.logging.debug(f"__query {device}/{command[:shorten_info_to]}={result}")

                    if "error" in str(result):
                        self.working = False
                        msg = f"ERROR {self.api_name} - {result["error"]}"
                        self.logging.debug(msg)
                        return msg

                except Exception as e:
                    self.error_details(sys.exc_info())
                    self.working = False
                    msg = "ERROR " + self.api_name + " - query: " + str(e)
                    self.logging.debug(msg)
                    return msg

            elif command == "api-discovery":
                self.working = False
                return self.api_discovery

            else:
                try:
                    if time.time() - self.api_last_request > self.api_max_interval:
                        asyncio.run(self.query_update())
                        self.api_last_request = time.time()

                    result = eval(f"self.api.{command}")
                    self.logging.debug(f"__query {device}/{command[:shorten_info_to]}={result}")

                except Exception as e:
                    self.error_details(sys.exc_info())
                    self.working = False
                    return "ERROR "+self.api_name+" - query: " + str(e)

        else:
            self.working = False
            return "ERROR " + self.api_name + ": Not connected"

        self.working = False
        return result

    def test(self):
        """Test device by sending a couple of commands"""

        self.wait_if_working()
        self.working = True

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

        self.working = False
        return "OK"


class APIaddOn(RemoteDefaultClass):
    """
    additional functions that combine values
    """
    def __init__(self, api):
        self.api_description = "API-Addon for DENON Devices"
        RemoteDefaultClass.__init__(self, "api-DENON", self.api_description)

        self.status = None
        self.not_connected = None
        self.addon = "jc://addon/denon/"
        self.api = api

        self.available_vars = [
            'album', 'artist',
            'async_audio_restorer', 'async_auto_lip_sync_off', 'async_auto_lip_sync_on', 'async_auto_lip_sync_toggle',
            'async_auto_standby', 'async_back', 'async_bass_down', 'async_bass_up', 'async_bt_output_mode',
            'async_bt_output_mode_toggle', 'async_bt_transmitter_off', 'async_bt_transmitter_on',
            'async_bt_transmitter_toggle', 'async_channel_level_adjust', 'async_cursor_down', 'async_cursor_enter',
            'async_cursor_left', 'async_cursor_right', 'async_cursor_up', 'async_delay_down', 'async_delay_time',
            'async_delay_time_down', 'async_delay_time_up', 'async_delay_up', 'async_dimmer', 'async_dimmer_toggle',
            'async_disable_tone_control', 'async_dynamic_eq_off', 'async_dynamic_eq_on', 'async_eco_mode',
            'async_enable_tone_control', 'async_get_command', 'async_graphic_eq_off', 'async_graphic_eq_on',
            'async_graphic_eq_toggle', 'async_hdmi_audio_decode', 'async_hdmi_cec_off', 'async_hdmi_cec_on',
            'async_hdmi_output', 'async_headphone_eq_off', 'async_headphone_eq_on', 'async_headphone_eq_toggle',
            'async_illumination', 'async_info', 'async_mute', 'async_network_restart', 'async_next_track',
            'async_options', 'async_panel_lock', 'async_panel_unlock', 'async_pause', 'async_play', 'async_power_off',
            'async_power_on', 'async_previous_track', 'async_quick_select_memory', 'async_quick_select_mode',
            'async_remote_control_lock', 'async_remote_control_unlock', 'async_room_size', 'async_send_telnet_commands',
            'async_set_bass', 'async_set_dynamicvol', 'async_set_input_func', 'async_set_multieq',
            'async_set_reflevoffset', 'async_set_sound_mode', 'async_set_treble', 'async_set_volume',
            'async_settings_menu', 'async_setup', 'async_sleep', 'async_speaker_preset', 'async_speaker_preset_toggle',
            'async_status', 'async_system_reset', 'async_tactile_transducer_level_down',
            'async_tactile_transducer_level_up', 'async_tactile_transducer_off', 'async_tactile_transducer_on',
            'async_tactile_transducer_toggle', 'async_telnet_connect', 'async_telnet_disconnect',
            'async_toggle_dynamic_eq', 'async_toggle_play_pause', 'async_transducer_lpf', 'async_treble_down',
            'async_treble_up', 'async_trigger_off', 'async_trigger_on', 'async_trigger_toggle', 'async_update',
            'async_update_attrs_appcommand', 'async_update_attrs_status_xml', 'async_update_audyssey',
            'async_update_tonecontrol', 'async_video_processing_mode', 'async_volume_down', 'async_volume_up',
            'audio_restorer', 'audyssey', 'auto_lip_sync', 'auto_standby', 'band', 'bass', 'bass_level',
            'bt_output_mode', 'bt_transmitter', 'create_appcommand_search_strings', 'create_zones', 'delay',
            'delay_time', 'dimmer', 'dirac', 'dynamic_eq', 'dynamic_volume', 'dynamic_volume_setting_list',
            'eco_mode', 'frequency', 'get_trigger', 'graphic_eq', 'hdmi_audio_decode', 'hdmi_output', 'headphone_eq',
            'host', 'illumination', 'image_url', 'input', 'input_func', 'input_func_list', 'manufacturer',
            'model_name', 'multi_eq', 'multi_eq_setting_list', 'muted', 'name', 'netaudio_func_list',
            'playing_func_list', 'power', 'receiver_port', 'receiver_type', 'reference_level_offset',
            'reference_level_offset_setting_list', 'register_callback', 'room_size', 'send_telnet_commands',
            'serial_number', 'set_async_client_getter', 'settings_menu', 'show_all_inputs', 'sleep', 'sound_mode',
            'sound_mode_list', 'sound_mode_map', 'sound_mode_map_rev', 'sound_mode_raw', 'soundmode', 'speaker_preset',
            'state', 'station', 'support_sound_mode', 'support_tone_control', 'tactile_transducer',
            'tactile_transducer_level', 'tactile_transducer_lpf', 'telnet_available', 'telnet_connected',
            'telnet_healthy', 'title', 'tone_control_adjust', 'tone_control_status', 'tonecontrol', 'treble',
            'treble_level', 'triggers', 'unregister_callback', 'video_processing_mode', 'vol', 'volume', 'zone',
            'zones']
        self.available_commands = {
            "jc.get_available_commands()": {
                "info": "get a list of all available commands"
            },
            "jc.mute()": {
                "info": "toggle mute"
            },
            "jc.volume()": {
                "info": "get volume as absolute value (0.0..98.0) instead of in dB (-80.0..18.0)"
            },
            "jc.set_volume({DATA})": {
                "info": "set volume as absolute value (0.0..98.0) instead of in dB (-80.0..18.0)"
            }
        }

    def get_available_commands(self):
        """returns a list of all commands defined for this API"""
        return ["result", self.available_commands]

    async def _mute_toggle(self):
        """
        switch mute on or off depending on current status
        """
        try:
            await self.api.async_update()
            if self.api.muted:
                await self.api.async_mute(False)
                self.logging.debug(f"Send api command 'jc.mute(False)'")
            else:
                await self.api.async_mute(True)
                self.logging.debug(f"Send api command 'jc.mute(True)'")
            return { "ok": "jc.mute()" }

        except Exception as e:
            self.logging.error(f"Could not send command 'jc.mute()': {e}")
            return { "error": f"jc.mute(): an error occurred - {e}" }

    async def _set_volume(self, volume):
        """
        set volume including calculating dB value
        """
        try:
            await self.api.async_update()
            await self.api.async_set_volume(volume)
            return { "ok": "jc.set_volume()" }

        except Exception as e:
            if "is bound to a different event loop" in e:
                return {"ok": "jc.set_volume()"}

            self.logging.error(f"Could not send command 'jc.set_volume()': {e}")
            return { "error": f"jc.set_volume(): an error occurred - {e}" }

    def mute(self):
        """
        switch mute on or off depending on current status
        """
        result = asyncio.run(self._mute_toggle())
        return result

    def volume(self):
        """
        returns volume as absolute value (0.0..98.0) instead of in dB (-80.0..18.0)
        """
        result = float(self.api.volume) + float(80)
        return result

    def set_volume(self, volume):
        """
        set volume including calculating dB value
        """
        value = float(volume) - float(80)
        result = asyncio.run(self._set_volume(value))
        return result
