import _ from 'lodash'
import { expect } from 'chai'
import sinon from 'sinon'

import {
  checkIfResolveChangedRootFolder,
  parseEnv,
  utils,
  resolveConfigValues,
  setPluginResolvedOn,
  setAbsolutePaths,
  setNodeBinary,
  relativeToProjectRoot,
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

  context('.setPluginResolvedOn', () => {
    it('resolves an object with single property', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          value: 'bar',
          from: 'plugin',
        },
      })
    })

    it('resolves an object with multiple properties', () => {
      const cfg = {}
      const obj = {
        foo: 'bar',
        baz: [1, 2, 3],
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          value: 'bar',
          from: 'plugin',
        },
        baz: {
          value: [1, 2, 3],
          from: 'plugin',
        },
      })
    })

    it('resolves a nested object', () => {
      // we need at least the structure
      const cfg = {
        foo: {
          bar: 1,
        },
      }
      const obj = {
        foo: {
          bar: 42,
        },
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg, 'foo.bar gets value').to.deep.eq({
        foo: {
          bar: {
            value: 42,
            from: 'plugin',
          },
        },
      })
    })

    // https://github.com/cypress-io/cypress/issues/7959
    it('resolves a single object', () => {
      const cfg = {
      }
      const obj = {
        foo: {
          bar: {
            baz: 42,
          },
        },
      }

      setPluginResolvedOn(cfg, obj)

      expect(cfg).to.deep.eq({
        foo: {
          from: 'plugin',
          value: {
            bar: {
              baz: 42,
            },
          },
        },
      })
    })
  })

  context('_.defaultsDeep', () => {
    it('merges arrays', () => {
      // sanity checks to confirm how Lodash merges arrays in defaultsDeep
      const diffs = {
        list: [1],
      }
      const cfg = {
        list: [1, 2],
      }
      const merged = _.defaultsDeep({}, diffs, cfg)

      expect(merged, 'arrays are combined').to.deep.eq({
        list: [1, 2],
      })
    })
  })

  context('.setAbsolutePaths', () => {
    it('is noop without projectRoot', () => {
      expect(setAbsolutePaths({})).to.deep.eq({})
    })

    it('does not mutate existing obj', () => {
      const obj = {}

      expect(setAbsolutePaths(obj)).not.to.eq(obj)
    })

    it('ignores non special *folder properties', () => {
      const obj = {
        projectRoot: '/_test-output/path/to/project',
        blehFolder: 'some/rando/path',
        foo: 'bar',
        baz: 'quux',
      }

      expect(setAbsolutePaths(obj)).to.deep.eq(obj)
    })

    return ['fileServerFolder', 'fixturesFolder'].forEach((folder) => {
      it(`converts relative ${folder} to absolute path`, () => {
        const obj = {
          projectRoot: '/_test-output/path/to/project',
        }

        obj[folder] = 'foo/bar'

        const expected = {
          projectRoot: '/_test-output/path/to/project',
        }

        expected[folder] = '/_test-output/path/to/project/foo/bar'

        expect(setAbsolutePaths(obj)).to.deep.eq(expected)
      })
    })
  })

  context('.setNodeBinary', () => {
    beforeEach(function () {
      this.nodeVersion = process.versions.node
    })

    it('sets bundled Node ver if nodeVersion != system', function () {
      const obj = setNodeBinary({
        nodeVersion: 'bundled',
      })

      expect(obj).to.deep.eq({
        nodeVersion: 'bundled',
        resolvedNodeVersion: this.nodeVersion,
      })
    })

    it('sets cli Node ver if nodeVersion = system', function () {
      const obj = setNodeBinary({
        nodeVersion: 'system',
      }, '/foo/bar/node', '1.2.3')

      expect(obj).to.deep.eq({
        nodeVersion: 'system',
        resolvedNodeVersion: '1.2.3',
        resolvedNodePath: '/foo/bar/node',
      })
    })

    it('sets bundled Node ver and if nodeVersion = system and userNodePath undefined', function () {
      const obj = setNodeBinary({
        nodeVersion: 'system',
      }, undefined, '1.2.3')

      expect(obj).to.deep.eq({
        nodeVersion: 'system',
        resolvedNodeVersion: this.nodeVersion,
      })
    })

    it('sets bundled Node ver and if nodeVersion = system and userNodeVersion undefined', function () {
      const obj = setNodeBinary({
        nodeVersion: 'system',
      }, '/foo/bar/node')

      expect(obj).to.deep.eq({
        nodeVersion: 'system',
        resolvedNodeVersion: this.nodeVersion,
      })
    })
  })

  describe('relativeToProjectRoot', () => {
    context('posix', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = '/root/projects'
        const supportFile = '/root/projects/cypress/support/e2e.js'

        expect(relativeToProjectRoot(projectRoot, supportFile)).to.eq('cypress/support/e2e.js')
      })
    })

    context('windows', () => {
      it('returns path of file relative to projectRoot', () => {
        const projectRoot = `\\root\\projects`
        const supportFile = `\\root\\projects\\cypress\\support\\e2e.js`

        expect(relativeToProjectRoot(projectRoot, supportFile)).to.eq(`cypress\\support\\e2e.js`)
      })
    })
  })
})
