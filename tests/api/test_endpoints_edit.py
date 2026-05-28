"""
API contract tests for edit (write) endpoints.

Each test drives the full request/response cycle through the Connexion/Flask
test client created in conftest.py.  The edit layer (RemotesEdit) is mocked,
so no real files are written — we verify:
  - HTTP 200 is returned
  - The three-section contract (API, REQUEST) is present
  - REQUEST.Return does not contain "ERROR:"
  - Lifecycle sequences (add → edit → delete) all succeed in order

The client fixture is sufficient because _make_mock_edit() pre-configures
every RemotesEdit method to return "OK", making all edit endpoints respond
without error regardless of the arguments passed.
"""
import json
import pytest
from tests.api.conftest import assert_api_response


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _put(client, url, body=None):
    resp = client.put(url, json=body or {})
    assert resp.status_code == 200, f"PUT {url} → {resp.status_code}: {resp.data[:200]}"
    return json.loads(resp.data)


def _post(client, url, body=None):
    resp = client.post(url, json=body or {})
    assert resp.status_code == 200, f"POST {url} → {resp.status_code}: {resp.data[:200]}"
    return json.loads(resp.data)


def _delete(client, url):
    resp = client.delete(url)
    assert resp.status_code == 200, f"DELETE {url} → {resp.status_code}: {resp.data[:200]}"
    return json.loads(resp.data)


# ---------------------------------------------------------------------------
# Device lifecycle
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_device_lifecycle(client):
    """PUT add device → POST edit label → DELETE: all three steps return OK."""
    device_data = {"interface": "broadlink", "label": "Test TV"}

    data = _put(client, "/api/device/test-tv/", device_data)
    assert_api_response(data)

    data = _post(client, "/api/device/test-tv/", {"label": "My TV"})
    assert_api_response(data)

    data = _delete(client, "/api/device/test-tv/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Scene lifecycle
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_scene_lifecycle(client):
    """PUT add scene → POST edit → DELETE: all three steps return OK."""
    scene_info = {"label": "Movie Night", "devices": []}

    data = _put(client, "/api/scene/movie-night/", scene_info)
    assert_api_response(data)

    data = _post(client, "/api/scene/movie-night/", {"label": "Film Night"})
    assert_api_response(data)

    data = _delete(client, "/api/scene/movie-night/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Button add / delete
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_button_add_delete(client):
    """PUT add button to device → DELETE button by position number."""
    data = _put(client, "/api/button/test-tv/power/")
    assert_api_response(data)

    data = _delete(client, "/api/button/test-tv/0/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Visibility
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_visibility_put(client):
    """PUT /api/visibility/device/{device}/no/ sets the hidden flag."""
    data = _put(client, "/api/visibility/device/test-tv/no/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Interface active toggle
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_interface_active_toggle(client):
    """PUT interface active=False then =True both return OK."""
    data = _put(client, "/api/interface/broadlink/False/")
    assert_api_response(data)

    data = _put(client, "/api/interface/broadlink/True/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# API-device active toggle
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_api_device_active_toggle(client):
    """PUT /api/api_device/{interface}/{device}/False/ returns OK."""
    data = _put(client, "/api/api_device/broadlink/tv/False/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Timer edit / delete
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_timer_edit_put(client):
    """PUT /api/timer-edit/{id}/ with a timer config dict returns OK."""
    timer_config = {"time": "08:00", "days": ["Mon"], "commands": []}
    data = _put(client, "/api/timer-edit/timer-1/", timer_config)
    assert_api_response(data)


@pytest.mark.api
def test_timer_edit_delete(client):
    """DELETE /api/timer-edit/{id}/ returns OK."""
    data = _delete(client, "/api/timer-edit/timer-1/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Macro put
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_macro_put(client):
    """PUT /api/macro/ with a macro definition returns OK."""
    macro_body = {
        "macro": {},
        "dev-on": {},
        "dev-off": {},
        "groups": {}
    }
    data = _put(client, "/api/macro/", macro_body)
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Template put
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_template_put(client):
    """PUT /api/template/{device}/{template}/ applies a template and returns OK."""
    data = _put(client, "/api/template/test-tv/basic/")
    assert_api_response(data)


# ---------------------------------------------------------------------------
# Move device
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_move_device(client):
    """POST /api/move/device/{device}/up/ changes menu order and returns OK."""
    data = _post(client, "/api/move/device/test-tv/up/")
    assert_api_response(data)
