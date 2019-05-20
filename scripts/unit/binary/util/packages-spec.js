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

describe.only('packages', () => {
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
    const recurse = (dir) => {

      return _.extend({}, ..._.map(dir, (val, key) => {
        return {
          [key]: recurse(val._items),
        }
      }))
    }

    const dir = JSON.stringify(recurse({ files: mockfs.getMockRoot() }).files, null, ' ')

    snapshot(dir)
  })
})

afterEach(() => {
  mockfs.restore()
})

