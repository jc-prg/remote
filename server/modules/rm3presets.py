import time
import os
import sys
import logging
import subprocess
from dotenv import load_dotenv
from logging.handlers import RotatingFileHandler

# ---------------------------------

API_name = "jc://remote/"
API_version = "v3.0.0"
APP_version = "v3.0.16"
APP_support = [APP_version,
               "v3.0.15", "v3.0.14", "v3.0.13"
               ]  # other supported versions

# ---------------------------

test = False
start_time = time.time()
server_status = "Starting"
server_health = {}

rollout = server_port = client_port = data_dir = icons_dir = scene_img_dir = app_language = git_branch = None
timezone_offset = local_network = config_dir = start_string = None

log_level = log_to_file = log_webserver = log_api_data = log_api_ext = log_set2level = None
log_level_module = {"INFO": [], "DEBUG": [], "WARNING": [], "ERROR": []}
log_filename = '/log/server.log'
log_loggers = {}
log_logger_list = []

# ---------------------------


def check_submodules():
    """
    check if required submodules from git are installed otherwise show error message and quit
    """
    global git_submodules, git_submodules_installed, git_submodules_directory

    for module in git_submodules:
        module_path = os.path.join(git_submodules_directory, git_submodules[module], "README.md")
        if not os.path.exists(module_path):
            print("ERROR: Submodule from git not installed yet: https://github.com/" + module + " in directory " +
                  git_submodules[module])
            print("-> Try: 'sudo git submodule update --init --recursive' in the root directory.")
            sys.exit()
    git_submodules_installed = True


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
    """
    Returns:
        error message for given code
    """
    m = error_messages
    return m[code]


def time_since_start():
    """
    Returns:
        time elapsed since server started
    """
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
    set_name = set_name.replace(".", "-")

    if len(log_logger_list) == 0:
        root_logger = logging.getLogger()
        if root_logger.hasHandlers():
            root_logger.handlers.clear()

    if set_name in log_logger_list:
        # print("---> LOGGING : " + set_name + " <---- EXISTS ")
        return log_loggers.get(set_name)

    else:
        # print("---> LOGGING : " + set_name)
        if set_log_level is None:
            set_log_level = log_set2level

        #if log_to_file:
        #    logger = logging.getLogger(set_name + str(init_time))
        #    logger.setLevel(set_log_level)
        #else:
        #    logger = logging.getLogger(set_name)
        #    logger.setLevel(set_log_level)

        if log_to_file == "YES" and not os.access(log_filename, os.W_OK):
            print("Could not write to log file " + log_filename)
            log_to_file = "NO"

        if log_to_file == "YES" and os.access(log_filename, os.W_OK):
            logger = logging.getLogger(set_name)
            logger.setLevel(set_log_level)

            log_format_string = '%(asctime)s | %(levelname)-8s ' + set_name.ljust(10) + ' | %(message)s'
            log_format = logging.Formatter(fmt=log_format_string,
                                           datefmt='%m/%d %H:%M:%S')
            handler = RotatingFileHandler(filename=log_filename, mode='a',
                                          maxBytes=int(2.5 * 1024 * 1024),
                                          backupCount=2, encoding=None, delay=False)
            handler.setFormatter(log_format)
            logger.addHandler(handler)

        else:
            logger = logging.getLogger(set_name + str(init_time))
            logger.setLevel(set_log_level)

            log_format_string = '%(asctime)s | %(levelname)-8s %(name)-10s | %(message)s'
            logging.basicConfig(format=log_format_string,
                                datefmt='%m/%d %H:%M:%S',
                                level=log_level)

        logger.debug("Init logger '" + set_name + "', into_file=" + str(log_to_file))

        log_loggers[set_name] = logger
        log_logger_list.append(set_name)

        return logger


def get_git_branch_from_head():
    """
    Returns:
        str: name of current git branch or None if not in git repository or not a git repository at all
    """
    # Start from the current working directory
    current_dir = os.path.join(os.getcwd(), "..")

    while current_dir:
        git_dir = os.path.join(current_dir, '.git')
        head_file = os.path.join(git_dir, 'HEAD')

        if os.path.exists(head_file):
            with open(head_file, 'r') as f:
                ref_line = f.readline().strip()
                if ref_line.startswith('ref: '):
                    branch_name = ref_line.split('/')[-1]
                    return branch_name
                else:
                    return None
        else:
            # Move up one directory
            parent_dir = os.path.dirname(current_dir)
            if parent_dir == current_dir:
                # Reached the root directory
                break
            current_dir = parent_dir

    return None


