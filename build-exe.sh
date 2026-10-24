#!/usr/bin/env bash
# Builds the Windows deliverables (needs Go 1.21+ and go-winres):
#   release/MadCity.exe        portable single-file game
#   release/MadCity-Setup.exe  installer / uninstaller wizard (embeds the game)
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$PATH:$(go env GOPATH)/bin"
command -v go-winres >/dev/null || go install github.com/tc-hib/go-winres@latest
VERSION=$(cat VERSION)
mkdir -p release
rm -rf launcher/game && mkdir -p launcher/game && cp index.html launcher/game/ && cp -r js lib assets launcher/game/
rm -f launcher/*.syso installer/*.syso

WINRES=(simply --arch amd64 --manifest gui --product-name "Mad City 3D" --file-version "$VERSION.0" --product-version "$VERSION" --copyright "Mad City 3D")
( cd launcher && go-winres "${WINRES[@]}" --file-description "Mad City 3D" --original-filename MadCity.exe --out rsrc --icon ../assets/icon.png >/dev/null )
( cd launcher && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H=windowsgui -s -w -X main.version=$VERSION" -o ../release/MadCity.exe . )

cp release/MadCity.exe installer/payload/MadCity.exe
( cd installer && go-winres "${WINRES[@]}" --file-description "Mad City 3D Setup" --original-filename MadCity-Setup.exe --out rsrc --icon ../assets/icon.png >/dev/null )
( cd installer && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H=windowsgui -s -w -X main.version=$VERSION" -o ../release/MadCity-Setup.exe . )
rm -f launcher/*.syso installer/*.syso installer/payload/MadCity.exe
ls -la release
