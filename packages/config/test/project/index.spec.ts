import { expect } from 'chai'

import errors from '@packages/errors'

import { updateWithPluginValues } from '../../src/project'

describe('config/src/project/index', () => {
  context('.updateWithPluginValues', () => {
    it('is noop when no overrides', () => {
      expect(updateWithPluginValues({ foo: 'bar' } as any, null as any, 'e2e')).to.deep.eq({
        foo: 'bar',
      })
    })

    it('is noop with empty overrides', () => {
      expect(updateWithPluginValues({ foo: 'bar' } as any, {} as any, 'e2e')).to.deep.eq({
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

      expect(updateWithPluginValues(cfg as any, overrides, 'e2e')).to.deep.eq({
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

      expect(updateWithPluginValues(cfg as any, overrides, 'e2e')).to.deep.eq({
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

      sinon.stub(errors, 'throwErr')
      updateWithPluginValues(cfg as any, overrides, 'e2e')

      expect(errors.throwErr).to.have.been.calledWith('CONFIG_VALIDATION_MSG_ERROR')
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

      expect(updated.resolved, 'resolved values').to.deep.eq({
        browsers: {
          value: [browserTwo],
          from: 'plugin',
        },
      })

      expect(updated, 'all values').to.deep.eq({
        browsers: [browserTwo],
        resolved: {
          browsers: {
            value: [browserTwo],
            from: 'plugin',
          },
        },
      })
    })
  })
})
