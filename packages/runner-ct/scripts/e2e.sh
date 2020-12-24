#!/usr/bin/env bash

SOCKET="/__ct-socket.io"
CLIENT_ROUTE="/__ct/"
NAMESPACE="__cypress-ct123"
PORT=4444

yarn cross-env E2E_OVER_COMPONENT_TESTS=true \
  CYPRESS_NAMESPACE=$NAMESPACE \
  CYPRESS_CLIENT_ROUTE=$CLIENT_ROUTE \
  CYPRESS_PORT=$PORT \
  CYPRESS_SOCKET_IO_ROUTE=$SOCKET \
  node ../../scripts/start.js open \
  --component-testing \
  --run-project $@
