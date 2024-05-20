#!/usr/bin/python3

import time
import sys
import logging
import traceback
import connexion
from flask_cors import CORS

import modules.rm3config as rm3cache
import modules.rm3data as rm3data
import modules.rm3queue as rm3queue
import modules.rm3presets as rm3presets
import modules.rm3api as rm3api
import modules.rm3timer as rm3timer
import interfaces


def on_exception(exc_type, value, trace_back):
    """
    grab all exceptions and write them to the logfile (if active)
    """
    tb_str = ''.join(traceback.format_exception(exc_type, value, trace_back))
    log.error("EXCEPTION:\n\n" + tb_str + "\n")


log_srv = rm3presets.set_logging("server")
log = logging.getLogger("werkzeug")
sys.excepthook = on_exception

eval("log_srv."+rm3presets.log_level.lower()+"('---------------------------------------------------------------')")
eval("log_srv."+rm3presets.log_level.lower()+"('" + rm3presets.start_string + "')")
eval("log_srv."+rm3presets.log_level.lower()+"('---------------------------------------------------------------')")
eval("log_srv."+rm3presets.log_level.lower()+"(' * Client: http://<url>:"+str(rm3presets.client_port)+"/)')")
eval("log_srv."+rm3presets.log_level.lower()+"(' * Server: http://<url>:"+str(rm3presets.server_port)+"/api/list/)')")
eval("log_srv."+rm3presets.log_level.lower()+"(' * SwaggerUI: http://<url>:"+str(rm3presets.server_port)+"/api/ui/)')")
eval("log_srv."+rm3presets.log_level.lower()+"('---------------------------------------------------------------')")


if __name__ == "__main__":

    # Create threads and other classes
    rm3presets.server_status = "Initializing"

    configFiles = rm3cache.ConfigCache("ConfigFiles")
    configInterfaces = rm3cache.ConfigInterfaces("configInterfaces")

    if configFiles.check_main_config_files() == "ERROR":
        exit()

    deviceAPIs = interfaces.Connect(configFiles)
    queueSend = rm3queue.QueueApiCalls("queueSend", "send", deviceAPIs, configFiles)
    queueQuery = rm3queue.QueueApiCalls("queueQuery", "query", deviceAPIs, configFiles)
    remotesData = rm3data.RemotesData(configFiles, configInterfaces, deviceAPIs, queueQuery)
    remotesEdit = rm3data.RemotesEdit(remotesData, configFiles, configInterfaces, deviceAPIs, queueQuery)
    remoteSchedule = rm3timer.ScheduleTimer(configFiles, deviceAPIs, remotesData)
    remoteAPI = rm3api.RemoteAPI(remotesData, remotesEdit, configFiles, deviceAPIs,
                                 queueQuery, queueSend, remoteSchedule)

    configFiles.start()
    configInterfaces.start()
    queueSend.start()
    queueQuery.start()
    deviceAPIs.start()
    remotesData.start()   # !!! create threading class
    remoteSchedule.start()

    # Create REST API
    rm3presets.server_status = "Running"

    log_srv.info("Initializing REST API ..." + rm3presets.time_since_start())
    log_srv.info("... specification directory is " + rm3presets.rest_api_dir + " ...")
    app = connexion.App(__name__, specification_dir=rm3presets.rest_api_dir)
    CORS(app.app)

    # Cead the swagger.yml file to configure the endpoints
    log_srv.info("... loading API specification from '" + rm3presets.rest_api + "' ..." + rm3presets.time_since_start())
    app.add_api(rm3presets.rest_api)

    log_srv.info("... starting web-server on port " + str(rm3presets.server_port) + " ..." + rm3presets.time_since_start())
    rm3presets.start_duration = time.time() - rm3presets.start_time

    if rm3presets.log_webserver == "NO":
        log.info("... reducing log-level to WARNING")
        log.setLevel(logging.WARNING)

    app.run(debug=rm3presets.DEBUG, port=rm3presets.server_port, use_reloader=False)

    log.info("Stopped.")
