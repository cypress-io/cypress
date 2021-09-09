import Debug from 'debug'
import type { ErrorRequestHandler } from 'express'
import send from 'send'
import xhrs from './controllers/xhrs'
import { getPathToDist } from '@packages/resolve-dist'
import { runner } from './controllers/runner'
import { staticCtrl } from './controllers/static'
import type { InitializeRoutes } from './routes'
import { iframesController } from './controllers/iframes'

const debug = Debug('cypress:server:routes-ct')

const serveChunk = (req, res, options) => {
  let { config } = options
  let pathToFile = getPathToDist('runner-ct', req.originalUrl.replace(config.clientRoute, ''))

  return send(req, pathToFile).pipe(res)
}

export const createRoutes = ({
  app,
  config,
  specsStore,
  nodeProxy,
  networkProxy,
  getCurrentBrowser,
  testingType,
  getSpec,
  getRemoteState,
}: InitializeRoutes) => {
  app.get('/__cypress/runner/*', (req, res) => runner.handle(testingType, req, res))

  app.get('/__cypress/static/*', (req, res) => {
    staticCtrl.handle(req, res)
  })

  app.get('/__cypress/iframes/*', (req, res) => {
    iframesController.component({ config, nodeProxy }, req, res)
  })

  // user app code + spec code
  // default mounted to /__cypress/src/*
  app.get(`${config.devServerPublicPathRoute}*`, (req, res) => {
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

  app.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  app.get(clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    runner.serve(req, res, 'runner-ct', {
      config,
      testingType,
      getSpec,
      getCurrentBrowser,
      getRemoteState,
      specsStore,
    })

    // serve(req, res, {
    //   config,
    //   getCurrentBrowser,
    //   specsStore,
    // })
  })

  // enables runner-ct to make a dynamic import
  app.get(`${clientRoute}ctChunk-*`, (req, res) => {
    debug('Serving Cypress front-end chunk by requested URL:', req.url)

    serveChunk(req, res, { config })
  })

  app.get(`${clientRoute}vendors~ctChunk-*`, (req, res) => {
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
