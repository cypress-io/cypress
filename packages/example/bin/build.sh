#!/bin/bash
rm -rf app
mkdir app
cp -r node_modules/cypress-example-kitchensink/app .
rm -rf cypress
cp -r node_modules/cypress-example-kitchensink/cypress .
./bin/convert.js
gulp build