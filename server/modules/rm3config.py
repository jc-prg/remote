import time
import os
import logging
from dotenv import load_dotenv
from logging.handlers import RotatingFileHandler

# ---------------------------------

API_name = "jc://remote/"
API_version = "v2.3.0"
APP_version = "v2.9.2"
APP_support = [APP_version,
               "v2.9.0", "v2.9.1"
               ]  # other supported versions

# ---------------------------

test = False
start_time = time.time()
server_status = "Starting"

rollout = server_port = client_port = data_dir = icons_dir = scene_img_dir = app_language = None

log_level = log_to_file = log_webserver = log_api_data = log_api_ext = log_set2level = None
log_level_module = {"INFO": [], "DEBUG": [], "WARNING": [], "ERROR": []}
log_filename = '/log/server.log'
log_loggers = {}
log_logger_list = []

# ---------------------------


def get_env(var_name):
    """
    get value from .env-file if exists

    Args:
        var_name (str): key in .env file
    Returns:
        Any: value from .env file
    """
    try:
        value = os.environ.get(var_name)
    except:
        value = None
    return value


def error_message(code):
    m = error_messages
    return m[code]


def time_since_start():
    current_time = time.time()
    time_info = int((current_time - start_time))
    return "  (" + str(time_info) + "s)"


def set_logging(set_name, set_log_level=None):
    """
    set logger and ensure it exists only once

    Args:
        set_name (str): logger name
        set_log_level (int): log level to be set
    """
    global log_loggers, log_logger_list, log_to_file, log_filename
    init_time = time.time()

    if log_loggers.get(set_name) or set_name in log_logger_list:
        # print("... logger already exists: " + name)
        return log_loggers.get(set_name)

    else:
        log_logger_list.append(set_name)

        if set_log_level is None:
            set_log_level = log_set2level

        if log_to_file:
            logger = logging.getLogger(set_name + str(init_time))
            logger.setLevel(set_log_level)
        else:
            logger = logging.getLogger(set_name)
            logger.setLevel(set_log_level)

        if log_to_file == "YES" and os.access(log_filename, os.W_OK):
            log_format_string = '%(asctime)s | %(levelname)-8s ' + set_name.ljust(10) + ' | %(message)s'
            log_format = logging.Formatter(fmt=log_format_string,
                                           datefmt='%m/%d %H:%M:%S')
            handler = RotatingFileHandler(filename=log_filename, mode='a',
                                          maxBytes=int(2.5 * 1024 * 1024),
                                          backupCount=2, encoding=None, delay=False)
            handler.setFormatter(log_format)
            logger.addHandler(handler)

        else:
            log_format_string = '%(asctime)s | %(levelname)-8s %(name)-10s | %(message)s'
            logging.basicConfig(format=log_format_string,
                                datefmt='%m/%d %H:%M:%S',
                                level=log_level)

        logger.debug("Init logger '" + set_name + "', into_file=" + str(log_to_file))

        if log_to_file and not os.access(log_filename, os.W_OK):
            logger.warning("Could not write to log file " + log_filename)

        log_loggers[set_name] = logger
        return logger


# ---------------------------


