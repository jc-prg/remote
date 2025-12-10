import os
import shutil
import server.modules.rm3presets as rm3presets


class RemoteInstall():
    """
    Class to check whether relevant config and data exist, install from sample files if not.
    Important: the .env file is not part of this installation, as this file is minimum requirement to start docker-compose.
    """

    def __init__(self):
        self.directory_main = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.directory_data = rm3presets.data_dir
        self.directory_sample = os.path.abspath(os.path.join(self.directory_main, "data/_sample/"))

        self.config_files = [
            {"type": "log", "path": os.path.join(self.directory_data, rm3presets.log_filename), "action": "create"},
            {"type": "directory", "path": self.directory_data, "action": "create"},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.remotes), "action": "copy", "source": os.path.join(self.directory_sample, rm3presets.remotes)},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.devices), "action": "copy", "source": os.path.join(self.directory_sample, rm3presets.devices)},
            {"type": "directory", "path": os.path.join(self.directory_data, rm3presets.templates), "action": "copy", "source": os.path.join(self.directory_sample, rm3presets.templates)},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_devices), "action": "info"},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_scenes), "action": "info"},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_macros), "action": "info"},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_apis), "action": "copy", "source": os.path.join(self.directory_sample, rm3presets.active_apis)},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_timer), "action": "copy", "source": os.path.join(self.directory_sample, rm3presets.active_timer)},
            {"type": "json", "path": os.path.join(self.directory_data, rm3presets.active_device_types),"action": "copy", "source": os.path.join(self.directory_sample, rm3presets.active_device_types)},
        ]

    def check_configuration(self):
        """
        check all relevant directories and config files,
        trigger installation if required (not fully implemented yet)

        Returns:
            bool: True if everything exists or could be created
        """
        print("\nCheck if configuration is complete ...")

        for entry in self.config_files:
            if entry["type"] == "json":
                entry["path"] += ".json"
                if "source" in entry:
                    entry["source"] += ".json"

            if os.path.exists(entry["path"]):
                print(f"- {entry["type"]} exists: {entry["path"]}")
            else:
                print(f"- {entry["type"]} doesn't exist: {entry["path"]}")

                if entry["type"] == "log":
                    self.create_log_file(entry)

                if entry["type"] == "directory":
                    self.create_copy_directory(entry)

                if entry["type"] == "json":
                    self.create_copy_file(entry)

        print("\n")
        return True

    def create_copy_directory(self, entry):
        """
        create and (if source) copy content of a directory
        """
        if entry["action"] == "create" and "source" not in entry:
            os.mkdir(entry["path"])
            if os.path.exists(entry["path"]):
                print(f"  -> OK: created {entry["type"]}.")
            else:
                print(f"  -> ERROR: could not create {entry["type"]}.")

        elif entry["action"] == "create":
            try:
                shutil.copytree(entry["source"], entry["path"])
                print(f"  -> OK: copied content from source {entry["source"]}.")
            except Exception as e:
                print(f"  -> ERROR: could not copy content from source {e}.")

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
            except Exception as e:
                print(f"  -> ERROR: could not create log file {e}")

    def create_copy_file(self, entry):
        if entry["action"] == "copy":
            pass

