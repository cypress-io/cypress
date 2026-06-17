import { describe, it, expect } from 'vitest'
import { resolveInjectionLevel, resolveWantsSecurityRemoved } from '../../lib/core/document-preparation'

describe('core/document-preparation', () => {
  describe('resolveInjectionLevel', () => {
    it('returns partial for file-server errors on non-initial loads', () => {
      expect(resolveInjectionLevel({
        hasFileServerError: true,
        isInitial: false,
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: true,
        isAUTFrame: true,
        urlDoesNotMatchPolicyBasedOnDomain: false,
      })).toBe('partial')
    })

    it('returns fullCrossOrigin for cross-origin AUT HTML', () => {
      expect(resolveInjectionLevel({
        hasFileServerError: false,
        isInitial: false,
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: false,
        isAUTFrame: true,
        urlDoesNotMatchPolicyBasedOnDomain: true,
      })).toBe('fullCrossOrigin')
    })

    it('returns full for initial HTML document loads', () => {
      expect(resolveInjectionLevel({
        hasFileServerError: false,
        isInitial: true,
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: true,
        isAUTFrame: false,
        urlDoesNotMatchPolicyBasedOnDomain: false,
      })).toBe('full')
    })

    it('returns false when response is not HTML', () => {
      expect(resolveInjectionLevel({
        hasFileServerError: false,
        isInitial: true,
        isHTML: false,
        isRenderedHTML: false,
        isReqMatchSuperDomainOrigin: true,
        isAUTFrame: true,
        urlDoesNotMatchPolicyBasedOnDomain: false,
      })).toBe(false)
    })
  })

  describe('resolveWantsSecurityRemoved', () => {
    it('returns true for full injection when modifyObstructiveCode is enabled', () => {
      expect(resolveWantsSecurityRemoved({
        modifyObstructiveCode: true,
        experimentalModifyObstructiveThirdPartyCode: false,
        wantsInjection: 'full',
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: true,
        isJavaScript: false,
      })).toBe(true)
    })

    it('returns false when no rewrite flags are enabled', () => {
      expect(resolveWantsSecurityRemoved({
        modifyObstructiveCode: false,
        experimentalModifyObstructiveThirdPartyCode: false,
        wantsInjection: 'full',
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: true,
        isJavaScript: false,
      })).toBe(false)
    })

    it('returns true for third-party HTML when experimental flag is enabled', () => {
      expect(resolveWantsSecurityRemoved({
        modifyObstructiveCode: false,
        experimentalModifyObstructiveThirdPartyCode: true,
        wantsInjection: false,
        isHTML: true,
        isRenderedHTML: false,
        isReqMatchSuperDomainOrigin: false,
        isJavaScript: false,
      })).toBe(true)
    })

    it('returns true for fullCrossOrigin injection when modifyObstructiveCode is enabled', () => {
      expect(resolveWantsSecurityRemoved({
        modifyObstructiveCode: true,
        experimentalModifyObstructiveThirdPartyCode: false,
        wantsInjection: 'fullCrossOrigin',
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: false,
        isJavaScript: false,
      })).toBe(true)
    })

    it('returns true for fullCrossOrigin injection when experimentalModifyObstructiveThirdPartyCode is enabled', () => {
      expect(resolveWantsSecurityRemoved({
        modifyObstructiveCode: false,
        experimentalModifyObstructiveThirdPartyCode: true,
        wantsInjection: 'fullCrossOrigin',
        isHTML: true,
        isRenderedHTML: true,
        isReqMatchSuperDomainOrigin: false,
        isJavaScript: false,
      })).toBe(true)
    })
  })
})
