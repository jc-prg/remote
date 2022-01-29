#!/usr/bin/python3
'''Main module of the server file'''

# load basic modules and configuration
#----------------------------------------------

import time
import modules.rm3stage    as stage
import modules.rm3config   as remote

# set start time and write title/version/stage
#----------------------------------------------
remote.start_time = time.time()
start_string      = remote.APIname + remote.APIversion + "   (stage:" + str(stage.rollout) + "/log-level:" + stage.log_level + ")"
print("----------------------------------------------------------------")
print(start_string)
print("----------------------------------------------------------------")

# start and configure logging
#----------------------------------------------

import logging

if stage.log_level == "INFO":      stage.log_set2level = logging.INFO
elif stage.log_level == "DEBUG":   stage.log_set2level = logging.DEBUG
elif stage.log_level == "WARN":    stage.log_set2level = logging.WARNING
elif stage.log_level == "WARNING": stage.log_set2level = logging.WARNING
elif stage.log_level == "ERROR":   stage.log_set2level = logging.ERROR
else:
   stage.log_set2level = logging.INFO
   stage.log_level     = "DEFAULT: INFO"


if stage.log_to_file == "NO":
    logging.basicConfig(level=stage.log_set2level,  # DEBUG, INFO, WARNING, ERROR, CRITICAL
                        format='%(levelname)-8s %(name)-10s | %(message)s')

else:
   if not stage.log_filename:
      stage.log_filename = '/log/server.log'   
   print("-> logging into file: "+stage.log_filename+"\n")
   logging.basicConfig(filename=stage.log_filename,
                       filemode='a',
                       format='%(asctime)s | %(levelname)-8s %(name)-10s | %(message)s',
                       datefmt='%d.%m.%y %H:%M:%S',
                       level=stage.log_set2level)

   eval("logging."+stage.log_level.lower()+"('----------------------------------------------------------------')")
   eval("logging."+stage.log_level.lower()+"('"+start_string+"')")
   eval("logging."+stage.log_level.lower()+"('----------------------------------------------------------------')")
                       
                       

# load remote server modules
#----------------------------------------------

from modules.server_fnct import *
from modules.server_cmd  import *

# load API modules
#----------------------------------------------

import connexion
from connexion.resolver import RestyResolver
from flask_cors         import CORS


# Load WebServer
#----------------------------------------------

if __name__ == "__main__":

   log = logging.getLogger("werkzeug")
   log.info("Initializing WebServer ..."  + remote.time_since_start())

   # create the application instance
   app = connexion.App(__name__, specification_dir="./")
   CORS(app.app)

   # Cead the swagger.yml file to configure the endpoints
   log.info("... loading API specification from '"+remote.rest_api+"' ..." + remote.time_since_start())
   app.add_api(remote.rest_api)

   log.info("... starting web-server ..." + remote.time_since_start())
   remote.start_duration = time.time() - remote.start_time

   if stage.log_webserver == "NO":
      log.info("... reducing log-level to WARNING")
      log.setLevel(logging.WARNING)

   app.run(debug=remote.DEBUG,port=stage.server_port,use_reloader=False)

