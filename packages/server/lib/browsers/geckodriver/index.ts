import debugModule from 'debug'
import _ from 'lodash'
import errors from '@packages/errors'
// using cross fetch to make unit testing easier to mock
import crossFetch from 'cross-fetch'
import type { ChildProcess } from 'child_process'
import type { FoundBrowser } from '@packages/types'

const geckoDriverPackageName = 'geckodriver'
const GECKODRIVER_DEBUG_NAMESPACE = 'cypress:server:browsers:geckodriver'
const GECKODRIVER_DEBUG_NAMESPACE_VERBOSE = 'cypress-verbose:server:browsers:geckodriver'
const debug = debugModule(GECKODRIVER_DEBUG_NAMESPACE)
const debugVerbose = debugModule(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE)

export type StartGeckoDriverArgs = {
  host: string
  port: number
  marionetteHost: string
  marionettePort: number
  bidiPort: number
  extensions: string[]
  profilePath: string
  browser: FoundBrowser
  browserArgs: string[]
  browserEnv: {
    [key: string]: any
  }
  browserPrefs: {
    [key: string]: any
  }
}

type InstallAddOnArgs = {
  extensionPath: string
  isTemporary: boolean
}

namespace WebDriver {
  export namespace Session {
    export type NewResult = {
      capabilities: {
        pageLoadStrategy: 'normal'
        strictFileInteractability: boolean
        timeouts: {
          implicit: number
          pageLoad: number
          script: number
        }
        'moz:accessibilityChecks': boolean
        'moz:buildID': string
        'moz:geckodriverVersion': string
        'moz:headless': boolean
        'moz:platformVersion': string
        'moz:processID': number
        'moz:profile': string
        'moz:shutdownTimeout': number
        'moz:webdriverClick': boolean
        'moz:windowless': boolean
        'moz:debuggerAddress': number
        sessionId: string
      }
    }
  }
}

/**
 * Singleton Class of the GeckoDriver as we only allow one to run at a given time
 */
export class GeckoDriver {
  static #instance: GeckoDriver | undefined
  #child_process: ChildProcess
  #cdp_port: number
  #host: string
  #port: number
  #sessionId: string = ''

  constructor (child_process: ChildProcess, host: string, port: number) {
    this.#child_process = child_process
    this.#host = host
    this.#port = port
  }

  get process () {
    return this.#child_process
  }
  get cdpPort () {
    return this.#cdp_port
  }

  // We resolve this package in such a way to packherd can discover it, meaning we are re-declaring the types here to get typings support =(
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
      logNoTruncated?: boolean
      marionetteHost?: string
      marionettePort?: number
      port?: number
      websocketPort?: number
      profileRoot?: string
      geckoDriverVersion?: string
      customGeckoDriverPath?: string
      cacheDir?: string
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
   * Creates a new WebDriver Session through GeckoDriver. Capabilities are predetermined
   * @see https://searchfox.org/mozilla-central/rev/cc01f11adfacca9cd44a75fd140d2fdd8f9a48d4/testing/geckodriver/src/marionette.rs#126
   * @returns {Promise<WebDriver.Session.NewResult>} - the results of the Webdriver Session (enabled through remote.active-protocols)
   */
  private createWebDriverSession: (opts: { binaryPath: string, args: string[], env: {[key: string]: any}, prefs: {[key: string]: any}}) => Promise<WebDriver.Session.NewResult> = async (opts) => {
    const getSessionUrl = `http://${this.#host}:${this.#port}/session`

    const headers = new Headers()

    headers.append('Content-Type', 'application/json')

    const body = {
      capabilities: {
        alwaysMatch: {
          acceptInsecureCerts: true,
          'moz:firefoxOptions': {
            binary: opts.binaryPath,
            args: opts.args,
            env: opts.env,
            prefs: opts.prefs,
          },
          // a little bit of major https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html#moz-debuggeraddress
          'moz:debuggerAddress': true,
        },
      },
    }

    try {
      const createSessionResp = await crossFetch(getSessionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!createSessionResp.ok) {
        throw new Error(`${createSessionResp.status}: ${createSessionResp.statusText}`)
      }

      const createSessionRespBody = await createSessionResp.json()

      this.#sessionId = createSessionRespBody.value.sessionId
      //
      const CDPAddress = createSessionRespBody.value.capabilities['moz:debuggerAddress']

      this.#cdp_port = parseInt(new URL(`ws://${CDPAddress}`).port)

      debugger

      return createSessionRespBody.value
    } catch (e) {
      debug(`unable to create new Webdriver session: ${e}`)
      throw e
    }
  }

