import os
import shutil
import json
import codecs
import server.modules.rm3presets as rm3presets
import pathlib
from pathlib import Path


class RemoteInstall:
    """
    Class to check whether relevant config and data exist, install from sample files if not.
    Important: the .env file is not part of this installation, as this file is minimum requirement to start docker-compose.
    """

    def __init__(self):
        self.directory_main = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.directory_data = rm3presets.data_dir
        self.directory_sample = os.path.abspath(os.path.join(self.directory_main, "data/_sample/"))

        # initial main config files
        self.init_config = {
            "APIS_new" : {"data": {}, "info": "jc://remote/ - This file collects API information and enables or disables APIs or devices."},
            "DEVICE_new" : {"data": {}, "info": "jc://remote/ - This file defines remote controls for devices."},
            "SCENE_new" : {"data": {}, "info": "jc://remote/ - This file defines remote controls for scenes."},
            "APIS" : {},
            "MACRO" : {"dev_on": {}, "dev_off": {}, "groups": {}, "macro": {}, "info": "jc://remote/ - This file defines global macros and groups."},
            "DEVICE" : {},
            "SCENE" : {},
            "TIMER" : {"data": {}, "info": "jc://remote/ - This file defines timer events."},
            "TYPES" : {
                "data": ["audio","beamer","bluray","bulb","dvd","led","light","media-center","other","phono","playstation","plug","receiver","sensor","screen","switch","tv"],
                "info": "jc://remote/ - This file defines available device types."
            },
        }

        # add data depending on available APIs - deactivate all APIs except TEST API
        path = Path(os.path.join(self.directory_sample,"devices"))
        dirs = [p for p in path.iterdir() if p.is_dir()]
        for directory in dirs:
            if os.path.exists(os.path.join(directory, "00_interface.json")):
                key = str(directory).split("/")
                key = key[len(key)-1]
                active = (directory == "TEST")
                self.init_config["APIS_new"]["data"][key] = {
                    "active": active,
                    "directory": f"devices/{key}/00_interface.json",
                    "devices": {}
                }
                self.init_config["APIS"][key] = {
                    "active": active,
                    "directory": f"devices/{key}/00_interface.json",
                    "devices": {}
                }

        # add sample timer entry
        self.init_config["TIMER"]["data"]["sample_timer"] = {
            "commands": ["plug10_toggle", "group_led_on"],
            "description": "Sample timer event, to demonstrate the timer functionality",
            "name": "Sample timer",
            "timer_once": [{"active": False, "date": "2024-05-11", "time": "18:00"}],
            "timer_regular": {"active": False, "day_of_month": "-1", "day_of_week": "-1", "hour": "-1", "minute": "-1", "month": "-1"}
        }

        # configuration files to be checked
        self.config_files = [
            {"type": "log", "path": os.path.join(self.directory_data, rm3presets.log_filename), "action": "create"},
            {"type": "directory", "path": self.directory_data, "action": "create"},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.remotes), "action": "create", "source": os.path.join(self.directory_sample, rm3presets.remotes)},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.devices), "action": "create", "source": os.path.join(self.directory_sample, rm3presets.devices)},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.templates), "action": "create", "source": os.path.join(self.directory_sample, rm3presets.templates)},
            #{"type": "directory", "path": os.path.join(self.directory_data, rm3presets.buttons), "action": "create", "source": os.path.join(self.directory_sample, rm3presets.buttons)},
            #{"type": "file", "path": os.path.join(self.directory_data, rm3presets.buttons, "default", "index.json"), "action": "create", "source": os.path.join(self.directory_data, rm3presets.buttons, "default", "00_index.json")},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_devices), "action": "create", "source": self.init_config["DEVICE"]},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_scenes), "action": "create", "source": self.init_config["SCENE"]},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_timer), "action": "create", "source": self.init_config["TIMER"]},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_device_types),"action": "create", "source": self.init_config["TYPES"]},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_macros), "action": "create", "source": self.init_config["MACRO"]},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_apis), "action": "create", "source": self.init_config["APIS"]},
        ]

    def check_configuration(self):
        """
        check all relevant directories and config files,
        trigger installation if required (not fully implemented yet)

        Returns:
            bool: True if everything exists or could be created
        """
        print("\nCheck if configuration is complete ...")
        count_solved = 0

        for entry in self.config_files:
            if entry["type"] == "json":
                entry["path"] += ".json"

            if os.path.exists(entry["path"]):
                print(f"- OK: {entry["path"]}")
                count_solved += 1

            else:
                print(f"- {entry["type"]} doesn't exist: {entry["path"]}")

                if entry["type"] == "log":
                    if self.create_log_file(entry):
                        count_solved += 1

                if entry["type"] == "directory":
                    if self.copy_directory(entry):
                        count_solved += 1

                if entry["type"] == "json":
                    if self.create_json(entry):
                        count_solved += 1

                if entry["type"] == "file":
                    if self.copy_file(entry):
                        count_solved += 1

        if len(self.config_files) == count_solved:
            print("OK.")
            return True
        else:
            print(f"ERROR: Couldn't solve {len(self.config_files)-count_solved} config file issues.")
            return False

    def copy_directory(self, entry):
        """
        create and (if source) copy content of a directory
        """
        if entry["action"] == "create" and "source" not in entry:
            os.mkdir(entry["path"])
            if os.path.exists(entry["path"]):
                print(f"  -> OK: created {entry["type"]}.")
            else:
                print(f"  -> ERROR: could not create {entry["type"]}.")
                return False

        elif entry["action"] == "create":
            try:
                os.mkdir(entry["path"])
                shutil.copytree(entry["source"], entry["path"], dirs_exist_ok=True, symlinks=True)
                print(f"  -> OK: copied content from source {entry["source"]}.")
            except Exception as e:
                print(f"  -> ERROR: could not copy content from source {e}.")
                return False

        return True

    def copy_file(self, entry):
        """
        copy a file from source to target
        """
        if entry["action"] == "create":
            try:
                shutil.copy(entry["source"], entry["path"])
                print(f"  -> OK: copied file from source {entry["source"]}.")
            except Exception as e:
                print(f"  -> ERROR: could not copy file from source {e}.")
                return False

        return True

    def create_log_file(self, entry):
        """
        create empty log files
        """
        if entry["action"] == "create":
            try:
                open(entry["path"], "w").close()
                if os.path.exists(entry["path"]):
                    print(f"  -> OK: created empty log file")
                else:
                    print(f"  -> ERROR: could not create log file {entry["path"]}")
                    return False
            except Exception as e:
                print(f"  -> ERROR: could not create log file {e}")
                return False

        return True

    def create_json(self, entry):
        """
        create file from initial configuration
        """
        if entry["action"] == "create":
            try:
                with open(entry["path"], 'wb') as outfile:
                    json.dump(entry["source"], codecs.getwriter('utf-8')(outfile), ensure_ascii=False, sort_keys=True, indent=4)

                if os.path.exists(entry["path"]):
                    print(f"  -> OK: created empty JSON file")
                else:
                    print(f"  -> ERROR: could not create JSON file {entry["path"]}")
                    return False
            except Exception as e:
                print(f"  -> ERROR: could not create JSON file {e}")
                return False

        return True

