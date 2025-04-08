import isPlainObject from 'lodash/isPlainObject'
import defaultPuppeteer, { Browser, PuppeteerNode } from 'puppeteer-core'
import { pluginError } from './util'
import { activateMainTab } from './activateMainTab'

export type MessageHandler = (browser: Browser, ...args: any[]) => any | Promise<any>

interface SetupOptions {
  onMessage: Record<string, MessageHandler>
  on: Cypress.PluginEvents
  puppeteer?: PuppeteerNode
}

function messageHandlerError (err: any) {
  const errObject = {} as any

  if (typeof err === 'string') {
    errObject.message = err
  } else if (typeof err === 'object') {
    Object.assign(errObject, {
      name: err.name,
      message: err.message,
      stack: err.stack,
    })
  } else {
    errObject.message = err
  }

  return {
    __error__: errObject,
  }
}

export function setup (options: SetupOptions) {
  if (!options) {
    throw pluginError('Must provide options argument to `setup`.')
  }

  if (!isPlainObject(options)) {
    throw pluginError('The options argument provided to `setup` must be an object.')
  }

  if (!options.on) {
    throw pluginError('Must provide `on` function to `setup`.')
  }

  if (typeof options.on !== 'function') {
    throw pluginError('The `on` option provided to `setup` must be a function.')
  }

  if (!options.onMessage) {
    throw pluginError('Must provide `onMessage` object to `setup`.')
  }

  if (!isPlainObject(options.onMessage)) {
    throw pluginError('The `onMessage` option provided to `setup` must be an object.')
  }

  const puppeteer = options.puppeteer || defaultPuppeteer

  let cypressBrowser: Cypress.Browser
  let debuggerUrl: string

  try {
    options.on('after:browser:launch', (browser: Cypress.Browser, options: Cypress.AfterBrowserLaunchDetails) => {
      cypressBrowser = browser
      debuggerUrl = options.webSocketDebuggerUrl
    })
  } catch (err: any) {
    throw pluginError(`Could not set up \`after:browser:launch\` task. Ensure you are running Cypress >= 13.6.0. The following error was encountered:\n\n${err.stack}`)
  }

  options.on('task', {
    async __cypressPuppeteer__ ({ name, args }: { name: string, args: any[] }) {
      if (!cypressBrowser) {
        return messageHandlerError(pluginError(`Lost the reference to the browser. This usually occurs because the Cypress config was reloaded without the browser re-launching. Close and re-open the browser.`))
      }

      if (cypressBrowser.family !== 'chromium') {
        return messageHandlerError(pluginError(`Only browsers in the "Chromium" family are supported. You are currently running a browser with the family: ${cypressBrowser.family}`))
      }

      const messageHandler = options.onMessage[name]

      if (!messageHandler) {
        return messageHandlerError(pluginError(`Could not find message handler with the name \`${name}\`. Registered message handler names are: ${Object.keys(options.onMessage).join(', ')}.`))
      }

      const handlerType = typeof messageHandler

      if (handlerType !== 'function') {
        return messageHandlerError(pluginError(`Message handlers must be functions, but the message handler for the name \`${name}\` was type \`${handlerType}\`.`))
      }

      let browser: Browser

      try {
        browser = await puppeteer.connect({
          browserWSEndpoint: debuggerUrl,
          defaultViewport: null,
        })
      } catch (err: any) {
        return messageHandlerError(err)
      }

      let result: any
      let error: any

      try {
        result = await messageHandler(browser, ...args)
      } catch (err: any) {
        error = err
      } finally {
        // - Only implemented for Chromium right now. Support for Firefox/webkit
        //   could be added later
        // - Electron doesn't have tabs
        // - Focus doesn't matter for headless browsers and old headless Chrome
        //   doesn't run the extension
        const isHeadedChromium = cypressBrowser.isHeaded && cypressBrowser.family === 'chromium' && cypressBrowser.name !== 'electron'

        if (isHeadedChromium) {
          try {
            await activateMainTab(browser)
          } catch (e) {
            return messageHandlerError(pluginError('Cannot communicate with the Cypress Chrome extension. Ensure the extension is enabled when using the Puppeteer plugin.'))
          }
        }

        await browser.disconnect()
      }

      if (error) {
        return messageHandlerError(error)
      }

      // cy.task() errors if `undefined` is returned, so return null in that case
      return result === undefined ? null : result
    },
  })
}
