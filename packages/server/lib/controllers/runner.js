const _ = require('lodash')
const send = require('send')
const os = require('os')
const fs = require('../util/fs')
const path = require('path')
const debug = require('debug')('cypress:server:runner')
const pkg = require('@packages/root')
const runner = require('@packages/runner/lib/resolve-dist')

const PATH_TO_NON_PROXIED_ERROR = path.join(__dirname, '..', 'html', 'non_proxied_error.html')

const _serveNonProxiedError = (res) => {
  return fs.readFile(PATH_TO_NON_PROXIED_ERROR)
  .then((html) => {
    return res.type('html').end(html)
  })
}

module.exports = {
  serve (req, res, options = {}) {
    if (req.proxiedUrl.startsWith('/')) {
      debug('request was not proxied via Cypress, erroring %o', _.pick(req, 'proxiedUrl'))

      return _serveNonProxiedError(res)
    }

    let { config, getRemoteState, project } = options

    const { spec, browser } = project.getCurrentSpecAndBrowser()

    config = _.clone(config)
    config.remote = getRemoteState()
    config.version = pkg.version
    config.platform = os.platform()
    config.arch = os.arch()
    config.spec = spec
    config.browser = browser

    debug('serving runner index.html with config %o',
      _.pick(config, 'version', 'platform', 'arch', 'projectName'))

    // log the env object's keys without values to avoid leaking sensitive info
    debug('env object has the following keys: %s', _.keys(config.env).join(', '))

    // base64 before embedding so user-supplied contents can't break out of <script>
    // https://github.com/cypress-io/cypress/issues/4952
    const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

    const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || runner.getPathToIndex()

    return res.render(runnerPath, {
      base64Config,
      projectName: config.projectName,
    })
  },

  handle (req, res) {
    const pathToFile = runner.getPathToDist(req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },

  handleSourceMappings (req, res) {
    const pathToFile = runner.getPathToSourceMappings()

    return send(req, pathToFile)
    .pipe(res)
  },
}
