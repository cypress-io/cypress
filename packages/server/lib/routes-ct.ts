import Debug from 'debug'
import httpProxy from 'http-proxy'
import { makeServeConfig } from './runner-ct'
import { Request, Response, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import type { InitializeRoutes } from './routes'
import { fs } from './util/fs'

const debug = Debug('cypress:server:routes-ct')

const serveChunk = (req: Request, res: Response, clientRoute: string) => {
  let pathToFile = getPathToDist('runner-ct', req.originalUrl.replace(clientRoute, ''))

  return send(req, pathToFile).pipe(res)
}

export const createRoutesCT = ({
  ctx,
  config,
  nodeProxy,
  getCurrentBrowser,
  specsStore,
}: InitializeRoutes) => {
  const routesCt = Router()

  if (process.env.CYPRESS_INTERNAL_VITE_APP_PORT) {
    const proxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })
    const proxyIndex = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
      selfHandleResponse: true,
    })

    proxyIndex.on('proxyRes', function (proxyRes, _req, _res) {
      if ((_req as Request).params[0] === '') {
        const body: any[] = []

        proxyRes.on('data', function (chunk) {
          let chunkData = String(chunk)

          if (chunkData.includes('<head>')) {
            chunkData = chunkData.replace('<body>', `<body><script>window.__CYPRESS_GRAPHQL_PORT = ${JSON.stringify(ctx.gqlServerPort)};</script>\n`)
          }

          body.push(chunkData)
        })

        proxyRes.on('end', function () {
          (_res as Response).send(body.join(''))
        })
      } else {
        proxyRes.pipe(_res)
      }
    })

    // TODO: can namespace this onto a "unified" route like __app-unified__
    // make sure to update the generated routes inside of vite.config.ts
    routesCt.get('/__vite__/*', (req, res) => {
      if (req.params[0] === '') {
        proxyIndex.web(req, res, {}, (e) => {})
      } else {
        proxy.web(req, res, {}, (e) => {})
      }
    })
  } else {
    routesCt.get('/__vite__/*', (req, res) => {
      const pathToFile = getPathToDist('app', req.params[0])

      if (req.params[0] === '') {
        return fs.readFile(pathToFile, 'utf8')
        .then((file) => {
          res.send(file.replace('<div id="app">', '<script>window.__CYPRESS_GRAPHQL_PORT = 1234</script><div id="app">'))
        })
      }

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
