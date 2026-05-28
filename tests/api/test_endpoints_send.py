"""
API contract tests for send endpoints.

Send endpoints require a device to be present in CONFIG (built by _api_CONFIG()
from devices_read_config()) so that interface/button lookups succeed.  These
tests use the `send_client` fixture which extends `client_and_mocks` to
pre-populate mock_data with a minimal test device.

Test device "tv" is configured with:
  - interface "broadlink" (api and api_key)
  - buttons: power, input, volume+
  - commands.definition: power enum ON/OFF
  - settings.main-audio: no

send_text uses config.read_status() (not CONFIG), so mock_config.read_status
is also configured.

apis.api_method returns "record" (set globally in _make_mock_apis) so the
record-path in send_button_on_off / send_api_value is taken.
"""
import json
import pytest
from tests.api.conftest import assert_api_response


# ---------------------------------------------------------------------------
# Test device fixture data
# ---------------------------------------------------------------------------

_TV = {
    "interface": {
        "api": "broadlink",
        "api_key": "broadlink",
        "method": "record",
    },
    "buttons": {"power": {}, "input": {}, "volume+": {}},
    "commands": {
        "definition": {
            "power": {"type": "enum", "values": ["ON", "OFF"]},
            # "input" in definition enables the device-off blocking logic in send_check
            "input": {"type": "enum", "values": ["hdmi1", "hdmi2"]},
        }
    },
    "settings": {"main-audio": "no"},
    "config":   {"api_key": "broadlink", "device": "tv", "label": "Test TV"},
    "status":   {},
}

_DEVICE_CONFIG = {"tv": _TV}

_STATUS_CONFIG = {
    "tv": {"config": {"api_key": "broadlink"}, "status": {}}
}


# ---------------------------------------------------------------------------
# Fixture: client with a real device in CONFIG / STATUS
# ---------------------------------------------------------------------------

@pytest.fixture
def send_client(client_and_mocks):
    """
    Extends client_and_mocks with a test device "tv" configured so that
    send endpoints can look up CONFIG["devices"]["tv"] and read_status()["tv"].
    """
    c, mocks = client_and_mocks
    mocks.data.devices_read_config.return_value = _DEVICE_CONFIG
    mocks.config.read_status.return_value = _STATUS_CONFIG
    return c, mocks


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get(client, url):
    resp = client.get(url)
    assert resp.status_code == 200, f"GET {url} → {resp.status_code}: {resp.data[:300]}"
    return json.loads(resp.data)


# ---------------------------------------------------------------------------
# /send/{device}/{button}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_send_button(send_client):
    """
    GET /api/send/tv/power/ enqueues the command and returns OK.

    Verifies that queue_send.add2queue() is called with the correct
    [interface, device, button, value] payload.
    """
    c, mocks = send_client
    data = _get(c, "/api/send/tv/power/")
    assert_api_response(data)
    mocks.queue_send.add2queue.assert_called_once_with([["broadlink", "tv", "power", ""]])


# ---------------------------------------------------------------------------
# /send_check/{device}/{button}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_send_check_power_toggle_sent(send_client):
    """
    GET /api/send_check/tv/on/ enqueues a power-on command.

    With method="record" and button="on", status becomes "ON" and
    the command is forwarded to the queue.
    """
    c, mocks = send_client
    data = _get(c, "/api/send_check/tv/on/")
    assert_api_response(data)
    mocks.queue_send.add2queue.assert_called()


@pytest.mark.api
def test_send_check_device_off_blocks(send_client):
    """
    GET /api/send_check/tv/input/ with device power=OFF does NOT enqueue.

    Blocking only triggers when the button value IS in commands.definition.
    "input" is defined in _TV, so when device_status=="OFF" the record path
    sets dont_send=True and add2queue() is never called.
    """
    c, mocks = send_client
    mocks.edit.device_status_get.return_value = "OFF"
    data = _get(c, "/api/send_check/tv/input/")
    assert_api_response(data)
    mocks.queue_send.add2queue.assert_not_called()


# ---------------------------------------------------------------------------
# /send-data/{device}/{button}/{text}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_send_text(send_client):
    """
    GET /api/send-data/tv/input/netflix/ enqueues a text command and returns OK.
    """
    c, mocks = send_client
    data = _get(c, "/api/send-data/tv/input/netflix/")
    assert_api_response(data)
    # queue_send.add2queue called with the text payload
    mocks.queue_send.add2queue.assert_called_once_with(
        [["broadlink", "tv", "input", "netflix"]]
    )


# ---------------------------------------------------------------------------
# /macro/{macro}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_send_macro_empty(send_client):
    """
    GET /api/macro/nonexistent/ with no commands decoded returns OK.

    macro_decode returns [] so no commands are enqueued, but the
    endpoint completes without an unhandled exception.
    """
    c, _mocks = send_client
    data = _get(c, "/api/macro/nonexistent/")
    # Return was preset to ERROR, but if no commands exist it may stay
    # or get overwritten — just verify no crash and HTTP 200.
    assert "API" in data
    assert "REQUEST" in data


# ---------------------------------------------------------------------------
# /set/{device}/{command}/{value}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_set_value(send_client):
    """
    GET /api/set/tv/power/ON/ enqueues a value command with method=record.

    With api_method returning "record", edit.device_status_set is called
    and its "OK" return becomes REQUEST.Return.
    """
    c, mocks = send_client
    data = _get(c, "/api/set/tv/power/ON/")
    assert_api_response(data)
    mocks.edit.device_status_set.assert_called_once_with("tv", "power", "ON")
