const path = require('path')
const la = require('lazy-ass')
const check = require('check-more-types')
const debug = require('debug')('cypress:server:routes')

const CacheBuster = require('./util/cache_buster')
const spec = require('./controllers/spec')
const reporter = require('./controllers/reporter')
const runner = require('./controllers/runner')
const xhrs = require('./controllers/xhrs')
const client = require('./controllers/client')
const files = require('./controllers/files')
const staticCtrl = require('./controllers/static')

module.exports = function (app, config, request, getRemoteState, getDeferredResponse, project, networkProxy) {
  // routing for the actual specs which are processed automatically
  // this could be just a regular .js file or a .coffee file
  app.get('/__cypress/tests', (req, res, next) => {
    // slice out the cache buster
    const test = CacheBuster.strip(req.query.p)

    return spec.handle(test, req, res, config, next, project)
  })

  app.get('/__cypress/socket.io.js', (req, res) => {
    return client.handle(req, res)
  })

  app.get('/__cypress/reporter/*', (req, res) => {
    return reporter.handle(req, res)
  })

  app.get('/__cypress/runner/*', (req, res) => {
    return runner.handle(req, res)
  })

  app.get('/__cypress/static/*', (req, res) => {
    return staticCtrl.handle(req, res)
  })

  // routing for /files JSON endpoint
  app.get('/__cypress/files', (req, res) => {
    return files.handleFiles(req, res, config)
  })

  // routing for the dynamic iframe html
  app.get('/__cypress/iframes/*', (req, res) => {
    return files.handleIframe(req, res, config, getRemoteState)
  })

  app.all('/__cypress/xhrs/*', (req, res, next) => {
    return xhrs.handle(req, res, getDeferredResponse, config, next)
  })

  app.get('/__root/*', (req, res) => {
    const file = path.join(config.projectRoot, req.params[0])

    return res.sendFile(file, { etag: false })
  })

  // we've namespaced the initial sending down of our cypress
  // app as '__'  this route shouldn't ever be used by servers
  // and therefore should not conflict
  // ---
  // TODO: we should additionally send config for the socket.io route, etc
  // and any other __cypress namespaced files so that the runner does
  // not have to be aware of anything
  la(check.unemptyString(config.clientRoute), 'missing client route in config', config)

  app.get(config.clientRoute, (req, res) => {
    debug('Serving Cypress front-end by requested URL:', req.url)

    return runner.serve(req, res, {
      config,
      project,
      getRemoteState,
    })
  })

  app.all('*', (req, res) => {
    return networkProxy.handleHttpRequest(req, res)
  })

  // when we experience uncaught errors
  // during routing just log them out to
  // the console and send 500 status
  // and report to raygun (in production)
  return app.use((err, req, res) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    return res.sendStatus(500)
  })
}
