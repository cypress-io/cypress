import httpProxy from 'http-proxy'
import Debug from 'debug'
import { ErrorRequestHandler, Request, Router } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'
import { domainPropsToHostname, toFileServerUrl } from '@packages/network-tools'
import type { NetworkProxy } from '@packages/proxy'
import type { Cfg } from './project-base'
import xhrs from './controllers/xhrs'
import { runner } from './controllers/runner'
import { iframesController } from './controllers/iframes'
import type { FoundSpec } from '@packages/types'
import { getCtx } from '@packages/data-context'
import { graphQLHTTP } from '@packages/data-context/graphql/makeGraphQLServer'
import type { RemoteStates } from '@packages/network-tools'
import bodyParser from 'body-parser'
import path from 'path'
import * as AppData from './util/app_data'
import { strip as cacheBusterStrip } from './util/cache_buster'
import specController from './controllers/spec'
import client from './controllers/client'
import files from './controllers/files'
import * as plugins from './plugins'
import { privilegedCommandsManager } from './privileged-commands/privileged-commands-manager'
import { cypressSessions } from './cypress-sessions'
import { SESSIONS_ROUTE_PREFIX } from '@packages/cypress-sessions'
import { CYPRESS_CY_PROMPT_ROUTE, CYPRESS_STUDIO_ROUTE, isTrustedInternalLoopback, resolveProxyUrlBase } from './adapters/internal-routes'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  config: Cfg
  getSpec: () => FoundSpec | null
  nodeProxy: httpProxy
  /**
   * Read per request, never captured: the CDP Fetch runtime installs a new
   * NetworkProxy at every launch, and the network path can flip on this same
   * router when the browser is switched in open mode.
   */
  getNetworkProxy: () => NetworkProxy
  remoteStates: RemoteStates
  isBrowserNetworkMode: () => boolean
  onError: (...args: unknown[]) => any
  testingType: Cypress.TestingType
}

