"""
Shared fixtures for API contract tests (tests/api/).

The `client` fixture creates a Connexion/Flask test client backed by mock
service objects. No real server, Docker container, or hardware is required.

How the connexion resolver works here
--------------------------------------
All operationIds in rm3api.yml use the pattern `__main__.remoteAPI.*`.
Connexion resolves these by looking up `remoteAPI` in sys.modules['__main__'].
In production, __main__ is server.server (run directly). In tests, __main__
is pytest, so after calling create_app() we inject server.server.remoteAPI
into sys.modules['__main__'] so the resolver can find it.

Interface package mocking
--------------------------
`server.server` imports `server.interfaces` at the top level, which in turn
imports scapy, broadlink, and other packages that only exist inside Docker.
We pre-populate sys.modules with MagicMock stubs for the entire interfaces
package *before* importing server.server so none of those imports execute.
This block runs at conftest import time (module level), which is early enough
because server.server is not imported by the unit test modules.

Adding fixture data
-------------------
The `data_dir` fixture (tmp_path) is pre-populated with the minimal JSON
files needed for the test client to start. For endpoint tests that exercise
config reads, add the relevant fixture files in the individual test modules
or extend `_write_fixture_files()` here.
"""
import copy
import json
import sys
import time
import pytest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock

# ---------------------------------------------------------------------------
# Mock the interfaces package before any server.server import happens.
# server.interfaces pulls in scapy, broadlink, eiscp, etc. which only exist
# inside Docker. The MagicMock stubs satisfy all attribute accesses.
# ---------------------------------------------------------------------------
_IFACE_MODULES = [
    "server.interfaces",
    "server.interfaces.interfaces",
    "server.interfaces.api_broadlink",
    "server.interfaces.api_denon",
    "server.interfaces.api_eiscp",
    "server.interfaces.api_kodi",
    "server.interfaces.api_magichome",
    "server.interfaces.api_p100",
    "server.interfaces.api_sony",
    "server.interfaces.api_weather",
    "server.interfaces.api_zigbee",
]
for _mod in _IFACE_MODULES:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

import server.modules.rm3presets as rm3presets


# ---------------------------------------------------------------------------
# Minimal fixture data
# ---------------------------------------------------------------------------

_API_INIT = {
    "API": {
        "name": rm3presets.API_name,
        "version": rm3presets.API_version,
        "stage": "test",
        "rollout": "test",
    },
    "CONFIG": {},
    "DATA": {},
    "REQUEST": {},
    "STATUS": {},
}

_ACTIVE_DEVICES = {"data": {}, "status": {}}
_ACTIVE_SCENES  = {"data": {}, "status": {}}
_ACTIVE_MACROS  = {"macro": {}, "dev-on": {}, "dev-off": {}, "groups": {}}
_ACTIVE_APIS    = {}
_ACTIVE_TIMER   = {}
_ACTIVE_RECORD  = {}
_DEVICE_TYPES   = {"data": []}


def _write_fixture_files(data_dir):
    """Write the minimum JSON config files needed for the test client to start."""

    def _write(name, content):
        path = data_dir / (name + ".json")
        path.write_text(json.dumps(content), encoding="utf-8")

    _write(rm3presets.active_devices,      _ACTIVE_DEVICES)
    _write(rm3presets.active_scenes,       _ACTIVE_SCENES)
    _write(rm3presets.active_macros,       _ACTIVE_MACROS)
    _write(rm3presets.active_apis,         _ACTIVE_APIS)
    _write(rm3presets.active_timer,        _ACTIVE_TIMER)
    _write(rm3presets.active_record,       _ACTIVE_RECORD)
    _write(rm3presets.active_device_types, _DEVICE_TYPES)

    # Button index and scene image index
    (data_dir / "buttons").mkdir(exist_ok=True)
    (data_dir / "buttons" / "index.json").write_text("{}", encoding="utf-8")
    (data_dir / "buttons" / "button_colors.json").write_text("{}", encoding="utf-8")

    scenes_img = data_dir / "scenes_img"
    scenes_img.mkdir(exist_ok=True)
    (scenes_img / "index.json").write_text("{}", encoding="utf-8")


