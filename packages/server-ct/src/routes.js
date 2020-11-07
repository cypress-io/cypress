const send = require('send')
const debug = require('debug')('cypress:server:routes')

const runnerCt = require('@packages/runner-ct')
const staticPkg = require('@packages/static')

module.exports = ({ app, config, project, onError }) => {
  app.get('/__cypress/runner/*', runnerCt.middleware(send))

  app.get('/__cypress/static/*', staticPkg.middleware(send))

  app.get('/__cypress/iframes/*', (req, res) => {
    // const extraOptions = {
    //   specFilter: _.get(project, 'spec.specFilter'),
    // }

    // debug('project %o', project)
    // debug('handling iframe for project spec %o', {
    //   spec: project.spec,
    //   extraOptions,
    // })

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
    res.sendStatus(200)
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
