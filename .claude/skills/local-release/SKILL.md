---
name: local-release
description: Create a versioned release for jc://remote/ — bumps the version across all files, optionally runs tests first, and commits. Use this skill whenever the user wants to do a release, bump the version, cut a new version, or uses phrases like "local release", "release", "bump version", "release patch", "release minor", "release major", "/local-release". Accepts an optional argument of "major", "minor", or "patch". If no bump type is given, suggest one based on recent commits.
---

# Local Release

Interactive release workflow for jc://remote/. Updates the version in all four locations and commits.

## Version file locations

Always update all three files together:

| File | What to change |
|---|---|
| `server/modules/rm3presets.py` | `API_version`, `APP_version`, and prepend old version to `APP_support` list |
| `app/remote-v3/config_main.js` | `app_version` variable |
| `CLAUDE.md` | `Current version:` line |

## Step 1 — Determine the bump type

**If the user passed `major`, `minor`, or `patch` as an argument**, skip to Step 2.

**Otherwise**, gather context and make a suggestion:

1. Read the current version from `server/modules/rm3presets.py` (`API_version` line).
2. Run `git log --oneline -15` to see recent commits since the last version bump.
3. Apply this heuristic to suggest a size:
   - **patch** — only bug fixes, small tweaks, CSS changes, wording
   - **minor** — at least one new user-facing feature (even small ones like swipe navigation)
   - **major** — breaking changes, API redesign, major architectural shifts
4. Present your suggestion with a one-sentence rationale, e.g.:
   > Recent commits include new swipe navigation and dot indicators — I'd suggest a **minor** bump (v3.1.0 → v3.2.0). Proceed with minor, or choose patch / major?

Wait for confirmation before continuing.

## Step 2 — Offer to run tests

Ask the user: **"Run the tests before bumping? (yes / no)"**

- **Yes**: invoke the `run-tests` skill to run the full suite (backend + frontend).
  - If tests **pass**: continue to Step 3.
  - If tests **fail**: show the failures and ask: "Fix the failures before releasing, or proceed anyway?"
    - Fix: address the issues, re-run tests, confirm passing, then continue.
    - Proceed anyway: continue to Step 3 with a note that tests are failing.
- **No**: continue directly to Step 3.

## Step 3 — Calculate and apply the new version

Parse the current version `vX.Y.Z` and compute the new one:

| Bump | Result |
|---|---|
| patch | vX.Y.(Z+1) |
| minor | vX.(Y+1).0 |
| major | v(X+1).0.0 |

Apply to all files:

### `server/modules/rm3presets.py`
```python
API_version = "vX.Y.Z"          # new version
APP_version = "vX.Y.Z"          # new version
APP_support = [APP_version,
               "vOLD",           # insert old version as first entry after APP_version
               ... existing entries unchanged ...
               ]
```

### `app/remote-v3/config_main.js`
```js
var app_version = "vX.Y.Z";     // new version
```

### `CLAUDE.md`
```
- **Current version:** vX.Y.Z   // new version
```

## Step 4 — Commit all changes

First, check for any uncommitted changes:

```bash
git status
```

If there are modified tracked files beyond the three version files, stage and commit them first with a descriptive message:

```bash
git add <changed files>
git commit -m "<describe the changes>"
```

Then stage the three version files and commit the version bump:

```bash
git add server/modules/rm3presets.py app/remote-v3/config_main.js CLAUDE.md
git commit -m "bump version to vX.Y.Z"
```

Report the resulting commit hash and confirm the release is done.
