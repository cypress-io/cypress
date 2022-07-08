import { expect } from 'chai'
import sinon from 'sinon'

import {
  checkIfResolveChangedRootFolder,
  parseEnv,
  utils,
  resolveConfigValues,
} from '../../src/project/utils'

describe('config/src/project/utils', () => {
  describe('checkIfResolveChangedRootFolder', () => {
    it('ignores non-absolute paths', () => {
      expect(checkIfResolveChangedRootFolder('foo/index.js', 'foo')).to.be.false
    })

    it('handles paths that do not switch', () => {
      expect(checkIfResolveChangedRootFolder('/foo/index.js', '/foo')).to.be.false
    })

    it('detects path switch', () => {
      expect(checkIfResolveChangedRootFolder('/private/foo/index.js', '/foo')).to.be.true
    })
  })

  context('.parseEnv', () => {
    it('merges together env from config, env from file, env from process, and env from CLI', () => {
      sinon.stub(utils, 'getProcessEnvVars').returns({
        version: '0.12.1',
        user: 'bob',
      })

      const obj = {
        env: {
          version: '0.10.9',
          project: 'todos',
          host: 'localhost',
          baz: 'quux',
        },

        envFile: {
          host: 'http://localhost:8888',
          user: 'brian',
          foo: 'bar',
        },
      }

      const envCLI = {
        version: '0.14.0',
        project: 'pie',
      }

      expect(parseEnv(obj, envCLI)).to.deep.eq({
        version: '0.14.0',
        project: 'pie',
        host: 'http://localhost:8888',
        user: 'bob',
        foo: 'bar',
        baz: 'quux',
      })
    })
  })

  context('.resolveConfigValues', () => {
    beforeEach(function () {
      this.expected = function (obj) {
        const merged = resolveConfigValues(obj.config, obj.defaults, obj.resolved)

        expect(merged).to.deep.eq(obj.final)
      }
    })

    it('sets baseUrl to default', function () {
      return this.expected({
        config: { baseUrl: null },
        defaults: { baseUrl: null },
        resolved: {},
        final: {
          baseUrl: {
            value: null,
            from: 'default',
          },
        },
      })
    })

    it('sets baseUrl to config', function () {
      return this.expected({
        config: { baseUrl: 'localhost' },
        defaults: { baseUrl: null },
        resolved: {},
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'config',
          },
        },
      })
    })

    it('does not change existing resolved values', function () {
      return this.expected({
        config: { baseUrl: 'localhost' },
        defaults: { baseUrl: null },
        resolved: { baseUrl: 'cli' },
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'cli',
          },
        },
      })
    })

    it('ignores values not found in configKeys', function () {
      return this.expected({
        config: { baseUrl: 'localhost', foo: 'bar' },
        defaults: { baseUrl: null },
        resolved: { baseUrl: 'cli' },
        final: {
          baseUrl: {
            value: 'localhost',
            from: 'cli',
          },
        },
      })
    })
  })
})
