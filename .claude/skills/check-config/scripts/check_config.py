#!/usr/bin/env python3
"""
jc://remote/ config consistency checker.
Verifies all files referenced in _ACTIVE-*.json exist and cross-references are valid.
"""

import json
import os
import sys

BASE = "/mnt/Daten/projects/test/remote/data"
issues = []
ok_count = 0


def check(exists, label):
    global ok_count
    if exists:
        ok_count += 1
    else:
        issues.append(label)


def load(filename):
    path = os.path.join(BASE, filename)
    if not os.path.exists(path):
        print(f"ERROR: {filename} not found at {path}")
        sys.exit(1)
    with open(path) as f:
        return json.load(f)


def file_exists(*parts):
    return os.path.exists(os.path.join(BASE, *parts))


# ── Load active configs ───────────────────────────────────────────────────────
apis    = load("_ACTIVE-APIS.json")
devices = load("_ACTIVE-DEVICES.json")
scenes  = load("_ACTIVE-SCENES.json")
macros  = load("_ACTIVE-MACROS.json")

known_devices = set(devices.keys())
known_scenes  = set(scenes.keys())

# cache of API-Devices keys per api_key (loaded on demand)
_iface_cache = {}

def get_api_devices(api_key):
    if api_key not in _iface_cache:
        iface_path = os.path.join(BASE, "devices", api_key, "00_interface.json")
        if os.path.exists(iface_path):
            with open(iface_path) as f:
                _iface_cache[api_key] = set(json.load(f).get("API-Devices", {}).keys())
        else:
            _iface_cache[api_key] = None  # file missing, already reported above
    return _iface_cache[api_key]

# ── _ACTIVE-APIS.json ────────────────────────────────────────────────────────
print("=" * 60)
print("_ACTIVE-APIS.json")
print("=" * 60)

for api_key, api in sorted(apis.items()):
    iface_path = os.path.join(BASE, "devices", api_key, "00_interface.json")
    if not os.path.exists(iface_path):
        issues.append(f"  MISSING interface    [{api_key}]  devices/{api_key}/00_interface.json")
        continue

    with open(iface_path) as f:
        iface = json.load(f)
    defined_devices = set(iface.get("API-Devices", {}).keys())

    for api_device, active in api.get("devices_active", {}).items():
        exists = api_device in defined_devices
        check(exists, f"  UNKNOWN api device   [{api_key}]  '{api_device}' not in devices/{api_key}/00_interface.json API-Devices")

# ── _ACTIVE-DEVICES.json ─────────────────────────────────────────────────────
print("=" * 60)
print("_ACTIVE-DEVICES.json")
print("=" * 60)

for dev_id, dev in sorted(devices.items()):
    cfg = dev.get("config", {})
    api_key     = cfg.get("api_key", "")
    device_file = cfg.get("device", "")
    remote_file = cfg.get("remote", "")

    if not api_key and not device_file:
        continue  # skip 'default' or empty entries

    if api_key and device_file:
        path = f"devices/{api_key}/{device_file}.json"
        exists = file_exists("devices", api_key, device_file + ".json")
        check(exists, f"  MISSING device file  [{dev_id}]  {path}")

    api_device = cfg.get("api_device", "")
    if api_key and api_device:
        api_devs = get_api_devices(api_key)
        if api_devs is not None:
            check(api_device in api_devs,
                  f"  UNKNOWN api_device   [{dev_id}]  '{api_device}' not in devices/{api_key}/00_interface.json API-Devices")

    if remote_file:
        path = f"remotes/{remote_file}.json"
        exists = file_exists("remotes", remote_file + ".json")
        check(exists, f"  MISSING remote file  [{dev_id}]  {path}")

# ── _ACTIVE-SCENES.json ──────────────────────────────────────────────────────
print()
print("=" * 60)
print("_ACTIVE-SCENES.json")
print("=" * 60)

for scene_id, scene in sorted(scenes.items()):
    cfg = scene.get("config", {})
    remote_file = cfg.get("remote", "")

    if remote_file:
        exists = file_exists("remotes", remote_file + ".json")
        check(exists, f"  MISSING remote file  [{scene_id}]  remotes/{remote_file}.json")

    for dev_ref in scene.get("remote", {}).get("devices", []):
        exists = dev_ref in known_devices
        check(exists, f"  UNKNOWN device ref   [{scene_id}]  device '{dev_ref}' not in _ACTIVE-DEVICES.json")

# ── _ACTIVE-MACROS.json ──────────────────────────────────────────────────────
print()
print("=" * 60)
print("_ACTIVE-MACROS.json")
print("=" * 60)

for section in ("dev-on", "dev-off"):
    for key in macros.get(section, {}):
        dev_id = key.split("_")[0]
        exists = dev_id in known_devices
        check(exists, f"  UNKNOWN device ref   [{section}]  device '{dev_id}' not in _ACTIVE-DEVICES.json")

for section in ("scene-on", "scene-off"):
    for key in macros.get(section, {}):
        scene_id = key.split("_")[0]
        exists = scene_id in known_scenes
        check(exists, f"  UNKNOWN scene ref    [{section}]  scene '{scene_id}' not in _ACTIVE-SCENES.json")

# ── Summary ──────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("SUMMARY")
print("=" * 60)
total = ok_count + len(issues)
print(f"Checked : {total} references")
print(f"OK      : {ok_count}")
print(f"Issues  : {len(issues)}")

if issues:
    print()
    print("Issues found:")
    # deduplicate while preserving order
    seen = set()
    for issue in issues:
        if issue not in seen:
            print(issue)
            seen.add(issue)
    sys.exit(1)
else:
    print()
    print("All referenced files exist and all cross-references are valid.")
