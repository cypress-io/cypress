import _ from 'lodash'
import Debug from 'debug'
import type { ErrorRequestHandler } from 'express'
import send from 'send'
import xhrs from '@packages/server/lib/controllers/xhrs'
import type { SpecsStore } from '@packages/server/lib/specs-store'
import type { Cfg } from '@packages/server/lib/project-base'
import { getPathToDist, getPathToIndex } from '@packages/resolve-dist'
import type { Browser } from '@packages/server/lib/browsers/types'
import { runner } from './controllers/runner'
import type { InitializeRoutes } from './routes'

const debug = Debug('cypress:server:routes-ct')

interface ServeOptions {
  config: Cfg
  getCurrentBrowser: () => Browser
  specsStore: SpecsStore
}

export const serve = (req, res, options: ServeOptions) => {
  const config = {
    ...options.config,
    browser: options.getCurrentBrowser(),
    specs: options.specsStore.specFiles,
  } as Cfg

  // TODO: move the component file watchers in here
  // and update them in memory when they change and serve
  // them straight to the HTML on load

  debug('serving runner index.html with config %o',
    _.pick(config, 'version', 'platform', 'arch', 'projectName'))

  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952
  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || getPathToIndex('runner-ct')

  return res.render(runnerPath, {
    base64Config,
    projectName: config.projectName,
  })
}

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
  getSpec,
  testingType,
}: InitializeRoutes) => {
  app.get('/__cypress/runner/*', (req, res) => runner.handle(testingType, req, res))

  app.get('/__cypress/static/*', (req, res) => {
    const pathToFile = getPathToDist('static', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  })

  app.get('/__cypress/iframes/*', (req, res) => {
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

    serve(req, res, {
      config,
      getCurrentBrowser,
      specsStore,
    })
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
