"""
Unit tests for server/modules/rm3json.py

All file operations are redirected to a pytest tmp_path — the real data/
directory is never touched. Tests run offline with no network or server.
"""
import json
import os
import pytest

import server.modules.rm3json as rm3json


@pytest.fixture(autouse=True)
def isolate_json_path(tmp_path, monkeypatch):
    """
    Redirect rm3json to a per-test temporary directory.

    jsonPath must be an absolute path: os.path.join() discards the preceding
    jsonAppDir component when it encounters an absolute segment, so the final
    path resolves to tmp_path/<file>.json regardless of jsonAppDir's value.
    """
    monkeypatch.setattr(rm3json, "jsonPath", str(tmp_path) + "/")


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_read_valid_json(tmp_path):
    """Reads a well-formed JSON file and returns the correct dict."""
    data = {"key": "value", "number": 42, "nested": {"a": 1}}
    (tmp_path / "sample.json").write_text(json.dumps(data), encoding="utf-8")

    result = rm3json.read("sample")

    assert result == data


@pytest.mark.unit
def test_read_missing_file():
    """Missing file returns a dict with an ERROR key — does not raise."""
    result = rm3json.read("does_not_exist")

    assert isinstance(result, dict)
    assert "ERROR" in result


# ---------------------------------------------------------------------------
# Write + round-trip
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_write_creates_file(tmp_path):
    """write() followed by read() returns identical data."""
    data = {"hello": "world", "items": [1, 2, 3]}

    rm3json.write("roundtrip", data)
    result = rm3json.read("roundtrip")

    assert result == data


# ---------------------------------------------------------------------------
# Atomic write
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_write_atomic(tmp_path, monkeypatch):
    """
    If os.replace() fails mid-write, the original file is not corrupted.

    Verifies that rm3json.write() uses a temp file + os.replace() pattern
    (regression test for the non-atomic write described in backend-code-quality.md #4).
    """
    original_data = {"version": 1}
    rm3json.write("atomic_test", original_data)

    def failing_replace(src, dst):
        raise OSError("simulated crash during replace")

    monkeypatch.setattr(os, "replace", failing_replace)

    with pytest.raises(OSError):
        rm3json.write("atomic_test", {"version": 2})

    # read() uses open(), not os.replace — works even with replace still patched
    result = rm3json.read("atomic_test")
    assert result == original_data


# ---------------------------------------------------------------------------
# Existence check
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_if_exist_true(tmp_path):
    """if_exist() returns True for a file that exists."""
    (tmp_path / "existing.json").write_text("{}", encoding="utf-8")

    assert rm3json.if_exist("existing") is True


@pytest.mark.unit
def test_if_exist_false():
    """if_exist() returns False for a missing file — no exception raised."""
    assert rm3json.if_exist("no_such_file") is False
