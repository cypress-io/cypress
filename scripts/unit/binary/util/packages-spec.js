/* global sinon */
const os = require('os')
const _ = require('lodash')
const path = require('path')
const proxyquire = require('proxyquire')
const mockfs = require('mock-fs')
const _snapshot = require('snap-shot-it')
const chai = require('chai')
const debug = require('debug')('test')

chai.use(require('chai-as-promised'))

const { expect } = chai

const packages = require('../../../binary/util/packages')
const { transformRequires, rewritePackageNames } = require('../../../binary/util/transform-requires')
const { testPackageStaticAssets } = require('../../../binary/util/testStaticAssets')
const externalUtils = require('../../../binary/util/3rd-party')

global.beforeEach(() => {
  mockfs.restore()
})

const snapshot = (...args) => {
  mockfs.restore()

  return _snapshot(...args)
}

describe('packages', () => {
  it('can copy files from package.json', async () => {
    sinon.stub(os, 'tmpdir').returns('/tmp')

    mockfs({
      'packages': {
        'coffee': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': Buffer.from('console.log()') },
          'lib': { 'foo.js': '{}' },
        },
      },
    })

    const globbyStub = sinon.stub(externalUtils, 'globby')

    globbyStub
    .withArgs(['./packages/*', './npm/*'])
    .resolves(['./packages/coffee'])

    globbyStub
    .withArgs(['package.json', 'lib', 'src/main.js'])
    .resolves([
      'package.json',
      'lib/foo.js',
      'src/main.js',
    ])

    const destinationFolder = os.tmpdir()

    debug('destination folder %s', destinationFolder)

    await packages.copyAllToDist(destinationFolder)

    const files = getFs()

    snapshot(files)
  })
})

describe('rewritePackageNames', () => {
  it('renames requires', () => {
    const fileStr = `
      const a = require('@packages/server')
      const b = require('@packages/server-ct')
      const b = require('@packages/runner-ct/')
      const c = require("@packages/runner-ct/lib/quux.js")
    `

    const stub = sinon.stub()

    const newStr = rewritePackageNames(fileStr, '/root/build', '/root/packages/dep/index.js', stub)

    expect(newStr).to.eq(`
      const a = require('../../build/packages/server')
      const b = require('../../build/packages/server-ct')
      const b = require('../../build/packages/runner-ct/')
      const c = require("../../build/packages/runner-ct/lib/quux.js")
    `)

    expect(stub.getCall(0).args[0]).to.eq(`require('../../build/packages/server'`)
    expect(stub.getCall(1).args[0]).to.eq(`require('../../build/packages/server-ct'`)
    expect(stub.getCall(2).args[0]).to.eq(`require('../../build/packages/runner-ct/`)
    expect(stub.getCall(3).args[0]).to.eq(`require("../../build/packages/runner-ct/`)
  })
})

describe('transformRequires', () => {
  it('can find and replace symlink requires', async function () {
    // these tests really refuse to work on Mac, so for now run it only on Linux
    if (os.platform() !== 'linux') {
      return this.skip()
    }

    const buildRoot = 'build/linux/Cypress/resources/app'

    mockfs({
      [buildRoot]: { 'packages': {
        'foo': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': Buffer.from('console.log()') },
          'lib': { 'foo.js': /*js*/`require("@packages/bar/src/main")${''}` },
        },
        'bar': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': Buffer.from('console.log()') },
          'lib': { 'foo.js': `require("@packages/foo/lib/somefoo")${''}` },
          'node_modules': { 'no-search.js': '' },
          'dist': { 'no-search.js': '' },
        },
      },
      },
    })

    sinon.stub(externalUtils, 'globby')
    .withArgs([
      'build/linux/Cypress/resources/app/packages/**/*.js',
      'build/linux/Cypress/resources/app/npm/**/*.js',
    ])
    .resolves([
      'build/linux/Cypress/resources/app/packages/foo/src/main.js',
      'build/linux/Cypress/resources/app/packages/foo/lib/foo.js',
      'build/linux/Cypress/resources/app/packages/bar/src/main.js',
      'build/linux/Cypress/resources/app/packages/bar/lib/foo.js',
    ])

    // should return number of transformed requires
    await expect(transformRequires(buildRoot)).to.eventually.eq(2)

    const files = getFs()

    if (debug.enabled) {
      debug('returned file system')
      /* eslint-disable-next-line no-console */
      console.error(files)
    }

    snapshot(files)
  })

  it('can find and replace symlink requires on win32', async function () {
    if (os.platform() !== 'linux') {
      return this.skip()
    }

    const { transformRequires } = proxyquire('../../../binary/util/transform-requires', { path: path.win32 })
    const buildRoot = 'build/linux/Cypress/resources/app'

    mockfs({
      [buildRoot]: { 'packages': {
        'foo': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': Buffer.from('console.log()') },
          'lib': { 'foo.js': /*js*/`require("@packages/bar/src/main")${''}` },
        },
        'bar': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': Buffer.from('console.log()') },
          'lib': { 'foo.js': `require("@packages/foo/lib/somefoo")${''}` },
          'node_modules': { 'no-search.js': '' },
          'dist': { 'no-search.js': '' },
        },
      },
      },
    })

    sinon.stub(externalUtils, 'globby')
    .withArgs([
      'build/linux/Cypress/resources/app/packages/**/*.js',
      'build/linux/Cypress/resources/app/npm/**/*.js',
    ])
    .resolves([
      'build/linux/Cypress/resources/app/packages/foo/src/main.js',
      'build/linux/Cypress/resources/app/packages/foo/lib/foo.js',
      'build/linux/Cypress/resources/app/packages/bar/src/main.js',
      'build/linux/Cypress/resources/app/packages/bar/lib/foo.js',
    ])

    await transformRequires(buildRoot)

    snapshot(getFs())
  })
})

