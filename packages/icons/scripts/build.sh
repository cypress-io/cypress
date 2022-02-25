#!/bin/bash
set -e
rm -rf dist && mkdir dist && mkdir dist/icons
yarn tsc -p ./tsconfig.build.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  iconutil -c icns assets/cypress.iconset -o dist/icons/cypress.icns
fi
cp -r assets/* dist
mv dist/cypress.iconset/* dist/icons
rm -r dist/cypress.iconset