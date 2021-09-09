import Debug from 'debug'
import { Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import { runner } from './controllers/runner'
import type { InitializeRoutes } from './routes'

const debug = Debug('cypress:server:routes-ct')

const serveChunk = (req, res, options) => {
  let { config } = options
  let pathToFile = getPathToDist('runner-ct', req.originalUrl.replace(config.clientRoute, ''))

  return send(req, pathToFile).pipe(res)
}

export const createRoutes = ({
  config,
  specsStore,
  nodeProxy,
  getCurrentBrowser,
  testingType,
  getSpec,
  getRemoteState,
}: InitializeRoutes) => {
  const routesCt = Router()

  // user app code + spec code
  // default mounted to /__cypress/src/*
  routesCt.get(`${config.devServerPublicPathRoute}*`, (req, res) => {
    // user the node proxy here instead of the network proxy
    // to avoid the user accidentally intercepting and modifying
    // their own app.js files + spec.js files
    nodeProxy.web(req, res, {}, (e) => {
      if (e) {
        // eslint-disable-next-line
        debug('Proxy request error. This is likely the socket hangup issue, we can basically ignore this because the stream will automatically continue once the asset will be available', e)
      }
    })
  })

  const clientRoute = config.clientRoute

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  routesCt.get(clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    runner.serve(req, res, 'runner-ct', {
      config,
      testingType,
      getSpec,
      getCurrentBrowser,
      getRemoteState,
      specsStore,
    })
  })

  // enables runner-ct to make a dynamic import
  routesCt.get([
    `${clientRoute}ctChunk-*`,
    `${clientRoute}vendors~ctChunk-*`,
  ], (req, res) => {
    debug('Serving Cypress front-end chunk by requested URL:', req.url)

    serveChunk(req, res, { config })
  })

  return routesCt
}
