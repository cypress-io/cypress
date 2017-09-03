require('../spec_helper')

const path = require('path')

const fs = require('../../lib/fs')
const unzip = require('../../lib/download/unzip')

describe('unzip', function () {
  context('#cleanup', () =>
    it('removes zip', function () {
      let zipDestination = path.join(__dirname, 'foo.zip')

      let opts = {
        initialize: false,
        zipDestination,
      }

      return fs.writeFileAsync(zipDestination, 'foo bar baz')
      .then(() => {
        return unzip.cleanup(opts)
      }).then(() =>
        fs.statAsync(zipDestination)
        .catch(() => {})
      )
    })
  )
})
