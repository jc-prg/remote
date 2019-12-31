#!/usr/bin/python3
# -----------------------------
# base on tutorial: https://www.python-kurs.eu/tests.php
# -----------------------------

import unittest
import json, os
import modules.rm3stage as rm3stage


class MyFirstTest(unittest.TestCase):
    '''
    Check, if als data files are in correctly formatted.
    '''

    def setUp(self):
        '''
        Get dir and list of relevant files
        '''
        self.data_dir = rm3stage.data_dir
        self.files    = []
        for dirpath, dirnames, filenames in os.walk(self.data_dir):
          for filename in [f for f in filenames if f.endswith(".json")]:
            file_name = os.path.join(dirpath, filename)
            self.files.append( file_name )

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
        
        
if __name__ == "__main__": 
    unittest.main()
