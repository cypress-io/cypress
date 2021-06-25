import debugModule from 'debug'
import playwright, { BrowserServer, Browser as PlaywrightBrowser, LaunchOptions } from 'playwright'

import { PlaywrightAutomation, create, PlaywrightWrapper } from './playwright_automation'
import { Browser, BrowserInstance } from './types'
import { defaultPreferences as firefoxDefaultPreferences } from './firefox'
import extension from '@packages/extension'

const debugBrowser = debugModule('cypress:server:browsers:playwright:browser')

const _setAutomation = (client, automation, context) => {
  return automation.use(
    PlaywrightAutomation(client.send, context),
  )
}

// Helper which determines whether Playwright debug output should be logged or not
const playwrightDebugLogger = {
  isEnabled: (name: string, severity: 'verbose' | 'info' | 'warning' | 'error'): boolean => {
    return name.length >= 0 && (severity === 'warning' || severity === 'error')
  },
  log: (name: string, severity: 'verbose'|'info'|'warning'|'error', message: string|Error, args: Array<Object>): void => {
    debugBrowser(`[${name}] ${severity} ${message}`, ...args)
  },
}

// Generate browser specific configuration
function getBrowserConfiguration (browser: Browser, options: any = {}): Record<string, any> {
  console.log('!!! Weyert !!! proxyServer:', ps)
  dbg('!!! Weyert !!! proxyServer:', ps)

  // If Firefox is the target browser, we should set the firefox specific user preferences
  if (browser.name === 'firefox') {
    return {
      firefoxUserPrefs: firefoxDefaultPreferences,
    }
  }

  // If Chrome is the target browser, we should set the Chrome arguments
  if (browser.name === 'chromium') {
    const combinedChromeConfiguration: Array<string> = Array.from(CHROME_ARGUMENTS)

    if (combinedChromeConfiguration) {
      // If proxyServer is defined, pass it to the Chrome browser instance
      const ps = options.proxyServer

      if (ps) {
        combinedChromeConfiguration.push(`--proxy-server=${ps}`)
        // Ensure that Chrome is not bypassing localhost/loopback when proying requests
        combinedChromeConfiguration.push(`--proxy-bypass-list=<-loopback>`)

        // Ensure the Cypress extension for Chrome browsers is loaded
        const extensionPath = extension.getPathToTheme()

        combinedChromeConfiguration.push(`--load-extension=${extensionPath}`)
      }

      // If chromeWebSecurity option is disabled, pass the appropriate chrome arguments to the browser intance
      if (options.chromeWebSecurity === false) {
        combinedChromeConfiguration.push('--disable-web-security')
        combinedChromeConfiguration.push('--allow-running-insecure-content')
      }
    }

    return {
      args: combinedChromeConfiguration,

      // Disable the chromium sandbox mode
      chromiumSandbox: false,

      //
      userAgent: options.userAgent,

      // Enable devtools in Chromium
      devtools: false,
    } as LaunchOptions
  }

  return {}
}

async function createBrowserInstance (browser: Browser, options: any = {}): Promise<[BrowserServer, PlaywrightBrowser]> {
  // If the given browser name is not supported by Playwright we throw an error
  if (!playwright.hasOwnProperty(browser.name)) {
    throw new Error(`Playwright browser ${browser.name} is not available.`)
  }

  const browserConfiguration = getBrowserConfiguration(browser, options)

  // Create browser instance
  const playwrightBrowserType = playwright[browser.name]

  // TODO: determine if we want launchServer or launchPersisentContext (support profile dirs)
  const playwrightBrowser = await playwrightBrowserType.launchServer({
    headless: !!browser.isHeadless,
    // Combine our Cypress related configuration with the standard Playwright arguments
    ignoreDefaultArgs: false,
    timeout: 0,

    // Browser specific configuration
    ...browserConfiguration,

    // Setup the proxy configuration for the browser instance so that it uses
    // the Cypress proxy server
    proxy: {
      server: options.proxyServer,
      bypass: '',
    },

    // Enable debug logging when user opts in
    logger: playwrightDebugLogger,
  })

  const wsEndpoint = playwrightBrowser.wsEndpoint()

  const browserConnection: PlaywrightBrowser = await playwrightBrowserType.connect({
    wsEndpoint,
    timeout: 30000,

    // Slow down the Playwright browser by 20ms
    slowMo: 20,
  })

  return [playwrightBrowser, browserConnection]
}

