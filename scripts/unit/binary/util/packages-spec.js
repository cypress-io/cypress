/* eslint-env mocha */

const os = require('os')
const _ = require('lodash')
const mockfs = require('mock-fs')
const _snapshot = require('snap-shot-it')

const packages = require('../../../binary/util/packages')
const { transformRequires } = require('../../../binary/util/transform-requires')

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
})

afterEach(() => {
  mockfs.restore()
})

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

  return JSON.stringify(recurse({ root: mockfs.getMockRoot() }, -1).root, null, ' ')
}
