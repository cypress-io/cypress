import httpProxy from 'http-proxy'
import Debug from 'debug'
import { ErrorRequestHandler, Request, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import type { FoundSpec } from '@packages/types'
import { getCtx } from '@packages/data-context'
import { graphQLHTTP } from '@packages/graphql/src/makeGraphQLServer'
import type { RemoteStates } from './remote_states'
import bodyParser from 'body-parser'
import path from 'path'
import AppData from './util/app_data'
import CacheBuster from './util/cache_buster'
import specController from './controllers/spec'
import reporter from './controllers/reporter'
import client from './controllers/client'
import files from './controllers/files'
import * as plugins from './plugins'
import { privilegedCommandsManager } from './privileged-commands/privileged-commands-manager'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  config: Cfg
  getSpec: () => FoundSpec | null
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  remoteStates: RemoteStates
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
}

export const createCommonRoutes = ({
  config,
  networkProxy,
  testingType,
  getSpec,
  remoteStates,
  nodeProxy,
  onError,
}: InitializeRoutes) => {
  const router = Router()
  const { clientRoute, namespace } = config

  router.get(`/${config.namespace}/tests`, (req, res, next) => {
    // slice out the cache buster
    const test = CacheBuster.strip(req.query.p)

    specController.handle(test, req, res, config, next, onError)
  })

  router.post(`/${config.namespace}/process-origin-callback`, bodyParser.json(), async (req, res) => {
    try {
      const { file, fn, projectRoot } = req.body

      debug('process origin callback: %s', fn)

      const contents = await plugins.execute('_process:cross:origin:callback', { file, fn, projectRoot })

      res.json({ contents })
    } catch (err) {
      const errorMessage = `Processing the origin callback errored:\n\n${err.stack}`

      debug(errorMessage)

      res.json({
        error: errorMessage,
      })
    }
  })

  router.get(`/${config.namespace}/socket.io.js`, (req, res) => {
    client.handle(req, res)
  })

  router.get(`/${config.namespace}/reporter/*`, (req, res) => {
    reporter.handle(req, res)
  })

  router.get(`/${config.namespace}/automation/getLocalStorage`, (req, res) => {
    res.sendFile(path.join(__dirname, './html/get-local-storage.html'))
  })

  router.get(`/${config.namespace}/automation/setLocalStorage`, (req, res) => {
    const origin = req.originalUrl.slice(req.originalUrl.indexOf('?') + 1)

    networkProxy.http.getRenderedHTMLOrigins()[origin] = true

    res.sendFile(path.join(__dirname, './html/set-local-storage.html'))
  })

  router.get(`/${config.namespace}/source-maps/:id.map`, (req, res) => {
    networkProxy.handleSourceMapRequest(req, res)
  })

  // special fallback - serve dist'd (bundled/static) files from the project path folder
  router.get(`/${config.namespace}/bundled/*`, (req, res) => {
    const file = AppData.getBundledFilePath(config.projectRoot, path.join('src', req.params[0]))

    debug(`Serving dist'd bundle at file path: %o`, { path: file, url: req.url })

    res.sendFile(file, { etag: false })
  })

  // TODO: The below route is not technically correct for cypress in cypress tests.
  // We should be using 'config.namespace' to provide the namespace instead of hard coding __cypress, however,
  // In the runner when we create the spec bridge we have no knowledge of the namespace used by the server so
  // we create a spec bridge for the namespace of the server specified in the config, but that server hasn't been created.
  // To fix this I think we need to find a way to listen in the cypress in cypress server for routes from the server the
  // cypress instance thinks should exist, but that's outside the current scope.
  router.get('/__cypress/spec-bridge-iframes', (req, res) => {
    debug('handling cross-origin iframe for domain: %s', req.hostname)

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // in the spec-bridge-iframe to allow setting document.domain to the bare domain
    // to guarantee the spec bridge can communicate with the injected code.
    // @see https://github.com/cypress-io/cypress/issues/25010
    res.setHeader('Origin-Agent-Cluster', '?0')

    files.handleCrossOriginIframe(req, res, config)
  })

  router.post(`/${config.namespace}/add-verified-command`, bodyParser.json(), (req, res) => {
    privilegedCommandsManager.addVerifiedCommand(req.body)

    res.sendStatus(204)
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

  router.use(`/${namespace}/graphql/*`, graphQLHTTP)

  router.get(`/${namespace}/runner/*`, (req, res) => {
    runner.handle(req, res)
  })

  router.all(`/${namespace}/xhrs/*`, (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  router.get(`/${namespace}/iframes/*`, (req, res) => {
    if (testingType === 'e2e') {
      iframesController.e2e({ config, getSpec, remoteStates }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  router.get(clientRoute, (req: Request & { proxiedUrl?: string }, res) => {
    const nonProxied = req.proxiedUrl?.startsWith('/') ?? false

    getCtx().actions.app.setBrowserUserAgent(req.headers['user-agent'])

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    getCtx().html.appHtml(nonProxied)
    .then((html) => res.send(html))
    .catch((e) => res.status(500).send({ stack: e.stack }))
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

  // user app code + spec code
  // default mounted to /__cypress/src/*
  // TODO: Remove this - only needed for Cy in Cy testing for unknown reasons.
  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    router.get(`${config.devServerPublicPathRoute}*`, (req, res) => {
      debug(`proxying to %s, originalUrl %s`, config.devServerPublicPathRoute, req.originalUrl)
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
  }

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
