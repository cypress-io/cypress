import _ from 'lodash'
import CRI from 'chrome-remote-interface'
import Bluebird from 'bluebird'
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

export async function createBrowserClient (port: number, browserName: string, onAsynchronousError: Function) {
  let retryIndex = 0
  const retry = async () => {
    debug('attempting to find CRI target... %o', { retryIndex })

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

    try {
      let currentlyAttachedTarget
      const version = await CRI.Version({ host: HOST, port })
      const browserClient = await CRI({ target: version.webSocketDebuggerUrl, local: true })

      const ensureMinimumProtocolVersion = (protocolVersion: string) => {
        return getProtocolVersion()
        .then((actual) => {
          const minimum = getMajorMinorVersion(protocolVersion)

          if (!isVersionGte(actual, minimum)) {
            errors.throw('CDP_VERSION_TOO_OLD', protocolVersion, actual)
          }
        })
      }

      const getProtocolVersion = _.memoize(async () => {
        let protocolVersion

        try {
          protocolVersion = (await browserClient.send('Browser.getVersion')).protocolVersion
        } catch {
          protocolVersion = '0.0'
        }

        return getMajorMinorVersion(protocolVersion)
      })

      const attachToTargetUrl = async (url: string) => {
        const { targetInfos: targets } = await browserClient.send('Target.getTargets')

        const target = targets.find((target) => target.url === url)

        if (!target) {
          throw new Error(`Could not find url target in browser ${url}`)
        }

        currentlyAttachedTarget = await create(target.targetId, HOST, port, onAsynchronousError)

        return currentlyAttachedTarget
      }

      const attachToNewUrl = async (url: string) => {
        const target = await browserClient.send('Target.createTarget', { url })

        currentlyAttachedTarget = await create(target.targetId, HOST, port, onAsynchronousError)

        return currentlyAttachedTarget
      }

      const closeCurrentTarget = async () => {
        await currentlyAttachedTarget.close()

        return browserClient.send('Target.closeTarget', { targetId: currentlyAttachedTarget.targetId })
      }

      const close = async () => {
        await currentlyAttachedTarget.close()
        await browserClient.close()
      }

      return {
        ensureMinimumProtocolVersion,
        getProtocolVersion,
        attachToTargetUrl,
        attachToNewUrl,
        closeCurrentTarget,
        close,
      }
    } catch (err) {
      const delay = _getDelayMsForRetry(retryIndex, browserName)

      debug('error finding CRI target, maybe retrying %o', { delay, err })

      if (typeof delay === 'undefined') {
        throw err
      }

      return Bluebird.delay(delay).then(retry)
    }
  }

  return retry()
}
