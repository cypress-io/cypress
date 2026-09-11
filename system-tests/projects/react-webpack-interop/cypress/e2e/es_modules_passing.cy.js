const foo = require('../../lib/foo')
const bar = require('../../lib/bar')
const dom = require('../../lib/dom')

describe('imports work', () => {
  it('foo js', () => {
    expect(foo()).to.eq('foo')
  })

  it('bar babel', () => {
    expect(bar()).to.eq('baz')
  })

  it('dom jsx', () => {
    expect(dom).to.eq('dom')
  })
})
