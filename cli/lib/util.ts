import _ from 'lodash'
import arch from 'arch'
import os from 'os'
import ospath from 'ospath'
import hasha from 'hasha'
import la from 'lazy-ass'
import tty from 'tty'
import path from 'path'
import { isCI as isCi } from 'ci-info'
import execa from 'execa'
import si from 'systeminformation'
import chalk from 'chalk'
import Bluebird from 'bluebird'
import cachedir from 'cachedir'
import logSymbols from 'log-symbols'
import executable from 'executable'
import { cwd } from 'process'
import { stripIndent } from 'common-tags'
import supportsColor from 'supports-color'
import isInstalledGlobally from 'is-installed-globally'
import logger from './logger'
import Debug from 'debug'
import fs from 'fs-extra'
import pkg from '../package.json'

// TODO: this package needs to be replaced as we can't import it in vitest
const is = require('check-more-types')

const debug = Debug('cypress:cli')

const issuesUrl = 'https://github.com/cypress-io/cypress/issues'

/**
 * Returns SHA512 of a file
 */
const getFileChecksum = (filename: string): any => {
  la(is.unemptyString(filename), 'expected filename', filename)

  return hasha.fromFile(filename, { algorithm: 'sha512' })
}

const getFileSize = async (filename: string): Promise<any> => {
  la(is.unemptyString(filename), 'expected filename', filename)

  const { size } = await fs.stat(filename)

  return size
}

const isBrokenGtkDisplayRe = /Gtk: cannot open display/

const stringify = (val: any): string => {
  return _.isObject(val) ? JSON.stringify(val) : val
}

function normalizeModuleOptions (options: any = {}): any {
  return _.mapValues(options, stringify)
}

/**
 * Returns true if the platform is Linux. We do a lot of different
 * stuff on Linux (like Xvfb) and it helps to has readable code
 */
const isLinux = (): boolean => {
  return os.platform() === 'linux'
}

/**
   * If the DISPLAY variable is set incorrectly, when trying to spawn
   * Cypress executable we get an error like this:
  ```
  [1005:0509/184205.663837:WARNING:browser_main_loop.cc(258)] Gtk: cannot open display: 99
  ```
   */
const isBrokenGtkDisplay = (str: string): boolean => {
  return isBrokenGtkDisplayRe.test(str)
}

const isPossibleLinuxWithIncorrectDisplay = (): boolean => {
  return isLinux() && !!process.env.DISPLAY
}

