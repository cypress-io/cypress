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
  return (facts.modifyObstructiveCode || facts.experimentalModifyObstructiveThirdPartyCode) &&
    // if experimentalModifyObstructiveThirdPartyCode is enabled, we want to modify all framebusting code that is html or javascript that passes through the proxy
    ((facts.experimentalModifyObstructiveThirdPartyCode
      && (facts.isHTML || facts.isRenderedHTML || facts.isJavaScript)) ||
     facts.wantsInjection === 'full' ||
     facts.wantsInjection === 'fullCrossOrigin' ||
     // only modify JavasScript if matching the current origin policy or if experimentalModifyObstructiveThirdPartyCode is enabled (above)
     (facts.isJavaScript && facts.isReqMatchSuperDomainOrigin))
}
