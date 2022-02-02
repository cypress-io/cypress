import type { Request, Response } from 'express'
import type httpProxy from 'http-proxy'
import Debug from 'debug'
import files from './files'
import type { Cfg } from '../project-base'
import type { FoundSpec } from '@packages/types'

const debug = Debug('cypress:server:iframes')

interface IFramesController {
  config: Cfg
}

interface E2E extends IFramesController {
  getRemoteState: () => any
  getSpec: () => FoundSpec | null
}

interface CT extends IFramesController {
  nodeProxy: httpProxy
}

export const iframesController = {
  e2e: ({ getSpec, getRemoteState, config }: E2E, req: Request, res: Response) => {
    const extraOptions = {
      specType: 'integration',
    }

    debug('handling iframe for project spec %o', {
      spec: getSpec(),
      extraOptions,
    })

    files.handleIframe(req, res, config, getRemoteState, extraOptions)
  },

  component: ({ config, nodeProxy }: CT, req: Request, res: Response) => {
    // always proxy to the index.html file
    // attach header data for webservers
    // to properly intercept and serve assets from the correct src root
    // TODO: define a contract for dev-server plugins to configure this behavior
    req.headers.__cypress_spec_path = req.params[0]
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
