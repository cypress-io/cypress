const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const client = require('socket.io-client')
const parser = require('socket.io-parser')
const expect = require('chai').expect
const pkg = require('../package.json')
const lib = require('../index')
const resolvePkg = require('resolve-pkg')

const { PacketType } = parser

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

  context('blob encoding + decoding', () => {
    it('correctly encodes and decodes binary blob data', (done) => {
      const encoder = new parser.Encoder()

      const obj = {
        type: PacketType.EVENT,
        data: ['a', Buffer.from('abc', 'utf8')],
        // data: ['a', { foo: 'bar' }],
        id: 23,
        nsp: '/cool',
      }

      const originalData = obj.data

      const encodedPackets = encoder.encode(obj)

      const decoder = new parser.Decoder()

      decoder.on('decoded', (packet) => {
        obj.data = originalData
        obj.attachments = undefined
        expect(obj).to.eql(packet)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })

    it('correctly encodes and decodes circular data', (done) => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
      }

      circularObj.foo.circularObj = circularObj

      const obj = {
        type: PacketType.EVENT,
        data: ['a', circularObj],
        id: 23,
        nsp: '/cool',
      }

      const originalData = obj.data

      const encodedPackets = encoder.encode(obj)

      const decoder = new parser.Decoder()

      decoder.on('decoded', (packet) => {
        obj.data = originalData
        expect(obj).to.eql(packet)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })

    it('correctly encodes and decodes binary data with objs with no prototype', (done) => {
      const encoder = new parser.Encoder()

      const noProtoObj = Object.create(null)

      noProtoObj.foo = 'foo'

      const obj = {
        type: PacketType.EVENT,
        data: ['a', noProtoObj, Buffer.from('123', 'utf8')],
        id: 23,
        nsp: '/cool',
      }

      const originalData = obj.data

      const encodedPackets = encoder.encode(obj)

      const decoder = new parser.Decoder()

      decoder.on('decoded', (packet) => {
        obj.data = originalData
        obj.attachments = undefined
        expect(obj).to.eql(packet)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })
  })
})
