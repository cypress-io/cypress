import CRI from 'chrome-remote-interface'
import Debug from 'debug'
import { _connectAsync, _getDelayMsForRetry } from './protocol'
import * as errors from '../errors'
import { create, CRIWrapper } from './cri-client'

const HOST = '127.0.0.1'

const debug = Debug('cypress:server:browsers:browser-cri-client')

interface Version {
  major: number
  minor: number
}

const isVersionGte = (a: Version, b: Version) => {
  return a.major > b.major || (a.major === b.major && a.minor >= b.minor)
}

const getMajorMinorVersion = (version: string): Version => {
  const [major, minor] = version.split('.', 2).map(Number)

  return { major, minor }
}

const ensureLiveBrowser = async (port: number, browserName: string) => {
  const connectOpts = {
    host: HOST,
    port,
    getDelayMsForRetry: (i) => {
      return _getDelayMsForRetry(i, browserName)
    },
  }

  try {
    await _connectAsync(connectOpts)
  } catch (err) {
    debug('failed to connect to CDP %o', { connectOpts, err })
    errors.throwErr('CDP_COULD_NOT_CONNECT', browserName, port, err)
  }
}

const retryWithIncreasingDelay = async <T>(retryable: () => Promise<T>, browserName: string, port: number): Promise<T> => {
  let retryIndex = 0

  const retry = async () => {
    try {
      return await retryable()
    } catch (err) {
      retryIndex++
      const delay = _getDelayMsForRetry(retryIndex, browserName)

      debug('error finding browser target, maybe retrying %o', { delay, err })

      if (typeof delay === 'undefined') {
        debug('failed to connect to CDP %o', { err })
        errors.throwErr('CDP_COULD_NOT_CONNECT', browserName, port, err)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))

      return retry()
    }
  }

  return retry()
}

export class BrowserCriClient {
  currentlyAttachedTarget: CRIWrapper.Client | undefined
  private constructor (private browserClient: CRIWrapper.Client, private versionInfo, private port: number, private browserName: string, private onAsynchronousError: Function) {}

  /**
   * Factory method for the browser cri client. Connects to the browser and then returns a chrome remote interface wrapper around the
   * browser target
   *
   * @param port the port to which to connect
   * @param browserName the display name of the browser being launched
   * @param onAsynchronousError callback for any cdp fatal errors
   * @returns a wrapper around the chrome remote interface that is connected to the browser target
   */
  static async create (port: number, browserName: string, onAsynchronousError: Function, onReconnect?: (client: CRIWrapper.Client) => void): Promise<BrowserCriClient> {
    await ensureLiveBrowser(port, browserName)

    return retryWithIncreasingDelay(async () => {
      const versionInfo = await CRI.Version({ host: HOST, port })
      const browserClient = await create(versionInfo.webSocketDebuggerUrl, onAsynchronousError, undefined, undefined, onReconnect)

      return new BrowserCriClient(browserClient, versionInfo, port, browserName, onAsynchronousError)
    }, browserName, port)
  }

  /**
   * Ensures that the minimum protocol version for the browser is met
   *
   * @param protocolVersion the minimum version to ensure
   */
  ensureMinimumProtocolVersion = (protocolVersion: string): void => {
    const actualVersion = getMajorMinorVersion(this.versionInfo['Protocol-Version'])
    const minimum = getMajorMinorVersion(protocolVersion)

    if (!isVersionGte(actualVersion, minimum)) {
      errors.throwErr('CDP_VERSION_TOO_OLD', protocolVersion, actualVersion)
    }
  }

  /**
   * Attaches to a target with the given url
   *
   * @param url the url to attach to
   * @returns the chrome remote interface wrapper for the target
   */
  attachToTargetUrl = async (url: string): Promise<CRIWrapper.Client> => {
    // Continue trying to re-attach until succcessful.
    // If the browser opens slowly, this will fail until
    // The browser and automation API is ready, so we try a few
    // times until eventually timing out.
    return retryWithIncreasingDelay(async () => {
      debug('Attaching to target url %s', url)
      const { targetInfos: targets } = await this.browserClient.send('Target.getTargets')

      const target = targets.find((target) => target.url === url)

      if (!target) {
        throw new Error(`Could not find url target in browser ${url}. Targets were ${JSON.stringify(targets)}`)
      }

      this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)

      return this.currentlyAttachedTarget
    }, this.browserName, this.port)
  }

  /**
   * Resets the browser's targets optionally keeping a tab open
   *
   * @param shouldKeepTabOpen whether or not to keep the tab open
   */
  resetBrowserTargets = async (shouldKeepTabOpen: boolean): Promise<void> => {
    if (!this.currentlyAttachedTarget) {
      throw new Error('Cannot close target because no target is currently attached')
    }

    let target

    // If we are keeping a tab open, we need to first launch a new default tab prior to closing the existing one
    if (shouldKeepTabOpen) {
      target = await this.browserClient.send('Target.createTarget', { url: 'about:blank' })
    }

    debug('Closing current target %s', this.currentlyAttachedTarget.targetId)

    await Promise.all([
      // If this fails, it shouldn't prevent us from continuing
      this.currentlyAttachedTarget.close().catch(),
      this.browserClient.send('Target.closeTarget', { targetId: this.currentlyAttachedTarget.targetId }),
    ])

    if (target) {
      this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)
    }
  }

  /**
   * Closes the browser client socket as well as the socket for the currently attached page target
   */
  close = async () => {
    if (this.currentlyAttachedTarget) {
      await this.currentlyAttachedTarget.close()
    }

    await this.browserClient.close()
  }
}
