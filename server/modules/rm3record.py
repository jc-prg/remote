import time
import server.modules.rm3presets as rm3presets
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
                "record_values": ["sensor_temperature", "sensor_humidity"],
                "record_units": ["°C", "%"]
            },
            "data": {
                "2026-01-01": {
                    "10:00": {
                        "sensor_temperature": 21.0,
                        "sensor_humidity": 20.0,
                    },
                    "10:10": {
                        "sensor_temperature": 21.0,
                        "sensor_humidity": 20.0,
                    }
                },
                "2026-01-02": {
                    "10:00": {
                        "sensor_temperature": 21.0,
                        "sensor_humidity": 20.0,
                    },
                    "10:10": {
                        "sensor_temperature": 21.0,
                        "sensor_humidity": 20.0,
                    }
                }
            },
            "info": "jc://remote/ - In this files values can be recorded."
        }
        self.config_empty = {
            "config": {
                "record_interval": 600,
                "record_timing": {"start":-1, "end":-1},
                "record_values": [],
                "record_units": []
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
        self.record_values = []
        self.record_units = []
        self.last_record = 0

    def run(self):
        """
        Run to schedule events
        """
        time.sleep(10)
        self.logging.info("Starting recording thread ...")
        self.initial_load()
        while self._running:
            if time.time() - self.last_record > self.record_interval:
                self.record_values_now()

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
        self.record_values = self.record_data["config"]["record_values"]
        self.record_units = self.record_data["config"]["record_units"]
        self.last_record = time.time()

    def record_values_now(self):
        """
        record defined values in the defined interval
        """
        record_date = self.config.local_time().strftime("%Y-%m-%d")
        record_time = self.config.local_time().strftime("%H:%M")
        self.record_data = self.config.read(self.config_file, from_file=True)
        self.status_data = self.config.read(self.status_file)

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
            if len(self.record_values) == len(self.record_units):
                status_value = float(status_value.replace(self.record_units[count], ""))

            if record_date not in self.record_data["data"]:
                self.record_data["data"][record_date] = {}
            if record_time not in self.record_data["data"][record_date]:
                self.record_data["data"][record_date][record_time] = {}
            self.record_data["data"][record_date][record_time][record_value] = status_value

            count += 1
            self.logging.debug(f"record --> {record_date} {record_time} : {record_value} : {status_value}")

        self.config.write(self.config_file, self.record_data, "record_values_now()")
        self.last_record = time.time()
