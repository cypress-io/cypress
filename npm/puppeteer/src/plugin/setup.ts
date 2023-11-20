import isPlainObject from 'lodash/isPlainObject'
import defaultPuppeteer, { Browser, PuppeteerNode } from 'puppeteer-core'
import { pluginError } from './util'

type MessageHandler = (browser: Browser, ...args: any[]) => any | Promise<any>

interface SetupOptions {
  onMessage: Record<string, MessageHandler>
  on: Cypress.PluginEvents
  puppeteer?: PuppeteerNode
}

function callbackError (err: any) {
  return {
    __error__: err,
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

  let debuggerUrl: string

  try {
    options.on('after:browser:launch', async (_, options) => {
      debuggerUrl = options.webSocketDebuggerUrl
    })
  } catch (err: any) {
    throw pluginError(`Could not set up \`after:browser:launch\` task. Ensure you are running Cypress >= 13.6.0. The following error was encountered:\n\n${err.stack}`)
  }

  options.on('task', {
    async __cypressPuppeteer__ ({ name, args }: { name: string, args: any[] }) {
      const callback = options.onMessage[name]

      if (!callback) {
        return callbackError(pluginError(`Could not find callback with the name \`${name}\`. Registered callback names are: ${Object.keys(options.onMessage).join(', ')}.`))
      }

      const callbackType = typeof callback

      if (callbackType !== 'function') {
        return callbackError(pluginError(`Callbacks must be a function, but the callback for the name \`${name}\` was type \`${callbackType}\`.`))
      }

      // TODO: wrap error message?
      const browser = await puppeteer.connect({
        browserWSEndpoint: debuggerUrl,
        defaultViewport: null,
      })

      let result: any
      let error: any

      try {
        result = await callback(browser, ...args)
      } catch (err: any) {
        error = err
      } finally {
        await browser.disconnect()
      }

      if (error) {
        return callbackError(error)
      }

      // cy.task() errors if `undefined` is returned, so return null in that case
      return result === undefined ? null : result
    },
  })
}
