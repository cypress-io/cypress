/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import $Cypress from '../../../src/cypress'

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
})
