import path from 'path'
import la from 'lazy-ass'
import check from 'check-more-types'
import _ from 'lodash'
import Debug from 'debug'

import { InitializeRoutes } from '@packages/server-ct/src/routes-ct'
import AppData from './util/app_data'
import CacheBuster from './util/cache_buster'
import spec from './controllers/spec'
import reporter from './controllers/reporter'
import runner from './controllers/runner'
import xhrs from './controllers/xhrs'
import client from './controllers/client'
import files from './controllers/files'
import staticCtrl from './controllers/static'

const debug = Debug('cypress:server:routes')

export default ({
  app,
  config,
  getRemoteState,
  networkProxy,
  project,
  onError,
}: InitializeRoutes & { getRemoteState: () => any }) => {
  // routing for the actual specs which are processed automatically
  // this could be just a regular .js file or a .coffee file
  app.get('/__cypress/tests', (req, res, next) => {
    // slice out the cache buster
    const test = CacheBuster.strip(req.query.p)

    spec.handle(test, req, res, config, next, onError)
  })

  app.get('/__cypress/socket.io.js', (req, res) => {
    client.handle(req, res)
  })

  app.get('/__cypress/reporter/*', (req, res) => {
    reporter.handle(req, res)
  })

  app.get('/__cypress/runner/*', (req, res) => {
    runner.handle(req, res)
  })

  app.get('/__cypress/static/*', (req, res) => {
    staticCtrl.handle(req, res)
  })

  // routing for /files JSON endpoint
  app.get('/__cypress/files', (req, res) => {
    files.handleFiles(req, res, config)
  })

  // routing for the dynamic iframe html
  app.get('/__cypress/iframes/*', (req, res) => {
    const extraOptions = {
      specFilter: _.get(project, 'spec.specFilter'),
      specType: _.get(project, 'spec.specType', 'integration'),
    }

    debug('project %o', project)
    debug('handling iframe for project spec %o', {
      spec: project.spec,
      extraOptions,
    })

    files.handleIframe(req, res, config, getRemoteState, extraOptions)
  })

  app.all('/__cypress/xhrs/*', (req, res, next) => {
    xhrs.handle(req, res, config, next)
  })

  app.get('/__cypress/source-maps/:id.map', (req, res) => {
    networkProxy.handleSourceMapRequest(req, res)
  })

  // special fallback - serve local files from the project's root folder
  app.get('/__root/*', (req, res) => {
    const file = path.join(config.projectRoot, req.params[0])

    res.sendFile(file, { etag: false })
  })

  // special fallback - serve dist'd (bundled/static) files from the project path folder
  app.get('/__cypress/bundled/*', (req, res) => {
    const file = AppData.getBundledFilePath(config.projectRoot, path.join('src', req.params[0]))

    debug(`Serving dist'd bundle at file path: %o`, { path: file, url: req.url })

    res.sendFile(file, { etag: false })
  })

  la(check.unemptyString(config.clientRoute), 'missing client route in config', config)

  app.get(config.clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    runner.serve(req, res, {
      config,
      project,
      getRemoteState,
    })
  })

  app.all('*', (req, res) => {
    networkProxy.handleHttpRequest(req, res)
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  app.use((err, req, res) => {
    // TODO: Figure out if types are wrong, or if this code is wrong
    // and we just have no tests around it.

    // @ts-ignore
    console.log(err.stack) // eslint-disable-line no-console

    // @ts-ignore
    res.set('x-cypress-error', err.message)
    // @ts-ignore
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    // @ts-ignore
    res.sendStatus(500)
  })
}
