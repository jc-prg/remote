"""
Unit tests for the "values-remote" mapping in server/interfaces/interfaces.py

Connect.command_values_remote_map() translates a queried device value into the
value defined in "values-remote" of the command definition. Connect is created
via __new__ so the heavy __init__ (threads, API loading) is skipped.

interfaces.py is loaded directly from its file: scapy only exists inside Docker
(stubbed here), and tests/api/conftest.py replaces the server.interfaces package
with MagicMock stubs.
"""
import sys
import importlib.util
from pathlib import Path
from unittest.mock import MagicMock

import pytest

for _mod in ("scapy", "scapy.all", "pythonping"):
    sys.modules.setdefault(_mod, MagicMock())

_path = Path(__file__).resolve().parents[2] / "server" / "interfaces" / "interfaces.py"
_spec = importlib.util.spec_from_file_location("_interfaces_under_test", _path)
interfaces = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(interfaces)


DEVICE_CONFIG = {
    "data": {
        "commands": {
            "child-lock": {
                "get": "get=child_lock",
                "values": ["LOCK", "UNLOCK"],
                "values-remote": {"LOCK": "ON", "UNLOCK": "OFF"}
            },
            "system-mode": {
                "get": "get=system_mode",
                "values": ["off", "auto", "heat"]
            }
        }
    }
}

DEFAULT_CONFIG = {
    "data": {
        "commands": {
            "open-window": {
                "get": "get=open_window",
                "values-remote": {"True": "ON", "False": "OFF"}
            }
        }
    }
}


@pytest.fixture
def connect(monkeypatch):
    con = interfaces.Connect.__new__(interfaces.Connect)
    con.logging = MagicMock()
    con.config = MagicMock()
    con.config.read.return_value = DEFAULT_CONFIG
    con.device_configuration = MagicMock(return_value=DEVICE_CONFIG)
    monkeypatch.setattr(interfaces.rm3json, "if_exist", lambda path: True)
    return con


def test_mapped_value(connect):
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "child-lock", "LOCK") == "ON"
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "child-lock", "UNLOCK") == "OFF"


def test_unmapped_value_passes_through(connect):
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "child-lock", "N/A") == "N/A"


def test_no_values_remote_defined(connect):
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "system-mode", "heat") == "heat"


def test_fallback_to_default_config(connect):
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "open-window", True) == "ON"


def test_error_and_structured_results_not_mapped(connect):
    error = "ERROR: something went wrong"
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "child-lock", error) == error
    result = {"error": "LOCK"}
    assert connect.command_values_remote_map("ZIGBEE2MQTT_test", "trv", "child-lock", result) == result
