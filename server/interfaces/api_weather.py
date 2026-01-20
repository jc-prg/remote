import sys
import time
import asyncio
import requests
from geopy.geocoders import Nominatim

import server.modules.rm3json as rm3json
import server.modules.rm3presets as rm3config
from server.modules.rm3classes import RemoteDefaultClass, RemoteThreadingClass, RemoteApiClass

# import sampleAPI as sample

# -------------------------------------------------
# API-class
# -------------------------------------------------

shorten_info_to = rm3config.shorten_info_to
rm3config.api_modules.append("WEATHER")


class ApiControl(RemoteApiClass):
    """
    Integration of sample API to be used by jc://remote/
    """

    def __init__(self, api_name, device="", device_config=None, log_command=False, config=None):
        """Initialize API / check connect to device"""
        if device_config is None:
            device_config = {}

        self.api_description = "API Open Meteo Weather"
        RemoteApiClass.__init__(self, "api-WEATHER", api_name, "query",
                                self.api_description, device, device_config, log_command, config)

        self.config_add_key("Location", "")
        self.config_add_key("LocationGPS", [0,0])
        self.config_add_key("MultiDevice", False)
        self.config_set_methods(["send","query"])

        self.api_info_url = "https://github.com/jc-prg/remote/blob/master/server/interfaces/weather/README.md"
        self.api_source_url = "https://open-meteo.com/en/docs"

        self.weather_api = ApiWeather(config)
        self.weather_api_connect = False

    def connect(self):
        """Connect / check connection"""

        # commands to connect and to check, if connection works - if not, return error message

        self.status = "Connected"
        self.count_error = 0
        self.count_success = 0

        self.logging.debug("Weather config: " + str(self.api_config))

        weather_param = {"active": True, "source": "Open-Meteo"}
        if "LocationGPS" in self.api_config and self.api_config["LocationGPS"] and self.api_config["LocationGPS"] != []:
            weather_param["gps_location"] =self.api_config["LocationGPS"]

        if "Location" in self.api_config and self.api_config["Location"] and self.api_config["Location"] != "":
            weather_param["location"] = self.api_config["Location"]
            if "gps_location" in weather_param:
                weather_param["gps_location"].append(self.api_config["Location"])

        if not "gps_location" in weather_param and not "location" in weather_param:
            self.logging.error("Could not start WEATHER API, as no location information are defined: " +str(weather_param))
            self.status = "error"
        else:
            if not self.weather_api_connect:
                self.weather_api.start()
                self.weather_api_connect = True

            success = self.weather_api.connect(weather_param)
            if success:
                time.sleep(10)
                self.logging.info("(Re)connected Weather API ...")
            else:
                self.logging.error("Could not (re)connected Weather API ...")
                self.status = "error"

        return self.status

    def discover(self):
        """
        create a default api configuration
        """
        api_config = {
            "API-Description": self.api_description,
            "API-Devices": {
                "default": {
                    "Description": "Open Meteo Weather (incl. GeoPy)",
                    "IPAddress": "127.0.0.1",
                    "Methods": ["query"],
                    "MultiDevice": False,
                    "Location": None,
                    "LocationGPS": [48.128, 11.646, "Munich"],
                    "Interval": 900,
                    "Timeout": 5
                }
            },
            "API-Info": self.api_info_url,
            "API-Source": self.api_source_url
        }
        self.api_discovery = api_config.copy()
        self.logging.info("__DISCOVER: " + self.api_name + " - " + str(len(self.api_discovery["API-Devices"])) + " devices")
        self.logging.debug("            " + self.api_name + " - " + str(self.api_discovery))
        return api_config.copy()

    def wait_if_working(self):
        """Some devices run into problems, if send several requests at the same time"""
        while self.working:
            self.logging.debug(".")
            time.sleep(0.2)
        return

    def send(self, device, device_id, command):
        """Send command to API"""

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "SEND: " + device + "/" + command

        if self.log_command:
            self.logging.info("_SEND: " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = False
        #           return "ERROR "+self.api_name+" - send: " + str(e)
        #       else:
        #         self.working = False
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"

    def query(self, device, device_id, command):
        """Send command to API and wait for answer"""

        if not self.weather_api.connected:
            self.logging.warning("query(): Weather API not connected yet ...")
            return "N/A"
        elif not self.weather_api.got_first_data:
            self.logging.debug("query(): Weather API didn't got first data yet ...")
            return "N/A"

        result = ""
        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "QUERY: " + device + "/" + command

        if self.log_command:
            self.logging.info("__QUERY " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        if self.weather_api.get_weather_info():
            weather = self.weather_api.get_weather_info()
            if "." in command:
                commands = command.split(".")
            else:
                commands = [command]

            if command == "availability" or command == "power":
                if "info_status" in weather:
                    if "error" in weather["info_status"] and weather["info_status"]["error"]:
                        result = "ERROR"
                    elif "running" in weather["info_status"] and weather["info_status"]["running"] == "OK":
                        if command == "power":
                            result = "ON"
                        else:
                            result = "ONLINE"
                    elif "running" in weather["info_status"]:
                        if command == "power":
                            result = "OFF"
                        else:
                            result = "OFFLINE"
                    else:
                        result = "ERROR"
                else:
                    result = "ERROR"
            elif command == "availability":
                result = "ERROR"
            elif command == "api-discovery":
                result = self.api_discovery
            elif command == "api-last-answer":
                result = self.weather_api.last_get_weather
            elif command == "sunrise":
                result = self.weather_api.get_sunrise()
            elif command == "sunset":
                result = self.weather_api.get_sunset()
            elif len(commands) == 1 and command in weather:
                result = weather[command]
            elif len(commands) == 2 and commands[0] in weather and commands[1] in weather[commands[0]]:
                result = weather[commands[0]][commands[1]]
            else:
                result = f"ERROR Command {commands} isn't available in the weather data."

            self.logging.debug(f"{command} | {commands[len(commands)-1]} : {result}")

            if not "ERROR" in str(result) and "info_units" in weather and commands[len(commands)-1] in weather["info_units"]:
                result = f"{result} {weather["info_units"][commands[len(commands) - 1]]}"
            elif "ERROR" in str(result):
                self.logging.error(result)

        self.working = False
        return result

    def record(self, device, device_id, command):
        """Record command, especially build for IR devices"""

        self.wait_if_working()
        self.working = True
        self.last_action = time.time()
        self.last_action_cmd = "RECORD: " + device + "/" + command

        if self.log_command:
            self.logging.info("__RECORD " + device + "/" + command[:shorten_info_to] + " ... (" + self.api_name + ")")

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = False
        #           return "ERROR "+self.api_name+" - record: " + str(e)
        #       else:
        #         self.working = False
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"

    def test(self):
        """Test device by sending a couple of commands"""

        self.wait_if_working()
        self.working = True

        # ---- change for your api ----
        #       if self.status == "Connected":
        #         try:
        #           result  = self.api.command(xxx)
        #         except Exception as e:
        #           self.working = False
        #           return "ERROR "+self.api_name+" - test: " + str(e)
        #       else:
        #         self.working = False
        #         return "ERROR "+self.api_name+": Not connected"

        self.working = False
        return "OK"


class ApiGPS(object):
    """
    class to look up GPS position or address (https://pypi.org/project/geopy/)
    """

    def __init__(self):
        """
        Constructor to initialize class (nothing to do)
        """
        pass

    @staticmethod
    def look_up_location(location):
        """
        look up location (https://pypi.org/project/geopy/)

        Args:
            location (str): name of location
        Returns:
            tuple[float, float, str]: latitude, longitude, location
        """
        geo_locator = Nominatim(user_agent="Weather App")
        try:
            geo_location = geo_locator.geocode(location)
            return [geo_location.latitude, geo_location.longitude, geo_location.address]
        except Exception as e:
            return [0, 0, "Error location lookup ("+location+") -> " + str(e)]

    @staticmethod
    def look_up_gps(gps_coordinates):
        """
        look up location (https://pypi.org/project/geopy/)

        Args:
            gps_coordinates (tuple[float, float]): GPS latitude, longitude
        Returns:
            [float, float, str]: latitude, longitude, location
        """
        geo_locator = Nominatim(user_agent="Weather App")
        try:
            geo_location = geo_locator.reverse(str(gps_coordinates[0]) + ", " + str(gps_coordinates[1]))
            return [geo_location.latitude, geo_location.longitude, geo_location.address]
        except Exception as e:
            return [0, 0, "Error GPS lookup ("+str(gps_coordinates)+") -> " + str(e)]


class ApiOpenMeteo(RemoteThreadingClass):
    """
    class to get weather data using Open Meteo API; API get hourly updated (https://open-meteo.com/ (without API key))
    """

    def __init__(self, config, gps_location):
        """
        Constructor to initialize class

        Args:
            config (): reference to config handler
            gps_location (tuple[float, float, str]): GPS latitude, longitude, address
        """
        RemoteThreadingClass.__init__(self, class_id="weather-om", name="weather-om")

        self.thread_priority(5)
        self.config = config

        self.weather_location = gps_location
        self.weather_empty = {
            "info_update": "none",
            "info_update_stamp": "none",
            "info_city": "",
            "info_format": "",
            "info_position": "",
            "info_status": {"running": ""},
            "current": {
                "temperature": None,
                "description": "",
                "description_icon": "",
                "wind_speed": None,
                "uv_index": None,
                "pressure": None,
                "humidity": None,
                "wind_direction": "",
                "precipitation": None
            },
            "forecast": {
                "today": {}
            }
        }
        self.weather_info = self.weather_empty.copy()
        self.weather_update = 0
        self.weather_update_rhythm = 60 * 60

        self.update_interval = self.weather_update_rhythm / 4
        self.update_settings = True
        self.update_wait = 0

        self.link_required = True
        self.link_provider = "<a href='https://open-meteo.com/' target='_blank'>Weather by Open-Meteo.com</a>"
        self.link_gps_lookup = "https://open-meteo.com/en/docs"

        self.weather_descriptions = {
            "0": "clear sky",
            "1": "clear",
            "2": "partly cloudy",
            "3": "overcast",
            "45": "fog",
            "48": "depositing rime fog",
            "51": "light drizzle",
            "53": "moderate drizzle",
            "55": "dense intensity drizzle",
            "56": "light freezing drizzle",
            "57": "dense intensity freezing drizzle",
            "61": "slight rain",
            "63": "moderate rain",
            "65": "heavy rain",
            "66": "light freezing rain",
            "67": "heavy freezing rain",
            "71": "slight snow fall",
            "73": "moderate snow fall",
            "75": "heavy snow fall",
            "77": "snow grains",
            "80": "slight rain showers",
            "81": "moderate rain showers",
            "82": "violent rain showers",
            "85": "slight snow showers",
            "86": "heavy snow showers",
            "95": "slight or moderate thunderstorms",
            "96": "thunderstorms with slight hail",
            "99": "thunderstorms with heavy hail"
        }
        self.weather_icons = {
            "0": "☀️",
            "1": "☀️",
            "2": "⛅️",
            "3": "☁️",
            "45": "🌫",
            "48": "🌫",
            "51": "🌦",
            "53": "🌦",
            "55": "🌧",
            "56": "🌨",
            "57": "️❄️",
            "61": "🌦",
            "63": "🌧",
            "65": "🌧",
            "66": "🌨",
            "67": "❄️",
            "71": "🌨",
            "73": "🌨",
            "75": "❄️",
            "77": "❄️",
            "80": "🌦",
            "81": "🌦",
            "82": "🌧",
            "85": "🌨",
            "86": "❄️",
            "95": "🌩",
            "96": "⛈",
            "99": "⛈",
            "100": "✨"
        }
        self.further_icons = {
            "other": "🌂 ☂ ☔ ❄ 🌈 🌬 🌡 ⚡ 🌞 ✨ ⭐ 🌟 💫 💦 🔅 🔆 ⛷ 🌍 🌎 🌏 🌐",
            "moons": "🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘",
            "weather": "🌤 🌦 🌧 🌨 🌩 🌪 🌡 🌥 🌤 ❆ ❄ ❅ 💦 💧",
            "clock": "🕐 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛 🕜 🕝 🕞 🕟 🕠 🕡 🕢 🕣 🕤 🕥 🕦 🕧",
            "calendar": "🗓️ 📅 📆 ⌚ ⏰ 🔔 🗒️ 📜 ⏳ ⌛"
        }

    def run(self):
        """
        regularly request weather data
        """
        last_update = 0
        self.logging.info("Starting weather process 'Open-Meteo.com' for GPS=" + str(self.weather_location) + " ...")
        while self._running:

            # if last update is over since update interval or settings have been updated -> request new data
            if last_update + self.update_interval < time.time() or self.update_settings:
                self.logging.info("Read weather data (every " + str(self.update_interval) + "s) ...")
                last_update = time.time()
                if self.update_settings:
                    self._create_url()
                    self.update_settings = False
                self._request_data()
                self._convert_data()

            self.update_wait = (last_update + self.update_interval) - time.time()
            self.logging.debug("Wait to read weather data (" + str(round(self.update_interval, 1)) + ":" +
                               str(round(self.update_wait, 1)) + "s) ...")

            self.thread_wait()

        self.logging.info("Stopped weather process 'Open-Meteo.com'.")

    def _weather_descriptions(self, weather_code):
        """
        check if weather code exists and return description

        Args:
            weather_code (int): weather code
        Returns:
            str: description for weather code
        """
        if str(weather_code) in self.weather_descriptions:
            return self.weather_descriptions[str(weather_code)]
        else:
            return "unknown weather code ("+str(weather_code)+")"

    def _weather_icons(self, weather_code):
        """
        check if weather code exists and return icon

        Args:
            weather_code (int): weather code
        Returns:
            str: icon for weather code
        """
        if str(weather_code) in self.weather_icons:
            return self.weather_icons[str(weather_code)]
        else:
            return self.weather_icons[str(100)]

    def _create_url(self):
        """
        create API url
        """
        url = "https://api.open-meteo.com/v1/forecast?"
        url += "latitude=" + str(self.weather_location[0]) + "&longitude=" + str(self.weather_location[1])
        url += "&timezone=auto"
        url += "&current_weather=true"
        url += "&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode"
        url += "&daily=sunset,sunrise"
        self.weather_api = url

    def _request_data(self):
        """
        request weather data from API
        """
        data = "N/A"
        try:
            data = requests.get(url=self.weather_api, timeout=5)
            self.weather_raw_data = data.json()
            self.weather_update = self.config.local_time()
            self.error = False
        except Exception as e:
            self.logging.error(f"Could not read weather from open-meteo.com: {e}")
            self.logging.error(f"-> url: {self.weather_api}")
            self.logging.error(f"-> data: {data}")
            self.error = True
        return self.error

    def _convert_data(self):
        """
        convert data to own format (see birdhouse_weather in presets.py)
        """
        status = {
            "running": self._running,
            "paused": self._paused,
            "error": self.error,
            "error_msg": self.error_msg
        }
        self.weather_info["info_module"] = {
            "name": "Open Meteo",
            "provider_link": self.link_provider,
            "provider_link_required": self.link_required,
            "gps_lookup": self.link_gps_lookup
        }
        self.weather_info["info_module_link"] = self.link_provider
        self.weather_info["info_module_link_required"] = self.link_required
        self.weather_info["info_format"] = "metric"
        self.weather_info["info_status"] = status
        self.weather_info["info_update"] = self.weather_update.strftime("%d.%m.%Y %H:%M:%S")
        self.weather_info["info_update_stamp"] = self.weather_update.strftime("%H%M%S")
        self.weather_info["info_position"] = self.weather_location
        self.weather_info["info_rhythm"] = self.weather_update_rhythm

        if not self.error:
            self.weather_info["info_units"] = {
                "temperature": self.weather_raw_data["hourly_units"]["temperature_2m"],
                "humidity": self.weather_raw_data["hourly_units"]["relativehumidity_2m"],
                "wind_speed": self.weather_raw_data["hourly_units"]["windspeed_10m"]
            }

            self.weather_info["current"] = self.weather_raw_data["current_weather"]
            self.weather_info["current"]["wind_speed"] = self.weather_info["current"]["windspeed"]
            self.weather_info["current"]["description"] = self._weather_descriptions(self.weather_raw_data["current_weather"]["weathercode"])
            self.weather_info["current"]["description_icon"] = self._weather_icons(self.weather_raw_data["current_weather"]["weathercode"])

            today_stamp = self.weather_update.strftime("%Y-%m-%d")
            hourly_data_raw = self.weather_raw_data["hourly"]
            daily_data_raw = self.weather_raw_data["daily"]
            hourly_data = {}
            count = 0
            for key in hourly_data_raw["time"]:
                stamp_date, stamp_time = key.split("T")
                if count == 0:
                    today_stamp = stamp_date
                if stamp_date not in hourly_data:
                    hourly_data[stamp_date] = {}
                    hourly_data[stamp_date]["hourly"] = {}
                hourly_data[stamp_date]["hourly"][stamp_time] = {
                    "temperature": hourly_data_raw["temperature_2m"][count],
                    "wind_speed": hourly_data_raw["windspeed_10m"][count],
                    "humidity": hourly_data_raw["relativehumidity_2m"][count],
                    "description": self._weather_descriptions(hourly_data_raw["weathercode"][count]),
                    "description_icon": self._weather_icons(hourly_data_raw["weathercode"][count])
                }
                count += 1
            hourly_data["today"] = hourly_data[today_stamp]
            if not "sunrise" in  daily_data_raw or len(daily_data_raw["sunrise"]) == 0:
                hourly_data["today"]["sunrise"] = daily_data_raw["sunrise"][0].split("T")[1]
            else:
                hourly_data["today"]["sunrise"] = "N/A"
            if not "sunset" in  daily_data_raw or len(daily_data_raw["sunset"]) == 0:
                hourly_data["today"]["sunset"] = daily_data_raw["sunset"][0].split("T")[1]
            else:
                hourly_data["today"]["sunset"] = "N/A"

            self.weather_info["forecast"] = hourly_data

            current_date = self.weather_info["current"]["time"].split("T")[0]
            current_time = self.weather_info["current"]["time"].split("T")[1]
            self.weather_info["current"]["time"] = current_time
            self.weather_info["current"]["date"] = current_date
            current_time_hour = current_time.split(":")[0] + ":00"
            if current_time in self.weather_info["forecast"][current_date]["hourly"]:
                self.weather_info["current"]["humidity"] = self.weather_info["forecast"][current_date]["hourly"][current_time]["humidity"]
            elif current_time_hour in self.weather_info["forecast"][current_date]["hourly"]:
                self.weather_info["current"]["humidity"] = self.weather_info["forecast"][current_date]["hourly"][current_time_hour]["humidity"]
            else:
                self.weather_info["current"]["humidity"] = "N/A"

    def set_location(self, settings):
        """
        settings for weather

        Args:
            settings (dict): weather settings
        """
        self.weather_location = settings["gps_location"]
        self.update_settings = True

    def get_data(self):
        """
        return weather data from cache

        Returns:
            dict: weather information
        """
        if not self.error:
            data = self.weather_info.copy()
            return data
        else:
            return {"error": self.error, "error_msg": self.error_msg}


class ApiWeather(RemoteThreadingClass):
    """
    class to get and control weather data from OpenMeteo or Python Weather
    """

    def __init__(self, config):
        """
        start weather and sunrise function (https://pypi.org/project/python-weather/, https://api.open-meteo.com/)

        Args:
            config (modules.config.BirdhouseConfig): reference to config handler
        """
        RemoteThreadingClass.__init__(self, class_id="weather", name="weather")
        self.thread_priority(3)

        self.param = {}
        self.config = config
        self.initial_date = self.config.local_time().strftime("%Y%m%d")
        self.id = self.config.local_time().strftime("%H%M%S")

        self.weather = None
        self.weather_source = None
        self.weather_city = None
        self.weather_gps = None
        self.weather_info = {}
        self.weather_active = True
        self.weather_empty = {
            "info_update": "none",
            "info_update_stamp": "none",
            "info_city": "",
            "info_format": "",
            "info_position": "",
            "info_status": {"running": ""},
            "current": {
                "temperature": None,
                "description": "",
                "description_icon": "",
                "wind_speed": None,
                "uv_index": None,
                "pressure": None,
                "humidity": None,
                "wind_direction": "",
                "precipitation": None
            },
            "forecast": {
                "today": {}
            }
        }
        self.weather_info = self.weather_empty.copy()
        self.weather_info["info_status"]["running"] = "started"

        self.sunset_today = None
        self.sunrise_today = None
        self.last_get_weather = "N/A"

        self.error = False
        self.update = True
        self.update_time = 60 * 10
        self.update_wait = 0
        self.wrote_sunrise_sunset = False

        self.module = None
        self.connected = False
        self.got_first_data = False
        self.gps = ApiGPS()

    def run(self):
        """
        continuously request fresh data once a minute
        """
        self.logging.info("Starting Weather module ...")
        self.thread_wait()
        last_update = 0

        while self._running:

            # if config update or new day
            self.error = False
            if self.update or self.initial_date != self.config.local_time().strftime("%Y%m%d"):
                self.update = False
                self.connect(self.param)
                self.initial_date = self.config.local_time().strftime("%Y%m%d")

            # if paused
            if self._paused:
                self.weather_info = self.weather_empty.copy()
                self.weather_info["info_status"]["running"] = "paused"
                last_update = 0

            # last update has been a while
            elif last_update + self.update_time < time.time():
                self.logging.info(f"Get weather data from module (every {self.update_time}s/{self.weather_source}) ...")
                last_update = time.time()
                self.weather_info = self.module.get_data()
                self.last_get_weather = self.config.local_time().strftime("%H:%M:%S (%d.%m.%Y)")
                if not self.error and not self.module.error:
                    self.weather_info["info_status"]["running"] = "OK"
                    if "forecast" in self.weather_info and "today" in self.weather_info["forecast"]:
                        if "sunrise" in self.weather_info["forecast"]["today"]:
                            self.sunrise_today = self.weather_info["forecast"]["today"]["sunrise"]
                        if "sunset" in self.weather_info["forecast"]["today"]:
                            self.sunset_today = self.weather_info["forecast"]["today"]["sunset"]
                if not self.got_first_data:
                    self.got_first_data = True

            # write sunset and sunrise to main config
            #if not self.wrote_sunrise_sunset and self.sunset_today is not None and self.sunrise_today is not None:
            #    self.param["weather"]["last_sunrise"] = self.sunrise_today
            #    self.param["weather"]["last_sunset"] = self.sunset_today
            #    self.param["weather"]["last_sun_update"] = self.config.local_time().strftime("%Y%m%d %H:%M:%S")
            #    #self.db_handler.write(config="main", data=self.config.param)
            #    self.wrote_sunrise_sunset = True

            # write weather data to file once every five minutes
            #weather_stamp = self.config.local_time().strftime("%H%M")+"00"
            #if int(self.config.local_time().strftime("%M")) % 5 == 0:
            #    self.logging.info("Write weather data to file ...")
            #    weather_data = self.get_weather_info("current")
            #    self.config.queue.entry_add(config="weather", date="", key=weather_stamp, entry=weather_data)
            #    time.sleep(60)

            # check if data are correct
            if "current" not in self.weather_info:
                self.logging.error("Weather data not correct (missing 'current').")
                self.weather_info = self.weather_empty.copy()
                self.error = True

            # move errors to status info
            if self.error or self.module.error:
                self.weather_info["info_status"]["running"] = "error"

            # if error wait longer for next action
            if "info_status" in self.weather_info and "running" in self.weather_info["info_status"] \
                    and self.weather_info["info_status"]["running"] == "error":
                self.thread_wait()

            self.update_wait = (last_update + self.update_time) - time.time()
            self.logging.debug("Wait to read weather data (" + str(round(self.update_time, 1)) + ":" +
                               str(round(self.update_wait, 1)) + "s) ...")

            self.thread_wait()

        self.logging.info("Stopped weather module.")

    def stop(self):
        """
        stop weather loop
        """
        self._running = False
        self.connected = False
        self.module.stop()

    def active(self, active):
        """
        set if active or inactive (used via config.py)

        Args:
            active (bool): active
        """
        self.weather_active = active
        if active:
            self._paused = False
        else:
            self._paused = True

    def connect(self, param):
        """
        (re)connect to weather module

        Args:
            param (dict): weather parameters
        Returns:
            bool: True if connected
        """
        self.param = param

        if not ("source" in param and ("location" in param or "gps_location" in param)):
            self.logging.error(f"Parameters missing to start weather module ({param}).")
            self.connected = False
            return False

        self.weather_source = param["source"]
        self.logging.info(f"(Re)connect weather module (source={self.weather_source})")
        update_gps = False
        if self.update:
            update_gps = True

        if self.weather_source == "Open-Meteo":
            if not "location" in param:
                param["location"] = "N/A"
            self.weather_city = param["location"]
            if "gps_location" in param and param["gps_location"] != [0, 0] and len(param["gps_location"]) >= 2 and not update_gps:
                self.weather_gps = param["gps_location"]
            else:
                self.weather_gps = self.gps.look_up_location(self.weather_city)

            if self.module is None:
                self.module = ApiOpenMeteo(config=self.config, gps_location=self.weather_gps)
                self.module.start()
                self.connected = True
            else:
                # reset location open ...
                self.logging.info("Weather module already connected.")
                self.logging.warning("Reset to new location not implemented yet ...")

            return True


        else:
            self.logging.error(f"Weather module {param["source"]} doesn't exists.")
            self.connected = False
            return False

    def get_gps_info(self, param):
        """
        lookup GPS information to be saved in the main configuration

        Args:
            param (dict): weather parameters
        Returns:
            dict: updated weather parameters
        """
        if not "location" in param:
            param["location"] = "N/A"
        self.weather_city = param["location"]
        self.weather_gps = self.gps.look_up_location(self.weather_city)
        if self.weather_gps[0] != 0 and self.weather_gps[1] != 0:
            param["gps_location"] = self.weather_gps
            self.logging.info("Found GPS: '" + str(self.weather_gps) + "'.")
        else:
            self.logging.warning("Could not get GPS data: " + str(self.weather_gps))
        return param

    def get_weather_info(self, info_type="all"):
        """
        return information with different level of detail

        Args:
            info_type (str): type of weather data (status, current_small, current)
        Returns:
            dict: weather information
        """
        if "current" not in self.weather_info:
            self.logging.error("Weather data not correct (get_weather_info): " + str(self.weather_info))
            self.weather_info = self.weather_empty.copy()

        if info_type == "status":
            status = self.weather_info["info_status"].copy()
            status["gps_coordinates"] = self.weather_gps
            status["gps_location"] = self.weather_city
            status["active"] = self.param["active"]
            return status

        if info_type == "current_small":
            weather_data = self.weather_info["current"]
            if "humidity" not in weather_data:
                weather_data["humidity"] = ""
            info = {
                "description_icon": weather_data["description_icon"],
                "description": weather_data["description"],
                "temperature": weather_data["temperature"],
                "humidity": weather_data["humidity"],
                # "pressure": weather_data["pressure"],
                "wind": weather_data["wind_speed"]
            }
            return info

        elif info_type == "current":
            return self.weather_info["current"]

        elif info_type == "current_extended":
            info = self.weather_info.copy()
            del info["forecast"]
            return info

        return self.weather_info

    def get_sunrise(self):
        """
        get sunrise time

        Returns:
            str: sunrise time of today
        """
        return self.sunrise_today

    def get_sunset(self):
        """
        get sunset time

        Returns:
            str: sunset time of today
        """
        return self.sunset_today
