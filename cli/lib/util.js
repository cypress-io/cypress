const _ = require('lodash')
const arch = require('arch')
const os = require('os')
const ospath = require('ospath')
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
const logger = require('./logger')
const debug = require('debug')('cypress:cli')
const fs = require('./fs')
const semver = require('semver')

const pkg = require(path.join(__dirname, '..', 'package.json'))

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
  const lines = stdout.split('\n').map((val) => val.trim())

  return lines.some((line) => line === expectedLine)
}

/**
 * Confirms if given value is a valid CYPRESS_INTERNAL_ENV value. Undefined values
 * are valid, because the system can set the default one.
 *
 * @param {string} value
 * @example util.isValidCypressInternalEnvValue(process.env.CYPRESS_INTERNAL_ENV)
 */
function isValidCypressInternalEnvValue (value) {
  if (_.isUndefined(value)) {
    // will get default value
    return true
  }

  // names of config environments, see "packages/server/config/app.json"
  const names = ['development', 'test', 'staging', 'production']

  return _.includes(names, value)
}

/**
 * Confirms if given value is a non-production CYPRESS_INTERNAL_ENV value.
 * Undefined values are valid, because the system can set the default one.
 *
 * @param {string} value
 * @example util.isNonProductionCypressInternalEnvValue(process.env.CYPRESS_INTERNAL_ENV)
 */
function isNonProductionCypressInternalEnvValue (value) {
  return !_.isUndefined(value) && value !== 'production'
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
 * @param {string} str Input string
 * @returns {string} Trimmed string or the original string if there are no double quotes around it.
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

const parseOpts = (opts) => {
  opts = _.pick(opts,
    'browser',
    'cachePath',
    'cacheList',
    'cacheClear',
    'cachePrune',
    'ciBuildId',
    'ct',
    'component',
    'config',
    'configFile',
    'cypressVersion',
    'destination',
    'detached',
    'dev',
    'e2e',
    'exit',
    'env',
    'force',
    'global',
    'group',
    'headed',
    'headless',
    'inspect',
    'inspectBrk',
    'key',
    'path',
    'parallel',
    'port',
    'project',
    'quiet',
    'reporter',
    'reporterOptions',
    'record',
    'runProject',
    'spec',
    'tag')

  if (opts.exit) {
    opts = _.omit(opts, 'exit')
  }

  // some options might be quoted - which leads to unexpected results
  // remove double quotes from certain options
  const cleanOpts = { ...opts }
  const toDequote = ['group', 'ciBuildId']

  for (const prop of toDequote) {
    if (_.has(opts, prop)) {
      cleanOpts[prop] = dequote(opts[prop])
    }
  }

  debug('parsed cli options %o', cleanOpts)

  return cleanOpts
}

/**
 * Copy of packages/server/lib/browsers/utils.ts
 * because we need same functionality in CLI to show the path :(
 */
const getApplicationDataFolder = (...paths) => {
  const { env } = process

  // allow overriding the app_data folder
  let folder = env.CYPRESS_CONFIG_ENV || env.CYPRESS_INTERNAL_ENV || 'development'

  const PRODUCT_NAME = pkg.productName || pkg.name
  const OS_DATA_PATH = ospath.data()

  const ELECTRON_APP_DATA_PATH = path.join(OS_DATA_PATH, PRODUCT_NAME)

  if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF) {
    folder = `${folder}-e2e-test`
  }

  const p = path.join(ELECTRON_APP_DATA_PATH, 'cy', folder, ...paths)

  return p
}

