---
name: check-config
description: Check the jc://remote/ configuration for consistency — verifies all files referenced in _ACTIVE-*.json actually exist and that all cross-references between devices, scenes, and macros are valid. Use this skill whenever the user wants to check the config, verify configuration files, find missing files, check for broken references, validate the setup, or says things like "check config", "is the config ok", "are there missing files", "config broken", "verify configuration", "what's missing in the config", "check _ACTIVE files".
---

# Check Configuration

Runs a consistency check across all `_ACTIVE-*.json` files in the `data/` directory.

## Project root
`/mnt/Daten/projects/test/remote`

## What is checked

| File | What is verified |
|---|---|
| `_ACTIVE-APIS.json` | every key in `<api>.devices_active` exists in `data/devices/<api>/00_interface.json` under `API-Devices` |
| `_ACTIVE-DEVICES.json` | `data/devices/<api_key>/<device>.json` exists; `data/remotes/<remote>.json` exists |
| `_ACTIVE-SCENES.json` | `data/remotes/<remote>.json` exists; every device ID in `remote.devices[]` exists in `_ACTIVE-DEVICES.json` |
| `_ACTIVE-MACROS.json` | device IDs in `dev-on`/`dev-off` keys exist in `_ACTIVE-DEVICES.json`; scene IDs in `scene-on`/`scene-off` keys exist in `_ACTIVE-SCENES.json` |

## Workflow

Run the bundled script and report results:

```bash
python3 /mnt/Daten/projects/test/remote/.claude/skills/check-config/scripts/check_config.py
```

The script prints a structured report. Present it clearly to the user:
- If everything is OK, say so.
- If there are issues, group them by category (missing files / unknown references) and list the specifics so the user knows exactly what to fix or restore.