def read_from_env():
    env_path = ".env"
    env_sample_path = "sample.env"

    global rollout, server_port, client_port, data_dir, icons_dir,scene_img_dir, app_language, timezone_offset
    global local_network, log_level, log_to_file, log_filename, log_webserver, log_api_data, log_api_ext, log_set2level
    global test, config_dir

    try:
        path = os.path.join(os.path.dirname(__file__), "..", "..", env_path)
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
        timezone_offset = int(get_env('REMOTE_TIMEZONE_OFFSET'))
        local_network = get_env('REMOTE_LOCAL_NETWORK')

        log_level = get_env('REMOTE_LOG_LEVEL')  # set log level: INFO, DEBUG, WARNING, ERROR
        log_to_file = get_env('REMOTE_LOG_TO_FILE')  # shall logging done into a logfile: YES, NO
        log_filename = get_env('REMOTE_LOG_FILENAME')  # path to logfile (if YES)
        log_webserver = get_env('REMOTE_LOG_WEBSERVER')  # shall webserver logging be done with default level: YES, NO
        log_api_data = get_env('REMOTE_LOG_API_QUERY')  # shall data from API request be logged: YES, NO
        log_api_ext = get_env('REMOTE_LOG_API_EXTERNAL')  # shall external API data be logged: YES, NO
        log_set2level = eval("logging." + log_level)

        for key in log_level_module:
            value = get_env('REMOTE_LOGGING_' + key)
            print(f"REMOTE_LOGGING_{key}={value}")
            if value is not None:
                log_level_module[key] = value.split(",")

        if rollout == "test":
            test = True

        config_dir = data_dir + "/"

    except Exception as e:
        print("Error reading configuration defined in the file '.env': " + str(e))
        print("Check or rebuild your configuration file based on the file 'sample.env'.")
        os._exit(os.EX_CONFIG)


def write_config_information():
    """
    print main version and configuration information to console
    """
    global start_string

    start_string = API_name + API_version + "   (stage:" + str(rollout) + "/log-level:" + log_level + ")"

    print("----------------------------------------------------------------")
    print(start_string)
    print("----------------------------------------------------------------")
    print(" * Starting server on port: " + str(server_port) + " (http://<url>:" + str(server_port) + "/api/list/)")
    print(" * Starting client on port: " + str(client_port) + "   (http://<url>:" + str(client_port) + "/)")

# ---------------------------------

read_from_env()
write_config_information()

# ---------------------------------


start_time = time.time()
start_duration = 0
initial_stage = ""
api_modules = []
DEBUG = False

refresh_config_sleep = 3 * 60
refresh_config_cache = 60
refresh_device_status = 10
refresh_device_connection = 60
discover_devices_interval = 10 * 60

shorten_info_to = 50

rest_api_dir = os.path.join(os.path.dirname(__file__))
rest_api = os.path.join("rm3api.yml")

directory_main = os.path.abspath(__file__)
directory_sample = os.path.join(os.path.dirname(__file__), "..", "..", "data", "_sample")
interfaces = "interfaces/"  # interface definition
devices = "devices/"  # devices, overview in "_active.json"
commands = "devices/"  # device definition (queries and commands)
remotes = "remotes/"  # remote layouts for devices
scenes = "remotes/"  # remote layouts for scenes
templates = "templates/"  # templates for remote layouts
buttons = "buttons/"  # button configuration files
active = "_active"  # overview file name

active_devices = "_ACTIVE-DEVICES"
active_device_types = "_DEVICE-TYPES"
active_scenes = "_ACTIVE-SCENES"
active_macros = "_ACTIVE-MACROS"
active_apis = "_ACTIVE-APIS"
active_timer = "_ACTIVE-TIMER"

git_branch = get_git_branch_from_head()
git_submodules_directory = os.path.join(os.path.dirname(__file__), "..", "..")
git_submodules_installed = False
git_submodules = {
    "jc-prg/modules": "app/modules",
    "jc-prg/app-framework": "app/framework"
}
check_submodules()

# Get all files (not directories) in the folder
icon_directory = os.path.join(os.path.dirname(__file__), "..", "..", "app", "remote-v3", "icon")
icon_files = [f for f in os.listdir(icon_directory) if os.path.isfile(os.path.join(icon_directory, f))]

app_config_file = os.path.join(os.path.dirname(__file__), "..", "..", "app", "remote-v3", "config_stage.js")
app_configuration = """
//--------------------------------
// Configure stage details
//---------------------------------
// Please don't edit here. Use the '.env' file instead.

var test            = """ + str(test).lower() + """;
var log_level       = '""" + log_level.lower() + """';
var server_port     = """ + str(server_port) + """;
var rollout         = '""" + rollout + """';
var git_branch      = '""" + str(git_branch) + """';
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

