import type { Request, Response } from 'express'
import type httpProxy from 'http-proxy'
import Debug from 'debug'
import files from './files'
import type { Cfg } from '../project-base'
import type { FoundSpec } from '@packages/types'
import type { RemoteStates } from '@packages/network-tools'
import { GracefulExit } from '../util/graceful-exit'
import Bluebird from 'bluebird'

const debug = Debug('cypress:server:iframes')

// The dev server's socket can close before Node reports that the config process (which hosts the dev server) exited.
// Its unexpected exit ends the run through GracefulExit, so a proxy error is given a moment for that to start.
// Reaping the killed process is slowest on a machine that is out of memory, so the bound is generous.
const SHUTDOWN_WAIT_MS = 5000
const SHUTDOWN_POLL_MS = 50

const shutdownStartsSoon = async () => {
  for (let waited = 0; waited < SHUTDOWN_WAIT_MS && !GracefulExit.isShuttingDown; waited += SHUTDOWN_POLL_MS) {
    await Bluebird.delay(SHUTDOWN_POLL_MS)
  }

  return GracefulExit.isShuttingDown
}

interface IFramesController {
  config: Cfg
}

interface E2E extends IFramesController {
  remoteStates: RemoteStates
  getSpec: () => FoundSpec | null
}

interface CT extends IFramesController {
  nodeProxy: httpProxy
}

export const iframesController = {
  e2e: async ({ getSpec, remoteStates, config }: E2E, req: Request, res: Response) => {
    const extraOptions = {
      specType: 'integration',
    }

    debug('handling iframe for project spec %o', {
      spec: getSpec(),
      extraOptions,
    })

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    await files.handleIframe(req, res, config, remoteStates, extraOptions)
  },

  component: ({ config, nodeProxy }: CT, req: Request, res: Response) => {
    // requests to the index.html are from initializing the iframe. They include the specPath as query parameter
    const specPath = req.query.specPath

    if (typeof specPath === 'string') {
      // for those requests we need to provide the spec-path via this header
      req.headers.__cypress_spec_path = encodeURI(specPath)
      req.url = `${config.devServerPublicPathRoute}/index.html`
      delete req.query.specPath
    } else {
      // all other requests should be forwarded to the devserver, preserving their relative paths so assets with relative urls work.
      req.url = `${config.devServerPublicPathRoute}/${req.params[0]}`
    }

    // use the node proxy here instead of the network proxy to avoid
    // the user accidentally intercepting and modifying our internal index.html handler
    nodeProxy.web(req, res, {}, async (e) => {
      if (e) {
        if (config.isTextTerminal) {
          // if we are in run mode and we receive an error, we need to throw an error so the app doesn't hang
          debug('Error interacting with the dev server.', e)

          if (await shutdownStartsSoon()) {
            debug('not rethrowing: the process is shutting down')
            res.destroy()

            return
          }

          throw e
        } else {
          // if we are in open mode, there can be multiple reasons we can't interact with the dev server (e.g. the config changed and the dev server has restarted, reruns, etc.),
          // we can ignore this error since the App should make another request (note: it is possible the dev server has crashed or doesn't respond in a timely manner, in which case the App will hang)
          debug('Error interacting with the dev server. Ignoring since the App should make another request.', e)
        }
      }
    })
  },
}
