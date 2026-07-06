import { describe, it, expect } from 'vitest'
import { resolveAutInjectionLevel, AutFrameSignals } from '../../lib/resolve-aut-injection-level'

// the function takes the marker as an argument, so any marker works — use the real AUT identifier
const marker = 'Your project:'

const signals = (overrides: Partial<AutFrameSignals> = {}): AutFrameSignals => {
  return {
    isTop: false,
    windowName: undefined,
    frameElementId: undefined,
    isNullOrigin: false,
    originMatchesTop: false,
    ...overrides,
  }
}

describe('resolveAutInjectionLevel', () => {
  it('returns "none" for the top frame regardless of other signals', () => {
    expect(resolveAutInjectionLevel(marker, signals({
      isTop: true,
      windowName: `${marker} my-project`,
      originMatchesTop: true,
    }))).toEqual('none')
  })

  describe('AUT frame identified by window.name', () => {
    it('returns "full" when the origin matches top', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: `${marker} my-project`,
        originMatchesTop: true,
      }))).toEqual('full')
    })

    it('returns "full" for the pre-navigation "null" origin even when origin does not match top', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: `${marker} my-project`,
        isNullOrigin: true,
        originMatchesTop: false,
      }))).toEqual('full')
    })

    it('returns "cross-origin" when the origin does not match top and is not the null origin', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: `${marker} my-project`,
        originMatchesTop: false,
        isNullOrigin: false,
      }))).toEqual('cross-origin')
    })
  })

  describe('AUT frame identified by the frameElement.id fallback', () => {
    it('returns "full" when window.name is absent but frameElement.id matches and origin matches top', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: undefined,
        frameElementId: `${marker} my-project`,
        originMatchesTop: true,
      }))).toEqual('full')
    })

    it('returns "cross-origin" when only frameElement.id identifies the AUT frame and origin differs', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: 'something-the-app-overwrote',
        frameElementId: `${marker} my-project`,
        originMatchesTop: false,
      }))).toEqual('cross-origin')
    })
  })

  describe('non-AUT frames', () => {
    it('returns "none" when neither window.name nor frameElement.id identify the AUT frame', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: 'some-other-frame',
        frameElementId: 'unrelated-id',
        originMatchesTop: true,
      }))).toEqual('none')
    })

    it('returns "none" when the marker appears but is not a prefix of window.name', () => {
      expect(resolveAutInjectionLevel(marker, signals({
        windowName: `prefixed ${marker}`,
        originMatchesTop: true,
      }))).toEqual('none')
    })

    it('returns "none" when no identifying signals are present', () => {
      expect(resolveAutInjectionLevel(marker, signals())).toEqual('none')
    })
  })
})
