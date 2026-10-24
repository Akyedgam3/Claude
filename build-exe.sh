#!/usr/bin/env bash
# Builds release/MadCity.exe (Windows 64-bit) — a single self-contained file.
set -e
cd "$(dirname "$0")"
rm -rf launcher/game && mkdir -p launcher/game release
cp index.html launcher/game/ && cp -r js lib launcher/game/
cd launcher
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-H=windowsgui -s -w" -o ../release/MadCity.exe .
echo "built release/MadCity.exe"
