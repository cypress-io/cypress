'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.ProjectE2E = void 0

const debug_1 = __importDefault(require('debug'))
const browsers_1 = __importDefault(require('./browsers'))
const preprocessor_1 = __importDefault(require('./plugins/preprocessor'))
const project_base_1 = require('./project-base')
const server_e2e_1 = require('./server-e2e')
const socket_e2e_1 = require('./socket-e2e')
const routes_1 = __importDefault(require('./routes'))
const debug = debug_1.default('cypress:server:project')

function createRoutes (...args) {
  return routes_1.default.apply(null, args)
}
class ProjectE2E extends project_base_1.ProjectBase {
  get projectType () {
    return 'e2e'
  }
  open (options) {
    this._server = new server_e2e_1.ServerE2E()

    return super.open(options, {
      onOpen: (cfg) => {
        return this._initPlugins(cfg, options)
        .then(({ cfg, specsStore, startSpecWatcher }) => {
          return this.server.open(cfg, {
            project: this,
            onError: options.onError,
            onWarning: options.onWarning,
            shouldCorrelatePreRequests: this.shouldCorrelatePreRequests,
            projectType: 'e2e',
            SocketCtor: socket_e2e_1.SocketE2E,
            createRoutes,
            specsStore,
          })
          .then(([port, warning]) => {
            return {
              cfg,
              port,
              warning,
              specsStore,
              startSpecWatcher,
            }
          })
        })
      },
      onAfterOpen ({ cfg }) {
        cfg.proxyServer = cfg.proxyUrl

        return cfg
      },
    })
  }
  _onError (err, options) {
    debug('got plugins error', err.stack)
    browsers_1.default.close()
    options.onError(err)
  }
  _initPlugins (cfg, options) {
    return super._initPlugins(cfg, options)
  }
  close () {
    return super.close({
      onClose () {
        preprocessor_1.default.close()
      },
    })
  }
}
exports.ProjectE2E = ProjectE2E
