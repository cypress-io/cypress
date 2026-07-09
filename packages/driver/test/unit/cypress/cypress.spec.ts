/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import $Cypress from '../../../src/cypress'
import $utils from '../../../src/cypress/utils'

describe('$Cypress', () => {
  let Cypress: any

  beforeEach(() => {
    Cypress = new $Cypress()
    vi.resetAllMocks()
  })

  describe('initialize', () => {
    it('should store autIframe and snapshotIframe', () => {
      const mockAutIframe = { id: 'aut-iframe' } as any
      const mockSnapshotIframes = [{ id: 'snapshot-iframe' }] as any
      const mockOnSpecReady = vi.fn()
      const mockWaitForStudio = vi.fn()

      Cypress.initialize({
        $autIframe: mockAutIframe,
        $autSnapshotIframes: mockSnapshotIframes,
        onSpecReady: mockOnSpecReady,
        waitForStudio: mockWaitForStudio,
      })

      expect(Cypress.$autIframe).toBe(mockAutIframe)
      expect(Cypress.$autSnapshotIframes).toBe(mockSnapshotIframes)
      expect(Cypress.$autSnapshotIframe).toBe(mockSnapshotIframes[0])
      expect(Cypress.onSpecReady).toBe(mockOnSpecReady)
      expect(Cypress.waitForStudio).toBe(mockWaitForStudio)
    })

    it('should handle snapshotIframe being undefined', () => {
      const mockAutIframe = { id: 'aut-iframe' } as any
      const mockOnSpecReady = vi.fn()

      Cypress.initialize({
        $autIframe: mockAutIframe,
        $autSnapshotIframes: undefined,
        onSpecReady: mockOnSpecReady,
        waitForStudio: undefined,
      })

      expect(Cypress.$autIframe).toBe(mockAutIframe)
      expect(Cypress.$autSnapshotIframes).toBeUndefined()
      expect(Cypress.onSpecReady).toBe(mockOnSpecReady)
      expect(Cypress.waitForStudio).toBeUndefined()
    })

    it('should call _onInitialize callback if set', () => {
      const mockOnInitialize = vi.fn()

      Cypress._onInitialize = mockOnInitialize

      const mockAutIframe = { id: 'aut-iframe' } as any

      Cypress.initialize({
        $autIframe: mockAutIframe,
        $autSnapshotIframes: undefined,
        onSpecReady: vi.fn(),
        waitForStudio: undefined,
      })

      expect(mockOnInitialize).toHaveBeenCalledOnce()
      expect(Cypress._onInitialize).toBeUndefined()
    })

    it('should not call _onInitialize callback if not set', () => {
      const mockAutIframe = { id: 'aut-iframe' } as any

      Cypress.initialize({
        $autIframe: mockAutIframe,
        $autSnapshotIframes: undefined,
        onSpecReady: vi.fn(),
        waitForStudio: undefined,
      })

      // Should not throw and should complete successfully
      expect(Cypress.$autIframe).toBe(mockAutIframe)
    })
  })

  describe('utils', () => {
    describe('isValidHttpMethod', () => {
      it('returns true for QUERY method', () => {
        expect($utils.isValidHttpMethod('QUERY')).toBe(true)
      })

      it('returns true for lowercase query method', () => {
        expect($utils.isValidHttpMethod('query')).toBe(true)
      })

      it('returns true for standard methods', () => {
        expect($utils.isValidHttpMethod('GET')).toBe(true)
        expect($utils.isValidHttpMethod('POST')).toBe(true)
      })

      it('returns false for null', () => {
        expect($utils.isValidHttpMethod(null)).toBe(false)
      })

      it('returns false for undefined', () => {
        expect($utils.isValidHttpMethod(undefined)).toBe(false)
      })

      it('returns false for an empty string', () => {
        expect($utils.isValidHttpMethod('')).toBe(false)
      })

      it('returns false for an unknown method', () => {
        expect($utils.isValidHttpMethod('INVALID')).toBe(false)
      })
    })
  })
})
