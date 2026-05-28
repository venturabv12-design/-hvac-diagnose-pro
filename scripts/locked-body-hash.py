#!/usr/bin/env python3
# locked-body-hash.py — extract locked function bodies from public/index.html
# and emit `name<TAB>sha256` per line.
#
# Used by scripts/post-edit-audit.sh (Hook C) to verify that the bodies of
# Trazer's locked functions haven't drifted from the HEAD baseline. Unlike
# the substring-match in Hook A, this gate doesn't trust the tool input —
# it inspects the resulting file regardless of how the edit was issued.
#
# Usage:
#   python3 scripts/locked-body-hash.py PATH          # read file
#   python3 scripts/locked-body-hash.py -             # read stdin
#
# Output format (tab-separated, one line per locked name):
#   parseJSON<TAB>sha256-of-the-body-text
#   flipCamera<TAB>sha256-of-the-body-text
#   ...
# Or, if a function is missing:
#   flipCamera<TAB>MISSING

import sys
import re
import hashlib

LOCKED = [
    "parseJSON",
    "renderDiagCards",
    "primeCameraAudio",
    "checkCameraAccess",
    "startLiveCamera",
    "startCameraStream",
    "stopLiveCamera",
    "flipCamera",
    "analyzeCameraFrame",
    "setCameraResponse",
    "updateCameraMicState",
    "mikeSayCamera",
]


def extract_body(text, name):
    """Find `(async )?function NAME(...){...}` and return the full
    declaration-through-closing-brace as a string. Whitespace-tolerant
    around tokens. Returns None if the function is not found or its
    body is unbalanced."""
    pat = (
        r"(?:async\s+)?function\s+"
        + re.escape(name)
        + r"\s*\([^)]*\)\s*\{"
    )
    m = re.search(pat, text)
    if not m:
        return None
    # Brace-walk from the opening `{` (last char of the match)
    depth = 0
    i = m.end() - 1
    n = len(text)
    while i < n:
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return text[m.start() : i + 1]
        i += 1
    return None


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(
            "usage: locked-body-hash.py PATH | locked-body-hash.py -\n"
        )
        sys.exit(2)

    target = sys.argv[1]
    if target == "-":
        text = sys.stdin.read()
    else:
        try:
            with open(target, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            sys.stderr.write("[locked-body-hash] read error: " + str(e) + "\n")
            sys.exit(2)

    for name in LOCKED:
        body = extract_body(text, name)
        if body is None:
            print(name + "\tMISSING")
        else:
            h = hashlib.sha256(body.encode("utf-8")).hexdigest()
            print(name + "\t" + h)


if __name__ == "__main__":
    main()