try:
    path = os.path.join(os.path.dirname(__file__), "../../.env")
    if not os.path.exists(path):
        print("Can't find configuration file .env: " + str(path))
        print("Copy the file 'sample.env' to '.env' and adjust the file for your purposes.")
        exit()

    load_dotenv(path)

    rollout = get_env('REMOTE_CURRENT_STAGE')
    server_port = int(get_env('REMOTE_SERVER_PORT'))
    client_port = int(get_env('REMOTE_CLIENT_PORT'))
    data_dir = get_env('REMOTE_DIR_DATA')
    icons_dir = get_env('REMOTE_DIR_ICONS')
    scene_img_dir = get_env('REMOTE_DIR_SCENES')
    app_language = get_env('REMOTE_LANGUAGE')

    log_level = get_env('REMOTE_LOG_LEVEL')  # set log level: INFO, DEBUG, WARNING, ERROR
    log_to_file = get_env('REMOTE_LOG_TO_FILE')  # shall logging done into a logfile: YES, NO
    log_filename = get_env('REMOTE_LOG_FILENAME')  # path to logfile (if YES)
    log_webserver = get_env('REMOTE_LOG_WEBSERVER')  # shall webserver logging be done with default level: YES, NO
    log_api_data = get_env('REMOTE_LOG_API_DATA')  # shall data from API request be logged: YES, NO
    log_api_ext = get_env('REMOTE_LOG_API_EXTERNAL')  # shall external API data be logged: YES, NO
    log_set2level = eval("logging." + log_level)

    for key in log_level_module:
        value = get_env('REMOTE_LOGGING_' + key)
        if value is not None:
            log_level_module[key] = value.split(",")

    if rollout == "test":
        test = True

    config_dir = data_dir + "/"

except Exception as e:
    print("Error reading configuration defined in the file '.env': " + str(e))
    print("Check or rebuild your configuration file based on the file 'sample.env'.")
    os._exit(os.EX_CONFIG)

start_string = API_name + API_version + "   (stage:" + str(rollout) + "/log-level:" + log_level + ")"

print("----------------------------------------------------------------")
print(start_string)
print("----------------------------------------------------------------")
print(" * Starting server on port: " + str(server_port) + " (http://<url>:" + str(server_port) + "/api/list/)")
print(" * Starting client on port: " + str(client_port) + "   (http://<url>:" + str(client_port) + "/)")

# ---------------------------------

start_time = time.time()
start_duration = 0
initial_stage = ""
DEBUG = False

refresh_config_sleep = 5 * 60
refresh_config_cache = 60
refresh_device_status = 10
refresh_device_connection = 60

config_server = "server.json"
config_status = "status.json"
shorten_info_to = 50

rest_api_dir = os.path.join(os.path.dirname(__file__))
rest_api = os.path.join("rm3api.yml")

interfaces = "interfaces/"  # interface definition
devices = "devices/"  # devices, overview in "_active.json"
commands = "devices/"  # device definition (queries and commands)
remotes = "remotes/"  # remote layouts for devices
scenes = "remotes/"  # remote layouts for scenes
templates = "templates/"  # templates for remote layouts
buttons = "buttons/"  # button configuration files
active = "_active"  # overview file name

active_devices = "_ACTIVE-DEVICES"
active_scenes = "_ACTIVE-SCENES"
active_macros = "_ACTIVE-MACROS"

app_config_file = os.path.join(os.path.dirname(__file__), "..", "..", "app", "remote-v3", "config_stage.js")
app_configuration = """
//--------------------------------
// Configure stage details
//---------------------------------
// Please edit not here, but the orignial configuration file. This files is created using a template.

var test            = """ + str(test).lower() + """;
var log_level       = '""" + log_level.lower() + """"';
var server_port     = """ + str(server_port) + """;
var rollout         = '""" + rollout + """"';
LANG                = '""" + app_language + """';

if (rollout === "test")	{ test = true; }
"""

f = open(app_config_file, "w")
f.write(app_configuration)
f.close()

log_set2level = logging.INFO
log_threads = {
    "DEBUG": [],
    "INFO": [],
    "WARNING": [],
    "ERROR": []
}

# ---------------------------------

error_messages = {
    "200": "OK",
    "201": "Error",
    "202": "Started",
    "203": "See Message ...",

    "300": "Successful loaded.",
    "301": "Successful changed.",
    "302": "Successful added.",
    "303": "Successful deleted.",

    "400": "ID doesn't exist.",
    "401": "ID already exists.",

    "500": "Image added/set successfully.",
    "501": "Could not add/set image.",

    "800": "Your app is up to date.",
    "801": "Update available: " + APP_version + ".",
    "802": "Update required: " + APP_version + ". Delete your browser cache, please."
}

