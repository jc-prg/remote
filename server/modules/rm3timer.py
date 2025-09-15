import time
import re
import server.modules.rm3presets as rm3presets
from datetime import datetime
from server.modules.rm3classes import RemoteThreadingClass


class ScheduleTimer(RemoteThreadingClass):
    """
    class to schedule events based on macros and buttons
    """

    def __init__(self, config, apis, data):
        """
        Class constructor
        """
        RemoteThreadingClass.__init__(self, "schedule", "schedule")
        self.initial_config = {
            "data": {
                "timer_001": {
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
        self.apis = apis
        self.data = data

        self.schedule = self.config.read(rm3presets.active_timer)
        self.schedule_tryout = []
        self.schedule_short = {}
        self.schedule_short_recreate = 3600
        self.schedule_short_created = time.time()
        self.schedule_short_create = False
        self.last_execute = None

        if "ERROR" in self.schedule:
            self.config.write(rm3presets.active_timer, self.initial_config)
            self.schedule = self.initial_config

    def run(self):
        """
        Run to schedule events
        """
        time.sleep(10)
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
        self.schedule_short = {}

        if "data" not in self.schedule:
            self.logging.error("Schedule data not correct.")
            self.logging.error("-> " + str(self.schedule))
            return

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
                if int(timer_time["month"]) != -1:
                    timestamp += timer_time["month"] + "-"
                else:
                    timestamp += "**-"
                if int(timer_time["day_of_month"]) != -1:
                    timestamp += timer_time["day_of_month"]
                else:
                    timestamp += "**"
                timestamp += "-"
                if int(timer_time["hour"]) != -1:
                    timestamp += timer_time["hour"] + "-"
                else:
                    timestamp += "**-"
                if int(timer_time["minute"]) != -1:
                    timestamp += timer_time["minute"]
                else:
                    timestamp += "**"
                timestamp += "-"
                if int(timer_time["day_of_week"]) != -1:
                    timestamp += timer_time["day_of_week"]
                else:
                    timestamp += "*"
                self.logging.debug("TIMER_REGULAR: " + timestamp)

                if timestamp not in self.schedule_short:
                    self.schedule_short[timestamp] = []

                self.schedule_short[timestamp].append(key)

        self.logging.debug("Schedule short: " + str(self.schedule_short))

    def schedule_check(self):
        """
        check if there are events to be started
        """
        #now = datetime.now().strftime("%Y-%m-%d-%H-%M-%w")
        now = self.config.local_time().strftime("%Y-%m-%d-%H-%M-%w")
        if now == self.last_execute:
            return

        self.logging.info("Check if timer is scheduled (~60s) ...")
        self.last_execute = now
        n_year, n_month, n_day, n_hour, n_minute, n_week_day = now.split("-")

        execute = self.schedule_tryout
        self.schedule_tryout = []

        for compare in self.schedule_short:
            year, month, day, hour, minute, week_day = compare.split("-")

            if ((year == "****" or int(year) == int(n_year))
                    and (month == "**" or int(month) == int(n_month))
                    and (day == "**" or int(day) == int(n_day))
                    and (hour == "**" or int(hour) == int(n_hour))
                    and (minute == "**" or int(minute) == int(n_minute))
                    and (week_day == "*" or int(week_day) == int(n_week_day))):

                if self.schedule_short[compare] not in execute:
                    execute.extend(self.schedule_short[compare])

        if len(execute) > 0:
            self.logging.info("__EXECUTE TIMER: " + str(execute) + " ... " + str(now))
            for timer_id in execute:
                self.schedule_timer_execute(self.schedule["data"][timer_id])
        else:
            self.logging.debug("__EXECUTE TIMER: ... Nothing to execute at the moment")

    def schedule_timer_try(self, timer_id):
        """
        add timer to be tried out immediately to queue

        Args:
            timer_id (str): timer id
        Return:
            str: OK
        """
        self.logging.info("Add timer '" + timer_id + "' to queue to try out ...")
        self.schedule_tryout.append(timer_id)
        return "OK"

    def schedule_timer_execute(self, timer_config):
        """
        execute a timer config

        Args:
            timer_config (dict): config data of timer event (ID will be created automatically)
        """
        self.logging.debug("Execute timer event " + timer_config["name"] + " ...")
        try:
            commands = timer_config["commands"]
            commands_decomposed = self.data.macro_decode(commands)
            self.logging.info("__EXECUTE TIMER: " + str(commands_decomposed))

            act_devices = self.config.read(rm3presets.active_devices)
            for command in commands_decomposed:
                device = ""
                button = ""
                value = ""

                if "||" in str(command):
                    command, value = command.split("||")
                if "_" in str(command):
                    device, rest = command.split("_")
                    button = command.replace(device+"_", "")

                if type(command) is int:
                    time.sleep(command)
                    self.logging.debug("WAIT: " + str(command) + "s")

                elif device in act_devices and button != "":
                    call_api = act_devices[device]["config"]["api_key"] + "_" + act_devices[device]["config"]["api_device"]
                    self.logging.debug("SEND: call_api="+call_api+", device="+device+", button="+button+", value="+value)
                    self.apis.api_send(call_api=call_api, device=device, button=button, value=value)

        except Exception as e:
            self.logging.error("Could not execute timer event: " + str(e))

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
        amount = 1

        while "timer_" + str(amount).rjust(3,"0") in self.schedule["data"]:
            amount += 1

        timer_id = "timer_" + str(amount).rjust(3, "0")
        return timer_id
