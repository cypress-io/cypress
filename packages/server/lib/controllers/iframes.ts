import type { Request, Response } from 'express'
import type httpProxy from 'http-proxy'
import Debug from 'debug'
import files from './files'
import type { Cfg } from '../project-base'

const debug = Debug('cypress:server:iframes')

interface IFramesController {
  config: Cfg
}

interface E2E extends IFramesController {
  getRemoteState: () => any
  getSpec: () => Cypress.Cypress['spec'] | null
}

interface CT extends IFramesController {
  nodeProxy: httpProxy
}

export const iframesController = {
  e2e: ({ getSpec, getRemoteState, config }: E2E, req: Request, res: Response) => {
    const extraOptions = {
      specFilter: getSpec()?.specFilter,
      specType: 'integration',
    }

    debug('handling iframe for project spec %o', {
      spec: getSpec(),
      extraOptions,
    })

    // Chrome plans to make document.domain immutable in Chrome 106, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    files.handleIframe(req, res, config, getRemoteState, extraOptions)
  },

  component: ({ config, nodeProxy }: CT, req: Request, res: Response) => {
    // always proxy to the index.html file
    // attach header data for webservers
    // to properly intercept and serve assets from the correct src root
    // TODO: define a contract for dev-server plugins to configure this behavior
    req.headers.__cypress_spec_path = encodeURI(req.params[0])
    req.url = `${config.devServerPublicPathRoute}/index.html`

    // user the node proxy here instead of the network proxy
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
