import time
import datetime
from server.modules.rm3classes import RemoteThreadingClass


class QueueApiCalls(RemoteThreadingClass):
    """
    class to create a queue to send commands (or a chain of commands) to the devices
    -> see server_cmd.py / rm3data.py: a queue for send commands and another queue for query commands,
       as query commands take some time
    """

    def __init__(self, name, query_send, device_apis, config):
        """
        create queue, set name
        """
        RemoteThreadingClass.__init__(self, "Q-"+query_send, name)

        self.last_query_time = None
        self.last_query = None
        self.queue = []
        self.name = name
        self.device_apis = device_apis
        self.device_reload = []
        self.last_button = "<none>"
        self.config = config
        self.query_send = query_send
        self.query_log = []
        self.query_log_length = 100
        self.reload = False
        self.reload_time = time.time()
        self.exec_times = {}
        self.average_exec = {}

        self.thread_priority(1)

    def run(self):
        """
        loop running in the background
        """
        while not self.config.all_available_api_loaded:
            time.sleep(1)

        self.logging.info("Starting " + self.name)
        count = 0

        while self._running:

            if len(self.queue) == 0:
                self.thread_wait(use_wait_time=0.04)
                count += 1
                if count > 10000:
                    self.logging.info("Queue still running.")
                    count = 0
                continue

            now = time.time()
            if "," in str(self.queue[0]):
                interface, device, button, state, request_time, execution_time = self.queue[0]

                if now >= execution_time:
                    self.logging.debug("Execute: - " + str(device) + " " + str(button) + " - " + time.strftime("%H:%M:%S", time.localtime(execution_time)))
                    cmd = self.queue.pop(0)
                    self.execute(cmd)
                else:
                    self.logging.debug("Wait to execute: " + str(device) + " " + str(button) + " - " + time.strftime("%H:%M:%S", time.localtime(execution_time)))
                    cmd = self.queue.pop(0)
                    self.queue.append(cmd)

            elif type(self.queue[0]) is int or type(self.queue[0]) is float:
                command = self.queue.pop(0)

            else:
                command = self.queue.pop(0)
                self.logging.debug("Execute: " + str(command))
                self.execute(command)

            self.thread_wait(use_wait_time=0.01)
            count = 0

        self.logging.info("Stopped " + self.name)

    def execute(self, command):
        """
        execute command or wait, the command has the following formats
        (1) START_OF_RELOAD
        (2) [interface, device, button, state, request_time,execution_time]
        (3) integer (waiting time)

        Args:
            command (Any): command separated in parameters, depending on purpose:
                           SEND  -> number or command = [interface,device,button,state,request_time,execution_time];
                           QUERY -> number or command = [interface,device,[query1,query2,query3,...],state,request_time,execution_time]
        """
        devices = self.config.read_status()

        # check, if reload is requested ...
        if "START_OF_RELOAD" in str(command):
            self.reload = True
            self.reload_time = time.time()

        elif "END_OF_RELOAD" in str(command):
            self.reload = False
            self.logging.debug("__RELOAD: execution = " + str(round(time.time() - self.reload_time, 2)) + "s (Queue: " + str(len(self.queue)) + " entries)")

        # if is an array / not a number
        elif "," in str(command):

            interface, device, button, state, request_time, execution_time = command

            if device not in devices:
                self.logging.error("ERROR: Could not find '" + device + "' in current configuration!")

            elif self.query_send == "send":
                try:
                    result = self.device_apis.api_send(interface, device, button, state)
                    self.execution_time(device, execution_time, time.time())
                    self.last_query_time = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
                    self.logging.debug("send '" + interface + "/" + device + "/" + button + "=" + state + "': "+result)

                    if device in self.config.load_after and button in self.config.load_after[device]:
                        time.sleep(1)
                        self.config.load_after_update[device] = True
                        self.logging.debug("queue_execute: load_after activated - " + device + "_" + button)

                except Exception as e:
                    result = "ERROR queue query_list (send," + interface + "," + device + "," +\
                             button + "=" + str(state) + "): " + str(e)
                    self.logging.error(result)

            elif self.query_send == "query":
                log_results = []
                log_error = 0
                log_time_start = time.time()

                for value in button:
                    if log_error > 1:
                        continue
                    try:
                        result = self.device_apis.api_query(interface, device, value)
                        if "ERROR" in str(result):
                            log_error += 1

                        self.last_query = device + "_" + value
                        self.last_query_time = datetime.datetime.now().strftime('%H:%M:%S (%d.%m.%Y)')
                        devices[device]["status"]["api-last-query"] = self.last_query_time
                        devices[device]["status"]["api-last-query-tc"] = int(time.time())
                        devices[device]["status"]["api-status"] = self.device_apis.api[self.device_apis.device_api_string(device)].status
                        log_results.append(value + "=" + str(result))

                    except Exception as e:
                        result = "ERROR queue query_list (query," + str(interface) + "," + str(device) + "," + str(value) + "): " + str(e)
                        self.logging.error(result)

                    if "ERROR" not in str(result):
                        devices[device]["status"][value] = str(result)
                    else:
                        devices[device]["status"][value] = "Error"

                if log_error > 1:
                    log_results.append("...")

                log_results = ", ".join(log_results)
                if len(log_results) > 50:
                    log_results = log_results[:50] + "..."

                self.logging.debug("Execute: - query done " + interface + " (" + str(round(time.time() - log_time_start, 1)) + "s): " + log_results)

                if self.config != "":
                    self.config.device_set_values(device, "status", devices[device]["status"])

        # if is a number
        else:
            time.sleep(float(command))

    def execution_time(self, device, start_time, end_time):
        """
        calculate the average execution time per device (duration between request time and time when executed)

        Args:
            device (str): device_id
            start_time (float): timecode when command was added to the queue
            end_time (float): timecode when execution was done
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

        if len(self.exec_times[device]) > 1:
            total = 0
            for d in self.exec_times[device]:
                total += d
            self.average_exec[device] = total / len(self.exec_times[device])
            average_diff = self.average_exec[device] - average_start
        elif len(self.exec_times[device]) == 1:
            self.average_exec[device] = duration
            average_diff = -1
        else:
            self.average_exec[device] = -1
            average_diff = -1

        self.logging.debug("__EXEC TIME: '" + device + "' average: " + str(
            round(self.average_exec[device], average_round)) + " / last " + str(
            round(duration, average_round)) + " / change " + str(round(average_diff, average_round)))

    def add_reload_commands(self, commands):
        """
        add list of commands required for reloading device data
        """

        if commands == "RESET":
            self.device_reload = []
        else:
            self.device_reload.append(commands)

    def add2queue(self, commands, wait=0):
        """
        add single command or list of commands to queue, the command has the following formats
        (1) START_OF_RELOAD
        (2) [interface, device, button, state] while button can be a list of queries
        (3) integer (waiting time)

        Args:
            commands (Any): command separated in parameters, depending on purpose:
                           SEND  -> number or command = [interface,device,button,state];
                           QUERY -> number or command = [interface,device,[query1,query2,query3,...],state]
            wait (float): waiting time in seconds
        """
        self.logging.debug("Add2Queue: " + str(commands))
        request_time = time.time()
        execution_time = time.time() + wait

        # set reload status
        if "START_OF_RELOAD" in str(commands):
            self.reload = True

        # or add command to queue
        for command in commands:
            self.add2log("add2Q", command)

            if type(command) is int or type(command) is float:
                execution_time += float(command)

            elif "," in str(command):
                command.append(request_time)    # add element to array
                command.append(execution_time)  # add element to array

            if not type(command) is int and not type(command) is float:
                self.queue.append(command)      # add command array to queue

        return "OK: Added command(s) to the queue '" + self.name + "': " + str(commands)

    def add2log(self, source, commands):
        """
        add an entry to the internal temporary logging which can be requested using an API command

        Args:
            source (str): query type values - send, send_makro, request (tbc.)
            commands (list): list of parameters
        """
        log_time = self.config.local_time().strftime("%H:%M:%S.%f")
        log_name = self.name.replace("queue", "")

        self.query_log.insert(0,log_time + "  " + source + "  " + str(commands))
        if len(self.query_log) > self.query_log_length:
            self.query_log.pop()

    def get_query_log(self):
        """
        return query log for API call
        """
        return self.query_log