"""Allow running CLI as: python -m src.cli"""

import os
import sys

# Fix Windows encoding: default to UTF-8 for all file I/O and stdout
if sys.platform == "win32":
    os.environ.setdefault("PYTHONUTF8", "1")
    # Reconfigure stdout/stderr if they use a lossy encoding
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from .main import main

sys.exit(main())
