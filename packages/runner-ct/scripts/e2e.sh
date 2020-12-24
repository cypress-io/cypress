#!/usr/bin/env bash

SOCKET="/__ct-socket.io"
CLIENT_ROUTE="/__ct/"
NAMESPACE="__cypress-ct123"
PORT=4444

yarn cross-env E2E_OVER_COMPONENT_TESTS=true \
  node ../../scripts/cypress open \
  -e namespace=$NAMESPACE,clientRoute=$CLIENT_ROUTE,port=$PORT,socketIoRoute=$SOCKET \
  --component-testing \
  $@
