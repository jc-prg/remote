---
name: run-tests
description: Run the test suite for jc://remote/ — backend (pytest) and/or frontend (Jest, Playwright). Use this skill whenever the user wants to run tests, execute the test suite, check if tests pass, or run a specific subset of tests. Trigger on phrases like "run tests", "run all tests", "run the tests", "execute tests", "check tests", "do the tests pass", "pytest", "jest", "playwright", "e2e", "run unit tests", "run integration tests", "run frontend tests", "run backend tests", "run e2e tests".
---

# Run Tests

The project has two independent test suites:

- **Backend** — Python/pytest (`tests/unit/`, `tests/integration/`, `tests/api/`, `tests/live/`)
- **Frontend** — JavaScript/Jest (`tests/unit/*.js`, `tests/integration/*.js`) + Playwright e2e (`tests/e2e/*.js`)

Run all commands from the project root using absolute paths.

## Project root
`/mnt/Daten/projects/test/remote`

## Python interpreter

Always use the project virtualenv: `/mnt/Daten/projects/test/remote/.venv/bin/python`

---

## Commands

**All offline tests — backend + frontend (default):**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest tests/unit/ tests/integration/ tests/api/ -v && npx jest tests/unit/ tests/integration/ --testEnvironment node
```

**Backend only — all offline:**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest tests/unit/ tests/integration/ tests/api/ -v
```

**Frontend only — Jest unit + integration:**
```bash
cd /mnt/Daten/projects/test/remote && npx jest tests/unit/ tests/integration/ --testEnvironment node
```

**Frontend e2e — Playwright (starts mock API + static server automatically):**
```bash
cd /mnt/Daten/projects/test/remote && npx playwright test
```

**All frontend tests (Jest + Playwright e2e):**
```bash
cd /mnt/Daten/projects/test/remote && npx jest tests/unit/ tests/integration/ && npx playwright test
```

**Frontend lint (ESLint static analysis):**
```bash
cd /mnt/Daten/projects/test/remote && npx eslint app/remote-v3/ --config tests/lint/.eslintrc.js --ext .js
```

**Backend unit tests only:**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest -m unit -v
```

**Backend integration tests:**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest -m integration -v
```

**Backend API contract tests:**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest -m api -v
```

**Live tests (requires running server + hardware — ask the user before running these):**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest -m live -v
```

**Full backend suite including live (only if user explicitly requests it):**
```bash
cd /mnt/Daten/projects/test/remote && .venv/bin/python -m pytest -v
```

---

## Workflow

1. Run the appropriate command(s) using the Bash tool.
2. Show the full output so the user can see which tests passed and which failed.
3. If any tests fail, summarize the failures clearly: which test, what was asserted, what was actually returned.
4. If the user asks why a test failed, read the relevant source file and explain.

---

## Backend markers (defined in pytest.ini)

| Marker | What it covers |
|---|---|
| `unit` | Isolated logic, no I/O, no network — always safe to run |
| `integration` | Real filesystem via tmp_path, no network |
| `api` | REST contract tests against a mock Flask test client |
| `live` | Requires a running server or real hardware — excluded from CI |

## Frontend test locations

| Path | Runner | What it covers |
|---|---|---|
| `tests/unit/*.js` | Jest (node env) | Isolated JS class logic, no DOM |
| `tests/integration/*.js` | Jest (jsdom env) | Class interactions with DOM |
| `tests/e2e/test_*.js` | Playwright (Chromium) | Page load, API calls, no JS errors |
| `tests/lint/.eslintrc.js` | ESLint | Static analysis of `app/remote-v3/` |

## E2e infrastructure

- `tests/e2e/fixtures/mock-api-server.js` — Express mock of the Flask REST API (port 5001)
- `tests/e2e/fixtures/static-server.js` — serves `app/` as document root (port 8080)
- `playwright.config.js` — both servers started automatically via `webServer`
- NixOS note: `playwright.config.js` sets `executablePath` to the Nix store Chromium path; update that path if Chromium is upgraded
