import md5 from 'md5'
import Debug from 'debug'
import type { RequestCredentialLevel, RequestedWithHeader } from '@packages/proxy'

type AppliedCredentialByUrlAndResourceMap = Map<string, Array<{
  requestedWith: RequestedWithHeader
  credentialStatus: RequestCredentialLevel
}>>

const debug = Debug('cypress:server:util:resource-type-and-credential')

const hashUrl = (url: string): string => {
  return md5(decodeURIComponent(url))
}

// leverage a singleton Map throughout the server to prevent clashes with this context bindings
const _appliedCredentialByUrlAndResourceMap: AppliedCredentialByUrlAndResourceMap = new Map()

class RequestedWithAndCredentialManagerClass {
  get (url: string, optionalRequestedWith?: RequestedWithHeader): {
    requestedWith: RequestedWithHeader
    credentialStatus: RequestCredentialLevel
  } {
    const hashKey = hashUrl(url)

    debug(`credentials request received for request url ${url}, hashKey ${hashKey}`)
    let value: {
      requestedWith: RequestedWithHeader
      credentialStatus: RequestCredentialLevel
    } | undefined

    const credentialsObj = _appliedCredentialByUrlAndResourceMap.get(hashKey)

    if (credentialsObj) {
      // remove item from queue
      value = credentialsObj?.shift()
      debug(`credential value found ${value}`)
    }

    // if value is undefined for any reason, apply defaults and assume xhr if no optionalRequestedWith
    // optionalRequestedWith should be provided with CDP based browsers, so at least we have a fallback that is more accurate
    if (value === undefined) {
      value = {
        requestedWith: optionalRequestedWith || 'xhr',
        credentialStatus: optionalRequestedWith === 'fetch' ? 'same-origin' : false,
      }
    }

    return value
  }

  set ({ url,
    requestedWith,
    credentialStatus,
  }: {
    url: string
    requestedWith: RequestedWithHeader
    credentialStatus: RequestCredentialLevel
  }) {
    const hashKey = hashUrl(url)

    debug(`credentials request stored for request url ${url}, requestedWith ${requestedWith}, hashKey ${hashKey}`)

    let urlHashValue = _appliedCredentialByUrlAndResourceMap.get(hashKey)

    if (!urlHashValue) {
      _appliedCredentialByUrlAndResourceMap.set(hashKey, [{
        requestedWith,
        credentialStatus,
      }])
    } else {
      urlHashValue.push({
        requestedWith,
        credentialStatus,
      })
    }
  }

  clear () {
    _appliedCredentialByUrlAndResourceMap.clear()
  }
}

// export as a singleton
export const requestedWithAndCredentialManager = new RequestedWithAndCredentialManagerClass()

// export but only as a type. We do NOT want others to create instances of the class as it is intended to be a singleton
export type RequestedWithAndCredentialManager = RequestedWithAndCredentialManagerClass
