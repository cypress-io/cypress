/* eslint-env mocha */

const os = require('os')
const _ = require('lodash')
const path = require('path')
const proxyquire = require('proxyquire')
const mockfs = require('mock-fs')
const _snapshot = require('snap-shot-it')
const chai = require('chai')

chai.use(require('chai-as-promised'))

const { expect } = chai

const packages = require('../../../binary/util/packages')
const { transformRequires } = require('../../../binary/util/transform-requires')
const { testStaticAssets } = require('../../../binary/util/testStaticAssets')

global.beforeEach(() => {
  mockfs.restore()
})
const snapshot = (...args) => {
  mockfs.restore()

  return _snapshot(...args)
}

describe('packages', () => {
  it('can copy files from package.json', async () => {
    mockfs({
      'packages': {
        'coffee': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': new Buffer('console.log()') },
          'lib': { 'foo.js': '{}' },
        },
      },
    })

    await packages.copyAllToDist(os.tmpdir())

    const files = getFs()

    snapshot(files)
  })

})
describe('transformRequires', () => {

  it('can find and replace symlink requires', async () => {
    const buildRoot = 'build/linux/Cypress/resources/app'

    mockfs({
      [buildRoot]: { 'packages': {
        'foo': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': new Buffer('console.log()') },
          'lib': { 'foo.js': /*js*/`require("@packages/bar/src/main")${''}` },
        },
        'bar': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': new Buffer('console.log()') },
          'lib': { 'foo.js': `require("@packages/foo/lib/somefoo")${''}` },
          'node_modules': { 'no-search.js': '' },
          'dist': { 'no-search.js': '' },
        },
      },
      },
    })

    await transformRequires(buildRoot)

    // console.log(getFs())

    snapshot(getFs())
  })

  it('can find and replace symlink requires on win32', async () => {
    const { transformRequires } = proxyquire('../../../binary/util/transform-requires', { path: path.win32 })
    const buildRoot = 'build/linux/Cypress/resources/app'

    mockfs({
      [buildRoot]: { 'packages': {
        'foo': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': new Buffer('console.log()') },
          'lib': { 'foo.js': /*js*/`require("@packages/bar/src/main")${''}` },
        },
        'bar': {
          'package.json': '{"main":"src/main.js", "name": "foo", "files": ["lib"]}',
          'src': { 'main.js': new Buffer('console.log()') },
          'lib': { 'foo.js': `require("@packages/foo/lib/somefoo")${''}` },
          'node_modules': { 'no-search.js': '' },
          'dist': { 'no-search.js': '' },
        },
      },
      },
    })

    await transformRequires(buildRoot)

    logFs()

    snapshot(getFs())
  })
})

describe('testStaticAssets', () => {
  it('can detect valid runner js', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {
              'runner.js': `${'some js\n'.repeat(5000)}`,
            },
          },
          'desktop-gui': {
            'dist': {
              'index.html': 'window.env = \'development\'',
            },
          },
        },
      },
    })

    // logFs()

    await testStaticAssets(buildDir)

  })

  it('can detect runner js with developer livereload enabled', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {
              'runner.js': `
              ${'some js\n'.repeat(5000)}
              //webpack-livereload-plugin
              some more js
              `,
            },
          },
          'desktop-gui': {
            'dist': {
              'index.html': 'window.env = \'development\'',
            },
          },
        },
      },
    })

    // logFs()

    await expect(testStaticAssets(buildDir)).to.rejected.with.eventually
    .property('message').contain('livereload')

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

    await expect(testStaticAssets(buildDir)).to.rejected.with.eventually
    .property('message').contain('assets to be found')

  })

  it('can detect runner js minified code', async () => {
    const buildDir = 'resources/app'

    mockfs({
      [buildDir]: {
        'packages': {
          'runner': {
            'dist': {
              'runner.js': `
              ${'minified code;minified code;minified code;\n'.repeat(600)}
              `,
            },
          },
          'desktop-gui': {
            'dist': {
              'index.html': 'window.env = \'development\'',
            },
          },
        },
      },
    })
  })
})

afterEach(() => {
  mockfs.restore()
})

const logFs = () => {
  // eslint-disable-next-line no-console
  console.dir(getFs(), { depth: null })
}

const getFs = () => {
  const cwd = process.cwd().split('/').slice(1)

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
