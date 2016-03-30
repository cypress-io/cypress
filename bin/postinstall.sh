#!/bin/bash
cp -r node_modules/cypress-example-kitchensink/app .
rm -rf cypress
cp -r node_modules/cypress-example-kitchensink/cypress .
./bin/convert.js
npm run build