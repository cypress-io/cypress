import Bluebird from 'bluebird'
import debugModule from 'debug'
import errors from '../errors'

import * as CriClient from './cri-client'
import { CdpAutomation } from './cdp_automation'
import utils from './utils'
import { Browser } from './types'

const debug = debugModule('cypress:server:browsers:webkit')

function getProxyArgs (proxyServer: string): string[] {
  if (process.platform === 'win32') {
    return [`--curl-proxy=${proxyServer}`]
  }

  // TODO: bypass loopback?
  return [`--proxy=${proxyServer}`]
}

export async function open (browser: Browser, url, options: CypressConfiguration = {}, automation) {
  const { isTextTerminal } = options

  const userDir = utils.getProfileDir(browser, isTextTerminal)

  const launchedBrowser = await utils.launch(browser, 'about:blank', [
    '--inspector-pipe',
    `--user-data-dir=${userDir}`,
    ...getProxyArgs(options.proxyServer),
    ...(browser.isHeadless ? ['--headless'] : []),
  ], {
    pipeStdio: true,
  })

  const client = await CriClient.create({ process: launchedBrowser }, options.onError)
  .timeout(5000)
  .catch(Bluebird.TimeoutError, async () => {
    errors.throwErr('CDP_STDIO_TIMEOUT', browser.displayName, 5000)
  })

  if (!client) {
    throw new Error('missing CriClient')
  }

  automation.use(
    CdpAutomation(client.send),
  )

  // monkey-patch the .kill method to that the CDP connection is closed
  const originalBrowserKill = launchedBrowser.kill

  launchedBrowser.kill = async (...args) => {
    debug('closing remote interface client')

    await client.close()
    debug('closing chrome')

    await originalBrowserKill.apply(launchedBrowser, args)
  }

  await client.navigate(url)
  await client.handleDownloads(options.downloadsFolder, automation)

  return launchedBrowser
}
