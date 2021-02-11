import Debug from 'debug'
import { ErrorRequestHandler, Express } from 'express'
import httpProxy from 'http-proxy'
import send from 'send'
import { NetworkProxy } from '@packages/proxy'
import { handle, serve, serveChunk } from '@packages/runner-ct'
import xhrs from '@packages/server/lib/controllers/xhrs'
import staticPkg from '@packages/static'
import { ProjectCt } from './project-ct'
import { SpecsStore } from './specs-store'

const debug = Debug('cypress:server:routes')

interface InitializeRoutes {
  app: Express
  specsStore: SpecsStore
  config: Record<string, any>
  project: ProjectCt
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  onError: (...args: unknown[]) => any
}

export const createRoutes = ({
  app,
  config,
  specsStore,
  nodeProxy,
  networkProxy,
  project,
}: InitializeRoutes) => {
  app.get('/__cypress/runner/*', handle)

  app.get('/__cypress/static/*', (req, res) => {
    const pathToFile = staticPkg.getPathToDist(req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  })

  app.get('/__cypress/iframes/*', (req, res) => {
    // always proxy to the index.html file
    // attach header data for webservers
    // to properly intercept and serve assets from the correct src root
    // TODO: define a contract for dev-server plugins to configure this behavior
    req.headers.__cypress_spec_path = req.params[0]
    req.url = '/index.html'

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
  app.get(`${config.webpackDevServerPublicPathRoute}*`, (req, res) => {
    // strip out the webpackDevServerPublicPath from the URL
    // and forward the remaining params
    req.url = `/${req.params[0]}`

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

  app.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  app.get(config.clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    serve(req, res, {
      config,
      project,
      specsStore,
    })
  })

  // enables runner-ct to make a dynamic import
  app.get(`${config.clientRoute}ctChunk-*`, (req, res) => {
    debug('Serving Cypress front-end chunk by requested URL:', req.url)

    serveChunk(req, res, { config })
  })

  app.get(`${config.clientRoute}vendors~ctChunk-*`, (req, res) => {
    debug('Serving Cypress front-end vendor chunk by requested URL:', req.url)

    serveChunk(req, res, { config })
  })

  app.all('*', (req, res) => {
    networkProxy.handleHttpRequest(req, res)
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  const errorHandlingMiddleware: ErrorRequestHandler = (err, req, res) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    res.sendStatus(500)
  }

  app.use(errorHandlingMiddleware)
}
