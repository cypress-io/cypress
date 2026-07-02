import { vi, describe, it, expect, afterEach } from 'vitest'
import errors from '@packages/errors'
import { updateWithPluginValues } from '../../src/project'

vi.mock('@packages/errors', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      throwErr: vi.fn(),
    },
  }
})

describe('config/src/project/index', () => {
  describe('.updateWithPluginValues', () => {
    it('is noop when no overrides', () => {
      expect(updateWithPluginValues({ foo: 'bar' } as any, null as any, 'e2e')).toEqual({
        foo: 'bar',
      })
    })

    it('is noop with empty overrides', () => {
      expect(updateWithPluginValues({ foo: 'bar' } as any, {} as any, 'e2e')).toEqual({
        foo: 'bar',
      })
    })

    it('updates resolved config values and returns config with overrides', () => {
      const cfg = {
        foo: 'bar',
        baz: 'quux',
        quux: 'foo',
        lol: 1234,
        env: {
          a: 'a',
          b: 'b',
        },
        // previously resolved values
        resolved: {
          foo: { value: 'bar', from: 'default' },
          baz: { value: 'quux', from: 'cli' },
          quux: { value: 'foo', from: 'default' },
          lol: { value: 1234, from: 'env' },
          env: {
            a: { value: 'a', from: 'config' },
            b: { value: 'b', from: 'config' },
          },
        },
      }

      const overrides = {
        baz: 'baz',
        quux: ['bar', 'quux'],
        env: {
          b: 'bb',
          c: 'c',
        },
      }

      expect(updateWithPluginValues(cfg as any, overrides, 'e2e')).toEqual({
        foo: 'bar',
        baz: 'baz',
        lol: 1234,
        quux: ['bar', 'quux'],
        env: {
          a: 'a',
          b: 'bb',
          c: 'c',
        },
        resolved: {
          foo: { value: 'bar', from: 'default' },
          baz: { value: 'baz', from: 'plugin' },
          quux: { value: ['bar', 'quux'], from: 'plugin' },
          lol: { value: 1234, from: 'env' },
          env: {
            a: { value: 'a', from: 'config' },
            b: { value: 'bb', from: 'plugin' },
            c: { value: 'c', from: 'plugin' },
          },
        },
      })
    })

    it('keeps the list of browsers if the plugins returns empty object', () => {
      const browser = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }

      const cfg = {
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      }

      const overrides = {}

      expect(updateWithPluginValues(cfg as any, overrides, 'e2e')).toEqual({
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      })
    })

    it('catches browsers=null returned from plugins', () => {
      const browser = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }

      const cfg = {
        projectRoot: '/foo/bar',
        browsers: [browser],
        resolved: {
          browsers: {
            value: [browser],
            from: 'default',
          },
        },
      }

      const overrides = {
        browsers: null,
      }

      const throwErrSpy = vi.spyOn(errors, 'throwErr')

      updateWithPluginValues(cfg as any, overrides, 'e2e')

      expect(throwErrSpy).toHaveBeenCalledWith('CONFIG_VALIDATION_MSG_ERROR', 'configFile', undefined, 'Missing browsers list')
    })

    it('allows user to filter browsers', () => {
      const browserOne = {
        name: 'fake browser name',
        family: 'chromium',
        displayName: 'My browser',
        version: 'x.y.z',
        path: '/path/to/browser',
        majorVersion: 'x',
      }
      const browserTwo = {
        name: 'fake electron',
        family: 'chromium',
        displayName: 'Electron',
        version: 'x.y.z',
        // Electron browser is built-in, no external path
        path: '',
        majorVersion: 'x',
      }

      const cfg = {
        browsers: [browserOne, browserTwo],
        resolved: {
          browsers: {
            value: [browserOne, browserTwo],
            from: 'default',
          },
        },
      }

      const overrides = {
        browsers: [browserTwo],
      }

      const updated = updateWithPluginValues(cfg as any, overrides, 'e2e')

      expect(updated.resolved, 'resolved values').toEqual({
        browsers: {
          value: [browserTwo],
          from: 'plugin',
        },
      })

      expect(updated, 'all values').toEqual({
        browsers: [browserTwo],
        resolved: {
          browsers: {
            value: [browserTwo],
            from: 'plugin',
          },
        },
      })
    })

    describe('numTestsKeptInMemory', () => {
      afterEach(() => {
        vi.unstubAllEnvs()
      })

      it('forces numTestsKeptInMemory to 0 in run mode when setupNodeEvents returns a non-zero value', () => {
        const cfg = {
          isTextTerminal: true,
          numTestsKeptInMemory: 0,
          resolved: {
            numTestsKeptInMemory: { value: 0, from: 'default' },
          },
        }

        const overrides = {
          numTestsKeptInMemory: 50,
        }

        const updated = updateWithPluginValues(cfg as any, overrides, 'e2e')

        expect(updated.numTestsKeptInMemory).toEqual(0)
      })

      it('honors numTestsKeptInMemory in run mode when CYPRESS_INTERNAL_HONOR_NUM_TESTS_KEPT_IN_MEMORY=true', () => {
        vi.stubEnv('CYPRESS_INTERNAL_HONOR_NUM_TESTS_KEPT_IN_MEMORY', 'true')

        const cfg = {
          isTextTerminal: true,
          numTestsKeptInMemory: 0,
          resolved: {
            numTestsKeptInMemory: { value: 0, from: 'default' },
          },
        }

        const overrides = {
          numTestsKeptInMemory: 50,
        }

        const updated = updateWithPluginValues(cfg as any, overrides, 'e2e')

        expect(updated.numTestsKeptInMemory).toEqual(50)
      })

      it('does not force numTestsKeptInMemory to 0 in open mode', () => {
        const cfg = {
          isTextTerminal: false,
          numTestsKeptInMemory: 0,
          resolved: {
            numTestsKeptInMemory: { value: 0, from: 'default' },
          },
        }

        const overrides = {
          numTestsKeptInMemory: 50,
        }

        const updated = updateWithPluginValues(cfg as any, overrides, 'e2e')

        expect(updated.numTestsKeptInMemory).toEqual(50)
      })
    })
  })
})
