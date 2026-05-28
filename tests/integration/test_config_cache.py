"""
Integration tests for server/modules/rm3config.py :: ConfigCache

ConfigCache wraps rm3json for file I/O and keeps an in-memory cache.
These tests exercise real file I/O via tmp_path by redirecting rm3json's
jsonPath to a temporary directory.

Coverage:
  - read(): caches on first access; subsequent reads hit the cache
  - read(from_file=True): bypasses the cache and re-reads from disk
  - write(): persists to disk and updates the in-memory cache
  - delete(): removes the file and clears the cache entry
  - device_delete(): correct error message for a missing device (bug #13 doc)
"""
import json
import pytest

import server.modules.rm3json as rm3json
from server.modules.rm3config import ConfigCache


# ---------------------------------------------------------------------------
# Fixture: redirect all file I/O to tmp_path
# ---------------------------------------------------------------------------

@pytest.fixture
def cache(tmp_path, monkeypatch):
    """A ConfigCache instance whose files land in tmp_path."""
    monkeypatch.setattr(rm3json, "jsonPath", str(tmp_path) + "/")
    return ConfigCache("test-cache")


def _write_json(tmp_path, name, content):
    """Write a JSON file directly (simulating an external update on disk)."""
    (tmp_path / (name + ".json")).write_text(json.dumps(content), encoding="utf-8")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.integration
def test_read_caches_on_first_access(cache, tmp_path):
    """read() loads from disk the first time and stores the result in cache."""
    _write_json(tmp_path, "myconfig", {"key": "value"})

    result = cache.read("myconfig")

    assert result == {"key": "value"}
    # Cache entry must now exist
    assert "myconfig" in cache.cache


@pytest.mark.integration
def test_read_returns_cached_value_on_second_call(cache, tmp_path):
    """
    A second read() without from_file returns the cached value even if the
    file changes on disk in between.
    """
    _write_json(tmp_path, "myconfig", {"version": 1})
    cache.read("myconfig")                          # prime the cache

    # Overwrite the file without going through cache.write()
    _write_json(tmp_path, "myconfig", {"version": 2})

    result = cache.read("myconfig")                 # should return cached v1
    assert result["version"] == 1


@pytest.mark.integration
def test_from_file_bypasses_cache(cache, tmp_path):
    """read(from_file=True) re-reads from disk, picking up external changes."""
    _write_json(tmp_path, "myconfig", {"version": 1})
    cache.read("myconfig")                          # prime the cache

    _write_json(tmp_path, "myconfig", {"version": 2})

    result = cache.read("myconfig", from_file=True)
    assert result["version"] == 2


@pytest.mark.integration
def test_write_persists_to_disk_and_updates_cache(cache, tmp_path):
    """write() stores data on disk AND updates the in-memory cache entry."""
    cache.write("settings", {"brightness": 80})

    # File must exist on disk
    disk_content = json.loads((tmp_path / "settings.json").read_text())
    assert disk_content == {"brightness": 80}

    # Cache must reflect the new value without a separate read()
    assert cache.cache["settings"] == {"brightness": 80}


@pytest.mark.integration
def test_delete_removes_file_and_clears_cache(cache, tmp_path):
    """delete() removes the file from disk and evicts the cache entry."""
    cache.write("temp_cfg", {"foo": "bar"})
    assert (tmp_path / "temp_cfg.json").exists()

    result = cache.delete("temp_cfg")

    assert "OK" in result
    assert not (tmp_path / "temp_cfg.json").exists()
    assert "temp_cfg" not in cache.cache


@pytest.mark.integration
def test_device_delete_missing_returns_error(cache, tmp_path):
    """
    device_delete() for a device that does not exist returns an error string.

    The exact wording contains the grammar bug 'deleted' (should be 'delete')
    which is documented as bug #13 — this test intentionally asserts the
    current (buggy) behaviour so a future fix will be visible immediately.
    """
    import server.modules.rm3presets as rm3presets

    # Ensure _ACTIVE-DEVICES.json exists in tmp_path with no devices
    _write_json(tmp_path, rm3presets.active_devices, {"data": {}, "status": {}})

    result = cache.device_delete("nonexistent_device")

    assert result.startswith("ERROR:"), f"Expected error, got: {result!r}"
    # Document the grammar bug: "deleted" should be "delete" (bug #13)
    assert "deleted" in result, (
        "Bug #13 regression: expected grammar bug 'deleted' still present; "
        f"got: {result!r}"
    )
