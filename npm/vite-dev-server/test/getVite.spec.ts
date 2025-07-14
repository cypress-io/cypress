import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import { getVite } from '../src/getVite'

const osMocks = vi.hoisted(() => {
  return {
    platform: vi.fn(),
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

              return `vite-${version}/package.json`
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

    vi.mock('/mock/vite/index.cjs', async () => {
      return {
        default: {
          moduleFormat: 'cjs',
        },
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('esm', () => {
    describe('version 4', () => {
      it('should return the correct ESM vite instance', async () => {
        vi.mock('vite-4/package.json', () => {
          return {
            default: {
              version: '4.0.0',
              exports: {
                '.': {
                  import: '/mock/vite/dist/node/index.js',
                  require: '/mock/vite/index.cjs',
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '4',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })

    describe('version 5', () => {
      it('should return the correct ESM vite instance', async () => {
        vi.mock('vite-5/package.json', () => {
          return {
            default: {
              version: '5.0.0',
              exports: {
                '.': {
                  import: {
                    default: '/mock/vite/dist/node/index.js',
                  },
                  require: {
                    default: '/mock/vite/index.cjs',
                  },
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '5',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })

    describe('version 6', () => {
      it('should return the correct ESM vite instance', async () => {
        vi.mock('vite-6/package.json', () => {
          return {
            default: {
              version: '6.0.0',
              exports: {
                '.': {
                  import: '/mock/vite/dist/node/index.js',
                  require: '/mock/vite/index.cjs',
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '6',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })

    describe('version 7', () => {
      it('should return the correct ESM vite instance', async () => {
        vi.mock('vite-7/package.json', async () => {
          return {
            default: {
              version: '7.0.0',
              exports: {
                '.': '/mock/vite/dist/node/index.js',
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '7',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'esm',
        })
      })
    })
  })

  describe('cjs', () => {
    describe('version 4', () => {
      it('should return the correct CJS vite instance', async () => {
        vi.mock('vite-4-cjs/package.json', () => {
          return {
            default: {
              version: '4.0.0',
              exports: {
                '.': {
                  require: '/mock/vite/index.cjs',
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '4-cjs',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'cjs',
        })
      })
    })

    describe('version 5', () => {
      it('should return the correct CJS vite instance', async () => {
        vi.mock('vite-5-cjs/package.json', () => {
          return {
            default: {
              version: '5.0.0',
              exports: {
                '.': {
                  require: {
                    default: '/mock/vite/index.cjs',
                  },
                  import: {
                    default: null,
                  },
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '5-cjs',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'cjs',
        })
      })
    })

    describe('version 6', () => {
      it('should return the correct CJS vite instance', async () => {
        vi.mock('vite-6-cjs/package.json', () => {
          return {
            default: {
              version: '6.0.0',
              exports: {
                '.': {
                  require: '/mock/vite/index.cjs',
                },
              },
            },
          }
        })

        const vite = await getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '6-cjs',
          },
        })

        expect(vite).toEqual({
          moduleFormat: 'cjs',
        })
      })
    })

    describe('version 7', () => {
      it('should fail as vite 7 does not support cjs', async () => {
        vi.mock('vite-7-cjs/package.json', async () => {
          return {
            default: {
              version: '7.0.0',
              exports: {},
            },
          }
        })

        await expect(getVite({
          // @ts-expect-error - mock config
          cypressConfig: {
            projectRoot: '7-cjs',
          },
        })).rejects.toThrowError('CJS builds of vite 7 are not supported')
      })
    })
  })

  describe('windows', () => {
    it('adds the "file://" prefix to paths when importing', async () => {
      osMocks.platform.mockReturnValue('win32')

      vi.mock('file://vite-7-windows/package.json', async () => {
        return {
          default: {
            version: '7.0.0',
            exports: {
              '.': '/mock/vite/dist/node/index.js',
            },
          },
        }
      })

      vi.mock('file://mock/vite/dist/node/index.js', async () => {
        return {
          moduleFormat: 'esm',
        }
      })

      const vite = await getVite({
        // @ts-expect-error - mock config
        cypressConfig: {
          projectRoot: '7-windows',
        },
      })

      expect(vite).toEqual({
        moduleFormat: 'esm',
      })
    })
  })
})
