#!/bin/bash
set -e
rm -rf dist && mkdir dist && mkdir dist/icons
if [[ "$OSTYPE" == "darwin"* ]];
  iconutil -c icns src/cypress.iconset -o dist/icons/cypress.icns;
fi
cp -r src/* dist
mv dist/cypress.iconset/* dist/icons
rm -r dist/cypress.iconset