export const createCommonRoutes = ({
  config,
  getNetworkProxy,
  isBrowserNetworkMode,
  testingType,
  getSpec,
  remoteStates,
  nodeProxy,
  onError,
}: InitializeRoutes) => {
  const router = Router()
  const { clientRoute, namespace } = config

  // When a test visits an http:// site and we load our main app page,
  // (e.g. test has cy.visit('http://example.com'), we load http://example.com/__/)
  // Chrome will make a request to the the https:// version (i.e. https://example.com/__/)
  // to check if it's valid. If it is valid, it will load the https:// version
  // instead. This leads to an infinite loop of Cypress trying to load
  // the http:// version because that's what the test wants and Chrome
  // loading the https:// version. Then since it doesn't match what the test
  // is visiting, Cypress attempts to the load the http:// version and the loop
  // continues.
  // See https://blog.chromium.org/2023/08/towards-https-by-default.html for
  // more info about Chrome's automatic https upgrades.
  //
  // The fix for Cypress is to signal to Chrome that the https:// version is
  // not valid by replying with a 301 redirect when we detect that it's
  // an https upgrade, which is when an https:// request comes through
  // one of your own proxied routes, but the the primary domain (a.k.a remote state)
  // is the http:// version of that domain
  //
  // https://github.com/cypress-io/cypress/issues/25891
  // @ts-expect-error - TS doesn't like the Request intersection
  router.use('/', (req: Request & { proxiedUrl: string }, res, next) => {
    if (
      // only these paths will receive the relevant https upgrade check
      (req.path !== '/' && req.path !== clientRoute)
      // not an https upgrade request if not https protocol
      || req.protocol !== 'https'
      // primary has not been established by a cy.visit() yet
      || !remoteStates.hasPrimary()
    ) {
      return next()
    }

    const primary = remoteStates.getPrimary()

    // props can be null in certain circumstances even if the primary is established
    if (!primary.props) {
      return next()
    }

    const primaryHostname = domainPropsToHostname(primary.props)

    // domain matches (example.com === example.com), but incoming request is
    // https:// (established above), while the domain the user is trying to
    // visit (a.k.a primary origin) is http://
    if (
      primaryHostname === req.hostname
      && primary.origin.startsWith('http:')
    ) {
      res.status(301).redirect(req.proxiedUrl.replace('https://', 'http://'))

      return
    }

    next()
  })

  // If we are in cypress in cypress we need to pass along the studio and cy-prompt routes
  // to the child project. We also add a utility route for testing HTTP status code UI
  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT) {
    router.all(`${CYPRESS_STUDIO_ROUTE}*`, async (req, res) => {
      await getNetworkProxy().handleHttpRequest(req, res)
    })

    router.all(`${CYPRESS_CY_PROMPT_ROUTE}*`, async (req, res) => {
      await getNetworkProxy().handleHttpRequest(req, res)
    })

    router.get('/status-code-test/:num', (req, res) => {
      res.sendStatus(Number(req.params.num))
    })
  } else {
    // express matches routes in order. since this callback executes after the
    // router has already been defined, we need to create a new router to use
    // for the studio and cy-prompt routes
    const studioRouter = Router()

    router.use('/', studioRouter)
    getCtx().coreData.studioLifecycleManager?.registerStudioReadyListener((studio) => {
      studio.initializeRoutes(studioRouter)
    })

    const cyPromptRouter = Router()

    router.use('/', cyPromptRouter)
    getCtx().coreData.cyPromptLifecycleManager?.registerCyPromptReadyListener((cyPrompt) => {
      cyPrompt.initializeRoutes(cyPromptRouter)
    })
  }

  router.get(`/${config.namespace}/tests`, (req, res, next) => {
    // slice out the cache buster
    const test = cacheBusterStrip(req.query.p as string)

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

  router.get(`/${config.namespace}/automation/getLocalStorage`, (req, res) => {
    res.sendFile(path.join(__dirname, './html/get-local-storage.html'))
  })

  router.get(`/${config.namespace}/automation/setLocalStorage`, (req, res) => {
    const origin = req.originalUrl.slice(req.originalUrl.indexOf('?') + 1)

    getNetworkProxy().http.getRenderedHTMLOrigins()[origin] = true

    res.sendFile(path.join(__dirname, './html/set-local-storage.html'))
  })

  // special fallback - serve dist'd (bundled/static) files from the project path folder
  router.get(`/${config.namespace}/bundled/*`, (req, res) => {
    const file = AppData.getBundledFilePath(config.projectRoot, path.join('src', req.params[0]))

    debug(`Serving dist'd bundle at file path: %o`, { path: file, url: req.url })

    res.sendFile(file, { etag: false })
  })

  router.get(`/${config.namespace}/spec-bridge-iframes`, async (req, res) => {
    debug('handling cross-origin iframe for domain: %s', req.hostname)

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // in the spec-bridge-iframe to allow setting document.domain to the bare domain
    // to guarantee the spec bridge can communicate with the injected code.
    // @see https://github.com/cypress-io/cypress/issues/25010
    res.setHeader('Origin-Agent-Cluster', '?0')

    await files.handleCrossOriginIframe(req, res, config)
  })

  router.post(`/${config.namespace}/add-verified-command`, bodyParser.json(), (req, res) => {
    privilegedCommandsManager.addVerifiedCommand(req.body)

    res.sendStatus(204)
  })

  // Cypress sessions only apply to an interactive (`cypress open`) session that an
  // external tool can attach to; the record is only written in open mode, so don't
  // expose the probe route for headless `cypress run`.
  if (!config.isTextTerminal) {
    router.get(`${SESSIONS_ROUTE_PREFIX}:sessionId`, async (req, res) => {
      const state = cypressSessions.getCurrent()

      if (!state || req.params.sessionId !== state.sessionId) {
        return res.sendStatus(404)
      }

      // Identity is read at probe time rather than stored on the state: the
      // logged-in user can change over the session's lifetime.
      const ctx = getCtx()

      return res.json({
        ...state,
        machineId: await ctx.coreData.machineId.catch(() => null),
        userId: ctx.coreData.user?.id ?? null,
      })
    })
  }

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

  router.get(`/${namespace}/iframes/*`, async (req, res) => {
    if (testingType === 'e2e') {
      await iframesController.e2e({ config, getSpec, remoteStates }, req, res)
    }

    if (testingType === 'component') {
      iframesController.component({ config, nodeProxy }, req, res)
    }
  })

  if (!clientRoute) {
    throw Error(`clientRoute is required. Received ${clientRoute}`)
  }

  router.get(clientRoute, (req: Request & { proxiedUrl?: string }, res) => {
    // Path-only clientRoute hits are expected when CDP Fetch replaces the
    // MITM proxy; only treat them as "not launched through Cypress" when the
    // HTTP proxy is supposed to be in use.
    const nonProxied = !isBrowserNetworkMode() && (req.proxiedUrl?.startsWith('/') ?? false)

    getCtx().actions.app.setBrowserUserAgent(req.headers['user-agent'])

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    res.setHeader('Origin-Agent-Cluster', '?0')

    getCtx().html.appHtml(nonProxied, isBrowserNetworkMode())
    .then((html) => res.send(html))
    .catch((e) => res.status(500).send({ stack: e.stack }))
  })

  // serve static assets from the dist'd Vite app
  router.get([
    `${clientRoute}assets/*`,
    `${clientRoute}fonts/*`,
    `${clientRoute}shiki/*`,
  ], (req, res) => {
    debug('proxying static assets %s, params[0] %s', req.url, req.params[0])
    const pathToFile = getPathToDist('app', req.path.slice(clientRoute.length))

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
          debug('Proxy request error. This is likely the socket hangup issue, we can basically ignore this because the stream will automatically continue once the asset will be available', e)
        }
      })
    })
  }

  // One catch-all route serving both network paths:
  //  - the MITM proxy, where every browser request reaches this Express server
  //  - the native browser network, where the browser intercepts its own traffic
  //    and only the requests Cypress owns reach this Express server
  //
  // It branches per request rather than mounting one handler per path because
  // the path is not known when this router is built — that happens at server
  // open, before we know whether the launch is Chrome on the browser network or
  // Firefox on the proxy, and open mode can switch browsers afterwards against
  // this same router. Mounting both would not work either: the MITM branch
  // never calls next(), so mount order would decide the behavior permanently.
  router.all('*', async (req: Request & { proxiedUrl?: string }, res, next) => {
    const proxy = getNetworkProxy()

    // MITM path: every browser request arrives here in absolute form, so the
    // pipeline owns all of it.
    if (!isBrowserNetworkMode()) {
      await proxy.handleHttpRequest(req, res)

      return
    }

    // native browser (CDP) path: the Cypress origin only serves the traffic it owns, which
    // reaches this router three ways:
    //  - `strategy:file` requests the CDP transport deliberately redirects here. For example, a relative
    //    `cy.visit('index.html')` and the assets that page pulls in, served off disk from the project root.
    //  - `resolve:url` pre-flights this server forces through itself. For example, a `cy.visit()` whose URL
    //    matches a `cy.intercept()` route, so net-stubbing gets a chance to reply.
    //  - requests that never produce a Fetch pause at all (service-worker scripts come from the SW target).
    // Anything else falls through: handing an arbitrary URL to the pipeline would send it back out to our own origin and loop.

    // A loopback token means we steered this request here ourselves, rather
    // than the browser. This means it is either:
    //   - an intercept-matched cy.visit() pre-flight that _onResolveUrl forced through this server, or
    //   - a strategy:file request the CDP transport redirected to our origin.
    // setProxiedUrl has already restored the URL that was actually asked
    // for, so hand it to the pipeline as-is. The fallback below rebuilds the
    // URL from the Host header, which here would replace the real target and
    // hide it from net-stubbing and the file-server rewrite.
    if (isTrustedInternalLoopback(req.headers) && req.proxiedUrl && /^https?:\/\//.test(req.proxiedUrl)) {
      debug('serving loopback-token request through the pipeline: %s %s', req.method, req.proxiedUrl)

      await proxy.handleHttpRequest(req, res)

      return
    }

    // Un-tokened direct traffic — nothing steered it here, it addressed us:
    //   - service-worker scripts
    //   - other requests that never produce a Fetch pause
    // Resolve against the Host header, since the request may address us under
    // an aliased name, and let the toFileServerUrl origin comparison decide:
    // a forged Host grants nothing a caller could not get by using the right name.
    const base = req.headers.host ? `${req.protocol}://${req.headers.host}` : resolveProxyUrlBase(config)
    const absoluteUrl = new URL(req.url, base).href

    if (toFileServerUrl(absoluteUrl, remoteStates.current())) {
      debug('serving direct file server request through the pipeline: %s %s', req.method, absoluteUrl)

      req.proxiedUrl = absoluteUrl
      await proxy.handleHttpRequest(req, res)

      return
    }

    debug('falling through, not a file server url: %s %s', req.method, absoluteUrl)

    return next()
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  // Express dispatches error middleware by arity — the unused `next` keeps
  // this from running as a regular handler on every unmatched request.
  const errorHandlingMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    res.sendStatus(500)
  }

  router.use(errorHandlingMiddleware)

  return router
}
