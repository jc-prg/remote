"""
Live / hardware-in-the-loop tests.

These tests require either:
  - A running jc://remote/ server on localhost (testCase_restApi, testCase_json)
  - Physical ONKYO hardware connected via EISCP (testCase_onkyo)

Run only manually inside or alongside the Docker environment:

    pytest -m live
    pytest tests/live/test_hardware.py -v

They are excluded from the offline CI suite (unit / integration / api markers).

---
Migrated from server/test.py (original written before pytest was adopted).
Changes from the original:
  - Imports updated for the project root layout (server.* packages).
  - rm3stage.data_dir  →  rm3presets.data_dir  (rm3stage never existed).
  - interfaces import wrapped in try/except so the module loads without
    hardware libraries installed outside Docker.
  - Manual active_cases skip dict replaced with pytest.mark.live and
    pytest.mark.skipif guards.
  - Kept as unittest.TestCase so the test logic is unchanged.
"""
import json
import os
import time
import unittest

import pytest

import server.modules.rm3presets as rm3presets

# ---------------------------------------------------------------------------
# Optional hardware-dependent imports
# ---------------------------------------------------------------------------

try:
    from server.interfaces import api_eiscp
    EISCP_AVAILABLE = True
except Exception:
    EISCP_AVAILABLE = False

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


# ---------------------------------------------------------------------------
# Test data for the REST API chain
# ---------------------------------------------------------------------------

_test_chain = {
    # METHOD:path : body (empty string means no body)
    "GET:api/list/":   "",   # list status and remote definition data
    "GET:api/test/":   "",   # API connectivity check
}

_test_chain_api = {
    "EISCP-ONKYO": [
        "system-power on",
        "input-selector query",
        "master-volume=level-up",
        "master-volume=level-down",
        "listening-mode game",
        "master-volume=level-up",
        "master-volume=level-down",
        "dolby-volume query",
        "system-power query",
    ]
}


# ---------------------------------------------------------------------------
# Live test class
# ---------------------------------------------------------------------------

@pytest.mark.live
class TestHardware(unittest.TestCase):
    """
    Hardware-in-the-loop and live-server tests.

    Requires:  running server on localhost:{server_port}
               and/or connected ONKYO device for testCase_onkyo.
    """

    def setUp(self):
        self.data_dir = rm3presets.data_dir or "data"
        self.server_url = "http://localhost:{}/".format(rm3presets.server_port or 5001)

        # Collect all JSON files under data_dir for testCase_json
        self.json_files = []
        if self.data_dir and os.path.isdir(self.data_dir):
            for dirpath, _dirs, filenames in os.walk(self.data_dir):
                for filename in filenames:
                    if filename.endswith(".json"):
                        self.json_files.append(os.path.join(dirpath, filename))

    # ------------------------------------------------------------------
    # Test 1: validate all JSON data files
    # ------------------------------------------------------------------

    def testCase_json(self):
        """
        Walk data_dir and verify every .json file parses without error.

        Fails if any file contains invalid JSON or cannot be opened.
        Requires data_dir to be set (set REMOTE_DIR_DATA in .env or
        start the server so rm3presets initialises the path).
        """
        if not self.json_files:
            self.skipTest(
                "No JSON files found under '{}'. "
                "Set REMOTE_DIR_DATA in .env or run inside Docker.".format(self.data_dir)
            )

        for filepath in self.json_files:
            with self.subTest(file=filepath):
                with open(filepath, encoding="utf-8") as fh:
                    data = json.load(fh)
                self.assertIsNotNone(data)

    # ------------------------------------------------------------------
    # Test 2: EISCP/ONKYO hardware commands
    # ------------------------------------------------------------------

    @unittest.skipUnless(EISCP_AVAILABLE, "server.interfaces.api_eiscp not importable (requires Docker env)")
    def testCase_onkyo(self):
        """
        Send a chain of EISCP commands to a real ONKYO device and verify
        that fewer than 3 of them return an ERROR response.

        Requires physical ONKYO hardware reachable on the local network.
        Skips gracefully when the interface module is a test double (e.g.
        when run alongside the offline suite that mocks server.interfaces).
        """
        api = api_eiscp.eiscpAPI("EISCP-ONKYO")
        if "Connected" not in str(api.status):
            self.skipTest("EISCP device not connected (status: {!r})".format(api.status))

        errors = 0
        error_msg = ""
        for call in _test_chain_api["EISCP-ONKYO"]:
            time.sleep(0.5)
            response = api.query("dummy", call)
            if "ERROR" in str(response):
                errors += 1
                error_msg += " [{}] {}".format(call, response)

        self.assertLessEqual(
            errors, 2,
            "Too many EISCP errors ({}): {}".format(errors, error_msg),
        )

    # ------------------------------------------------------------------
    # Test 3: REST API chain against a live server
    # ------------------------------------------------------------------

    @unittest.skipUnless(REQUESTS_AVAILABLE, "'requests' package not installed")
    def testCase_restApi(self):
        """
        Fire a chain of HTTP requests against the running server and check
        that each one returns HTTP 200 and REQUEST.Return does not contain
        "ERROR:".

        Requires the server to be running on localhost:{server_port}.
        """
        for key, body in _test_chain.items():
            method, path = key.split(":", 1)
            url = self.server_url + path

            with self.subTest(request=key):
                headers = {"content-type": "application/json"}
                try:
                    if method == "GET":
                        resp = requests.get(url, json=body or None, headers=headers)
                    elif method == "POST":
                        resp = requests.post(url, json=body or None, headers=headers)
                    elif method == "PUT":
                        resp = requests.put(url, json=body or None, headers=headers)
                    elif method == "DELETE":
                        resp = requests.delete(url, json=body or None, headers=headers)
                    else:
                        self.fail("Unknown HTTP method: " + method)
                except requests.exceptions.ConnectionError:
                    self.skipTest("Server not reachable at " + self.server_url)

                self.assertEqual(resp.status_code, 200, "HTTP {} for {}".format(resp.status_code, url))
                data = resp.json()
                self.assertIsNotNone(data.get("REQUEST", {}).get("Return"))
                self.assertNotIn(
                    "ERROR:", data["REQUEST"]["Return"],
                    "Error in response for {}: {}".format(url, data["REQUEST"]["Return"]),
                )


if __name__ == "__main__":
    unittest.main()
