import Bluebird from 'bluebird'
import debugModule from 'debug'
import errors from '@packages/errors'
import type { ChildProcess } from 'child_process'

const geckoDriverPackageName = 'geckodriver'
const GECKODRIVER_DEBUG_NAMESPACE = 'cypress:server:browsers:geckodriver'
const GECKODRIVER_DEBUG_NAMESPACE_VERBOSE = 'cypress-verbose:server:browsers:geckodriver'
const debug = debugModule(GECKODRIVER_DEBUG_NAMESPACE)
const debugVerbose = debugModule(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE)

type SpawnOpt = { [key: string]: string | string[] | SpawnOpt }

export type StartGeckoDriverArgs = {
  host: string
  port: number
  marionetteHost: string
  marionettePort: number
  webdriverBidiPort: number
  profilePath: string
  binaryPath: string
  spawnOpts?: SpawnOpt
}

/**
 * Class with static methods that serve as a wrapper around GeckoDriver
 */
export class GeckoDriver {
  // We resolve this package in such a way that packherd can discover it, meaning we are re-declaring the types here to get typings support =(
  // the only reason a static method is used here is so we can stub the class method more easily while under unit-test
  private static getGeckoDriverPackage: () => {
    start: (args: {
      allowHosts?: string[]
      allowOrigins?: string[]
      binary?: string
      connectExisting?: boolean
      host?: string
      jsdebugger?: boolean
      log?: 'fatal' | 'error' | 'warn' | 'info' | 'config' | 'debug' | 'trace'
      logNoTruncate?: boolean
      marionetteHost?: string
      marionettePort?: number
      port?: number
      websocketPort?: number
      profileRoot?: string
      geckoDriverVersion?: string
      customGeckoDriverPath?: string
      cacheDir?: string
      spawnOpts: SpawnOpt
    }) => Promise<ChildProcess>
    download: (geckodriverVersion?: string, cacheDir?: string) => Promise<string>
  } = () => {
      /**
       * NOTE: geckodriver is an ESM package and does not play well with mksnapshot.
       * Requiring the package in this way, dynamically, will
       * make it undiscoverable by mksnapshot
       */
      return require(require.resolve(geckoDriverPackageName, { paths: [__dirname] }))
    }

  /**
   * creates an instance of the GeckoDriver server. This is needed to start WebDriver
   * @param {StartGeckoDriverArgs} opts - arguments needed to start GeckoDriver
   * @returns {ChildProcess} - the child process in which the geckodriver is running
   */
  static async create (opts: StartGeckoDriverArgs, timeout: number = 5000): Promise<ChildProcess> {
    debug('no geckodriver instance exists. starting geckodriver...')

    let geckoDriverChildProcess: ChildProcess | null = null

    try {
      const { start: startGeckoDriver } = GeckoDriver.getGeckoDriverPackage()

      geckoDriverChildProcess = await startGeckoDriver({
        host: opts.host,
        port: opts.port,
        marionetteHost: opts.marionetteHost,
        marionettePort: opts.marionettePort,
        websocketPort: opts.webdriverBidiPort,
        profileRoot: opts.profilePath,
        binary: opts.binaryPath,
        jsdebugger: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) || false,
        log: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) ? 'debug' : 'error',
        logNoTruncate: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE),
        spawnOpts: opts.spawnOpts || {},
      })

      // using a require statement to make this easier to test with mocha/mockery
      const waitPort = require('wait-port')

      await Bluebird.resolve(waitPort({
        port: opts.port,
        // add 1 second to the timeout so the timeout throws first if the limit is reached
        timeout: timeout + 1000,
        output: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) ? 'dots' : 'silent',
      })).timeout(timeout)

      debug('geckodriver started!')

      // For whatever reason, we NEED to bind to stderr/stdout in order
      // for the geckodriver process not to hang, even though the event effectively
      // isn't doing anything without debug logs enabled.
      geckoDriverChildProcess.stdout?.on('data', (buf) => {
        debugVerbose('firefox stdout: %s', String(buf).trim())
      })

      geckoDriverChildProcess.stderr?.on('data', (buf) => {
        debugVerbose('firefox stderr: %s', String(buf).trim())
      })

      geckoDriverChildProcess.on('exit', (code, signal) => {
        debugVerbose('firefox exited: %o', { code, signal })
      })

      return geckoDriverChildProcess
    } catch (err) {
      geckoDriverChildProcess?.kill()
      debug(`geckodriver failed to start from 'geckodriver:start' for reason: ${err}`)
      throw errors.get('FIREFOX_GECKODRIVER_FAILURE', 'geckodriver:start', err)
    }
  }
}
