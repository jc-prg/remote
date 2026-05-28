# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jc://remote/** is a home media device control system. It runs a Python/Flask REST API server and a vanilla JS web client, both containerized via Docker. Designed to run on a Raspberry Pi or similar small server on the local network.

- **Backend:** Python 3, Flask + Connexion (OpenAPI/Swagger), REST API defined in `server/modules/rm3api.yml`
- **Frontend:** Vanilla JS (ES6+), no build step, served by Apache via PHP Docker image
- **Infrastructure:** Docker Compose; two containers (server + client)
- **Current version:** v3.1.0

## Running the Project

### Setup (first time)
```bash
cp sample.env .env          # then edit .env to set REMOTE_DIR and ports
git submodule update --init --recursive   # required for app/modules/ and app/framework/
```

### Start / Stop / Restart (requires root)
```bash
sudo ./start                # interactive menu: s=start, r=restart, x=stop, i=start visible, l=log
sudo ./start start          # non-interactive
sudo ./start stop
sudo ./start restart
```

### Start server directly (outside Docker, for development)
```bash
cd /path/to/remote
python3 -m server.server    # runs on port 5001 by default (set in .env)
```

### Watch logs
```bash
sudo ./start watchlog       # tails the log file
tail -f log/server.log
```

### Docker operations
```bash
docker-compose -f docker-compose.yml up -d       # start detached
docker-compose -f docker-compose.yml up          # start with visible output
docker-compose -f docker-compose.yml stop
docker-compose -f docker-compose.yml restart
docker image prune && docker container prune     # cleanup
```

## Architecture

### Server (`server/`)

`server.py` is the entry point. It initializes all components and passes them to `rm3api.py`.

Key modules in `server/modules/`:
- `rm3api.py` — REST endpoint handlers; routes defined in `rm3api.yml` (Swagger)
- `rm3data.py` — reads/writes all JSON config files; central data cache
- `rm3config.py` — low-level JSON file caching with cache invalidation
- `rm3queue.py` — two async queues: `Q-send` (fire-and-forget commands) and `Q-query` (status polling)
- `rm3timer.py` — scheduled events engine
- `rm3record.py` — time-series data recording (for Chart.js graphs)
- `rm3presets.py` — global constants, log setup, environment variable loading
- `rm3classes.py` — base class `RemoteDefaultClass` used by all major classes
- `rm3ping.py` — network device reachability monitoring

### Device Interfaces (`server/interfaces/`)

Each supported device protocol has an `api_<name>.py` file. `interfaces.py` manages them all.

Adding a new interface: copy `api_sample.py`, add it to `self.api_modules` in `interfaces.py`, add Python deps to both `config/container/requirements.txt` and `config/container_arm/requirements.txt`, and create a config directory under `data/devices/YOURAPI/`.

Current interfaces: `api_broadlink`, `api_denon`, `api_eiscp` (ONKYO), `api_kodi`, `api_magichome`, `api_p100` (Tapo), `api_sony`, `api_weather`, `api_zigbee`.

### REST API

The Swagger spec in `server/modules/rm3api.yml` defines all routes. The API response always includes three sections: `CONFIG` (structure/metadata), `STATUS` (device state), and `DATA` (payload). The frontend polls these endpoints for live device state.

### Frontend (`app/`)

No build step — all JS/CSS is loaded directly. `app/index.html` loads scripts in the order defined by `app/remote-v3/remote.js`.

Key JS files in `app/remote-v3/`:
- `rm_main.js` — `RemoteMain` class, top-level coordinator
- `rm_api-control.js` — REST API calls
- `rm_menu.js`, `rm_control.js`, `rm_settings.js` — UI sections
- `style-*.css` — split by concern (layout, themes, buttons, etc.)

Two git submodules provide shared utilities:
- `app/modules/` → `jc://modules/` (shared JS utilities)
- `app/framework/` → `jc://app-framework/` (web app framework)

### Configuration & Data (`data/`)

All runtime configuration is JSON files:
- `data/_ACTIVE-*.json` — active configuration sets (APIs, devices, scenes, remotes, macros)
- `data/devices/<APINAME>/` — per-device config (`00_interface.json`, `00_default.json`, `cfg-<device>.json`)
- `data/remotes/rmc_<device>.json` — remote control button layouts
- `data/remotes/scene_<name>.json` — scene (multi-device) remote layouts
- `data/buttons/` — button icon index and images

### Environment Variables (`.env`)

Key vars:
- `REMOTE_DIR` — absolute path to repo root (must match actual path)
- `REMOTE_CLIENT_PORT` / `REMOTE_SERVER_PORT` — default 81 / 5001
- `REMOTE_CURRENT_STAGE` — `test`, `dev`, or `prod` (affects Docker container names)
- `REMOTE_LOG_LEVEL` — `INFO`, `DEBUG`, `WARNING`, `ERROR`
- `REMOTE_LOGGING_DEBUG` — comma-separated module names to override log level for

## File Naming Conventions

| Pattern | What it is |
|---|---|
| `server/modules/rm3*.py` | Server-side core modules |
| `app/remote-v3/rm_*.js` | Frontend JS classes |
| `app/remote-v3/style-*.css` | Frontend stylesheets |
| `data/remotes/rmc_*.json` | Device remote layouts |
| `data/remotes/scene_*.json` | Scene remote layouts |
| `data/devices/<API>/cfg-*.json` | Per-device configs |
| `data/_ACTIVE-*.json` | Active runtime configs |

## Branches

- `master` — production releases
- `dev` — active development (current working branch)
