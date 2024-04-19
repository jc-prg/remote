import logging
import time
import datetime
import threading
import modules.rm3config as rm3config


class QueueApiCalls(threading.Thread):
    """
    class to create a queue to send commands (or a chain of commands) to the devices
    -> see server_fnct.py: a queue for send commands and another queue for query commands, as query commands take some time
    """

    def __init__(self, name, query_send, device_apis):
        """
        create queue, set name
        """
        threading.Thread.__init__(self)
        self.last_query_time = None
        self.last_query = None
        self.queue = []
        self.name = name
        self.stopProcess = False
        self.wait = 0.01
        self.device_apis = device_apis
        self.device_reload = []
        self.last_button = "<none>"
        self.config = ""
        self.query_send = query_send
        self.reload = False
        self.exec_times = {}
        self.average_exec = {}

        self.logging = logging.getLogger("queue")
        self.logging.setLevel = rm3config.log_set2level

    def run(self):
        """
        loop running in the background
        """

        self.logging.info("Starting " + self.name)
        count = 0
        while not self.stopProcess:

            if len(self.queue) > 0:
                command = self.queue.pop(0)
                self.execute(command)
                # self.logging.info("."+command[1]+command[2])

            else:
                time.sleep(self.wait)

                # send life sign from time to time
                if count * self.wait > 360:
                    tt = time.time()
                    self.logging.info("Queue running " + str(tt))
                    count = 0

            count += 1

        self.logging.info("Exiting " + self.name)

    def execute(self, command):
        """
        execute command or wait
        SEND  -> command = number or command = [interface,device,button,state]
        QUERY -> command = number or command = [interface,device,[query1,query2,query3,...],state]
        """

        # read device information if query
        devices = {}
        if self.config != "" and self.query_send == "query":
            devices = self.config.read_status()

        # check, if reload is requested ...
        if "START_OF_RELOAD" in str(command):
            self.reload = True
        elif "END_OF_RELOAD" in str(command):
            self.reload = False

        # if is an array / not a number
        elif "," in str(command):

            interface, device, button, state, request_time = command

            self.logging.debug("Queue: Execute " + self.name + " - " + str(interface) + ":" + str(device) + ":" +
                               str(button) + ":" + str(state) + ":" + str(request_time))
            self.logging.debug(str(command))

            if self.query_send == "send":
                try:
                    result = self.device_apis.api_send(interface, device, button, state)
                    self.execution_time(device, request_time, time.time())
                    self.last_query_time = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
                    self.logging.debug(result)

                except Exception as e:
                    result = "ERROR queue query_list (send," + interface + "," + device + "," +\
                             button + "=" + str(state) + "): " + str(e)
                    self.logging.error(result)

            elif self.query_send == "query":
                for value in button:
                    try:
                        result = self.device_apis.api_query(interface, device, value)
                        # self.execution_time(device,request_time,time.time())

                        self.last_query = device + "_" + value
                        self.last_query_time = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
                        devices[device]["status"]["api-last-query"] = self.last_query_time
                        devices[device]["status"]["api-last-query-tc"] = int(time.time())
                        devices[device]["status"]["api-status"] = \
                            self.device_apis.api[self.device_apis.device_api_string(device)].status
                        self.logging.debug(result)

                    except Exception as e:
                        result = "ERROR queue query_list (query," + str(interface) + "," + str(device) + "," + str(
                            value) + "): " + str(e)
                        self.logging.error(result)

                    if "ERROR" not in str(result):
                        devices[device]["status"][value] = str(result)
                    else:
                        devices[device]["status"][value] = "Error"

                if self.config != "":
                    self.config.write_status(devices, "execute (" + str(command) + ")")

        # if is a number
        else:
            time.sleep(float(command))

    def add_reload_commands(self, commands):
        """
        add list of commands required for reloading device data
        """

        if commands == "RESET":
            self.device_reload = []
        else:
            self.device_reload.append(commands)

    def add2queue(self, commands):
        """
        add single command or list of commands to queue
        """
        self.logging.debug("Add to queue " + self.name + ": " + str(commands))

        # set reload status
        if "START_OF_RELOAD" in str(commands):
            self.reload = True

        # or add command to queue
        else:
            for command in commands:
                if "," in str(command):
                    command.append(time.time())  # add element to array
                self.queue.append(command)       # add command array to queue

        return "OK: Added command(s) to the queue '" + self.name + "': " + str(commands)

    def stop(self):
        """stop thread"""

        self.stopProcess = True

    def execution_time(self, device, start_time, end_time):
        """
        calculate the average execution time per device (duration between request time and time when executed)
        """

        average_round = 6
        average_count = 20
        average_start = 0
        duration = end_time - start_time

        if device in self.exec_times:
            average_start = self.average_exec[device]
            self.exec_times[device].append(duration)
            if len(self.exec_times[device]) > average_count:
                self.exec_times[device].pop(1)

        else:
            self.exec_times[device] = []
            self.exec_times[device].append(duration)

        total = 0
        for d in self.exec_times[device]: total += d
        self.average_exec[device] = total / len(self.exec_times[device])
        average_diff = self.average_exec[device] - average_start

        self.logging.info("__EXEC TIME: '" + device + "' average: " + str(
            round(self.average_exec[device], average_round)) + " / last " + str(
            round(duration, average_round)) + " / change " + str(round(average_diff, average_round)))
