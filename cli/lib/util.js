const _ = require('lodash')
const R = require('ramda')
const os = require('os')
const crypto = require('crypto')
const la = require('lazy-ass')
const is = require('check-more-types')
const tty = require('tty')
const path = require('path')
const isCi = require('is-ci')
const execa = require('execa')
const getos = require('getos')
const chalk = require('chalk')
const Promise = require('bluebird')
const cachedir = require('cachedir')
const logSymbols = require('log-symbols')
const executable = require('executable')
const { stripIndent } = require('common-tags')
const supportsColor = require('supports-color')
const isInstalledGlobally = require('is-installed-globally')
const pkg = require(path.join(__dirname, '..', 'package.json'))
const logger = require('./logger')
const debug = require('debug')('cypress:cli')
const fs = require('./fs')

const issuesUrl = 'https://github.com/cypress-io/cypress/issues'

const getosAsync = Promise.promisify(getos)

/**
 * Returns SHA512 of a file
 *
 * Implementation lifted from https://github.com/sindresorhus/hasha
 * but without bringing that dependency (since hasha is Node v8+)
 */
const getFileChecksum = (filename) => {
  la(is.unemptyString(filename), 'expected filename', filename)

  const hashStream = () => {
    const s = crypto.createHash('sha512')

    s.setEncoding('hex')

    return s
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filename)

    stream.on('error', reject)
    .pipe(hashStream())
    .on('error', reject)
    .on('finish', function () {
      resolve(this.read())
    })
  })
}

const getFileSize = (filename) => {
  la(is.unemptyString(filename), 'expected filename', filename)

  return fs.statAsync(filename).get('size')
}

const isBrokenGtkDisplayRe = /Gtk: cannot open display/

const stringify = (val) => {
  return _.isObject(val) ? JSON.stringify(val) : val
}

function normalizeModuleOptions (options = {}) {
  return _.mapValues(options, stringify)
}

/**
 * Returns true if the platform is Linux. We do a lot of different
 * stuff on Linux (like Xvfb) and it helps to has readable code
 */
const isLinux = () => {
  return os.platform() === 'linux'
}

/**
   * If the DISPLAY variable is set incorrectly, when trying to spawn
   * Cypress executable we get an error like this:
  ```
  [1005:0509/184205.663837:WARNING:browser_main_loop.cc(258)] Gtk: cannot open display: 99
  ```
   */
const isBrokenGtkDisplay = (str) => {
  return isBrokenGtkDisplayRe.test(str)
}

const isPossibleLinuxWithIncorrectDisplay = () => {
  return isLinux() && process.env.DISPLAY
}

const logBrokenGtkDisplayWarning = () => {
  debug('Cypress exited due to a broken gtk display because of a potential invalid DISPLAY env... retrying after starting Xvfb')

  // if we get this error, we are on Linux and DISPLAY is set
  logger.warn(stripIndent`

    ${logSymbols.warning} Warning: Cypress failed to start.

    This is likely due to a misconfigured DISPLAY environment variable.

    DISPLAY was set to: "${process.env.DISPLAY}"

    Cypress will attempt to fix the problem and rerun.
  `)

  logger.warn()
}

function stdoutLineMatches (expectedLine, stdout) {
  const lines = stdout.split('\n').map(R.trim)
  const lineMatches = R.equals(expectedLine)

  return lines.some(lineMatches)
}

/**
 * Confirms if given value is a valid CYPRESS_ENV value. Undefined values
 * are valid, because the system can set the default one.
 *
 * @param {string} value
 * @example util.isValidCypressEnvValue(process.env.CYPRESS_ENV)
 */
function isValidCypressEnvValue (value) {
  if (_.isUndefined(value)) {
    // will get default value
    return true
  }

  // names of config environments, see "packages/server/config/app.yml"
  const names = ['development', 'test', 'staging', 'production']

  return _.includes(names, value)
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

/**
 * Removes double quote characters
 * from the start and end of the given string IF they are both present
 *
 * @example
  ```
  dequote('"foo"')
  // returns string 'foo'
  dequote('foo')
  // returns string 'foo'
  ```
 */
const dequote = (str) => {
  la(is.string(str), 'expected a string to remove double quotes', str)
  if (str.length > 1 && str[0] === '"' && str[str.length - 1] === '"') {
    return str.substr(1, str.length - 2)
  }

  return str
}

const util = {
  normalizeModuleOptions,
  isValidCypressEnvValue,
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

  dequote,

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

    // if we're at 100% already just return 0
    if (percent === 100) {
      return 0
    }

    // take the percentage and divide by one
    // and multiple that against elapsed
    // subtracting what's already elapsed
    return elapsed * (1 / (percent / 100)) - elapsed
  },

  convertPercentToPercentage (num) {
    // convert a percent with values between 0 and 1
    // with decimals, so that it is between 0 and 100
    // and has no decimal places
    return Math.round(_.isFinite(num) ? (num * 100) : 0)
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

  isLinux,

  getOsVersionAsync () {
    return Promise.try(() => {
      if (isLinux()) {
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

  getEnv (varName, trim) {
    la(is.unemptyString(varName), 'expected environment variable name, not', varName)

    const envVar = process.env[varName]
    const configVar = process.env[`npm_config_${varName}`]
    const packageConfigVar = process.env[`npm_package_config_${varName}`]

    let result

    if (envVar) {
      debug(`Using ${varName} from environment variable`)

      result = envVar
    } else if (configVar) {
      debug(`Using ${varName} from npm config`)

      result = configVar
    } else if (packageConfigVar) {
      debug(`Using ${varName} from package.json config`)

      result = packageConfigVar
    }

    // environment variables are often set double quotes to escape characters
    // and on Windows it can lead to weird things: for example
    //  set FOO="C:\foo.txt" && node -e "console.log('>>>%s<<<', process.env.FOO)"
    // will print
    //    >>>"C:\foo.txt" <<<
    // see https://github.com/cypress-io/cypress/issues/4506#issuecomment-506029942
    // so for sanity sake we should first trim whitespace characters and remove
    // double quotes around environment strings if the caller is expected to
    // use this environment string as a file path
    return trim ? dequote(_.trim(result)) : result
  },

  getCacheDir () {
    return cachedir('Cypress')
  },

  isPostInstall () {
    return process.env.npm_lifecycle_event === 'postinstall'
  },

  exec: execa,

  stdoutLineMatches,

  issuesUrl,

  isBrokenGtkDisplay,

  logBrokenGtkDisplayWarning,

  isPossibleLinuxWithIncorrectDisplay,

  getGitHubIssueUrl (number) {
    la(is.positive(number), 'github issue should be a positive number', number)
    la(_.isInteger(number), 'github issue should be an integer', number)

    return `${issuesUrl}/${number}`
  },

  getFileChecksum,

  getFileSize,
}

module.exports = util
