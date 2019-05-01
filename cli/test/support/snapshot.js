const _snapshot = require('snap-shot-it')
const mockfs = require('mock-fs')

const snapshot = (...args) => {
  mockfs.restore()
  _snapshot(...args)
}

module.exports = snapshot