const logBrokenGtkDisplayWarning = (): void => {
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

function stdoutLineMatches (expectedLine: string, stdout: string): boolean {
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
function isValidCypressInternalEnvValue (value: string | undefined): boolean {
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
function isNonProductionCypressInternalEnvValue (value: string | undefined): boolean {
  return !_.isUndefined(value) && value !== 'production'
}

/**
 * Prints NODE_OPTIONS using debug() module, but only
 * if DEBUG=cypress... is set
 */
function printNodeOptions (log: any = debug): void {
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
const dequote = (str: string): string => {
  la(is.string(str), 'expected a string to remove double quotes', str)
  if (str.length > 1 && str[0] === '"' && str[str.length - 1] === '"') {
    return str.substr(1, str.length - 2)
  }

  return str
}

const parseOpts = (opts: any): any => {
  opts = _.pick(opts,
    'autoCancelAfterFailures',
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
    'runnerUi',
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
const getApplicationDataFolder = (...paths: string[]): string => {
  const { env } = process

  // allow overriding the app_data folder
  let folder = env.CYPRESS_CONFIG_ENV || env.CYPRESS_INTERNAL_ENV || 'development'

  // @ts-expect-error value exists but is not typed
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

  isCi (): boolean {
    return isCi
  },

  getEnvOverrides (options: any = {}): any {
    return _
    .chain({})
    .extend(this.getEnvColors())
    .extend(this.getForceTty())
    .omitBy(_.isUndefined) // remove undefined values
    .mapValues((value: any) => { // stringify to 1 or 0
      return value ? '1' : '0'
    })
    .extend(this.getOriginalNodeOptions())
    .value()
  },

  getOriginalNodeOptions (): any {
    const opts: any = {}

    if (process.env.NODE_OPTIONS) {
      opts.ORIGINAL_NODE_OPTIONS = process.env.NODE_OPTIONS
    }

    return opts
  },

  getForceTty (): any {
    return {
      FORCE_STDIN_TTY: this.isTty(process.stdin.fd),
      FORCE_STDOUT_TTY: this.isTty(process.stdout.fd),
      FORCE_STDERR_TTY: this.isTty(process.stderr.fd),
    }
  },

  getEnvColors (): any {
    const sc = this.supportsColor()

    return {
      FORCE_COLOR: sc,
      DEBUG_COLORS: sc,
      MOCHA_COLORS: sc ? true : undefined,
    }
  },

  isTty (fd: number): boolean {
    return tty.isatty(fd)
  },

  supportsColor (): boolean {
    // if we've been explicitly told not to support
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

  cwd (): string {
    return cwd()
  },

  pkgBuildInfo (): any {
    // @ts-expect-error value exists but is not typed
    return pkg.buildInfo
  },

  pkgVersion (): string {
    return pkg.version
  },

  // TODO: remove this method
  exit (code: number): never {
    process.exit(code)
  },

  logErrorExit1 (err: Error): never {
    logger.error(err.message)

    process.exit(1)
  },

  dequote,

  titleize (...args: any[]): string {
    // prepend first arg with space
    // and pad so that all messages line up
    args[0] = _.padEnd(` ${args[0]}`, 24)

    // get rid of any falsy values
    args = _.compact(args)

    return chalk.blue(...args)
  },

  calculateEta (percent: number, elapsed: number): number {
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

  convertPercentToPercentage (num: number): number {
    // convert a percent with values between 0 and 1
    // with decimals, so that it is between 0 and 100
    // and has no decimal places
    return Math.round(_.isFinite(num) ? (num * 100) : 0)
  },

  secsRemaining (eta: number): string {
    // calculate the seconds reminaing with no decimal places
    return (_.isFinite(eta) ? (eta / 1000) : 0).toFixed(0)
  },

  setTaskTitle (task: any, title: string, renderer: string): void {
    // only update the renderer title when not running in CI
    if (renderer === 'default' && task.title !== title) {
      task.title = title
    }
  },

  isInstalledGlobally (): boolean {
    return isInstalledGlobally
  },

  isSemver (str: string): boolean {
    return /^(\d+\.)?(\d+\.)?(\*|\d+)$/.test(str)
  },

  isExecutableAsync (filePath: string): any {
    return Bluebird.resolve(executable(filePath))
  },

  isLinux,

  async getOsVersionAsync (): Promise<any> {
    try {
      const osInfo = await si.osInfo()

      if (osInfo.distro && osInfo.release) {
        return `${osInfo.distro} - ${osInfo.release}`
      }
    } catch (err) {
      return os.release()
    }

    return os.release()
  },

  async getPlatformInfo (): Promise<string> {
    const [version, osArch] = await Bluebird.all([
      this.getOsVersionAsync(),
      this.getRealArch(),
    ])

    return stripIndent`
      Platform: ${os.platform()}-${osArch} (${version})
      Cypress Version: ${this.pkgVersion()}
    `
  },

  _cachedArch: undefined as string | undefined,

  /**
   * Attempt to return the real system arch (not process.arch, which is only the Node binary's arch)
   */
  async getRealArch (): Promise<string> {
    if (this._cachedArch) return this._cachedArch

    async function _getRealArch (): Promise<string> {
      const osPlatform = os.platform()
      // eslint-disable-next-line no-restricted-syntax
      const osArch = os.arch()

      debug('detecting arch %o', { osPlatform, osArch })

      if (osArch === 'arm64') return 'arm64'

      if (osPlatform === 'darwin') {
        // could possibly be x64 node on arm64 darwin, check if we are being translated by Rosetta
        // https://stackoverflow.com/a/65347893/3474615
        const { stdout } = await execa('sysctl', ['-n', 'sysctl.proc_translated']).catch(() => ({ stdout: '' }))

        debug('rosetta check result: %o', { stdout })
        if (stdout === '1') return 'arm64'
      }

      if (osPlatform === 'linux') {
        // could possibly be x64 node on arm64 linux, check the "machine hardware name"
        // list of names for reference: https://stackoverflow.com/a/45125525/3474615
        const { stdout } = await execa('uname', ['-m']).catch(() => ({ stdout: '' }))

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
  formAbsolutePath (filename: string): string {
    if (path.isAbsolute(filename)) {
      return filename
    }

    return path.join(cwd(), '..', '..', filename)
  },

  getEnv (varName: string, trim?: boolean): string | undefined {
    la(is.unemptyString(varName), 'expected environment variable name, not', varName)

    const configVarName = `npm_config_${varName}`
    const configVarNameLower = configVarName.toLowerCase()
    const packageConfigVarName = `npm_package_config_${varName}`

    let result: string | undefined

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
    return trim && (result !== null && result !== undefined) ? dequote(_.trim(result)) : result
  },

  getCacheDir (): string {
    return cachedir('Cypress')
  },

  isPostInstall (): boolean {
    return process.env.npm_lifecycle_event === 'postinstall'
  },

  exec: execa,

  stdoutLineMatches,

  issuesUrl,

  isBrokenGtkDisplay,

  logBrokenGtkDisplayWarning,

  isPossibleLinuxWithIncorrectDisplay,

  getGitHubIssueUrl (number: number): string {
    la(is.positive(number), 'github issue should be a positive number', number)
    la(_.isInteger(number), 'github issue should be an integer', number)

    return `${issuesUrl}/${number}`
  },

  getFileChecksum,

  getFileSize,

  getApplicationDataFolder,
}

export default util
