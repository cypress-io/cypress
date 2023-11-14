const fs = require('fs')
const path = require('path')
const server = require('socket.io')
const parser = require('socket.io-parser')
const { hasBinary } = require('socket.io-parser/dist/is-binary')
const expect = require('chai').expect
const pkg = require('../package.json')
const lib = require('../index')
const browserLib = require('../lib/browser')
const resolvePkg = require('resolve-pkg')

const { PacketType } = parser

describe('Socket', function () {
  it('exports server', function () {
    expect(lib.server).to.eq(server)
  })

  it('exports client from lib/browser', function () {
    expect(browserLib.client).to.be.defined
  })

  it('exports createWebSocket from lib/browser', function () {
    expect(browserLib.createWebsocket).to.be.defined
  })

  it('creates a websocket for non chromium and non webkit browsers', function () {
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'firefox' })

    expect(socket.io.opts.path).to.eq('/path')
    expect(socket.io.opts.transports[0]).to.eq('websocket')
  })

  it('creates a websocket for chromium browsers', function () {
    global.window = {}
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'chromium' })

    expect(socket._namespace).to.eq('/path/default')
  })

  it('creates a websocket for webkit browsers', function () {
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'webkit' })

    expect(socket.io.opts.path).to.eq('/path')
    expect(socket.io.opts.transports[0]).to.eq('polling')
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
        expect(packet).to.eql(obj)
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
        expect(packet.data[1] === packet.data[1].foo.circularObj).to.be.true
        expect(packet).to.eql(obj)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })

    it('correctly encodes and decodes circular data in array', (done) => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
      }

      circularObj.foo.circularArray = [circularObj, circularObj]

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
        expect(packet.data[1] === packet.data[1].foo.circularArray[0]).to.be.true
        expect(packet.data[1] === packet.data[1].foo.circularArray[1]).to.be.true
        expect(packet).to.eql(obj)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })

    it('correctly encodes and decodes circular data containing binary', (done) => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
        bin: Buffer.from('abc', 'utf8'),
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
        obj.attachments = undefined
        expect(packet.data[1] === packet.data[1].foo.circularObj).to.be.true
        expect(packet).to.eql(obj)
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
        expect(packet).to.eql(obj)
        done()
      })

      for (let i = 0; i < encodedPackets.length; i++) {
        decoder.add(encodedPackets[i])
      }
    })
  })

  context('hasBinary', () => {
    it('hasBinary handles binary data in toJSON()', () => {
      const x = {
        toJSON () {
          return Buffer.from('123', 'utf8')
        },
      }

      const data = ['a', x]

      expect(hasBinary(data)).to.be.true
    })
  })
})
