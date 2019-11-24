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
print("--------------------------------")
print(remote.APIname + remote.APIversion + "   (" + str(stage.rollout) + ")")
print("--------------------------------")

# start and configure logging
#----------------------------------------------
import logging
if stage.test:
    if remote.DEBUG:
       logging.basicConfig(level=logging.DEBUG)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
       logging.info("Start - Log-Level DEBUG ...")
    else:
       logging.basicConfig(level=logging.INFO)   # DEBUG, INFO, WARNING, ERROR, CRITICAL
       logging.info("Start - Log-Level INFO ...")
else:
   logging.basicConfig(level=logging.WARN)    # DEBUG, INFO, WARNING, ERROR, CRITICAL
   logging.info("Start - Log-Level WARN ...")

# load API modules
#----------------------------------------------
import connexion
from connexion.resolver import RestyResolver
from flask_cors         import CORS

import modules_api.server_init as init

#----------------------------------------------

# create the application instance
logging.info("Start Server ..." + init.time_since_start())
app = connexion.App(__name__, specification_dir="./")
CORS(app.app)

# Cead the swagger.yml file to configure the endpoints
logging.info("Load API Specification ..." + init.time_since_start())
app.add_api("modules_api/swagger.yml")

if __name__ == "__main__":

  logging.info("Start WebServer ..."  + init.time_since_start())
  remote.start_duration = time.time() - remote.start_time

  app.run(debug=remote.DEBUG,port=stage.server_port,use_reloader=False)