  // async getInfo () {
  //   const getInfo = `http://${this.#host}:${this.#port}/json/version`

  //   try {
  //     const getInfoResp = await crossFetch(getInfo)

  //     if (!getInfoResp.ok) {
  //       throw new Error(`${getInfoResp.status}: ${getInfoResp.statusText}`)
  //     }

  //     const resp = await getInfoResp.json()

  //     return resp
  //   } catch (e) {
  //     debug(`unable to create new Webdriver session: ${e}`)
  //     throw e
  //   }
  // }

  /**
   * Gets available windows handles in the browser. The order in which the window handles are returned is arbitrary.
   * @see https://www.w3.org/TR/webdriver2/#get-window-handles
   *
   * @returns {Promise<string[]>} All the available top-level contexts/handles
   */
  async getWindowHandlesWebDriverClassic (): Promise<string[]> {
    const getWindowHandles = `http://${this.#host}:${this.#port}/session/${this.#sessionId}/window/handles`

    try {
      const getWindowHandlesResp = await crossFetch(getWindowHandles)

      if (!getWindowHandlesResp.ok) {
        throw new Error(`${getWindowHandlesResp.status}: ${getWindowHandlesResp.statusText}`)
      }

      const getWindowHandlesRespBody = await getWindowHandlesResp.json()

      return getWindowHandlesRespBody.value
    } catch (e) {
      debug(`unable to get classic webdriver window handles: ${e}`)
      throw e
    }
  }

  /**
   * Switching window will select session's current top-level browsing context used as the target for all subsequent commands.
   * In a tabbed browser, this will typically make the tab containing the browsing context the selected tab.
   * @see https://www.w3.org/TR/webdriver2/#dfn-switch-to-window
   *
   * @param {string} handle - the context ID of the window handle
   * @returns {Promise<null>}
   */
  async switchToWindowWebDriverClassic (handle: string): Promise<null> {
    const switchToWindowUrl = `http://${this.#host}:${this.#port}/session/${this.#sessionId}/window`

    const headers = new Headers()

    headers.append('Content-Type', 'application/json')

    const body = {
      handle,
    }

    try {
      const switchToWindowResp = await crossFetch(switchToWindowUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!switchToWindowResp.ok) {
        throw new Error(`${switchToWindowResp.status}: ${switchToWindowResp.statusText}`)
      }

      const switchToWindowRespBody = await switchToWindowResp.json()

      return switchToWindowRespBody.value
    } catch (e) {
      debug(`unable to switch to window via classic webdriver : ${e}`)
      throw e
    }
  }

  /**
   * causes the user agent to navigate the session's current top-level browsing context to a new location.
   * @see https://www.w3.org/TR/webdriver2/#navigate-to
   *
   * @param url - the url of where the context handle is navigating to
   * @returns {Promise<null>}
   */
  async navigateWebdriverClassic (url: string): Promise<null> {
    const navigateUrl = `http://${this.#host}:${this.#port}/session/${this.#sessionId}/url`

    const headers = new Headers()

    headers.append('Content-Type', 'application/json')

    const body = {
      url,
    }

    try {
      const navigateResp = await crossFetch(navigateUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!navigateResp.ok) {
        throw new Error(`${navigateResp.status}: ${navigateResp.statusText}`)
      }

      const navigateRespBody = await navigateResp.json()

      return navigateRespBody.value
    } catch (e) {
      debug(`unable to navigate via classic webdriver : ${e}`)
      throw e
    }
  }

