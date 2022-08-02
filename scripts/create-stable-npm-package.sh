#!/bin/bash
set -e # exit on error

PLATFORM=$(node -p 'process.platform')
if [[ $PLATFORM != "linux" && $PLATFORM != "darwin" ]]; then
  echo "Currently, create-stable-npm-package is only supported on Linux and MacOS."
  echo "See https://github.com/cypress-io/cypress/pull/20296#discussion_r817115583"
  exit 1
fi

if [[ ! $1 ]]; then
  echo "publish-npm-package takes the .tgz URL as the first argument"
  exit 1
fi

if [[ $1 != *"linux-x64"* ]]; then
  echo "Only publish the 'linux-x64' .tgz. A non-linux-x64 .tgz was passed."
  exit 1
fi

set -x # log commands

TGZ_URL=$1
PREPROD_TGZ_PATH=/tmp/cypress-preprod.tgz
UNPACKED_PATH=/tmp/unpacked-cypress
PROD_TGZ_PATH=/tmp/cypress-prod.tgz

echo "Downloading tgz from TGZ_URL=$TGZ_URL"
curl $TGZ_URL -o $PREPROD_TGZ_PATH

echo "Untarring PREPROD_TGZ_PATH=$PREPROD_TGZ_PATH"
rm -rf $UNPACKED_PATH || true
mkdir $UNPACKED_PATH
tar -xzvf $PREPROD_TGZ_PATH -C $UNPACKED_PATH

export PKG_JSON_PATH=$UNPACKED_PATH/package/package.json

echo "Patching stable: true to package.json"
node <<EOF
  const fs = require('fs')
  const pkg = require("$PKG_JSON_PATH")
  pkg.buildInfo.stable = true
  const json = JSON.stringify(pkg, null, 2)
  fs.writeFileSync("$PKG_JSON_PATH", json)
EOF

echo "New package.json:"
cat $UNPACKED_PATH/package/package.json

echo "Tarring..."
cd $UNPACKED_PATH
tar -czvf $PROD_TGZ_PATH *

set +x

echo "Prod NPM package built at:"
echo "  $PROD_TGZ_PATH"