import Debug from 'debug'
import httpProxy from 'http-proxy'
import { makeServeConfig } from './runner-ct'
import { Request, Response, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import type { InitializeRoutes } from './routes'

const debug = Debug('cypress:server:routes-ct')

const serveChunk = (req: Request, res: Response, clientRoute: string) => {
  let pathToFile = getPathToDist('runner-ct', req.originalUrl.replace(clientRoute, ''))

  return send(req, pathToFile).pipe(res)
}

export const createRoutesCT = ({
  config,
  nodeProxy,
  getCurrentBrowser,
  specsStore,
}: InitializeRoutes) => {
  const routesCt = Router()

  if (process.env.CYPRESS_INTERNAL_VITE_APP_PORT) {
    const myProxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })

    // TODO: can namespace this onto a "unified" route like __app-unified__
    // make sure to update the generated routes inside of vite.config.ts
    routesCt.get('/__vite__/*', (req, res) => {
      myProxy.web(req, res, {}, (e) => {
      })
    })
  } else {
    routesCt.get('/__vite__/*', (req, res) => {
      const pathToFile = getPathToDist('app', req.params[0])

      return send(req, pathToFile).pipe(res)
    })
  }

  // TODO If prod, serve the build app files from app/dist

  routesCt.get('/api', (req, res) => {
    const options = makeServeConfig({
      config,
      getCurrentBrowser,
      specsStore,
    })

    res.json(options)
  })

  routesCt.get('/__/api', (req, res) => {
    const options = makeServeConfig({
      config,
      getCurrentBrowser,
      specsStore,
    })

    res.json(options)
  })

  routesCt.get('/__cypress/static/*', (req, res) => {
    const pathToFile = getPathToDist('static', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  })

  routesCt.get('/__cypress/iframes/*', (req, res) => {
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
