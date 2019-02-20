const _ = require('lodash')
const R = require('ramda')
const os = require('os')
const tty = require('tty')
const path = require('path')
const isCi = require('is-ci')
const execa = require('execa')
const getos = require('getos')
const chalk = require('chalk')
const Promise = require('bluebird')
const cachedir = require('cachedir')
const executable = require('executable')
const registry = require('registry-js')
const supportsColor = require('supports-color')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', 'package.json'))
const logger = require('./logger')
const debug = require('debug')('cypress:cli')

const getosAsync = Promise.promisify(getos)

const stringify = (val) => {
  return _.isObject(val) ? JSON.stringify(val) : val
}

function normalizeModuleOptions (options = {}) {
  return _.mapValues(options, stringify)
}

function stdoutLineMatches (expectedLine, stdout) {
  const lines = stdout.split('\n').map(R.trim)
  const lineMatches = R.equals(expectedLine)

  return lines.some(lineMatches)
}

/**
 * Prints NODE_OPTIONS using debug() module, but only
 * if DEBUG=cypress... is set
 */
function printNodeOptions (log = debug) {
  if (!log.enabled) {
    return
  }

  if (process.env.NODE_OPTIONS) {
    log('NODE_OPTIONS=%s', process.env.NODE_OPTIONS)
  } else {
    log('NODE_OPTIONS is not set')
  }
}

const util = {
  normalizeModuleOptions,

  printNodeOptions,

  isCi () {
    return isCi
  },

  getEnvOverrides () {
    return _
    .chain({})
    .extend(util.getEnvColors())
    .extend(util.getForceTty())
    .omitBy(_.isUndefined) // remove undefined values
    .mapValues((value) => { // stringify to 1 or 0
      return value ? '1' : '0'
    })
    .value()
  },

  getForceTty () {
    return {
      FORCE_STDIN_TTY: util.isTty(process.stdin.fd),
      FORCE_STDOUT_TTY: util.isTty(process.stdout.fd),
      FORCE_STDERR_TTY: util.isTty(process.stderr.fd),
    }
  },

  getEnvColors () {
    const sc = util.supportsColor()

    return {
      FORCE_COLOR: sc,
      DEBUG_COLORS: sc,
      MOCHA_COLORS: sc ? true : undefined,
    }
  },

  loadSystemProxySettings () {
    if (!_.isUndefined(process.env.HTTP_PROXY)) {
      // user has set their own proxy, don't mess w/ it
      return
    }

    if (os.platform() === 'win32') {
      const { httpProxy, noProxy } = this.getWindowsProxy()

      if (httpProxy) {
        process.env.HTTP_PROXY = process.env.HTTPS_PROXY = httpProxy
      }

      if (!process.env.NO_PROXY && noProxy) {
        process.env.NO_PROXY = noProxy
      }
    }
  },

  getWindowsProxy () {
    // load the Windows proxy variables into the environment variables Cypress & dependencies expect

    debug('scanning Windows registry for proxy setting')
    const values = registry.enumerateValues(
      registry.HKEY.HKEY_CURRENT_USER,
      'Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    )
    const proxyEnabled = _.find(values, { name: 'ProxyEnable' })
    const proxyServer = _.find(values, { name: 'ProxyServer' })

    if (!proxyEnabled || !proxyEnabled.data || !proxyServer || !proxyServer.data) {
      debug('windows proxy disabled or no proxy defined')

      return {}
    }

    const proxyOverride = _.find(values, { name: 'ProxyOverride' })
    let noProxy

    if (proxyOverride && proxyOverride.data) {
      noProxy = proxyOverride.data
      .split(';')
      .join(',')
      .replace('<local>', 'localhost,127.0.0.0/8,::1')
    }

    const httpProxy = `http://${proxyServer.data}`

    debug('found HTTP(S)_PROXY %s and NO_PROXY %s from registry key', httpProxy, noProxy)

    return { httpProxy, noProxy }
  },

  isTty (fd) {
    return tty.isatty(fd)
  },

  supportsColor () {
    // if we've been explictly told not to support
    // color then turn this off
    if (process.env.NO_COLOR) {
      return false
    }

    // https://github.com/cypress-io/cypress/issues/1747
    // always return true in CI providers
    if (process.env.CI) {
      return true
    }

    // ensure that both stdout and stderr support color
    return Boolean(supportsColor.stdout) && Boolean(supportsColor.stderr)
  },

  cwd () {
    return process.cwd()
  },

  pkgVersion () {
    return pkg.version
  },

  exit (code) {
    process.exit(code)
  },

  logErrorExit1 (err) {
    logger.error(err.message)

    process.exit(1)
  },

  titleize (...args) {
    // prepend first arg with space
    // and pad so that all messages line up
    args[0] = _.padEnd(` ${args[0]}`, 24)

    // get rid of any falsy values
    args = _.compact(args)

    return chalk.blue(...args)
  },

  calculateEta (percent, elapsed) {
    // returns the number of seconds remaining

    // if we're at 100 already just return 0
    if (percent === 100) {
      return 0
    }

    // take the percentage and divide by one
    // and multiple that against elapsed
    // subtracting what's already elapsed
    return elapsed * (1 / (percent / 100)) - elapsed
  },

  secsRemaining (eta) {
    // calculate the seconds reminaing with no decimal places
    return (_.isFinite(eta) ? (eta / 1000) : 0).toFixed(0)
  },

  setTaskTitle (task, title, renderer) {
    // only update the renderer title when not running in CI
    if (renderer === 'default' && task.title !== title) {
      task.title = title
    }
  },

  isInstalledGlobally () {
    return isInstalledGlobally
  },

  isSemver (str) {
    return /^(\d+\.)?(\d+\.)?(\*|\d+)$/.test(str)
  },

  isExecutableAsync (filePath) {
    return Promise.resolve(executable(filePath))
  },

  getOsVersionAsync () {
    return Promise.try(() => {
      if (os.platform() === 'linux') {
        return getosAsync()
        .then((osInfo) => {
          return [osInfo.dist, osInfo.release].join(' - ')
        })
        .catch(() => {
          return os.release()
        })
      }

      return os.release()

    })
  },

  // attention:
  // when passing relative path to NPM post install hook, the current working
  // directory is set to the `node_modules/cypress` folder
  // the user is probably passing relative path with respect to root package folder
  formAbsolutePath (filename) {
    if (path.isAbsolute(filename)) {
      return filename
    }

    return path.join(process.cwd(), '..', '..', filename)
  },

  getEnv (varName) {
    const envVar = process.env[varName]
    const configVar = process.env[`npm_config_${varName}`]
    const packageConfigVar = process.env[`npm_package_config_${varName}`]

    if (envVar) {
      debug(`Using ${varName} from environment variable`)

      return envVar
    }

    if (configVar) {
      debug(`Using ${varName} from npm config`)

      return configVar
    }

    if (packageConfigVar) {
      debug(`Using ${varName} from package.json config`)

      return packageConfigVar
    }

    return undefined

  },

  getCacheDir () {
    return cachedir('Cypress')
  },

  isPostInstall () {
    return process.env.npm_lifecycle_event === 'postinstall'
  },

  exec: execa,

  stdoutLineMatches,
}

module.exports = util
