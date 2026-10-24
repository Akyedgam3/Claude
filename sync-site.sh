#!/usr/bin/env bash
# Copies the playable web build into docs/play (so the website can offer "play in browser").
set -euo pipefail
cd "$(dirname "$0")"
rm -rf docs/play && mkdir -p docs/play
cp index.html docs/play/ && cp -r js lib assets docs/play/
echo "docs/play updated"
