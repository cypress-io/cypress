require('../spec_helper')

const lazyStream = require('../../lib/util/lazy_stream')
const stream = require('stream')

describe('lib/util/lazy_stream', function () {
  it('reads out no matter when we write', function () {
    const pt = stream.PassThrough()
    const ls = lazyStream.lazyStream(`/tmp/test-${Number(new Date())}`, 16)

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

    // this will trigger a disk write
    pt.write('test 4')

    while ((chunk = reader.read())) {
      buf += chunk
    }

    expect(buf).to.eq('testtest 2test 3test 4')
  })
})
