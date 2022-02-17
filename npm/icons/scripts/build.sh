#!/bin/bash
rm -rf dist && mkdir dist && mkdir dist/icons
iconutil -c icns src/cypress.iconset -o dist/icons/cypress.icns
cp -r src/* dist
mv dist/cypress.iconset/* dist/icons
rm -r dist/cypress.iconset