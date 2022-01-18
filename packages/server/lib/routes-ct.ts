import Debug from 'debug'
import { Request, Response, Router } from 'express'
import type { InitializeRoutes } from './routes'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

const debug = Debug('cypress:server:routes-ct')

const serveChunk = (req: Request, res: Response, clientRoute: string) => {
  let pathToFile = getPathToDist('runner-ct', req.originalUrl.replace(clientRoute, ''))

  return send(req, pathToFile).pipe(res)
}

export const createRoutesCT = ({
  config,
  nodeProxy,
}: InitializeRoutes) => {
  const routesCt = Router()

  routesCt.get(`/${config.namespace}/static/*`, (req, res) => {
    const pathToFile = getPathToDist('static', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  })

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

  // enables runner-ct to make a dynamic import
  routesCt.get([
    `${clientRoute}ctChunk-*`,
    `${clientRoute}vendors~ctChunk-*`,
  ], (req, res) => {
    debug('Serving Cypress front-end chunk by requested URL:', req.url)

    serveChunk(req, res, clientRoute)
  })

  return routesCt
}
