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

  describe('action', () => {
    describe('runner:test:before:run', () => {
      const RUN_ALL_SPEC = {
        name: '__all',
        absolute: '__all',
        relative: '__all',
        baseName: '__all',
        fileName: '__all',
      }

      // stubs Cypress.config so config('spec') returns the launch-time spec
      // (which stays '__all' for run-all sessions even as Cypress.spec updates)
      const stubConfig = (configSpec: any) => {
        Cypress.config = vi.fn().mockImplementation((key: string) => {
          return key === 'spec' ? configSpec : false
        })
      }

      it('updates Cypress.spec when running all specs and invocationDetails are present', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/foo.spec.ts',
            relativeFile: 'cypress/e2e/foo.spec.ts',
          },
        })

        expect(Cypress.spec).toEqual({
          name: 'foo.spec.ts',
          absolute: '/project/cypress/e2e/foo.spec.ts',
          relative: 'cypress/e2e/foo.spec.ts',
          baseName: 'foo.spec.ts',
          fileName: 'foo',
        })
      })

      it('updates Cypress.spec again when a test from a different spec runs', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/foo.spec.ts',
            relativeFile: 'cypress/e2e/foo.spec.ts',
          },
        })

        expect(Cypress.spec.relative).toBe('cypress/e2e/foo.spec.ts')

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/bar.spec.ts',
            relativeFile: 'cypress/e2e/bar.spec.ts',
          },
        })

        expect(Cypress.spec.relative).toBe('cypress/e2e/bar.spec.ts')
        expect(Cypress.spec.name).toBe('bar.spec.ts')
      })

      it('prefers the registration-time spec stamp over invocationDetails', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC }

        // Vite source maps resolve invocationDetails to basenames only; the raw
        // mocha test (2nd action arg) carries the exact stamp from mocha.ts
        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/component-a.cy.tsx',
            relativeFile: 'component-a.cy.tsx',
          },
        }, {
          _cypressSpec: {
            absolute: '/project/component/folder-a/component-a.cy.tsx',
            relative: 'component/folder-a/component-a.cy.tsx',
          },
        })

        expect(Cypress.spec.relative).toBe('component/folder-a/component-a.cy.tsx')
        expect(Cypress.spec.absolute).toBe('/project/component/folder-a/component-a.cy.tsx')
        expect(Cypress.spec.name).toBe('component-a.cy.tsx')
        expect(Cypress.spec.fileName).toBe('component-a')
      })

      it('preserves existing spec fields when updating', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC, specType: 'integration' }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/bar.cy.ts',
            relativeFile: 'cypress/e2e/bar.cy.ts',
          },
        })

        expect(Cypress.spec.specType).toBe('integration')
        expect(Cypress.spec.fileName).toBe('bar')
      })

      it('does not update Cypress.spec when invocationDetails are absent', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC }

        Cypress.action('runner:test:before:run', {})

        expect(Cypress.spec).toEqual(RUN_ALL_SPEC)
      })

      it('does not update Cypress.spec when not in run-all-specs mode', () => {
        const originalSpec = {
          name: 'single.spec.ts',
          absolute: '/project/cypress/e2e/single.spec.ts',
          relative: 'cypress/e2e/single.spec.ts',
          baseName: 'single.spec.ts',
          fileName: 'single.spec',
        }

        stubConfig(originalSpec)
        Cypress.spec = { ...originalSpec }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/other.spec.ts',
            relativeFile: 'cypress/e2e/other.spec.ts',
          },
        })

        expect(Cypress.spec).toEqual(originalSpec)
      })

      it('does not update Cypress.spec when absoluteFile matches current spec', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = {
          ...RUN_ALL_SPEC,
          absolute: '/project/cypress/e2e/foo.spec.ts',
        }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/foo.spec.ts',
            relativeFile: 'cypress/e2e/foo.spec.ts',
          },
        })

        expect(Cypress.spec.name).toBe('__all')
      })

      it('correctly sets fileName for a file with no extension', () => {
        stubConfig(RUN_ALL_SPEC)
        Cypress.spec = { ...RUN_ALL_SPEC }

        Cypress.action('runner:test:before:run', {
          invocationDetails: {
            absoluteFile: '/project/cypress/e2e/specfile',
            relativeFile: 'cypress/e2e/specfile',
          },
        })

        expect(Cypress.spec.baseName).toBe('specfile')
        expect(Cypress.spec.fileName).toBe('specfile')
      })
    })
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
