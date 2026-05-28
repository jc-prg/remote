"""
Unit tests for server/modules/rm3queue.py

Tests cover QueueApiCalls.execute() dispatch logic and add2queue() queue
management. The background thread (run()) is not started — execute() is
called directly so dispatch behavior can be verified without concurrency.
"""
import time
import pytest
from unittest.mock import MagicMock
from datetime import datetime

from server.modules.rm3queue import QueueApiCalls


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_config(devices=None):
    """Return a minimal mock config accepted by QueueApiCalls."""
    if devices is None:
        devices = {"tv": {"status": {}}, "onkyo": {"status": {}}}
    cfg = MagicMock()
    cfg.read_status.return_value = devices
    cfg.load_after = {}
    cfg.load_after_update = {}
    cfg.local_time.return_value = datetime.now()  # used by add2log()
    return cfg


@pytest.fixture
def q():
    """A QueueApiCalls instance wired to mock dependencies."""
    cfg = _make_config()
    apis = MagicMock()
    apis.api_send.return_value = "OK"
    queue = QueueApiCalls("test-queue", "send", apis, cfg)
    return queue, cfg, apis


def _now():
    return time.time()


# ---------------------------------------------------------------------------
# Dispatch: execute() with various command types
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_dispatch_list_command(q):
    """A 6-element list command is dispatched to device_apis.api_send()."""
    queue, cfg, apis = q
    now = _now()
    command = ["eiscp", "onkyo", "power-on", "on", now, now]

    queue.execute(command)

    apis.api_send.assert_called_once_with("eiscp", "onkyo", "power-on", "on")


@pytest.mark.unit
def test_dispatch_wait(q, monkeypatch):
    """
    A numeric command passed to execute() calls time.sleep(), not api_send.

    In run(), numeric queue items are popped without calling execute() at all.
    Here we test execute() directly to verify the else-branch sleeps correctly.
    """
    queue, cfg, apis = q
    sleep_calls = []
    monkeypatch.setattr(time, "sleep", lambda s: sleep_calls.append(float(s)))

    queue.execute(2)

    assert sleep_calls == [2.0]
    apis.api_send.assert_not_called()


@pytest.mark.unit
def test_dispatch_control_string(q):
    """'START_OF_RELOAD' sets self.reload = True without calling api_send."""
    queue, cfg, apis = q
    assert queue.reload is False

    queue.execute("START_OF_RELOAD")

    assert queue.reload is True
    apis.api_send.assert_not_called()


@pytest.mark.unit
def test_dispatch_end_of_reload(q):
    """'END_OF_RELOAD' clears self.reload without calling api_send."""
    queue, cfg, apis = q
    queue.reload = True

    queue.execute("END_OF_RELOAD")

    assert queue.reload is False
    apis.api_send.assert_not_called()


@pytest.mark.unit
def test_comma_in_device_name(q):
    """
    A device name containing a comma is still correctly dispatched.

    Regression: the ',' in str(command) check detects list commands by
    looking for a comma in the string representation. A device name that
    itself contains a comma must not confuse this detection.
    """
    queue, cfg, apis = q
    cfg.read_status.return_value = {"tv,main": {"status": {}}}
    now = _now()
    command = ["eiscp", "tv,main", "power-on", "on", now, now]

    queue.execute(command)

    apis.api_send.assert_called_once_with("eiscp", "tv,main", "power-on", "on")


# ---------------------------------------------------------------------------
# Queue management: add2queue()
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_queue_fifo_order():
    """Commands added via add2queue() are stored in insertion order."""
    cfg = _make_config()
    apis = MagicMock()
    queue = QueueApiCalls("test-queue", "send", apis, cfg)

    # Capture expected values before add2queue() mutates the lists in place
    # (add2queue appends request_time and execution_time to each command)
    cmd_a = ["eiscp", "onkyo", "power-on", "on"]
    cmd_b = ["eiscp", "onkyo", "volume-up", "on"]
    expected_a = cmd_a[:4]
    expected_b = cmd_b[:4]

    queue.add2queue([cmd_a])
    queue.add2queue([cmd_b])

    assert queue.queue[0][:4] == expected_a
    assert queue.queue[1][:4] == expected_b


@pytest.mark.unit
def test_future_execution_time():
    """
    add2queue(commands, wait=N) sets execution_time at least N seconds ahead.

    A command with a future execution_time sits in the queue unexecuted —
    run() re-queues it until the time arrives. Here we verify that add2queue()
    correctly encodes the delay so execute() is not called immediately.
    """
    cfg = _make_config()
    apis = MagicMock()
    queue = QueueApiCalls("test-queue", "send", apis, cfg)
    before = time.time()

    queue.add2queue([["eiscp", "onkyo", "power-on", "on"]], wait=5)

    assert len(queue.queue) == 1
    execution_time = queue.queue[0][5]   # index 5 = execution_time
    assert execution_time >= before + 5
    apis.api_send.assert_not_called()