describe('testStaticAssets', () => {
  it('can detect bad strings in asset', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {
              'runner.js': `
              some js
              some really bad string
              some more js
              `,
            },
          },
        },
      },
    })

    // logFs()

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/runner/dist/*.js`,
      badStrings: ['some really bad string'],
    })).to.rejected.with.eventually.property('message').contain('some really bad string')

    mockfs.restore()

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {},
          },
        },
      },
    })

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/runner/dist/*.js`,
      badStrings: ['some really bad string'],
    })).to.rejected.with.eventually
    .property('message').contain('assets to be found')
  })

  it('can detect asset with too many lines', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {
              'runner.js': `
              ${'minified code;minified code;minified code;\n'.repeat(50)}
              `,
            },
          },
        },
      },
    })

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/runner/dist/*.js`,
      minLineCount: 100,
    })).to.rejected.with.eventually
    .property('message').contain('minified')
  })

  it('can detect asset that includes specified number of goodStrings', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'test': {
            'file.css': `
              ${'-moz-user-touch: "none"\n'.repeat(5)}
              `,
          },
        },
      },
    })

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/test/file.css`,
      goodStrings: [['-moz-', 10]],
    })).to.rejected.with.eventually
    .property('message').contain('at least 10')
  })

  it('can have custom testAssetString tests', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'test': {
            'file.css': `
              ${'-moz-user-touch: "none"\n'.repeat(5)}
              foo-bar-baz\
              `,
          },
        },
      },
    })

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/test/file.css`,
      testAssetStrings: [
        [(str) => !str.split('\n').slice(-1)[0].includes('foo-bar-baz'), 'expected not to end with foo-bar-baz'],
      ],
    })).to.rejected.with.eventually
    .property('message').contain('foo-bar-baz')
  })
})

/*
// Example: Test real assets
  it('can detect', async () => {
    const buildDir = process.cwd()

    await expect(testPackageStaticAssets({
      assetGlob: `${buildDir}/packages/runner/dist/*.css`,
      goodStrings: [['-ms-', 20]],
    })).not.be.rejected
  })
*/

afterEach(() => {
  mockfs.restore()
})

// eslint-disable-next-line
const logFs = () => {
  // eslint-disable-next-line no-console
  console.dir(getFs(), { depth: null })
}

const getFs = () => {
  const cwd = process.cwd().split(path.sep).slice(1)

  const recurse = (dir, d) => {
    if (_.isString(dir)) {
      return dir
    }

    return _.extend({}, ..._.map(dir, (val, key) => {
      let nextDepth = null

      if (d !== null) {
        if (d === -1) {
          nextDepth = d + 1
        } else if (!(d > cwd.length) && key === cwd[d]) {
          key = 'foo'
          nextDepth = d + 1

          if (d === cwd.length - 1) {
            return { '[cwd]': recurse(val._items, nextDepth) }
          }

          return recurse(val._items, nextDepth)
        } else {
          nextDepth = null
        }
      }

      return {
        [key]: recurse(val._content ? val._content.toString() : val._items, nextDepth),
      }
    }))
  }

  return recurse({ root: mockfs.getMockRoot() }, -1).root
}
