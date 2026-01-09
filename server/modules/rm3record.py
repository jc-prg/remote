import time
import os
import server.modules.rm3presets as rm3presets
import server.modules.rm3json as rm3json
from server.modules.rm3classes import RemoteThreadingClass


class RecordData(RemoteThreadingClass):
    """
    class to record data in a database, e.g., temperature or a device state
    """

    def __init__(self, config):
        """
        Class constructor
        """
        RemoteThreadingClass.__init__(self, "record", "record")
        self.config_example = {
            "config" : {
                "record_interval": 600,
                "record_timing": {"start":"5:00", "end":"22:00"},
                "record": {
                    "sensor_temperature" : {"label": "Temperatur", "unit": "°C"},
                    "sensor_humidity": {"label": "Feuchte", "unit": "%"}
                }
            },
            "data": {
                "available": []
            },
            "info": "jc://remote/ - In this files values can be recorded."
        }
        self.record_example = {
                "data": {
                    "keys": [
                        "plug10_e-energy",
                        "sensor_humidity",
                        "sensor_temperature"
                    ],
                    "labels": [
                        "Stromverbrauch",
                        "Feuchte",
                        "Temperatur"
                    ],
                    "record": {
                        "09:49": [
                            None,
                            59,
                            20
                        ],
                        "09:50": [
                            4.14,
                            58.1,
                            20.1
                        ]
                    },
                    "summary": {
                        "plug10_e-energy": {
                            "average": 4.14,
                            "maximum": 4.14,
                            "minimum": 4.14
                        },
                        "sensor_humidity": {
                            "average": 58.6,
                            "maximum": 59,
                            "minimum": 58.1
                        },
                        "sensor_temperature": {
                            "average": 20.05,
                            "maximum": 20.1,
                            "minimum": 20.0
                        }
                    },
                    "units": [
                        "kWh",
                        "%",
                        "°C"
                    ]
                }
            }
        self.config_empty = {
            "config": {
                "record_interval": 600,
                "record_timing": {"start":-1, "end":-1},
                "record": {}
            },
            "data": {},
            "info": "jc://remote/ - In this files values can be recorded."
        }
        self.config_file = rm3presets.active_record
        self.status_file = rm3presets.active_devices
        self.config = config
        self.status_data = {}
        self.record_data = {}
        self.record_interval = 30 #10 * 60
        self.record_start = 0
        self.record_end = 0
        self.record_values = {}
        self.record_available = []
        self.last_record = 0
        self.record_is_working = False

    def run(self):
        """
        Run to schedule events
        """
        while not self.config.all_available_api_loaded:
            time.sleep(1)

        self.logging.info("Starting recording thread ...")
        self.initial_load()
        while self._running:
            if time.time() - self.last_record > self.record_interval:
                #self.record_values_now()
                self.record_values_now2()

            self.thread_wait()

        self.logging.info("Stopped " + self.name)

    def initial_load(self):
        """
        Check if config file exists, create or load data
        """
        self.record_data = self.config.read(self.config_file, from_file=True)

        if "ERROR" in self.record_data:
            self.logging.info(f"No data available, create new file {self.config_file}.json.")
            self.config.write(self.config_file, self.config_empty, "record.initial_load()")
            self.record_data = self.config.read(self.config_file, from_file=False)

        self.record_interval = self.record_data["config"]["record_interval"]
        self.record_start = self.record_data["config"]["record_timing"]["start"]
        self.record_end = self.record_data["config"]["record_timing"]["end"]
        self.record_values = self.record_data["config"]["record"]
        self.record_available = rm3json.available(rm3presets.record)

        self.last_record = time.time()

    def record_values_now2(self):
        """
        record defined values in the defined interval
        """
        self.wait_while_working()
        self.is_working(True)

        record_date = self.config.local_time().strftime("%Y-%m-%d")
        record_time = self.config.local_time().strftime("%H:%M")
        record_file = os.path.join(rm3presets.record, record_date)
        record_data = self.config.read(record_file, from_file=True)
        status_data = self.config.read(self.status_file)
        record_values = self.record_data["config"]["record"]

        if "ERROR" in record_data:
            record_data = {
                "data": {
                    "date": record_date,
                    "keys": [],
                    "labels": [],
                    "record": {},
                    "units": [],
                    "summary": {}
                }
            }

        for record_value in record_values:
            if not record_value in record_data["data"]["keys"]:
                record_data["data"]["keys"].append(record_value)
                if "unit" in record_values[record_value]:
                    record_data["data"]["units"].append(record_values[record_value]["unit"])
                else:
                    record_data["data"]["units"].append("")
                if "label" in record_values[record_value]:
                    record_data["data"]["labels"].append(record_values[record_value]["label"])
                else:
                    record_data["data"]["labels"].append(None)

        self.logging.debug(str(record_data["data"]))

        record_item = []
        count = 0
        for record_value in record_data["data"]["keys"]:
            device, value = record_value.split("_", 1)

            if device not in status_data:
                self.logging.warning(f"Device {device} not found in {self.status_file}.json")
                status_value = None
            elif value not in status_data[device]["status"]:
                self.logging.warning(f"Value {record_value} not found in {self.status_file}.json")
                status_value = None
            elif status_data[device]["status"][value] == "N/A":
                status_value = None
            else:
                status_value = status_data[device]["status"][value]

                if "unit" in self.record_data["config"]["record"][record_value]:
                    unit = self.record_data["config"]["record"][record_value]["unit"]
                    self.logging.debug(f"{status_value} / {unit}")
                    status_value = status_value.replace(unit, "")
                    status_value = float(status_value)

            record_item.append(status_value)

        if record_time not in record_data["data"]["record"]:
            record_data["data"]["record"][record_time] = []
        record_data["data"]["record"][record_time] = record_item
        record_data["data"]["date"] = record_date

        count = 0
        summary = {}
        for record_value in record_data["data"]["keys"]:
            if record_value not in summary:
                summary[record_value] = []

            for time_stamp in record_data["data"]["record"]:
                record_item = record_data["data"]["record"][time_stamp]
                if len(record_item) > count and record_item[count] is not None:
                    summary[record_value].append(record_item[count])

            if len(summary[record_value]) > 1:
                record_data["data"]["summary"][record_value] = {
                    "minimum": min(summary[record_value]),
                    "maximum": max(summary[record_value]),
                    "average": sum(summary[record_value]) / len(summary[record_value])
                }
            count += 1

        self.config.write(record_file, record_data, "record_values_now2()")

        self.record_data = self.config.read(self.config_file, from_file=True)
        self.record_available = rm3json.available(rm3presets.record)
        self.record_data["data"]["available"] = self.record_available
        self.config.write(self.config_file, self.record_data, "record_values_now()")

        self.last_record = time.time()
        self.is_working(False)

    def record_values_now(self):
        """
        record defined values in the defined interval
        """
        self.wait_while_working()
        self.is_working(True)

        record_date = self.config.local_time().strftime("%Y-%m-%d")
        record_time = self.config.local_time().strftime("%H:%M")
        self.record_data = self.config.read(self.config_file, from_file=True)
        self.status_data = self.config.read(self.status_file)
        self.record_values = self.record_data["config"]["record"]

        count = 0
        for record_value in self.record_values:
            device, value = record_value.split("_", 1)

            if device not in self.status_data:
                self.logging.warning(f"Device {device} not found in {self.status_file}.json")
                continue
            elif value not in self.status_data[device]["status"]:
                self.logging.warning(f"Value {record_value} not found in {self.status_file}.json")
                continue
            elif self.status_data[device]["status"][value] == "N/A":
                continue

            status_value = self.status_data[device]["status"][value]
            if "unit" in self.record_values[record_value]:
                self.logging.debug(f"{status_value} / {self.record_values[record_value]["unit"]}")
                status_value = status_value.replace(self.record_values[record_value]["unit"], "")
                status_value = float(status_value)

            if record_date not in self.record_data["data"]:
                self.record_data["data"][record_date] = {}
            if record_time not in self.record_data["data"][record_date]:
                self.record_data["data"][record_date][record_time] = {}
            self.record_data["data"][record_date][record_time][record_value] = status_value

            count += 1
            self.logging.debug(f"record --> {record_date} {record_time} : {record_value} : {status_value}")

        self.config.write(self.config_file, self.record_data, "record_values_now()")
        self.last_record = time.time()
        self.is_working(False)

    def edit_config(self, config):
        """
        change config values

        Args:
            config (dict): recording configuration, see self.config_example["config"] in __init__
        """
        self.wait_while_working()
        self.is_working(True)

        # add code in between

        self.is_working(False)

    def get_chart_data(self, filter_date="", filter_values=None):
        """
        get data for chart.js to be visualized in the app

        Args:
            filter_date (str): date to filter the data in the format "YYYY-MM-DD"
            filter_values (list): list of values to return, e.g., ["sensor_temperature", "sensor_humidity"]
        Returns:
            dict: returns data to be used with rm_charts.js directly
                  data = { "label1" : [1, 2, 3], "label2" : [1, 2, 3] }
                  ??? transfer to date/time/label/value
        """
        self.wait_while_working()
        self.is_working(True)

        if filter_date == "TODAY":
            filter_date = self.config.local_time().strftime("%Y-%m-%d")

        self.record_data = self.config.read(self.config_file)
        record_file = os.path.join(rm3presets.record, filter_date)
        record_data = self.config.read(record_file, from_file=True)

        if not "ERROR" in record_data:
            chart_data = {
                "labels" : record_data["data"]["labels"],
                "units" : record_data["data"]["units"],
                "data" : record_data["data"]["record"],
                "title": filter_date
            }
        else:
            chart_data = { "labels": [], "units": [], "data": {}, "title": filter_date }

        self.is_working(False)
        return chart_data

    def get_available_dates(self):
        """
        get a list of available dates

        Returns:
            list: list of available dates
        """
        self.record_data = self.config.read(self.config_file)
        return self.record_data["data"]["available"]

    def get_config(self):
        """
        get config values

        Returns:
            dict: config values
        """
        self.record_data = self.config.read(self.config_file)
        return self.record_data["config"]

    def is_working(self, status=None):
        """
        control working status to avoid corrupt files
        """
        if status is None:
            return self.record_is_working
        else:
            self.record_is_working = status
            return None

    def wait_while_working(self):
        """
        wait while working
        """
        while self.record_is_working:
            time.sleep(0.05)
