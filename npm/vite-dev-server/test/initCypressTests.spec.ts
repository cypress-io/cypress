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
})
