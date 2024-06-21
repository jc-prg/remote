#!/usr/bin/python3
# -----------------------------
# first steps of a test script ... not actively used yet
# base on tutorial: https://www.python-kurs.eu/tests.php
# -----------------------------

import unittest
import requests
import json
import os
import time

import interfaces
import modules.rm3presets as rm3config

# -----------------------------
# define which test cases should be used and if silent
# -----------------------------

silent = False  # True, if more detailled information for the test should be displayed
active_cases = {
    "1": "yes",
    "2": "yes",
    "3": "no",
}

# -----------------------------
# define test data
# -----------------------------

test_chain = {
    #"METHOD:url/" : "data as json",
    "GET:api/list/": "",  # default list command incl. device status
    "GET:api/test/": "",  # show complete data structure
    "GET:api/reload/": "",  # reload data and interfaces
    "GET:api/reset/": "",  # set power to OFF (if not query)
    "GET:api/reset-audio/": "",  # set audio levels to 0
    "GET:api/version/" + rm3config.APP_version + "/": "",  # check version command
    "PUT:api/device/test_device/TEST/test_description/": "",  # create test device
    "PUT:api/template/test_device/default/": "",  # add the default template to the remote
    "PUT:api/button/test_device/test1/": "",  # add button to layout
    "POST:api/command/test_device/test1/": "",  # record command to button
    "PUT:api/button/test_device/test2/": "",  # add button to layout
    "POST:api/command/test_device/test2/": "",  # record command to button
    "PUT:api/visibility/test_device/no/": "",  # change visibility
    "GET:api/send/test_device/test2/": "",  # check send buttons
    "GET:api/send_check/test_device/test2/": "",  # check send buttons
    "POST:api/device/test_device/": {"label": "test label"},
    # delete test device
    #    "GET:api/audi-device/test_device/no/" : "",                # change to main audio device
    #    "GET:api/makro/vol+/" : "",                                # send makro (that should be defined)
    #    "GET:api/makro/vol-/" : ""                                 # send makro (that should be defined)
    "DELETE:api/command/test_device/test1/": "",  # delete command
    "DELETE:api/button/test_device/1/": "",  # delete button
    "DELETE:api/device/test_device/": "",  # delete test device
}

test_chain_api = {}
test_chain_api["EISCP-ONKYO"] = [
    "system-power on",
    "input-selector query",
    "master-volume=level-up",
    "master-volume=level-down",
    #    "input-selector pc",
    "listening-mode game",
    #    "audio-muting toggle",
    #    "audio-muting toggle",
    "master-volume=level-up",
    "master-volume=level-down",
    "dolby-volume query",
    #    "system-power off",
    "system-power query",
]

# -----------------------------
# Helping functions
# -----------------------------

nr = 0


def info(info):
    """
    Print information to describe the test case, if activated
    """

    global nr
    nr += 1

    if not silent:
        print("\nTEST CASE " + str(nr) + ": " + info + "\n---------------------")

    if str(nr) in active_cases and active_cases[str(nr)] == "no":
        print("-> skip test\n\n")
        return active_cases[str(nr)]
    elif str(nr) in active_cases:
        return active_cases[str(nr)]
    else:
        print("-> skip test (no setting in [active_cases] yet)\n\n")
        return "no"


# -----------------------------
# Test Class
# -----------------------------

class MyFirstTest(unittest.TestCase):
    """
    Check, if als data files are in correctly formatted.
    """

    def setUp(self):
        """
        Get dir and list of relevant files
        """
        # prepare test case 1
        self.data_dir = rm3stage.data_dir
        self.files = []
        for dirpath, dirnames, filenames in os.walk(self.data_dir):
            for filename in [f for f in filenames if f.endswith(".json")]:
                file_name = os.path.join(dirpath, filename)
                self.files.append(file_name)
        # prepare test case 2
        self.server_url = "http://localhost:" + str(rm3config.server_port) + "/"
        self.server_requests = test_chain

    def tearDown(self):
        return

    def testCase_json(self):
        """
        Check if files are readable and contain JSON content
        """
        if info("Check JSON files") == "no": return

        for filename in self.files:
            if not silent: print(filename)
            with open(filename) as json_data:
                data = json.load(json_data)
            #assertIsNotNone(data)

    def testCase_onkyo(self):
        """
        Check a chain of requests to API directly
        """

        if info("Check API for ONKYO") == "no": return

        api = interfaces.eiscp_api.eiscpAPI("EISCP-ONKYO")
        errors = 0
        error_msg = ""

        self.assertIn("Connected", api.status)
        for call in test_chain_api["EISCP-ONKYO"]:
            time.sleep(0.5)
            print(call)
            response = api.query("dummy", call)
            #print(str(response))
            if "ERROR" in str(response):
                errors += 1
                error_msg += "... [" + call + "] " + response

        if errors > 2:
            response = "ERROR: " + str(errors) + " error messages found ... " + error_msg
            self.assertNotIn("ERROR", str(response))

    def testCase_restApi(self):
        """
        Check a chain of HTTP requests to the REST API
        """

        if info("Check REST API") == "no": return

        for value in self.server_requests.keys():
            (method, call) = value.split(":")
            data = self.server_requests[value]

            if not silent: print(method + ":" + self.server_url + call)
            headers = {'content-type': 'application/json'}
            if method == "GET":    response = requests.get(self.server_url + call, json=data)
            if method == "POST":   response = requests.post(self.server_url + call, json=data)
            if method == "PUT":    response = requests.put(self.server_url + call, json=data)
            if method == "DELETE": response = requests.delete(self.server_url + call, json=data)
            self.assertIn("200", str(response))

            data = json.loads(response.text)
            self.assertIsNotNone(data["REQUEST"]["Return"])
            self.assertNotIn("ERROR:", data["REQUEST"]["Return"])
            if not "OK:" in data["REQUEST"]["Return"]:
                print("-> " + data["REQUEST"]["Return"])


if __name__ == "__main__":
    unittest.main()
