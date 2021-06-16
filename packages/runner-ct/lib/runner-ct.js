'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.serveChunk = exports.serve = exports.handle = exports.getPathToDist = void 0

const tslib_1 = require('tslib')
const debug_1 = tslib_1.__importDefault(require('debug'))
const lodash_1 = tslib_1.__importDefault(require('lodash'))
const path_1 = tslib_1.__importDefault(require('path'))
const send_1 = tslib_1.__importDefault(require('send'))
const debug = debug_1.default('cypress:server:runner-ct')

function dist (...args) {
  const paths = [__dirname, '..', 'dist'].concat(args)

  return path_1.default.join(...paths)
}
const getPathToDist = (...args) => {
  return dist(...args)
}

exports.getPathToDist = getPathToDist

const handle = (req, res) => {
  const pathToFile = exports.getPathToDist(req.params[0])

  return send_1.default(req, pathToFile)
  .pipe(res)
}

exports.handle = handle

const serve = (req, res, options) => {
  const config = Object.assign(Object.assign({}, options.config), { browser: options.project.browser, specs: options.specsStore.specFiles })

  // TODO: move the component file watchers in here
  // and update them in memory when they change and serve
  // them straight to the HTML on load
  debug('serving runner index.html with config %o', lodash_1.default.pick(config, 'version', 'platform', 'arch', 'projectName'))
  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952
  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')
  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || exports.getPathToDist('index.html')

  return res.render(runnerPath, {
    base64Config,
    projectName: config.projectName,
  })
}

exports.serve = serve

const serveChunk = (req, res, options) => {
  let { config } = options
  let pathToFile = exports.getPathToDist(req.originalUrl.replace(config.clientRoute, ''))

  return send_1.default(req, pathToFile).pipe(res)
}

exports.serveChunk = serveChunk
//# sourceMappingURL=runner-ct.js.map
