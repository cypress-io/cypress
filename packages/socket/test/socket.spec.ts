import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import * as parser from 'socket.io-parser'
const { hasBinary } = parser
import pkg from '../package.json'
import * as lib from '../lib/node'
import * as browserLib from '../lib/client'
import resolvePkg from 'resolve-pkg'

const { PacketType } = parser

describe('Socket', function () {
  it('exports client from lib/browser', function () {
    expect(browserLib.client).toBeDefined()
  })

  it('exports createWebSocket from lib/browser', function () {
    expect(browserLib.createWebsocket).toBeDefined()
  })

  it('creates a websocket for non chromium and non webkit browsers', function () {
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'firefox' })

    // @ts-expect-error
    expect(socket.io.opts.path).toEqual('/path')
    // socket.io-client 4.6+ normalizes string transports into transport classes; the websocket transport class is named "WS".
    // @ts-expect-error
    expect(socket.io.opts.transports[0].name).toEqual('WS')
  })

  it('creates a websocket for chromium browsers', function () {
    // @ts-expect-error
    global.window = {}
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'chromium' })

    // @ts-expect-error
    expect(socket._namespace).toEqual('/path/default')
  })

  it('creates a websocket for webkit browsers', function () {
    const socket = browserLib.createWebsocket({ path: '/path', browserFamily: 'webkit' })

    // @ts-expect-error
    expect(socket.io.opts.path).toEqual('/path')
    // socket.io-client 4.6+ normalizes string transports into transport classes; the polling transport class is named "XHR".
    // @ts-expect-error
    expect(socket.io.opts.transports[0].name).toEqual('XHR')
  })

  describe('.getPathToClientSource', function () {
    it('returns path to socket.io.js', function () {
      const clientPath = path.join(resolvePkg('socket.io-client'), 'dist', 'socket.io.js')

      expect(lib.getPathToClientSource()).toEqual(clientPath)
    })

    it('makes sure socket.io.js actually exists', function () {
      return new Promise((resolve, reject) => {
        fs.stat(lib.getPathToClientSource(), (err, stats) => {
          if (err) {
            reject(err)
          } else {
            resolve(stats)
          }
        })
      })
    })
  })

  describe('.getClientVersion', function () {
    it('returns client version', function () {
      expect(lib.getClientVersion()).toEqual(pkg.dependencies['socket.io-client'])
    })
  })

  describe('blob encoding + decoding', () => {
    it('correctly encodes and decodes binary blob data', () => {
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

      return new Promise<void>((resolve) => {
        decoder.on('decoded', (packet) => {
          obj.data = originalData
          // @ts-expect-error
          obj.attachments = undefined
          expect(packet).toEqual(obj)
          resolve()
        })

        for (let i = 0; i < encodedPackets.length; i++) {
          decoder.add(encodedPackets[i])
        }
      })
    })

    it('correctly encodes and decodes circular data', () => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
      }

      // @ts-expect-error
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

      return new Promise<void>((resolve) => {
        decoder.on('decoded', (packet) => {
          obj.data = originalData
          expect(packet.data[1] === packet.data[1].foo.circularObj).toBe(true)
          expect(packet).toEqual(obj)
          resolve()
        })

        for (let i = 0; i < encodedPackets.length; i++) {
          decoder.add(encodedPackets[i])
        }
      })
    })

    it('correctly encodes and decodes circular data in array', () => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
      }

      // @ts-expect-error
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

      return new Promise<void>((resolve) => {
        decoder.on('decoded', (packet) => {
          obj.data = originalData
          expect(packet.data[1] === packet.data[1].foo.circularArray[0]).toBe(true)
          expect(packet.data[1] === packet.data[1].foo.circularArray[1]).toBe(true)
          expect(packet).toEqual(obj)
          resolve()
        })

        for (let i = 0; i < encodedPackets.length; i++) {
          decoder.add(encodedPackets[i])
        }
      })
    })

    it('correctly encodes and decodes circular data containing binary', () => {
      const encoder = new parser.Encoder()

      const circularObj = {
        foo: {},
        bin: Buffer.from('abc', 'utf8'),
      }

      // @ts-expect-error
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

      return new Promise<void>((resolve) => {
        decoder.on('decoded', (packet) => {
          obj.data = originalData
          // @ts-expect-error
          obj.attachments = undefined
          expect(packet.data[1] === packet.data[1].foo.circularObj).toBe(true)
          expect(packet).toEqual(obj)
          resolve()
        })

        for (let i = 0; i < encodedPackets.length; i++) {
          decoder.add(encodedPackets[i])
        }
      })
    })

    it('correctly encodes and decodes binary data with objs with no prototype', () => {
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

      return new Promise<void>((resolve) => {
        decoder.on('decoded', (packet) => {
          obj.data = originalData
          // @ts-expect-error
          obj.attachments = undefined
          expect(packet).toEqual(obj)
          resolve()
        })

        for (let i = 0; i < encodedPackets.length; i++) {
          decoder.add(encodedPackets[i])
        }
      })
    })
  })

  describe('hasBinary', () => {
    it('hasBinary handles binary data in toJSON()', () => {
      const x = {
        toJSON () {
          return Buffer.from('123', 'utf8')
        },
      }

      const data = ['a', x]

      expect(hasBinary(data)).toBe(true)
    })
  })
})
