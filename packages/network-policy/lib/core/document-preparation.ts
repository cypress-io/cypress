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
    ((facts.experimentalModifyObstructiveThirdPartyCode
      && (facts.isHTML || facts.isRenderedHTML || facts.isJavaScript)) ||
     facts.wantsInjection === 'full' ||
     facts.wantsInjection === 'fullCrossOrigin' ||
     (facts.isJavaScript && facts.isReqMatchSuperDomainOrigin))
}
