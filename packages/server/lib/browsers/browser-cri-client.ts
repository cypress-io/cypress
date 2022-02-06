import CRI from 'chrome-remote-interface'
import Debug from 'debug'
import { _connectAsync, _getDelayMsForRetry } from './protocol'
import errors from '../errors'
import { create } from './cri-client'

// TODO: Handle reconnects and debugging. Maybe DRY up between cri-client and browser-cri-client

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

export class BrowserCriClient {
  private currentlyAttachedTarget: any
  private constructor (private browserClient: any, private port: number, private onAsynchronousError: Function) {}

  ensureMinimumProtocolVersion = (protocolVersion: string) => {
    return this.getProtocolVersion()
    .then((actual) => {
      const minimum = getMajorMinorVersion(protocolVersion)

      if (!isVersionGte(actual, minimum)) {
        errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actual)
      }
    })
  }

  attachToTargetUrl = async (url: string) => {
    const { targetInfos: targets } = await this.browserClient.send('Target.getTargets')

    const target = targets.find((target) => target.url === url)

    // TODO: Does this need to be in errors.js
    if (!target) {
      throw new Error(`Could not find url target in browser ${url}`)
    }

    this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)

    return this.currentlyAttachedTarget
  }

  attachToNewUrl = async (url: string) => {
    const target = await this.browserClient.send('Target.createTarget', { url })

    this.currentlyAttachedTarget = await create(target.targetId, this.onAsynchronousError, HOST, this.port)

    return this.currentlyAttachedTarget
  }

  closeCurrentTarget = async () => {
    await this.currentlyAttachedTarget.close()
    await this.browserClient.send('Target.closeTarget', { targetId: this.currentlyAttachedTarget.targetId })

    this.currentlyAttachedTarget = undefined
  }

  close = async () => {
    if (this.currentlyAttachedTarget) {
      await this.currentlyAttachedTarget.close()
    }

    await this.browserClient.close()
  }

  static async create (port: number, browserName: string, onAsynchronousError: Function) {
    let retryIndex = 0
    const connectOpts = {
      host: HOST,
      port,
      getDelayMsForRetry: (i) => {
        retryIndex = i

        return _getDelayMsForRetry(i, browserName)
      },
    }

    try {
      await _connectAsync(connectOpts)
    } catch (err) {
      debug('failed to connect to CDP %o', { connectOpts, err })
      errors.throw('CDP_COULD_NOT_CONNECT', port, err, browserName)
    }

    const retry = async (): Promise<BrowserCriClient> => {
      debug('attempting to find CRI target... %o', { retryIndex })

      try {
        const version = await CRI.Version({ host: HOST, port })
        const browserClient = await create(version.webSocketDebuggerUrl, onAsynchronousError)

        return new BrowserCriClient(browserClient, port, onAsynchronousError)
      } catch (err) {
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
