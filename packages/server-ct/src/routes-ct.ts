import httpProxy from 'http-proxy'
import send from 'send'
import { Express, ErrorRequestHandler } from 'express'
import debugFn from 'debug'
import Project from './project-ct'
// const files = require('@packages/server/lib/controllers/files')
import runnerCt from '@packages/runner-ct'
import staticPkg from '@packages/static'

const debug = debugFn('cypress:server:routes')

interface InitializeRoutes {
  app: Express
  config: Record<string, any>
  project: Project
  onError: (...args: unknown[]) => any
}

export function initializeRoutes ({ app, config, project }: InitializeRoutes) {
  const proxy = httpProxy.createProxyServer()

  app.get('/__cypress/runner/*', (req, res) => {
    runnerCt.handle(req, res)
  })

  app.get('/__cypress/static/*', (req, res) => {
    const pathToFile = staticPkg.getPathToDist(req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  })

  app.get('/__cypress/iframes/*', (req, res) => {
    req.url = '/'
    proxy.web(req, res, { target: config.webpackDevServerUrl })
    // localhost:myPort/index.html
    // res.send(config.webpackDevServerUrl)
    // const extraOptions = {
    //   specFilter: _.get(project, 'spec.specFilter'),
    // }
    //
    // const getRemoteState = _.constant({ domainName: null })
    //
    // files.handleIframe(req, res, config, getRemoteState, extraOptions)
  })

  app.get(config.clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    runnerCt.serve(req, res, {
      config,
      project,
    })
  })

  app.all('*', (req, res) => {
    proxy.web(req, res, { target: config.webpackDevServerUrl })
    // proxy.web(req, res, { target: webpack, function(e) { ... });

    // const to = net.createConnection({
    //   host: config.
    //   port: config.webpackDevServerUrl
    // }
    // res.sendStatus(200)
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  const errorHandlingMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    res.sendStatus(500)
  }

  app.use(errorHandlingMiddleware)
}
