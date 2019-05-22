require('../spec_helper')

const _ = require('lodash')
const fs = require('fs')
const stream = require('stream')
const Promise = require('bluebird')
const concatStream = require('concat-stream')
const { streamBuffer } = require('../../lib/util/stream_buffer')

function drain (stream) {
  return new Promise((resolve) => {
    return stream.pipe(concatStream((buf) => {
      resolve(buf.toString())
    }))
  })
}

describe('lib/util/stream_buffer', function () {
  it('reads out no matter when we write', function (done) {
    done = _.after(2, done)
    const pt = stream.PassThrough()
    const sb = streamBuffer.streamBuffer()

    pt.pipe(sb)
    pt.write('test')
    pt.write('test 2')

    const reader = sb.reader()

    reader.once('data', (data) => {
      let str = data.toString()

      expect(str).to.eq('testtest 2')

      pt.write('test 3')

      reader.once('data', (data2) => {
        str += data2.toString()

        expect(str).to.eq('testtest 2test 3')

        pt.write('test 4')

        const reader2 = sb.reader()

        reader.once('data', (data4) => {
          str += data4.toString()
          expect(str).to.eq('testtest 2test 3test 4')
        })

        reader2.once('data', (data3) => {
          let str2 = data3.toString()

          expect(str2).to.eq('testtest 2test 3test 4')

          pt.write('test 5')

          reader2.once('data', (data5) => {
            str2 += data5.toString()
            expect(str2).to.eq('testtest 2test 3test 4test 5')

            done()
          })

          reader.once('data', (data4) => {
            str += data4.toString()
            expect(str).to.eq('testtest 2test 3test 4test 5')

            done()
          })
        })
      })
    })
  })

  it('on overflow, enlarges the internal buffer by the smallest power of 2 that can fit the chunk', function () {
    const sb = streamBuffer.streamBuffer(64)

    sb.write('A'.repeat(65))

    expect(sb._buffer().length).to.eq(128)

    sb.write('A'.repeat(1024))

    expect(sb._buffer().length).to.eq(2048)

    const reader = sb.reader()
    const buf = drain(reader)

    expect(buf).to.eq('A'.repeat(1089))
  })

  it('finishes when buffer stream closes while still allowing data to be drained', function () {
    const sb = streamBuffer.streamBuffer()

    sb.write('foo')
    sb.write('bar')

    expect(sb._finished()).to.be.false

    sb.end(() => {
      expect(sb._finished()).to.be.true

      const reader = sb.reader()
      const buf = drain(reader)

      expect(buf).to.eq('foobar')

      const reader2 = sb.reader()
      const buf2 = drain(reader2)

      expect(buf2).to.eq('foobar')
    })
  })

  it('can be piped into and then read from', function (done) {
    const expected = fs.readFileSync(__filename).toString()
    const rs = fs.createReadStream(__filename)
    const sb = streamBuffer.streamBuffer()

    rs.pipe(sb)

    const reader = sb.reader()

    rs.on('end', () => {
      const buf = drain(reader)

      expect(buf).to.eq(expected)

      done()
    })
  })

  it('reader pipes do not end until the writer ends', function () {
    // reader.pipe(drain), don't end til writer ends
  })

  it.only('can handle a massive req body', function (done) {
    const size = 16 * 1024 // 16 kb
    const repeat = 3

    const body = Buffer.alloc(size, '!')
    const sb = streamBuffer.streamBuffer()

    const pt = new stream.PassThrough({
      highWaterMark: Number.MAX_SAFE_INTEGER,
    })

    pt.pipe(sb, { end: true })

    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))

    pt.on('end', () => {
      const reader = sb.reader()

      drain(reader)
      .then((buf) => {
        expect(buf.length).to.eq(body.length * repeat)

        expect(buf).to.eq(body.toString().repeat(repeat))
        done()
      })
    })

    pt.end()
  })

})