# ---------------------------------------------------------------------------
# Mock service objects
# ---------------------------------------------------------------------------

def _make_mock_config(data_dir):
    """Return a ConfigCache-compatible mock backed by tmp_path."""
    cfg = MagicMock()
    cfg.api_init = copy.deepcopy(_API_INIT)
    cfg.load_after = {}
    cfg.load_after_update = {}
    cfg.local_network_available = True
    cfg.local_network_empty_queue = False
    cfg.all_available_api_loaded = True
    cfg.shutdown_request = False
    cfg.local_time.return_value = datetime.now()
    cfg.read_status.return_value = {}
    cfg.app_reload_indicator = {"app_request": 0.0, "cache_reload": 0.0, "api_reconnect": 0.0}
    cfg.interface_configuration = {}          # used by get_config_interface()
    cfg.config_messages_get.return_value = [] # used by get_config()
    cfg.cache = {}                            # used by get_config_reload()
    cfg.interface_active.return_value = "OK"          # used by set_status_interface()
    cfg.interface_device_active.return_value = "OK"   # used by set_status_api_device()

    # read() returns {} for unknown files
    def _read(path, *args, **kwargs):
        return {}
    cfg.read.side_effect = _read

    return cfg


def _make_mock_apis():
    """Return an interfaces.Connect-compatible mock."""
    apis = MagicMock()
    apis.available = {}
    apis.available_discover = {}
    apis.available_devices = {}
    apis.methods = {}
    apis.local_network_available = True
    apis.discover_last = 0
    apis.api_get_status.return_value = {}
    apis.api_send.return_value = "OK"
    apis.api_query.return_value = "OK"
    apis.get_query_log.return_value = []      # used by get_queue_log()
    apis.api_method.return_value = "record"   # used by send_button_on_off(), send_api_value()
    return apis


def _make_mock_data():
    """Return a RemotesData-compatible mock."""
    data = MagicMock()
    data.errors = {}
    data.templates_read.return_value = {"templates": {}, "template_list": []}
    data.remotes_read.return_value = {}
    data.devices_read_api_structure.return_value = {}
    data.devices_read_api_commands.return_value = {}
    data.devices_read_api_power_devices.return_value = {}
    data.api_config_read.return_value = {}
    data.devices_read_api_new_devices.return_value = {}
    data.macros_read.return_value = {"macro": {}, "dev-on": {}, "dev-off": {}, "groups": {}}
    data.devices_read_config.return_value = {}
    data.archive_get_keys.return_value = []
    data.scenes_read.return_value = {}
    data.scenes_status.return_value = {}
    data.devices_status.return_value = {}
    data.api_devices_connections.return_value = {}
    data.macro_decode.return_value = []       # used by send_macro_buttons()
    return data


def _make_mock_queue(name="queueSend"):
    q = MagicMock()
    q.last_button = "<none>"
    q.average_exec = {}
    q.query_log = []
    q.get_query_log.return_value = []
    q.add2queue.return_value = "OK"           # used by all send endpoints
    return q


def _make_mock_edit():
    """Return a RemotesEdit-compatible mock with JSON-safe string return values."""
    edit = MagicMock()
    # Device lifecycle
    edit.device_add.return_value = "OK"
    edit.device_edit.return_value = "OK"
    edit.device_delete.return_value = "OK"
    edit.device_edit_api_settings.return_value = "OK"
    edit.device_status_set.return_value = "OK"   # used by send_api_value() record path
    edit.device_status_get.return_value = ""     # used by send_button(), send_text(), send_button_on_off()
    edit.device_main_audio_set.return_value = "OK"
    edit.device_status_audio_reset.return_value = "OK"
    # Scene lifecycle
    edit.scene_add.return_value = "OK"
    edit.scene_edit.return_value = "OK"
    edit.scene_delete.return_value = "OK"
    # Buttons
    edit.button_add.return_value = "OK"
    edit.button_delete.return_value = "OK"
    edit.button_reset.return_value = "OK"
    # Remote
    edit.remote_add_template.return_value = "OK"
    edit.remote_edit_macros.return_value = "OK"
    edit.remote_move.return_value = "OK"
    edit.remote_visibility.return_value = "OK"
    return edit


