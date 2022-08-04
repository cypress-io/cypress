import debugModule from 'debug'

import type { Browser } from './types'
import type { Automation } from '../automation'
import type { LaunchedBrowser } from '@packages/launcher/lib/browsers'
import { WebkitAutomation } from './webkit-automation'
import { EventEmitter } from 'stream'
import type playwright from 'playwright-webkit'

const debug = debugModule('cypress:server:browsers:webkit')

let wkAutomation: WebkitAutomation | undefined

export async function connectToNewSpec (browser: Browser, options, automation: Automation) {
  if (!wkAutomation) throw new Error('connectToNewSpec called without wkAutomation')

  automation.use(wkAutomation)
  await options.onInitializeNewBrowserTab()
  await wkAutomation.reset(options.url)
}

export async function open (browser: Browser, url, options: any = {}, automation: Automation): Promise<LaunchedBrowser> {
  // resolve pw from user's project path
  const pwModulePath = require.resolve('playwright-webkit', { paths: [process.cwd()] })
  const pw = require(pwModulePath) as typeof playwright

  const pwBrowser = await pw.webkit.launch({
    proxy: {
      server: options.proxyServer
    },
    downloadsPath: options.downloadsFolder,
    headless: browser.isHeadless
  })

  // const launchedBrowser = await launch(browser, 'about:blank', null, [
  //   '--inspector-pipe',
  //   `--user-data-dir=${userDir}`,
  //   ...getProxyArgs(options.proxyServer),
  //   ...(browser.isHeadless ? ['--headless'] : []),
  // ], null, {
  //   pipeStdio: true,
  // })

  // let pwPage = await pwBrowser.newPage()

  let pwPage: playwright.Page

  async function resetPage (_url) {
    // new context comes with new cache + storage
    const newContext = await pwBrowser.newContext({
      ignoreHTTPSErrors: true
    })
    const oldPwPage = pwPage

    pwPage = await newContext.newPage()

    let promises: Promise<any>[] = []

    if (oldPwPage) promises.push(oldPwPage.context().close())

    if (_url) promises.push(pwPage.goto(_url))

    if (promises.length) await Promise.all(promises)

    return pwPage
  }

  pwPage = await resetPage(url)

  wkAutomation = new WebkitAutomation(resetPage, pwPage)

  automation.use(wkAutomation)

  function getStubBrowser () {
    const b = new EventEmitter()

    b.kill = () => {
      pwBrowser.close()
      wkAutomation = undefined
    }

    return b
  }

  return getStubBrowser()
}
