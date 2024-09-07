import debugModule from 'debug'
import { ChildProcess } from 'child_process'
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js'
import { start as startGeckoDriver } from 'geckodriver'
import _ from 'lodash'
import waitPort from 'wait-port'
import { BidiAutomation } from '../bidi/automation/bidi-automation'
import type { Automation } from '../../automation'

const GECKODRIVER_DEBUG_NAMESPACE = 'cypress:server:browsers:geckodriver'
const GECKODRIVER_DEBUG_NAMESPACE_VERBOSE = 'cypress-verbose:server:browsers:geckodriver'
const debug = debugModule(GECKODRIVER_DEBUG_NAMESPACE)
const debugVerbose = debugModule(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE)

type StartGeckoDriverArgs = {
  host: string
  port: number
  marionetteHost: string
  marionettePort: number
  remotePort: number
  binary: string
  profileRoot: string
  browserName: string
  extensions: string[]
  useWebdriverBiDi: boolean
  automation: Automation
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
      }
    } & Bidi.Session.NewResult
  }
}

/**
 * Singleton Class of the GeckoDriver as we only allow one to run at a given time
 */
export class GeckoDriver {
  static #instance: GeckoDriver | undefined
  #child_process: ChildProcess
  #host: string
  #port: number
  #sessionId: string = ''
  bidiAutomationClient?: BidiAutomation

  constructor (child_process: ChildProcess, host: string, port: number) {
    this.#child_process = child_process
    this.#host = host
    this.#port = port
  }

  /**
   * Creates a new Webdriver BiDi Session through GeckoDriver. Capabilities are predetermined
   * @see https://searchfox.org/mozilla-central/rev/cc01f11adfacca9cd44a75fd140d2fdd8f9a48d4/testing/geckodriver/src/marionette.rs#126
   * @returns {Promise<WebDriver.Session.NewResult>} - the results of the Webdriver BiDi Session (enabled through remote.active-protocols)
   */
  private createWebDriverSession: () => Promise<WebDriver.Session.NewResult> = async () => {
    const getSessionUrl = `http://${this.#host}:${this.#port}/session`

    const headers = new Headers()

    headers.append('Content-Type', 'application/json')

    const body = {
      capabilities: {
        alwaysMatch: {
          acceptInsecureCerts: true,
          unhandledPromptBehavior: {
            default: 'ignore',
          },
          webSocketUrl: true,
        },
      },
    }

    try {
      const createSessionResp = await fetch(getSessionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const createSessionRespBody = await createSessionResp.json()

      this.#sessionId = createSessionRespBody.value.sessionId

      return createSessionRespBody.value
    } catch (e) {
      debug(`unable to create new Webdriver session: ${e}`)
      throw e
    }
  }

  /**
   * Gets available windows handles in the browser. The order in which the window handles are returned is arbitrary.
   * @see https://www.w3.org/TR/webdriver2/#get-window-handles
   *
   * NOTE: only used when BiDi is not enabled
   *
   * @returns {Promise<string[]>} All the available top-level contexts/handles
   */
  async getWindowHandlesWebDriverClassic (): Promise<string[]> {
    const getWindowHandles = `http://${this.#host}:${this.#port}/session/${this.#sessionId}/window/handles`

    try {
      const getWindowHandlesResp = await fetch(getWindowHandles)

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
   * NOTE: only used when BiDi is not enabled
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
      const switchToWindowResp = await fetch(switchToWindowUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

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
   * NOTE: only used when BiDi is not enabled
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
      const navigateResp = await fetch(navigateUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      const navigateRespBody = await navigateResp.json()

      return navigateRespBody.value
    } catch (e) {
      debug(`unable to navigate via classic webdriver : ${e}`)
      throw e
    }
  }

  /**
  * Installs a web extension on the given Webdriver BiDi session
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
      const resp = await fetch(url, {
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
      const geckoDriverChildProcess = await startGeckoDriver({
        host: opts.host,
        port: opts.port,
        marionetteHost: opts.marionetteHost,
        marionettePort: opts.marionettePort,
        websocketPort: opts.remotePort,
        // TODO: these need to be escaped properly
        // profileRoot: `\"${profile.path()}\"`,
        jsdebugger: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) || false,
        log: debugModule.enabled(GECKODRIVER_DEBUG_NAMESPACE_VERBOSE) ? 'debug' : 'error',
        // TODO: these need to be escaped properly
        //  binary: `\"${browser.path}\"` as unknown as string,
      })

      await waitPort({
        port: opts.port,
      })

      debugVerbose('geckodriver started!')

      geckoDriverChildProcess.stdout.on('data', (buf) => {
        debug('%s stdout: %s', opts.browserName, String(buf).trim())
      })

      geckoDriverChildProcess.stderr.on('data', (buf) => {
        debug('%s stderr: %s', opts.browserName, String(buf).trim())
      })

      geckoDriverChildProcess.on('exit', (code, signal) => {
        debug('%s exited: %o', opts.browserName, { code, signal })
      })

      GeckoDriver.#instance = new GeckoDriver(geckoDriverChildProcess, opts.host, opts.port)

      // start new Webdriver Session
      debug(`Starting new Webdriver Session through GeckoDriver`)
      const webdriverSession = await GeckoDriver.#instance.createWebDriverSession()

      debug(`Started new Webdriver Session!`)

      // install the Cypress Extension Add-on
      debug(`Installing Cypress Web Extensions`)

      await Promise.all(_.map(opts.extensions, (path) => {
        return GeckoDriver.#instance?.installAddOn({
          extensionPath: path,
          isTemporary: true,
        })
      }))

      debug(`Cypress Web Extensions now installed!`)

      if (opts.useWebdriverBiDi) {
        debug(`WebdriverBiDi option set. Setting up BiDi automation client.`)
        GeckoDriver.#instance.bidiAutomationClient = await BidiAutomation.create(webdriverSession.capabilities.webSocketUrl as string, opts.automation)
      }

      return GeckoDriver.#instance
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
      }

      debugVerbose('geckodriver instance successfully terminated.')

      return
    }

    debugVerbose('no geckodriver instance found to terminate. no-op-ing...')
  }
}
