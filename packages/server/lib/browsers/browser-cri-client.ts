import CRI from 'chrome-remote-interface'
import Debug from 'debug'
import { _connectAsync, _getDelayMsForRetry } from './protocol'
import * as errors from '../errors'
import { create, CriClient } from './cri-client'
import type { ProtocolManagerShape } from '@packages/types'

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

const ensureLiveBrowser = async (hosts: string[], port: number, browserName: string) => {
  // since we may be attempting to connect to multiple hosts, 'connected'
  // is set to true once one of the connections succeeds so the others
  // can be cancelled
  let connected = false

  const tryBrowserConnection = async (host: string, port: number, browserName: string): Promise<string | undefined> => {
    const connectOpts = {
      host,
      port,
      getDelayMsForRetry: (i) => {
        // if we successfully connected to a different host, cancel any remaining connection attempts
        if (connected) {
          debug('cancelling any additional retries %o', { host, port })

          return
        }

        return _getDelayMsForRetry(i, browserName)
      },
    }

    await _connectAsync(connectOpts)
    connected = true

    return host
  }

  const connections = hosts.map((host) => {
    return tryBrowserConnection(host, port, browserName)
    .catch((err) => {
      // don't throw an error if we've already connected
      if (!connected) {
        const e = errors.get('CDP_COULD_NOT_CONNECT', browserName, port, err)

        e.cause = {
          err,
          host,
          port,
        }

        throw e
      }
    })
  })

  // go through all of the hosts and attempt to make a connection
  return Promise.any(connections)
  // this only fires if ALL of the connections fail
  // otherwise if 1 succeeds and 1+ fails it won't log anything
  .catch((aggErr: AggregateError) => {
    aggErr.errors.forEach((e) => {
      const { host, port, err } = e.cause

      debug('failed to connect to CDP %o', { host, port, err })
    })

    // throw the first error we received from the aggregate
    throw aggErr.errors[0]
  })
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
  currentlyAttachedTarget: CriClient | undefined
  // whenever we instantiate the instance we're already connected bc
  // we receive an underlying CRI connection
  connected = true
  closing = false
  closed = false
  resettingBrowserTargets = false

  private constructor (private browserClient: CriClient, private versionInfo, public host: string, public port: number, private browserName: string, private onAsynchronousError: Function, private protocolManager?: ProtocolManagerShape) { }

  /**
   * Factory method for the browser cri client. Connects to the browser and then returns a chrome remote interface wrapper around the
   * browser target
   *
   * @param hosts the hosts to which to attempt to connect
   * @param port the port to which to connect
   * @param browserName the display name of the browser being launched
   * @param onAsynchronousError callback for any cdp fatal errors
   * @returns a wrapper around the chrome remote interface that is connected to the browser target
   */
  static async create (hosts: string[], port: number, browserName: string, onAsynchronousError: Function, onReconnect?: (client: CriClient) => void, protocolManager?: ProtocolManagerShape): Promise<BrowserCriClient> {
    const host = await ensureLiveBrowser(hosts, port, browserName)

    return retryWithIncreasingDelay(async () => {
      const versionInfo = await CRI.Version({ host, port, useHostName: true })
      const browserClient = await create(versionInfo.webSocketDebuggerUrl, onAsynchronousError, undefined, undefined, onReconnect)

      const browserCriClient = new BrowserCriClient(browserClient, versionInfo, host!, port, browserName, onAsynchronousError, protocolManager)

      await browserClient.send('Target.setDiscoverTargets', { discover: true })

      browserClient.on('Target.targetDestroyed', (event) => {
        debug('Target.targetDestroyed %o', {
          event,
          closing: browserCriClient.closing,
          closed: browserCriClient.closed,
          resettingBrowserTargets: browserCriClient.resettingBrowserTargets,
        })

        if (event.targetId === browserCriClient.currentlyAttachedTarget?.targetId) {
          // always tell the page to stop reconnecting since the page or the browser are destroyed
          debug('closing target because of destroyed event %o', { targetId: event.targetId })
          browserCriClient.currentlyAttachedTarget.close().catch(() => {})
        }

        // this event could fire either expectedly or unexpectedly
        // it's not a problem if we're expected to be closing the browser naturally
        // and not as a result of an unexpected page or browser closure
        if (browserCriClient.closing || browserCriClient.closed || browserCriClient.resettingBrowserTargets) {
          // do nothing, we're good
          return
        }

        // otherwise...
        // the page or browser closed in an unexpected manner and we need to bubble up this error
        // by calling onError() with either browser or page was closed
      })

      browserClient.on('Target.targetCrashed', (event) => {
        if (event.targetId === browserCriClient.currentlyAttachedTarget?.targetId) {
          debug('closing target because of crashed event %o', { targetId: event.targetId })
          browserCriClient.currentlyAttachedTarget.close().catch(() => {})
        }
      })

      return browserCriClient
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
  attachToTargetUrl = async (url: string): Promise<CriClient> => {
    // Continue trying to re-attach until successful.
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

      this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, this.host, this.port)
      await this.protocolManager?.connectToBrowser(this.currentlyAttachedTarget)

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
      this.resettingBrowserTargets = true

      throw new Error('Cannot close target because no target is currently attached')
    }

    let target

    // If we are keeping a tab open, we need to first launch a new default tab prior to closing the existing one
    if (shouldKeepTabOpen) {
      target = await this.browserClient.send('Target.createTarget', { url: 'about:blank' })
    }

    debug('Closing current target %s', this.currentlyAttachedTarget.targetId)

    await this.browserClient.send('Target.closeTarget', { targetId: this.currentlyAttachedTarget.targetId })

    debug('Target closed', this.currentlyAttachedTarget.targetId)

    await this.currentlyAttachedTarget.close().catch()

    debug('Target client closed', this.currentlyAttachedTarget.targetId)

    if (target) {
      this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, this.host, this.port)
    }

    this.resettingBrowserTargets = false
  }

  /**
   * Closes the browser client socket as well as the socket for the currently attached page target
   */
  close = async () => {
    if (this.connected === false) {
      debug('browser cri client is already closed')

      return
    }

    if (this.currentlyAttachedTarget) {
      await this.currentlyAttachedTarget.close()
    }

    this.closing = true
    this.connected = false

    await this.browserClient.close()

    this.closed = false
  }
}
