const { describe, it } = require('mocha')
const { expect } = require('chai')
const streamBuffer = require('../../lib/util/stream_buffer')
const stream = require('stream')

describe('lib/util/stream_buffer', function () {
  it('reads out no matter when we write', function (done) {
    const pt = stream.PassThrough()
    const ls = streamBuffer.streamBuffer(`/tmp/test-${Number(new Date())}`, 22)

    pt.pipe(ls.bufferer)
    pt.write('test')
    pt.write('test 2')

    let chunk
    let buf = ''
    const reader = ls.reader()

    while ((chunk = reader.read())) {
      buf += chunk
    }

    expect(buf).to.eq('testtest 2')

    // this won't trigger a disk write
    pt.write('test 3')

    while ((chunk = reader.read())) {
      buf += chunk
    }

    expect(buf).to.eq('testtest 2test 3')

    pt.write('test 4')
    // this will trigger a disk write
    pt.write('test 5')

    setImmediate(() => {
      while ((chunk = reader.read()) || buf.length < 28) {
        buf += chunk || ''
      }

      expect(buf).to.eq('testtest 2test 3test 4test 5')
      done()
    })
  })
})
