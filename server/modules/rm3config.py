import modules.rm3stage      as rm3stage
import time

# ---------------------------------

APIname    = "jc://remote/"
APIversion = "v1.5.0"
APPversion = "v2.1.3"
APPsupport = [APPversion, "v2.1.2", "v2.1.1"]  # other supported versions

# ---------------------------------

start_time     = time.time()
start_duration = 0
initial_stage  = ""
DEBUG          = False

# ---------------------------------

config_dir     = rm3stage.data_dir+"/"
config_server  = "server.json"
config_status  = "status.json"

# ---------------------------------

error_messages = {
          "200" : "OK",
          "201" : "Error",
          "202" : "Started",
          "203" : "See Message ...",

          "300" : "Successful loaded.",
          "301" : "Successful changed.",
          "302" : "Successful added.",
          "303" : "Successful deleted.",

          "400" : "ID doesn't exist.",
          "401" : "ID already exists.",

          "500" : "Image added/set successfully.",
          "501" : "Could not add/set image.",

          "800" : "Your app is up to date.",
          "801" : "Update available: " + APPversion + ".",
          "802" : "Update required: " + APPversion + ". Delete your browser cache, please."
         }

