import Debug from 'debug'
import httpProxy from 'http-proxy'
import send from 'send'
import type { NetworkProxy } from '@packages/proxy'

import { handle, serve, makeServeConfig, serveChunk } from './runner-ct'
import xhrs from './controllers/xhrs'
import type { SpecsStore } from './specs-store'
import type { Cfg } from './project-base'
import { getPathToDist } from '@packages/resolve-dist'
import type { Browser } from './browsers/types'

import express, { ErrorRequestHandler, Express } from 'express'
import glob from 'glob'
import fs from 'fs'
import * as path from 'path'
import devServer from '@packages/server/lib/plugins/dev-server'

const debug = Debug('cypress:server:routes')

export interface InitializeRoutes {
  app: Express
  specsStore: SpecsStore
  config: Cfg
  getSpec: () => Cypress.Cypress['spec'] | null
  getCurrentBrowser: () => Browser
  nodeProxy: httpProxy
  networkProxy: NetworkProxy
  getRemoteState: () => any
  testingType: Cypress.TestingType
  onError: (...args: unknown[]) => any
}

export const createRoutes = ({
  app,
  config,
  specsStore,
  nodeProxy,
  networkProxy,
  getCurrentBrowser,
}: InitializeRoutes) => {
  // If development
  const myProxy = httpProxy.createProxyServer({
    target: 'http://localhost:3333/',
  })

  // TODO If prod, serve the build app files from app/dist

  app.get('/__/api', (req, res) => {
    const options = makeServeConfig({
      config,
      getCurrentBrowser,
      specsStore,
    })

    res.json(options)
  })

  app.get('/__/getStories', (req, res) => {
    const { projectRoot } = req.query
    const globPattern = '**/*.stories.{ts,js,tsx,jsx}'

    glob(
      globPattern,
      {
        cwd: projectRoot as string,
        ignore: ['node_modules/**/*'],
      },
      (err, files) => {
        if (err) {
          // TODO: handle glob error
        }

        debug(`Found stories: ${files.join('\n')}`)
        const normalized = files.map((file) => {
          return {
            absolute: path.join(projectRoot as string, file),
            relative: file,
            name: path.basename(file),
            specType: 'component-preview',
          }
        })

        devServer.updatePreviews(normalized)
        res.json({ files: normalized, globPattern })
      },
    )
  })

  app.post('/__/createSpecFromStory', express.json(), (req, res) => {
    const { spec, absolute } = req.body

    debug(`Writing file ${absolute} with content: ${spec}`)
    fs.writeFileSync(absolute, spec)

    return res.json({ hello: 'world' })
  })

  // TODO: can namespace this onto a "unified" route like __app-unified__
  // make sure to update the generated routes inside of vite.config.ts
  app.get('/__vite__/*', (req, res) => {
    myProxy.web(req, res, {}, (e) => {
    })
  })

  app.get('/__cypress/runner/*', handle)

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
