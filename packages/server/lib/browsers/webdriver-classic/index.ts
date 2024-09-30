import debugModule from 'debug'
// using cross fetch to make unit testing easier to mock
import crossFetch from 'cross-fetch'

const debug = debugModule('cypress:server:browsers:webdriver')

type InstallAddOnArgs = {
  path: string
  temporary: boolean
}

namespace WebDriver {
  export namespace Session {
    export type NewResult = {
      capabilities: {
        acceptInsecureCerts: boolean
        browserName: string
        browserVersion: string
        platformName: string
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
        'moz:debuggerAddress': string
        'moz:headless': boolean
        'moz:platformVersion': string
        'moz:processID': number
        'moz:profile': string
        'moz:shutdownTimeout': number
        'moz:webdriverClick': boolean
        'moz:windowless': boolean
        unhandledPromptBehavior: string
        userAgent: string
        sessionId: string
      }
    }
  }
}

export class WebDriverClassic {
  #host: string
  #port: number
  private sessionId: string = ''

  constructor (host: string, port: number) {
    this.#host = host
    this.#port = port
  }

  /**
   * Creates a new WebDriver Session through GeckoDriver. Capabilities are predetermined
   * @see https://w3c.github.io/webdriver.#new-session
   * @returns {Promise<WebDriver.Session.NewResult>} - the results of the Webdriver Session (enabled through remote.active-protocols)
   */
  async createSession (args: {
    capabilities: {[key: string]: any}
  }): Promise<WebDriver.Session.NewResult> {
    const getSessionUrl = `http://${this.#host}:${this.#port}/session`

    const body = {
      capabilities: args.capabilities,
    }

    try {
      const createSessionResp = await crossFetch(getSessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!createSessionResp.ok) {
        const error = new Error(`${createSessionResp.status}: ${createSessionResp.statusText}.`)

        try {
          const resp = await createSessionResp.json()

          error.message = `${error.message } ${resp.value.error}. ${resp.value.message}.`
        } finally {
          // if for some reason we can't parse the response, continue to throw with some information.
          throw error
        }
      }

      const createSessionRespBody = await createSessionResp.json()

      this.sessionId = createSessionRespBody.value.sessionId

      return createSessionRespBody.value
    } catch (e) {
      debug(`unable to create new Webdriver session: ${e}`)
      throw e
    }
  }

  /**
   * Gets available windows handles in the browser. The order in which the window handles are returned is arbitrary.
   * @see https://w3c.github.io/webdriver.#get-window-handles
   *
   * @returns {Promise<string[]>} All the available top-level contexts/handles
   */
  async getWindowHandles (): Promise<string[]> {
    const getWindowHandles = `http://${this.#host}:${this.#port}/session/${this.sessionId}/window/handles`

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
   * Switching windows will select the session's current top-level browsing context as the target for all subsequent commands.
   * In a tabbed browser, this will typically make the tab containing the browsing context the selected tab.
   * @see https://w3c.github.io/webdriver.#dfn-switch-to-window
   *
   * @param {string} handle - the context ID of the window handle
   * @returns {Promise<null>}
   */
  async switchToWindow (handle: string): Promise<null> {
    const switchToWindowUrl = `http://${this.#host}:${this.#port}/session/${this.sessionId}/window`

    const body = {
      handle,
    }

    try {
      const switchToWindowResp = await crossFetch(switchToWindowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
   * maximizes the current window
   * @see https://w3c.github.io/webdriver.#maximize-window
   *
   * @returns {Promise<null>}
   */
  async maximizeWindow (): Promise<null> {
    const maximizeWindowUrl = `http://${this.#host}:${this.#port}/session/${this.sessionId}/window/maximize`

    try {
      const maximizeWindowResp = await crossFetch(maximizeWindowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!maximizeWindowResp.ok) {
        throw new Error(`${maximizeWindowResp.status}: ${maximizeWindowResp.statusText}`)
      }

      const maximizeWindowRespBody = await maximizeWindowResp.json()

      return maximizeWindowRespBody.value
    } catch (e) {
      debug(`unable to maximize window via classic webdriver : ${e}`)
      throw e
    }
  }

  /**
   * causes the user agent to navigate the session's current top-level browsing context to a new location.
   * @see https://w3c.github.io/webdriver.#navigate-to
   *
   * @param url - the url of where the context handle is navigating to
   * @returns {Promise<null>}
   */
  async navigate (url: string): Promise<null> {
    const navigateUrl = `http://${this.#host}:${this.#port}/session/${this.sessionId}/url`

    const body = {
      url,
    }

    try {
      const navigateResp = await crossFetch(navigateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      path: opts.path,
      temporary: opts.temporary,
    }

    // If the webdriver session is created, we can now install our extension through geckodriver
    const url = `http://${this.#host}:${this.#port}/session/${this.sessionId}/moz/addon/install`

    try {
      const resp = await crossFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        throw new Error(`${resp.status}: ${resp.statusText}`)
      }
    } catch (e) {
      debug(`unable to install extension: ${e}`)
      throw e
    }
  }
}