const util = {
  normalizeModuleOptions,
  parseOpts,
  isValidCypressInternalEnvValue,
  isNonProductionCypressInternalEnvValue,
  printNodeOptions,

  isCi () {
    return isCi
  },

  getEnvOverrides (options = {}) {
    return _
    .chain({})
    .extend(util.getEnvColors())
    .extend(util.getForceTty())
    .omitBy(_.isUndefined) // remove undefined values
    .mapValues((value) => { // stringify to 1 or 0
      return value ? '1' : '0'
    })
    .extend(util.getOriginalNodeOptions())
    .value()
  },

  getOriginalNodeOptions () {
    const opts = {}

    if (process.env.NODE_OPTIONS) {
      opts.ORIGINAL_NODE_OPTIONS = process.env.NODE_OPTIONS
    }

    // https://github.com/cypress-io/cypress/issues/18914
    // Node 17+ ships with OpenSSL 3 by default, so we may need the option
    // --openssl-legacy-provider so that webpack@4 can use the legacy MD4 hash
    // function. This option doesn't exist on Node <17 or when it is built
    // against OpenSSL 1, so we have to detect Node's major version and check
    // which version of OpenSSL it was built against before spawning the plugins
    // process.

    // To be removed when the Cypress binary pulls in the @cypress/webpack-batteries-included-preprocessor
    // version that has been updated to webpack >= 5.61, which no longer relies on
    // Node's builtin crypto.hash function.
    if (process.versions && semver.satisfies(process.versions.node, '>=17.0.0') && semver.satisfies(process.versions.openssl, '>=3', { includePrerelease: true })) {
      opts.ORIGINAL_NODE_OPTIONS = `${opts.ORIGINAL_NODE_OPTIONS || ''} --openssl-legacy-provider`
    }

    return opts
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

  pkgBuildInfo () {
    return pkg.buildInfo
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

  async getPlatformInfo () {
    const [version, osArch] = await Promise.all([
      util.getOsVersionAsync(),
      this.getRealArch(),
    ])

    return stripIndent`
      Platform: ${os.platform()}-${osArch} (${version})
      Cypress Version: ${util.pkgVersion()}
    `
  },

  _cachedArch: undefined,

  /**
   * Attempt to return the real system arch (not process.arch, which is only the Node binary's arch)
   */
  async getRealArch () {
    if (this._cachedArch) return this._cachedArch

    async function _getRealArch () {
      const osPlatform = os.platform()
      // eslint-disable-next-line no-restricted-syntax
      const osArch = os.arch()

      debug('detecting arch %o', { osPlatform, osArch })

      if (osArch === 'arm64') return 'arm64'

      if (osPlatform === 'darwin') {
        // could possibly be x64 node on arm64 darwin, check if we are being translated by Rosetta
        // https://stackoverflow.com/a/65347893/3474615
        const { stdout } = await execa('sysctl', ['-n', 'sysctl.proc_translated']).catch(() => '')

        debug('rosetta check result: %o', { stdout })
        if (stdout === '1') return 'arm64'
      }

      if (osPlatform === 'linux') {
        // could possibly be x64 node on arm64 linux, check the "machine hardware name"
        // list of names for reference: https://stackoverflow.com/a/45125525/3474615
        const { stdout } = await execa('uname', ['-m']).catch(() => '')

        debug('arm uname -m result: %o ', { stdout })
        if (['aarch64_be', 'aarch64', 'armv8b', 'armv8l'].includes(stdout)) return 'arm64'
      }

      // eslint-disable-next-line no-restricted-syntax
      const pkgArch = arch()

      if (pkgArch === 'x86') return 'ia32'

      return pkgArch
    }

    return (this._cachedArch = await _getRealArch())
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

    const configVarName = `npm_config_${varName}`
    const configVarNameLower = configVarName.toLowerCase()
    const packageConfigVarName = `npm_package_config_${varName}`

    let result

    if (process.env.hasOwnProperty(varName)) {
      debug(`Using ${varName} from environment variable`)

      result = process.env[varName]
    } else if (process.env.hasOwnProperty(configVarName)) {
      debug(`Using ${varName} from npm config`)

      result = process.env[configVarName]
    } else if (process.env.hasOwnProperty(configVarNameLower)) {
      debug(`Using ${varName.toLowerCase()} from npm config`)

      result = process.env[configVarNameLower]
    } else if (process.env.hasOwnProperty(packageConfigVarName)) {
      debug(`Using ${varName} from package.json config`)

      result = process.env[packageConfigVarName]
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

  getApplicationDataFolder,
}

module.exports = util
