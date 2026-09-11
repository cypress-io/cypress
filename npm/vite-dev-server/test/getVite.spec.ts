import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import { getVite, ViteVersionNotSupportedError, ViteNotInstalledError } from '../src/getVite.js'

const osMocks = vi.hoisted(() => {
  return {
    platform: vi.fn(),
  }
})

/** When true, `path.resolve` / `pathToFileURL` behave like Node on win32 (tests run on darwin/linux). */
const winPathMocks = vi.hoisted(() => {
  return {
    simulateWin32: false,
  }
})

describe('getVite', () => {
  beforeEach(() => {
    // see details on https://vitest.dev/api/vi.html#vi-mock as vi.mock is hoisted to the top of the file
    vi.mock('os', () => {
      return {
        default: {
          platform: osMocks.platform,
        },
      }
    })

    vi.mock('url', async (importOriginal) => {
      const actual = await importOriginal<typeof import('url')>()

      return {
        ...actual,
        pathToFileURL: (pathStr: string) => {
          if (winPathMocks.simulateWin32) {
            const slash = pathStr.replace(/\\/g, '/')

            return new URL(`file:///${slash}`)
          }

          return actual.pathToFileURL(pathStr)
        },
      }
    })

    vi.mock('path', async (importOriginal) => {
      const pathModule = await importOriginal<typeof import('path')>()
      const resolveImpl = (...args: string[]) => {
        if (winPathMocks.simulateWin32) {
          return pathModule.win32.resolve(...args)
        }

        return pathModule.resolve(...args)
      }

      return {
        ...pathModule,
        default: {
          ...pathModule,
          resolve: resolveImpl,
        },
      }
    })

    osMocks.platform.mockReturnValue('linux')

    vi.mock('module', async () => {
      const original = await vi.importActual('module')

      return {
        ...original,
        createRequire: vi.fn(() => {
          return {
            resolve: vi.fn((id: string, opts: any) => {
              // a bit hacky, but pass in the version as the project path so we don't muck up the module cache
              const version = opts.paths[0]

              // Ensure returned paths are absolute, since `getVite()` now uses `pathToFileURL()`.
              // Use a Windows filesystem path for the windows test case (`require.resolve` returns a path, not a URL).
              if (String(version).includes('windows')) {
                return `C:\\vite-${version}\\package.json`
              }

              return `/vite-${version}/package.json`
            }),
          }
        }),
      }
    })

    vi.mock('/mock/vite/dist/node/index.js', async () => {
      return {
        moduleFormat: 'esm',
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ViteVersionNotSupportedError', () => {
    it('should throw an error if the vite version is not supported', async () => {
      vi.mock('/vite-7/package.json', async () => {
        return {
          default: {
            version: '7.0.0',
          },
        }
      })

      try {
        await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '7',
          },
        })

        throw new Error('Expected getVite to throw')
      } catch (err) {
        expect(err).toBeInstanceOf(ViteVersionNotSupportedError)
        expect((err as Error).message).toBe('Vite 8 is the required version to use cypress/vite-dev-server. Found Vite version v7.0.0')
      }
    })
  })

  describe('ViteNotInstalledError', () => {
    it('should throw an error if vite is not installed', async () => {
      try {
        await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: 'does-not-exist',
          },
        })

        throw new Error('Expected getVite to throw')
      } catch (err) {
        expect(err).toBeInstanceOf(ViteNotInstalledError)
        expect((err as Error).message).toContain('Could not find "vite" in your project\'s dependencies. Please install "vite" to fix this error.\n\nError: Cannot find module \'/vite-does-not-exist/package.json\'')
      }
    })
  })

  // Minimum supported major is 8; newer majors (9+) are allowed, but warned in the launchpad, and should load the same ESM entry.
  describe('esm', () => {
    describe('version 8', () => {
      it('should return the correct ESM vite instance', async () => {
        vi.mock('/vite-8/package.json', async () => {
          return {
            default: {
              version: '8.0.0',
              exports: {
                '.': '/mock/vite/dist/node/index.js',
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '8',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })

    // This is to make sure the launchpad warns that this version is not expected/supported,
    // but the user is able to attempt usage anyway.
    describe('Future versions', () => {
      it('should return the correct ESM vite instance for Vite 9+', async () => {
        vi.mock('/vite-9/package.json', async () => {
          return {
            default: {
              version: '9.0.0',
              exports: {
                '.': '/mock/vite/dist/node/index.js',
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '9',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })
  })

  describe('windows', () => {
    beforeEach(() => {
      winPathMocks.simulateWin32 = true
    })

    afterEach(() => {
      winPathMocks.simulateWin32 = false
    })

    it('adds the "file://" prefix to paths when importing', async () => {
      osMocks.platform.mockReturnValue('win32')

      vi.mock('file:///C:/vite-8-windows/package.json', async () => {
        return {
          default: {
            version: '8.0.0',
            exports: {
              '.': '/mock/vite/dist/node/index.js',
            },
          },
        }
      })

      vi.mock('file:///C:/mock/vite/dist/node/index.js', async () => {
        return {
          moduleFormat: 'esm',
        }
      })

      const vite = await getVite({
        // @ts-expect-error - mock config
        cypressConfig: {
          projectRoot: '8-windows',
        },
      })

      expect(vite).toEqual({
        moduleFormat: 'esm',
      })
    })
  })
})
