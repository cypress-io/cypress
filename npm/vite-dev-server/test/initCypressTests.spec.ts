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

    ;(global as any).import = vi.fn()
    // @ts-expect-error
    global.window = {
      addEventListener: vi.fn(),
      location: { reload: vi.fn() } as any,
    }

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

  describe('support file vite:preloadError handling', () => {
    // The vite:preloadError handling is tested through:
    // - Integration tests in system-tests that exercise the actual Vite dev server
    //
    // These tests verify that the event listener structure is in place and the
    // load function is simplified (no retry logic).

    it('creates a simple load function for support file (no retry logic)', async () => {
      await import('../client/initCypressTests.js')

      const calls = mockCypressInstance.onSpecWindow.mock.calls
      const supportFileLoader = calls[0][1][0].load

      // Verify the load function exists and is a function
      expect(supportFileLoader).toBeDefined()
      expect(typeof supportFileLoader).toBe('function')

      // The load function should return a promise (from import())
      const loadPromise = supportFileLoader()

      expect(loadPromise).toBeInstanceOf(Promise)

      // Await and catch any errors to prevent unhandled promise rejections
      // In this unit test environment, the import will likely fail since the URL
      // won't resolve, but we just need to verify the function returns a promise
      try {
        await loadPromise
      } catch (error) {
        // Expected to fail in unit test environment - ignore
      }
    })

    it('registers vite:preloadError event listener', async () => {
      await import('../client/initCypressTests.js')

      // Verify that addEventListener was called with 'vite:preloadError'
      expect((global.window as any).addEventListener).toHaveBeenCalledWith(
        'vite:preloadError',
        expect.any(Function),
        { once: false },
      )
    })

    it('handles vite:preloadError for support file imports', async () => {
      await import('../client/initCypressTests.js')

      // Get the event listener that was registered
      const addEventListenerCalls = ((global.window as any).addEventListener as any).mock.calls
      const preloadErrorHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === 'vite:preloadError',
      )?.[1]

      expect(preloadErrorHandler).toBeDefined()
      expect(typeof preloadErrorHandler).toBe('function')

      // Vite's vite:preloadError event payload is a raw JavaScript Error object.
      // The URL is embedded in the error's message string, not as a separate url property.
      const mockError = new Error('Failed to fetch dynamically imported module: /__cypress/src/cypress/support/component.js')
      const mockEvent = {
        payload: mockError,
        preventDefault: vi.fn(),
      }

      // Call the handler
      preloadErrorHandler(mockEvent)

      // Verify preventDefault was called
      expect(mockEvent.preventDefault).toHaveBeenCalled()

      // Verify reload was called
      expect((global.window as any).location.reload).toHaveBeenCalled()
    })

    it('extracts URL from error message when url property is not available', async () => {
      await import('../client/initCypressTests.js')

      // Get the event listener that was registered
      const addEventListenerCalls = ((global.window as any).addEventListener as any).mock.calls
      const preloadErrorHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === 'vite:preloadError',
      )?.[1]

      expect(preloadErrorHandler).toBeDefined()
      expect(typeof preloadErrorHandler).toBe('function')

      // Test with Error object that has URL in message (no url property)
      // This matches the actual Vite vite:preloadError event structure
      const mockError = new Error('Failed to fetch dynamically imported module: /__cypress/src/cypress/support/component.js')
      const mockEvent = {
        payload: mockError,
        preventDefault: vi.fn(),
      }

      // Call the handler
      preloadErrorHandler(mockEvent)

      // Verify preventDefault was called (URL extracted from message)
      expect(mockEvent.preventDefault).toHaveBeenCalled()

      // Verify reload was called
      expect((global.window as any).location.reload).toHaveBeenCalled()
    })

    it('ignores vite:preloadError for non-support file imports', async () => {
      await import('../client/initCypressTests.js')

      // Get the event listener that was registered
      const addEventListenerCalls = ((global.window as any).addEventListener as any).mock.calls
      const preloadErrorHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === 'vite:preloadError',
      )?.[1]

      expect(preloadErrorHandler).toBeDefined()

      // Vite's vite:preloadError event payload is a raw JavaScript Error object.
      // The URL is embedded in the error's message string, not as a separate url property.
      const mockError = new Error('Failed to fetch dynamically imported module: /__cypress/src/@fs/some/other/file.js')
      const mockEvent = {
        payload: mockError,
        preventDefault: vi.fn(),
      }

      // Call the handler
      preloadErrorHandler(mockEvent)

      // Verify preventDefault was NOT called (error not for support file)
      expect(mockEvent.preventDefault).not.toHaveBeenCalled()

      // Verify reload was NOT called
      expect((global.window as any).location.reload).not.toHaveBeenCalled()
    })

    it('prevents infinite reload loops by only handling first error', async () => {
      await import('../client/initCypressTests.js')

      // Get the event listener that was registered
      const addEventListenerCalls = ((global.window as any).addEventListener as any).mock.calls
      const preloadErrorHandler = addEventListenerCalls.find(
        (call: any[]) => call[0] === 'vite:preloadError',
      )?.[1]

      expect(preloadErrorHandler).toBeDefined()

      // Vite's vite:preloadError event payload is a raw JavaScript Error object.
      // The URL is embedded in the error's message string, not as a separate url property.
      const mockError1 = new Error('Failed to fetch dynamically imported module: /__cypress/src/cypress/support/component.js')
      const mockEvent1 = {
        payload: mockError1,
        preventDefault: vi.fn(),
      }

      const mockError2 = new Error('Failed to fetch dynamically imported module: /__cypress/src/cypress/support/component.js')
      const mockEvent2 = {
        payload: mockError2,
        preventDefault: vi.fn(),
      }

      // Call handler twice with same support file error
      preloadErrorHandler(mockEvent1)
      preloadErrorHandler(mockEvent2)

      // First call should handle it
      expect(mockEvent1.preventDefault).toHaveBeenCalled()
      expect((global.window as any).location.reload).toHaveBeenCalledTimes(1)

      // Second call should be ignored (preloadErrorHandled flag)
      expect(mockEvent2.preventDefault).not.toHaveBeenCalled()
      expect((global.window as any).location.reload).toHaveBeenCalledTimes(1)
    })
  })
})
