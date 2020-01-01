#!/usr/bin/python3
# -----------------------------
# base on tutorial: https://www.python-kurs.eu/tests.php
# -----------------------------

import unittest
import requests
import json, os

import modules.rm3stage  as rm3stage
import modules.rm3config as rm3config


# -----------------------------

test_chain =  [
    "GET:api/list/",
    "GET:api/test/",
    "GET:api/reload/",
    "GET:api/reset/",
    "GET:api/reset-audio/",
    "GET:api/version/"+rm3config.APPversion+"/",
    "PUT:api/device/test_device/TEST/test_description/",	# create test device
    "PUT:api/button/test_device/test1/",			# add button to layout
    "POST:api/button/test_device/test1/",			# record command to button
    "PUT:api/button/test_device/test2/",			# add button to layout
    "POST:api/button/test_device/test2/",			# record command to button
    "PUT:api/visibility/test_device/no/",			# change visibility
    "GET:api/sendIR/test_device/test2/",			# check send buttons
    "DELETE:api/button/test_device/test1/",                     # delete button
    "DELETE:api/device/test_device/"                            # delete test device
    ]

# -----------------------------


class MyFirstTest(unittest.TestCase):
    '''
    Check, if als data files are in correctly formatted.
    '''

    def setUp(self):
        '''
        Get dir and list of relevant files
        '''
        # prepare test case 1
        self.data_dir = rm3stage.data_dir
        self.files    = []
        for dirpath, dirnames, filenames in os.walk(self.data_dir):
          for filename in [f for f in filenames if f.endswith(".json")]:
            file_name = os.path.join(dirpath, filename)
            self.files.append( file_name )
        # prepare test case 2
        self.server_url      = "http://localhost:"+str(rm3stage.server_port)+"/"
        self.server_requests = test_chain
        

    def tearDown(self):
        return
        
    def testCase1(self):
        '''
        Check if files are readable and contain JSON content
        '''
        for filename in self.files:
           print(filename)
           with open(filename) as json_data:
             data = json.load(json_data)
           #assertIsNotNone(data)
           
    def testCase2(self):
        '''
        Check a chain of HTTP requests to the REST API
        '''
        for value in self.server_requests:
          (method,call) = value.split(":")
          print(method + ":" + self.server_url + call)
          if method == "GET":    response = requests.get(self.server_url + call)
          if method == "POST":   response = requests.post(self.server_url + call)
          if method == "PUT":    response = requests.put(self.server_url + call)
          if method == "DELETE": response = requests.delete(self.server_url + call)
          self.assertIn("200",str(response))
          data = json.loads(response.text)
          self.assertIsNotNone(data["REQUEST"]["Return"])
          self.assertNotIn("ERROR:",data["REQUEST"]["Return"])
          if not "OK:" in data["REQUEST"]["Return"]:
            print("-> "+data["REQUEST"]["Return"])
        
if __name__ == "__main__": 
    unittest.main()
