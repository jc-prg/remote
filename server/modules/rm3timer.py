import time
import re
import modules.rm3presets as rm3presets
from datetime import datetime
from modules.rm3classes import RemoteThreadingClass


class ScheduleTimer(RemoteThreadingClass):
    """
    class to schedule events based on macros and buttons
    """

    def __init__(self, config):
        """
        Class constructor
        """
        RemoteThreadingClass.__init__(self, "schedule", "schedule")
        self.initial_config = {
            "data": {
                "sample_timer": {
                    "name":             "Sample timer",
                    "description":      "Sample timer event, to demonstrate the timer functionality",
                    "commands":         ["plug01_toggle"],
                    "timer_regular":    {"active": False, "month": -1, "day_of_month": -1, "day_of_week": -1,
                                         "hour": -1, "minute": -1},
                    "timer_once":       [{"active": False, "date": "2024-05-11", "time": "18:00"}]
                }
            },
            "info": "jc://remote/ - In this files the scheduling of timer events is defined."
        }
        self.config = config

        self.schedule = self.config.read(rm3presets.active_timer)
        self.schedule_short = {}
        self.schedule_short_recreate = 3600
        self.schedule_short_created = time.time()
        self.schedule_short_create = False
        self.last_execute = None

        if "ERROR" in self.schedule:
            self.config.write(rm3presets.active_timer, self.initial_config)

    def run(self):
        """
        Run to schedule events
        """
        self.logging.info("Starting ScheduleTimer ...")
        self.schedule_create_short()
        while self._running:

            if self.schedule_short_created + self.schedule_short_recreate < time.time() or self.schedule_short_create:
                self.schedule_short_create = False
                self.schedule_short_created = time.time()
                self.schedule_create_short()

            self.schedule_check()
            self.thread_wait()

        self.logging.info("Stopped " + self.name + ".")

    def get_timer_events(self):
        """
        get configuration files

        Returns:
            dict: all defined schedule events
        """
        return self.schedule["data"]

    def schedule_create_short(self):
        """
        create short schedule for processing, ID contains timing information and VALUE is a list of timer_ids
        """
        self.logging.info("Create short schedule information ...")
        for key in self.schedule["data"]:
            timer_config = self.schedule["data"][key]

            for entry in timer_config["timer_once"]:
                if entry["active"]:
                    timestamp = entry["date"] + "-" + entry["time"]
                    timestamp = timestamp.replace(":", "-")
                    timestamp = timestamp + "-*"
                    self.logging.info("TIMER_ONCE: " + timestamp)
                    if timestamp not in self.schedule_short:
                        self.schedule_short[timestamp] = []
                    self.schedule_short[timestamp].append(key)

            if timer_config["timer_regular"]["active"]:
                timer_time = timer_config["timer_regular"]
                timestamp = "****-"
                if timer_time["month"] != -1:
                    timestamp += timer_time["month"] + "-"
                else:
                    timestamp += "**-"
                if timer_time["day_of_month"] != -1:
                    timestamp += timer_time["day_of_month"]
                else:
                    timestamp += "**"
                timestamp += "-"
                if timer_time["hour"] != -1:
                    timestamp += timer_time["hour"] + "-"
                else:
                    timestamp += "**-"
                if timer_time["minute"] != -1:
                    timestamp += timer_time["minute"]
                else:
                    timestamp += "**"
                timestamp += "-"
                if timer_time["day_of_week"] != -1:
                    timestamp += timer_time["day_of_week"]
                else:
                    timestamp += "*"
                self.logging.info("TIMER_REGULAR: " + timestamp)

                if timestamp not in self.schedule_short:
                    self.schedule_short[timestamp] = []
                self.schedule_short[timestamp].append(key)

    def schedule_check(self):
        """
        check if there are events to be started
        """
        now = datetime.now().strftime("%Y-%m-%d-%H-%M-%A")
        if now == self.last_execute:
            return

        self.logging.info("Check if timer is scheduled ...")
        self.last_execute = now
        n_year, n_month, n_day, n_hour, n_minute, n_week_day = now.split("-")

        execute = []
        for compare in self.schedule_short:
            year, month, day, hour, minute, week_day = compare.split("-")

            if ((year == "****" or year == n_year)
                    and (month == "**" or month == n_month)
                    and (day == "**" or day == n_day)
                    and (hour == "**" or hour == n_hour)
                    and (minute == "**" or minute == n_minute)
                    and (week_day == "*" or week_day == n_week_day)):

                execute.extend(self.schedule_short[compare])

        if len(execute) > 0:
            self.logging.info("__EXECUTE: " + str(execute))
            for timer_id in execute:
                self.logging.info(timer_id)
                self.schedule_timer_execute(self.schedule["data"][timer_id])
        else:
            self.logging.debug("__EXECUTE ... Nothing to execute at the moment")

    def schedule_timer_execute(self, timer_config):
        """
        execute a timer config

        Args:
            timer_config (dict): config data of timer event (ID will be created automatically)
        """
        self.logging.debug("Execute timer event " + timer_config["name"] + " ...")
        commands = timer_config["commands"]
        self.logging.warning("EXECUTE: " + str(commands))

    def schedule_timer_add(self, timer_config):
        """
        add timer event
        """
        self.logging.debug("Add timer event " + timer_config["name"] + " ...")
        timer_id = self.schedule_timer_create_id(timer_config["name"])
        self.schedule["data"][timer_id] = timer_config
        self.config.write(rm3presets.active_timer, self.schedule)
        self.schedule_short_create = True

    def schedule_timer_edit(self, timer_id, timer_config):
        """
        edit an existing timer event

        Args:
            timer_id (str): ID of timer event
            timer_config (dict): config data of timer event
        """
        self.logging.debug("Edit timer event " + timer_config["name"] + " (" + timer_id + ") ...")
        if timer_id in self.schedule["data"]:
            self.schedule["data"][timer_id] = timer_config
        else:
            self.logging.error("Did not find a timer with the ID '" + timer_id + "'")
        self.config.write(rm3presets.active_timer, self.schedule)
        self.schedule_short_create = True

    def schedule_timer_delete(self, timer_id):
        """
        delete an existing timer event

        Args:
            timer_id (str): ID of timer event
        """
        self.logging.debug("Delete timer event " + timer_id + " ...")
        if timer_id in self.schedule["data"]:
            del self.schedule["data"][timer_id]
        else:
            self.logging.error("Did not find a timer with the ID '" + timer_id + "'")
        self.config.write(rm3presets.active_timer, self.schedule)
        self.schedule_short_create = True

    def schedule_timer_create_id(self, timer_name):
        """
        create id base on given name

        Args:
            timer_name (str): Name of the timer
        Returns:
            str: ID string for the timer entry
        """
        self.logging.debug("Create id from timer name '" + timer_name + "' ...")
        if timer_name == "":
            timer_name = "timer_01"

        timer_id = timer_name.lower()
        timer_id = re.sub('[^0-9a-zA-Z]+', '_', timer_id)

        digits_at_end = re.search(r'\d+$', text)
        if digits_at_end:
            digits_at_end = digits_at_end.group(0)
        else:
            digits_at_end = ""

        if timer_id in self.schedule["data"] and digits_at_end == "":
            timer_id = timer_id + "_02"
        else:
            timer_id = timer_id[:-len(digits_at_end)] + str(int(digits_at_end)+1)

        return timer_id
