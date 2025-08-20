#!/bin/bash
if [ $SKIP_DEPCHECK ]; then exit 0; fi

# Skip integrity check in CI environments to prevent patch reapplication issues
if [ "$CI" = "true" ] || [ "$CIRCLECI" = "true" ]; then
  echo 'Skipping dependency integrity check in CI environment'
  exit 0
fi

yarn check --integrity

if [ $? -ne 0 ]; then
  echo 'Your dependencies are out of date; installing the correct dependencies...'
  yarn
fi
