import fs from 'fs-extra'
import path from 'path'
import Debug from 'debug'
import { Router } from 'express'

import AppData from './util/app_data'
import CacheBuster from './util/cache_buster'
import specController from './controllers/spec'
import reporter from './controllers/reporter'
import client from './controllers/client'
import files from './controllers/files'
import type { InitializeRoutes } from './routes'

const debug = Debug('cypress:server:routes-e2e')

export const createRoutesE2E = ({
  config,
  networkProxy,
  onError,
}: InitializeRoutes) => {
  const routesE2E = Router()

  // routing for the actual specs which are processed automatically
  // this could be just a regular .js file or a .coffee file
  routesE2E.get(`/${config.namespace}/tests`, (req, res, next) => {
    // slice out the cache buster
    const test = CacheBuster.strip(req.query.p)

    specController.handle(test, req, res, config, next, onError)
  })

  routesE2E.get(`/${config.namespace}/get-file/:filePath`, async (req, res) => {
    const { filePath } = req.params

    debug('get file: %s', filePath)

    try {
      const contents = await fs.readFile(filePath)

      res.json({ contents: contents.toString() })
    } catch (err) {
      const errorMessage = `Getting the file at the following path errored:\nPath: ${filePath}\nError: ${err.stack}`

      debug(errorMessage)

      res.json({
        error: errorMessage,
      })
    }
  })

  routesE2E.get(`/${config.namespace}/socket.io.js`, (req, res) => {
    client.handle(req, res)
  })

  routesE2E.get(`/${config.namespace}/reporter/*`, (req, res) => {
    reporter.handle(req, res)
  })

  routesE2E.get(`/${config.namespace}/automation/getLocalStorage`, (req, res) => {
    res.sendFile(path.join(__dirname, './html/get-local-storage.html'))
  })

  routesE2E.get(`/${config.namespace}/automation/setLocalStorage`, (req, res) => {
    const origin = req.originalUrl.slice(req.originalUrl.indexOf('?') + 1)

    networkProxy.http.getRenderedHTMLOrigins()[origin] = true

    res.sendFile(path.join(__dirname, './html/set-local-storage.html'))
  })

  routesE2E.get(`/${config.namespace}/source-maps/:id.map`, (req, res) => {
    networkProxy.handleSourceMapRequest(req, res)
  })

  // special fallback - serve local files from the project's root folder
  routesE2E.get('/__root/*', (req, res) => {
    const file = path.join(config.projectRoot, req.params[0])

    res.sendFile(file, { etag: false })
  })

  // special fallback - serve dist'd (bundled/static) files from the project path folder
  routesE2E.get(`/${config.namespace}/bundled/*`, (req, res) => {
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
  routesE2E.get('/__cypress/spec-bridge-iframes', (req, res) => {
    debug('handling cross-origin iframe for domain: %s', req.hostname)

    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // in the spec-bridge-iframe to allow setting document.domain to the bare domain
    // to guarantee the spec bridge can communicate with the injected code.
    // @see https://github.com/cypress-io/cypress/issues/25010
    res.setHeader('Origin-Agent-Cluster', '?0')

    files.handleCrossOriginIframe(req, res, config.namespace)
  })

  return routesE2E
}
