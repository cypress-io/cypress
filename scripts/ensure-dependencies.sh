#!/bin/bash
if [ $SKIP_DEPCHECK ]; then
  echo 'SKIP_DEPCHECK is set, not checking modules.'
  exit 0
fi

yarn check --integrity

if [ $? -ne 0 ]; then
  echo 'yarn check --integrity failed.'
  echo 'This means the package.json and/or yarn.lock does not match the installed packages.'

  if [ $CI ]; then
    echo 'Since we are in CI, we cannot continue.'
    echo 'Check if your yarn.lock is up to date, and check why node_modules_install did not fail with --frozen-lockfile.'
    exit 1
  fi

  echo 'To skip this check for local development, set SKIP_DEPCHECK=1.'
  echo 'Installing the correct dependencies with "yarn --frozen-lockfile"...'
  set +e
  yarn
fi
