#!/bin/bash
yarn check --integrity

if [ $? -ne 0 ]; then
  echo '======================================================================='
  echo '=     ⚠ Warning: Your node_modules and yarn.lock are mismatched! ⚠    ='
  echo '=  This usually indicates that you have not run "yarn" since pulling  ='
  echo '=   from Git. This will cause issues where dependencies are outdated  ='
  echo '=     or missing, causing unexpected behavior. Run "yarn" to fix.     ='
  echo '======================================================================='
fi