def _make_mock_record():
    rec = MagicMock()
    rec.get_config.return_value = {}
    rec.get_available_dates.return_value = []
    return rec


# ---------------------------------------------------------------------------
# Main fixtures
# ---------------------------------------------------------------------------

def _build_app(tmp_path, monkeypatch):
    """
    Create the Connexion app with all service objects mocked.

    Returns (connexion_app, mocks_namespace) where mocks_namespace exposes
    every mock so tests can configure return values after the fact.
    """
    # Redirect file I/O to tmp_path
    monkeypatch.setattr(rm3presets, "data_dir",      str(tmp_path))
    monkeypatch.setattr(rm3presets, "icons_dir",     str(tmp_path / "buttons"))
    monkeypatch.setattr(rm3presets, "scene_img_dir", str(tmp_path / "scenes_img"))
    monkeypatch.setattr(rm3presets, "buttons",       "buttons/")

    _write_fixture_files(tmp_path)

    # Build mock service objects
    mock_config  = _make_mock_config(tmp_path)
    mock_apis    = _make_mock_apis()
    mock_data    = _make_mock_data()
    mock_edit    = _make_mock_edit()
    mock_queue   = _make_mock_queue("queueSend")
    mock_query   = _make_mock_queue("queueQuery")
    mock_record  = _make_mock_record()

    mock_timer = MagicMock()
    mock_timer.get_timer_events.return_value = []
    mock_timer.edit_timer.return_value = "OK"
    mock_timer.delete_timer.return_value = "OK"
    mock_timer.get_timer_event.return_value = {}

    # Create the Connexion app via the factory
    from server.server import create_app
    import server.server as _srv

    app = create_app(
        remotesData=mock_data,
        remotesEdit=mock_edit,
        configFiles=mock_config,
        deviceAPIs=mock_apis,
        queueQuery=mock_query,
        queueSend=mock_queue,
        remoteSchedule=mock_timer,
        configRecord=mock_record,
        testing=True,
    )

    # Inject remoteAPI into __main__ so connexion's "__main__.remoteAPI.*"
    # resolver can find it during test requests.
    monkeypatch.setattr(sys.modules["__main__"], "remoteAPI", _srv.remoteAPI, raising=False)

    mocks = SimpleNamespace(
        config=mock_config,
        apis=mock_apis,
        data=mock_data,
        edit=mock_edit,
        queue_send=mock_queue,
        queue_query=mock_query,
        timer=mock_timer,
        record=mock_record,
    )
    return app, mocks


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A Connexion/Flask test client with all service objects mocked."""
    app, _mocks = _build_app(tmp_path, monkeypatch)
    with app.app.test_client() as c:
        yield c


@pytest.fixture
def client_and_mocks(tmp_path, monkeypatch):
    """
    Like `client`, but also yields the mock namespace so individual tests
    can configure return values (e.g. for send endpoints that need a device
    in CONFIG).

    Yields: (flask_test_client, SimpleNamespace(config, apis, data, edit,
                                                 queue_send, queue_query,
                                                 timer, record))
    """
    app, mocks = _build_app(tmp_path, monkeypatch)
    with app.app.test_client() as c:
        yield c, mocks


# ---------------------------------------------------------------------------
# Assertion helper
# ---------------------------------------------------------------------------

def assert_api_response(data, sections=None):
    """
    Assert the three-section contract defined in rm3api.yml.

    Args:
        data (dict): parsed JSON response body
        sections (list[str]): additional top-level keys expected (e.g. ["DATA"])
    """
    assert "API" in data, f"Missing 'API' key in response: {list(data.keys())}"
    assert "REQUEST" in data, f"Missing 'REQUEST' key in response: {list(data.keys())}"
    assert data["REQUEST"].get("ReturnCode") is not None or "Return" in data["REQUEST"], \
        "REQUEST section has neither ReturnCode nor Return"
    assert "ERROR:" not in data["REQUEST"].get("Return", ""), \
        f"Response contains error: {data['REQUEST'].get('Return')}"
    for section in (sections or []):
        assert section in data, f"Expected section '{section}' not in response: {list(data.keys())}"
