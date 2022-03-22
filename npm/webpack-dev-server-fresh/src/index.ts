/// <reference types="cypress" />

import { nextjsDevServer } from './nextjsDevServer'
import { nuxtjsDevServer } from './nuxtjsDevServer'
import { reactScriptsDevServer } from './reactScriptsDevServer'
import { reactWebpackDevServer } from './reactWebpackDevServer'
import { vueWebpackDevServer } from './vueWebpackDevServer'

// export interface StartDevServer extends UserWebpackDevServerOptions, CypressWebpackDevServerConfig {
//   /* this is the Cypress dev server configuration object */
//   options: Cypress.DevServerConfig
// }

type DoneCallback = () => unknown

export interface ResolvedDevServerConfig {
  port: number
  close: (done?: DoneCallback) => void
}

export interface StartFreshDevServerArgs {
  /* this is the Cypress dev server configuration object */
  options: Cypress.DevServerConfig
}

export function devServer (startDevServerArgs: StartFreshDevServerArgs) {
  const { options: { config: { devServer } } } = startDevServerArgs

  if (typeof devServer === 'function' || typeof devServer !== 'object' || devServer.bundler !== 'webpack') {
    throw new Error('Expected devServer to be an object when sourcing the runtimeDevServer')
  }

  if (devServer.framework === 'react-scripts') {
    return reactScriptsDevServer(startDevServerArgs)
  }

  if (devServer.framework === 'nextjs') {
    return nextjsDevServer(startDevServerArgs)
  }

  if (devServer.framework === 'nuxtjs') {
    return nuxtjsDevServer(startDevServerArgs)
  }

  if (devServer.framework === 'vue') {
    return vueWebpackDevServer(startDevServerArgs)
  }

  if (devServer.framework === 'react') {
    return reactWebpackDevServer(startDevServerArgs)
  }

  throw new Error(`Unexpected devServer.framework ${devServer.framework}`)
}
