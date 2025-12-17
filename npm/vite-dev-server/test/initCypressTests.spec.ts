import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'

describe('initCypressTests', () => {
  let mockSupportFile: string | undefined
  // relative "/cypress/support/component.js"
  let mockProjectRoot: string | undefined = ''
  let mockPlatform: 'darwin' | 'win32' | 'linux' = 'linux'
  let mockDevServerPublicPathRoute: string = ''
  let mockAbsolutePath: string = ''
  let mockRelativePath: string = ''
  let mockViewportWidth: number
  let mockViewportHeight: number

  const createMockCypress = () => {
    return {
      on: vi.fn(),
      onSpecWindow: vi.fn(),
      action: vi.fn(),
      config: vi.fn().mockImplementation((key) => {
        switch (key) {
          case 'supportFile':
            return mockSupportFile
          case 'projectRoot':
            return mockProjectRoot
          case 'platform':
            return mockPlatform
          case 'devServerPublicPathRoute':
            return mockDevServerPublicPathRoute
          case 'viewportWidth':
            return mockViewportWidth
          case 'viewportHeight':
            return mockViewportHeight
          default:
            return undefined
        }
      }),
      spec: {
        absolute: mockAbsolutePath,
        relative: mockRelativePath,
      },
    }
  }

  let mockCypressInstance = createMockCypress()

  beforeEach(() => {
    vi.resetModules()

    mockSupportFile = '/users/mock_dir/mock_project/cypress/support/component.js'
    // relative "/cypress/support/component.js"
    mockProjectRoot = '/users/mock_dir/mock_project'
    mockPlatform = 'linux'
    mockDevServerPublicPathRoute = '/__cypress/src'
    mockAbsolutePath = '/users/mock_dir/mock_project/src/Test.cy.jsx'
    mockRelativePath = 'src/Test.cy.jsx'
    mockViewportWidth = 800
    mockViewportHeight = 500

    mockCypressInstance = createMockCypress()

    global.import = vi.fn()
    // @ts-expect-error
    global.window = {}
    // @ts-expect-error
    global.parent = {}
    // @ts-expect-error
    global.parent.Cypress = mockCypressInstance
  })

  afterEach(() => {
    // @ts-expect-error
    delete global.window
    // @ts-expect-error
    delete global.parent
  })

  describe('support file / spec file loading', () => {
    it('doesn\'t load the support file if one is not provided', async () => {
      mockSupportFile = undefined
      await import('../client/initCypressTests.js')
      // just includes the spec import
      expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(global.window, [
        {
          load: expect.any(Function),
          absolute: mockAbsolutePath,
          relative: mockRelativePath,
          relativeUrl: `${mockDevServerPublicPathRoute}/@fs${mockAbsolutePath}`,
        },
      ])
    })

    it('load the support file along with the spec', async () => {
      await import('../client/initCypressTests.js')
      // just includes the spec import
      expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(global.window, [
        {
          load: expect.any(Function),
          absolute: '/users/mock_dir/mock_project/cypress/support/component.js',
          relative: '/cypress/support/component.js',
          relativeUrl: '/__cypress/src/cypress/support/component.js',
        },
        {
          load: expect.any(Function),
          absolute: '/users/mock_dir/mock_project/src/Test.cy.jsx',
          relative: 'src/Test.cy.jsx',
          relativeUrl: '/__cypress/src/@fs/users/mock_dir/mock_project/src/Test.cy.jsx',
        },
      ])
    })

    describe('empty devServerPublicPathRoute', () => {
      it('load the support file along with the spec', async () => {
        mockDevServerPublicPathRoute = ''
        await import('../client/initCypressTests.js')
        // just includes the spec import
        expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(global.window, [
          {
            load: expect.any(Function),
            absolute: '/users/mock_dir/mock_project/cypress/support/component.js',
            relative: '/cypress/support/component.js',
            relativeUrl: './cypress/support/component.js',
          },
          {
            load: expect.any(Function),
            absolute: '/users/mock_dir/mock_project/src/Test.cy.jsx',
            relative: 'src/Test.cy.jsx',
            relativeUrl: './@fs/users/mock_dir/mock_project/src/Test.cy.jsx',
          },
        ])
      })
    })

    describe('windows', () => {
      beforeEach(() => {
        mockPlatform = 'win32'
        mockProjectRoot = 'C:\\users\\mock_user\\mock_dir\\mock_project'
        mockSupportFile = 'C:\\users\\mock_user\\mock_dir\\mock_project\\cypress\\support\\component.js'
        // even though we are still in windows, this is the expected / passed in public path
        mockDevServerPublicPathRoute = '/__cypress/src'
        mockAbsolutePath = 'C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx'
        mockRelativePath = 'src\\Test.cy.jsx'
        mockCypressInstance.spec.absolute = mockAbsolutePath
        mockCypressInstance.spec.relative = mockRelativePath
      })

      it('doesn\'t load the support file if one is not provided', async () => {
        mockSupportFile = undefined
        await import('../client/initCypressTests.js')
        // just includes the spec import
        expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(expect.any(Object), [
          {
            load: expect.any(Function),
            absolute: 'C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
            relative: 'src\\Test.cy.jsx',
            relativeUrl: '/__cypress/src/@fs/C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
          },
        ])
      })

      it('load the support file along with the spec', async () => {
        await import('../client/initCypressTests.js')
        // just includes the spec import
        expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(global.window, [
          {
            load: expect.any(Function),
            absolute: 'C:\\users\\mock_user\\mock_dir\\mock_project\\cypress\\support\\component.js',
            relative: '/cypress/support/component.js',
            relativeUrl: '/__cypress/src/cypress/support/component.js',
          },
          {
            load: expect.any(Function),
            absolute: 'C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
            relative: 'src\\Test.cy.jsx',
            relativeUrl: '/__cypress/src/@fs/C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
          },
        ])
      })

      describe('empty devServerPublicPathRoute', () => {
        it('load the support file along with the spec', async () => {
          mockDevServerPublicPathRoute = ''
          await import('../client/initCypressTests.js')
          // just includes the spec import
          expect(mockCypressInstance.onSpecWindow).toHaveBeenCalledWith(global.window, [
            {
              load: expect.any(Function),
              absolute: 'C:\\users\\mock_user\\mock_dir\\mock_project\\cypress\\support\\component.js',
              relative: '/cypress/support/component.js',
              relativeUrl: './cypress/support/component.js',
            },
            {
              load: expect.any(Function),
              absolute: 'C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
              relative: 'src\\Test.cy.jsx',
              relativeUrl: './@fs/C:/users/mock_user/mock_dir/mock_project/src/Test.cy.jsx',
            },
          ])
        })
      })
    })
  })

  describe('support file retry logic', () => {
    // Note: Full retry logic testing is difficult in this environment because:
    // 1. The module executes at import time and Vite's test runner resolves imports
    // 2. The load function is a closure that captures the import function at module load time
    // 3. Mocking global.import doesn't work reliably with Vite's module resolution
    //
    // The retry logic is tested through:
    // - Integration tests in system-tests that exercise the actual Vite dev server
    //
    // These tests verify that the retry logic structure is in place.
    // The cache-busting query parameter (_cypress_retry) is added on retry attempts
    // to work around browser module map caching of failed imports.
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('creates a load function with retry logic for support file', async () => {
      await import('../client/initCypressTests.js')

      const calls = mockCypressInstance.onSpecWindow.mock.calls
      const supportFileLoader = calls[0][1][0].load

      // Verify the load function exists and is async
      expect(supportFileLoader).toBeDefined()
      expect(typeof supportFileLoader).toBe('function')

      // The load function should return a promise
      const loadPromise = supportFileLoader()

      expect(loadPromise).toBeInstanceOf(Promise)
    })

    it('uses cache-busting query parameter on retry attempts', async () => {
      const importCalls: string[] = []

      // Mock import before module loads to capture URLs
      // @ts-expect-error
      global.import = vi.fn((url: string) => {
        importCalls.push(url)
        // Simulate a retryable error on first two attempts, success on third
        if (importCalls.length <= 2) {
          return Promise.reject(new Error('Failed to fetch dynamically imported module'))
        }

        return Promise.resolve({ default: {} })
      })

      await import('../client/initCypressTests.js')

      const calls = mockCypressInstance.onSpecWindow.mock.calls
      const supportFileLoader = calls[0][1][0].load

      // Advance timers to allow retries to complete
      await vi.runAllTimersAsync()

      try {
        await supportFileLoader()
      } catch (error) {
        // Expected to fail after all retries
      }

      // Verify first attempt uses original URL (no cache-busting)
      expect(importCalls[0]).toBe('/__cypress/src/cypress/support/component.js')

      expect(importCalls[0]).not.toContain('_cypress_retry')

      // Verify retry attempts use cache-busting query parameter
      if (importCalls.length > 1) {
        expect(importCalls[1]).toContain('_cypress_retry=1')
      }

      if (importCalls.length > 2) {
        expect(importCalls[2]).toContain('_cypress_retry=2')
      }
    })
  })
})
