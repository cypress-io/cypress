const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const client = require('socket.io-client')
const expect = require('chai').expect
const pkg = require('../package.json')
const lib = require('../index')

describe('Socket', () => {
  it('exports server', () => {
    expect(lib.server).to.eq(server)
  })

  it('exports client', () => {
    expect(lib.client).to.eq(client)
  })

  context('.getPathToClientSource', () => {
    it('returns path to socket.io.js', () => {
      const clientPath = path.join(process.cwd(), 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')

      expect(lib.getPathToClientSource()).to.eq(clientPath)
    })

    it('makes sure socket.io.js actually exists', (done) => {
      fs.stat(lib.getPathToClientSource(), done)
    })
  })

  context('.getClientVersion', () => {
    it('returns client version', () => {
      expect(lib.getClientVersion()).to.eq(pkg.dependencies['socket.io-client'])
    })
  })

  context('.getClientSource', () => {
    it('returns client source as a string', (done) => {
      const clientPath = path.join(process.cwd(), 'node_modules', 'socket.io-client', 'dist', 'socket.io.js')

      fs.readFile(clientPath, 'utf8', (err, str) => {
        if (err) done(err)

        expect(lib.getClientSource()).to.eq(str)
        done()
      })
    })
  })
})
