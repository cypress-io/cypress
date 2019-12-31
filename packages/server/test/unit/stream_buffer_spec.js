require('../spec_helper')

const _ = require('lodash')
const fs = require('fs')
const stream = require('stream')
const Promise = require('bluebird')
const { concatStream } = require('@packages/network')
const { streamBuffer } = require('../../lib/util/stream_buffer')

function drain (stream) {
  return new Promise((resolve) => {
    return stream.pipe(concatStream((buf) => {
      resolve(buf.toString())
    }))
  })
}

describe('lib/util/stream_buffer', () => {
  it('reads out no matter when we write', function (done) {
    done = _.after(2, done)
    const pt = stream.PassThrough()
    const sb = streamBuffer()

    pt.pipe(sb)
    pt.write('1')
    pt.write(' 2')

    const tickWrite = (chunk) => {
      process.nextTick(() => {
        pt.write(chunk)
      })
    }

    const readable = sb.createReadStream()

    readable.once('data', (data2) => {
      expect(data2.toString()).to.eq('1 2')

      tickWrite(' 3')

      readable.once('data', (data3) => {
        expect(data3.toString()).to.eq(' 3')

        tickWrite(' 4')

        const readable2 = sb.createReadStream()

        readable.once('data', (data4) => {
          expect(data4.toString()).to.eq(' 4')
        })

        readable2.once('data', (data) => {
          expect(data.toString()).to.eq('1 2 3 4')

          tickWrite(' 5')

          readable2.once('data', (data5) => {
            expect(data5.toString()).to.eq(' 5')

            done()
          })

          readable.once('data', (data5) => {
            expect(data5.toString()).to.eq(' 5')

            done()
          })
        })
      })
    })
  })

  it('on overflow, enlarges the internal buffer by the smallest power of 2 that can fit the chunk', () => {
    const sb = streamBuffer(64)

    sb.write('A'.repeat(65))

    expect(sb._buffer().length).to.eq(128)

    sb.end('A'.repeat(1024))

    expect(sb._buffer().length).to.eq(2048)

    const readable = sb.createReadStream()

    return drain(readable)
    .then((buf) => {
      expect(buf).to.eq('A'.repeat(1089))
    })
  })

  it('finishes when buffer stream closes while still allowing data to be drained', (done) => {
    const sb = streamBuffer()

    sb.write('foo')
    sb.write('bar')

    expect(sb._finished()).to.be.false

    sb.end(() => {
      expect(sb._finished()).to.be.true

      const readable = sb.createReadStream()

      return drain(readable)
      .then((buf) => {
        expect(buf).to.eq('foobar')

        const readable2 = sb.createReadStream()

        return drain(readable2)
        .then((buf2) => {
          expect(buf2).to.eq('foobar')

          done()
        })
      })
    })
  })

  it('can be piped into and then read from', function (done) {
    const expected = fs.readFileSync(__filename).toString()
    const rs = fs.createReadStream(__filename)
    const sb = streamBuffer()

    rs.pipe(sb)

    const readable = sb.createReadStream()

    rs.on('end', () => {
      return drain(readable)
      .then((buf) => {
        expect(buf).to.eq(expected)

        done()
      })
    })
  })

  it('readable recursively pushes until it returns false', (done) => {
    const sb = streamBuffer()
    const readable = sb.createReadStream()
    const writeable = stream.Writable({
      final () {
        expect(readable.push).to.be.calledTwice
        expect(readable.push.firstCall).to.be.calledWith(buf)
        expect(readable.push.secondCall).to.be.calledWith(null)
        done()
      },
      write (chunk, enc, cb) {
        cb()
      },
    })

    sinon.spy(readable, 'push')

    readable.pipe(writeable)

    const size = 64 * 1024 // 64 kb
    const buf = Buffer.alloc(size, '!')

    sb.end(buf)
  })

  it('readable pipes do not end until the writeable ends', function (done) {
    const sb = streamBuffer()
    const readable = sb.createReadStream()
    const writeable = stream.Writable({
      final () {
        expect(sb.writable).to.be.false
        expect(sb._writableState).to.have.property('ended', true)
        done()
      },
      write (chunk, enc, cb) {
        process.nextTick(() => {
          if (sb.writable) {
            sb.end('asdf')
          }
        })

        cb()
      },
    })

    readable.pipe(writeable)

    const size = 64 * 1024 // 64 kb
    const buf = Buffer.alloc(size, '!')

    sb.write(buf)
  })

  it('can handle a massive req body', function (done) {
    const size = 16 * 1024 // 16 kb
    const repeat = 3

    const body = Buffer.alloc(size, '!')
    const sb = streamBuffer()

    const pt = new stream.PassThrough({
      highWaterMark: Number.MAX_SAFE_INTEGER,
    })

    pt.pipe(sb, { end: true })

    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))

    pt.on('end', () => {
      const readable = sb.createReadStream()

      drain(readable)
      .then((buf) => {
        expect(buf.length).to.eq(body.length * repeat)

        expect(buf).to.eq(body.toString().repeat(repeat))
        done()
      })
    })

    pt.end()
  })

  it('silently discards writes after it has been destroyed, with no consumers', function (done) {
    const sb = streamBuffer()

    sb.write('foo')
    sb.unpipeAll()
    sb.write('bar', done)
  })

  it('silently discards writes after it has been destroyed, with a consumer', function (done) {
    const sb = streamBuffer()
    const pt = stream.PassThrough()

    sb.createReadStream().pipe(pt)

    sb.write('foo')
    sb.unpipeAll()
    sb.write('bar', done)
  })
})
