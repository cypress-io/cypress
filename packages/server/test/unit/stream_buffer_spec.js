const { describe, it } = require('mocha')
const { expect } = require('chai')
const fs = require('fs')
const streamBuffer = require('../../lib/util/stream_buffer')
const stream = require('stream')

function drain (stream) {
  let buf = ''
  let chunk

  while ((chunk = stream.read())) {
    buf += chunk
  }

  return buf
}

describe('lib/util/stream_buffer', function () {
  it('reads out no matter when we write', function () {
    const pt = stream.PassThrough()
    const sb = streamBuffer.streamBuffer()

    pt.pipe(sb)
    pt.write('test')
    pt.write('test 2')

    const reader = sb.reader()

    let buf = drain(reader)

    expect(buf).to.eq('testtest 2')

    pt.write('test 3')

    buf += drain(reader)

    expect(buf).to.eq('testtest 2test 3')

    pt.write('test 4')

    const reader2 = sb.reader()

    let buf2 = drain(reader2)

    expect(buf2).to.eq('testtest 2test 3test 4')

    pt.write('test 5')

    buf += drain(reader)
    expect(buf).to.eq('testtest 2test 3test 4test 5')

    buf2 += drain(reader2)
    expect(buf2).to.eq('testtest 2test 3test 4test 5')
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

    sb.pipe(sb)

    sb.write('foo')
    sb.write('bar')

    expect(sb._finished()).to.be.false

    sb.end()
    expect(sb._finished()).to.be.true

    const reader = sb.reader()
    const buf = drain(reader)

    expect(buf).to.eq('foobar')

    const reader2 = sb.reader()
    const buf2 = drain(reader2)

    expect(buf2).to.eq('foobar')
  })

  it('can be piped into and then read from', function (done) {
    const expected = fs.readFileSync(__filename).toString()
    const rs = fs.createReadStream(__filename)
    const ws = fs.createWriteStream('/dev/null')
    const sb = streamBuffer.streamBuffer()

    rs.pipe(sb).pipe(ws)

    const reader = sb.reader()

    rs.on('end', () => {
      const buf = drain(reader)

      expect(buf).to.eq(expected)

      done()
    })
  })

})
