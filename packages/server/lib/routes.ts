import httpProxy from 'http-proxy'
import _ from 'lodash'
import Debug from 'debug'
import { ErrorRequestHandler, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

import type { Browser } from './browsers/types'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner, ServeOptions } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import type { FoundSpec } from '@packages/types'
import { getCtx } from '@packages/data-context'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  config: Cfg
  getSpec: () => FoundSpec | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  getRemoteState: () => Cypress.RemoteState
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
  exit?: boolean
}

export const createCommonRoutes = ({
  config,
  networkProxy,
  testingType,
  getSpec,
  getCurrentBrowser,
  getRemoteState,
  nodeProxy,
  exit,
}: InitializeRoutes) => {
  const makeServeConfig = (options: Partial<ServeOptions>) => {
    const config = {
      ...options.config,
      testingType,
      browser: options.getCurrentBrowser?.(),
    } as Cfg

    if (testingType === 'e2e') {
      config.remote = getRemoteState()
    }

    // TODO: move the component file watchers in here
    // and update them in memory when they change and serve
    // them straight to the HTML on load

    debug('serving runner index.html with config %o',
      _.pick(config, 'version', 'platform', 'arch', 'projectName'))

    // base64 before embedding so user-supplied contents can't break out of <script>
    // https://github.com/cypress-io/cypress/issues/4952

    const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

    return {
      base64Config,
      projectName: config.projectName,
    }
  }

  const router = Router()

  router.get(['/api', '/__/api'], (req, res) => {
    const options = makeServeConfig({
      config,
      getCurrentBrowser,
    })

    res.json(options)
  })

  if (process.env.CYPRESS_INTERNAL_VITE_DEV) {
    const proxy = httpProxy.createProxyServer({
      target: `http://localhost:${process.env.CYPRESS_INTERNAL_VITE_APP_PORT}/`,
    })

    router.get('/__cypress/assets/*', (req, res) => {
      proxy.web(req, res, {}, (e) => {})
    })
  } else {
    router.get('/__cypress/assets/*', (req, res) => {
      const pathToFile = getPathToDist('app', req.params[0])

      return send(req, pathToFile).pipe(res)
    })
  }

  router.get('/__cypress/runner/*', (req, res) => {
    runner.handle(testingType, req, res)
  })

  router.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  router.get('/__cypress/iframes/*', (req, res) => {
    if (testingType === 'e2e') {
      iframesController.e2e({ config, getSpec, getRemoteState }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  const clientRoute = config.clientRoute

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  router.get(clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    if (process.env.LAUNCHPAD) {
      getCtx().html.appHtml()
      .then((html) => res.send(html))
      .catch((e) => res.status(500).send({ stack: e.stack }))
    } else {
      runner.serve(req, res, testingType === 'e2e' ? 'runner' : 'runner-ct', {
        config,
        testingType,
        getSpec,
        getCurrentBrowser,
        getRemoteState,
        exit,
      })
    }
  })

  // serve static assets from the dist'd Vite app
  router.get([
    `${clientRoute}assets/*`,
    `${clientRoute}shiki/*`,
  ], (req, res) => {
    debug('proxying static assets %s, params[0] %s', req.url, req.params[0])
    const pathToFile = getPathToDist('app', 'assets', req.params[0])

    return send(req, pathToFile).pipe(res)
  })

  router.all('*', (req, res) => {
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

  router.use(errorHandlingMiddleware)

  return router
}
