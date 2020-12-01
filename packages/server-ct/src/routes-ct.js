const send = require('send')
const debug = require('debug')('cypress:server:routes')
const httpProxy = require('http-proxy')

// const files = require('@packages/server/lib/controllers/files')
const runnerCt = require('@packages/runner-ct')
const staticPkg = require('@packages/static')

module.exports = ({ app, config, project, onError }) => {
  const proxy = httpProxy.createProxyServer()

  app.get('/__cypress/runner/*', runnerCt.middleware(send))

  app.get('/__cypress/static/*', (req, res) => {
    staticPkg.handle(req, res)
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
  app.use((err, req, res) => {
    console.log(err.stack) // eslint-disable-line no-console

    res.set('x-cypress-error', err.message)
    res.set('x-cypress-stack', JSON.stringify(err.stack))

    res.sendStatus(500)
  })
}