/**
 * Create an instance of the choosen Playwright browser
 * @param browser the selected browser
 * @param url the url to open in the browser
 * @param options the Cypress options
 * @param automation the automation instance (?)
 * @returns
 */
export async function open (browser: Browser, url: string, options: any = {}, automation: any): Promise<BrowserInstance> {
  const [browserInstance, browserConnection] = await createBrowserInstance(browser, options)

  // Create an instance of the browser window
  const browserContext = await browserConnection.newContext({
    // Allow the browser to accept downloads
    acceptDownloads: true,

    // Toggles bypassing page's Content-Security-Policy.
    bypassCSP: true, // TODO: should this be disabled??

    // Ignore self-signed or non-trusted certificates warning
    ignoreHTTPSErrors: true,

    // Ensure Javascript is enabled
    javaScriptEnabled: true,

    // Fixes blurry screen on retina screens (mainly in Webkit)
    deviceScaleFactor: 2,
  })

  // Create an isntance of the playwright automation
  const wsEndpoint = browserInstance.wsEndpoint()
  const automationClient: PlaywrightWrapper = await create({
    target: wsEndpoint,
    browserContext,
    process: browserInstance.process(),
  }, options.onError).timeout(5000)

  // Assign the automation client
  _setAutomation(automationClient, automation, browserContext)

  // Navigate to the requested url as part of the test case via the automation client
  await automationClient.navigate(url)
  await automationClient.handleDownloads(options.downloadsFolder, automation)

  // Patched the 'BrowserInstance'-object that Cypress is expecting to ensure
  // Playwright browser instances get killed correcly
  const launchedBrowser = browserInstance.process()

  const originalBrowserKill = launchedBrowser.kill

  // @ts-expect-error 2322
  launchedBrowser.kill = async (...args) => {
    await automationClient.close(browserInstance)

    const response = originalBrowserKill.apply(launchedBrowser, args)

    void browserInstance.close()

    return response
  }

  return launchedBrowser
}

// TODO: find out why we can't use the exported constant from `chrome.ts`
const CHROME_ARGUMENTS = [
  '--test-type',
  '--ignore-certificate-errors',
  '--start-maximized',
  '--silent-debugger-extension-api',
  '--no-default-browser-check',
  '--no-first-run',
  '--noerrdialogs',
  '--enable-fixed-layout',
  '--disable-popup-blocking',
  '--disable-password-generation',
  '--disable-single-click-autofill',
  '--disable-prompt-on-repos',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-renderer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-restore-session-state',
  '--disable-new-profile-management',
  '--disable-new-avatar-menu',
  '--allow-insecure-localhost',
  '--reduce-security-for-testing',
  '--enable-automation',
  '--disable-print-preview',

  '--disable-device-discovery-notifications',

  // https://github.com/cypress-io/cypress/issues/2376
  '--autoplay-policy=no-user-gesture-required',

  // http://www.chromium.org/Home/chromium-security/site-isolation
  // https://github.com/cypress-io/cypress/issues/1951
  '--disable-site-isolation-trials',

  // the following come frome chromedriver
  // https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
  '--metrics-recording-only',
  '--disable-prompt-on-repost',
  '--disable-hang-monitor',
  '--disable-sync',
  // this flag is causing throttling of XHR callbacks for
  // as much as 30 seconds. If you VNC in and open dev tools or
  // click on a button, it'll "instantly" work. with this
  // option enabled, it will time out some of our tests in circle
  // "--disable-background-networking"
  '--disable-web-resources',
  '--safebrowsing-disable-download-protection',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  // Simulate when chrome needs an update.
  // This prevents an 'update' from displaying til the given date
  `--simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'`,
  '--disable-default-apps',

  // These flags are for webcam/WebRTC testing
  // https://github.com/cypress-io/cypress/issues/2704
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',

  // so Cypress commands don't get throttled
  // https://github.com/cypress-io/cypress/issues/5132
  '--disable-ipc-flooding-protection',

  // misc. options puppeteer passes
  // https://github.com/cypress-io/cypress/issues/3633
  '--disable-backgrounding-occluded-window',
  '--disable-breakpad',
  '--password-store=basic',
  '--use-mock-keychain',

  // write shared memory files into '/tmp' instead of '/dev/shm'
  // https://github.com/cypress-io/cypress/issues/5336
  '--disable-dev-shm-usage',
]
