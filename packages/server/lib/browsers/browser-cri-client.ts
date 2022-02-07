import CRI from 'chrome-remote-interface'
import Debug from 'debug'
import { _connectAsync, _getDelayMsForRetry } from './protocol'
import errors from '../errors'
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
    errors.throw('CDP_COULD_NOT_CONNECT', port, err, browserName)
  }
}

export class BrowserCriClient {
  private currentlyAttachedTarget: any
  private constructor (private browserClient: CRIWrapper.Client, private port: number, private onAsynchronousError: Function) {}

  /**
   * Factory method for the browser cri client. Connects to the browser and then returns a chrome remote interface wrapper around the
   * browser target
   *
   * @param port the port to which to connect
   * @param browserName the display name of the browser being launched
   * @param onAsynchronousError callback for any cdp fatal errors
   * @returns a wrapper around the chrome remote interface that is connected to the browser target
   */
  static async create (port: number, browserName: string, onAsynchronousError: Function): Promise<BrowserCriClient> {
    await ensureLiveBrowser(port, browserName)

    let retryIndex = 0
    const retry = async (): Promise<BrowserCriClient> => {
      debug('attempting to find CRI target... %o', { retryIndex })

      try {
        const version = await CRI.Version({ host: HOST, port })
        const browserClient = await create(version.webSocketDebuggerUrl, onAsynchronousError)

        return new BrowserCriClient(browserClient, port, onAsynchronousError)
      } catch (err) {
        retryIndex++
        const delay = _getDelayMsForRetry(retryIndex, browserName)

        debug('error finding CRI target, maybe retrying %o', { delay, err })

        if (typeof delay === 'undefined') {
          throw err
        }

        await new Promise((resolve) => setTimeout(resolve, delay))

        return retry()
      }
    }

    return retry()
  }

  /**
   * Ensures that the minimum protocol version for the browser is met
   *
   * @param protocolVersion the minimum version to ensure
   */
  ensureMinimumProtocolVersion = async (protocolVersion: string): Promise<void> => {
    const actualVersion = await this.getProtocolVersion()

    const minimum = getMajorMinorVersion(protocolVersion)

    if (!isVersionGte(actualVersion, minimum)) {
      errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actualVersion)
    }
  }

  /**
   * Attaches to a target with the given url
   *
   * @param url the url to attach to
   * @returns the chrome remote interface wrapper for the target
   */
  attachToTargetUrl = async (url: string): Promise<CRIWrapper.Client> => {
    debug('Attaching to target url %s', url)
    const { targetInfos: targets } = await this.browserClient.send('Target.getTargets')

    const target = targets.find((target) => target.url === url)

    if (!target) {
      throw new Error(`Could not find url target in browser ${url}. Targets were ${JSON.stringify(targets)}`)
    }

    this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)

    return this.currentlyAttachedTarget
  }

  /**
   * Creates a new target with the given url and then attaches to it
   *
   * @param url the url to create and attach to
   * @returns the chrome remote interface wrapper for the target
   */
  attachToNewUrl = async (url: string): Promise<CRIWrapper.Client> => {
    debug('Attaching to new url %s', url)
    const target = await this.browserClient.send('Target.createTarget', { url })

    this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)

    return this.currentlyAttachedTarget
  }

  /**
   * Closes the currently attached page target
   */
  closeCurrentTarget = async (): Promise<void> => {
    debug('Closing current target %s', this.currentlyAttachedTarget.targetId)

    await this.currentlyAttachedTarget.close()
    await this.browserClient.send('Target.closeTarget', { targetId: this.currentlyAttachedTarget.targetId })

    this.currentlyAttachedTarget = undefined
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

  private getProtocolVersion = async () => {
    let protocolVersion

    try {
      protocolVersion = (await this.browserClient.send('Browser.getVersion')).protocolVersion
    } catch {
      protocolVersion = '0.0'
    }

    return getMajorMinorVersion(protocolVersion)
  }
}
