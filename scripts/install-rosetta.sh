#!/usr/bin/env bash
if [ "$(uname -m)" == "arm64" ] && [ "$(uname -s)" == "Darwin" ]; then
    echo "Detected darwin-arm64. Installing Rosetta 2"
    /usr/sbin/softwareupdate --install-rosetta --agree-to-license
else
    echo "Not running on darwin-arm64. Skipping Rosetta 2 installation"
fi