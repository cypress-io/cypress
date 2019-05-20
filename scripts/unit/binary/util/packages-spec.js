/* eslint-env mocha */

const os = require('os')
const _ = require('lodash')
const mockfs = require('mock-fs')
const _snapshot = require('snap-shot-it')

const packages = require('../../../binary/util/packages')

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

afterEach(() => {
  mockfs.restore()
})

const getFs = () => {
  const cwd = process.cwd().split('/').slice(1)

  const recurse = (dir, d) => {

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
        [key]: recurse(val._items, nextDepth),
      }
    }))
  }

  return JSON.stringify(recurse({ root: mockfs.getMockRoot() }, -1).root, null, ' ')
}
