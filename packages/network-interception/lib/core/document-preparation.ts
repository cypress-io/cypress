import { debug } from '../debug'

export type InjectionLevel = false | 'full' | 'partial' | 'fullCrossOrigin'

export type InjectionLevelFacts = {
  hasFileServerError: boolean
  isInitial: boolean
  isHTML: boolean
  isRenderedHTML: boolean
  isReqMatchSuperDomainOrigin: boolean
  isAUTFrame: boolean
  urlDoesNotMatchPolicyBasedOnDomain: boolean
}

export type SecurityRemovalFacts = {
  modifyObstructiveCode: boolean
  experimentalModifyObstructiveThirdPartyCode: boolean
  wantsInjection: InjectionLevel | false | null | undefined
  isHTML: boolean
  isRenderedHTML: boolean
  isReqMatchSuperDomainOrigin: boolean
  isJavaScript: boolean
}

/**
 * Pure injection-level decision — extracted from proxy `SetInjectionLevel` middleware.
 */
export function resolveInjectionLevel (facts: InjectionLevelFacts): InjectionLevel | false {
  const level = resolveInjectionLevelInner(facts)

  debug.document('resolveInjectionLevel isHTML=%s isInitial=%s isAUTFrame=%s -> %s',
    facts.isHTML,
    facts.isInitial,
    facts.isAUTFrame,
    level ?? false)

  return level
}

function resolveInjectionLevelInner (facts: InjectionLevelFacts): InjectionLevel | false {
  if (facts.hasFileServerError && !facts.isInitial) {
    return 'partial'
  }

  const isHTMLLike = facts.isHTML || facts.isRenderedHTML

  // NOTE: Only inject fullCrossOrigin if the super domain origins do not match in order to keep parity with cypress application reloads
  if (facts.urlDoesNotMatchPolicyBasedOnDomain && facts.isAUTFrame && isHTMLLike) {
    return 'fullCrossOrigin'
  }

  if (!facts.isHTML || (!facts.isReqMatchSuperDomainOrigin && !facts.isAUTFrame)) {
    return false
  }

  if (facts.isInitial && isHTMLLike) {
    return 'full'
  }

  if (!facts.isRenderedHTML) {
    return false
  }

  return 'partial'
}

/**
 * Pure framebusting-removal decision — extracted from proxy `SetInjectionLevel` middleware.
 */
export function resolveWantsSecurityRemoved (facts: SecurityRemovalFacts): boolean {
  const wantsSecurityRemoved = (facts.modifyObstructiveCode || facts.experimentalModifyObstructiveThirdPartyCode) &&
    // if experimentalModifyObstructiveThirdPartyCode is enabled, we want to modify all framebusting code that is html or javascript that passes through the proxy
    ((facts.experimentalModifyObstructiveThirdPartyCode
      && (facts.isHTML || facts.isRenderedHTML || facts.isJavaScript)) ||
     facts.wantsInjection === 'full' ||
     facts.wantsInjection === 'fullCrossOrigin' ||
     // only modify JavasScript if matching the current origin policy or if experimentalModifyObstructiveThirdPartyCode is enabled (above)
     (facts.isJavaScript && facts.isReqMatchSuperDomainOrigin))

  debug.document('resolveWantsSecurityRemoved modifyObstructive=%s thirdParty=%s wantsInjection=%s -> %s',
    facts.modifyObstructiveCode,
    facts.experimentalModifyObstructiveThirdPartyCode,
    facts.wantsInjection,
    wantsSecurityRemoved)

  return wantsSecurityRemoved
}

// Pure, header-value-shaped predicates shared by the proxy middleware
// (set-injection-level, service-worker injection) and the CDP body classifier
// (packages/server should-stream-response-body.ts), so every consumer agrees
// on what counts as HTML/JS content-type, an HTML-rendering Accept header,
// and a service-worker script request — without re-deriving type lists.

export function contentTypeIsHtml (contentType: string | undefined): boolean {
  return !!contentType && contentType.includes('html')
}

export function acceptWillRenderHtml (accept: string | undefined, xRequestedWith: string | undefined): boolean {
  // don't inject if this is an XHR from jquery
  if (xRequestedWith) {
    return false
  }

  // don't inject if we didn't find both text/html and application/xhtml+xml
  return !!accept && accept.includes('text/html') && accept.includes('application/xhtml+xml')
}

const JAVASCRIPT_CONTENT_TYPES = ['application/javascript', 'application/x-javascript', 'text/javascript']

export function contentTypeIsJavaScript (contentType: string | undefined): boolean {
  return !!contentType && JAVASCRIPT_CONTENT_TYPES.some((type) => contentType.includes(type))
}

export const serviceWorkerHeaderIsScript = (value: string | string[] | undefined): boolean => value === 'script'
