import modules.rm3stage      as rm3stage
import time

# ---------------------------------

APIname    = "jc://remote/"
APIversion = "v1.9.0"
APPversion = "v2.4.6"
APPsupport = [APPversion, "v2.4.5","v2.4.3","v2.4.2","v2.4.1"]  # other supported versions

# ---------------------------------

start_time     = time.time()
start_duration = 0
initial_stage  = ""
DEBUG          = False

# ---------------------------------

config_dir      = rm3stage.data_dir+"/"
config_server   = "server.json"
config_status   = "status.json"
shorten_info_to = 50

# ---------------------------------

interfaces = "interfaces/"          # interface definition

devices    = "devices/"             # devices, overview in "_active.json"
commands   = "devices/"             # device definition (queries and commands)
remotes    = "remotes/"             # remote layouts for devices

scenes     = "remotes/"             # remote layouts for scenes
makros     = "makros/"              # makros (to be used in scenes)
templates  = "templates/"           # templates for remote layouts

buttons    = "buttons/"             # button configuration files
active     = "_active"              # overview file name

active_devices = "_ACTIVE-DEVICES"
active_scenes  = "_ACTIVE-SCENES"

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

#---------------------------

def ErrorMsg(code):
    m = error_messages
    return m[code]

#---------------------------

def time_since_start():
    current_time = time.time()
    time_info    = int((current_time - start_time))
    return "  ("+ str(time_info) +"s)"

#---------------------------
# EOF

