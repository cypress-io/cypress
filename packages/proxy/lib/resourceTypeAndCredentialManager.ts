import md5 from 'md5'
import Debug from 'debug'
import type { RequestCredentialLevel } from '@packages/proxy'
import type { ResourceType } from '@packages/net-stubbing'

type AppliedCredentialByUrlAndResourceMap = Map<string, Array<{
  resourceType: ResourceType
  credentialStatus: RequestCredentialLevel
}>>

const debug = Debug('cypress:server:util:resource-type-and-credential')

const hashUrl = (url: string): string => {
  return md5(decodeURIComponent(url))
}

// leverage a singleton Map throughout the server to prevent clashes with this context bindings
const _appliedCredentialByUrlAndResourceMap: AppliedCredentialByUrlAndResourceMap = new Map()

class ResourceTypeAndCredentialManagerClass {
  get (url: string, optionalResourceType?: ResourceType): {
    resourceType: ResourceType
    credentialStatus: RequestCredentialLevel
  } {
    const hashKey = hashUrl(url)

    debug(`credentials request received for request url ${url}, hashKey ${hashKey}`)
    let value: {
      resourceType: ResourceType
      credentialStatus: RequestCredentialLevel
    } | undefined

    const credentialsObj = _appliedCredentialByUrlAndResourceMap.get(hashKey)

    if (credentialsObj) {
      // remove item from queue
      value = credentialsObj?.shift()
      debug(`credential value found ${value}`)
    }

    // if value is undefined for any reason, apply defaults and assume xhr if no optionalResourceType
    // optionalResourceType should be provided by the prerequest resourceType, so at least we have a fallback that is more accurate
    if (value === undefined) {
      value = {
        resourceType: optionalResourceType || 'xhr',
        credentialStatus: optionalResourceType === 'fetch' ? 'same-origin' : false,
      }
    }

    return value
  }

  set ({ url,
    resourceType,
    credentialStatus,
  }: {
    url: string
    resourceType: ResourceType
    credentialStatus: RequestCredentialLevel
  }) {
    const hashKey = hashUrl(url)

    debug(`credentials request stored for request url ${url}, resourceType ${resourceType}, hashKey ${hashKey}`)

    let urlHashValue = _appliedCredentialByUrlAndResourceMap.get(hashKey)

    if (!urlHashValue) {
      _appliedCredentialByUrlAndResourceMap.set(hashKey, [{
        resourceType,
        credentialStatus,
      }])
    } else {
      urlHashValue.push({
        resourceType,
        credentialStatus,
      })
    }
  }

  clear () {
    _appliedCredentialByUrlAndResourceMap.clear()
  }
}

// export as a singleton
export const resourceTypeAndCredentialManager = new ResourceTypeAndCredentialManagerClass()

// export but only as a type. We do NOT want others to create instances of the class as it is intended to be a singleton
export type ResourceTypeAndCredentialManager = ResourceTypeAndCredentialManagerClass
