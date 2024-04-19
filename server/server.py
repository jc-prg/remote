#!/usr/bin/python3

import time
import os
import logging
import modules.rm3config as remote

from modules.server_fnct import *
from modules.server_cmd import *

import connexion
from flask_cors import CORS


if __name__ == "__main__":

    log = logging.getLogger("werkzeug")
    log.info("Initializing WebServer ..." + remote.time_since_start())

    # create the application instance
    log.info("... specification directory is " + remote.rest_api_dir + " ...")
    app = connexion.App(__name__, specification_dir=remote.rest_api_dir)
    CORS(app.app)

    # Cead the swagger.yml file to configure the endpoints
    log.info("... loading API specification from '" + remote.rest_api + "' ..." + remote.time_since_start())
    app.add_api(remote.rest_api)

    log.info("... starting web-server on port " + str(remote.server_port) + " ..." + remote.time_since_start())
    remote.start_duration = time.time() - remote.start_time

    if remote.log_webserver == "NO":
        log.info("... reducing log-level to WARNING")
        log.setLevel(logging.WARNING)

    app.run(debug=remote.DEBUG, port=remote.server_port, use_reloader=False)
