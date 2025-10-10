/*
utility to help determine if document.domain should be injected, or related logic invoked
this class isn't necessarily network related, but it is used from a wide ranging number
of packages. It should probably be its own ./package. for now, it's sort of a facade for all
of this logic, which should help inform a subsequent refactor strategy.

  behaviors controlled:
  - how to key origins of RemoteStates (server/lib/remote_states)
  - whether to inject document.domain in the server render of top (server/lib/controllers/files)
  - whether to inject document.domain in proxied files (proxy/lib/http/response-middleware)
  - how to verify stack traces of privileged commands in chrome
*/
import Debug from 'debug'
import { isString, isEqual } from 'lodash'
import { getSuperDomainOrigin, getSuperDomain, parseUrlIntoHostProtocolDomainTldPort } from './cors'
import type { ParsedHostWithProtocolAndHost } from './types'

const debug = Debug('cypress:network:document-domain-injection')

export abstract class DocumentDomainInjection {
  public static InjectionBehavior (config: { injectDocumentDomain?: boolean, testingType?: 'e2e' | 'component'}): DocumentDomainInjection {
    debug('Determining injection behavior for config values: %o', {
      injectDocumentDomain: config.injectDocumentDomain,
      testingType: config.testingType,
    })

    if (config.injectDocumentDomain && config.testingType !== 'component') {
      debug('Returning document domain injection behavior')

      return new DocumentDomainBehavior()
    }

    debug('Returning origin behavior - no document domain injection')

    return new OriginBehavior()
  }

  public abstract getOrigin (url: string): string
  public abstract getHostname (url: string): string
  public abstract urlsMatch (frameUrl: string | ParsedHostWithProtocolAndHost, topUrl: string | ParsedHostWithProtocolAndHost): boolean
  public abstract shouldInjectDocumentDomain (url: string | undefined): boolean
}

export class DocumentDomainBehavior implements DocumentDomainInjection {
  public getOrigin (url: string) {
    return getSuperDomainOrigin(url)
  }
  public getHostname (url: string): string {
    return getSuperDomain(url)
  }
  public urlsMatch (frameUrl: string | ParsedHostWithProtocolAndHost, topUrl: string | ParsedHostWithProtocolAndHost): boolean {
    const frameProps = isString(frameUrl) ? parseUrlIntoHostProtocolDomainTldPort(frameUrl) : frameUrl
    const topProps = isString(topUrl) ? parseUrlIntoHostProtocolDomainTldPort(topUrl) : topUrl

    const { subdomain: frameSubdomain, ...parsedFrameUrl } = frameProps
    const { subdomain: topSubdomain, ...parsedTopUrl } = topProps

    return isEqual(parsedFrameUrl, parsedTopUrl)
  }
  public shouldInjectDocumentDomain (url: string | undefined) {
    debug('document-domain behavior: should inject document domain -> true')

    return !!url
  }
}

export class OriginBehavior implements DocumentDomainInjection {
  public getOrigin (url: string) {
    return new URL(url).origin
  }
  public getHostname (url: string): string {
    return new URL(url).hostname
  }
  public urlsMatch (frameUrl: string | ParsedHostWithProtocolAndHost, topUrl: string | ParsedHostWithProtocolAndHost): boolean {
    const frameProps = isString(frameUrl) ? parseUrlIntoHostProtocolDomainTldPort(frameUrl) : frameUrl
    const topProps = isString(topUrl) ? parseUrlIntoHostProtocolDomainTldPort(topUrl) : topUrl

    return isEqual(frameProps, topProps)
  }
  public shouldInjectDocumentDomain (url: string | undefined) {
    debug('origin-behavior: should inject document domain -> false')

    return false
  }
}
