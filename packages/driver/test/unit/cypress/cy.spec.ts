/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect } from 'vitest'
import { $Cy } from '../../../src/cypress/cy'

describe('$Cy reset', () => {
  it('calls resetStability() when reset(test) is run so stability queue is cleared between tests', () => {
    const resetStability = vi.fn()
    const stateFn = vi.fn(function () {
      return {
        window: undefined,
        document: undefined,
        $autIframe: undefined,
        specWindow: undefined,
        activeSessions: undefined,
        isProtocolEnabled: undefined,
      }
    }) as ReturnType<typeof vi.fn> & { reset: ReturnType<typeof vi.fn> }

    stateFn.reset = vi.fn()
    const mockCy = {
      state: stateFn,
      queue: { reset: vi.fn(), clear: vi.fn() },
      resetTimer: vi.fn(),
      resetStability,
      removeAllListeners: vi.fn(),
      testConfigOverride: { restoreAndSetTestConfigOverrides: vi.fn() },
      Cypress: { config: vi.fn(), env: vi.fn() },
      fail: vi.fn(),
    }

    const reset = $Cy.prototype.reset

    reset.call(mockCy, { title: 'test', fn: () => {} })

    expect(resetStability).toHaveBeenCalledOnce()
  })
})

describe('$Cy#syncBlockHostsToBackend', () => {
  const buildMockCy = ({
    isCrossOriginSpecBridge = false,
    blockHosts,
  }: {
    isCrossOriginSpecBridge?: boolean
    blockHosts?: string | string[]
  }) => {
    return {
      Cypress: {
        isCrossOriginSpecBridge,
        backend: vi.fn(),
        config: vi.fn((key: string) => (key === 'blockHosts' ? blockHosts : undefined)),
      },
    }
  }

  it('sends the resolved blockHosts value to the backend on the primary origin', () => {
    const mockCy = buildMockCy({ blockHosts: ['*.foo.com'] })

    $Cy.prototype.syncBlockHostsToBackend.call(mockCy)

    expect(mockCy.Cypress.backend).toHaveBeenCalledWith('update:block:hosts', ['*.foo.com'])
  })

  it('sends null when blockHosts is unset so an override can be cleared', () => {
    const mockCy = buildMockCy({ blockHosts: undefined })

    $Cy.prototype.syncBlockHostsToBackend.call(mockCy)

    expect(mockCy.Cypress.backend).toHaveBeenCalledWith('update:block:hosts', null)
  })

  it('does not sync from a cross-origin spec bridge', () => {
    const mockCy = buildMockCy({ isCrossOriginSpecBridge: true, blockHosts: ['*.foo.com'] })

    $Cy.prototype.syncBlockHostsToBackend.call(mockCy)

    expect(mockCy.Cypress.backend).not.toHaveBeenCalled()
  })
})
