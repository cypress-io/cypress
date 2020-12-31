/// <reference path="../../../../cli/types/cypress.d.ts" />

import * as serverCt from '@packages/server-ct'
import api from './run'

// 1. create new express routes for serving top
// 2. boot websocket server
// 3. open browser to runner-ct entrypoint (top)

// Eslint does not seem to understand /// <reference /> ...
/* eslint-disable no-undef */
export const run = (options: Cypress.PluginConfigOptions) => {
  // we are in run mode
  if (options.runProject) {
    api.ready(options)
  }

  return serverCt.start(options.projectRoot, options)
}
