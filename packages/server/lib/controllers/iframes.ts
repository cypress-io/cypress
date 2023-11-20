import type { Request, Response } from 'express'
import type httpProxy from 'http-proxy'
import Debug from 'debug'
import files from './files'
import type { Cfg } from '../project-base'
import type { FoundSpec } from '@packages/types'
import type { RemoteStates } from '../remote_states'

const debug = Debug('cypress:server:iframes')

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
  e2e: ({ getSpec, remoteStates, config }: E2E, req: Request, res: Response) => {
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

    files.handleIframe(req, res, config, remoteStates, extraOptions)
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

    // use the node proxy here instead of the network proxy
    // to avoid the user accidentally intercepting and modifying
    // our internal index.html handler

    nodeProxy.web(req, res, {}, (e) => {
      if (e) {
        // eslint-disable-next-line
        debug('Proxy request error. This is likely the socket hangup issue, we can basically ignore this because the stream will automatically continue once the asset will be available', e)
      }
    })
  },
}