  /**
  * Installs a web extension on the given WebDriver session
  * @see https://searchfox.org/mozilla-central/rev/cc01f11adfacca9cd44a75fd140d2fdd8f9a48d4/testing/geckodriver/src/command.rs#33-36
  * @param {InstallAddOnArgs} opts - options needed to install a web extension.
  */
  async installAddOn (opts: InstallAddOnArgs) {
    const body = {
      path: opts.extensionPath,
      temporary: opts.isTemporary,
    }

    // If the webdriver session is created, we can now install our extension through geckodriver
    const url = `http://${this.#host}:${this.#port}/session/${this.#sessionId}/moz/addon/install`

    const headers = new Headers()

    headers.append('Content-Type', 'application/json')

    try {
      const resp = await crossFetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        // TODO: run this through more scenarios
        throw new Error('Unable to install extension!')
      }
    } catch (e) {
      debug(`unable to install extension: ${e}`)
      throw e
    }
  }

  /**
   * creates an instance of the GeckoDriver server to start a Webdriver session and install the Cypress web extension.
   * @param {StartGeckoDriverArgs} opts - arguments needed to start GeckoDriver, Webdriver, install the web extension, and start the BiDi socket
   * @returns {GeckoDriver} - the GeckoDriver wrapper with Webdriver Classic HTTP API and Mozilla method extensions
   */
  static async create (opts: StartGeckoDriverArgs): Promise<GeckoDriver> {
    if (!GeckoDriver.#instance) {
      debugVerbose('no geckodriver instance exists. starting geckodriver...')

      let errorSource: 'geckodriver:start' | 'webdriver:session:create' | 'webdriver:addon:install' = 'geckodriver:start'

      try {
        const { start: startGeckoDriver } = GeckoDriver.getGeckoDriverPackage()
        const geckoDriverChildProcess = await startGeckoDriver({
          //  connectExisting: true,
          host: opts.host,
          port: opts.port,
          marionetteHost: opts.marionetteHost,
          marionettePort: opts.marionettePort,
          websocketPort: opts.bidiPort,
          // remoteDebuggingPort: opts.remotePort,
          profileRoot: opts.profilePath,
          binary: opts.browser.path,
          jsdebugger: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) || false,
          log: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) ? 'debug' : 'error',
        })

        // using a require statement to make this easier to test with mocha/mockery
        const waitPort = require('wait-port')

        // this needs to throw when it timesout
        await waitPort({
          port: opts.port,
          timeout: 5000,
          output: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) ? 'dots' : 'silent',
        })

        debugVerbose('geckodriver started!')

        geckoDriverChildProcess.stdout?.on('data', (buf) => {
          debug('%s stdout: %s', opts.browser.name, String(buf).trim())
        })

        geckoDriverChildProcess.stderr?.on('data', (buf) => {
          debug('%s stderr: %s', opts.browser.name, String(buf).trim())
        })

        geckoDriverChildProcess.on('exit', (code, signal) => {
          debug('%s exited: %o', opts.browser.name, { code, signal })
        })

        const geckoDriverInstance = new GeckoDriver(geckoDriverChildProcess, opts.host, opts.port)

        // start new Webdriver Session
        debug(`Starting new Webdriver Session through GeckoDriver`)
        errorSource = 'webdriver:session:create'

        await geckoDriverInstance.createWebDriverSession({
          binaryPath: opts.browser.path,
          args: opts.browserArgs,
          env: opts.browserEnv,
          prefs: opts.browserPrefs,
        })

        debug(`Started new Webdriver Session!`)

        // install the Cypress Extension Add-on
        debug(`Installing Cypress Web Extensions`)
        errorSource = 'webdriver:addon:install'
        await Promise.all(_.map(opts.extensions, (path) => {
          return geckoDriverInstance.installAddOn({
            extensionPath: path,
            isTemporary: true,
          })
        }))

        debug(`Cypress Web Extensions now installed!`)

        GeckoDriver.#instance = geckoDriverInstance

        return GeckoDriver.#instance
      } catch (err) {
        GeckoDriver.close()
        debug(`geckodriver failed to start from ${errorSource} for reason: ${err}`)
        throw errors.get('FIREFOX_GECKODRIVER_FAILURE', errorSource, err)
      }
    }

    debugVerbose('geckodriver instance already exists. Returning singleton')

    return GeckoDriver.#instance
  }

  /**
   * closes the GeckoDriver child process
   */
  static close (): void {
    if (GeckoDriver.#instance) {
      debugVerbose('geckodriver instance found. Killing process...')
      const killed = GeckoDriver.#instance.#child_process.kill()

      if (!killed) {
        debugVerbose('geckodriver was not terminated successfully. Please investigate...')

        return
      }

      debugVerbose('geckodriver instance successfully terminated.')
      GeckoDriver.#instance = undefined

      return
    }

    debugVerbose('no geckodriver instance found to terminate. no-op-ing...')
  }
}
