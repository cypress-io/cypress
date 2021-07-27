#!/bin/bash
if [ $SKIP_DEPCHECK ]; then exit 0; fi

yarn check --integrity

if [ $? -ne 0 ]; then
  echo 'Your dependencies are out of date; installing the correct dependencies...'
  yarn
fi
