const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const client = require('socket.io-client')
const expect = require('chai').expect
const pkg = require('../package.json')
const lib = require('../index')
const resolvePkg = require('resolve-pkg')

describe('Socket', function () {
  it('exports server', function () {
    expect(lib.server).to.eq(server)
  })

  it('exports client', function () {
    expect(lib.client).to.eq(client)
  })

  context('.getPathToClientSource', function () {
    it('returns path to socket.io.js', function () {
      const clientPath = path.join(resolvePkg('socket.io-client'), 'dist', 'socket.io.js')

      expect(lib.getPathToClientSource()).to.eq(clientPath)
    })

    it('makes sure socket.io.js actually exists', function (done) {
      fs.stat(lib.getPathToClientSource(), done)
    })
  })

  context('.getClientVersion', function () {
    it('returns client version', function () {
      expect(lib.getClientVersion()).to.eq(pkg.dependencies['socket.io-client'])
    })
  })

  context('.getClientSource', function () {
    it('returns client source as a string', function (done) {
      const clientPath = path.join(resolvePkg('socket.io-client'), 'dist', 'socket.io.js')

      fs.readFile(clientPath, 'utf8', function (err, str) {
        if (err) done(err)

        expect(lib.getClientSource()).to.eq(str)
        done()
      })
    })
  })
})
