"""
Root conftest — ensures the project root is on sys.path so that
`import server.modules.*` works regardless of where pytest is invoked from.

Note: importing server.modules.rm3presets triggers side effects at module level
(reads .env, checks git submodules, writes config_stage.js). Tests that need
full isolation from the filesystem must monkeypatch rm3presets globals before
the first import. See tests/api/conftest.py for the API test client fixture.
"""
import sys
import os

# Add project root to path so `server` package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
