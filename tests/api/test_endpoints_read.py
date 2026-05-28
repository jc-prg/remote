"""
API contract tests for read-only (GET/POST) endpoints.

Each test sends a real HTTP request through the Connexion/Flask test client
created in conftest.py and verifies that the response:
  - returns HTTP 200
  - is valid JSON
  - contains the three-section contract (API, REQUEST, no error)
  - includes any endpoint-specific payload keys

No real server, Docker container, or hardware is required.
"""
import json
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get(client, url):
    resp = client.get(url)
    assert resp.status_code == 200, f"GET {url} returned {resp.status_code}"
    return json.loads(resp.data)


def _post(client, url):
    resp = client.post(url, content_type="application/json")
    assert resp.status_code == 200, f"POST {url} returned {resp.status_code}"
    return json.loads(resp.data)


# ---------------------------------------------------------------------------
# /test/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_test(client):
    """GET /api/test/ returns API + REQUEST with Return == 'OK'."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/test/")
    assert_api_response(data)
    assert data["REQUEST"].get("Return") == "OK"


# ---------------------------------------------------------------------------
# /list/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_list(client):
    """GET /api/list/ returns the full CONFIG/STATUS/DATA envelope."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/list/")
    assert_api_response(data, sections=["CONFIG", "STATUS", "DATA"])


@pytest.mark.api
def test_post_list_reloads(client):
    """POST /api/list/ triggers a cache reload and returns the full envelope."""
    from tests.api.conftest import assert_api_response
    data = _post(client, "/api/list/")
    assert_api_response(data, sections=["CONFIG", "STATUS", "DATA"])


# ---------------------------------------------------------------------------
# /status/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_status(client):
    """GET /api/status/ returns STATUS and no DATA (CONFIG is present but empty)."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/status/")
    assert_api_response(data, sections=["STATUS"])
    # status-only mode: DATA is stripped; CONFIG remains from api_init (empty dict)
    assert "DATA" not in data, "status endpoint must not include DATA"


# ---------------------------------------------------------------------------
# /config/device/{device}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_config_device_all(client):
    """GET /api/config/device/all/ returns DATA['device'] == 'all'."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/config/device/all/")
    assert_api_response(data, sections=["DATA"])
    assert data["DATA"].get("device") == "all"


# ---------------------------------------------------------------------------
# /config/interface/{interface}/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_config_interface_all(client):
    """GET /api/config/interface/all/ returns DATA['interface'] == 'all'."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/config/interface/all/")
    assert_api_response(data, sections=["DATA"])
    assert data["DATA"].get("interface") == "all"


# ---------------------------------------------------------------------------
# /timer/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_timer(client):
    """GET /api/timer/ returns DATA with a 'timer' key."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/timer/")
    assert_api_response(data, sections=["DATA"])
    assert "timer" in data["DATA"], f"Missing 'timer' key in DATA: {list(data['DATA'].keys())}"


# ---------------------------------------------------------------------------
# /log_queue/
# ---------------------------------------------------------------------------

@pytest.mark.api
def test_get_log_queue(client):
    """GET /api/log_queue/ returns DATA with log_query, log_send, and log_api keys."""
    from tests.api.conftest import assert_api_response
    data = _get(client, "/api/log_queue/")
    assert_api_response(data, sections=["DATA"])
    for key in ("log_query", "log_send", "log_api"):
        assert key in data["DATA"], f"Missing '{key}' in DATA: {list(data['DATA'].keys())}"
